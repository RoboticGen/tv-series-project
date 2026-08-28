import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h2 className="font-heading text-xl font-bold text-brand-navy dark:text-white">
        Project not found
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        It may be private, unpublished, or no longer exists.
      </p>
      <Button className="mt-6" nativeButton={false} render={<Link href="/projects" />}>
        Browse projects
      </Button>
    </div>
  );
}
