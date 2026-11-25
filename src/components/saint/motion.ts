import { Easing, FadeIn, FadeInDown } from 'react-native-reanimated';

/**
 * The app's motion vocabulary. Every UI animation should pull its curve and timing from here so the whole app moves
 * the same way: quick to respond, soft to land.
 */

/** Entering, exiting, and anything reacting to a touch: starts fast, settles gently. */
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
/** Something already on screen moving to a new place. */
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);
/** Sheets and drawers sliding over the page, the iOS way. */
export const EASE_DRAWER = Easing.bezier(0.32, 0.72, 0, 1);

export const DURATION = {
  /** Press-in feedback. */
  press: 120,
  /** Small things: chips, badges, a fade between two labels. */
  quick: 180,
  /** Cards and content entering. */
  enter: 280,
  /** Sheets opening. */
  sheet: 380,
} as const;

/** Release after a press: springs back without a wobble. */
export const SPRING_RELEASE = { damping: 16, stiffness: 320, mass: 0.7 } as const;
/** A thumb or indicator gliding to its new spot. */
export const SPRING_SNAP = { damping: 22, stiffness: 260, mass: 0.8 } as const;
/** A playful landing (a pet hopping, a keepsake jumping): one soft settle, no ping-pong. */
export const SPRING_LAND = { damping: 11, stiffness: 240, mass: 0.7 } as const;

/** Fade-up entrance for the i-th card in a list: a short, capped stagger that never holds up a tap. */
export const enterUp = (i = 0) =>
  FadeInDown.duration(DURATION.enter)
    .easing(EASE_OUT)
    .delay(Math.min(i, 6) * 40);

/** A plain fade for content swapping in place. */
export const enterFade = (duration: number = DURATION.quick) => FadeIn.duration(duration).easing(EASE_OUT);
