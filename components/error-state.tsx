import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

interface ErrorStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function ErrorState({ title, description, action }: ErrorStateProps) {
  return (
    <div className="grid min-h-svh place-items-center p-6">
      <div className="w-full max-w-110 text-center">
        <h1 className="m-0 text-3xl leading-none font-medium tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mx-auto mt-5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-7 flex items-center justify-center gap-2">
          {action}
          <Link className={buttonVariants({ variant: "outline" })} href="/">
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
