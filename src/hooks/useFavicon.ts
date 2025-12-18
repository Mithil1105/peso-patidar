import { useEffect } from "react";
import { getMostRecentOrganization, getCachedOrganization } from "@/lib/organizationCache";

/**
 * Hook to update favicon and page title based on organization logo
 * Uses cached organization data to set favicon dynamically
 */
export function useFavicon(email?: string) {
  useEffect(() => {
    const updateFavicon = () => {
      try {
        // Get organization data from cache
        const orgData = email 
          ? getCachedOrganization(email)
          : getMostRecentOrganization();

        if (orgData?.logo_url) {
          // Update favicon
          let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
          if (!favicon) {
            favicon = document.createElement("link");
            favicon.rel = "icon";
            favicon.type = "image/png";
            document.head.appendChild(favicon);
          }
          
          // Create a new image to test if logo loads
          const img = new Image();
          img.onload = () => {
            // Logo loaded successfully, update favicon
            favicon.href = orgData.logo_url;
            
            // Also update apple-touch-icon for iOS
            let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
            if (!appleIcon) {
              appleIcon = document.createElement("link");
              appleIcon.rel = "apple-touch-icon";
              document.head.appendChild(appleIcon);
            }
            appleIcon.href = orgData.logo_url;
          };
          img.onerror = () => {
            // Logo failed to load, use default
            favicon.href = "/HERO.png";
          };
          img.src = orgData.logo_url;
        } else {
          // No cached logo, use default
          let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
          if (favicon) {
            favicon.href = "/HERO.png";
          }
        }
      } catch (error) {
        console.error("Error updating favicon:", error);
        // Fallback to default favicon
        let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
        if (favicon) {
          favicon.href = "/HERO.png";
        }
      }
    };

    updateFavicon();
  }, [email]);
}

