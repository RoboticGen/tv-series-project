"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { ModerationFeaturedFilter, ModerationSort } from "@/actions/review";
import { CATEGORY_LABELS } from "@/components/project-card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FEATURED_TABS: { value: ModerationFeaturedFilter; label: string }[] = [
  { value: "all", label: "All published" },
  { value: "featured", label: "Featured" },
  { value: "not_featured", label: "Not featured" },
];

const SORT_OPTIONS: { value: ModerationSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "top_rated", label: "Top rated" },
  { value: "most_liked", label: "Most liked" },
  { value: "most_favorited", label: "Most favorited" },
  { value: "oldest", label: "Oldest" },
];

// Filters live in the URL (like /projects) so the server component does
// the querying and a filtered view can be linked or refreshed.
export function ReviewQueueFilters({
  featured,
  sort,
  category,
  query,
  counts,
}: {
  featured: ModerationFeaturedFilter;
  sort: ModerationSort;
  category: string;
  query: string;
  counts: Record<ModerationFeaturedFilter, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string, defaultValue: string) {
    const params = new URLSearchParams(searchParams);
    if (value === defaultValue) params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim() ?? "";
    setParam("q", q, "");
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={featured} onValueChange={(v) => setParam("featured", v, "all")}>
        <TabsList>
          {FEATURED_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
              <span className="text-xs tabular-nums opacity-70">{counts[tab.value]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            key={query}
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by title, summary or author"
            className="pl-9"
          />
        </form>

        <Select value={category} onValueChange={(v) => setParam("category", v, "all")}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter by category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setParam("sort", v, "newest")}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Sort projects">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
