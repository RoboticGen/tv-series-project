import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SubmissionCardProps {
  id: string;
  projectTitle: string;
  createdAt: Date;
}

export function SubmissionCard({ id, projectTitle, createdAt }: SubmissionCardProps) {
  return (
    <Link href={`/dashboard/submissions/${id}`}>
      <Card className="transition-colors hover:border-brand-teal">
        <CardHeader>
          <CardTitle>{projectTitle}</CardTitle>
          <CardDescription>
            Submitted {createdAt.toLocaleDateString()}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
