import { useEffect, useState, type ComponentType } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Menu,
  MessageCircleMore,
  ShieldCheck,
  X,
} from "lucide-react";

const SHOPIFY_APP_URL = "https://apps.shopify.com/veeko3-0";

const CURRENT_SITE_URL = "https://veeko-landing.vercel.app/";

type MotionMediaProps = {
  name: "mascot-hero" | "risk-analysis" | "ai-assistant" | "analytics" | "closing";
  alt: string;
  className?: string;
  priority?: boolean;
};

type Stage = {
  number: string;
  id: string;
  eyebrow: string;
  title: string;
  copy: string;
  media: MotionMediaProps["name"];
  alt: string;
  Icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const STAGES: Stage[] = [
  {
    number: "1.0",
    id: "risk",
    eyebrow: "Detect risk",
    title: "See the signal before it becomes a problem.",
    copy: "Veeko combines AI signals with rule-based analysis to flag suspicious orders and surface issues the moment they appear.",
    media: "risk-analysis",
    alt: "Veeko reviewing an order list beside a protective shield and a highlighted risk signal.",
    Icon: ShieldCheck,
  },
  {
    number: "2.0",
    id: "assistant",
    eyebrow: "Ask Veeko",
    title: "Turn store questions into clear answers.",
    copy: "Ask about orders, revenue, customers, and more. Veeko turns your Shopify data into immediate, useful answers—whenever you need them.",
    media: "ai-assistant",
    alt: "Veeko beside a calm conversation interface with a sequence of message shapes.",
    Icon: MessageCircleMore,
  },
  {
    number: "3.0",
    id: "analytics",
    eyebrow: "Decide clearly",
    title: "Understand the pattern. Choose the next move.",
    copy: "See the story behind store performance with visual analytics and comprehensive reports built for faster, data-informed decisions.",
    media: "analytics",
    alt: "Veeko presenting a visual dashboard with revenue, customer, and performance signals.",
    Icon: BarChart3,
  },
];

function useStaticMedia() {
  const [isStatic, setIsStatic] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean };
      }
    ).connection;

    const sync = () => setIsStatic(preference.matches || Boolean(connection?.saveData));
    sync();
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);

  return isStatic;
}

function MotionMedia({ name, alt, className = "", priority = false }: MotionMediaProps) {
  const isStatic = useStaticMedia();
  const poster = `/veeko/${name}-poster.webp`;

  if (isStatic) {
    return (
      <img
        className={className}
        src={poster}
        alt={alt}
        width={name === "closing" ? 1280 : name === "mascot-hero" ? 720 : 960}
        height={name === "closing" ? 720 : name === "mascot-hero" ? 720 : 640}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
      />
    );
  }

  return (
    <video
      className={className}
      autoPlay
      loop
      muted
      playsInline
      preload={priority ? "auto" : "none"}
      poster={poster}
      aria-label={alt}
      {...(priority ? { fetchPriority: "high" as const } : {})}
    >
      <source src={`/veeko/${name}-loop.webm`} type="video/webm" />
      <track
        kind="captions"
        src="/veeko/motion-captions.vtt"
        srcLang="en"
        label="English"
      />
    </video>
  );
}

function BrandMark() {
  return (
    <a className="brand-mark" href="#top" aria-label="Veeko home">
      <span className="brand-dot" aria-hidden="true" />
      VEEKO
    </a>
  );
}

function ExternalLink({
  className = "",
  children,
  tabIndex,
}: {
  className?: string;
  children: React.ReactNode;
  tabIndex?: number;
}) {
  return (
    <a
      className={className}
      href={SHOPIFY_APP_URL}
      target="_blank"
      rel="noreferrer"
      tabIndex={tabIndex}
    >
      {children}
    </a>
  );
}

