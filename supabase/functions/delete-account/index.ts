import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
  const userId = userData.user.id;

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Manually scrub the user's data so this works regardless of whether each
  // table's user_id FK was created with ON DELETE CASCADE. We delete in
  // dependency order: rows that reference prayers first, then prayers, etc.

  // 1. Reflections the user authored.
  {
    const { error } = await admin.from('reflections').delete().eq('user_id', userId);
    if (error) {
      console.error('delete reflections (mine) failed', error);
      return json({ error: error.message }, 500);
    }
  }
  // 2. Prayer interactions the user authored.
  {
    const { error } = await admin
      .from('prayer_interactions')
      .delete()
      .eq('user_id', userId);
    if (error) {
      console.error('delete interactions (mine) failed', error);
      return json({ error: error.message }, 500);
    }
  }
  // 3. Reflections + interactions on the user's own prayers (from other users).
  {
    const { data: myPrayers, error } = await admin
      .from('prayers')
      .select('id')
      .eq('user_id', userId);
    if (error) {
      console.error('list own prayers failed', error);
      return json({ error: error.message }, 500);
    }
    const prayerIds = (myPrayers ?? []).map((p: { id: string }) => p.id);
    if (prayerIds.length > 0) {
      const { error: refErr } = await admin
        .from('reflections')
        .delete()
        .in('prayer_id', prayerIds);
      if (refErr) {
        console.error('delete reflections (on mine) failed', refErr);
        return json({ error: refErr.message }, 500);
      }
      const { error: intErr } = await admin
        .from('prayer_interactions')
        .delete()
        .in('prayer_id', prayerIds);
      if (intErr) {
        console.error('delete interactions (on mine) failed', intErr);
        return json({ error: intErr.message }, 500);
      }
    }
  }
  // 4. The user's prayers.
  {
    const { error } = await admin.from('prayers').delete().eq('user_id', userId);
    if (error) {
      console.error('delete prayers failed', error);
      return json({ error: error.message }, 500);
    }
  }
  // 5. Pair matches: ones where the user is the viewer, AND ones pointing at
  //    the user's own pair intents (so the FK to pair_intents stays clean).
  {
    const { error: viewerErr } = await admin
      .from('pair_matches')
      .delete()
      .eq('user_id', userId);
    if (viewerErr) {
      console.error('delete pair_matches (viewer) failed', viewerErr);
      return json({ error: viewerErr.message }, 500);
    }
    const { data: myIntents, error: listErr } = await admin
      .from('pair_intents')
      .select('id')
      .eq('user_id', userId);
    if (listErr) {
      console.error('list own pair_intents failed', listErr);
      return json({ error: listErr.message }, 500);
    }
    const intentIds = (myIntents ?? []).map((p: { id: string }) => p.id);
    if (intentIds.length > 0) {
      const { error: pmErr } = await admin
        .from('pair_matches')
        .delete()
        .in('pair_intent_id', intentIds);
      if (pmErr) {
        console.error('delete pair_matches (target) failed', pmErr);
        return json({ error: pmErr.message }, 500);
      }
    }
  }
  // 6. The user's pair intents.
  {
    const { error } = await admin.from('pair_intents').delete().eq('user_id', userId);
    if (error) {
      console.error('delete pair_intents failed', error);
      return json({ error: error.message }, 500);
    }
  }
  // 7. The public.users profile row (FK back to auth.users.id). No-op if the
  //    row doesn't exist for this user.
  {
    const { error } = await admin.from('users').delete().eq('id', userId);
    if (error) {
      console.error('delete public.users failed', error);
      return json({ error: error.message }, 500);
    }
  }
  // 8. The auth user itself (drops any remaining session).
  {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      console.error('delete auth user failed', error);
      return json({ error: error.message }, 500);
    }
  }

  return json({ ok: true });
});
