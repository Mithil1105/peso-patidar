import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Section, SectionBand } from "@/components/marketing/Section";
import { HeroBackdrop } from "@/components/marketing/HeroBackdrop";
import { FloatingOrbs } from "@/components/marketing/FloatingOrbs";
import { PricingCardsIllustration } from "@/components/marketing/PageIllustrations";
import { SEOHead } from "@/components/SEOHead";
import {
    CheckCircle2,
    ArrowRight,
    Zap,
    TrendingUp,
    Building2
} from "lucide-react";

export default function PricingPage() {
    const navigate = useNavigate();
    const [showStickyCTA, setShowStickyCTA] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowStickyCTA(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Does PesoWise support multiple organizations?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, all plans support multiple organizations with complete data isolation."
                }
            },
            {
                "@type": "Question",
                "name": "Can we control expense approvals?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, you can configure roles and approval limits. Growth and Enterprise plans include engineer verification stages."
                }
            },
            {
                "@type": "Question",
                "name": "Do balances update automatically?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, balances update automatically when expenses are approved. No manual calculations needed."
                }
            },
            {
                "@type": "Question",
                "name": "Do you provide invoices and onboarding?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Growth and Enterprise plans include dedicated onboarding and can provide invoices. Contact us for details."
                }
            },
            {
                "@type": "Question",
                "name": "Can we migrate from spreadsheets?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, we provide onboarding support to help migrate your existing data from spreadsheets or other systems."
                }
            }
        ]
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://pesowise.com/"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Pricing",
                "item": "https://pesowise.com/pricing"
            }
        ]
    };

    return (
        <>
            <SEOHead
                title="Pricing & Plans for Expense Management Software | PesoWise"
                description="View PesoWise pricing plans for teams of all sizes. Scalable expense management with approvals, analytics, and compliance."
                canonicalUrl="https://pesowise.com/pricing"
                faqSchema={faqSchema}
                structuredData={breadcrumbSchema}
            />
            <MarketingLayout>
                {/* Hero */}
                <Section className="relative py-20 overflow-hidden">
                    <div className="absolute inset-0 w-full">
                        <HeroBackdrop />
                        <FloatingOrbs />
                    </div>
                    <div className="relative grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
                        <div className="space-y-6">
                            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
                                Pricing that scales with your organization
                            </h1>
                            <p className="text-xl text-gray-600">
                                Start simple, upgrade when you need more controls, approvals, and analytics.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                <Button size="lg" onClick={() => navigate("/contact")} className="text-lg px-8">
                                    Contact Sales
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                                <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg px-8">
                                    Login
                                </Button>
                            </div>
                        </div>
                        <div className="relative w-full max-w-none lg:justify-self-end">
                            <PricingCardsIllustration />
                        </div>
                    </div>
                </Section>

                {/* Sticky CTA (Desktop only) */}
                {showStickyCTA && (
                    <div className="hidden lg:block fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 py-4">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">Need a tailored plan?</p>
                                <p className="text-sm text-gray-600">Contact us for custom pricing</p>
                            </div>
                            <Button onClick={() => navigate("/contact")} className="bg-blue-600 hover:bg-blue-700">
                                Contact Sales
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Pricing Cards */}
                <Section>
                    <p className="text-center text-gray-600 mb-8">
                        Compare our <a href="/features" className="text-blue-600 hover:underline font-medium">expense management features</a> across plans.
                    </p>
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Starter */}
                        <Card className="border-2 hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-2xl">Starter</CardTitle>
                                <CardDescription className="text-base">Best for: small teams & simple approvals</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-3 text-gray-700">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>Expense submission + receipts</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>Basic workflow</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>Role dashboards</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>Standard categories</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>Multi-org support</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>Email support</span>
                                    </li>
                                </ul>
                                <Button className="w-full mt-6" onClick={() => navigate("/contact")}>
                                    Get Started
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Growth */}
                        <Card className="border-2 border-blue-500 hover:shadow-lg transition-shadow relative">
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">Popular</span>
                            </div>
                            <CardHeader>
                                <CardTitle className="text-2xl">Growth</CardTitle>
                                <CardDescription className="text-base">Best for: multi-department teams</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-gray-600 mb-4">Everything in Starter +</p>
                                <ul className="space-y-3 text-gray-700">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>Engineer verification stage</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>Approval limits</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>Advanced analytics</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>CSV export</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>Location support</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>Priority support</span>
                                    </li>
                                </ul>
                                <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/contact")}>
                                    Request Demo
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Enterprise */}
                        <Card className="border-2 hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-2xl">Enterprise</CardTitle>
                                <CardDescription className="text-base">Best for: strict compliance + scale</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-gray-600 mb-4">Everything in Growth +</p>
                                <ul className="space-y-3 text-gray-700">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>Dedicated onboarding</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>SLA + compliance docs</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>Future: white-label + integrations <span className="text-xs text-gray-500">(Roadmap)</span></span>
                                    </li>
                                </ul>
                                <Button className="w-full mt-6" onClick={() => navigate("/contact")}>
                                    Talk to Us
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </Section>

                {/* Compare Plans Table */}
                <SectionBand>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Compare Plans</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b-2 border-gray-300">
                                    <th className="text-left p-4 font-semibold text-gray-900">Feature</th>
                                    <th className="text-center p-4 font-semibold text-gray-900">Starter</th>
                                    <th className="text-center p-4 font-semibold text-gray-900 bg-blue-50">Growth</th>
                                    <th className="text-center p-4 font-semibold text-gray-900">Enterprise</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-200">
                                    <td className="p-4 text-gray-700">Expense submission</td>
                                    <td className="p-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /></td>
                                    <td className="p-4 text-center bg-blue-50"><CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /></td>
                                    <td className="p-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /></td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="p-4 text-gray-700">Engineer verification</td>
                                    <td className="p-4 text-center">-</td>
                                    <td className="p-4 text-center bg-blue-50"><CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /></td>
                                    <td className="p-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /></td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="p-4 text-gray-700">Advanced analytics</td>
                                    <td className="p-4 text-center">-</td>
                                    <td className="p-4 text-center bg-blue-50"><CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /></td>
                                    <td className="p-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /></td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="p-4 text-gray-700">CSV export</td>
                                    <td className="p-4 text-center">-</td>
                                    <td className="p-4 text-center bg-blue-50"><CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /></td>
                                    <td className="p-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /></td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="p-4 text-gray-700">Dedicated onboarding</td>
                                    <td className="p-4 text-center">-</td>
                                    <td className="p-4 text-center bg-blue-50">-</td>
                                    <td className="p-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /></td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="p-4 text-gray-700">SLA + compliance docs</td>
                                    <td className="p-4 text-center">-</td>
                                    <td className="p-4 text-center bg-blue-50">-</td>
                                    <td className="p-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </SectionBand>

                {/* Pricing FAQ */}
                <Section>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Pricing FAQ</h2>
                    <div className="max-w-3xl mx-auto">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Does PesoWise support multiple organizations?</AccordionTrigger>
                                <AccordionContent>
                                    Yes, all plans support multiple organizations with complete data isolation.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>Can we control expense approvals?</AccordionTrigger>
                                <AccordionContent>
                                    Yes, you can configure roles and approval limits. Growth and Enterprise plans include engineer verification stages.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>Do balances update automatically?</AccordionTrigger>
                                <AccordionContent>
                                    Yes, balances update automatically when expenses are approved. No manual calculations needed.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-4">
                                <AccordionTrigger>Do you provide invoices and onboarding?</AccordionTrigger>
                                <AccordionContent>
                                    Growth and Enterprise plans include dedicated onboarding and can provide invoices. Contact us for details.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-5">
                                <AccordionTrigger>Can we migrate from spreadsheets?</AccordionTrigger>
                                <AccordionContent>
                                    Yes, we provide onboarding support to help migrate your existing data from spreadsheets or other systems.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </Section>

                {/* SEO Reinforcement */}
                <SectionBand className="py-12">
                    <div className="max-w-4xl mx-auto text-center">
                        <p className="text-gray-700 text-lg leading-relaxed">
                            PesoWise offers scalable pricing for expense management software that grows with your organization. From small teams needing basic expense tracking to enterprises requiring advanced analytics and compliance features, our plans provide the right level of expense approval workflow automation and audit-ready reporting.
                        </p>
                    </div>
                </SectionBand>

                {/* Bottom CTA */}
                <SectionBand className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold mb-8">
                            Ready to get started?
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" variant="secondary" onClick={() => navigate("/contact")} className="text-lg px-8">
                                Contact Sales
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                            <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg px-8 border-2 border-white text-white hover:bg-white/10">
                                Login
                            </Button>
                        </div>
                    </div>
                </SectionBand>
            </MarketingLayout>
        </>
    );
}
