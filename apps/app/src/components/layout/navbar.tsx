import { useTranslation } from "react-i18next";

import { userAvatarUrl } from "@/api/account/account.api";
import { useAuth } from "@/hooks/use-auth";
import { useNavLinks } from "@/hooks/use-nav-links";
import { Avatar } from "~orbit/components/ui/Avatar";

import { AdminMenu, BrandMark, MoreMenu, NavItem, SearchTrigger, UserMenu } from "./nav-shared";

type NavbarProps = { onOpenPalette?: () => void };

/**
 * Horizontal top bar — the landscape counterpart to `Sidebar`, sharing the same
 *  nav data, auth and branding. Selected via the `navbar` layout preference.
 */
export function Navbar({ onOpenPalette }: NavbarProps) {
  const { t } = useTranslation("web");
  const { primaryLinks, moreLinks, adminLinks } = useNavLinks();
  const { user, authenticated } = useAuth();

  if (!authenticated) return null;

  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <header className="flex h-16 items-center gap-3 border-b border-line bg-surface px-3">
      <BrandMark compact />

      {/* Primary nav — scrollable; MoreMenu sits outside to avoid overflow clipping its focus ring */}
      <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
        {primaryLinks.map(link => (
          <NavItem key={String(link.to)} link={link} label={t(link.label as never)} orientation="horizontal" />
        ))}
      </nav>
      {moreLinks.length > 0 && <MoreMenu links={moreLinks} />}

      {/* Trailing actions */}
      <div className="flex shrink-0 items-center gap-2.5">
        <SearchTrigger onOpenPalette={onOpenPalette} className="hidden w-56 md:flex" />

        {adminLinks.length > 0 && <AdminMenu links={adminLinks} />}

        <UserMenu side="bottom" align="end">
          <button type="button" aria-label={fullName} className="rounded-full focus:outline-none focus:ring-4 focus:ring-accent/15">
            <Avatar name={fullName} size="sm" src={userAvatarUrl(user.avatar, user.updatedAt) ?? undefined} />
          </button>
        </UserMenu>
      </div>
    </header>
  );
}
