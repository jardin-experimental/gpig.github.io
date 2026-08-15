"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * RA géolocalisée "légère" : GPS (position) + boussole (orientation), sans
 * VPS (pas de comparaison caméra/carte 3D). Gratuit, tout en JS, aucun
 * service tiers.
 *
 * Contrepartie assumée : précision de quelques mètres (GPS) et une
 * boussole web dont la fiabilité varie beaucoup selon l'appareil,
 * particulièrement sur Android où l'orientation "vraie" (par rapport au
 * nord) n'est pas garantie par tous les navigateurs. iOS Safari est plus
 * fiable ici grâce à `webkitCompassHeading`. Pas d'ancrage centimétrique :
 * si tu as besoin de ça plus tard, il faudra un VPS payant (Immersal,
 * Onirix) ou du natif (ARCore Geospatial API).
 *
 * Deux façons de configurer une chasse :
 *
 *   1. Par slug (recommandé) — la config vient de la table Supabase
 *      `chasses_ar` (voir supabase/migrations/0001_chasses_ar.sql) :
 *        /ar/chasse?slug=fossile-cour
 *
 *   2. Par paramètres bruts — pratique pour un test rapide sans créer de
 *      ligne en base, mais à éviter pour du contenu réel (URL longue à
 *      partager, rien de centralisé si tu dois corriger une coordonnée) :
 *        /ar/chasse?lat=48.8566&lng=2.3522&url=https://...&label=...
 */

interface ChasseConfig {
  lat: number;
  lng: number;
  radius: number;
  angleTolerance: number;
  url: string;
  label: string;
}

