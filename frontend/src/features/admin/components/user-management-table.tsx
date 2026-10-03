"use client";

import * as React from "react";
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { ChevronLeft, ChevronRight, Search, Trash2, Users } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  columnFilteringFeature,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_equalsString,
  filterFn_includesString,
  globalFilteringFeature,
  rowSortingFeature,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { deleteUser, listUsersForAdmin, setUserDisabled, updateUserRole } from "@/features/admin/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/shared/components/ui/dialog";
import { queryKeys } from "@/shared/constants/query-keys";
import { cn } from "@/shared/lib/utils";
import { formatDate } from "@/shared/lib/format";
import { NoResults } from "@/shared/components/no-results";

type AdminUser = Awaited<ReturnType<typeof listUsersForAdmin>>[number];
type UserRole = AdminUser["role"];

const ROLES: UserRole[] = ["student", "mentor", "admin"];
const ROLE_FILTERS = ["all", ...ROLES] as const;
const PAGE_SIZE = 20;
const SORTS = {
  newest: { label: "Newest", by: { id: "createdAt", desc: true } },
  name: { label: "Name (A-Z)", by: { id: "displayName", desc: false } },
  last_login: { label: "Last login", by: { id: "lastLoginAt", desc: true } },
  role: { label: "Role", by: { id: "role", desc: false } },
} as const;
type SortKey = keyof typeof SORTS;
const SORT_KEYS = Object.keys(SORTS) as SortKey[];
const FILTER_PARAMS = {
  q: parseAsString.withDefault(""),
  role: parseAsStringLiteral(ROLE_FILTERS).withDefault("all"),
  sort: parseAsStringLiteral(SORT_KEYS).withDefault("newest"),
  page: parseAsInteger.withDefault(1),
};

function DeleteUserButton({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const {
    mutate: handleDelete,
    isPending: isDeleting,
    error,
  } = useMutation({
    mutationFn: () => deleteUser(user.id),
    onSuccess: () => {
      queryClient.setQueryData<AdminUser[]>(queryKeys.adminUsers, (old = []) => old.filter((u) => u.id !== user.id));
      setOpen(false);
    },
  });

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
        {error ? <p className="text-sm text-destructive">{error.message || "Failed to delete user"}</p> : null}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button variant="destructive" onClick={() => handleDelete()} disabled={isDeleting}>
            {isDeleting ? "Deleting…" : "Delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserRow({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const queryClient = useQueryClient();
  const locked = isSelf || user.isDefaultAdmin;

  // Shows the change straight away and rolls back if the server refuses it.
  const {
    mutate: change,
    isPending,
    error,
  } = useMutation({
    mutationFn: (patch: { role?: UserRole; isDisabled?: boolean }) =>
      patch.role ? updateUserRole(user.id, patch.role) : setUserDisabled(user.id, Boolean(patch.isDisabled)),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.adminUsers });
      const previous = queryClient.getQueryData<AdminUser[]>(queryKeys.adminUsers);
      queryClient.setQueryData<AdminUser[]>(queryKeys.adminUsers, (old = []) =>
        old.map((u) => (u.id === user.id ? { ...u, ...patch } : u)),
      );
      return { previous };
    },
    onError: (_err, _patch, context) => queryClient.setQueryData(queryKeys.adminUsers, context?.previous),
  });

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
            Joined {formatDate(user.createdAt)} · Last login {user.lastLoginAt ? formatDate(user.lastLoginAt) : "never"}
          </p>
          {error ? <p className="mt-1 text-sm text-destructive">{error.message || "Something went wrong"}</p> : null}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={user.role}
          disabled={locked || isPending}
          onValueChange={(role) => change({ role: role as UserRole })}
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
            onCheckedChange={(active) => change({ isDisabled: !active })}
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

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString, equalsString: filterFn_equalsString },
  sortFns: { basic: sortFn_basic, text: sortFn_text },
});

const columns: ColumnDef<typeof features, AdminUser>[] = [
  { accessorKey: "displayName", sortFn: "text" },
  { accessorKey: "email" },
  { accessorKey: "role", filterFn: "equalsString", sortFn: "text", enableGlobalFilter: false },
  { id: "createdAt", accessorFn: (u) => new Date(u.createdAt).getTime(), sortFn: "basic", enableGlobalFilter: false },
  {
    id: "lastLoginAt",
    accessorFn: (u) => (u.lastLoginAt ? new Date(u.lastLoginAt).getTime() : 0),
    sortFn: "basic",
    enableGlobalFilter: false,
  },
];

export function UserManagementTable({
  users: initialUsers,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  const { data: users } = useQuery({
    queryKey: queryKeys.adminUsers,
    queryFn: () => listUsersForAdmin(),
    initialData: initialUsers,
  });
  const [{ q: query, role: roleFilter, sort, page }, setFilters] = useQueryStates(FILTER_PARAMS);

  const table = useTable({
    features,
    data: users,
    columns,
    getRowId: (user) => user.id,
    state: {
      globalFilter: query.trim(),
      columnFilters: roleFilter === "all" ? [] : [{ id: "role", value: roleFilter }],
      sorting: [SORTS[sort].by],
    },
    globalFilterFn: "includesString",
  });

  const rows = table.getRowModel().rows;
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  const visible = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => void setFilters({ q: e.target.value, page: 1 })}
            placeholder="Search by name or email"
            aria-label="Search users"
            className="pl-9"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => void setFilters({ role: v as (typeof ROLE_FILTERS)[number], page: 1 })}
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
        <Select value={sort} onValueChange={(v) => void setFilters({ sort: v as SortKey, page: 1 })}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Sort users">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_KEYS.map((key) => (
              <SelectItem key={key} value={key}>
                {SORTS[key].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {visible.length === 0 ? (
        <div className="mt-6">
          <NoResults icon={Users} title="No users match" description="Try a different name, email or role." />
        </div>
      ) : (
        <ul className="mt-6 divide-y-2 divide-edge overflow-hidden rounded-lg border-2 border-edge bg-card shadow-hard-4">
          {visible.map((row) => (
            <UserRow key={row.id} user={row.original} isSelf={row.id === currentUserId} />
          ))}
        </ul>
      )}

      {pageCount > 1 ? (
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground tabular-nums">
            Page {currentPage} of {pageCount} · {rows.length} users
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => void setFilters({ page: currentPage - 1 })}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === pageCount}
              onClick={() => void setFilters({ page: currentPage + 1 })}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
