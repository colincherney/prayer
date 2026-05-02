import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Sensitive = 'self-harm';

type ModerationResult =
  | { ok: true; sensitive?: Sensitive }
  | { ok: false; reason: string };

const MODERATION_SYSTEM_PROMPT = `You are a content moderator for Saint Central, an anonymous Christian prayer app. People share short prayer intentions here that another anonymous user will read and pray over for two minutes. Lean permissive: when in doubt, allow.

ALLOW (do not block, even if uncomfortable):
- Grief, despair, doubt, anger toward God, hopelessness
- Suicidal thoughts, urges to self-harm, addiction struggles
- Mentions of abuse, illness, or violence the person has experienced or witnessed
- Confessions of sin, sexual struggles, marital problems
- Strong emotional language; occasional profanity in genuine distress
- Uncertain faith, deconstruction, frustration with the church

BLOCK only the following:
- Hate speech targeting any group by identity (race, religion, sexuality, gender, nationality, etc.)
- Credible threats of violence toward specific people
- Explicit sexual content; ANY sexual content involving minors
- Specific methods or step-by-step instructions for suicide, self-harm, or harming others
- Spam, advertising, scams, or content unrelated to prayer
- Doxxing or private identifying information about a third party

Additionally, if the content suggests the writer may be in active personal crisis — current suicidal ideation, urges to self-harm right now, a plan to end their life, or being actively harmed — set "sensitive": "self-harm" so the app can offer crisis resources. Do NOT set sensitive for general grief, sadness, doubt, or past struggles that are not active.

Respond with strict JSON only:
- {"allow": true}
- {"allow": true, "sensitive": "self-harm"}
- {"allow": false, "reason": "<one short phrase>"}`;

async function moderate(text: string): Promise<ModerationResult> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 80,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: MODERATION_SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Moderation API failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty moderation response');

  let parsed: { allow?: boolean; reason?: string; sensitive?: string };
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Non-JSON moderation response: ${content}`);
  }

  if (parsed.allow === false) {
    return { ok: false, reason: parsed.reason ?? 'flagged' };
  }
  return {
    ok: true,
    sensitive: parsed.sensitive === 'self-harm' ? 'self-harm' : undefined,
  };
}

// Seed intents used only when the pool is empty (e.g. brand-new install with no
// other users yet). Real partner intents always take priority.
const SEED_INTENTS = [
  'Carrying my father — his health, his fear, his stubborn faith. Lord meet him where he is.',
  "I'm tired and I don't know if I still believe. Pray that God meets me anyway.",
  'For my marriage. We are barely speaking. I want to choose grace.',
  "My friend is in the hospital. I can't be there. Please pray with me for peace.",
  'I keep failing the same sin. Pray that I find the strength to walk away from it.',
  'For my mom. She is lonely and afraid. Pray she feels held tonight.',
];

type Body = {
  body?: string;
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'unauthorized' }, 401);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'server_misconfigured' }, 500);
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: 'unauthorized' }, 401);
  const user = userData.user;

  let payload: Body;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const body = payload.body?.trim() ?? '';
  if (!body) return json({ error: 'body_required' }, 400);
  if (body.length > 500) return json({ error: 'body_too_long' }, 400);

  let modResult;
  try {
    modResult = await moderate(body);
  } catch (e) {
    console.error('moderation failed', e);
    return json({ error: 'moderation_unavailable' }, 502);
  }

  if (!modResult.ok) {
    console.warn('moderation blocked:', modResult.reason, '— sample:', body.slice(0, 120));
    return json({ ok: false, reason: 'moderation_blocked' });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Insert this user's intent into the pool first so it can be matched to the
  // next person who arrives.
  const { data: inserted, error: insertErr } = await admin
    .from('pair_intents')
    .insert({ user_id: user.id, body, approved: true })
    .select('id')
    .single();

  if (insertErr) {
    console.error('insert failed', insertErr);
    return json({ error: insertErr.message }, 500);
  }

  // Pull candidate IDs from other users + the IDs this user has already been
  // matched with, in parallel. Filter the diff in JS, then fetch one row by id.
  // UUIDs are tiny so transferring all candidate IDs scales fine (a few hundred
  // KB even at tens of thousands of rows).
  const [candidatesRes, seenRes] = await Promise.all([
    admin
      .from('pair_intents')
      .select('id')
      .eq('approved', true)
      .neq('user_id', user.id),
    admin
      .from('pair_matches')
      .select('pair_intent_id')
      .eq('user_id', user.id),
  ]);

  if (candidatesRes.error) {
    console.error('candidate query failed', candidatesRes.error);
    return json({ error: candidatesRes.error.message }, 500);
  }
  if (seenRes.error) {
    console.error('seen query failed', seenRes.error);
    return json({ error: seenRes.error.message }, 500);
  }

  const seenSet = new Set(
    (seenRes.data ?? []).map((r: { pair_intent_id: string }) => r.pair_intent_id),
  );
  const eligibleIds = (candidatesRes.data ?? [])
    .map((r: { id: string }) => r.id)
    .filter(id => !seenSet.has(id));

  let partner: { id: string | null; body: string; created_at: string | null };

  if (eligibleIds.length > 0) {
    const pickedId = eligibleIds[Math.floor(Math.random() * eligibleIds.length)];
    const { data: row, error: rowErr } = await admin
      .from('pair_intents')
      .select('id, body, created_at')
      .eq('id', pickedId)
      .maybeSingle();

    if (rowErr) {
      console.error('pick fetch failed', rowErr);
      return json({ error: rowErr.message }, 500);
    }

    if (row) {
      partner = {
        id: row.id as string,
        body: row.body as string,
        created_at: row.created_at as string,
      };

      // Record the match so we don't show this intent to this user again.
      // Unique constraint on (user_id, pair_intent_id) makes this idempotent.
      const { error: matchErr } = await admin
        .from('pair_matches')
        .insert({ user_id: user.id, pair_intent_id: pickedId });
      if (matchErr) {
        // Non-fatal: log and continue. The user still gets paired this round;
        // worst case they see this intent again next time.
        console.error('pair_matches insert failed', matchErr);
      }
    } else {
      // Race: row was deleted between queries. Fall back to seed.
      const seed = SEED_INTENTS[Math.floor(Math.random() * SEED_INTENTS.length)];
      partner = { id: null, body: seed, created_at: null };
    }
  } else {
    // Either the pool is empty, or this user has seen everyone. Fall back to
    // a seed intent so the flow never dead-ends.
    const seed = SEED_INTENTS[Math.floor(Math.random() * SEED_INTENTS.length)];
    partner = { id: null, body: seed, created_at: null };
  }

  return json({
    ok: true,
    id: inserted.id,
    sensitive: modResult.sensitive,
    partner,
  });
});
