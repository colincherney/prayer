// "Claim before it leaves": when a seasonal or legendary companion that isn't yours yet stops being claimable.
// Seasonal companions (the Pumpkin, the Turkey, Noel) can be claimed until their window in public.content_windows
// closes; legendary companions (event exclusives) only while their event runs. Once you have one it's yours for good,
// so there's no note.

import { companionGroup } from '@/components/pets/companionInfo';
import { PetId } from '@/components/pets/registry';
import { useReleases } from '@/lib/releases';
import { addDays, eventDayFor, PAL_EVENTS, phaseFor, shortDate, useEvents } from '@/lib/winterEvent';

export type ClaimNote = {
  /** For a card: "Claim by Jan 6", "Until Jan 31". */
  short: string;
  /** For the companion page: a full sentence. */
  long: string;
};

/** Returns the note for a companion, or null (yours already, not out yet, in the vault, or not seasonal at all). */
export function useClaimNotes(owned: ReadonlySet<PetId>): (id: PetId) => ClaimNote | null {
  const { claimCloses } = useReleases();
  const { states, today } = useEvents();
  return (id: PetId) => {
    if (owned.has(id)) return null;
    const group = companionGroup(id);
    if (group === 'legendary') {
      const eventId = PAL_EVENTS[id];
      const ev = eventId ? states[eventId] : null;
      if (!ev || !ev.event.is_active || phaseFor(ev.event, today) !== 'live') return null;
      const until = shortDate(ev.event.ends_on);
      return {
        short: `Until ${until}`,
        long: `Event exclusive: earn it during ${ev.event.title}, which ends ${until}. After that it's gone.`,
      };
    }
    if (group === 'seasonal') {
      const closes = claimCloses(`pet:${id}`);
      if (!closes) return null;
      // Windows close at midnight US Eastern, so the last day to claim is the day before.
      const lastDay = shortDate(addDays(eventDayFor(closes, 'America/New_York'), -1));
      return {
        short: `Claim by ${lastDay}`,
        long: `Claim it before it leaves: it's here until ${lastDay}, then it goes into the vault until next season.`,
      };
    }
    return null;
  };
}

/** The note under a section heading in Prayer Pals. */
export function sectionClaimNote(group: string, notes: (id: PetId) => ClaimNote | null, ids: PetId[]): string | null {
  const first = ids.map(notes).find(Boolean);
  if (!first) return null;
  if (group === 'seasonal') return `Claim before they leave · ${first.short.replace('Claim by', 'until')}`;
  if (group === 'legendary') return 'Only while their event runs · then gone';
  return null;
}
