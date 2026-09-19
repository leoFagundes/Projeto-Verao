"use client";

import { curveBasis, line } from "d3-shape";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import {
  ChartIcon,
  DumbbellIcon,
  MealIcon,
  RunIcon,
  ScaleIcon,
} from "./nav-icons";

/** Order matters for BottomNav: index 0 becomes the raised center button,
 * the rest split two-and-two into the corners (index 1-2 left, 3-4 right).
 * Treinos still opens by default when entering a profile (see ProfileCard) —
 * this order only controls where each tab sits in this bar. */
function tabsFor(profileId: string) {
  return [
    {
      href: `/perfil/${profileId}/visao-geral`,
      label: "Visão geral",
      shortLabel: "Visão geral",
      icon: ChartIcon,
    },
    {
      href: `/perfil/${profileId}/treinos`,
      label: "Treinos",
      shortLabel: "Treinos",
      icon: DumbbellIcon,
    },
    {
      href: `/perfil/${profileId}/corridas`,
      label: "Corridas",
      shortLabel: "Corridas",
      icon: RunIcon,
    },
    {
      href: `/perfil/${profileId}/alimentacao`,
      label: "Alimentação",
      // Shortened only for the cramped bottom nav — the full name is used
      // everywhere else (page titles, the desktop top tabs).
      shortLabel: "Dieta",
      icon: MealIcon,
    },
    {
      href: `/perfil/${profileId}/medidas`,
      label: "Medidas",
      shortLabel: "Medidas",
      icon: ScaleIcon,
    },
  ];
}

function isActive(pathname: string, href: string) {
  return pathname.startsWith(href);
}

type Tab = ReturnType<typeof tabsFor>[number];

function SideTab({ tab, active }: { tab: Tab; active: boolean }) {
  return (
    <Link href={tab.href} className="relative flex flex-1 justify-center pb-2 ">
      <motion.div
        whileTap={{ scale: 0.93 }}
        className="relative flex flex-col items-center gap-0.5 px-4 py-3"
      >
        {active ? (
          <motion.span
            layoutId="bottom-nav-active-pill"
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="absolute inset-0.5 rounded-2xl"
            style={{ background: "var(--accent-soft)" }}
          />
        ) : null}
        <span
          className={cn(
            "relative z-10 flex transition-all duration-200",
            active
              ? "scale-105 opacity-100 text-[var(--accent)]"
              : "opacity-50 text-slate-400",
          )}
        >
          <tab.icon className="h-5 w-5" />
        </span>
        <span
          className={cn(
            "relative z-10 whitespace-nowrap text-[9.5px] font-medium leading-none transition-colors",
            active ? "" : "text-slate-500",
          )}
          style={active ? { color: "var(--accent)" } : undefined}
        >
          {tab.shortLabel}
        </span>
      </motion.div>
    </Link>
  );
}

const BUTTON_DIAMETER = 52; // slightly smaller than the notch dip so a gap shows all the way around
const BUTTON_RADIUS = BUTTON_DIAMETER / 2;
/** How far below the bar's top edge the button's own center sits — bigger
 * means the button is nested deeper into the bar (less of it floats above).
 * Kept small so most of the button floats above the bar, like the reference. */
const BUTTON_CENTER_Y = 8;

/**
 * The bar's shape (flat top edge with a smooth, continuous dip in the
 * middle) drawn as a real, visible, *filled* SVG shape — not a `clip-path`
 * or `mask-image` cutout. Every attempt at cutting/masking a plain HTML
 * element (three different `clip-path` techniques, then two `mask-image`
 * ones) either failed to render or, worse, made the whole bar disappear on
 * the actual target device — a plain filled `<path>` doesn't use any of
 * those clipping/masking mechanisms at all, it's just standard SVG drawing,
 * about as universally supported as rendering gets. The floating button and
 * the tab buttons are ordinary HTML laid on top of it.
 *
 * The dip's curve is generated with d3-shape's `curveBasis` (a B-spline)
 * through a handful of control points, instead of hand-picked bezier
 * handles — that's what makes it a smooth, continuous "S" through the dip
 * rather than a shape that kinks where a curve meets a straight line.
 * `curveBasis` specifically (not e.g. Catmull-Rom) because a B-spline is a
 * weighted blend of its control points and mathematically can't overshoot
 * or loop between them — Catmull-Rom passes exactly through each point
 * instead, which looks great for gentle point spacing but visibly bulged
 * and kinked here once the points were pulled closer together (a steep
 * rise over a short run is exactly the case it handles badly). The first
 * and last points are repeated so the curve actually reaches them instead
 * of just approaching them, letting it meet the straight edges cleanly.
 *
 * Everything is drawn in a fixed 0–100 square viewBox and stretched to the
 * bar's actual (wide, short) box via `preserveAspectRatio="none"` — that
 * non-uniform stretch is what turns the square-space curve into the wide,
 * shallow dip the design needs, and it needs no JS measurement of the
 * bar's real size to work.
 */
