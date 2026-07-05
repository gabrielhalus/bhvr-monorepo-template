import type { ReactNode } from "react";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import {
  createContext,

  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { Button } from "~orbit/components/ui/Button";
import { ChevronLeft, ChevronRight, X } from "~orbit/components/ui/icons";
import { Popover, PopoverAnchor, PopoverContent } from "~orbit/components/ui/Popover";
import { cn } from "~orbit/lib/utils";

/**
 * Tour — guided product walkthrough (coachmarks / spotlight).
 *
 * Dims the page, cuts a spotlight hole around a target element and anchors a
 * Radix Popover bubble to it. Pure CSS spotlight (one box-shadow), no extra
 * dependency. Steps target elements by CSS selector — tag them with
 * `data-tour="…"`.
 *
 *   <TourProvider>
 *     <Button data-tour="create">Nouveau projet</Button>
 *     <LaunchButton />          // calls useTour().start(steps)
 *   </TourProvider>
 */

export type TourStep = {
  /** CSS selector of the element to highlight, e.g. `[data-tour="create"]`. */
  target: string;
  title: string;
  body: ReactNode;
  /** Popover side relative to the target. Default `"bottom"`. */
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  /** Extra px around the target inside the spotlight. Default `8`. */
  padding?: number;
  /** Spotlight corner radius in px. Default `12`. */
  radius?: number;
  /** Let the user click the real target to advance (instead of "Suivant"). */
  interactive?: boolean;
};

type StartOptions = {
  /** Persist completion under this key so the tour only auto-runs once. */
  id?: string;
  /** Start at this step index. Default `0`. */
  startAt?: number;
};

type TourContextValue = {
  active: boolean;
  index: number;
  count: number;
  start: (steps: TourStep[], opts?: StartOptions) => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
  goTo: (index: number) => void;
};

const TourContext = createContext<TourContextValue | null>(null);

/** Control the running tour. Must be used under a `TourProvider`. */
export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within a <TourProvider>");
  return ctx;
}

const SEEN_PREFIX = "orbit.tour.";

/** Whether a tour with this `id` has already been completed on this device. */
export function hasSeenTour(id: string) {
  try {
    return localStorage.getItem(SEEN_PREFIX + id) === "1";
  } catch {
    return false;
  }
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [index, setIndex] = useState(0);
  const [active, setActive] = useState(false);
  const tourId = useRef<string | undefined>(undefined);

  const markSeen = useCallback(() => {
    if (!tourId.current) return;
    try {
      localStorage.setItem(SEEN_PREFIX + tourId.current, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const stop = useCallback(() => {
    setActive(false);
    markSeen();
  }, [markSeen]);

  const start = useCallback((next: TourStep[], opts?: StartOptions) => {
    if (next.length === 0) return;
    tourId.current = opts?.id;
    setSteps(next);
    setIndex(Math.min(Math.max(opts?.startAt ?? 0, 0), next.length - 1));
    setActive(true);
  }, []);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i >= steps.length - 1) {
        stop();
        return i;
      }
      return i + 1;
    });
  }, [steps.length, stop]);

  const prev = useCallback(() => setIndex(i => Math.max(0, i - 1)), []);
  const goTo = useCallback(
    (i: number) => setIndex(() => Math.min(Math.max(i, 0), steps.length - 1)),
    [steps.length],
  );

  const value = useMemo<TourContextValue>(
    () => ({ active, index, count: steps.length, start, next, prev, stop, goTo }),
    [active, index, steps.length, start, next, prev, stop, goTo],
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      {active && steps[index] && (
        <TourOverlay
          step={steps[index]}
          index={index}
          count={steps.length}
          onNext={next}
          onPrev={prev}
          onStop={stop}
        />
      )}
    </TourContext.Provider>
  );
}

const SPRING = { stiffness: 700, damping: 52, mass: 0.6 } as const;

