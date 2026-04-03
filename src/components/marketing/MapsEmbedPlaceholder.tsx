import { MapPin } from "lucide-react";

/**
 * Placeholder block for an embedded Google Map (Contact page).
 *
 * To activate:
 * 1. Open Google Maps → your business → Share → Embed a map.
 * 2. Copy the iframe `src` URL.
 * 3. Replace the iframe below (or pass src as a prop from env: VITE_GOOGLE_MAPS_EMBED_URL).
 */
const EMBED_SRC = import.meta.env.VITE_GOOGLE_MAPS_EMBED_URL as string | undefined;

export function MapsEmbedPlaceholder() {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-soft" aria-labelledby="maps-heading">
      <h2 id="maps-heading" className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-primary" aria-hidden />
        Location
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Our team is based in Ahmedabad, Gujarat, India, and serves organizations across India and remotely
        worldwide. Use the map below once your Google Maps embed URL is configured.
      </p>
      {EMBED_SRC ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
          <iframe
            title="PesoWise office location map"
            src={EMBED_SRC}
            className="absolute inset-0 h-full w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 px-4 text-center text-sm text-muted-foreground">
          {/* Embed: paste Google Maps iframe src into VITE_GOOGLE_MAPS_EMBED_URL or replace this block. */}
          Map embed not configured. Set <span className="mx-1 font-mono text-xs">VITE_GOOGLE_MAPS_EMBED_URL</span> in
          your deployment environment, or add an iframe in{" "}
          <code className="text-xs">MapsEmbedPlaceholder.tsx</code>.
        </div>
      )}
    </section>
  );
}
