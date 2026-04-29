import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Save, Bell, Volume2, VolumeX, MapPin, Plus, Edit, Trash2, Upload, Image as ImageIcon, X, Database, Download, RotateCcw } from "lucide-react";
import { fetchOrgBackup, downloadBackup, downloadBackupWithReceipts, fetchReceiptBlobs, restoreFromBackup, parseBackupFile, getBackupPreview, type BackupPayload } from "@/lib/backupData";
import { Checkbox } from "@/components/ui/checkbox";
import { formatINR } from "@/lib/format";
import { DEFAULT_BASE_FIELD_CONFIG, resolveBaseFieldConfig, type BaseExpenseFieldKey, type BaseFieldConfig } from "@/lib/expenseFormConfig";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useUiFlags } from "@/hooks/useUiFlags";

interface NotificationSettings {
  popup_enabled: boolean;
  sound_enabled: boolean;
  desktop_enabled: boolean;
}

export default function Settings() {
  const { userRole, user, organizationId, organization, refreshOrganization } = useAuth();
  const { glassUiEnabled, setGlassUiEnabled, resetGlassUiOverride, glassUiOverride } = useUiFlags();
  const { toast } = useToast();
  
  // Admin settings
  const [engineerApprovalLimit, setEngineerApprovalLimit] = useState<string>("50000");
  const [attachmentRequiredAboveAmount, setAttachmentRequiredAboveAmount] = useState<string>("50");
  const [allowCashierExpenseSubmission, setAllowCashierExpenseSubmission] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [baseFieldConfig, setBaseFieldConfig] = useState<Record<BaseExpenseFieldKey, BaseFieldConfig>>(DEFAULT_BASE_FIELD_CONFIG);
  const [savingFormBuilder, setSavingFormBuilder] = useState(false);
  
  // Logo upload
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    popup_enabled: true,
    sound_enabled: true,
    desktop_enabled: true, // Enable by default for Windows notifications
  });
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  // Location management
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<{ id: string; name: string } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);
  const [deleteLocationDialogOpen, setDeleteLocationDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deletingLocation, setDeletingLocation] = useState(false);

  // Data & backup
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [restorePreview, setRestorePreview] = useState<BackupPayload | null>(null);
  const [includeReceipts, setIncludeReceipts] = useState(false);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userRole === "admin" && organizationId) {
      fetchSettings();
      fetchLocations();
      fetchFormBuilderSettings();
    }
    if (user) {
      loadNotificationSettings();
    }
  }, [userRole, user, organizationId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      if (!organizationId) {
        setLoading(false);
        return;
      }

      // Prefer full organization_settings (including allow_cashier_expense_submission)
      let orgSettings: { engineer_approval_limit?: number | null; attachment_required_above_amount?: number | null; allow_cashier_expense_submission?: boolean | null } | null = null;
      const { data: fullSettings, error: fullError } = await supabase
        .from("organization_settings")
        .select("engineer_approval_limit, attachment_required_above_amount, allow_cashier_expense_submission")
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (!fullError && fullSettings) {
        orgSettings = fullSettings;
      } else if (fullError && (fullError.code === "42703" || fullError.message?.includes("allow_cashier_expense_submission"))) {
        // Column might not exist yet (migration not run) – fetch without it
        const { data: fallbackSettings, error: fallbackError } = await supabase
          .from("organization_settings")
          .select("engineer_approval_limit, attachment_required_above_amount")
          .eq("organization_id", organizationId)
          .maybeSingle();
        if (!fallbackError && fallbackSettings) orgSettings = fallbackSettings;
      }

      if (orgSettings) {
        if (orgSettings.engineer_approval_limit !== null && orgSettings.engineer_approval_limit !== undefined) {
          setEngineerApprovalLimit(orgSettings.engineer_approval_limit.toString());
        }
        if (orgSettings.attachment_required_above_amount !== null && orgSettings.attachment_required_above_amount !== undefined) {
          setAttachmentRequiredAboveAmount(orgSettings.attachment_required_above_amount.toString());
        }
        if (orgSettings.allow_cashier_expense_submission !== null && orgSettings.allow_cashier_expense_submission !== undefined) {
          setAllowCashierExpenseSubmission(orgSettings.allow_cashier_expense_submission === true);
        }
        setLoading(false);
        return;
      }

      // Fallback to settings table
      const { data: settingsData, error } = await supabase
        .from("settings")
        .select("*")
        .eq("organization_id", organizationId)
        .in("key", ["engineer_approval_limit", "attachment_required_above_amount"]);

      if (error) {
        // If table doesn't exist, show helpful message
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn("Settings table does not exist. Please run the SQL migration first.");
          // Keep default values
          setLoading(false);
          return;
        }
        throw error;
      }

      if (settingsData) {
        const approvalLimit = settingsData.find(s => s.key === "engineer_approval_limit");
        const attachmentLimit = settingsData.find(s => s.key === "attachment_required_above_amount");
        
        if (approvalLimit) {
          setEngineerApprovalLimit(approvalLimit.value);
        }
        if (attachmentLimit) {
          setAttachmentRequiredAboveAmount(attachmentLimit.value);
        }
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      // Don't show error toast if table doesn't exist - just use default
      if (error.code !== '42P01' && !error.message?.includes('does not exist')) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load settings. Using default value.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFormBuilderSettings = async () => {
    try {
      if (!organizationId) return;
      const { data, error } = await (supabase as any)
        .from("organization_expense_form_fields")
        .select("*")
        .eq("organization_id", organizationId);
      if (!error && data) {
        setBaseFieldConfig(resolveBaseFieldConfig(data as Partial<BaseFieldConfig>[]));
      }
    } catch (e) {
      console.warn("Unable to load organization_expense_form_fields");
    }
  };

  const saveFormBuilderSettings = async () => {
    if (!organizationId) return;
    try {
      setSavingFormBuilder(true);
      const rows = (Object.keys(baseFieldConfig) as BaseExpenseFieldKey[]).map((key) => ({
        organization_id: organizationId,
        field_key: key,
        label: baseFieldConfig[key].label,
        help_text: baseFieldConfig[key].help_text ?? null,
        is_visible: baseFieldConfig[key].is_visible,
        is_required: baseFieldConfig[key].is_required,
        display_order: baseFieldConfig[key].display_order,
        show_on_submit: baseFieldConfig[key].show_on_submit,
        show_on_review: baseFieldConfig[key].show_on_review,
        show_on_detail: baseFieldConfig[key].show_on_detail,
      }));
      const { error } = await (supabase as any)
        .from("organization_expense_form_fields")
        .upsert(rows, { onConflict: "organization_id,field_key" });
      if (error) throw error;
      toast({ title: "Form builder updated", description: "Base expense fields have been saved." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to save form builder", description: e?.message || "Try again." });
    } finally {
      setSavingFormBuilder(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const limitValue = parseFloat(engineerApprovalLimit);
      const attachmentLimitValue = parseFloat(attachmentRequiredAboveAmount);
      
      if (isNaN(limitValue) || limitValue < 0) {
        toast({
          variant: "destructive",
          title: "Invalid Input",
          description: "Please enter a valid positive number for Manager Approval Limit",
        });
        return;
      }

      if (isNaN(attachmentLimitValue) || attachmentLimitValue < 0) {
        toast({
          variant: "destructive",
          title: "Invalid Input",
          description: "Please enter a valid positive number for Attachment Required Above Amount",
        });
        return;
      }

      if (!organizationId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Organization not found. Please contact support.",
        });
        return;
      }

      // Upsert both settings with organization_id
      const { error: settingsError } = await supabase
        .from("settings")
        .upsert([
          {
            key: "engineer_approval_limit",
            value: limitValue.toString(),
            organization_id: organizationId,
            description: "Maximum amount (in rupees) that engineers can approve directly. Expenses below this limit can be approved by engineers, above this limit must go to admin.",
            updated_at: new Date().toISOString(),
          },
          {
            key: "attachment_required_above_amount",
            value: attachmentLimitValue.toString(),
            organization_id: organizationId,
            description: "Amount threshold (in rupees) above which bill attachments become mandatory. Expenses at or below this amount do not require attachments.",
            updated_at: new Date().toISOString(),
          }
        ], {
          onConflict: "key,organization_id"
        });

      if (settingsError) {
        if (settingsError.code === '42P01' || settingsError.message.includes('does not exist')) {
          toast({
            variant: "destructive",
            title: "Database Table Missing",
            description: "Please run the SQL migration to create the settings table first. Check supabase/migrations/20250113000000_create_settings_table.sql",
          });
          return;
        }
        throw settingsError;
      }

      // Also update organization_settings table (used by ExpenseService)
      const { error: orgSettingsError } = await supabase
        .from("organization_settings")
        .upsert({
          organization_id: organizationId,
          engineer_approval_limit: limitValue,
          attachment_required_above_amount: attachmentLimitValue,
          allow_cashier_expense_submission: allowCashierExpenseSubmission,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "organization_id"
        });

      if (orgSettingsError) {
        console.error("Error updating organization_settings:", orgSettingsError);
        // Don't throw - settings table update succeeded, just log the error
        // This allows the settings to still work via settings table
      }

      toast({
        title: "Settings Saved",
        description: "Settings have been updated successfully",
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save settings",
      });
    } finally {
      setSaving(false);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      setLoadingNotifications(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("notification_settings")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!error && data?.notification_settings) {
        setNotificationSettings({
          popup_enabled: data.notification_settings.popup_enabled ?? true,
          sound_enabled: data.notification_settings.sound_enabled ?? true,
          desktop_enabled: data.notification_settings.desktop_enabled ?? false,
        });
      } else {
        const stored = localStorage.getItem(`notification_settings_${user?.id}`);
        if (stored) {
          try {
            setNotificationSettings(JSON.parse(stored));
          } catch {
            // use defaults
          }
        }
      }
    } catch {
      // 400 etc. (e.g. notification_settings column missing) – use localStorage or defaults
      const stored = localStorage.getItem(`notification_settings_${user?.id}`);
      if (stored) {
        try {
          setNotificationSettings(JSON.parse(stored));
        } catch {
          // use defaults
        }
      }
    } finally {
      setLoadingNotifications(false);
    }
  };

  const saveNotificationSettings = async (newSettings: NotificationSettings) => {
    try {
      setNotificationSettings(newSettings);
      
      // Save to localStorage immediately
      localStorage.setItem(`notification_settings_${user?.id}`, JSON.stringify(newSettings));

      // Try to save to database
      const { error } = await supabase
        .from("profiles")
        .update({
          notification_settings: newSettings,
        })
        .eq("user_id", user?.id);

      if (error) {
        console.error("Error saving to database, using localStorage only:", error);
      }

      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated",
      });
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings",
      });
    }
  };

  const updateNotificationSetting = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    saveNotificationSettings(newSettings);
  };

  // Location management functions
  const fetchLocations = async () => {
    try {
      setLoadingLocations(true);
      if (!organizationId) {
        setLoadingLocations(false);
        return;
      }
      const { data, error } = await supabase
        .from("locations")
        .select("id, name")
        .eq("organization_id", organizationId)
        .order("name", { ascending: true });

      if (error) throw error;
      setLocations(data || []);
    } catch (error: any) {
      console.error("Error fetching locations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load locations",
      });
    } finally {
      setLoadingLocations(false);
    }
  };

  const openLocationDialog = (location?: { id: string; name: string }) => {
    if (location) {
      setLocationToEdit(location);
      setLocationName(location.name);
    } else {
      setLocationToEdit(null);
      setLocationName("");
    }
    setLocationDialogOpen(true);
  };

  const saveLocation = async () => {
    if (!locationName.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Location name cannot be empty",
      });
      return;
    }

    try {
      setSavingLocation(true);
      if (!organizationId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Organization not found. Please contact support.",
        });
        return;
      }

      if (locationToEdit) {
        // Update existing location
        const { error } = await supabase
          .from("locations")
          .update({ name: locationName.trim(), updated_at: new Date().toISOString() })
          .eq("id", locationToEdit.id)
          .eq("organization_id", organizationId);

        if (error) throw error;
        toast({
          title: "Location Updated",
          description: `Location "${locationName}" has been updated successfully`,
        });
      } else {
        // Create new location with organization_id
        const { error } = await supabase
          .from("locations")
          .insert({ 
            name: locationName.trim(),
            organization_id: organizationId
          });

        if (error) throw error;
        toast({
          title: "Location Created",
          description: `Location "${locationName}" has been created successfully`,
        });
      }
      setLocationDialogOpen(false);
      setLocationName("");
      setLocationToEdit(null);
      fetchLocations();
    } catch (error: any) {
      console.error("Error saving location:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save location",
      });
    } finally {
      setSavingLocation(false);
    }
  };

  const openDeleteLocationDialog = (location: { id: string; name: string }) => {
    setLocationToDelete(location);
    setDeleteLocationDialogOpen(true);
  };

  const deleteLocation = async () => {
    if (!locationToDelete) return;

    try {
      setDeletingLocation(true);
      if (!organizationId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Organization not found.",
        });
        return;
      }
      const { error } = await supabase
        .from("locations")
        .delete()
        .eq("id", locationToDelete.id)
        .eq("organization_id", organizationId);

      if (error) throw error;
      toast({
        title: "Location Deleted",
        description: `Location "${locationToDelete.name}" has been deleted`,
      });
      setDeleteLocationDialogOpen(false);
      setLocationToDelete(null);
      fetchLocations();
    } catch (error: any) {
      console.error("Error deleting location:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete location",
      });
    } finally {
      setDeletingLocation(false);
    }
  };

  const handleDownloadBackup = async () => {
    if (!organizationId) return;
    try {
      setBackupLoading(true);
      const payload = await fetchOrgBackup(supabase, organizationId);
      if (includeReceipts && payload.attachments.length > 0) {
        const receiptBlobs = await fetchReceiptBlobs(supabase, payload.attachments);
        await downloadBackupWithReceipts(payload, receiptBlobs);
        toast({ title: "Backup downloaded", description: `Data and ${receiptBlobs.length} receipt file(s) saved.` });
      } else {
        downloadBackup(payload);
        toast({ title: "Backup downloaded", description: "Your organization data has been saved." });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Backup failed",
        description: e instanceof Error ? e.message : "Failed to prepare backup.",
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const payload = await parseBackupFile(file);
      if (payload.organizationId !== organizationId) {
        toast({
          variant: "destructive",
          title: "Wrong organization",
          description: "This backup is for a different organization. Restore only allowed for the same organization.",
        });
        return;
      }
      setRestorePreview(payload);
      setRestoreFile(file);
      setRestoreConfirmOpen(true);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: err instanceof Error ? err.message : "Could not read backup file.",
      });
    }
    e.target.value = "";
  };

  const handleRestoreConfirm = async () => {
    if (!restoreFile || !organizationId) return;
    try {
      setRestoreLoading(true);
      const result = await restoreFromBackup(supabase, organizationId, restoreFile);
      if (result.success) {
        toast({ title: "Restore complete", description: "Data has been restored." });
        setRestoreConfirmOpen(false);
        setRestoreFile(null);
        setRestorePreview(null);
      } else {
        toast({ variant: "destructive", title: "Restore failed", description: result.error });
      }
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile || !organizationId || !user) return;

    try {
      setUploadingLogo(true);

      // First, delete any existing logo files for this organization
      if (organization?.logo_url) {
        try {
          const urlParts = organization.logo_url.split('/');
          const publicIndex = urlParts.findIndex(part => part === 'public');
          if (publicIndex !== -1 && publicIndex < urlParts.length - 1) {
            const pathAfterPublic = urlParts.slice(publicIndex + 1).join('/');
            const fileName = pathAfterPublic.replace('organization-logos/', '');
            
            // Delete old file
            await supabase.storage
              .from('organization-logos')
              .remove([fileName]);
          }
        } catch (deleteError) {
          console.warn("Error deleting old logo:", deleteError);
          // Continue with upload even if deletion fails
        }
      }

      // Also try to delete any existing logo files with different extensions
      try {
        const { data: existingFiles } = await supabase.storage
          .from('organization-logos')
          .list(organizationId);
        
        if (existingFiles && existingFiles.length > 0) {
          const filesToDelete = existingFiles
            .filter(file => file.name.startsWith('logo.'))
            .map(file => `${organizationId}/${file.name}`);
          
          if (filesToDelete.length > 0) {
            await supabase.storage
              .from('organization-logos')
              .remove(filesToDelete);
          }
        }
      } catch (listError) {
        console.warn("Error listing existing files:", listError);
        // Continue with upload
      }

      // Get file extension
      const fileExt = logoFile.name.split('.').pop();
      // Add timestamp to filename to ensure uniqueness and prevent caching
      const timestamp = Date.now();
      const fileName = `${organizationId}/logo_${timestamp}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('organization-logos')
        .upload(fileName, logoFile, {
          cacheControl: '0', // No cache
          upsert: false // Don't overwrite, use unique filename
        });

      if (uploadError) throw uploadError;

      // Get public URL with cache-busting query parameter
      const { data: urlData } = supabase.storage
        .from('organization-logos')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get logo URL');
      }

      // Add cache-busting query parameter
      const logoUrlWithCacheBust = `${urlData.publicUrl}?t=${timestamp}`;

      // Update organization with logo URL
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: logoUrlWithCacheBust })
        .eq('id', organizationId);

      if (updateError) throw updateError;

      // Refresh organization data
      await refreshOrganization();

      // Update cache with new logo
      if (user?.email) {
        const { cacheOrganization } = await import('@/lib/organizationCache');
        const updatedOrg = await supabase
          .from('organizations')
          .select('id, name, logo_url')
          .eq('id', organizationId)
          .single();
        
        if (updatedOrg.data) {
          cacheOrganization(user.email, {
            id: updatedOrg.data.id,
            name: updatedOrg.data.name,
            logo_url: updatedOrg.data.logo_url || null
          });
        }
      }

      // Clear file selection
      setLogoFile(null);
      setLogoPreview(null);

      toast({
        title: "Logo Updated",
        description: "Organization logo has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload logo",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!organizationId || !organization?.logo_url) return;

    try {
      setUploadingLogo(true);

      // Remove query parameters from URL if present
      const logoUrl = organization.logo_url.split('?')[0];

      // Extract file path from URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/organization-logos/[org-id]/logo.[ext]
      const urlParts = logoUrl.split('/');
      const publicIndex = urlParts.findIndex(part => part === 'public');
      if (publicIndex === -1 || publicIndex >= urlParts.length - 1) {
        throw new Error('Invalid logo URL format');
      }
      // Get everything after 'public/' which should be 'organization-logos/[org-id]/logo.[ext]'
      const pathAfterPublic = urlParts.slice(publicIndex + 1).join('/');
      // Remove 'organization-logos/' prefix to get just '[org-id]/logo.[ext]'
      const fileName = pathAfterPublic.replace('organization-logos/', '');

      // Delete file from storage
      const { error: deleteError } = await supabase.storage
        .from('organization-logos')
        .remove([fileName]);

      if (deleteError) {
        console.warn("Error deleting logo file:", deleteError);
        // Continue to remove URL from database even if file deletion fails
      }

      // Also try to delete any other logo files for this organization
      try {
        const { data: existingFiles } = await supabase.storage
          .from('organization-logos')
          .list(organizationId);
        
        if (existingFiles && existingFiles.length > 0) {
          const filesToDelete = existingFiles
            .filter(file => file.name.startsWith('logo'))
            .map(file => `${organizationId}/${file.name}`);
          
          if (filesToDelete.length > 0) {
            await supabase.storage
              .from('organization-logos')
              .remove(filesToDelete);
          }
        }
      } catch (listError) {
        console.warn("Error listing files for cleanup:", listError);
      }

      // Remove logo URL from organization
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: null })
        .eq('id', organizationId);

      if (updateError) throw updateError;

      // Refresh organization data
      await refreshOrganization();

      // Update cache to remove logo
      if (user?.email) {
        const { cacheOrganization } = await import('@/lib/organizationCache');
        const updatedOrg = await supabase
          .from('organizations')
          .select('id, name, logo_url')
          .eq('id', organizationId)
          .single();
        
        if (updatedOrg.data) {
          cacheOrganization(user.email, {
            id: updatedOrg.data.id,
            name: updatedOrg.data.name,
            logo_url: null
          });
        }
      }

      toast({
        title: "Logo Removed",
        description: "Organization logo has been removed",
      });
    } catch (error: any) {
      console.error("Error deleting logo:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to remove logo",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className={`space-y-8 ${glassUiEnabled ? "glass-page" : ""}`}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your preferences and system configuration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Toggle the new Glass-OS interface style for your account on this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="glass-ui" className="text-base">
                Enable Glass UI
              </Label>
              <p className="text-sm text-muted-foreground">
                Adds subtle glass surfaces, blur, and elevated depth across core app screens.
              </p>
            </div>
            <Switch
              id="glass-ui"
              checked={glassUiEnabled}
              onCheckedChange={(checked) => {
                setGlassUiEnabled(checked);
                toast({
                  title: checked ? "Glass UI enabled" : "Glass UI disabled",
                  description: checked
                    ? "Modern glass styling is now active."
                    : "Switched back to the default interface.",
                });
              }}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">
              Current mode:{" "}
              <span className="font-medium text-foreground">
                {glassUiOverride === null ? "System default (env)" : "Manual override"}
              </span>
            </p>
            {glassUiOverride !== null && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetGlassUiOverride();
                  toast({
                    title: "Appearance reset",
                    description: "Now following the environment default setting.",
                  });
                }}
              >
                Use Default
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings - Available for all users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Control how notifications appear and behave
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingNotifications ? (
            <p className="text-muted-foreground">Loading notification settings...</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="popup" className="text-base">
                    Popup Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show WhatsApp-style popup notifications when new notifications arrive
                  </p>
                </div>
                <Switch
                  id="popup"
                  checked={notificationSettings.popup_enabled}
                  onCheckedChange={(checked) => updateNotificationSetting("popup_enabled", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sound" className="text-base flex items-center gap-2">
                    {notificationSettings.sound_enabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                    Sound Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Play a sound when new notifications arrive
                  </p>
                </div>
                <Switch
                  id="sound"
                  checked={notificationSettings.sound_enabled}
                  onCheckedChange={(checked) => updateNotificationSetting("sound_enabled", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="desktop" className="text-base">
                    Windows Desktop Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show native Windows notifications in the notification center (like WhatsApp). Click to open the expense.
                  </p>
                </div>
                <Switch
                  id="desktop"
                  checked={notificationSettings.desktop_enabled}
                  onCheckedChange={async (checked) => {
                    if (checked && "Notification" in window) {
                      const permission = await Notification.requestPermission();
                      if (permission === "granted") {
                        updateNotificationSetting("desktop_enabled", true);
                        toast({
                          title: "Notifications enabled",
                          description: "You'll receive Windows desktop notifications for new updates",
                        });
                      } else if (permission === "denied") {
                        toast({
                          variant: "destructive",
                          title: "Permission denied",
                          description: "Please enable desktop notifications in your browser settings (Site Settings > Notifications)",
                        });
                        updateNotificationSetting("desktop_enabled", false);
                      } else {
                        updateNotificationSetting("desktop_enabled", false);
                      }
                    } else {
                      updateNotificationSetting("desktop_enabled", checked);
                    }
                  }}
                />
              </div>
              {notificationSettings.desktop_enabled && "Notification" in window && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-800">
                    ✓ Windows notifications are enabled. You'll see notifications in the Windows notification center when new updates arrive.
                    {window.location.hostname === "localhost" && (
                      <span className="block mt-1 text-blue-700">
                        Note: Some browsers may restrict notifications on localhost. If notifications don't appear, try deploying to a production URL with HTTPS.
                      </span>
                    )}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Admin Settings - Organization admins (and visible to master_admin with a note) */}
      {(userRole === "admin" || userRole === "master_admin") && (
        <>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              <CardTitle>Admin Settings</CardTitle>
            </div>
            <CardDescription>
              Configure organization-wide settings (organization admin only)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userRole === "master_admin" && !organizationId ? (
              <p className="text-muted-foreground text-sm">
                Sign in as an organization administrator to change these settings (e.g. manager approval limit, attachment rules, and whether cashiers can submit expenses).
              </p>
            ) : loading ? (
              <p className="text-muted-foreground">Loading settings...</p>
            ) : (
              <>
                <div className="space-y-2">
                    <Label htmlFor="approval-limit">Manager Approval Limit (₹)</Label>
                  <Input
                    id="approval-limit"
                    type="number"
                    min="0"
                    step="1"
                    value={engineerApprovalLimit}
                    onChange={(e) => setEngineerApprovalLimit(e.target.value)}
                    placeholder="50000"
                    className="max-w-xs"
                  />
                  <p className="text-sm text-muted-foreground">
                    Expenses below {formatINR(parseFloat(engineerApprovalLimit) || 0)} can be approved directly by managers.
                    Expenses at or above this limit must be verified by managers and then approved by administrators.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attachment-limit">Attachment Required Above Amount (₹)</Label>
                  <Input
                    id="attachment-limit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={attachmentRequiredAboveAmount}
                    onChange={(e) => setAttachmentRequiredAboveAmount(e.target.value)}
                    placeholder="50"
                    className="max-w-xs"
                  />
                  <p className="text-sm text-muted-foreground">
                    Expenses above {formatINR(parseFloat(attachmentRequiredAboveAmount) || 0)} require bill attachments.
                    Expenses at or below this amount do not require attachments.
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="allow-cashier-expense">Allow cashiers to submit expenses</Label>
                    <p className="text-sm text-muted-foreground">
                      When enabled, cashiers can create and submit expense claims; admins can approve them.
                    </p>
                  </div>
                  <Switch
                    id="allow-cashier-expense"
                    checked={allowCashierExpenseSubmission}
                    onCheckedChange={setAllowCashierExpenseSubmission}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={saveSettings} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expense Form Builder (Base Fields)</CardTitle>
              <CardDescription>
                Configure built-in fields used in the expense form.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="font-medium">Quick guide</p>
                <p className="text-muted-foreground mt-1">
                  1) Edit label/order, 2) toggle visible/required, 3) save. Core fields (Category, Expense Date, Amount) stay visible.
                </p>
              </div>
              <div className="hidden lg:grid grid-cols-[180px_minmax(220px,1fr)_90px_90px_90px] gap-2 px-2 text-xs font-medium text-muted-foreground">
                <div>Field</div>
                <div>Label</div>
                <div>Order</div>
                <div className="text-center">Visible</div>
                <div className="text-center">Required</div>
              </div>
              <div className="space-y-2">
                {(Object.keys(baseFieldConfig) as BaseExpenseFieldKey[])
                  .sort((a, b) => baseFieldConfig[a].display_order - baseFieldConfig[b].display_order)
                  .map((key) => {
                    const cfg = baseFieldConfig[key];
                    const forceVisible = key === "category" || key === "amount" || key === "expense_date";
                    return (
                      <div
                        key={key}
                        className="border rounded-lg p-3 lg:p-2 lg:grid lg:grid-cols-[180px_minmax(220px,1fr)_90px_90px_90px] lg:items-center lg:gap-2"
                      >
                        <div className="mb-2 lg:mb-0 flex items-center gap-2">
                          <span className="font-medium text-sm">{cfg.field_key}</span>
                          {forceVisible && <span className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">Core</span>}
                        </div>
                        <div className="mb-2 lg:mb-0">
                          <Input
                            value={cfg.label}
                            onChange={(e) =>
                              setBaseFieldConfig((prev) => ({
                                ...prev,
                                [key]: { ...prev[key], label: e.target.value },
                              }))
                            }
                          />
                        </div>
                        <div className="mb-3 lg:mb-0">
                          <Input
                            type="number"
                            value={cfg.display_order}
                            onChange={(e) =>
                              setBaseFieldConfig((prev) => ({
                                ...prev,
                                [key]: { ...prev[key], display_order: Number(e.target.value || 0) },
                              }))
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 lg:contents">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[11px] text-muted-foreground lg:hidden">Visible</span>
                            <Switch
                              checked={forceVisible ? true : cfg.is_visible}
                              disabled={forceVisible}
                              onCheckedChange={(v) =>
                                setBaseFieldConfig((prev) => ({
                                  ...prev,
                                  [key]: { ...prev[key], is_visible: v },
                                }))
                              }
                            />
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[11px] text-muted-foreground lg:hidden">Required</span>
                            <Switch
                              checked={cfg.is_required}
                              onCheckedChange={(v) =>
                                setBaseFieldConfig((prev) => ({
                                  ...prev,
                                  [key]: { ...prev[key], is_required: v },
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              <Button onClick={saveFormBuilderSettings} disabled={savingFormBuilder} className="w-full sm:w-auto">
                {savingFormBuilder ? "Saving..." : "Save Form Builder"}
              </Button>
            </CardContent>
          </Card>

          {/* Organization Logo */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                <CardTitle>Organization Logo</CardTitle>
              </div>
              <CardDescription>
                Optional image for your organization record. App navigation and sign-in use the PesoWise mark from <span className="font-medium">HERO.png</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Logo Preview */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="h-20 w-20 border-2 border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                    {logoPreview ? (
                      <img 
                        key="preview"
                        src={logoPreview} 
                        alt="Preview" 
                        className="h-full w-full object-contain"
                      />
                    ) : organization?.logo_url ? (
                      <img 
                        key={organization.logo_url}
                        src={organization.logo_url}
                        alt={organization.name || "Logo"} 
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/HERO.png";
                        }}
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {organization?.logo_url 
                      ? "Current organization logo" 
                      : "No logo uploaded. Default logo will be used."}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended: Square image, PNG or JPG, max 2MB
                  </p>
                </div>
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label htmlFor="logo-upload">Upload New Logo</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Validate file size (2MB)
                        if (file.size > 2 * 1024 * 1024) {
                          toast({
                            variant: "destructive",
                            title: "File too large",
                            description: "Logo must be less than 2MB",
                          });
                          return;
                        }
                        setLogoFile(file);
                        // Create preview
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setLogoPreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="max-w-xs"
                    disabled={uploadingLogo}
                  />
                  {logoFile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Upload/Remove Buttons */}
              <div className="flex gap-2">
                {logoFile && (
                  <Button 
                    onClick={handleLogoUpload} 
                    disabled={uploadingLogo || !logoFile}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingLogo ? "Uploading..." : "Upload Logo"}
                  </Button>
                )}
                {organization?.logo_url && !logoFile && (
                  <Button 
                    variant="destructive"
                    onClick={handleLogoDelete}
                    disabled={uploadingLogo}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Logo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <CardTitle>Location Management</CardTitle>
                </div>
                <Button onClick={() => openLocationDialog()} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              </div>
              <CardDescription>
                Manage locations for organizing engineers and teams. Useful for income tax audits and organizational structure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLocations ? (
                <p className="text-muted-foreground">Loading locations...</p>
              ) : locations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No locations created yet.</p>
                  <p className="text-sm mt-2">Click "Add Location" to create your first location.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {locations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{location.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openLocationDialog(location)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteLocationDialog(location)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data & backup */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle>Data & backup</CardTitle>
              </div>
              <CardDescription>
                Download a full backup of your organization data (expenses, profiles, categories, etc.) or restore from a previous backup. Optionally include receipt files in a ZIP.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-receipts"
                  checked={includeReceipts}
                  onCheckedChange={(v) => setIncludeReceipts(v === true)}
                />
                <Label htmlFor="include-receipts" className="text-sm font-normal cursor-pointer">
                  Include receipt files (downloads as ZIP with data + receipts)
                </Label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadBackup}
                  disabled={backupLoading || !organizationId}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {backupLoading ? "Preparing backup…" : includeReceipts ? "Download backup (ZIP)" : "Download data backup"}
                </Button>
                <input
                  ref={restoreFileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleRestoreFileSelect}
                />
                <Button
                  variant="outline"
                  onClick={() => restoreFileInputRef.current?.click()}
                  disabled={restoreLoading || !organizationId}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore from backup
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Restore confirmation dialog */}
      <AlertDialog
        open={restoreConfirmOpen}
        onOpenChange={(open) => {
          setRestoreConfirmOpen(open);
          if (!open) {
            setRestoreFile(null);
            setRestorePreview(null);
          }
        }}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Restore from backup</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  This will add or update data for this organization. Existing rows with the same ID will be updated; new rows will be inserted.
                </p>
                {restorePreview && (() => {
                  const preview = getBackupPreview(restorePreview);
                  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";
                  return (
                    <div className="rounded-md border bg-muted/50 p-3 text-sm space-y-2">
                      <p className="font-medium text-foreground">Preview — what will be restored</p>
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">{preview.organizationName}</span>
                        {" · "}
                        Backup exported {preview.exportedAt ? new Date(preview.exportedAt).toLocaleString() : "—"}
                      </p>
                      <p className="text-muted-foreground">
                        Data period: <span className="text-foreground">{formatDate(preview.dataFrom)}</span>
                        {" → "}
                        <span className="text-foreground">{formatDate(preview.dataTo)}</span>
                        {!preview.dataFrom && !preview.dataTo && " (no date range in backup)"}
                      </p>
                      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground list-none">
                        {preview.counts.expenses > 0 && <li>Expenses: <span className="text-foreground font-medium">{preview.counts.expenses}</span></li>}
                        {preview.counts.profiles > 0 && <li>Profiles: <span className="text-foreground font-medium">{preview.counts.profiles}</span></li>}
                        {preview.counts.organization_memberships > 0 && <li>Memberships: <span className="text-foreground font-medium">{preview.counts.organization_memberships}</span></li>}
                        {preview.counts.expense_line_items > 0 && <li>Line items: <span className="text-foreground font-medium">{preview.counts.expense_line_items}</span></li>}
                        {preview.counts.attachments > 0 && <li>Attachments: <span className="text-foreground font-medium">{preview.counts.attachments}</span></li>}
                        {preview.counts.audit_logs > 0 && <li>Audit logs: <span className="text-foreground font-medium">{preview.counts.audit_logs}</span></li>}
                        {preview.counts.cash_transfer_history > 0 && <li>Transfers: <span className="text-foreground font-medium">{preview.counts.cash_transfer_history}</span></li>}
                        {preview.counts.expense_categories > 0 && <li>Categories: <span className="text-foreground font-medium">{preview.counts.expense_categories}</span></li>}
                        {preview.counts.locations > 0 && <li>Locations: <span className="text-foreground font-medium">{preview.counts.locations}</span></li>}
                      </ul>
                      <p className="text-muted-foreground pt-1 border-t text-xs">
                        Receipt files are not re-uploaded; only database records are restored.
                      </p>
                    </div>
                  );
                })()}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreConfirm} disabled={restoreLoading}>
              {restoreLoading ? "Restoring…" : "Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Location Dialog */}
      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locationToEdit ? "Edit Location" : "Add New Location"}
            </DialogTitle>
            <DialogDescription>
              {locationToEdit
                ? "Update the location name"
                : "Create a new location for organizing engineers and teams"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="location-name">Location Name</Label>
              <Input
                id="location-name"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., London, Mumbai, Delhi"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    saveLocation();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLocationDialogOpen(false);
                setLocationName("");
                setLocationToEdit(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveLocation} disabled={savingLocation || !locationName.trim()}>
              {savingLocation ? "Saving..." : locationToEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Location Confirmation Dialog */}
      <AlertDialog open={deleteLocationDialogOpen} onOpenChange={setDeleteLocationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{locationToDelete?.name}"? This will remove all engineer assignments to this location. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteLocation}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletingLocation}
            >
              {deletingLocation ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

