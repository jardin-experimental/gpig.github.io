"use client";

import React, { useState } from "react";
import { simStyles as s } from "./sim-styles";

type QuizState = "idle" | "correct" | "incorrect";
type Choice = "same" | "double" | "half";
const CORRECT: Choice = "same";

export default function WaveQuiz() {
  const [frequency, setFrequency] = useState(2); // Hz (visuel, pas echelle reelle)
  const [wavelength, setWavelength] = useState(40); // pixels
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<Choice | null>(null);
  const [quizState, setQuizState] = useState<QuizState>("idle");

  const speed = frequency * wavelength; // unite arbitraire, illustrative

  const W = 300;
  const H = 140;
  const amplitude = 35;
  const points = Array.from({ length: 121 }, (_, i) => {
    const x = (i / 120) * W;
    const y = H / 2 + amplitude * Math.sin((2 * Math.PI * x) / wavelength);
    return `${x},${y}`;
  }).join(" ");

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
        <span style={s.eyebrow}>Simulation — Ondes</span>
        <h3 style={s.title}>Fréquence et longueur d&apos;onde</h3>
      </div>

      <div style={s.simArea}>
        <svg width={W} height={H} style={s.svg}>
          <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#e2e2ea" />
          <polyline points={points} fill="none" stroke="#3F6B46" strokeWidth={2.5} />
        </svg>

        <div style={s.controls}>
          <label style={s.label}>
            Fréquence f : {frequency.toFixed(1)} Hz
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.1}
              value={frequency}
              onChange={(e) => setFrequency(parseFloat(e.target.value))}
              style={s.range}
            />
          </label>

          <label style={s.label}>
            Longueur d&apos;onde λ : {wavelength} (u.a.)
            <input
              type="range"
              min={15}
              max={100}
              step={5}
              value={wavelength}
              onChange={(e) => setWavelength(parseInt(e.target.value))}
              style={s.range}
            />
          </label>

          <div style={s.readout}>
            v = f × λ = <strong>{speed.toFixed(1)}</strong> (u.a.)
          </div>
        </div>
      </div>

      <div style={s.quizArea}>
        <p style={s.question}>
          Question : si la <strong>fréquence double</strong> pendant que la{" "}
          <strong>longueur d&apos;onde est divisée par deux</strong>, que devient la vitesse
          de l&apos;onde v = f × λ ?
        </p>
        <div style={s.choices}>
          <button style={btnStyle("same")} onClick={() => handleAnswer("same")} disabled={answered}>
            Elle reste la même
          </button>
          <button style={btnStyle("double")} onClick={() => handleAnswer("double")} disabled={answered}>
            Elle double
          </button>
          <button style={btnStyle("half")} onClick={() => handleAnswer("half")} disabled={answered}>
            Elle est divisée par deux
          </button>
        </div>

        {answered && (
          <div style={quizState === "correct" ? s.feedbackOk : s.feedbackKo}>
            {quizState === "correct"
              ? "Exact ! v = f × λ : si f double et λ est divisée par deux, le produit ne change pas."
              : "Essaie les curseurs séparément et observe le résultat affiché pour v."}
          </div>
        )}
      </div>
    </div>
  );
}
