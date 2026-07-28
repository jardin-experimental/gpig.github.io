"use client";

import React, { useEffect, useRef, useState } from "react";
import { simStyles as s } from "./sim-styles";

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
    <div style={s.card}>
      <div style={s.header}>
        <span style={s.eyebrow}>Simulation — Mécanique</span>
        <h3 style={s.title}>Le pendule simple</h3>
      </div>

      <div style={s.simArea}>
        <svg width="300" height="260" style={s.svg}>
          <line x1={cx - 20} y1={cy} x2={cx + 20} y2={cy} stroke="#4b4b57" strokeWidth={4} />
          <line x1={cx} y1={cy} x2={bobX} y2={bobY} stroke="#8a8a99" strokeWidth={2} />
          <circle cx={bobX} cy={bobY} r={14} fill="#3F6B46" stroke="#2A472D" strokeWidth={2} />
        </svg>

        <div style={s.controls}>
          <label style={s.label}>
            Longueur du fil : {length.toFixed(1)} m
            <input
              type="range"
              min={0.4}
              max={2.5}
              step={0.1}
              value={length}
              onChange={(e) => handleLengthChange(parseFloat(e.target.value))}
              style={s.range}
            />
          </label>

          <label style={s.label}>
            Angle de départ : {angle}°
            <input
              type="range"
              min={5}
              max={60}
              step={1}
              value={angle}
              onChange={(e) => handleAngleChange(parseInt(e.target.value))}
              style={s.range}
            />
          </label>

          <div style={s.readout}>
            Période estimée : <strong>{period.toFixed(2)} s</strong>
          </div>

          <button
            style={{ ...s.button, ...(running ? s.buttonStop : {}) }}
            onClick={() => setRunning((r) => !r)}
          >
            {running ? "Mettre en pause" : "Lancer le pendule"}
          </button>
        </div>
      </div>

      <div style={s.quizArea}>
        <p style={s.question}>
          Question : si tu multiplies la longueur du fil par <strong>4</strong>, que
          devient approximativement la période d&apos;oscillation ?
        </p>
        <div style={s.choices}>
          <button
            style={{
              ...s.choiceBtn,
              ...(answered && selected === "same" ? s.wrong : {}),
            }}
            onClick={() => handleAnswer("same")}
            disabled={answered}
          >
            Elle reste la même
          </button>
          <button
            style={{
              ...s.choiceBtn,
              ...(answered && selected === "double" ? s.correct : {}),
            }}
            onClick={() => handleAnswer("double")}
            disabled={answered}
          >
            Elle double
          </button>
          <button
            style={{
              ...s.choiceBtn,
              ...(answered && selected === "quadruple" ? s.wrong : {}),
            }}
            onClick={() => handleAnswer("quadruple")}
            disabled={answered}
          >
            Elle quadruple
          </button>
        </div>

        {answered && (
          <div style={quizState === "correct" ? s.feedbackOk : s.feedbackKo}>
            {quizState === "correct"
              ? "Exact ! T = 2π√(L/g) : la période varie comme la racine carrée de la longueur, donc multiplier L par 4 double T. Essaie avec le curseur pour vérifier toi-même."
              : "Pas tout à fait — regarde la formule affichée, et teste avec le curseur longueur pour observer l'effet réel (T ∝ √L)."}
          </div>
        )}
      </div>
    </div>
  );
}
