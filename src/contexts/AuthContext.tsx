import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { cacheOrganization } from "@/lib/organizationCache";

type AppRole = "admin" | "engineer" | "employee" | "cashier";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  organization_id: string | null;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  logo_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  userProfile: UserProfile | null;
  organization: Organization | null;
  organizationId: string | null;
  isMasterAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: (userId?: string) => Promise<void>;
  refreshOrganization: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user role, profile, and organization when session changes
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
            fetchUserProfile(session.user.id);
            fetchOrganization(session.user.id);
            fetchMasterAdminStatus(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setUserProfile(null);
          setOrganization(null);
          setOrganizationId(null);
          setIsMasterAdmin(false);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
        fetchUserProfile(session.user.id);
        fetchOrganization(session.user.id);
        fetchMasterAdminStatus(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // Get role from organization_memberships instead of user_roles
      const { data, error } = await supabase
        .from("organization_memberships")
        .select("role")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      setUserRole(data?.role || null);
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, organization_id")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
      if (data?.organization_id) {
        setOrganizationId(data.organization_id);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_master_admin")
        .eq("user_id", userId)
        .single();
      
      if (error) {
        console.error("Error fetching master admin status:", error);
        // Also check master_admin_memberships table as fallback
        const { data: membershipData, error: membershipError } = await supabase
          .from("master_admin_memberships")
          .select("is_active")
          .eq("user_id", userId)
          .eq("is_active", true)
          .maybeSingle();
        
        if (!membershipError && membershipData) {
          console.log("Master admin found via master_admin_memberships table");
          setIsMasterAdmin(true);
          return;
        }
        setIsMasterAdmin(false);
        return;
      }
      
      const isMaster = data?.is_master_admin || false;
      console.log("Master admin status:", isMaster, "for user:", userId);
      setIsMasterAdmin(isMaster);
    } catch (error) {
      console.error("Error fetching master admin status:", error);
      setIsMasterAdmin(false);
    }
  };

  const fetchOrganization = async (userId: string) => {
    try {
      // Get organization via organization_memberships
      const { data: membership, error: membershipError } = await supabase
        .from("organization_memberships")
        .select("organization_id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();

      if (membershipError) throw membershipError;
      
      // Check if user is master admin (master admins don't have organization)
      const { data: masterAdminCheck } = await supabase
        .from("profiles")
        .select("is_master_admin")
        .eq("user_id", userId)
        .single();
      
      if (masterAdminCheck?.is_master_admin) {
        // Master admin doesn't have an organization
        return;
      }
      
      if (!membership?.organization_id) return;

      // Fetch organization details
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, slug, plan, logo_url, is_blocked, is_active, payment_status")
        .eq("id", membership.organization_id)
        .single();

      if (orgError) throw orgError;
      
      // Check master admin status before checking organization block
      const { data: masterAdminData } = await supabase
        .from("profiles")
        .select("is_master_admin")
        .eq("user_id", userId)
        .single();
      
      const isUserMasterAdmin = masterAdminData?.is_master_admin || false;
      
      // Check if organization is blocked
      if (orgData.is_blocked || !orgData.is_active) {
        console.warn("Organization is blocked or inactive");
        // Don't block master admins
        if (!isUserMasterAdmin) {
          await signOut();
          return;
        }
      }
      
      setOrganization(orgData);
      setOrganizationId(orgData.id);
      
      // Cache organization data for login page logo display
      // Get user email from session or current user
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser?.email && orgData) {
          cacheOrganization(currentUser.email, {
            id: orgData.id,
            name: orgData.name,
            logo_url: orgData.logo_url || null
          });
        }
      } catch (cacheError) {
        // Non-critical error, just log it
        console.warn('Could not cache organization:', cacheError);
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
    }
  };

  const refreshUserProfile = async (userIdOverride?: string) => {
    const id = userIdOverride || user?.id;
    if (!id) return;
    await fetchUserProfile(id);
  };

  const refreshOrganization = async () => {
    if (!user?.id) return;
    await fetchOrganization(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      userRole, 
      userProfile, 
      organization,
      organizationId,
      isMasterAdmin,
      loading, 
      signOut, 
      refreshUserProfile,
      refreshOrganization
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
