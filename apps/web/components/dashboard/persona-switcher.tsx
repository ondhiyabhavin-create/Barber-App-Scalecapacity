"use client";

import { useMemo } from "react";
import { Mask, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type UserOption = { id: string; role: "owner" | "staff" | "client"; label: string };

export function PersonaSwitcher({
  users,
  current,
}: {
  users: UserOption[];
  current: string | null;
}) {
  const grouped = useMemo(
    () => ({
      owner: users.filter((u) => u.role === "owner"),
      staff: users.filter((u) => u.role === "staff"),
      client: users.filter((u) => u.role === "client"),
    }),
    [users]
  );

  function apply(role: "owner" | "staff" | "client", userId: string | null) {
    document.cookie = `barberos_impersonation=${role}:${userId ?? ""}; path=/; max-age=${60 * 60 * 24 * 30}`;
    window.location.reload();
  }

  function clear() {
    document.cookie = "barberos_impersonation=; path=/; max-age=0";
    window.location.reload();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button type="button" variant="outline" className="rounded-xl"><Mask className="mr-2 size-4" /> View as</Button>} />
      <DropdownMenuContent className="w-72">
        <div className="px-2 py-1 text-xs text-muted-foreground">Owner</div>
        {grouped.owner.map((u) => (
          <DropdownMenuItem key={u.id} onClick={() => apply("owner", u.id)}>
            <Users className="size-4" /> {u.label}{current === `owner:${u.id}` ? " (active)" : ""}
          </DropdownMenuItem>
        ))}
        <div className="px-2 py-1 text-xs text-muted-foreground">Staff</div>
        {grouped.staff.map((u) => (
          <DropdownMenuItem key={u.id} onClick={() => apply("staff", u.id)}>
            <Users className="size-4" /> {u.label}{current === `staff:${u.id}` ? " (active)" : ""}
          </DropdownMenuItem>
        ))}
        <div className="px-2 py-1 text-xs text-muted-foreground">Clients</div>
        {grouped.client.map((u) => (
          <DropdownMenuItem key={u.id} onClick={() => apply("client", u.id)}>
            <Users className="size-4" /> {u.label}{current === `client:${u.id}` ? " (active)" : ""}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={clear}>Reset to my account</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
