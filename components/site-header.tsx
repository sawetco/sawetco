import { Mail } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const socialLinks = [
  {
    label: "E-Posta Gönder",
    href: `mailto:${siteConfig.email}`,
    icon: Mail,
  },
  {
    label: "LinkedIn Profili",
    href: siteConfig.linkedin,
    icon: LinkedInIcon,
  },
  {
    label: "GitHub Profili",
    href: siteConfig.github,
    icon: GitHubIcon,
  },
] as const;

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 px-4 py-4 sm:px-10 sm:py-5">
      <nav className="flex items-center justify-between" aria-label="Ana menü">
        <div className="flex items-center gap-1">
          {socialLinks.map(({ label, href, icon: Icon }) => (
            <Tooltip key={label}>
              <TooltipTrigger
                render={
                  <a
                    className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    href={href}
                    aria-label={label}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noreferrer" : undefined}
                  />
                }
              >
                <Icon className="size-4" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent side="bottom">{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            aria-label="Görüşme Planla"
            className={cn(buttonVariants({ size: "sm" }), "rounded-full px-4")}
            href={siteConfig.calUrl}
            target="_blank"
            rel="noreferrer"
          >
            Görüşme Planla
          </a>
        </div>
      </nav>
    </header>
  );
}
