export function notificationDestination(data: Record<string, unknown> = {}) {
  if (data.type === 'group_prayer' && typeof data.group_id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.group_id)) {
    return { pathname: '/group/[id]' as const, params: { id: data.group_id } };
  }
  if (data.type === 'reflection' || data.type === 'social_proof' || data.type === 'prayer_reflection_reminder') {
    return '/myPrayers' as const;
  }
  if (data.type === 'daily_reminder') return '/' as const;
  return null;
}
