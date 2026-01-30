import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Section, SectionBand } from "@/components/marketing/Section";
import { HeroBackdrop } from "@/components/marketing/HeroBackdrop";
import { FloatingOrbs } from "@/components/marketing/FloatingOrbs";
import { ContactIllustration } from "@/components/marketing/PageIllustrations";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import {
    CheckCircle2,
    Mail,
    Phone,
    MapPin,
    ArrowRight,
    MessageCircle
} from "lucide-react";

export default function ContactPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        fullName: "",
        workEmail: "",
        companyName: "",
        phone: "",
        role: "",
        teamSize: "",
        approvalType: "",
        balanceManagement: "",
        multiLocation: "",
        receiptRequired: "",
        message: "",
        preferredTime: "",
        timezone: ""
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // POST to API endpoint
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit form');
            }

            toast({
                title: "Thank you!",
                description: data.message || "We've received your request and will respond within 24 hours.",
            });

            // Reset form
            setFormData({
                fullName: "",
                workEmail: "",
                companyName: "",
                phone: "",
                role: "",
                teamSize: "",
                approvalType: "",
                balanceManagement: "",
                multiLocation: "",
                receiptRequired: "",
                message: "",
                preferredTime: "",
                timezone: ""
            });

        } catch (error: any) {
            console.error('Contact form error:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to submit form. Please try again or email support@unimisk.com directly.",
            });
        } finally {
            setSubmitting(false);
        }
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
                "name": "Contact",
                "item": "https://pesowise.com/contact"
            }
        ]
    };

    return (
        <>
            <SEOHead
                title="Contact PesoWise – Get Started with Expense Management"
                description="Contact the PesoWise team to set up your expense management workflow or request a demo."
                canonicalUrl="https://pesowise.com/contact"
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
                                Get started with PesoWise
                            </h1>
                            <p className="text-xl text-gray-600">
                                Tell us about your organization. We'll set up the right workflow and get you live quickly.
                            </p>
                            <Button variant="outline" onClick={() => navigate("/auth")} className="mt-4">
                                Login
                            </Button>
                        </div>
                        <div className="relative w-full max-w-none lg:justify-self-end">
                            <ContactIllustration />
                        </div>
                    </div>
                </Section>

                {/* Main Content */}
                <SectionBand>
                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Contact Form */}
                        <div>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Request a Demo</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Contact form to request a PesoWise demo">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName">Full Name *</Label>
                                            <Input
                                                id="fullName"
                                                name="fullName"
                                                required
                                                aria-required="true"
                                                value={formData.fullName}
                                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="workEmail">Work Email *</Label>
                                            <Input
                                                id="workEmail"
                                                name="workEmail"
                                                type="email"
                                                required
                                                aria-required="true"
                                                value={formData.workEmail}
                                                onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="companyName">Company / Organization Name *</Label>
                                            <Input
                                                id="companyName"
                                                required
                                                value={formData.companyName}
                                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone / WhatsApp *</Label>
                                            <Input
                                                id="phone"
                                                required
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="role">Role *</Label>
                                            <Select required value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                                                <SelectTrigger id="role">
                                                    <SelectValue placeholder="Select your role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    <SelectItem value="finance">Finance</SelectItem>
                                                    <SelectItem value="ops">Ops</SelectItem>
                                                    <SelectItem value="founder">Founder</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="teamSize">Team Size *</Label>
                                            <Select required value={formData.teamSize} onValueChange={(value) => setFormData({ ...formData, teamSize: value })}>
                                                <SelectTrigger id="teamSize">
                                                    <SelectValue placeholder="Select team size" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1-10">1–10</SelectItem>
                                                    <SelectItem value="11-50">11–50</SelectItem>
                                                    <SelectItem value="51-200">51–200</SelectItem>
                                                    <SelectItem value="200+">200+</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3">
                                            <Label>Workflow Needs</Label>
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-normal">Expense approvals</Label>
                                                    <RadioGroup value={formData.approvalType} onValueChange={(value) => setFormData({ ...formData, approvalType: value })}>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="admin-only" id="admin-only" />
                                                            <Label htmlFor="admin-only" className="font-normal">Admin only</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="engineer-admin" id="engineer-admin" />
                                                            <Label htmlFor="engineer-admin" className="font-normal">Engineer + Admin</Label>
                                                        </div>
                                                    </RadioGroup>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-sm font-normal">Balance management required</Label>
                                                    <RadioGroup value={formData.balanceManagement} onValueChange={(value) => setFormData({ ...formData, balanceManagement: value })}>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="yes" id="balance-yes" />
                                                            <Label htmlFor="balance-yes" className="font-normal">Yes</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="no" id="balance-no" />
                                                            <Label htmlFor="balance-no" className="font-normal">No</Label>
                                                        </div>
                                                    </RadioGroup>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-sm font-normal">Multi-location</Label>
                                                    <RadioGroup value={formData.multiLocation} onValueChange={(value) => setFormData({ ...formData, multiLocation: value })}>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="yes" id="location-yes" />
                                                            <Label htmlFor="location-yes" className="font-normal">Yes</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="no" id="location-no" />
                                                            <Label htmlFor="location-no" className="font-normal">No</Label>
                                                        </div>
                                                    </RadioGroup>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-sm font-normal">Receipt attachments required always?</Label>
                                                    <RadioGroup value={formData.receiptRequired} onValueChange={(value) => setFormData({ ...formData, receiptRequired: value })}>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="yes" id="receipt-yes" />
                                                            <Label htmlFor="receipt-yes" className="font-normal">Yes</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="no" id="receipt-no" />
                                                            <Label htmlFor="receipt-no" className="font-normal">No</Label>
                                                        </div>
                                                    </RadioGroup>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="message">Message</Label>
                                            <Textarea
                                                id="message"
                                                placeholder="What problem are you solving? Any current system (Excel/Tally/manual)?"
                                                rows={4}
                                                value={formData.message}
                                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="preferredTime">Preferred Time (Optional)</Label>
                                                <Select value={formData.preferredTime} onValueChange={(value) => setFormData({ ...formData, preferredTime: value })}>
                                                    <SelectTrigger id="preferredTime">
                                                        <SelectValue placeholder="Select time" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="morning">Morning</SelectItem>
                                                        <SelectItem value="afternoon">Afternoon</SelectItem>
                                                        <SelectItem value="evening">Evening</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="timezone">Timezone (Optional)</Label>
                                                <Input
                                                    id="timezone"
                                                    placeholder="e.g., IST, EST"
                                                    value={formData.timezone}
                                                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <Button type="submit" className="w-full" disabled={submitting}>
                                            {submitting ? "Submitting..." : "Request a Demo"}
                                        </Button>
                                        <p className="text-xs text-gray-500 text-center">
                                            We typically respond within 24 hours.
                                        </p>
                                        <p className="text-xs text-gray-500 text-center mt-2">
                                            Having trouble? Email us at <a href="mailto:support@unimisk.com" className="text-blue-600 hover:underline">support@unimisk.com</a>
                                        </p>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Trust Card */}
                        <div>
                            <Card className="sticky top-24">
                                <CardHeader>
                                    <CardTitle>What you'll get</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-gray-900">Quick setup</p>
                                            <p className="text-sm text-gray-600">Get started in minutes</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-gray-900">Custom workflow</p>
                                            <p className="text-sm text-gray-600">Tailored to your organization</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-gray-900">Dedicated support</p>
                                            <p className="text-sm text-gray-600">We're here to help</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </SectionBand>

                {/* Contact Options */}
                <Section>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Contact Options</h2>
                    <div className="grid sm:grid-cols-3 gap-6">
                        <Card className="text-center">
                            <CardContent className="pt-6">
                                <Mail className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                                <p className="font-medium text-gray-900 mb-2">Email</p>
                                <a href="mailto:info@unimisk.com" className="text-blue-600 hover:underline">info@unimisk.com</a>
                            </CardContent>
                        </Card>
                        <Card className="text-center">
                            <CardContent className="pt-6">
                                <Phone className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                                <p className="font-medium text-gray-900 mb-2">Phone / WhatsApp</p>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p>+91 9426049048</p>
                                    <p>+91 8160325372</p>
                                    <p>+91 80008 45035</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="text-center">
                            <CardContent className="pt-6">
                                <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                                <p className="font-medium text-gray-900 mb-2">Location</p>
                                <p className="text-sm text-gray-600">
                                    10th Floor, Stratum@Venus Ground, Nr. Janshi Rani Statue, C-1008, West wing, Nehru Nagar, Ahmedabad, Gujarat 380015
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </Section>

                {/* Mini FAQ */}
                <SectionBand>
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h2>
                    <div className="space-y-6 max-w-3xl mx-auto">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Cloud-based?</h3>
                            <p className="text-gray-600">Yes (secure SaaS)</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Add users ourselves?</h3>
                            <p className="text-gray-600">Admin controls user creation</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Support receipts?</h3>
                            <p className="text-gray-600">Yes (PDF/JPG/PNG)</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Multiple companies?</h3>
                            <p className="text-gray-600">Yes (multi-tenant)</p>
                        </div>
                    </div>
                </SectionBand>

                {/* SEO Reinforcement */}
                <Section className="py-12">
                    <div className="max-w-4xl mx-auto text-center">
                        <p className="text-gray-700 text-lg leading-relaxed">
                            Ready to streamline your expense management? Contact PesoWise to learn how our petty cash management software can help your team automate expense approvals, track balances, and maintain compliance-ready records.
                        </p>
                    </div>
                </Section>

                {/* Footer CTA */}
                <SectionBand className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">
                            Prefer WhatsApp instead of forms?
                        </h2>
                        <Button size="lg" variant="secondary" onClick={() => window.open("https://wa.me/919426049048", "_blank")} className="text-lg px-8" aria-label="Chat with PesoWise on WhatsApp">
                            <MessageCircle className="mr-2 h-5 w-5" />
                            Chat on WhatsApp
                        </Button>
                    </div>
                </SectionBand>
            </MarketingLayout>
        </>
    );
}
