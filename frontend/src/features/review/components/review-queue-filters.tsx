"use client";

import * as React from "react";
import { useQueryStates } from "nuqs";
import { Search } from "lucide-react";
import type { ModerationFeaturedFilter, ModerationSort } from "@/features/review/services/queries";
import { CATEGORY_LABELS } from "@/features/projects/categories";
import { reviewSearchParams } from "@/features/review/search-params";
import { Input } from "@/shared/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

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

export function ReviewQueueFilters({ counts }: { counts: Record<ModerationFeaturedFilter, number> }) {
  const [{ featured, sort, category, q: query }, setParams] = useQueryStates(reviewSearchParams, {
    shallow: false,
    history: "push",
  });

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim() ?? "";
    void setParams({ q });
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={featured} onValueChange={(v) => void setParams({ featured: v as ModerationFeaturedFilter })}>
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

        <Select value={category} onValueChange={(v) => void setParams({ category: v })}>
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

        <Select value={sort} onValueChange={(v) => void setParams({ sort: v as ModerationSort })}>
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
