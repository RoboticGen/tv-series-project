import { createLoader, createParser, createSerializer, parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs/server";
import { CATEGORY_LABELS } from "@/features/projects/categories";

const parseAsFlag = createParser<boolean>({
  parse: (value) => value === "1",
  serialize: (value) => (value ? "1" : "0"),
});

export const browseSearchParams = {
  q: parseAsString.withDefault(""),
  category: parseAsStringLiteral(Object.keys(CATEGORY_LABELS)),
  featured: parseAsFlag.withDefault(false),
  page: parseAsInteger.withDefault(1),
};
export const loadBrowseSearchParams = createLoader(browseSearchParams);
export const serializeBrowseSearchParams = createSerializer(browseSearchParams);
