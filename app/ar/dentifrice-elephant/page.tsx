"use client";

import { Suspense, useEffect, useState } from "react";
import Script from "next/script";
import { useSearchParams } from "next/navigation";

// Contourne JSX.IntrinsicElements pour ce web component custom (voir
// /ar/densite/page.tsx pour le même choix et pourquoi).
const ModelViewer = "model-viewer" as any; // eslint-disable-line @typescript-eslint/no-explicit-any

function DentifriceArContent() {
  const params = useSearchParams();

  // 0 = catalyseur dilué (réaction lente), 100 = concentré (réaction rapide)
  const [concentration, setConcentration] = useState(() => parseFloat(params.get("speed") ?? "50"));
  const speed = 0.4 + (concentration / 100) * 2; // mappe 0-100 -> x0.4 à x2.4

  const [modelSrc, setModelSrc] = useState(() => buildModelUrl(speed));
  const [iosSrc, setIosSrc] = useState(() => buildUsdzUrl(speed));
  useEffect(() => {
    const timeout = setTimeout(() => {
      setModelSrc(buildModelUrl(speed));
      setIosSrc(buildUsdzUrl(speed));
    }, 250);
    return () => clearTimeout(timeout);
  }, [speed]);

  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<"catalyseur" | "reactif" | "produit" | null>(null);

  return (
    <div style={styles.page}>
      <Script
        type="module"
        src="https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js"
        strategy="afterInteractive"
      />

      <div style={styles.header}>
        <span style={styles.eyebrow}>Simulation AR · GPIG</span>
        <h1 style={styles.title}>Le dentifrice d&apos;éléphant</h1>
        <p style={styles.subtitle}>
          2 H₂O₂ → 2 H₂O + O₂ — décomposition du peroxyde d&apos;hydrogène, très exothermique,
          accélérée par un catalyseur (iodure de potassium ou catalase).
        </p>
      </div>

      <ModelViewer
        src={modelSrc}
        ios-src={iosSrc}
        alt="Bouteille avec jaillissement de mousse animé"
        ar
        ar-modes="scene-viewer webxr quick-look"
        camera-controls
        auto-rotate
        autoplay
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
          Concentration en catalyseur : <strong>{concentration}%</strong>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={concentration}
          onChange={(e) => setConcentration(parseFloat(e.target.value))}
          style={styles.range}
        />
        <p style={styles.readout}>
          {concentration < 30
            ? "Catalyseur dilué : la réaction est lente."
            : concentration > 70
              ? "Catalyseur concentré : la réaction est quasi instantanée."
              : "Concentration modérée : vitesse de réaction intermédiaire."}
        </p>
      </div>

      <div style={styles.quizArea}>
        <p style={styles.question}>
          Question : dans cette réaction, le catalyseur (KI ou catalase)...
        </p>
        {(
          [
            { key: "catalyseur", label: "Accélère la réaction sans être consommé" },
            { key: "reactif", label: "Est consommé comme réactif principal" },
            { key: "produit", label: "Est un produit final de la réaction" },
          ] as const
        ).map((choice) => {
          const showCorrect = answered && choice.key === "catalyseur";
          const showWrong = answered && selected === choice.key && choice.key !== "catalyseur";
          return (
            <button
              key={choice.key}
              onClick={() => {
                if (answered) return;
                setAnswered(true);
                setSelected(choice.key);
              }}
              style={{
                ...styles.choiceBtn,
                ...(showCorrect ? styles.choiceCorrect : {}),
                ...(showWrong ? styles.choiceWrong : {}),
              }}
            >
              {choice.label}
            </button>
          );
        })}
        {answered && (
          <p style={styles.feedback}>
            {selected === "catalyseur"
              ? "Exact ! Un catalyseur accélère une réaction en abaissant son énergie d'activation, mais il est régénéré à la fin — la vitesse change, pas le bilan final."
              : "Pas tout à fait : un catalyseur n'est ni consommé ni produit, il abaisse juste l'énergie d'activation. Regarde le curseur : plus il y en a, plus vite ça réagit."}
          </p>
        )}
      </div>

      <p style={styles.note}>
        Modèle stylisé (cylindres), pas une simulation de fluide réaliste — l&apos;objectif est
        d&apos;illustrer la cinétique (vitesse de réaction), pas l&apos;aspect visuel exact de la
        mousse. Sur Android, le bouton RA ouvre Scene Viewer ; sur iPhone récent, AR Quick Look —
        avec un vrai ancrage spatial dans les deux cas.
      </p>
    </div>
  );
}

function buildModelUrl(speed: number) {
  return `/api/ar/toothpaste-model?speed=${speed.toFixed(2)}`;
}

function buildUsdzUrl(speed: number) {
  return `/api/ar/toothpaste-model.usdz?speed=${speed.toFixed(2)}`;
}

export default function DentifriceArPage() {
  return (
    <Suspense fallback={null}>
      <DentifriceArContent />
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
  title: { fontSize: 22, margin: "8px 0 8px" },
  subtitle: { color: "#94A3B8", fontSize: 13, lineHeight: 1.6 },
  viewer: {
    width: "100%",
    maxWidth: 420,
    height: 320,
    background: "#1E293B",
    borderRadius: 16,
  },
  controls: { width: "100%", maxWidth: 420, marginTop: 20 },
  label: { display: "block", fontSize: 13, color: "#CBD5E1", marginBottom: 6 },
  range: { width: "100%" },
  readout: {
    fontSize: 13,
    color: "#94A3B8",
    background: "#1E293B",
    borderRadius: 10,
    padding: "10px 12px",
    marginTop: 12,
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
  quizArea: {
    width: "100%",
    maxWidth: 420,
    marginTop: 24,
    borderTop: "1px solid #334155",
    paddingTop: 18,
  },
  question: { fontSize: 14, marginBottom: 12 },
  choiceBtn: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #334155",
    background: "transparent",
    color: "#CBD5E1",
    fontSize: 13,
    marginBottom: 8,
    cursor: "pointer",
  },
  choiceCorrect: { borderColor: "#4ADE80", background: "rgba(74,222,128,0.12)", color: "#DCFCE7" },
  choiceWrong: { borderColor: "#F87171", background: "rgba(248,113,113,0.12)", color: "#FEE2E2" },
  feedback: {
    fontSize: 12.5,
    lineHeight: 1.6,
    color: "#E2E8F0",
    background: "rgba(74,222,128,0.1)",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  note: { color: "#64748B", fontSize: 12, maxWidth: 420, textAlign: "center", marginTop: 20, lineHeight: 1.6 },
};
