import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Building2, 
  Users, 
  CreditCard, 
  Ban, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Edit,
  Settings,
  Database,
  HardDrive,
  Copy,
  Check,
  MessageSquare,
  Calendar,
  RefreshCw,
  Trash2,
  Receipt
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { formatINR } from "@/lib/format";
import { useNavigate } from "react-router-dom";

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  subscription_status: string;
  payment_status: string;
  is_blocked: boolean;
  is_active: boolean;
  max_users: number;
  created_at: string;
  last_activity_at: string | null;
  user_count?: number;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface StorageMetrics {
  database_size_gb: number;
  storage_size_gb: number;
  total_size_gb: number;
  database_size_bytes: number;
  storage_size_bytes: number;
  total_size_bytes: number;
  table_sizes?: Array<{
    table_name: string;
    size_bytes: number;
    size_gb: number;
  }>;
  bucket_sizes?: Array<{
    bucket_id: string;
    size_bytes: number;
    size_gb: number;
    file_count: number;
  }>;
  attachment_size_gb?: number;
  receipt_size_gb?: number;
  statistics?: {
    total_users: number;
    total_expenses: number;
    total_organizations: number;
  };
}

interface OrganizationStorage {
  organization_id: string;
  organization_name: string;
  user_count: number;
  expense_count: number;
  attachment_size_bytes: number;
  attachment_size_gb: number;
}

interface Announcement {
  id: string;
  organization_id: string | null;
  message: string;
  type: string;
  priority: string;
  expires_at: string;
  created_at: string;
  is_active: boolean;
  organizations?: {
    name: string;
  };
}

