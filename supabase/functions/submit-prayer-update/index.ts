import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Kind = 'progress' | 'answered' | 'setback' | 'note';
type Visibility = 'public' | 'private';

const KINDS: readonly Kind[] = ['progress', 'answered', 'setback', 'note'];
const VISIBILITIES: readonly Visibility[] = ['public', 'private'];

type ModerationResult =
  | { ok: true }
  | { ok: false; reason: string };

const MODERATION_SYSTEM_PROMPT = `You are a content moderator for Saint Central, an anonymous Christian prayer app. The user is the AUTHOR of a prayer request and is posting an update on the journey — what's changed, whether the prayer was answered, a setback they hit, or a reflection. You will receive the original prayer and the new update.

Evaluate the update IN THE CONTEXT of the prayer it is updating. Lean permissive — these are real people sharing real progress, including hard news.

ALLOW (do not block, even if uncomfortable):
- Honest news of progress, breakthrough, healing, or answered prayer
- Honest news of setback, worsening, relapse, grief, or unanswered prayer
- Doubt, anger, frustration with God or the situation
- Mentions of self-harm, addiction, illness, or abuse in the writer's own life
- Praise, thanksgiving, scripture, declarations of faith
- Strong emotional language; occasional profanity in genuine distress

BLOCK only:
- Hate speech targeting any group by identity (race, religion, sexuality, gender, nationality, etc.)
- Specific methods or step-by-step instructions for self-harm, suicide, or harming others
- Credible threats of violence toward specific people
- Explicit sexual content; ANY sexual content involving minors
- Spam, advertising, recruiting, or content unrelated to the prayer journey
- Doxxing or private identifying information about a third party

Respond with strict JSON only: {"allow": true} OR {"allow": false, "reason": "<one short phrase>"}.`;

async function moderate(prayerBody: string, updateText: string): Promise<ModerationResult> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const userMessage = [
    'Original prayer request:',
    '"""',
    prayerBody,
    '"""',
    '',
    'Update being submitted by the author:',
    '"""',
    updateText,
    '"""',
  ].join('\n');

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
        { role: 'user', content: userMessage },
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

  let parsed: { allow?: boolean; reason?: string };
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Non-JSON moderation response: ${content}`);
  }

  if (parsed.allow === false) {
    return { ok: false, reason: parsed.reason ?? 'flagged' };
  }
  return { ok: true };
}

type Body = {
  prayer_id?: string;
  kind?: string;
  note?: string;
  visibility?: string;
  set_status?: boolean;
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

  const prayerId = payload.prayer_id;
  const note = payload.note?.trim() ?? '';
  const kind = payload.kind as Kind | undefined;
  const visibility = (payload.visibility ?? 'public') as Visibility;
  const setStatus = payload.set_status !== false;

  if (!prayerId) return json({ error: 'prayer_id_required' }, 400);
  if (!kind || !KINDS.includes(kind)) return json({ error: 'invalid_kind' }, 400);
  if (!VISIBILITIES.includes(visibility)) return json({ error: 'invalid_visibility' }, 400);
  if (!note) return json({ error: 'note_required' }, 400);
  if (note.length > 1000) return json({ error: 'note_too_long' }, 400);

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: prayerRow, error: prayerErr } = await admin
    .from('prayers')
    .select('id, body, user_id')
    .eq('id', prayerId)
    .maybeSingle();

  if (prayerErr) {
    console.error('prayer lookup failed', prayerErr);
    return json({ error: prayerErr.message }, 500);
  }
  if (!prayerRow) return json({ error: 'prayer_not_found' }, 404);
  if (prayerRow.user_id !== user.id) return json({ error: 'forbidden' }, 403);

  let modResult;
  try {
    modResult = await moderate(prayerRow.body ?? '', note);
  } catch (e) {
    console.error('moderation failed', e);
    return json({ error: 'moderation_unavailable' }, 502);
  }

  if (!modResult.ok) {
    console.warn(
      'moderation blocked:',
      modResult.reason,
      '— prayer:',
      (prayerRow.body ?? '').slice(0, 80),
      '— update:',
      note.slice(0, 80),
    );
    return json({ ok: false, reason: 'moderation_blocked' });
  }

  const { data: inserted, error: insertErr } = await admin
    .from('prayer_updates')
    .insert({
      prayer_id: prayerId,
      user_id: user.id,
      kind,
      note,
      visibility,
    })
    .select('id')
    .single();

  if (insertErr) {
    console.error('insert failed', insertErr);
    return json({ error: insertErr.message }, 500);
  }

  // Reflect non-"note" kinds onto the prayer's current status so the card can
  // show an at-a-glance badge. Plain "note" entries leave status untouched.
  if (setStatus && kind !== 'note') {
    const { error: statusErr } = await admin
      .from('prayers')
      .update({ status: kind, updated_at: new Date().toISOString() })
      .eq('id', prayerId);
    if (statusErr) console.error('status update failed', statusErr);
  }

  return json({ ok: true, id: inserted.id });
});
