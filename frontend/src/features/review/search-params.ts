import { createLoader, parseAsString, parseAsStringLiteral } from "nuqs/server";
import { CATEGORY_LABELS } from "@/features/projects/categories";
import type { ModerationFeaturedFilter, ModerationSort } from "@/features/review/services/queries";

const FEATURED_FILTERS: ModerationFeaturedFilter[] = ["all", "featured", "not_featured"];
const SORTS: ModerationSort[] = ["newest", "oldest", "top_rated", "most_liked", "most_favorited"];

export const reviewSearchParams = {
  q: parseAsString.withDefault(""),
  category: parseAsStringLiteral(["all", ...Object.keys(CATEGORY_LABELS)]).withDefault("all"),
  featured: parseAsStringLiteral(FEATURED_FILTERS).withDefault("all"),
  sort: parseAsStringLiteral(SORTS).withDefault("newest"),
};
export const loadReviewSearchParams = createLoader(reviewSearchParams);
