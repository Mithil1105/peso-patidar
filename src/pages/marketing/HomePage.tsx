import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MarketingShell, FullBleedBand, ScrollReveal } from "@/components/marketing";
import StaggerContainer, { StaggerItem } from "@/components/marketing/StaggerContainer";
import { SEOHead } from "@/components/SEOHead";
import { FAQAccordion } from "@/components/marketing/sections";
import type { FAQItem } from "@/components/marketing/sections";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/siteConfig";
import { homepageGraphSchema } from "@/lib/schema/jsonLd";
import {
  ArrowRight,
  Eye,
  Clock,
  AlertTriangle,
  FileWarning,
  Zap,
  TrendingUp,
  Shield,
  FileText,
  CheckCircle,
  Users,
  BarChart,
} from "lucide-react";

const MockDashboardLarge = lazy(() =>
  import("@/components/marketing/mocks/MockDashboardLarge").then((m) => ({ default: m.MockDashboardLarge }))
);
const DemoMotionPanel = lazy(() =>
  import("@/components/marketing/mocks/DemoMotionPanel").then((m) => ({ default: m.DemoMotionPanel }))
);
const LogoWall = lazy(() =>
  import("@/components/marketing/sections/LogoWall").then((m) => ({ default: m.LogoWall }))
);
const Testimonials = lazy(() =>
  import("@/components/marketing/sections/Testimonials").then((m) => ({ default: m.Testimonials }))
);
const CTASection = lazy(() =>
  import("@/components/marketing/sections/CTASection").then((m) => ({ default: m.CTASection }))
);

const HOME_TITLE = "PesoWise | Smart Expense & Cash Flow Management";
const HOME_DESCRIPTION =
  "Simplify petty cash, expenses, and operational finance with PesoWise. Built for growing businesses that need better visibility and control.";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is PesoWise?",
    answer:
      "PesoWise is a cloud-based petty cash and expense management platform. Teams submit claims with receipts, follow configurable approval paths, and finance leaders see balances and history in one place—without spreadsheets or ad-hoc chat threads.",
  },
  {
    question: "Who is PesoWise for?",
    answer:
      "It fits finance-led organizations, distributed operations teams, and SMEs that issue petty cash or reimburse employees regularly. Multi-location and multi-organization setups are supported with isolated data per tenant.",
  },
  {
    question: "Can PesoWise track petty cash?",
    answer:
      "Yes. You can track balances, transfers, and returns alongside expenses so cash on hand stays aligned with approved spend and audit expectations.",
  },
  {
    question: "Does PesoWise improve expense visibility?",
    answer:
      "Approved expenses, pending items, and category-level activity are visible to authorized roles. Timestamped actions help explain who approved or adjusted a record when questions arise.",
  },
  {
    question: "Is PesoWise suitable for small and mid-sized businesses?",
    answer:
      "The product is designed to scale from focused teams to larger org charts with engineers, cashiers, and admins. Policies and limits can be tuned per organization.",
  },
  {
    question: "How do I get started?",
    answer:
      "Use the contact page to tell us about your workflow. We will help with onboarding, configuration, and training so your first expenses run on PesoWise quickly.",
  },
];

const painPoints = [
  { icon: Eye, text: "No visibility on who spent what" },
  { icon: Clock, text: "Manual approvals & delays" },
  { icon: AlertTriangle, text: "Balance mismatches and errors" },
  { icon: FileWarning, text: "No audit trail or compliance" },
];

const howItWorksSteps = [
  {
    step: "1",
    title: "Submit Expense",
    description: "Employees submit expense reports with receipts in seconds",
    icon: FileText,
  },
  {
    step: "2",
    title: "Verify & Review",
    description: "Engineers and managers verify expenses with full context",
    icon: CheckCircle,
  },
  {
    step: "3",
    title: "Approve & Track",
    description: "Admin approves and balances update automatically",
    icon: Users,
  },
  {
    step: "4",
    title: "Report & Audit",
    description: "Generate reports and maintain complete audit trails",
    icon: BarChart,
  },
];

