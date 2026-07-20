import Image from "next/image";
import { ContributionCalendar } from "@/components/contribution-calendar";
import { CalculatrIcon } from "@/components/icons";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site";

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "sawet",
    url: siteConfig.url,
    image: `${siteConfig.url}/images/samet.png`,
    jobTitle: "Full Stack Developer",
    description: siteConfig.description,
    email: `mailto:${siteConfig.email}`,
    knowsAbout: [
      "Next.js",
      "Web Development",
      "E-commerce",
      "Web Performance",
      "Technical SEO",
      "Digital Infrastructure",
    ],
    sameAs: [siteConfig.github, siteConfig.linkedin],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: "tr-TR",
  },
];

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Değerler yalnızca yerel, sabit site yapılandırmasından üretiliyor.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <SiteHeader />

      <section
        className="grid min-h-[max(760px,100svh)] place-items-center px-4 pt-27 pb-16 sm:px-5 sm:pt-30 sm:pb-20"
        aria-labelledby="intro-title"
      >
        <div className="w-full min-w-0 max-w-180">
          <h1
            id="intro-title"
            className="mx-auto w-fit max-w-full text-center text-[clamp(var(--text-base),5vw,var(--text-4xl))] leading-snug font-normal tracking-tight text-muted-foreground"
          >
            <span className="whitespace-nowrap">
              <span className="text-foreground">
                bu{" "}
                <Image
                  className="mx-0.5 inline-block size-[1em] rounded-full border align-middle"
                  src="/images/samet.png"
                  alt=""
                  width={48}
                  height={48}
                  priority
                />{" "}
                sawet
              </span>
              <span aria-hidden="true"> — </span>
              <span className="text-foreground/50">
                web'de bir şeyler tasarlayan
              </span>
            </span>
            <br />
            <span className="whitespace-nowrap text-foreground/50">
              ve geliştiren full-stack developer. şu
            </span>{" "}
            <br />
            <span className="whitespace-nowrap">
              <span className="text-foreground/50">sıralar</span>{" "}
              <a
                aria-label="calculatr.app ana sayfa"
                className="inline-flex items-center gap-1.5 align-bottom select-none sm:gap-2.5"
                href={siteConfig.project}
                target="_blank"
                rel="noreferrer"
              >
                <CalculatrIcon className="size-[0.9em] shrink-0" />
                calculatr.app
              </a>{" "}
              <span className="text-foreground/50">üzerinde çalışıyor.</span>
            </span>
          </h1>

          <ContributionCalendar />
        </div>
      </section>
    </>
  );
}
