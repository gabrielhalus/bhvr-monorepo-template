import { forwardRef } from "react";

import { cn } from "~orbit/lib/utils";

/**
 * AppShell — the responsive product frame: a sticky navigation rail beside a
 * scrolling main column, with a floating bottom bar on small screens. Composable
 * parts the caller nests:
 *
 * ```tsx
 * <AppShell>
 *   <AppShellSidebar><Sidebar variant="flush" /></AppShellSidebar>
 *   <AppShellMain>
 *     <Container>…page…</Container>
 *   </AppShellMain>
 *   <AppShellMobileBar><MobileBar /></AppShellMobileBar>
 * </AppShell>
 * ```
 *
 * Responsive behaviour (no work for the caller):
 * - `AppShellSidebar`   shows from `lg` up as a full-height sticky rail; hidden below.
 * - `AppShellMobileBar` shows below `lg` as a fixed bottom bar; hidden above.
 * - `AppShellMain` reserves bottom padding on mobile so content clears the bar.
 */
export const AppShell = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex h-dvh overflow-hidden bg-paper", className)} {...props} />
  ),
);
AppShell.displayName = "AppShell";

/** Full-height sticky rail — visible from `lg` up, hidden below. */
export const AppShellSidebar = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("sticky top-0 hidden h-dvh shrink-0 lg:flex", className)} {...props} />
  ),
);
AppShellSidebar.displayName = "AppShellSidebar";

/**
 * The scrolling content column — owns the page scroll (the nav rail stays put).
 * Reserves the scrollbar gutter so short/long routes don't shift horizontally,
 * and bottom space for the mobile bar.
 */
export const AppShellMain = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <main ref={ref} className={cn("min-h-0 min-w-0 flex-1 overflow-y-auto pb-24 scrollbar-gutter-stable lg:pb-0", className)} {...props} />
  ),
);
AppShellMain.displayName = "AppShellMain";

/** Fixed bottom bar — visible below `lg`, hidden above. */
export const AppShellMobileBar = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("fixed inset-x-0 bottom-0 z-40 p-3 lg:hidden", className)} {...props} />
  ),
);
AppShellMobileBar.displayName = "AppShellMobileBar";