export default function MasterAdminPanel() {
  const { user, isMasterAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageMetrics, setStorageMetrics] = useState<StorageMetrics | null>(null);
  const [organizationStorage, setOrganizationStorage] = useState<OrganizationStorage[]>([]);
  const [storageLoading, setStorageLoading] = useState(false);
  const [showDetailedMetrics, setShowDetailedMetrics] = useState(false);
  const [createOrgDialogOpen, setCreateOrgDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [announcementHistory, setAnnouncementHistory] = useState<Announcement[]>([]);
  const [showAnnouncementHistory, setShowAnnouncementHistory] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [copiedOrgId, setCopiedOrgId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Form states
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [blockReason, setBlockReason] = useState("");
  
  // Announcement form states
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementType, setAnnouncementType] = useState("payment_reminder");
  const [announcementPriority, setAnnouncementPriority] = useState("medium");
  const [announcementExpiryDays, setAnnouncementExpiryDays] = useState("30");
  const [announcementTargetOrg, setAnnouncementTargetOrg] = useState<string>("all");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    console.log("MasterAdminPanel - isMasterAdmin:", isMasterAdmin);
    console.log("MasterAdminPanel - user:", user);
    
    if (!isMasterAdmin) {
      console.warn("MasterAdminPanel - User is not a master admin, redirecting...");
      toast({
        title: "Access Denied",
        description: "You must be a master admin to access this page.",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }
    
    console.log("MasterAdminPanel - Fetching data...");
    fetchOrganizations();
    fetchPlans();
    fetchStorageMetrics();
    fetchAnnouncementHistory();
  }, [isMasterAdmin, user]);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select(`
          *,
          organization_memberships(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Get user counts for each organization
      const orgsWithCount = await Promise.all(
        (data || []).map(async (org) => {
          try {
            const { data: countData, error: countError } = await supabase.rpc('get_organization_user_count', {
              org_id: org.id
            });
            return {
              ...org,
              user_count: countError ? 0 : (countData || 0),
              organization_memberships: undefined
            };
          } catch {
            return {
              ...org,
              user_count: 0,
              organization_memberships: undefined
            };
          }
        })
      );
      
      setOrganizations(orgsWithCount);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch organizations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncementHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("master_admin_announcements")
        .select(`
          *,
          organizations:organization_id(name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setAnnouncementHistory(data || []);
    } catch (error) {
      console.error("Error fetching announcement history:", error);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  const fetchStorageMetrics = async () => {
    setStorageLoading(true);
    try {
      // Try to get detailed metrics first
      const { data: detailedData, error: detailedError } = await supabase.rpc('get_detailed_storage_metrics');
      if (!detailedError && detailedData) {
        setStorageMetrics(detailedData);
      } else {
        // Fallback to basic metrics
        const { data, error } = await supabase.rpc('get_storage_metrics');
        if (error) {
          console.warn("Failed to fetch storage metrics:", error);
          setStorageMetrics(null);
        } else {
          setStorageMetrics(data);
        }
      }
      
      // Fetch organization storage breakdown (optional, don't fail if it doesn't exist)
      try {
        const { data: orgStorageData, error: orgStorageError } = await supabase.rpc('get_organization_storage_breakdown');
        if (!orgStorageError && orgStorageData) {
          setOrganizationStorage(orgStorageData);
        }
      } catch (orgError) {
        console.warn("Organization storage breakdown not available:", orgError);
        // This is optional, so we don't show an error
      }
    } catch (error) {
      console.error("Error fetching storage metrics:", error);
      setStorageMetrics(null);
    } finally {
      setStorageLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!orgName || !orgSlug || !selectedPlan || !adminEmail || !adminName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('create_organization_with_admin', {
        org_name: orgName,
        org_slug: orgSlug,
        plan_slug: selectedPlan,
        admin_email: adminEmail,
        admin_name: adminName
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Organization "${orgName}" created successfully. Org ID: ${data}`,
      });

      setCreateOrgDialogOpen(false);
      setOrgName("");
      setOrgSlug("");
      setSelectedPlan("");
      setAdminEmail("");
      setAdminName("");
      fetchOrganizations();
    } catch (error: any) {
      console.error("Error creating organization:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create organization. Make sure the admin user exists in auth.users first.",
        variant: "destructive",
      });
    }
  };

  const handleBlockOrganization = async () => {
    if (!selectedOrg) return;

    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          is_blocked: true,
          blocked_reason: blockReason || "Blocked by master admin",
          blocked_at: new Date().toISOString(),
          is_active: false
        })
        .eq("id", selectedOrg.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Organization "${selectedOrg.name}" has been blocked`,
      });

      setBlockDialogOpen(false);
      setSelectedOrg(null);
      setBlockReason("");
      fetchOrganizations();
    } catch (error: any) {
      console.error("Error blocking organization:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to block organization",
        variant: "destructive",
      });
    }
  };

  const handleUnblockOrganization = async (orgId: string) => {
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          is_blocked: false,
          blocked_reason: null,
          blocked_at: null,
          is_active: true,
          payment_status: 'active'
        })
        .eq("id", orgId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization has been unblocked",
      });

      fetchOrganizations();
    } catch (error: any) {
      console.error("Error unblocking organization:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to unblock organization",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrganization = async () => {
    if (!selectedOrg) return;

    // Require confirmation text
    if (deleteConfirmText !== "DELETE") {
      toast({
        title: "Confirmation Required",
        description: 'Please type "DELETE" to confirm deletion',
        variant: "destructive",
      });
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", selectedOrg.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Organization "${selectedOrg.name}" has been deleted permanently`,
      });

      setDeleteDialogOpen(false);
      setSelectedOrg(null);
      setDeleteConfirmText("");
      fetchOrganizations();
    } catch (error: any) {
      console.error("Error deleting organization:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete organization. This may fail if there are related records that prevent deletion.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdatePlan = async (orgId: string, planSlug: string) => {
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ plan: planSlug })
        .eq("id", orgId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization plan updated",
      });

      fetchOrganizations();
    } catch (error: any) {
      console.error("Error updating plan:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update plan",
        variant: "destructive",
      });
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementMessage) {
      toast({
        title: "Validation Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(announcementExpiryDays));

      const { error } = await supabase
        .from("master_admin_announcements")
        .insert({
          organization_id: announcementTargetOrg === "all" ? null : announcementTargetOrg,
          message: announcementMessage,
          type: announcementType,
          priority: announcementPriority,
          expires_at: expiryDate.toISOString(),
          is_active: true,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Announcement created successfully",
      });

      setAnnouncementDialogOpen(false);
      setAnnouncementMessage("");
      setAnnouncementType("payment_reminder");
      setAnnouncementPriority("medium");
      setAnnouncementExpiryDays("30");
      setAnnouncementTargetOrg("all");
      
      // Refresh announcement history
      fetchAnnouncementHistory();
    } catch (error: any) {
      console.error("Error creating announcement:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create announcement",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, orgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOrgId(orgId);
    toast({
      title: "Copied",
      description: "Organization ID copied to clipboard",
    });
    setTimeout(() => setCopiedOrgId(null), 2000);
  };

  const formatLastActivity = (date: string | null) => {
    if (!date) return "Never";
    const activityDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - activityDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return format(activityDate, "MMM d, yyyy");
  };

  if (!isMasterAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Access denied. Master admin privileges required.
              </p>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>isMasterAdmin: {isMasterAdmin ? "true" : "false"}</p>
                <p>User ID: {user?.id || "Not available"}</p>
                <p>User Email: {user?.email || "Not available"}</p>
              </div>
              <Button onClick={() => window.location.reload()} variant="outline">
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Master Admin Panel</h1>
          <p className="text-muted-foreground">Manage all organizations, plans, and access</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchStorageMetrics} variant="outline" disabled={storageLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${storageLoading ? 'animate-spin' : ''}`} />
            Refresh Storage
          </Button>
          <Button onClick={() => setCreateOrgDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Organization
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Total Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{organizations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All registered organizations</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Active Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {organizations.filter(o => o.is_active && !o.is_blocked).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently operational</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Ban className="h-4 w-4" />
              Blocked Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {organizations.filter(o => o.is_blocked).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Access suspended</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {organizations.filter(o => o.payment_status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Statistics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {storageMetrics?.statistics?.total_users || organizations.reduce((sum, org) => sum + (org.user_count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all organizations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {storageMetrics?.statistics?.total_expenses || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Inactive Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {organizations.filter(o => !o.last_activity_at || 
                (new Date().getTime() - new Date(o.last_activity_at).getTime()) > 30 * 24 * 60 * 60 * 1000
              ).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">No activity in 30+ days</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Storage Monitoring Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Storage & Usage Monitoring
              </CardTitle>
              <CardDescription>Comprehensive database and file storage usage metrics</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetailedMetrics(!showDetailedMetrics)}
            >
              {showDetailedMetrics ? "Hide Details" : "Show Details"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {storageLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : storageMetrics ? (
            <div className="space-y-6">
              {/* Main Storage Overview */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Database Size</div>
                  <div className="text-2xl font-bold">{storageMetrics.database_size_gb.toFixed(4)} GB</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {((storageMetrics.database_size_bytes / 1024 / 1024).toFixed(2))} MB
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">File Storage</div>
                  <div className="text-2xl font-bold">{storageMetrics.storage_size_gb.toFixed(4)} GB</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {((storageMetrics.storage_size_bytes / 1024 / 1024).toFixed(2))} MB
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-primary/5">
                  <div className="text-sm text-muted-foreground mb-1">Total Storage</div>
                  <div className="text-2xl font-bold text-primary">{storageMetrics.total_size_gb.toFixed(4)} GB</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {((storageMetrics.total_size_bytes / 1024 / 1024).toFixed(2))} MB
                  </div>
                </div>
              </div>

              {/* Statistics */}
              {storageMetrics.statistics && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Total Users</div>
                    <div className="text-2xl font-bold">{storageMetrics.statistics.total_users}</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Total Expenses</div>
                    <div className="text-2xl font-bold">{storageMetrics.statistics.total_expenses}</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Total Organizations</div>
                    <div className="text-2xl font-bold">{storageMetrics.statistics.total_organizations}</div>
                  </div>
                </div>
              )}

              {/* Detailed Metrics */}
              {showDetailedMetrics && (
                <div className="space-y-4 pt-4 border-t">
                  {/* Bucket Sizes */}
                  {storageMetrics.bucket_sizes && storageMetrics.bucket_sizes.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Storage Buckets</h4>
                      <div className="space-y-2">
                        {storageMetrics.bucket_sizes.map((bucket: any) => (
                          <div key={bucket.bucket_id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{bucket.bucket_id}</div>
                              <div className="text-sm text-muted-foreground">
                                {bucket.file_count} files
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{bucket.size_gb.toFixed(4)} GB</div>
                              <div className="text-xs text-muted-foreground">
                                {((bucket.size_bytes / 1024 / 1024).toFixed(2))} MB
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Table Sizes */}
                  {storageMetrics.table_sizes && storageMetrics.table_sizes.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Database Table Sizes (Top 10)</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {storageMetrics.table_sizes.slice(0, 10).map((table: any) => (
                          <div key={table.table_name} className="flex items-center justify-between p-2 border rounded text-sm">
                            <div className="font-mono text-xs truncate flex-1">{table.table_name.replace('public.', '')}</div>
                            <div className="text-right ml-2">
                              <div className="font-medium">{table.size_gb.toFixed(4)} GB</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Organization Storage Breakdown */}
                  {organizationStorage.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Storage by Organization</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {organizationStorage.map((org) => (
                          <div key={org.organization_id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{org.organization_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {org.user_count} users • {org.expense_count} expenses
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="font-bold">{org.attachment_size_gb.toFixed(4)} GB</div>
                              <div className="text-xs text-muted-foreground">
                                {((org.attachment_size_bytes / 1024 / 1024).toFixed(2))} MB
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Unable to load storage metrics</p>
          )}
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">All Organizations</CardTitle>
              <CardDescription>Manage organizations, plans, and access control. Click on organization name for details.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowAnnouncementHistory(!showAnnouncementHistory)} 
                variant="outline"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {showAnnouncementHistory ? "Hide History" : "View History"}
              </Button>
              <Button onClick={() => setAnnouncementDialogOpen(true)} variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Announcement
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Org ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => {
                  const orgStorage = organizationStorage.find(s => s.organization_id === org.id);
                  const daysSinceActivity = org.last_activity_at 
                    ? Math.floor((new Date().getTime() - new Date(org.last_activity_at).getTime()) / (1000 * 60 * 60 * 24))
                    : null;
                  
                  return (
                  <TableRow key={org.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {org.id.substring(0, 8)}...
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(org.id, org.id)}
                          title="Copy full Org ID"
                        >
                          {copiedOrgId === org.id ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{org.name}</div>
                        {orgStorage && (
                          <div className="text-xs text-muted-foreground">
                            {orgStorage.expense_count} expenses
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{org.slug}</code>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={org.plan}
                        onValueChange={(value) => handleUpdatePlan(org.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {plans.map((plan) => (
                            <SelectItem key={plan.slug} value={plan.slug}>
                              {plan.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {org.is_blocked ? (
                        <Badge variant="destructive">Blocked</Badge>
                      ) : org.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        org.payment_status === 'active' ? 'default' :
                        org.payment_status === 'pending' ? 'destructive' :
                        'secondary'
                      }>
                        {org.payment_status || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{org.user_count || 0}</span>
                        {orgStorage && orgStorage.attachment_size_gb > 0 && (
                          <span className="text-xs text-muted-foreground">
                            • {orgStorage.attachment_size_gb.toFixed(2)} GB
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        <span className={daysSinceActivity !== null && daysSinceActivity > 30 ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
                          {formatLastActivity(org.last_activity_at)}
                        </span>
                        {daysSinceActivity !== null && daysSinceActivity > 30 && (
                          <AlertCircle className="h-3 w-3 text-orange-600" title="Inactive for 30+ days" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(org.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {org.is_blocked ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnblockOrganization(org.id)}
                            title="Unblock Organization"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrg(org);
                              setBlockDialogOpen(true);
                            }}
                            title="Block Organization"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedOrg(org);
                            setDeleteDialogOpen(true);
                          }}
                          title="Delete Organization"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Announcement History */}
      {showAnnouncementHistory && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">Announcement History</CardTitle>
                <CardDescription>All announcements sent to organizations</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAnnouncementHistory}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {announcementHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No announcements sent yet</p>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Message</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {announcementHistory.map((announcement) => {
                      const isExpired = new Date(announcement.expires_at) < new Date();
                      const orgName = announcement.organization_id 
                        ? organizations.find(o => o.id === announcement.organization_id)?.name || "Unknown"
                        : "All Organizations";
                      
                      return (
                        <TableRow key={announcement.id}>
                          <TableCell className="max-w-md">
                            <div className="truncate" title={announcement.message}>
                              {announcement.message}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              announcement.type === 'urgent' ? 'destructive' :
                              announcement.type === 'warning' ? 'default' :
                              'secondary'
                            }>
                              {announcement.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              announcement.priority === 'high' ? 'destructive' :
                              announcement.priority === 'medium' ? 'default' :
                              'secondary'
                            }>
                              {announcement.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{orgName}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              !announcement.is_active ? 'secondary' :
                              isExpired ? 'destructive' :
                              'default'
                            }>
                              {!announcement.is_active ? 'Inactive' :
                               isExpired ? 'Expired' :
                               'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(announcement.created_at), "MMM d, yyyy")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(announcement.created_at), "h:mm a")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(announcement.expires_at), "MMM d, yyyy")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(announcement.expires_at), "h:mm a")}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Organization Dialog */}
      <Dialog open={createOrgDialogOpen} onOpenChange={setCreateOrgDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              Create a new organization with an admin user. The admin user must exist in auth.users first.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Organization Name</Label>
              <Input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <Label>Organization Slug</Label>
              <Input
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="acme-corp"
              />
            </div>
            <div>
              <Label>Subscription Plan</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.slug} value={plan.slug}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Admin Email</Label>
              <Input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@example.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                User must exist in auth.users first
              </p>
            </div>
            <div>
              <Label>Admin Name</Label>
              <Input
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOrgDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrganization}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Organization Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Organization</DialogTitle>
            <DialogDescription>
              Block access for "{selectedOrg?.name}". Users will not be able to access the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason (optional)</Label>
              <Textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Payment pending, Terms violation, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBlockOrganization}>
              Block Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Organization Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Organization
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-2">
                <p className="font-semibold text-destructive">
                  This action cannot be undone!
                </p>
                <p>
                  You are about to permanently delete <strong>"{selectedOrg?.name}"</strong>.
                </p>
                <p className="text-sm text-muted-foreground">
                  This will delete:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                  <li>The organization and all its data</li>
                  <li>All users, expenses, and transactions</li>
                  <li>All related records (cascading delete)</li>
                </ul>
                <p className="text-sm font-medium text-destructive mt-2">
                  Are you absolutely sure you want to proceed?
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm font-medium">Organization Details:</p>
              <div className="text-sm text-muted-foreground mt-1 space-y-1">
                <p><strong>Name:</strong> {selectedOrg?.name}</p>
                <p><strong>Slug:</strong> {selectedOrg?.slug}</p>
                <p><strong>Users:</strong> {selectedOrg?.user_count || 0}</p>
                <p><strong>Plan:</strong> {selectedOrg?.plan}</p>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Type <strong>DELETE</strong> in the field below to confirm deletion.
              </p>
            </div>
            <div>
              <Label>Type "DELETE" to confirm</Label>
              <Input
                id="delete-confirm"
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedOrg(null);
                setDeleteConfirmText("");
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteOrganization}
              disabled={deleting || deleteConfirmText !== "DELETE"}
            >
              {deleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Announcement Dialog */}
      <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Announcement</DialogTitle>
            <DialogDescription>
              Send a flash message to organization(s). The message will expire after the specified days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Target Organization</Label>
              <Select value={announcementTargetOrg} onValueChange={setAnnouncementTargetOrg}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={announcementMessage}
                onChange={(e) => setAnnouncementMessage(e.target.value)}
                placeholder="Enter announcement message..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={announcementType} onValueChange={setAnnouncementType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={announcementPriority} onValueChange={setAnnouncementPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Expires After (days)</Label>
              <Input
                type="number"
                value={announcementExpiryDays}
                onChange={(e) => setAnnouncementExpiryDays(e.target.value)}
                min="1"
                max="365"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnouncementDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAnnouncement}>Send Announcement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

