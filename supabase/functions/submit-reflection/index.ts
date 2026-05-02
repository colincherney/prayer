import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ModerationResult =
  | { ok: true }
  | { ok: false; reason: string };

const MODERATION_SYSTEM_PROMPT = `You are a content moderator for Saint Central, an anonymous Christian prayer app. This text is a short note of encouragement being sent to someone who shared a prayer request. Lean permissive: when in doubt, allow.

ALLOW (do not block, even if uncomfortable):
- Sincere encouragement, scripture, declarations of faith
- Acknowledgement of grief, suffering, doubt, despair
- Gentle pushback or honesty (e.g. "I've felt that too")
- Strong emotional language; mentions of self-harm or addiction in a supportive context

BLOCK only:
- Hate speech targeting any group by identity (race, religion, sexuality, gender, nationality, etc.)
- Threats, harassment, or shaming directed at the recipient
- Explicit sexual content; ANY sexual content involving minors
- Specific methods or instructions for self-harm, suicide, or harming others
- Spam, advertising, recruiting (e.g. "join my church"), or content unrelated to encouragement
- Doxxing or private information about a third party

Respond with strict JSON only: {"allow": true} OR {"allow": false, "reason": "<one short phrase>"}.`;

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
  content?: string;
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
  const content = payload.content?.trim() ?? '';

  if (!prayerId) return json({ error: 'prayer_id_required' }, 400);
  if (!content) return json({ error: 'content_required' }, 400);
  if (content.length > 500) return json({ error: 'content_too_long' }, 400);

  let modResult;
  try {
    modResult = await moderate(content);
  } catch (e) {
    console.error('moderation failed', e);
    return json({ error: 'moderation_unavailable' }, 502);
  }

  if (!modResult.ok) {
    console.warn('moderation blocked:', modResult.reason, '— sample:', content.slice(0, 120));
    return json({ ok: false, reason: 'moderation_blocked' });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await admin
    .from('reflections')
    .insert({
      prayer_id: prayerId,
      user_id: user.id,
      content,
    })
    .select('id')
    .single();

  if (error) {
    console.error('insert failed', error);
    return json({ error: error.message }, 500);
  }

  return json({ ok: true, id: data.id });
});