const whyPesoWise = [
  {
    icon: Zap,
    title: "Faster Approvals",
    description:
      "Streamlined workflow moves expenses from submission to approval in hours, not days.",
  },
  {
    icon: TrendingUp,
    title: "Real-time Balances",
    description:
      "Always know how much petty cash is available across people and locations you authorize.",
  },
  {
    icon: Shield,
    title: "Audit-ready Records",
    description: "Every transaction is logged with timestamps, actors, and complete documentation.",
  },
];

function HeroVisualFallback() {
  return (
    <div
      className="min-h-[280px] lg:min-h-[320px] rounded-2xl border border-border bg-muted/40 animate-pulse"
      aria-hidden
    />
  );
}

const HomePage = () => {
  const canonical = absoluteUrl("/");
  const structuredData = homepageGraphSchema(FAQ_ITEMS);

  return (
    <MarketingShell>
      <SEOHead
        title={HOME_TITLE}
        description={HOME_DESCRIPTION}
        canonicalUrl={canonical}
        ogImage={DEFAULT_OG_IMAGE}
        structuredData={structuredData}
      />

      <FullBleedBand variant="hero" className="py-20 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <ScrollReveal variant="fade-up">
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-[2.75rem]">
              Smart Expense and Petty Cash Management for Growing Businesses
            </h1>
            <p className="mb-4 text-lg text-muted-foreground md:text-xl">
              Track employee expenses, automate approvals, and control balances — all in one secure
              platform.
            </p>
            <p className="mb-6 text-sm text-muted-foreground">
              Built for modern teams • Secure • Multi-organization ready
            </p>
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
              Explore{" "}
              <Link to="/features" className="text-primary underline-offset-4 hover:underline font-medium">
                product features
              </Link>
              , see{" "}
              <Link to="/how-it-works" className="text-primary underline-offset-4 hover:underline font-medium">
                how workflows run
              </Link>
              , review{" "}
              <Link to="/pricing" className="text-primary underline-offset-4 hover:underline font-medium">
                pricing
              </Link>
              , or read our approach to{" "}
              <Link to="/security" className="text-primary underline-offset-4 hover:underline font-medium">
                security
              </Link>
              . Questions?{" "}
              <Link to="/contact" className="text-primary underline-offset-4 hover:underline font-medium">
                Contact us
              </Link>{" "}
              or review the{" "}
              <Link to="/privacy" className="text-primary underline-offset-4 hover:underline font-medium">
                privacy policy
              </Link>{" "}
              and{" "}
              <Link to="/toc" className="text-primary underline-offset-4 hover:underline font-medium">
                terms
              </Link>
              .
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="btn-glow group">
                <Link to="/contact">
                  Request demo
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">Login</Link>
              </Button>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fade-left" delay={0.2}>
            <div className="relative">
              <Suspense fallback={<HeroVisualFallback />}>
                <MockDashboardLarge />
              </Suspense>
              <div className="absolute -bottom-4 -right-4 w-64 md:w-72 hidden sm:block">
                <Suspense fallback={null}>
                  <DemoMotionPanel />
                </Suspense>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </FullBleedBand>

      {/* Expanded crawlable intro (AEO / thin content mitigation) */}
      <FullBleedBand className="py-16 border-t border-border/50">
        <div className="mx-auto max-w-3xl space-y-6 text-muted-foreground leading-relaxed">
          <h2 className="text-2xl font-bold text-foreground">What PesoWise is</h2>
          <p>
            PesoWise is operations finance software for organizations that still wrestle with petty
            cash, informal approvals, and scattered receipts. It replaces fragile spreadsheets and chat
            threads with a single workflow: capture spend, route it to the right approvers, and keep
            balances truthful in near real time.
          </p>
          <h2 className="text-2xl font-bold text-foreground pt-2">Who it is for</h2>
          <p>
            Finance managers, COOs, and admin leads use PesoWise when they need consistent policy across
            branches or project sites. It fits teams that already take compliance seriously but lack a
            lightweight system that employees will actually use in the field.
          </p>
          <h2 className="text-2xl font-bold text-foreground pt-2">Why it matters</h2>
          <p>
            Opaque cash processes hide leakage, slow reimbursements, and create friction between
            operations and finance. PesoWise makes intent, evidence, and authority explicit so month-end
            reviews are faster and auditors see a coherent trail without chasing individuals for
            screenshots.
          </p>
          <p>
            If you are evaluating tools, start with our{" "}
            <Link className="text-primary underline-offset-4 hover:underline" to="/features">
              feature overview
            </Link>{" "}
            and{" "}
            <Link className="text-primary underline-offset-4 hover:underline" to="/contact">
              book a conversation
            </Link>{" "}
           —we will map your roles, limits, and rollout without reshaping your brand or internal jargon.
          </p>
        </div>
      </FullBleedBand>

      <FullBleedBand variant="soft">
        <ScrollReveal variant="fade-up">
          <Suspense fallback={<div className="h-24" />}>
            <LogoWall />
          </Suspense>
        </ScrollReveal>
      </FullBleedBand>

      <FullBleedBand className="py-20">
        <ScrollReveal className="text-center mb-12">
          <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
            Still managing petty cash on spreadsheets, WhatsApp, or emails?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Most teams struggle with manual expense tracking that leads to:
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {painPoints.map((point, index) => (
            <StaggerItem key={index}>
              <div className="flex items-center gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4 h-full">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                  <point.icon className="h-5 w-5 text-destructive" />
                </div>
                <span className="text-sm font-medium text-foreground">{point.text}</span>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </FullBleedBand>

      <FullBleedBand variant="soft" className="py-20">
        <ScrollReveal className="text-center mb-12">
          <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">How PesoWise Works</h2>
          <p className="text-muted-foreground">
            A simple, four-step process to streamline your expense management
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {howItWorksSteps.map((step, index) => (
            <StaggerItem key={index}>
              <div className="relative rounded-xl border border-border bg-card p-6 shadow-soft card-hover h-full">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {step.step}
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <ScrollReveal delay={0.3}>
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link to="/how-it-works">
                Learn more about the workflow
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>
      </FullBleedBand>

      <FullBleedBand className="py-20">
        <ScrollReveal className="text-center mb-12">
          <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">Why PesoWise?</h2>
          <p className="text-muted-foreground">
            Built for teams that need operational clarity—not another generic expense form
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid gap-8 md:grid-cols-3">
          {whyPesoWise.map((item, index) => (
            <StaggerItem key={index}>
              <div className="rounded-xl border border-border bg-card p-8 shadow-soft card-hover text-center h-full">
                <div className="mb-6 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </FullBleedBand>

      <FullBleedBand variant="soft" className="py-20">
        <ScrollReveal className="mx-auto max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-4">
            Frequently asked questions
          </h2>
          <p className="text-center text-muted-foreground mb-10 text-sm">
            Direct answers for buyers and teams researching expense and petty cash software.
          </p>
          <FAQAccordion items={FAQ_ITEMS} />
        </ScrollReveal>
      </FullBleedBand>

      <FullBleedBand variant="soft">
        <ScrollReveal>
          <Suspense fallback={<div className="min-h-[200px]" />}>
            <Testimonials />
          </Suspense>
        </ScrollReveal>
      </FullBleedBand>

      <FullBleedBand className="py-20">
        <ScrollReveal variant="scale">
          <Suspense fallback={<div className="min-h-[120px]" />}>
            <CTASection />
          </Suspense>
        </ScrollReveal>
      </FullBleedBand>
    </MarketingShell>
  );
};

export default HomePage;
