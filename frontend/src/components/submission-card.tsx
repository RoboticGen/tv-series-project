import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SubmissionCardProps {
  id: string;
  projectTitle: string;
  createdAt: Date;
  isPrivate?: boolean;
}

export function SubmissionCard({ id, projectTitle, createdAt, isPrivate = true }: SubmissionCardProps) {
  return (
    <Link href={`/dashboard/submissions/${id}`}>
      <Card className="transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>{projectTitle}</CardTitle>
            <Badge variant={isPrivate ? "outline" : "secondary"}>
              {isPrivate ? "Private" : "Public"}
            </Badge>
          </div>
          <CardDescription>
            Submitted {createdAt.toLocaleDateString()}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
