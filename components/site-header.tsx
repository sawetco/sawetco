import { Mail } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/icons";
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
    <header className="relative z-20 px-4 py-4 sm:px-10 sm:py-5">
      <nav
        className="hero-enter-header flex items-center justify-between"
        aria-label="Ana menü"
      >
        <div className="flex items-center gap-1">
          {socialLinks.map(({ label, href, icon: Icon }) => (
            <Tooltip key={label}>
              <TooltipTrigger
                render={
                  <a
                    href={href}
                    aria-label={label}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon-sm" }),
                      "text-muted-foreground hover:text-foreground",
                    )}
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
