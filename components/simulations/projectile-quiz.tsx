"use client";

import React, { useEffect, useRef, useState } from "react";
import { simStyles as s } from "./sim-styles";

type QuizState = "idle" | "correct" | "incorrect";
type Choice = "45" | "90" | "60";
const CORRECT: Choice = "45";
const G = 9.81;

export default function ProjectileQuiz() {
  const [angleDeg, setAngleDeg] = useState(45);
  const [speed, setSpeed] = useState(15); // m/s
  const [running, setRunning] = useState(false);
  const [t, setT] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<Choice | null>(null);
  const [quizState, setQuizState] = useState<QuizState>("idle");
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const theta = (angleDeg * Math.PI) / 180;
  const vx = speed * Math.cos(theta);
  const vy = speed * Math.sin(theta);
  const flightTime = (2 * vy) / G;
  const range = vx * flightTime;
  const maxHeight = (vy * vy) / (2 * G);

  useEffect(() => {
    if (!running) return;
    const step = (ts: number) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;
      if (elapsed >= flightTime) {
        setT(flightTime);
        setRunning(false);
        startRef.current = null;
        return;
      }
      setT(elapsed);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [running, flightTime]);

  const launch = () => {
    setT(0);
    setRunning(true);
  };

  // Mise a l'echelle SVG (300x180, sol en bas)
  const W = 300;
  const H = 180;
  const scale = Math.min(200 / Math.max(range, 1), 8);
  const x = vx * t * scale;
  const y = (vy * t - 0.5 * G * t * t) * scale;

  const handleAnswer = (choice: Choice) => {
    if (answered) return;
    setAnswered(true);
    setSelected(choice);
    setQuizState(choice === CORRECT ? "correct" : "incorrect");
  };

  const btnStyle = (choice: Choice) => ({
    ...s.choiceBtn,
    ...(answered && selected === choice ? (choice === CORRECT ? s.correct : s.wrong) : {}),
  });

  return (
    <div style={s.card}>
      <div style={s.header}>
        <span style={s.eyebrow}>Simulation — Mécanique</span>
        <h3 style={s.title}>Tir parabolique</h3>
      </div>

      <div style={s.simArea}>
        <svg width={W} height={H} style={s.svg}>
          <line x1={10} y1={H - 15} x2={W - 10} y2={H - 15} stroke="#c7c7d4" />
          <circle cx={10 + x} cy={H - 15 - y} r={6} fill="#3F6B46" />
        </svg>

        <div style={s.controls}>
          <label style={s.label}>
            Angle de tir : {angleDeg}°
            <input
              type="range"
              min={10}
              max={80}
              step={1}
              value={angleDeg}
              onChange={(e) => {
                setAngleDeg(parseInt(e.target.value));
                setRunning(false);
                setT(0);
              }}
              style={s.range}
            />
          </label>

          <label style={s.label}>
            Vitesse initiale : {speed} m/s
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={speed}
              onChange={(e) => {
                setSpeed(parseInt(e.target.value));
                setRunning(false);
                setT(0);
              }}
              style={s.range}
            />
          </label>

          <div style={s.readout}>
            Portée ≈ {range.toFixed(1)} m &nbsp;·&nbsp; Hauteur max ≈ {maxHeight.toFixed(1)} m
          </div>

          <button style={s.button} onClick={launch}>
            {running ? "En vol..." : "Tirer"}
          </button>
        </div>
      </div>

      <div style={s.quizArea}>
        <p style={s.question}>
          Question : à vitesse initiale fixée, quel angle donne la{" "}
          <strong>portée maximale</strong> ?
        </p>
        <div style={s.choices}>
          <button style={btnStyle("45")} onClick={() => handleAnswer("45")} disabled={answered}>
            45°
          </button>
          <button style={btnStyle("90")} onClick={() => handleAnswer("90")} disabled={answered}>
            90°
          </button>
          <button style={btnStyle("60")} onClick={() => handleAnswer("60")} disabled={answered}>
            60°
          </button>
        </div>

        {answered && (
          <div style={quizState === "correct" ? s.feedbackOk : s.feedbackKo}>
            {quizState === "correct"
              ? "Exact ! Sans résistance de l'air, 45° maximise la portée. Teste le curseur angle pour le vérifier."
              : "Essaie plusieurs angles avec le bouton Tirer et compare la portée affichée."}
          </div>
        )}
      </div>
    </div>
  );
}
