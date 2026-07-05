import type { LinkProps } from "@tanstack/react-router";
import type { IconComponent } from "~orbit/components/ui/icons";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { authorizeBatchQueryOptions } from "@/queries/auth";
import {
  ClipboardCheck,
  ClipboardList,
  DatabaseBackup,
  LayoutDashboard,
  Settings,
  Users,
} from "~orbit/components/ui/icons";

export type NavLink = { to: LinkProps["to"]; icon: IconComponent; label: string; primary?: boolean };

export function useNavLinks() {
  const { data: authorizations } = useQuery(
    authorizeBatchQueryOptions([
      { permission: "user:list" },
      { permission: "config:list" },
      { permission: "log:list" },
      { permission: "cronTask:list" },
      { permission: "backup:list" },
    ]),
  );

  const { links, adminLinks, primaryLinks, moreLinks } = useMemo(() => {
    const links: NavLink[] = [
      { to: "/", icon: LayoutDashboard, label: "home.title", primary: true },
    ];

    const primaryLinks = links.filter(l => l.primary);
    const moreLinks = links.filter(l => !l.primary);

    const adminLinks: NavLink[] = [
      ...((authorizations?.[0] ?? false) ? [{ to: "/users", icon: Users, label: "users.title" } as NavLink] : []),
      ...((authorizations?.[2] ?? false) ? [{ to: "/logs", icon: ClipboardList, label: "logs.title" } as NavLink] : []),
      ...((authorizations?.[3] ?? false) ? [{ to: "/cron", icon: ClipboardCheck, label: "cron.title" } as NavLink] : []),
      ...((authorizations?.[4] ?? false) ? [{ to: "/backup", icon: DatabaseBackup, label: "backup.title" } as NavLink] : []),
      ...((authorizations?.[1] ?? false) ? [{ to: "/settings", icon: Settings, label: "settings.title" } as NavLink] : []),
    ];

    return { links, adminLinks, primaryLinks, moreLinks };
  }, [authorizations]);

  return { links, adminLinks, primaryLinks, moreLinks };
}
