import Image from "next/image";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { isPlainWriteUp, type Step } from "@/lib/steps";

export function StepsViewer({ steps }: { steps: Step[] }) {
  if (isPlainWriteUp(steps)) return <MarkdownViewer body={steps[0].body} />;

  return (
    <div className="space-y-10">
      {steps.map((step, index) => (
        <section key={step.id} className="break-inside-avoid-page">
          <h2 className="font-heading text-xl font-bold text-brand-navy dark:text-white">
            <span className="text-brand-teal">Step {index + 1}</span>
            {step.title ? `: ${step.title}` : null}
          </h2>
          {step.images.length > 0 ? (
            <div
              className={
                step.images.length === 1
                  ? "mt-4"
                  : "mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3"
              }
            >
              {step.images.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener"
                  className={
                    step.images.length === 1
                      ? "relative block aspect-video overflow-hidden rounded-lg border bg-muted"
                      : "relative block aspect-4/3 overflow-hidden rounded-lg border bg-muted"
                  }
                >
                  <Image
                    src={url}
                    alt={step.title || `Step ${index + 1}`}
                    fill
                    sizes="(min-width: 640px) 33vw, 50vw"
                    className="object-contain"
                    unoptimized
                  />
                </a>
              ))}
            </div>
          ) : null}
          {step.body ? (
            <div className="mt-4">
              <MarkdownViewer body={step.body} />
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
