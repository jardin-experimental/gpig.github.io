"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * PendulumQuiz
 * ------------------------------------------------------------------
 * Simulation interactive + question intégrée. Zone d'exploration libre
 * (l'élève manipule longueur/angle) puis question qui porte directement
 * sur ce qu'il vient d'observer.
 *
 * Pattern réutilisable pour d'autres simulations (projectile, circuit
 * électrique, optique...) : voir components/simulations/registry.tsx
 * pour enregistrer un nouveau composant sous une clé, référencée depuis
 * lecon_contents.ressources->>'component' en base.
 * ------------------------------------------------------------------
 */

type QuizState = "idle" | "correct" | "incorrect";
type Choice = "same" | "double" | "quadruple";

const G = 9.81; // m/s^2

export default function PendulumQuiz() {
  const [length, setLength] = useState(1.2); // metres
  const [angle, setAngle] = useState(35); // degres, amplitude initiale
  const [running, setRunning] = useState(false);
  const [quizState, setQuizState] = useState<QuizState>("idle");
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<Choice | null>(null);

  const thetaRef = useRef((angle * Math.PI) / 180);
  const omegaRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [renderTheta, setRenderTheta] = useState(thetaRef.current);

  // Periode theorique (petites oscillations) : T = 2*pi*sqrt(L/g)
  const period = 2 * Math.PI * Math.sqrt(length / G);

  useEffect(() => {
    if (!running) return;

    const step = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.032);
      lastTsRef.current = ts;

      // Equation du pendule simple (non lineaire) : theta'' = -(g/L) sin(theta)
      const alpha = -(G / length) * Math.sin(thetaRef.current);
      omegaRef.current += alpha * dt;
      omegaRef.current *= 0.999; // legere amortissement pour le confort visuel
      thetaRef.current += omegaRef.current * dt;

      setRenderTheta(thetaRef.current);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [running, length]);

  const resetSim = (newAngleDeg: number, newLength: number) => {
    setRunning(false);
    thetaRef.current = (newAngleDeg * Math.PI) / 180;
    omegaRef.current = 0;
    setRenderTheta(thetaRef.current);
  };

  const handleAngleChange = (v: number) => {
    setAngle(v);
    resetSim(v, length);
  };

  const handleLengthChange = (v: number) => {
    setLength(v);
    resetSim(angle, v);
  };

  // Geometrie SVG
  const cx = 150;
  const cy = 30;
  const pxLength = 40 + length * 90; // mise a l'echelle visuelle
  const bobX = cx + pxLength * Math.sin(renderTheta);
  const bobY = cy + pxLength * Math.cos(renderTheta);

  // Correction : trois réponses distinctes, pas de doublon visuel "Elle double".
  // Multiplier L par 4 double la période (T ∝ √L), donc "double" est la bonne réponse.
  const handleAnswer = (choice: Choice) => {
    if (answered) return;
    setAnswered(true);
    setSelected(choice);
    setQuizState(choice === "double" ? "correct" : "incorrect");
    // Point d'intégration : si correct -> appeler completeLesson(leconId, formationSlug)
    // depuis le parent, ou un XP dédié à l'exercice.
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.eyebrow}>Simulation — Mécanique</span>
        <h3 style={styles.title}>Le pendule simple</h3>
      </div>

      <div style={styles.simArea}>
        <svg width="300" height="260" style={styles.svg}>
          <line x1={cx - 20} y1={cy} x2={cx + 20} y2={cy} stroke="#4b4b57" strokeWidth={4} />
          <line x1={cx} y1={cy} x2={bobX} y2={bobY} stroke="#8a8a99" strokeWidth={2} />
          <circle cx={bobX} cy={bobY} r={14} fill="#3F6B46" stroke="#2A472D" strokeWidth={2} />
        </svg>

        <div style={styles.controls}>
          <label style={styles.label}>
            Longueur du fil : {length.toFixed(1)} m
            <input
              type="range"
              min={0.4}
              max={2.5}
              step={0.1}
              value={length}
              onChange={(e) => handleLengthChange(parseFloat(e.target.value))}
              style={styles.range}
            />
          </label>

          <label style={styles.label}>
            Angle de départ : {angle}°
            <input
              type="range"
              min={5}
              max={60}
              step={1}
              value={angle}
              onChange={(e) => handleAngleChange(parseInt(e.target.value))}
              style={styles.range}
            />
          </label>

          <div style={styles.periodBox}>
            Période estimée : <strong>{period.toFixed(2)} s</strong>
          </div>

          <button
            style={{ ...styles.button, ...(running ? styles.buttonStop : {}) }}
            onClick={() => setRunning((r) => !r)}
          >
            {running ? "Mettre en pause" : "Lancer le pendule"}
          </button>
        </div>
      </div>

      <div style={styles.quizArea}>
        <p style={styles.question}>
          Question : si tu multiplies la longueur du fil par <strong>4</strong>, que
          devient approximativement la période d&apos;oscillation ?
        </p>
        <div style={styles.choices}>
          <button
            style={{
              ...styles.choiceBtn,
              ...(answered && selected === "same" ? styles.wrong : {}),
            }}
            onClick={() => handleAnswer("same")}
            disabled={answered}
          >
            Elle reste la même
          </button>
          <button
            style={{
              ...styles.choiceBtn,
              ...(answered && selected === "double" ? styles.correct : {}),
            }}
            onClick={() => handleAnswer("double")}
            disabled={answered}
          >
            Elle double
          </button>
          <button
            style={{
              ...styles.choiceBtn,
              ...(answered && selected === "quadruple" ? styles.wrong : {}),
            }}
            onClick={() => handleAnswer("quadruple")}
            disabled={answered}
          >
            Elle quadruple
          </button>
        </div>

        {answered && (
          <div style={quizState === "correct" ? styles.feedbackOk : styles.feedbackKo}>
            {quizState === "correct"
              ? "Exact ! T = 2π√(L/g) : la période varie comme la racine carrée de la longueur, donc multiplier L par 4 double T. Essaie avec le curseur pour vérifier toi-même."
              : "Pas tout à fait — regarde la formule affichée, et teste avec le curseur longueur pour observer l'effet réel (T ∝ √L)."}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
  header: {
    padding: "18px 20px 4px",
  },
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
  svg: {
    background: "#EEF0E8",
    borderRadius: 12,
  },
  controls: {
    width: "100%",
    marginTop: 8,
  },
  label: {
    display: "block",
    fontSize: 13,
    color: "#3c3c48",
    marginBottom: 10,
  },
  range: {
    width: "100%",
    marginTop: 4,
  },
  periodBox: {
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
  buttonStop: {
    background: "#A6482E",
  },
  quizArea: {
    padding: "16px 20px 20px",
    borderTop: "1px solid #eef0f5",
    background: "#fafbfd",
  },
  question: {
    fontSize: 14,
    color: "#1c1c28",
    marginTop: 0,
  },
  choices: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  choiceBtn: {
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #dcdce6",
    background: "#fff",
    cursor: "pointer",
    fontSize: 13,
  },
  correct: {
    borderColor: "#3fb27f",
    background: "#e9faf1",
  },
  wrong: {
    borderColor: "#e2586b",
    background: "#fdecee",
  },
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
