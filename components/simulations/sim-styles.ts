import type { CSSProperties } from "react";

/**
 * Styles partagés pour tous les composants de simulation.
 * Import : import { simStyles as s } from "./sim-styles";
 *
 * Les couleurs "chrome" (carte, boutons, fond) suivent les tokens de marque
 * GPIG (moss/paper/ink, cf. tailwind.config.ts et app/globals.css). Les
 * couleurs propres à chaque diagramme SVG (objets, courbes, composants
 * électriques...) restent définies dans chaque composant : elles servent à
 * distinguer plusieurs éléments simultanés et n'ont pas vocation à porter la
 * marque.
 */
export const simStyles: Record<string, CSSProperties> = {
  card: {
    maxWidth: 420,
    margin: "0 auto",
    fontFamily: "var(--font-body), sans-serif",
    border: "1px solid #D6D9CC",
    borderRadius: 16,
    overflow: "hidden",
    background: "#ffffff",
    boxShadow: "0 2px 12px rgba(20,20,40,0.06)",
  },
  header: { padding: "18px 20px 4px" },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#4A5A4C",
  },
  title: {
    margin: "4px 0 0",
    fontSize: 20,
    color: "#1F2B22",
    fontFamily: "var(--font-display), serif",
  },
  simArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "8px 20px 4px",
  },
  svg: { background: "#EEF0E8", borderRadius: 12 },
  controls: { width: "100%", marginTop: 8 },
  label: { display: "block", fontSize: 13, color: "#3c3c48", marginBottom: 10 },
  range: { width: "100%", marginTop: 4 },
  readout: {
    fontSize: 13,
    color: "#3c3c48",
    background: "#E4E7DC",
    borderRadius: 8,
    padding: "6px 10px",
    marginBottom: 10,
  },
  button: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "#3F6B46",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  buttonStop: { background: "#A6482E" },
  quizArea: {
    padding: "16px 20px 20px",
    borderTop: "1px solid #eef0f5",
    background: "#fafbfd",
  },
  question: { fontSize: 14, color: "#1c1c28", marginTop: 0 },
  choices: { display: "flex", flexDirection: "column", gap: 8 },
  choiceBtn: {
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #dcdce6",
    background: "#fff",
    cursor: "pointer",
    fontSize: 13,
  },
  // Le vert/rouge de correction reste sémantique (universellement compris),
  // volontairement non recouvert par la marque.
  correct: { borderColor: "#3fb27f", background: "#e9faf1" },
  wrong: { borderColor: "#e2586b", background: "#fdecee" },
  feedbackOk: {
    marginTop: 10,
    fontSize: 13,
    color: "#1c6b46",
    background: "#e9faf1",
    padding: "10px 12px",
    borderRadius: 10,
  },
  feedbackKo: {
    marginTop: 10,
    fontSize: 13,
    color: "#8a2436",
    background: "#fdecee",
    padding: "10px 12px",
    borderRadius: 10,
  },
};
