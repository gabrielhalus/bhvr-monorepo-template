import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import { allRolesQueryOptions } from "@/api/roles/roles.queries";
import { Button } from "~react/components/button";

export function Sidebar() {
  const { t } = useTranslation("common");
  const { data } = useQuery(allRolesQueryOptions);

  return (
    <aside className="h-full w-75 p-2 border-r">
      <Button variant="link" asChild>
        <Link to="/roles">
          <ArrowLeft />
          {t("navigation.back")}
        </Link>
      </Button>
      <div className="flex p-2 flex-col space-y-1">
        {data?.roles.map(role => (
          <Button asChild key={role.id} variant="ghost" className="justify-start">
            <Link to="/roles/$name" params={{ name: role.name }} activeProps={() => ({ className: "bg-muted" })}>
              {role.label}
            </Link>
          </Button>
        ))}
      </div>
    </aside>
  );
}
