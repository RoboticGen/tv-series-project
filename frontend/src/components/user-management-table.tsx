"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2, Users } from "lucide-react";
import type { listUsersForAdmin } from "@/actions/admin";
import { deleteUser, setUserDisabled, updateUserRole } from "@/actions/admin";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type AdminUser = Awaited<ReturnType<typeof listUsersForAdmin>>[number];
type UserRole = AdminUser["role"];

const ROLES: UserRole[] = ["student", "mentor", "admin"];
const ROLE_FILTERS = ["all", ...ROLES] as const;

function formatDate(date: Date | null) {
  return date ? new Date(date).toLocaleDateString() : "Never";
}

function DeleteUserButton({ user }: { user: AdminUser }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setIsDeleting(true);
    try {
      await deleteUser(user.id);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="icon-sm" title="Delete user" />}>
        <Trash2 className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {user.displayName}?</DialogTitle>
          <DialogDescription>
            This permanently deletes {user.email} along with their projects,
            submissions, comments, and collections. This can&apos;t be undone.
            Disable the account instead if you might want it back.
          </DialogDescription>
        </DialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting…" : "Delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserRow({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const locked = isSelf || user.isDefaultAdmin;

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <li
      className={cn(
        "flex flex-col gap-3 p-4 sm:flex-row sm:items-center",
        user.isDisabled && "bg-muted/60",
        isPending && "opacity-60",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar size="sm">
          <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName} />
          <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate font-bold text-foreground">{user.displayName}</p>
            {isSelf ? <Badge variant="neutral">You</Badge> : null}
            {user.isDefaultAdmin ? <Badge variant="secondary">Default admin</Badge> : null}
            {user.isDisabled ? <Badge variant="destructive">Disabled</Badge> : null}
          </div>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground">
            Joined {formatDate(user.createdAt)} · Last login {formatDate(user.lastLoginAt)}
          </p>
          {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={user.role}
          disabled={locked || isPending}
          onValueChange={(role) => run(() => updateUserRole(user.id, role as UserRole))}
        >
          <SelectTrigger size="sm" className="w-28 capitalize" aria-label="Role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((role) => (
              <SelectItem key={role} value={role} className="capitalize">
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Switch
            size="sm"
            checked={!user.isDisabled}
            disabled={locked || isPending}
            onCheckedChange={(active) => run(() => setUserDisabled(user.id, !active))}
          />
          Active
        </label>

        {locked ? (
          <Button variant="destructive" size="icon-sm" disabled title="Can't delete this account">
            <Trash2 className="size-4" />
          </Button>
        ) : (
          <DeleteUserButton user={user} />
        )}
      </div>
    </li>
  );
}

export function UserManagementTable({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<(typeof ROLE_FILTERS)[number]>("all");

  const needle = query.trim().toLowerCase();
  const visible = users.filter(
    (u) =>
      (roleFilter === "all" || u.role === roleFilter) &&
      (!needle ||
        u.displayName.toLowerCase().includes(needle) ||
        u.email.toLowerCase().includes(needle)),
  );

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="pl-9"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v as (typeof ROLE_FILTERS)[number])}
        >
          <SelectTrigger className="w-full capitalize sm:w-40" aria-label="Filter by role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_FILTERS.map((role) => (
              <SelectItem key={role} value={role} className="capitalize">
                {role === "all" ? "All roles" : role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-edge py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-sm border-2 border-edge bg-brand-teal text-brand-navy shadow-hard-3">
            <Users className="size-5" />
          </div>
          <p className="font-bold text-foreground">No users match</p>
        </div>
      ) : (
        <ul className="mt-6 divide-y-2 divide-edge overflow-hidden rounded-lg border-2 border-edge bg-card shadow-hard-4">
          {visible.map((user) => (
            <UserRow key={user.id} user={user} isSelf={user.id === currentUserId} />
          ))}
        </ul>
      )}
    </div>
  );
}
