export type PrayerPushMessage = {
  key: string;
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  sound: 'default';
  channelId: 'default';
};

// A successful ticket means Expo accepted the message. Only purge
// DeviceNotRegistered; InvalidCredentials is a server configuration problem.
export async function sendPrayerPushes(messages: PrayerPushMessage[]) {
  const accepted = new Set<string>();
  const invalidTokens = new Set<string>();
  const receipts: { ticket_id: string; token: string }[] = [];
  for (let offset = 0; offset < messages.length; offset += 100) {
    const batch = messages.slice(offset, offset + 100);
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(batch.map(({ key: _key, ...message }) => message)),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        console.error('Prayer push service failed', response.status);
        continue;
      }
      const result = await response.json();
      const tickets = Array.isArray(result?.data) ? result.data : [];
      batch.forEach((message, index) => {
        const ticket = tickets[index];
        if (ticket?.status === 'ok') {
          accepted.add(message.key);
          if (typeof ticket.id === 'string') receipts.push({ ticket_id: ticket.id, token: message.to });
        } else if (ticket?.details?.error === 'DeviceNotRegistered') {
          invalidTokens.add(message.to);
        } else {
          console.error('Prayer push ticket failed', ticket?.details?.error ?? 'missing_ticket');
        }
      });
    } catch (error) {
      console.error('Prayer push request failed', error);
    }
  }
  return { accepted, invalidTokens: [...invalidTokens], receipts };
}

export async function readPrayerPushReceipts(ids: string[]) {
  const checked: string[] = [];
  const invalid: string[] = [];
  if (!ids.length) return { checked, invalid };
  const response = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Receipt lookup failed: ${response.status}`);
  const result = await response.json();
  for (const id of ids) {
    const receipt = result?.data?.[id];
    if (!receipt) continue;
    checked.push(id);
    if (receipt.status === 'error') {
      if (receipt.details?.error === 'DeviceNotRegistered') invalid.push(id);
      else console.error('Prayer push delivery failed', receipt.details?.error ?? 'unknown_error');
    }
  }
  return { checked, invalid };
}