interface GeoState {
  lat: number;
  lng: number;
  accuracy: number;
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}
function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingTo(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function angleDiff(a: number, b: number) {
  let diff = Math.abs(a - b) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

function ChasseArContent() {
  const params = useSearchParams();
  const slug = params.get("slug");

  const [config, setConfig] = useState<ChasseConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(Boolean(slug));

  useEffect(() => {
    if (!slug) {
      // Mode paramètres bruts — pas de requête Supabase.
      const lat = parseFloat(params.get("lat") ?? "");
      const lng = parseFloat(params.get("lng") ?? "");
      const url = params.get("url") ?? "";
      if (Number.isFinite(lat) && Number.isFinite(lng) && url) {
        setConfig({
          lat,
          lng,
          radius: parseFloat(params.get("radius") ?? "15"),
          angleTolerance: parseFloat(params.get("angle") ?? "35"),
          url,
          label: params.get("label") ?? "l'objet mystère",
        });
      }
      setLoadingConfig(false);
      return;
    }

    setLoadingConfig(true);
    const supabase = createClient();
    supabase
      .from("chasses_ar")
      .select("label, latitude, longitude, rayon_metres, tolerance_angle, url_destination")
      .eq("slug", slug)
      .eq("is_active", true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setConfigError("Chasse introuvable ou plus active.");
        } else {
          setConfig({
            lat: data.latitude,
            lng: data.longitude,
            radius: data.rayon_metres,
            angleTolerance: data.tolerance_angle,
            url: data.url_destination,
            label: data.label,
          });
        }
        setLoadingConfig(false);
      });
  }, [slug, params]);

  const targetLat = config?.lat ?? NaN;
  const targetLng = config?.lng ?? NaN;
  const radius = config?.radius ?? 15;
  const angleTolerance = config?.angleTolerance ?? 35;
  const targetUrl = config?.url ?? "";
  const label = config?.label ?? "l'objet mystère";

  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geo, setGeo] = useState<GeoState | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [found, setFound] = useState(false);
  const redirectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validConfig = Number.isFinite(targetLat) && Number.isFinite(targetLng) && targetUrl.length > 0;

  async function handleStart() {
    setError(null);
    try {
      // iOS Safari exige un geste utilisateur explicite pour autoriser
      // l'accès à l'orientation de l'appareil — d'où ce bouton, pas de
      // démarrage automatique possible.
      const DOE = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied">;
      };
      if (typeof DOE?.requestPermission === "function") {
        const result = await DOE.requestPermission();
        if (result !== "granted") throw new Error("Permission boussole refusée.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      navigator.geolocation.watchPosition(
        (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        () => setError("Impossible d'accéder à ta position GPS."),
        { enableHighAccuracy: true, maximumAge: 1000 }
      );

      window.addEventListener("deviceorientationabsolute", handleOrientation as EventListener, true);
      window.addEventListener("deviceorientation", handleOrientation as EventListener, true);

      setStarted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de démarrer — vérifie les autorisations caméra/position.");
    }
  }

  function handleOrientation(event: DeviceOrientationEvent & { webkitCompassHeading?: number }) {
    if (typeof event.webkitCompassHeading === "number") {
      // iOS Safari : déjà une orientation "vraie" par rapport au nord.
      setHeading(event.webkitCompassHeading);
    } else if (event.absolute && event.alpha != null) {
      // Android (deviceorientationabsolute) : alpha est dans le sens
      // anti-horaire depuis le nord, on l'inverse pour un cap classique.
      setHeading((360 - event.alpha) % 360);
    } else if (event.alpha != null && heading == null) {
      // Repli le moins fiable : pas garanti aligné sur le vrai nord.
      setHeading((360 - event.alpha) % 360);
    }
  }

  const distance = geo ? distanceMeters(geo.lat, geo.lng, targetLat, targetLng) : null;
  const bearing = geo ? bearingTo(geo.lat, geo.lng, targetLat, targetLng) : null;
  const diff = heading != null && bearing != null ? angleDiff(heading, bearing) : null;

  const isAligned = diff != null && diff <= angleTolerance;
  const isClose = distance != null && distance <= radius;

  useEffect(() => {
    if (isAligned && isClose && !found) {
      setFound(true);
      redirectTimeout.current = setTimeout(() => {
        window.location.href = targetUrl;
      }, 1800);
    }
    return () => {
      if (redirectTimeout.current) clearTimeout(redirectTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAligned, isClose]);

  if (loadingConfig) {
    return (
      <div style={styles.page}>
        <div style={styles.startScreen}>
          <p style={styles.subtitle}>Chargement de la chasse…</p>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div style={styles.page}>
        <div style={styles.startScreen}>
          <p style={styles.errorText}>{configError}</p>
        </div>
      </div>
    );
  }

  if (!validConfig) {
    return (
      <div style={styles.page}>
        <p style={styles.errorText}>
          Lien invalide — utilise <code>?slug=...</code> (chasse enregistrée) ou{" "}
          <code>?lat=...&lng=...&url=...</code> (test rapide).
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {!started ? (
        <div style={styles.startScreen}>
          <span style={styles.eyebrow}>Chasse au trésor · GPIG</span>
          <h1 style={styles.title}>Trouve {label}</h1>
          <p style={styles.subtitle}>
            Déplace-toi et oriente ton téléphone pour retrouver l&apos;indice caché à proximité.
          </p>
          <button style={styles.startButton} onClick={handleStart}>
            📍 Activer la caméra et la boussole
          </button>
          {error && <p style={styles.errorText}>{error}</p>}
        </div>
      ) : (
        <>
          <video ref={videoRef} playsInline muted style={styles.video} />

          {found ? (
            <div style={styles.foundOverlay}>
              <div style={styles.foundBadge}>🎉</div>
              <p style={styles.foundText}>Trouvé ! {label}</p>
              <p style={styles.foundSubtext}>Redirection en cours…</p>
            </div>
          ) : (
            <div style={styles.hud}>
              <div style={styles.compassWrap}>
                <div
                  style={{
                    ...styles.compassArrow,
                    transform: `rotate(${diff != null && bearing != null && heading != null ? bearing - heading : 0}deg)`,
                  }}
                >
                  ⬆️
                </div>
              </div>
              <p style={styles.hudText}>
                {distance != null ? `${distance < 1000 ? distance.toFixed(0) + " m" : (distance / 1000).toFixed(1) + " km"}` : "Localisation…"}
                {isClose && !isAligned && " — tourne-toi vers la flèche"}
                {!isClose && " — rapproche-toi"}
              </p>
              {geo && geo.accuracy > 30 && (
                <p style={styles.hudHint}>Précision GPS faible ({geo.accuracy.toFixed(0)} m) — sors si possible.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#000", color: "#F1F5F9", position: "relative", overflow: "hidden" },
  startScreen: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    textAlign: "center",
    background: "#0B1120",
  },
  eyebrow: { color: "#22D3EE", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 },
  title: { fontSize: 24, margin: "10px 0" },
  subtitle: { color: "#94A3B8", fontSize: 14, maxWidth: 320, lineHeight: 1.6, marginBottom: 24 },
  startButton: {
    background: "#22D3EE",
    color: "#0B1120",
    border: "none",
    borderRadius: 12,
    padding: "14px 22px",
    fontWeight: 700,
    fontSize: 15,
  },
  errorText: { color: "#F87171", fontSize: 13, marginTop: 16, maxWidth: 320 },
  video: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
  hud: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  compassWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    background: "rgba(11,17,32,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  compassArrow: { fontSize: 40, transition: "transform 0.15s linear" },
  hudText: {
    background: "rgba(11,17,32,0.8)",
    padding: "8px 16px",
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 600,
  },
  hudHint: { background: "rgba(120,53,15,0.8)", padding: "6px 14px", borderRadius: 16, fontSize: 11.5 },
  foundOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(11,17,32,0.85)",
  },
  foundBadge: { fontSize: 64, marginBottom: 12 },
  foundText: { fontSize: 20, fontWeight: 700 },
  foundSubtext: { color: "#94A3B8", fontSize: 13, marginTop: 6 },
};

export default function ChasseArPage() {
  return (
    <Suspense fallback={null}>
      <ChasseArContent />
    </Suspense>
  );
}