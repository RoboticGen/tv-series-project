-- Extensions
--   pgcrypto  -> gen_random_uuid() (redundant on PG13+, kept for portability)
--   citext    -> case-insensitive email storage/lookup without lower() everywhere
--   pg_trgm   -> trigram index for fuzzy/ILIKE title search (autocomplete, typo-tolerant browse)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
