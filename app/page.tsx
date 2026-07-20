import Image from "next/image";
import { ContributionCalendar } from "@/components/contribution-calendar";
import { CalculatrIcon } from "@/components/icons";
import { ProjectImage } from "@/components/project-image";
import { ScrollReveal } from "@/components/scroll-reveal";
import { SideRays } from "@/components/side-rays";
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
      "React",
      "WordPress",
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

const projects = [
  {
    id: "calculatr-project-title",
    name: "calculatr.app",
    href: "https://calculatr.app",
    description: "ücretsiz ve hızlı hesaplama araçları.",
    category: "web uygulaması",
    year: "2026",
    image: "/projects/calculatr.png",
    imageAlt: "calculatr.app projesinin ana sayfa arayüzü",
    icon: <CalculatrIcon className="size-5 md:size-6 lg:size-7 shrink-0" />,
  },
  {
    id: "rdronline-project-title",
    name: "Red Dead Online Türkiye",
    href: "https://rdronline.tr",
    description: "rehber ve kaynak merkezi.",
    category: "içerik platformu",
    year: "2026",
    image: "/projects/rdronline.png",
    imageAlt: "Red Dead Online Türkiye web sitesinin ana sayfa arayüzü",
    icon: (
      <Image
        className="size-5 md:size-6 lg:size-7 shrink-0 object-contain"
        src="/projects/rdronline-icon.png"
        alt=""
        width={28}
        height={28}
      />
    ),
  },
  {
    id: "esme-project-title",
    name: "Eşme Belediye Başkanlığı",
    href: "https://esme.bel.tr",
    description: "resmi web portalı.",
    category: "kurumsal",
    year: "2025",
    image: "/projects/esme.png",
    imageAlt: "Eşme Belediyesi web sitesinin ana sayfa arayüzü",
    icon: (
      <Image
        className="size-5 md:size-6 lg:size-7 shrink-0 object-contain"
        src="/projects/esme-icon.png"
        alt=""
        width={28}
        height={28}
      />
    ),
  },
] as const;

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
      <div className="relative isolate min-h-svh overflow-hidden">
        <div
          className="hero-enter-rays absolute inset-0 -z-10"
          aria-hidden="true"
        >
          <div className="absolute top-0 right-0 h-full w-256 lg:w-full">
            <SideRays
              rayColor1="#1d4ed8"
              rayColor2="#2563eb"
              origin="top-right"
              speed={2}
              intensity={2}
              spread={2.5}
              tilt={0}
              saturation={1.5}
              blend={0.5}
              falloff={2}
              opacity={0.5}
            />
          </div>
        </div>

        <SiteHeader />

        <section
          className="grid min-h-[calc(100svh-4rem)] place-items-center px-4 pt-11 pb-16 sm:min-h-[calc(100svh-4.5rem)] sm:px-5 sm:pt-12 sm:pb-20"
          aria-labelledby="intro-title"
        >
          <div className="hero-enter-content w-full min-w-0 max-w-180">
            <h1
              id="intro-title"
              className="mx-auto w-fit max-w-full text-center text-[clamp(var(--text-base),5vw,var(--text-4xl))] leading-snug font-normal tracking-tight text-muted-foreground"
            >
              <span className="whitespace-nowrap">
                <span className="text-foreground">
                  bu{" "}
                  <Image
                    className="mx-0.5 inline-block size-[1em] rounded-full border align-middle select-none"
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
                ve geliştiren full stack developer. şu
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
      </div>

      <section
        className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-5 sm:py-12 2xl:px-0"
        aria-label="Projeler"
      >
        <div className="space-y-20 sm:space-y-28">
          {projects.map((project) => (
            <article key={project.id} aria-labelledby={project.id}>
              <ScrollReveal>
                <header className="grid grid-cols-1 items-start gap-3 text-center text-lg md:grid-cols-[minmax(0,1fr)_auto] md:gap-6 md:text-left md:text-xl lg:text-2xl">
                  <div className="min-w-0">
                    <h2
                      id={project.id}
                      className="flex min-w-0 flex-col items-center gap-1 md:flex-row md:gap-1.5"
                    >
                      <a
                        className="inline-flex items-center gap-2 whitespace-nowrap font-medium text-foreground"
                        href={project.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {project.icon}
                        <span>{project.name}</span>
                      </a>
                      <span className="text-muted-foreground">
                        {project.description}
                      </span>
                    </h2>
                  </div>
                  <div className="md:text-right">
                    <p className="whitespace-nowrap">
                      <span className="text-foreground">
                        {project.category}
                      </span>
                      <span className="text-muted-foreground">
                        , {project.year}
                      </span>
                    </p>
                  </div>
                </header>
              </ScrollReveal>

              <ScrollReveal className="mt-6 delay-100 sm:mt-8">
                <ProjectImage
                  src={project.image}
                  alt={project.imageAlt}
                  sizes="(min-width: 1536px) 1500px, (min-width: 640px) calc(100vw - 40px), calc(100vw - 32px)"
                />
              </ScrollReveal>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
