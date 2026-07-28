"use client";

import React, { useState } from "react";
import { simStyles as s } from "./sim-styles";

type QuizState = "idle" | "correct" | "incorrect";
type Choice = "up" | "down" | "same";
const CORRECT: Choice = "up";

// Zone de tracage SVG
const W = 300;
const H = 200;
const ORIGIN_X = W / 2;
const ORIGIN_Y = H / 2;
const SCALE = 12; // pixels par unite

function toScreen(x: number, y: number) {
  return { sx: ORIGIN_X + x * SCALE, sy: ORIGIN_Y - y * SCALE };
}

export default function ParabolaQuiz() {
  const [a, setA] = useState(1);
  const [c, setC] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<Choice | null>(null);
  const [quizState, setQuizState] = useState<QuizState>("idle");

  const f = (x: number) => a * x * x + c;

  const points: string = Array.from({ length: 61 }, (_, i) => {
    const x = -10 + (i * 20) / 60;
    const y = f(x);
    const { sx, sy } = toScreen(x, Math.max(-8, Math.min(8, y)));
    return `${sx},${sy}`;
  }).join(" ");

  const vertex = toScreen(0, c);

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
        <span style={s.eyebrow}>Simulation — Mathématiques</span>
        <h3 style={s.title}>La fonction parabole</h3>
      </div>

      <div style={s.simArea}>
        <svg width={W} height={H} style={s.svg}>
          {/* Axes */}
          <line x1={0} y1={ORIGIN_Y} x2={W} y2={ORIGIN_Y} stroke="#c7c7d4" />
          <line x1={ORIGIN_X} y1={0} x2={ORIGIN_X} y2={H} stroke="#c7c7d4" />
          <polyline points={points} fill="none" stroke="#3F6B46" strokeWidth={2.5} />
          <circle cx={vertex.sx} cy={vertex.sy} r={4} fill="#e2586b" />
        </svg>

        <div style={s.controls}>
          <label style={s.label}>
            Coefficient a : {a.toFixed(1)}
            <input
              type="range"
              min={-3}
              max={3}
              step={0.1}
              value={a}
              onChange={(e) => setA(parseFloat(e.target.value))}
              style={s.range}
            />
          </label>

          <label style={s.label}>
            Constante c : {c.toFixed(1)}
            <input
              type="range"
              min={-6}
              max={6}
              step={0.5}
              value={c}
              onChange={(e) => setC(parseFloat(e.target.value))}
              style={s.range}
            />
          </label>

          <div style={s.readout}>
            f(x) = {a.toFixed(1)}x² {c >= 0 ? "+" : "-"} {Math.abs(c).toFixed(1)}
          </div>
        </div>
      </div>

      <div style={s.quizArea}>
        <p style={s.question}>
          Question : si tu <strong>augmentes c</strong>, que devient la courbe ?
        </p>
        <div style={s.choices}>
          <button style={btnStyle("up")} onClick={() => handleAnswer("up")} disabled={answered}>
            Elle se déplace vers le haut
          </button>
          <button style={btnStyle("down")} onClick={() => handleAnswer("down")} disabled={answered}>
            Elle se déplace vers le bas
          </button>
          <button style={btnStyle("same")} onClick={() => handleAnswer("same")} disabled={answered}>
            Elle s&apos;élargit
          </button>
        </div>

        {answered && (
          <div style={quizState === "correct" ? s.feedbackOk : s.feedbackKo}>
            {quizState === "correct"
              ? "Exact ! c déplace le sommet verticalement (translation), tandis que a contrôle l'ouverture/l'orientation."
              : "Essaie de bouger uniquement le curseur c et observe où va le point rouge (le sommet)."}
          </div>
        )}
      </div>
    </div>
  );
}
