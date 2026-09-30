import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h2 className="font-heading text-xl font-bold text-brand-navy dark:text-foreground">
        Nothing to moderate
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        This project isn&apos;t published anymore.
      </p>
      <Button className="mt-6" nativeButton={false} render={<Link href="/dashboard/review" />}>
        Back to moderation
      </Button>
    </div>
  );
}