const notchPoints: Array<[number, number]> = [
  [36, 0],
  [36, 0],
  [42, 6],
  [50, 50],
  [58, 6],
  [64, 0],
  [64, 0],
];
const notchStartX = notchPoints[0][0];
const notchCurve = line().curve(curveBasis)(notchPoints) ?? "";
// d3's output starts with "M<notchStartX>,0", which duplicates the point
// already reached by the manual "H<notchStartX>" below — strip that leading moveto.
const notchCurveOnly = notchCurve.replace(/^M[-\d.]+,[-\d.]+/, "");
const BAR_SHAPE_PATH = `M0,0 H${notchStartX} ${notchCurveOnly} H100 V100 H0 Z`;

/** First tab is the raised, floating center button; the rest split
 * two-and-two into the bar's corners — mirrors the reference layout of a
 * sports app's bottom nav, including the bar's top edge dipping to hug the
 * floating button instead of just sitting flat behind it. */
export function BottomNav({ profileId }: { profileId: string }) {
  const pathname = usePathname();
  const [center, ...sides] = tabsFor(profileId);
  const left = sides.slice(0, 2);
  const right = sides.slice(2);
  const centerActive = isActive(pathname, center.href);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 h-[76px] sm:hidden">
      <div className="relative mx-auto h-full ">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <path
            d={BAR_SHAPE_PATH}
            fill="var(--surface)"
            fillOpacity="0.97"
            stroke="var(--border-strong)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="relative flex h-full items-stretch gap-1 px-2 pb-[env(safe-area-inset-bottom)] pt-[12px]">
          <div className="flex flex-1 items-stretch gap-1">
            {left.map((tab) => (
              <SideTab
                key={tab.href}
                tab={tab}
                active={isActive(pathname, tab.href)}
              />
            ))}
          </div>
          <div className="w-20 shrink-0" aria-hidden="true" />
          <div className="flex flex-1 items-stretch gap-1">
            {right.map((tab) => (
              <SideTab
                key={tab.href}
                tab={tab}
                active={isActive(pathname, tab.href)}
              />
            ))}
          </div>
        </div>

        <Link
          href={center.href}
          aria-label={center.label}
          className="absolute left-1/2 top-0"
          style={{
            transform: `translate(-50%, ${BUTTON_CENTER_Y - BUTTON_RADIUS}px)`,
          }}
        >
          <motion.div
            whileTap={{ scale: 0.92 }}
            animate={{ scale: centerActive ? 1.06 : 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            className="grid place-items-center rounded-full text-slate-950 shadow-lg shadow-black/40"
            style={{
              height: BUTTON_DIAMETER,
              width: BUTTON_DIAMETER,
              background:
                "linear-gradient(135deg, var(--accent), var(--accent-2))",
            }}
          >
            <center.icon className="h-6 w-6" />
          </motion.div>
        </Link>
      </div>
    </nav>
  );
}

export function TopTabs({ profileId }: { profileId: string }) {
  const pathname = usePathname();
  const tabs = tabsFor(profileId);

  return (
    <div className="hidden rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1 sm:inline-flex">
      {tabs.map((tab) => {
        const active = isActive(pathname, tab.href);
        return (
          <Link key={tab.href} href={tab.href} className="relative">
            {active ? (
              <motion.span
                layoutId="top-tabs-active-pill"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent), var(--accent-2))",
                }}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 block rounded-full px-4 py-2 text-sm font-medium transition",
                active ? "text-slate-950" : "text-slate-300 hover:text-white",
              )}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
