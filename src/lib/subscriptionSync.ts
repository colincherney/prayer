import { supabase } from './supabase';

// Coalesce refreshes from multiple mounted screens without caching a purchase
// result across accounts or retaining inactive state after a new purchase.
const requests = new Map<string, Promise<void>>();
export function syncSubscription(userId: string): Promise<void> {
  const pending = requests.get(userId);
  if (pending) return pending;
  const request = (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.id !== userId || session.user.is_anonymous) return;
    const { error } = await supabase.functions.invoke('revenuecat-subscription-sync', { body: {} });
    if (error) throw error;
  })().finally(() => { requests.delete(userId); });
  requests.set(userId, request);
  return request;
}
