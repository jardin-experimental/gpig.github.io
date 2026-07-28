"use client";

import React, { useState } from "react";
import { simStyles as s } from "./sim-styles";

type QuizState = "idle" | "correct" | "incorrect";
type Choice = "double" | "same" | "quadruple";
const CORRECT: Choice = "double";

export default function PythagorasQuiz() {
  const [a, setA] = useState(6); // cote horizontal, unite arbitraire
  const [b, setB] = useState(4); // cote vertical
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<Choice | null>(null);
  const [quizState, setQuizState] = useState<QuizState>("idle");

  const c = Math.sqrt(a * a + b * b);
  const SCALE = 15;
  const originX = 40;
  const originY = 150;

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
        <span style={s.eyebrow}>Simulation — Géométrie</span>
        <h3 style={s.title}>Théorème de Pythagore</h3>
      </div>

      <div style={s.simArea}>
        <svg width={300} height={170} style={s.svg}>
          <polygon
            points={`${originX},${originY} ${originX + a * SCALE},${originY} ${originX + a * SCALE},${originY - b * SCALE}`}
            fill="#dbe8de"
            stroke="#3F6B46"
            strokeWidth={2}
          />
          <text x={originX + (a * SCALE) / 2 - 5} y={originY + 15} fontSize={11} fill="#3c3c48">
            a = {a}
          </text>
          <text x={originX + a * SCALE + 6} y={originY - (b * SCALE) / 2} fontSize={11} fill="#3c3c48">
            b = {b}
          </text>
          <text
            x={originX + (a * SCALE) / 2 - 10}
            y={originY - (b * SCALE) / 2 - 6}
            fontSize={11}
            fill="#e2586b"
          >
            c = {c.toFixed(1)}
          </text>
        </svg>

        <div style={s.controls}>
          <label style={s.label}>
            Côté a : {a}
            <input
              type="range"
              min={2}
              max={12}
              step={1}
              value={a}
              onChange={(e) => setA(parseInt(e.target.value))}
              style={s.range}
            />
          </label>

          <label style={s.label}>
            Côté b : {b}
            <input
              type="range"
              min={2}
              max={8}
              step={1}
              value={b}
              onChange={(e) => setB(parseInt(e.target.value))}
              style={s.range}
            />
          </label>

          <div style={s.readout}>
            c = √(a² + b²) = <strong>{c.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      <div style={s.quizArea}>
        <p style={s.question}>
          Question : si tu <strong>doubles a et b</strong> (mais gardes le même angle droit),
          que devient l&apos;hypoténuse c ?
        </p>
        <div style={s.choices}>
          <button style={btnStyle("double")} onClick={() => handleAnswer("double")} disabled={answered}>
            Elle double aussi
          </button>
          <button style={btnStyle("quadruple")} onClick={() => handleAnswer("quadruple")} disabled={answered}>
            Elle est multipliée par 4
          </button>
          <button style={btnStyle("same")} onClick={() => handleAnswer("same")} disabled={answered}>
            Elle reste la même
          </button>
        </div>

        {answered && (
          <div style={quizState === "correct" ? s.feedbackOk : s.feedbackKo}>
            {quizState === "correct"
              ? "Exact ! Doubler a et b double aussi c : le triangle est juste agrandi à l'identique (homothétie)."
              : "Essaie de mettre a et b à leurs valeurs max et compare c à quand ils sont à leur valeur de départ."}
          </div>
        )}
      </div>
    </div>
  );
}
