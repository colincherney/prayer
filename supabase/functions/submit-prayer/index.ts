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

const MODERATION_SYSTEM_PROMPT = `You are a content moderator for Saint Central, an anonymous Christian prayer app. People share prayer requests and notes of encouragement here — often during the lowest moments of their lives. Lean permissive: when in doubt, allow.

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
- Naming a private individual — any first name, surname, nickname, initials-plus-context, or social handle that identifies a real person the writer knows (e.g. "pray for Steve, he's broke", "Jessica M. is cheating"). This app is anonymous; prayers must refer to people as "my friend", "my brother", "a coworker", etc. EXCEPTIONS that are always allowed: names of God, Jesus, Mary, saints, angels, biblical figures, clergy titles without surnames ("my pastor"), and well-known public figures prayed for in good faith.

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

type Body = {
  body?: string;
  title?: string;
  category?: string | null;
  group_id?: string | null;
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
  const title = payload.title?.trim().slice(0, 200) ?? '';
  const category = payload.category?.toString().trim() || null;
  const groupId = payload.group_id?.toString().trim() || null;

  if (!body) return json({ error: 'body_required' }, 400);
  if (body.length > 2000) return json({ error: 'body_too_long' }, 400);

  let modResult;
  try {
    modResult = await moderate(`${title}\n\n${body}`);
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

  // A prayer aimed at a group only lands if the sender is a member.
  if (groupId) {
    const { data: membership, error: memberErr } = await admin
      .from('group_members')
      .select('group_id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (memberErr) {
      console.error('membership check failed', memberErr);
      return json({ error: memberErr.message }, 500);
    }
    if (!membership) return json({ error: 'not_a_member' }, 403);
  }

  const { data, error } = await admin
    .from('prayers')
    .insert({
      user_id: user.id,
      title,
      body,
      category,
      approved: 'y',
      group_id: groupId,
    })
    .select('id')
    .single();

  if (error) {
    console.error('insert failed', error);
    return json({ error: error.message }, 500);
  }

  // Seed synthetic engagement schedule. Each prayer gets a "popularity" target
  // sampled uniformly in [MIN_TOTAL, MAX_TOTAL]; that many rows are scattered
  // randomly across the 6h window. A pg_cron job drains rows whose due_at passes.
  // Group prayers are exempt — inside a circle the candle count must be real.
  if (groupId) {
    return json({ ok: true, id: data.id, sensitive: modResult.sensitive });
  }
  const WINDOW_MS = 6 * 60 * 60 * 1000;
  const MIN_TOTAL = 16;
  const MAX_TOTAL = 97;
  const target = MIN_TOTAL + Math.floor(Math.random() * (MAX_TOTAL - MIN_TOTAL + 1));
  const startMs = Date.now();
  const scheduleRows: { prayer_id: string; due_at: string }[] = [];
  for (let i = 0; i < target; i++) {
    // Triangular distribution peaked at 0.5 of the window: slow start, mid-window peak, taper.
    const t = (Math.random() + Math.random()) / 2;
    const dueAt = new Date(startMs + Math.floor(t * WINDOW_MS));
    scheduleRows.push({ prayer_id: data.id, due_at: dueAt.toISOString() });
  }
  if (scheduleRows.length > 0) {
    const { error: schedErr } = await admin
      .from('prayer_interaction_schedule')
      .insert(scheduleRows);
    if (schedErr) {
      // Non-fatal: prayer is already posted. Log and continue.
      console.error('schedule seed failed', schedErr);
    }
  }

  return json({ ok: true, id: data.id, sensitive: modResult.sensitive });
});
