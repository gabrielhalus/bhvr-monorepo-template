import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

// import { AddMembersDialog } from "./-components/add-members-dialog";
import { RoleMembersList } from "./-components/members-list";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@bunstack/react/components/input-group";

export const Route = createFileRoute(
  "/_dashboard/settings/roles/$name/members/",
)({
  component: RoleMembers,
  loader: () => ({ crumb: "pages.settings.roles.detail.pages.members.title" }),
});

function RoleMembers() {
  const { t } = useTranslation("web");

  const [globalFilter, setGlobalFilter] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <InputGroup>
          <InputGroupAddon>
            <Search className="size-4" />
          </InputGroupAddon>
          <InputGroupInput placeholder={t("pages.settings.roles.detail.pages.members.searchMembers")} value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} />
        </InputGroup>
        {/* <AddMembersDialog /> */}
      </div>
      <RoleMembersList search={globalFilter} />
    </div>
  );
}
