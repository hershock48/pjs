/**
 * Three wisps of steam off the headline, once, on load.
 *
 * It plays exactly once and ends. No loop, no hover, no replay on scroll. A
 * loop would put permanent motion beside the one line on the site that has to
 * be read first, and the joke stops being funny the second time anyone sees it.
 *
 * WHY IT IS DRAWN AND NOT ANIMATED FROM A PATH LIBRARY: three `<path>` elements
 * and a keyframe each. The wisps have different lengths, delays and drifts, and
 * that desynchronisation is the whole effect. Three things rising on the same
 * schedule reads as a slide transition; three on schedules 200-300ms apart
 * reads as weather.
 *
 * It is `aria-hidden` and `pointer-events: none`. It sits above the headline in
 * z-order but it is not in the accessibility tree, it cannot be clicked, and it
 * takes no space, so it cannot move the h1 or the scrim measurement under it.
 *
 * Suppressed entirely under `prefers-reduced-motion`. Not shortened: a puff of
 * steam that appears and vanishes instantly is worse than no steam.
 */
export default function Steam() {
  return (
    <span className="steam" aria-hidden="true">
      <svg viewBox="0 0 120 58" width="120" height="58" focusable="false">
        {/* Three curls, hand-drawn rather than generated, so they are uneven in
            the way real steam is. Stroke, not fill: a filled wisp reads as a
            cloud and a stroked one reads as vapour. */}
        <path className="w1" d="M18 54 C 11 43, 26 37, 19 25 C 14 16, 25 11, 21 3" />
        <path className="w2" d="M58 56 C 50 44, 67 38, 59 27 C 53 18, 65 12, 61 2" />
        <path className="w3" d="M96 54 C 90 44, 104 38, 97 28 C 92 20, 102 15, 99 6" />
      </svg>
    </span>
  );
}
