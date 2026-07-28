"use client";

import React, { useState } from "react";
import { simStyles as s } from "./sim-styles";

type QuizState = "idle" | "correct" | "incorrect";
type Choice = "increase" | "decrease" | "same";
const CORRECT: Choice = "increase";

export default function CircuitQuiz() {
  const [voltage, setVoltage] = useState(9); // Volts
  const [r1, setR1] = useState(100); // Ohms
  const [r2, setR2] = useState(100); // Ohms
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<Choice | null>(null);
  const [quizState, setQuizState] = useState<QuizState>("idle");

  const totalR = r1 + r2;
  const current = voltage / totalR; // Amperes, loi d'Ohm

  // Vitesse d'animation des porteurs de charge, proportionnelle au courant
  const dotSpeed = Math.max(0.4, Math.min(4, current * 20));

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
        <span style={s.eyebrow}>Simulation — Électricité</span>
        <h3 style={s.title}>Circuit en série</h3>
      </div>

      <div style={s.simArea}>
        <svg width="300" height="180" style={s.svg}>
          {/* Pile */}
          <line x1={40} y1={70} x2={40} y2={110} stroke="#4b4b57" strokeWidth={4} />
          <line x1={30} y1={80} x2={50} y2={80} stroke="#4b4b57" strokeWidth={2} />
          <text x={20} y={100} fontSize={10} fill="#4b4b57">
            +
          </text>

          {/* Fil du circuit */}
          <polyline
            points="40,70 40,30 260,30 260,150 40,150 40,110"
            fill="none"
            stroke="#8a8a99"
            strokeWidth={2}
          />

          {/* Resistor 1 */}
          <rect x={110} y={20} width={40} height={20} fill="#f0c419" stroke="#8a6d00" />
          <text x={112} y={16} fontSize={10} fill="#3c3c48">
            R1
          </text>

          {/* Resistor 2 */}
          <rect x={240} y={80} width={20} height={40} fill="#f0c419" stroke="#8a6d00" />
          <text x={264} y={104} fontSize={10} fill="#3c3c48">
            R2
          </text>

          {/* Porteurs de charge animes via CSS-like offset (SVG animate) */}
          <circle r={4} fill="#3F6B46">
            <animateMotion
              path="M40,70 L40,30 L260,30 L260,150 L40,150 L40,110 Z"
              dur={`${4 / dotSpeed}s`}
              repeatCount="indefinite"
            />
          </circle>
        </svg>

        <div style={s.controls}>
          <label style={s.label}>
            Tension de la pile : {voltage} V
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={voltage}
              onChange={(e) => setVoltage(parseInt(e.target.value))}
              style={s.range}
            />
          </label>

          <label style={s.label}>
            Résistance R1 : {r1} Ω
            <input
              type="range"
              min={10}
              max={500}
              step={10}
              value={r1}
              onChange={(e) => setR1(parseInt(e.target.value))}
              style={s.range}
            />
          </label>

          <label style={s.label}>
            Résistance R2 : {r2} Ω
            <input
              type="range"
              min={10}
              max={500}
              step={10}
              value={r2}
              onChange={(e) => setR2(parseInt(e.target.value))}
              style={s.range}
            />
          </label>

          <div style={s.readout}>
            R totale = {totalR} Ω &nbsp;→&nbsp; I = V/R ={" "}
            <strong>{(current * 1000).toFixed(1)} mA</strong>
          </div>
        </div>
      </div>

      <div style={s.quizArea}>
        <p style={s.question}>
          Question : en circuit série, quand tu <strong>ajoutes une résistance</strong>, que
          devient la résistance totale du circuit ?
        </p>
        <div style={s.choices}>
          <button style={btnStyle("increase")} onClick={() => handleAnswer("increase")} disabled={answered}>
            Elle augmente
          </button>
          <button style={btnStyle("decrease")} onClick={() => handleAnswer("decrease")} disabled={answered}>
            Elle diminue
          </button>
          <button style={btnStyle("same")} onClick={() => handleAnswer("same")} disabled={answered}>
            Elle reste la même
          </button>
        </div>

        {answered && (
          <div style={quizState === "correct" ? s.feedbackOk : s.feedbackKo}>
            {quizState === "correct"
              ? "Exact ! En série, les résistances s'additionnent : R = R1 + R2. Plus de résistance = moins de courant (I = V/R)."
              : "Regarde le curseur R2 : en l'augmentant, observe comment R totale et le courant évoluent."}
          </div>
        )}
      </div>
    </div>
  );
}
