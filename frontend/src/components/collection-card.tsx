import Link from "next/link";
import Image from "next/image";
import { Lock, FolderOpen } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CollectionCardProps {
  slug: string;
  title: string;
  description?: string | null;
  itemCount: number;
  isPrivate: boolean;
  coverImageUrls?: string[];
}

export function CollectionCard({
  slug,
  title,
  description,
  itemCount,
  isPrivate,
  coverImageUrls = [],
}: CollectionCardProps) {
  return (
    <Link href={`/collections/${slug}`} className="block h-full">
      <Card className="h-full pt-0 transition-colors hover:border-brand-teal">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
          {coverImageUrls.length === 1 ? (
            <Image
              src={coverImageUrls[0]}
              alt={title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
              unoptimized
            />
          ) : coverImageUrls.length > 1 ? (
            <div
              className={
                coverImageUrls.length === 2
                  ? "grid h-full w-full grid-cols-2 gap-0.5"
                  : "grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5"
              }
            >
              {coverImageUrls.slice(0, 4).map((src, i) => (
                <div key={i} className="relative overflow-hidden bg-muted">
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 17vw, (min-width: 640px) 25vw, 50vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <FolderOpen className="size-6" />
            </div>
          )}
        </div>
        <CardHeader>
          <div className="flex items-center gap-2">
            {isPrivate ? (
              <Badge variant="outline" className="w-fit gap-1">
                <Lock className="size-3" />
                Private
              </Badge>
            ) : null}
          </div>
          <CardTitle className="mt-1">{title}</CardTitle>
          <CardDescription className="line-clamp-2">
            {description ? description : <em>No description</em>}
          </CardDescription>
        </CardHeader>
        <CardFooter className="mt-auto">
          <span className="text-sm text-muted-foreground">
            {itemCount} {itemCount === 1 ? "project" : "projects"}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
