import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Section, SectionBand } from "@/components/marketing/Section";
import { HeroBackdrop } from "@/components/marketing/HeroBackdrop";
import { FloatingOrbs } from "@/components/marketing/FloatingOrbs";
import { FeatureIllustration } from "@/components/marketing/FeatureIllustration";
import { ReceiptChecklistIllustration } from "@/components/marketing/PageIllustrations";
import { TestimonialCards } from "@/components/marketing/TestimonialCards";
import { GifSlot } from "@/components/marketing/GifSlot";
import { SEOHead } from "@/components/SEOHead";
import {
    FileText,
    Upload,
    CheckCircle2,
    ArrowRight,
    Users,
    BarChart3,
    Shield,
    Database,
    Download,
    Eye,
    MessageSquare,
    Clock,
    Wallet,
    Building2
} from "lucide-react";

export default function FeaturesPage() {
    const navigate = useNavigate();

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What expense management features does PesoWise offer?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "PesoWise offers expense tracking, receipt uploads, multi-step approval workflows, real-time balance tracking, multi-organization support, role-based dashboards, custom categories, audit logs, and CSV export capabilities."
                }
            },
            {
                "@type": "Question",
                "name": "Can PesoWise handle multiple organizations?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, PesoWise supports multi-organization expense management with strict data isolation. Each organization has separate categories, locations, balances, and user access."
                }
            },
            {
                "@type": "Question",
                "name": "How does the expense approval workflow work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Employees submit expenses, engineers can verify and approve within limits, and admins provide final approval. Approved expenses automatically update balances, while rejected expenses can be edited and resubmitted."
                }
            },
            {
                "@type": "Question",
                "name": "What file types are supported for receipt uploads?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "PesoWise supports PDF, PNG, and JPG file formats for receipt uploads. Receipts are stored securely with organization-level isolation and can be previewed or downloaded anytime."
                }
            },
            {
                "@type": "Question",
                "name": "Does PesoWise provide audit trails?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, PesoWise maintains comprehensive audit logs for all expense submissions, approval decisions, balance changes, and receipt events. Each action is traceable to the user and timestamp for compliance."
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
                "name": "Features",
                "item": "https://pesowise.com/features"
            }
        ]
    };

    return (
        <>
            <SEOHead
                title="Expense Management & Petty Cash Features | PesoWise"
                description="Explore PesoWise features including expense tracking, receipt uploads, approval workflows, balance management, and multi-organization support."
                canonicalUrl="https://pesowise.com/features"
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
                                Features built for real expense workflows
                            </h1>
                            <p className="text-xl text-gray-600">
                                Everything from expense capture to approvals, balances, receipts, and audit trails—structured, secure, and organization-ready.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                <Button size="lg" onClick={() => navigate("/contact")} className="text-lg px-8">
                                    Get Started
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                                <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg px-8">
                                    Login
                                </Button>
                            </div>
                        </div>
                        <div className="relative w-full max-w-none lg:justify-self-end">
                            <ReceiptChecklistIllustration />
                        </div>
                    </div>
                </Section>

                {/* Product Tour */}
                <SectionBand>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Product Tour</h2>
                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
                            <CardHeader>
                                <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg mb-4 flex items-center justify-center">
                                    <FileText className="h-12 w-12 text-blue-600" />
                                </div>
                                <CardTitle>Expense Creation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>Create structured expense reports with all required fields</CardDescription>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
                            <CardHeader>
                                <div className="h-32 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg mb-4 flex items-center justify-center">
                                    <Clock className="h-12 w-12 text-green-600" />
                                </div>
                                <CardTitle>Approval Timeline</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>Track every step from submission to approval</CardDescription>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
                            <CardHeader>
                                <div className="h-32 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg mb-4 flex items-center justify-center">
                                    <Wallet className="h-12 w-12 text-purple-600" />
                                </div>
                                <CardTitle>Balance Transfer</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>Seamless fund transfers with complete history</CardDescription>
                            </CardContent>
                        </Card>
                    </div>
                </SectionBand>

                {/* Expense Management */}
                <Section>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Expense Management</h2>
                    <p className="text-center text-gray-600 mb-8">
                        See how our <a href="/how-it-works" className="text-blue-600 hover:underline font-medium">expense workflow</a> processes these features in practice.
                    </p>

                    <div className="space-y-12">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div>
                                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Expense Reports (Fast + structured)</h3>
                                <p className="text-gray-700 mb-4">
                                    Create an expense with: Title, Destination/Vendor, Date, Amount, Category
                                </p>
                                <p className="text-gray-600 mb-4">Optional: Purpose / Notes</p>
                                <p className="text-gray-600">Save as Draft and edit before submitting</p>
                            </div>
                            <FeatureIllustration type="receipt" />
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <FeatureIllustration type="filecheck" />
                            <div>
                                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Receipt Uploads (Proof-ready)</h3>
                                <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>Upload PDF / PNG / JPG</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>Stored securely (org-isolated)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>Preview/download anytime</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>Supports single or multiple attachments per expense.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div>
                                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Status Tracking (clear stages)</h3>
                                <p className="text-gray-700 mb-4">
                                    "Draft → Submitted → Under Review → Verified → Approved / Rejected"
                                </p>
                                <p className="text-gray-600">Each stage shows: who acted, when it happened, comments (if provided)</p>
                            </div>
                            <FeatureIllustration type="workflow" />
                        </div>
                    </div>
                </Section>

                {/* Use Cases */}
                <SectionBand>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Use Cases</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
                            <CardHeader>
                                <Building2 className="h-12 w-12 text-blue-600 mb-4" />
                                <CardTitle>Office Petty Cash</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>Manage daily office expenses, supplies, and small purchases with automated approvals</CardDescription>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
                            <CardHeader>
                                <Users className="h-12 w-12 text-blue-600 mb-4" />
                                <CardTitle>Travel Reimbursements</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>Streamline travel expense claims with receipt uploads and multi-level verification</CardDescription>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
                            <CardHeader>
                                <Building2 className="h-12 w-12 text-blue-600 mb-4" />
                                <CardTitle>Site Operations Expenses</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>Track field expenses, contractor payments, and operational costs across locations</CardDescription>
                            </CardContent>
                        </Card>
                    </div>
                </SectionBand>

                {/* Approval Workflow */}
                <Section>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Approval Workflow</h2>
                    <div className="grid sm:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Employee Submission</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">Submit for review, read-only after submit</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Engineer Verification (Optional)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">Verify, comments, approve within limit or forward</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Admin Final Approval</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">Approve triggers balance deduction; reject returns with reason</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Approval Limits</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">Configurable per org, auto routing if &gt; limit</p>
                            </CardContent>
                        </Card>
                    </div>
                </Section>

                {/* Balance Management */}
                <SectionBand>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Balance Management</h2>
                    <div className="space-y-4 text-gray-700 max-w-3xl mx-auto">
                        <p>Real-time balances update on funds added / approval deduction / transfers</p>
                        <p>Fund addition by cashier adjusts cashier balance and logs it</p>
                        <p>Transfers/adjustments supported with history</p>
                    </div>
                </SectionBand>

                {/* Multi-Organization Support */}
                <Section>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Multi-Organization Support</h2>
                    <div className="space-y-4 text-gray-700 max-w-3xl mx-auto">
                        <p>Strict separation by organization_id, users only see their org</p>
                        <p>Custom categories + optional locations + cashier assignment (mention as optional)</p>
                    </div>
                </Section>

                {/* Dashboard & Analytics */}
                <SectionBand>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Dashboard & Analytics</h2>
                    <div className="grid sm:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Employee</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">Personal expenses, pending, approved, balance</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Engineer</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">Pending verifications, team overview, stats</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Admin</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">Org analytics, balances overview, compliance visibility</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Cashier</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">Funds added, returns, transfer history</p>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="mt-8 text-center">
                        <p className="text-gray-700">Reports & export: filter + CSV export (admin)</p>
                    </div>
                </SectionBand>

                {/* Audit & Compliance */}
                <SectionBand>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Audit & Compliance</h2>
                    <div className="text-gray-700 max-w-3xl mx-auto">
                        <p>Logs for submissions, decisions, balance changes, receipt events; traceable to user + timestamp</p>
                        <p className="mt-4 text-center">
                            Learn more about our <a href="/security" className="text-blue-600 hover:underline font-medium">security and compliance</a> measures.
                        </p>
                    </div>
                </SectionBand>

                {/* Testimonials */}
                <Section>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">What teams are saying</h2>
                    <TestimonialCards />
                </Section>

                {/* FAQ Section */}
                <SectionBand>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h2>
                    <div className="max-w-3xl mx-auto">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>What expense management features does PesoWise offer?</AccordionTrigger>
                                <AccordionContent>
                                    PesoWise offers expense tracking, receipt uploads, multi-step approval workflows, real-time balance tracking, multi-organization support, role-based dashboards, custom categories, audit logs, and CSV export capabilities.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>Can PesoWise handle multiple organizations?</AccordionTrigger>
                                <AccordionContent>
                                    Yes, PesoWise supports multi-organization expense management with strict data isolation. Each organization has separate categories, locations, balances, and user access.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>How does the expense approval workflow work?</AccordionTrigger>
                                <AccordionContent>
                                    Employees submit expenses, engineers can verify and approve within limits, and admins provide final approval. Approved expenses automatically update balances, while rejected expenses can be edited and resubmitted.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-4">
                                <AccordionTrigger>What file types are supported for receipt uploads?</AccordionTrigger>
                                <AccordionContent>
                                    PesoWise supports PDF, PNG, and JPG file formats for receipt uploads. Receipts are stored securely with organization-level isolation and can be previewed or downloaded anytime.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-5">
                                <AccordionTrigger>Does PesoWise provide audit trails?</AccordionTrigger>
                                <AccordionContent>
                                    Yes, PesoWise maintains comprehensive audit logs for all expense submissions, approval decisions, balance changes, and receipt events. Each action is traceable to the user and timestamp for compliance.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </SectionBand>

                {/* SEO Reinforcement */}
                <Section className="py-12">
                    <div className="max-w-4xl mx-auto text-center">
                        <p className="text-gray-700 text-lg leading-relaxed">
                            PesoWise provides comprehensive expense management and petty cash software features including receipt management systems, automated approval workflows, and real-time balance tracking. Our multi-organization expense management platform ensures audit-ready records for compliance and financial reporting.
                        </p>
                    </div>
                </Section>

                {/* Bottom CTA */}
                <SectionBand className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold mb-8">
                            Want PesoWise customized for your org workflow?
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" variant="secondary" onClick={() => navigate("/contact")} className="text-lg px-8">
                                Contact Us
                            </Button>
                            <Button size="lg" variant="outline" onClick={() => navigate("/contact")} className="text-lg px-8 border-2 border-white text-white hover:bg-white/10">
                                Request a Demo
                            </Button>
                        </div>
                    </div>
                </SectionBand>
            </MarketingLayout>
        </>
    );
}