function TourOverlay({
  step,
  index,
  count,
  onNext,
  onPrev,
  onStop,
}: {
  step: TourStep;
  index: number;
  count: number;
  onNext: () => void;
  onPrev: () => void;
  onStop: () => void;
}) {
  const pad = step.padding ?? 6;
  const [found, setFound] = useState(false);
  // `ready` gates the spotlight: it stays false while we scroll the target into
  // view, so the hole is only cut once the page has settled at its final scroll.
  const [ready, setReady] = useState(false);

  // Instant target geometry (matches the real DOM rect) — drives the popover anchor.
  const tTop = useMotionValue(0);
  const tLeft = useMotionValue(0);
  const tWidth = useMotionValue(0);
  const tHeight = useMotionValue(0);
  const tRadius = useMotionValue(step.radius ?? 12);

  // Springs derived from the targets — drive every *visual* (spotlight + blockers)
  // from one shared source so the hole and the dim never desync.
  const sTop = useSpring(tTop, SPRING);
  const sLeft = useSpring(tLeft, SPRING);
  const sWidth = useSpring(tWidth, SPRING);
  const sHeight = useSpring(tHeight, SPRING);
  const sRadius = useSpring(tRadius, SPRING);

  const sBottom = useTransform(() => sTop.get() + sHeight.get());
  const sRight = useTransform(() => sLeft.get() + sWidth.get());

  // Per step: scroll the target into view first, wait for the scroll to settle,
  // THEN snap the spotlight in and start tracking. Avoids placing the overlay at
  // the pre-scroll position and having it drift while the page scrolls.
  useEffect(() => {
    setReady(false);
    let raf = 0;

    const read = () => {
      const el = document.querySelector(step.target);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const corner = Math.min(Number.parseFloat(cs.borderTopLeftRadius) || 0, 20);
      return {
        top: r.top - pad,
        left: r.left - pad,
        width: r.width + pad * 2,
        height: r.height + pad * 2,
        radius: step.radius ?? corner + pad,
      };
    };

    const applyTarget = (b: NonNullable<ReturnType<typeof read>>) => {
      tTop.set(b.top);
      tLeft.set(b.left);
      tWidth.set(b.width);
      tHeight.set(b.height);
      tRadius.set(b.radius);
    };

    document
      .querySelector(step.target)
      ?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

    // Settle loop: poll until the rect stops moving for a few frames.
    let prevKey = "";
    let stable = 0;
    const settle = () => {
      const b = read();
      if (!b) {
        setFound(false);
        raf = requestAnimationFrame(settle);
        return;
      }
      setFound(true);
      applyTarget(b);
      const key = `${Math.round(b.top)}|${Math.round(b.left)}|${Math.round(b.width)}|${Math.round(b.height)}`;
      stable = key === prevKey ? stable + 1 : 0;
      prevKey = key;
      if (stable >= 2) {
        // Snap the springs to the final position and reveal the hole.
        sTop.jump(b.top);
        sLeft.jump(b.left);
        sWidth.jump(b.width);
        sHeight.jump(b.height);
        sRadius.jump(b.radius);
        setReady(true);
        return;
      }
      raf = requestAnimationFrame(settle);
    };
    raf = requestAnimationFrame(settle);

    // Ongoing tracking for later user scroll / resize (springs follow smoothly).
    const onMove = () => {
      const b = read();
      if (b) applyTarget(b);
    };
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    const el = document.querySelector(step.target);
    const ro = el ? new ResizeObserver(onMove) : null;
    ro?.observe(el!);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
      ro?.disconnect();
    };
  }, [step.target, step.radius, pad, tTop, tLeft, tWidth, tHeight, tRadius, sTop, sLeft, sWidth, sHeight, sRadius]);

  // Interactive steps: clicking the real target advances the tour.
  useEffect(() => {
    if (!step.interactive) return;
    const el = document.querySelector(step.target);
    if (!el) return;
    const onClick = () => onNext();
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [step.target, step.interactive, onNext]);

  const isLast = index === count - 1;
  const isFirst = index === 0;
  const blocker = "fixed z-[91]";

  const bubble = (
    <Bubble
      step={step}
      index={index}
      count={count}
      isFirst={isFirst}
      isLast={isLast}
      onNext={onNext}
      onPrev={onPrev}
      onStop={onStop}
    />
  );

  return createPortal(
    <div className="fixed inset-0 z-90" aria-live="polite">
      {found && ready ? (
        <>
          {/* Click blockers around the hole — all bound to the shared springs so
              they track the spotlight exactly. Interactive steps leave the hole
              open; otherwise a center blocker swallows clicks. */}
          <motion.div className={blocker} style={{ top: 0, left: 0, right: 0, height: sTop }} />
          <motion.div className={blocker} style={{ top: sBottom, left: 0, right: 0, bottom: 0 }} />
          <motion.div className={blocker} style={{ top: sTop, left: 0, width: sLeft, height: sHeight }} />
          <motion.div className={blocker} style={{ top: sTop, left: sRight, right: 0, height: sHeight }} />
          {!step.interactive && (
            <motion.div
              className={blocker}
              style={{ top: sTop, left: sLeft, width: sWidth, height: sHeight }}
            />
          )}

          {/* Spotlight: one element, scrim via huge box-shadow + thin violet ring. */}
          <motion.div
            className="pointer-events-none fixed z-92 shadow-[0_0_0_9999px_var(--color-scrim),0_0_0_1.5px_var(--color-accent)]"
            style={{ top: sTop, left: sLeft, width: sWidth, height: sHeight, borderRadius: sRadius }}
          />

          {/* Anchor pinned to the real (instant) rect, remounted per step so Radix
              re-measures and places the bubble correctly. */}
          <Popover key={index} open>
            <PopoverAnchor asChild>
              <motion.div
                className="pointer-events-none fixed"
                style={{ top: tTop, left: tLeft, width: tWidth, height: tHeight }}
              />
            </PopoverAnchor>
            {bubble}
          </Popover>
        </>
      ) : found ? (
        // Scrolling the target into view — keep the page dimmed until it settles.
        <div className="absolute inset-0 bg-scrim" />
      ) : (
        // Fallback: target not found — full scrim + centered bubble.
        <>
          <div className="absolute inset-0 bg-scrim" />
          <div className="absolute left-1/2 top-1/2 -translate-1/2">
            <Popover key={index} open>
              <PopoverAnchor asChild>
                <div className="pointer-events-none size-px" />
              </PopoverAnchor>
              {bubble}
            </Popover>
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}

function Bubble({
  step,
  index,
  count,
  isFirst,
  isLast,
  onNext,
  onPrev,
  onStop,
}: {
  step: TourStep;
  index: number;
  count: number;
  isFirst: boolean;
  isLast: boolean;
  onNext: () => void;
  onPrev: () => void;
  onStop: () => void;
}) {
  return (
    <PopoverContent
      side={step.side ?? "bottom"}
      align={step.align ?? "center"}
      sideOffset={14}
      collisionPadding={16}
      className={cn("z-110 w-80 p-0")}
      onEscapeKeyDown={onStop}
      onInteractOutside={e => e.preventDefault()}
      onOpenAutoFocus={e => e.preventDefault()}
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <span className="font-mono text-[11px] uppercase tracking-wide text-faint">
          Étape
          {" "}
          {index + 1}
          {" "}
          /
          {" "}
          {count}
        </span>
        <button
          type="button"
          onClick={onStop}
          aria-label="Quitter la visite"
          className="-mr-1 grid size-6 place-items-center rounded-md text-faint transition-colors hover:bg-surface-2 hover:text-ink focus-ring"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="px-4 pt-2">
        <h3 className="text-[15px] font-semibold text-ink">{step.title}</h3>
        <div className="mt-1 text-sm/relaxed text-muted">{step.body}</div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 px-4 pt-3">
        {Array.from({ length: count }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-pill transition-all duration-200",
              i === index ? "w-4 bg-accent" : "w-1.5 bg-line-strong",
            )}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onStop}>
          Passer
        </Button>
        <div className="flex items-center gap-2">
          {!isFirst && (
            <Button variant="outline" size="sm" onClick={onPrev}>
              <ChevronLeft className="size-4" />
              Précédent
            </Button>
          )}
          <Button size="sm" onClick={onNext}>
            {isLast ? "Terminer" : "Suivant"}
            {!isLast && <ChevronRight className="size-4" />}
          </Button>
        </div>
      </div>
    </PopoverContent>
  );
}
