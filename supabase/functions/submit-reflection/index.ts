import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const PUSH_CHUNK = 100;

type ExpoMessage = {
  to: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  channelId?: string;
};

async function sendExpoPush(messages: ExpoMessage[]): Promise<{ invalidTokens: string[] }> {
  const invalidTokens: string[] = [];
  for (let i = 0; i < messages.length; i += PUSH_CHUNK) {
    const batch = messages.slice(i, i + PUSH_CHUNK);
    let res: Response;
    try {
      res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });
    } catch (e) {
      console.error('expo push fetch failed', e);
      continue;
    }
    if (!res.ok) {
      console.error('expo push error', res.status, await res.text());
      continue;
    }
    const json = await res.json().catch(() => null);
    const data: Array<{ status: string; details?: { error?: string } }> = Array.isArray(json?.data)
      ? json.data
      : [];
    data.forEach((ticket, idx) => {
      if (
        ticket.status === 'error' &&
        (ticket.details?.error === 'DeviceNotRegistered' ||
          ticket.details?.error === 'InvalidCredentials')
      ) {
        invalidTokens.push(batch[idx].to);
      }
    });
  }
  return { invalidTokens };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ModerationResult =
  | { ok: true }
  | { ok: false; reason: string };

const MODERATION_SYSTEM_PROMPT = `You are a content moderator for Saint Central, an anonymous Christian prayer app. The user is sending a short note of encouragement IN RESPONSE to someone else's prayer request. You will receive both the original prayer and the reply.

Evaluate the reply IN THE CONTEXT of the prayer it is responding to. Phrases that look harmless on their own may be harmful in context. For example: "please do" or "go ahead" or "do it" might be unremarkable in many contexts, but as a reply to "I want to hurt myself" they encourage self-harm and MUST be blocked.

ALLOW (do not block, even if uncomfortable):
- Sincere encouragement, scripture, declarations of faith, prayers
- Acknowledgement of grief, suffering, doubt, despair
- "I've been there too" / solidarity / shared witness
- Gentle, non-condemning honesty
- Mentions of self-harm or addiction in a clearly supportive direction
- Names of biblical figures, saints, or churches used in a devotional way ("Paul writes...", "St. Francis prayed...")
- The sender signing off with a bare first name or nickname ("Praying for you — Steve", "love, Maria") — a first name alone is fine

BLOCK:
- Anything that encourages, endorses, agrees with, dismisses, mocks, or makes light of self-harm, suicide, or violence — even subtly, even one or two words
- Hate speech targeting any group by identity (race, religion, sexuality, gender, nationality, etc.)
- Threats, harassment, mocking, or shaming directed at the prayer's writer
- Explicit sexual content; ANY sexual content involving minors
- Specific methods or instructions for self-harm, suicide, or harming others
- Spam, advertising, recruiting (e.g. "join my church"), or content unrelated to encouragement
- Doxxing or private information about a third party
- Anything that identifies a person beyond a bare first name: full names (first + surname), naming or guessing who the prayer's writer is, or any phone number, email, address, social handle, or other contact/identifying detail

Be especially strict about agreement with self-harm intent. If the prayer expresses any urge to self-harm and the reply could reasonably be read as agreement, encouragement, or invitation — block it.

Respond with strict JSON only: {"allow": true} OR {"allow": false, "reason": "<one short phrase>"}.`;

async function moderate(prayerBody: string, replyText: string): Promise<ModerationResult> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const userMessage = [
    'Original prayer request:',
    '"""',
    prayerBody,
    '"""',
    '',
    'Reply being submitted:',
    '"""',
    replyText,
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

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: prayerRow, error: prayerErr } = await admin
    .from('prayers')
    .select('body, user_id, title, group_id')
    .eq('id', prayerId)
    .maybeSingle();

  if (prayerErr) {
    console.error('prayer lookup failed', prayerErr);
    return json({ error: prayerErr.message }, 500);
  }
  if (!prayerRow) {
    return json({ error: 'prayer_not_found' }, 404);
  }

  // A note aimed at a group prayer only lands if the sender is currently a
  // member — same boundary submit-prayer enforces. Checked before moderation
  // so a private prayer's body never reaches the moderator or logs for an
  // outsider.
  if (prayerRow.group_id) {
    const { data: membership, error: memberErr } = await admin
      .from('group_members')
      .select('group_id')
      .eq('group_id', prayerRow.group_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (memberErr) {
      console.error('membership lookup failed', memberErr);
      return json({ error: memberErr.message }, 500);
    }
    if (!membership) {
      return json({ error: 'not_a_member' }, 403);
    }
  }

  let modResult;
  try {
    modResult = await moderate(prayerRow.body ?? '', content);
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
      '— reply:',
      content.slice(0, 80),
    );
    return json({ ok: false, reason: 'moderation_blocked' });
  }

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

  // Fire-and-forget: notify the prayer author of the new note (skip self).
  if (prayerRow.user_id && prayerRow.user_id !== user.id) {
    try {
      const { data: prefs } = await admin
        .from('notification_preferences')
        .select('comments_enabled')
        .eq('user_id', prayerRow.user_id)
        .maybeSingle();
      const enabled = prefs?.comments_enabled !== false; // default ON

      if (enabled) {
        const { data: tokens } = await admin
          .from('push_tokens')
          .select('token')
          .eq('user_id', prayerRow.user_id);

        if (tokens && tokens.length > 0) {
          const preview = content.slice(0, 100);
          const titleHint = (prayerRow.title ?? '').trim();
          const messages: ExpoMessage[] = tokens.map((t) => ({
            to: t.token,
            title: 'Someone left you encouragement',
            body: titleHint ? `On "${titleHint.slice(0, 60)}": ${preview}` : preview,
            sound: 'default',
            data: { type: 'reflection', prayer_id: prayerId, reflection_id: data.id },
            channelId: 'default',
          }));

          const { invalidTokens } = await sendExpoPush(messages);
          if (invalidTokens.length > 0) {
            await admin.from('push_tokens').delete().in('token', invalidTokens);
          }
        }
      }
    } catch (e) {
      console.error('comment push failed (non-fatal)', e);
    }
  }

  return json({ ok: true, id: data.id });
});
