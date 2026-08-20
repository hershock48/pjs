/**
 * Their mark, in two layers, so the man can move and the badge cannot.
 *
 * WHY IT IS TWO FILES. The first attempt animated `logo.svg` as one image, and
 * rotating it rotated the disc and both pieces of script lettering with him. It
 * read as a wobbling badge rather than a nod. So the file is split at the paths
 * that were already there:
 *
 *   logo-plate.svg    the disc, the inner field, the small ring and dot, and
 *                     the "Pastrami" and "Joe's" scripts. Never moves.
 *   logo-figure.svg   the man. His silhouette plus the thirty-three white
 *                     paths that draw his cap, glasses, beard and hands.
 *
 * NOT ONE COORDINATE CHANGED. Both files carry the original `viewBox` and the
 * original `<defs>`, and the elements are the original elements in the original
 * order, partitioned. Composited back together they are pixel-identical to
 * logo.svg: a 600px render diffs to a maximum channel difference of 1 and zero
 * pixels differing by more than 8. If you edit either file, redo that diff.
 *
 * WHY HE NODS AND DOES NOT WAVE. In their artwork the entire figure is a single
 * green path with fill-rule evenodd: head, cap, shoulders and both folded
 * forearms are one 3,998-character `d` string. There is no arm to raise. A wave
 * would mean drawing a new arm, which is redrawing part of a client's logo, and
 * that is their call rather than something to put in a deploy. So he leans, from
 * a pivot at the base of the folded arms, and settles back.
 *
 * `logo.svg` is still the file used for the favicon, the JSON-LD and anywhere
 * the mark is not animated. This component is only for the places it is.
 */
export default function Mark({ size = 46, className = "", alt = "" }) {
  return (
    <span className={`mark ${className}`} style={{ width: size, height: size }}>
      <img className="mark-plate" src="/assets/pjs/logo-plate.svg" width={size} height={size} alt={alt} />
      <img className="mark-figure" src="/assets/pjs/logo-figure.svg" width={size} height={size} alt="" aria-hidden="true" />
    </span>
  );
}
