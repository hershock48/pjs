/**
 * Steam off the headline. Once, on load, then gone.
 *
 * HOW IT IS MADE, because "draw steam" has an obvious wrong answer.
 *
 * The first version was three stroked bezier squiggles. It read as three
 * squiggles. Real vapour has no outline: it is a soft mass with an irregular
 * edge that thins as it rises, and the thing that makes it look real is that
 * the edge is noisy rather than smooth.
 *
 * So each plume here is a soft blurred blob pushed through
 * `feTurbulence` -> `feDisplacementMap`. The turbulence generates fractal noise
 * and the displacement map uses that noise to shove the blob's pixels sideways
 * by a varying amount, which tears its smooth edge into wisps. Then a second
 * blur softens what the displacement left behind. That is the standard smoke
 * recipe and it costs one filter per plume, running once.
 *
 * Each plume gets its own filter with its own `seed`, because two plumes
 * sharing a seed are the same shape twice and the eye catches it immediately.
 *
 * THE IDS ARE PREFIXED AND UNIQUE. `steam-turb-1` and friends. The house log
 * has a bug where two instances of one component shared a filter id and painted
 * a dark square; this component renders once per page today, and the prefix is
 * what stops that being a landmine if it ever renders twice.
 *
 * `aria-hidden`, `pointer-events: none`, and it takes no layout space, so it
 * cannot move the headline or change the scrim contrast measured underneath it.
 * Suppressed entirely under `prefers-reduced-motion`.
 */

/*
 * Tuned against renders, not guessed. The first pass used stdDeviation 5-6.5 on
 * a 156-unit viewBox and a peak opacity of 0.38, and the result was invisible:
 * that much blur spreads white thin enough that at a third opacity, over a dark
 * green scrim, there is nothing left to see. Less blur, more opacity, and a
 * displacement scale that tears the edge without shattering the whole shape.
 */
const PLUMES = [
  { id: 1, cx: 40, seed: 3, freq: "0.012 0.03", scale: 34, blur: 4.5, rx: 17, ry: 54 },
  { id: 2, cx: 80, seed: 11, freq: "0.014 0.036", scale: 40, blur: 5.5, rx: 20, ry: 62 },
  { id: 3, cx: 118, seed: 7, freq: "0.011 0.028", scale: 30, blur: 4, rx: 15, ry: 48 },
];

export default function Steam() {
  return (
    <span className="steam" aria-hidden="true">
      <svg viewBox="0 0 160 150" width="160" height="150" focusable="false">
        <defs>
          {PLUMES.map((p) => (
            <filter
              key={p.id}
              id={`steam-f-${p.id}`}
              x="-80%"
              y="-30%"
              width="260%"
              height="180%"
              colorInterpolationFilters="sRGB"
            >
              {/* fractalNoise rather than turbulence: turbulence is spikier and
                  reads as flame. numOctaves 3 is the point where it stops
                  looking like a pattern and starts looking like vapour. */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency={p.freq}
                numOctaves="3"
                seed={p.seed}
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={p.scale}
                xChannelSelector="R"
                yChannelSelector="G"
                result="warped"
              />
              {/* Softens the torn edge the displacement leaves. Without it the
                  wisps have visible pixel-level chatter along their boundary. */}
              <feGaussianBlur in="warped" stdDeviation={p.blur} />
            </filter>
          ))}
        </defs>

        {PLUMES.map((p) => (
          <g key={p.id} className={`plume p${p.id}`}>
            {/* A tall soft column, not a circle: the displacement needs
                something with vertical extent to tear into a rising wisp. */}
            <ellipse
              cx={p.cx}
              cy="92"
              rx={p.rx}
              ry={p.ry}
              fill="#fff"
              filter={`url(#steam-f-${p.id})`}
            />
          </g>
        ))}
      </svg>
    </span>
  );
}
