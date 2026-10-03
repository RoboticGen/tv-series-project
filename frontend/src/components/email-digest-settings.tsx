"use client";

import * as React from "react";
import { Mail } from "lucide-react";
import { setEmailPreference } from "@/actions/email-preferences";
import { Switch } from "@/components/ui/switch";

type Kind = Parameters<typeof setEmailPreference>[0];

function Row({ kind, label, hint, initial }: { kind: Kind; label: string; hint: string; initial: boolean }) {
  const id = React.useId();
  const [checked, setChecked] = React.useState(initial);
  const [pending, startTransition] = React.useTransition();

  function onChange(next: boolean) {
    setChecked(next);
    startTransition(async () => {
      try {
        await setEmailPreference(kind, next);
      } catch {
        setChecked(!next);
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="text-sm font-bold text-foreground">
          {label}
        </label>
        <p className="text-xs font-medium text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={pending} />
    </div>
  );
}

export function EmailDigestSettings({
  emailDigest,
  emailMentorDigest,
  isStaff,
}: {
  emailDigest: boolean;
  emailMentorDigest: boolean;
  isStaff: boolean;
}) {
  return (
    <section
      aria-labelledby="email-digest-heading"
      className="flex flex-col gap-4 rounded-xl border-2 border-edge bg-card p-4"
    >
      <h2
        id="email-digest-heading"
        className="flex items-center gap-2 text-xs font-black tracking-wide text-muted-foreground uppercase"
      >
        <Mail className="size-4" aria-hidden />
        Weekly email
      </h2>
      <Row
        kind="digest"
        label="My weekly summary"
        hint="Stars, builds, comments and points on your projects. Only sent when something happened."
        initial={emailDigest}
      />
      {isStaff ? (
        <Row
          kind="mentorDigest"
          label="Projects published this week"
          hint="A list of newly published projects to review."
          initial={emailMentorDigest}
        />
      ) : null}
    </section>
  );
}