function SiteNavigation() {
  const [bannerOpen, setBannerOpen] = useState(true);
  const [retracted, setRetracted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const bannerVisible = bannerOpen && !retracted;

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        if (currentY < 24) setRetracted(false);
        else if (currentY > lastY + 6 && currentY > 48) setRetracted(true);
        else if (currentY < lastY - 6) setRetracted(false);
        lastY = currentY;
        frame = 0;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const links = [
    ["How it works", "#workflow"],
    ["Risk", "#risk"],
    ["Veeko AI", "#assistant"],
    ["Analytics", "#analytics"],
  ] as const;

  return (
    <div className="site-chrome">
      {bannerOpen && (
        <aside
          className={`announcement ${bannerVisible ? "" : "announcement--retracted"}`}
          aria-label="Shopify availability"
          aria-hidden={!bannerVisible}
        >
          <div className="announcement__inner">
            <span>Available on the Shopify App Store</span>
            <ExternalLink className="announcement__link" tabIndex={bannerVisible ? 0 : -1}>
              View listing <ArrowUpRight aria-hidden="true" />
            </ExternalLink>
            <button
              className="icon-button announcement__close"
              type="button"
              aria-label="Dismiss announcement"
              tabIndex={bannerVisible ? 0 : -1}
              onClick={() => setBannerOpen(false)}
            >
              <X aria-hidden="true" />
            </button>
          </div>
        </aside>
      )}

      <header className={`site-header ${bannerVisible ? "" : "site-header--raised"}`}>
        <div className="site-header__inner">
          <BrandMark />
          <nav className="desktop-nav" aria-label="Primary navigation">
            {links.map(([label, href]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <ExternalLink className="header-cta">
              View on Shopify <ArrowUpRight aria-hidden="true" />
            </ExternalLink>
            <button
              className="icon-button menu-toggle"
              type="button"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </div>

        <nav
          id="mobile-navigation"
          className={`mobile-nav ${menuOpen ? "mobile-nav--open" : ""}`}
          aria-label="Mobile navigation"
        >
          {links.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}>
              {label} <ArrowRight aria-hidden="true" />
            </a>
          ))}
          <ExternalLink className="mobile-nav__cta">
            View on Shopify <ArrowUpRight aria-hidden="true" />
          </ExternalLink>
        </nav>
      </header>
    </div>
  );
}

function Hero() {
  return (
    <section id="top" className="hero-section">
      <div className="page-shell hero-layout">
        <div className="hero-copy">
          <p className="eyebrow">AI-powered Shopify intelligence</p>
          <h1>
            See risk. Ask <span>Veeko.</span> Act.
          </h1>
          <p className="hero-lede">
            Veeko reads orders, revenue, and customer signals, then answers the questions that matter.
          </p>
          <div className="hero-actions">
            <ExternalLink className="button button--primary">
              View Shopify listing <ArrowUpRight aria-hidden="true" />
            </ExternalLink>
            <a className="text-link" href="#workflow">
              See how it works <ArrowDown aria-hidden="true" />
            </a>
          </div>
        </div>

        <figure className="hero-visual">
          <div className="hero-visual__index" aria-hidden="true">
            <span>VKO / 01</span>
            <span>Store intelligence</span>
          </div>
          <MotionMedia
            name="mascot-hero"
            alt="Veeko, a calm hooded AI companion with cyan eyes and champagne-metal details."
            className="hero-visual__media"
            priority
          />
          <figcaption>
            A calm co-pilot for the signals behind your store.
          </figcaption>
        </figure>
      </div>

      <div className="page-shell capability-index" aria-label="Veeko capabilities">
        <span>Risk signals</span>
        <span>Instant answers</span>
        <span>Visual analytics</span>
        <span>Shopify intelligence</span>
      </div>
    </section>
  );
}

function WorkflowStage({ stage, index }: { stage: Stage; index: number }) {
  const { Icon } = stage;
  return (
    <article id={stage.id} className={`workflow-stage ${index % 2 ? "workflow-stage--reverse" : ""}`}>
      <div className="workflow-stage__copy">
        <div className="stage-meta">
          <span className="stage-number">{stage.number}</span>
          <span className="stage-label">
            <Icon className="stage-icon" aria-hidden={true} />
            {stage.eyebrow}
          </span>
        </div>
        <h3>{stage.title}</h3>
        <p>{stage.copy}</p>
        <ExternalLink className="text-link text-link--forward">
          Explore Veeko <ArrowRight aria-hidden="true" />
        </ExternalLink>
      </div>

      <figure className="workflow-stage__visual">
        <MotionMedia name={stage.media} alt={stage.alt} className="workflow-stage__media" />
        <figcaption>
          <span>Veeko workflow</span>
          <span>{stage.number}</span>
        </figcaption>
      </figure>
    </article>
  );
}

function Workflow() {
  return (
    <section id="workflow" className="workflow-section">
      <div className="page-shell">
        <header className="section-intro">
          <p className="eyebrow">From signal to action</p>
          <h2>One calm loop for the questions behind your store.</h2>
          <p>
            Veeko brings risk analysis, conversational insight, and analytics into one focused Shopify workflow.
          </p>
        </header>

        <div className="workflow-list">
          {STAGES.map((stage, index) => (
            <WorkflowStage key={stage.number} stage={stage} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingSection() {
  return (
    <section className="closing-section" aria-labelledby="closing-title">
      <div className="page-shell">
        <div className="closing-frame">
          <MotionMedia
            name="closing"
            alt="Veeko holding a Shopify parcel inside a protective arc."
            className="closing-media"
          />
          <div className="closing-copy">
            <p className="eyebrow">Your next signal is already here</p>
            <h2 id="closing-title">Protect the store you’re building.</h2>
            <p>Bring sharper risk signals, faster answers, and clearer decisions into the work you do every day.</p>
            <ExternalLink className="button button--ink">
              Meet Veeko on Shopify <ArrowUpRight aria-hidden="true" />
            </ExternalLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const ticker = "VEEKO · SHOPIFY INTELLIGENCE · RISK · ANSWERS · ANALYTICS · ";
  return (
    <footer className="site-footer">
      <div className="ticker" aria-label="Veeko, Shopify intelligence, risk, answers, analytics" tabIndex={0}>
        <div className="ticker__track" aria-hidden="true">
          <span>{ticker}</span>
          <span>{ticker}</span>
          <span>{ticker}</span>
          <span>{ticker}</span>
        </div>
      </div>

      <div className="page-shell footer-meta">
        <p>Portfolio concept for Veeko · 2026</p>
        <div className="footer-links">
          <a href={CURRENT_SITE_URL} target="_blank" rel="noreferrer">
            Current site <ArrowUpRight aria-hidden="true" />
          </a>
          <ExternalLink>
            Shopify listing <ArrowUpRight aria-hidden="true" />
          </ExternalLink>
        </div>
      </div>
    </footer>
  );
}

function App() {
  return (
    <>
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-3 focus:text-paper focus:whitespace-nowrap"
        href="#main-content"
      >
        Skip to content
      </a>
      <SiteNavigation />
      <main id="main-content">
        <Hero />
        <Workflow />
        <ClosingSection />
      </main>
      <Footer />
    </>
  );
}

export default App;
