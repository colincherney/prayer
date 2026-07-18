import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ModerationResult = { ok: true } | { ok: false; reason: string };

const MODERATION_SYSTEM_PROMPT = `You are a content moderator for Saint Central, an anonymous Christian prayer app. You are reviewing a new prayer group. The input is labelled NAME and (sometimes) DESCRIPTION. Apply DIFFERENT strictness to each part.

NAME — be lenient. Default to ALLOW unless it is clearly harmful.
ALLOW, for example:
- Plain or generic names ("Church Group", "Prayer Circle", "Bible Study", "Youth Group")
- Church, parish, denominational, ministry, saint, biblical, or place names ("St. Mary's", "First Baptist", "Eastside Campus")
- A first name or nickname, including possessive form — the creator naming the group after themselves is fine ("Armond's Group", "Dave's Bible Study", "Team Mike")
BLOCK a NAME only if it:
- Is mean-spirited — mocks, targets, or gossips about a person ("Steve Is Broke Club", "Praying Jessica Fails")
- Identifies a person beyond a first name or nickname: full name (first + surname), phone number, address, email, social handle, or any other contact or identifying detail
- Contains hate speech, explicit sexual content, crude profanity, credible threats of violence, or spam/advertising

DESCRIPTION — be strict. The app is anonymous.
ALLOW plain, generic descriptions ("church group", "our weekly prayer circle").
BLOCK the DESCRIPTION if it contains:
- Any personal name (even a first name alone) or anything else that could identify an individual
- Contact details, meeting addresses, phone numbers, emails, links, or social handles
- Targeting, mocking, or gossip about any individual
- Hate speech, explicit sexual content, crude profanity, credible threats of violence
- Spam, advertising, or content clearly unrelated to prayer or Christian fellowship

When in doubt about the NAME, allow it. When in doubt about the DESCRIPTION, block it.

Respond with strict JSON only:
- {"allow": true}
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
  name?: string;
  description?: string | null;
  is_public?: boolean;
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
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return json({ error: 'server_misconfigured' }, 500);
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: 'unauthorized' }, 401);

  let payload: Body;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const name = payload.name?.trim() ?? '';
  const description = payload.description?.toString().trim() || null;
  const isPublic = payload.is_public === true;

  if (name.length < 3 || name.length > 60) return json({ error: 'invalid_name' }, 400);
  if (description && description.length > 240) {
    return json({ error: 'description_too_long' }, 400);
  }

  let modResult;
  try {
    modResult = await moderate(
      description ? `NAME: ${name}\nDESCRIPTION: ${description}` : `NAME: ${name}`,
    );
  } catch (e) {
    console.error('moderation failed', e);
    return json({ error: 'moderation_unavailable' }, 502);
  }

  if (!modResult.ok) {
    console.warn('group moderation blocked:', modResult.reason, '— name:', name);
    return json({ ok: false, reason: 'moderation_blocked' });
  }

  // The create_group RPC runs as the caller (auth.uid()), so ownership and
  // invite-code generation stay entirely server-side in the database.
  const { data, error } = await userClient.rpc('create_group', {
    p_name: name,
    p_description: description,
    p_is_public: isPublic,
  });

  if (error) {
    console.error('create_group failed', error);
    return json({ error: error.message }, 500);
  }

  const row = Array.isArray(data) ? data[0] : data;
  return json({ ok: true, id: row.id, invite_code: row.invite_code ?? null });
});
