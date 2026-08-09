"use client";

import { Suspense, useEffect, useState } from "react";
import Script from "next/script";
import { useSearchParams } from "next/navigation";

const WATER_DENSITY = 1000;
const ModelViewer = "model-viewer" as any; // eslint-disable-line @typescript-eslint/no-explicit-any

function DensiteArContent() {
  const params = useSearchParams();

  // Valeurs initiales envoyées par l'app mobile — modifiables ensuite
  // directement sur cette page, sans y retourner.
  const [mass, setMass] = useState(() => parseFloat(params.get("mass") ?? "500"));
  const [volume, setVolume] = useState(() => parseFloat(params.get("volume") ?? "600"));

  // Le modèle 3D n'est régénéré qu'après une courte pause (debounce) pour
  // éviter de redemander un .glb à chaque pixel de glissement du curseur.
  const [modelSrc, setModelSrc] = useState(() => buildModelUrl(volume));
  useEffect(() => {
    const timeout = setTimeout(() => setModelSrc(buildModelUrl(volume)), 250);
    return () => clearTimeout(timeout);
  }, [volume]);

  const density = (mass / volume) * 1000; // kg/m3
  const floats = density < WATER_DENSITY;
  const edgeCm = Math.cbrt(volume);

  return (
    <div style={styles.page}>
      <Script
        type="module"
        src="https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js"
        strategy="afterInteractive"
      />

      <div style={styles.header}>
        <span style={styles.eyebrow}>Simulation AR · GPIG</span>
        <h1 style={styles.title}>Densité et flottaison</h1>
      </div>

      <ModelViewer
        src={modelSrc}
        alt="Objet de simulation densité"
        ar
        ar-modes="scene-viewer webxr quick-look"
        camera-controls
        auto-rotate
        shadow-intensity="1"
        exposure="1"
        style={styles.viewer}
      >
        <button slot="ar-button" style={styles.arButton}>
          🅰🆁 Voir dans ma pièce (RA)
        </button>
      </ModelViewer>

      <div style={styles.controls}>
        <label style={styles.label}>
          Masse de l'objet : <strong>{mass} g</strong>
        </label>
        <input
          type="range"
          min={50}
          max={1500}
          step={50}
          value={mass}
          onChange={(e) => setMass(parseFloat(e.target.value))}
          style={styles.range}
        />

        <label style={styles.label}>
          Volume de l'objet : <strong>{volume} cm³</strong>
        </label>
        <input
          type="range"
          min={100}
          max={1500}
          step={50}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          style={styles.range}
        />

        <p style={styles.readout}>
          Arête réelle ≈ {(edgeCm).toFixed(1)} cm — ρ = <strong>{density.toFixed(0)} kg/m³</strong> —{" "}
          {floats ? "l'objet flotte" : "l'objet coule"} (eau = 1000 kg/m³)
        </p>
      </div>

      <p style={styles.note}>
        Sur Android, le bouton RA ouvre <strong>Scene Viewer</strong> avec un vrai ancrage spatial (l'objet reste
        fixé au sol quand tu bouges le téléphone). Sur iPhone récent, <strong>AR Quick Look</strong> fait de même.
        Change les curseurs puis relance la RA pour voir la différence.
      </p>
    </div>
  );
}

function buildModelUrl(volume: number) {
  const edgeCm = Math.cbrt(volume);
  const edgeM = Math.max(0.03, Math.min(0.4, edgeCm / 100));
  return `/api/ar/box-model?size=${edgeM.toFixed(3)}&r=240&g=169&b=78`;
}

export default function DensiteArPage() {
  return (
    <Suspense fallback={null}>
      <DensiteArContent />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0B1120",
    color: "#F1F5F9",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    padding: "24px 20px 40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  header: { textAlign: "center", maxWidth: 420, marginBottom: 16 },
  eyebrow: { color: "#22D3EE", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 },
  title: { fontSize: 22, margin: "8px 0 0" },
  viewer: {
    width: "100%",
    maxWidth: 420,
    height: 320,
    background: "#1E293B",
    borderRadius: 16,
  },
  controls: { width: "100%", maxWidth: 420, marginTop: 20 },
  label: { display: "block", fontSize: 13, color: "#CBD5E1", marginTop: 14, marginBottom: 6 },
  range: { width: "100%" },
  readout: {
    fontSize: 13,
    color: "#94A3B8",
    background: "#1E293B",
    borderRadius: 10,
    padding: "10px 12px",
    marginTop: 14,
    lineHeight: 1.6,
  },
  arButton: {
    background: "#22D3EE",
    color: "#0B1120",
    border: "none",
    borderRadius: 10,
    padding: "12px 18px",
    fontWeight: 700,
    fontSize: 14,
    position: "absolute",
    bottom: 16,
    left: "50%",
    transform: "translateX(-50%)",
  },
  note: { color: "#64748B", fontSize: 12, maxWidth: 420, textAlign: "center", marginTop: 20, lineHeight: 1.6 },
};
