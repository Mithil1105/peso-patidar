import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Section, SectionBand } from "@/components/marketing/Section";
import { HeroBackdrop } from "@/components/marketing/HeroBackdrop";
import { FloatingOrbs } from "@/components/marketing/FloatingOrbs";
import { FlowDiagramIllustration } from "@/components/marketing/PageIllustrations";
import { SEOHead } from "@/components/SEOHead";
import {
    FileText,
    Send,
    CheckCircle2,
    ArrowRight,
    Users,
    BarChart3,
    Wallet,
    Clock,
    MessageSquare,
    Bell
} from "lucide-react";

export default function HowItWorksPage() {
    const navigate = useNavigate();

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What is PesoWise used for?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "PesoWise is used to manage petty cash and employee expenses with approval workflows, receipt tracking, and balance management."
                }
            },
            {
                "@type": "Question",
                "name": "How does the expense submission process work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Employees create expense reports with details and receipts, save as draft if needed, then submit for review. The expense enters an approval pipeline where engineers verify and admins provide final approval."
                }
            },
            {
                "@type": "Question",
                "name": "Can engineers approve expenses?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, engineers can approve expenses within their configured approval limit. Expenses exceeding the limit are automatically forwarded to admins for final approval."
                }
            },
            {
                "@type": "Question",
                "name": "What happens when an expense is rejected?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When an expense is rejected, the employee receives a notification with the reason. They can then edit and resubmit the expense, or create a new one."
                }
            },
            {
                "@type": "Question",
                "name": "Are receipts required for expenses?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Receipts are optional but highly recommended for audit purposes. Organizations can configure whether receipts are mandatory for certain expense types or amounts."
                }
            },
            {
                "@type": "Question",
                "name": "How do balances update in PesoWise?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Balances update automatically when expenses are approved. Cashiers can add funds, and transfers between accounts are tracked with complete history. All balance changes are logged for audit purposes."
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
                "name": "How It Works",
                "item": "https://pesowise.com/how-it-works"
            }
        ]
    };

    return (
        <>
            <SEOHead
                title="How PesoWise Works – Expense & Petty Cash Workflow Explained"
                description="Learn how PesoWise streamlines petty cash and expense management with structured roles, approvals, and real-time balance tracking."
                canonicalUrl="https://pesowise.com/how-it-works"
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
                                From receipt upload to approval—fully streamlined
                            </h1>
                            <p className="text-xl text-gray-600">
                                PesoWise maps exactly to how teams handle petty cash in real life, with structured roles and clean steps.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                <Button size="lg" onClick={() => navigate("/contact")} className="text-lg px-8">
                                    Contact Us
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                                <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg px-8">
                                    Login
                                </Button>
                            </div>
                        </div>
                        <div className="relative w-full max-w-none lg:justify-self-end">
                            <FlowDiagramIllustration />
                        </div>
                    </div>
                </Section>

                {/* 4-step Overview */}
                <SectionBand>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
                    <p className="text-center text-gray-600 mb-8">
                        Explore our complete <a href="/features" className="text-blue-600 hover:underline font-medium">expense management features</a> that power this workflow.
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="text-center">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-blue-600">1</span>
                                </div>
                                <CardTitle>Create & Draft</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="text-center">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-green-600">2</span>
                                </div>
                                <CardTitle>Submit for Review</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="text-center">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-purple-600">3</span>
                                </div>
                                <CardTitle>Verify & Approve</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="text-center">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-orange-600">4</span>
                                </div>
                                <CardTitle>Balance Updates + Records Stored</CardTitle>
                            </CardHeader>
                        </Card>
                    </div>
                </SectionBand>

                {/* Employee Flow */}
                <Section>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Employee Flow</h2>
                    <div className="space-y-6 max-w-3xl mx-auto">
                        <div className="flex items-start gap-4">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 font-semibold">1</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Login → Dashboard</h3>
                                <p className="text-gray-600">See balance + recent statuses</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 font-semibold">2</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Create an expense</h3>
                                <p className="text-gray-600">Fields + receipt</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 font-semibold">3</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Submit</h3>
                                <p className="text-gray-600">Status Submitted, enters pipeline</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 font-semibold">4</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Track progress</h3>
                                <p className="text-gray-600">See notes, resubmit on reject</p>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* Engineer Flow */}
                <SectionBand>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Engineer Flow</h2>
                    <div className="space-y-6 max-w-3xl mx-auto">
                        <p className="text-gray-700">Pending reviews, validate receipts/details, add comments examples:</p>
                        <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-2">
                            <p className="text-sm text-gray-600">• Receipt unclear</p>
                            <p className="text-sm text-gray-600">• Amount mismatch</p>
                            <p className="text-sm text-gray-600">• Vendor missing</p>
                        </div>
                        <p className="text-gray-700 pt-4">Routing: within limit approve, beyond forward to admin</p>
                    </div>
                </SectionBand>

                {/* Admin Flow */}
                <Section>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Admin Flow</h2>
                    <div className="space-y-6 max-w-3xl mx-auto">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Dashboard includes:</h3>
                            <ul className="space-y-2 text-gray-600">
                                <li>• Pending approvals</li>
                                <li>• Total balances</li>
                                <li>• Trends</li>
                                <li>• Activity overview</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Admin actions:</h3>
                            <ul className="space-y-2 text-gray-600">
                                <li>• Create/manage users</li>
                                <li>• Approve/reject</li>
                                <li>• Set limits/rules</li>
                                <li>• Categories/locations</li>
                                <li>• Export CSV</li>
                            </ul>
                        </div>
                    </div>
                </Section>

                {/* Cashier Flow */}
                <SectionBand>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Cashier Flow</h2>
                    <div className="space-y-4 text-gray-700 max-w-3xl mx-auto">
                        <p>Add funds, process return requests, view history, track movement</p>
                    </div>
                </SectionBand>

                {/* Timeline + Notifications */}
                <Section>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Timeline + Notifications</h2>
                    <div className="space-y-6 max-w-3xl mx-auto">
                        <p className="text-gray-700">Timeline entries for each status change</p>
                        <div className="flex items-start gap-3">
                            <Bell className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-gray-700">Notifications: in-app real-time + optional email</p>
                        </div>
                    </div>
                </Section>

                {/* FAQ */}
                <SectionBand>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h2>
                    <div className="max-w-3xl mx-auto">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>What is PesoWise used for?</AccordionTrigger>
                                <AccordionContent>
                                    PesoWise is used to manage petty cash and employee expenses with approval workflows, receipt tracking, and balance management.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>How does the expense submission process work?</AccordionTrigger>
                                <AccordionContent>
                                    Employees create expense reports with details and receipts, save as draft if needed, then submit for review. The expense enters an approval pipeline where engineers verify and admins provide final approval.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>Can engineers approve expenses?</AccordionTrigger>
                                <AccordionContent>
                                    Yes, engineers can approve expenses within their configured approval limit. Expenses exceeding the limit are automatically forwarded to admins for final approval.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-4">
                                <AccordionTrigger>What happens when an expense is rejected?</AccordionTrigger>
                                <AccordionContent>
                                    When an expense is rejected, the employee receives a notification with the reason. They can then edit and resubmit the expense, or create a new one.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-5">
                                <AccordionTrigger>Are receipts required for expenses?</AccordionTrigger>
                                <AccordionContent>
                                    Receipts are optional but highly recommended for audit purposes. Organizations can configure whether receipts are mandatory for certain expense types or amounts.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-6">
                                <AccordionTrigger>How do balances update in PesoWise?</AccordionTrigger>
                                <AccordionContent>
                                    Balances update automatically when expenses are approved. Cashiers can add funds, and transfers between accounts are tracked with complete history. All balance changes are logged for audit purposes.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </SectionBand>

                {/* SEO Reinforcement */}
                <Section className="py-12">
                    <div className="max-w-4xl mx-auto text-center">
                        <p className="text-gray-700 text-lg leading-relaxed">
                            PesoWise streamlines the expense approval workflow from submission to final approval. Our employee expense tracking system automates the entire process, ensuring balances update in real-time and maintaining complete audit trails for compliance.
                        </p>
                    </div>
                </Section>

                {/* Bottom CTA */}
                <SectionBand className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold mb-8">
                            Want to see the workflow on your real use-case?
                        </h2>
                        <Button size="lg" variant="secondary" onClick={() => navigate("/contact")} className="text-lg px-8">
                            Book a Demo
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </SectionBand>
            </MarketingLayout>
        </>
    );
}
