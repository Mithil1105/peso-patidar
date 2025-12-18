import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Removed signup: tabs no longer needed
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { getCachedOrganization, getMostRecentOrganization } from "@/lib/organizationCache";
import { useFavicon } from "@/hooks/useFavicon";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Auth() {
  const [loading, setLoading] = useState(false);
  
  // Update favicon based on cached organization logo
  useFavicon();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [logoUrl, setLogoUrl] = useState<string>("/HERO.png"); // Default Pesowise logo
  const [organizationName, setOrganizationName] = useState<string | null>(null); // Organization name from cache
  // signup removed
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
    
    // Load most recent organization logo and name for initial display
    const recentOrg = getMostRecentOrganization();
    if (recentOrg?.logo_url) {
      setLogoUrl(recentOrg.logo_url);
    }
    if (recentOrg?.name) {
      setOrganizationName(recentOrg.name);
    }
  }, [navigate]);

  // Update logo and organization name when email changes (check cache for that email)
  useEffect(() => {
    if (email && email.includes('@')) {
      const cachedOrg = getCachedOrganization(email);
      if (cachedOrg?.logo_url) {
        setLogoUrl(cachedOrg.logo_url);
      } else {
        // Fallback to most recent or default
        const recentOrg = getMostRecentOrganization();
        setLogoUrl(recentOrg?.logo_url || "/HERO.png");
      }
      if (cachedOrg?.name) {
        setOrganizationName(cachedOrg.name);
      } else {
        // Fallback to most recent or null
        const recentOrg = getMostRecentOrganization();
        setOrganizationName(recentOrg?.name || null);
      }
    } else {
      // No email entered, show most recent or default
      const recentOrg = getMostRecentOrganization();
      setLogoUrl(recentOrg?.logo_url || "/HERO.png");
      setOrganizationName(recentOrg?.name || null);
    }
  }, [email]);

  // signup removed

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = authSchema.omit({ name: true }).parse({ email, password });
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) throw error;

      navigate("/dashboard");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={logoUrl}
              alt="Organization Logo" 
              className="h-16 w-auto object-contain"
              onError={(e) => {
                // Fallback to default logo if cached logo fails to load
                (e.target as HTMLImageElement).src = "/HERO.png";
              }}
            />
          </div>
          {organizationName && (
            <CardTitle className="text-xl font-bold text-primary mb-2">
              {organizationName}
            </CardTitle>
          )}
          <CardTitle className={`text-2xl ${organizationName ? 'text-muted-foreground' : ''}`}>
            PesoWise - Powered by Unimisk
          </CardTitle>
          <CardDescription>
            Petty Cash management app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <Input
                id="signin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
