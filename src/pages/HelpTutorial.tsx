import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { tutorialManuals, type TutorialRole } from "@/content/tutorialManuals";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SUPPORTED_ROLES: TutorialRole[] = ["admin", "cashier", "engineer", "employee"];

export default function HelpTutorial() {
  const { userRole, organizationId } = useAuth();
  const [engineerApprovalLimit, setEngineerApprovalLimit] = useState<number>(50000);

  useEffect(() => {
    const loadEngineerApprovalLimit = async () => {
      if (!organizationId) return;
      const { data, error } = await supabase
        .from("organization_settings")
        .select("engineer_approval_limit")
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (!error && data?.engineer_approval_limit !== null && data?.engineer_approval_limit !== undefined) {
        setEngineerApprovalLimit(Number(data.engineer_approval_limit));
      }
    };
    void loadEngineerApprovalLimit();
  }, [organizationId]);

  const normalizedRole = (userRole ?? "employee") as TutorialRole;
  const role = SUPPORTED_ROLES.includes(normalizedRole) ? normalizedRole : "employee";
  const formattedApprovalLimit = useMemo(
    () => new Intl.NumberFormat("en-IN").format(engineerApprovalLimit),
    [engineerApprovalLimit]
  );

  const manual = useMemo(() => {
    const baseManual = tutorialManuals[role];
    if (role !== "engineer") return baseManual;
    return {
      ...baseManual,
      sections: baseManual.sections.map((section) =>
        section.id === "manager-approval-rules"
          ? {
              ...section,
              paragraphs: [
                `If amount is less than or equal to INR ${formattedApprovalLimit}, manager can approve directly.`,
                `If amount is greater than INR ${formattedApprovalLimit}, request is sent for admin approval.`,
              ],
            }
          : section
      ),
    };
  }, [role, formattedApprovalLimit]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Card className="border-0 shadow-xl bg-white">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-2xl md:text-3xl">{manual.displayName}</CardTitle>
              <CardDescription className="text-indigo-100 mt-2 text-sm md:text-base">
                {manual.summary}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-transparent">
              Last updated: {manual.lastUpdated}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5 md:p-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Quick Links</h3>
            <div className="flex flex-wrap gap-2">
              {manual.quickLinks.map((item) =>
                item.route ? (
                  <Button key={item.label} asChild variant="outline" size="sm">
                    <Link to={item.route}>{item.label}</Link>
                  </Button>
                ) : (
                  <Badge key={item.label} variant="outline">
                    {item.label}
                  </Badge>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:gap-5">
        {manual.sections.map((section, sectionIndex) => (
          <Card key={section.id} className="shadow-sm border bg-white">
            <CardHeader className="pb-2 pt-4 md:pt-5">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-semibold">
                  {sectionIndex + 1}
                </Badge>
                <CardTitle className="text-base md:text-lg leading-6">{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-4 md:pb-5">
              <ul className="space-y-2 md:space-y-3">
                {section.paragraphs.map((paragraph, idx) => (
                  <li key={`${section.id}-${idx}`} className="flex items-start gap-2.5 text-gray-700">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                    <p className="text-sm md:text-[15px] leading-6">{paragraph}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
