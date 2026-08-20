"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Reveal-on-scroll, mounted in the root layout.
 *
 * It re-arms on every navigation. Queried once on mount, it hides the next
 * page's elements forever, so every internal link lands on a blank page while
 * the URL and the nav highlight both change correctly. That is the single
 * nastiest bug in this pattern and the reason `path` is a dependency here.
 *
 * The `js` class is added by this effect, so with JavaScript off nothing is
 * ever hidden and the page arrives complete.
 */
export default function Reveal() {
  const path = usePathname();

  useEffect(() => {
    document.documentElement.classList.add("js");
    const els = Array.from(document.querySelectorAll(".reveal"));
    if (!els.length) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -48px 0px" }
    );

    // Anything already on screen at mount is shown immediately rather than
    // waiting for a scroll that may never come on a short page.
    els.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in");
      else io.observe(el);
    });

    return () => io.disconnect();
  }, [path]);

  return null;
}
