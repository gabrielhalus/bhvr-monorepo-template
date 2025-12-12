import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { getAllRolesQueryOptions } from "@/queries/roles";
import { Button } from "@bunstack/react/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@bunstack/react/components/tooltip";

export function Sidebar() {
  const { t } = useTranslation("common");
  const { isPending, isError, data } = useQuery(getAllRolesQueryOptions);

  if (isPending) {
    return null;
  }

  if (isError) {
    return null;
  }

  return (
    <aside className="h-full w-75 p-2 border-r-1">
      <div className="flex justify-between">
        <Button variant="link" asChild>
          <Link to="/settings/roles">
            <ArrowLeft />
            {t("navigation.back")}
          </Link>
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="link">
              <Plus />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Create New Role
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex p-2 flex-col space-y-1">
        {data.roles.map(role => (
          <Button asChild key={role.id} variant="ghost" className="justify-start">
            <Link to="/settings/roles/$name" params={{ name: role.name }} activeProps={() => ({ className: "bg-muted" })}>
              {role.label}
            </Link>
          </Button>
        ))}
      </div>
    </aside>
  );
}
