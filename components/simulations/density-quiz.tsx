"use client";

import React, { useState } from "react";
import { simStyles as s } from "./sim-styles";

type QuizState = "idle" | "correct" | "incorrect";
type Choice = "less" | "more" | "equal";
const WATER_DENSITY = 1000; // kg/m3
const CORRECT: Choice = "less";

export default function DensityQuiz() {
  const [mass, setMass] = useState(500); // grammes
  const [volume, setVolume] = useState(600); // cm3
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<Choice | null>(null);
  const [quizState, setQuizState] = useState<QuizState>("idle");

  // densite en kg/m3 : (g/cm3) * 1000 = kg/m3, et g/cm3 = mass(g)/volume(cm3)
  const density = (mass / volume) * 1000;
  const floats = density < WATER_DENSITY;

  const W = 300;
  const H = 180;
  const waterLevel = 90;
  // Profondeur d'immersion : proportion basee sur le ratio des densites (bornee)
  const immersionRatio = Math.min(1, Math.max(0.05, density / WATER_DENSITY));
  const boxSize = 40;
  const objY = floats ? waterLevel - boxSize * (1 - immersionRatio) : waterLevel + 10;

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
        <span style={s.eyebrow}>Simulation — Physique</span>
        <h3 style={s.title}>Densité et flottaison</h3>
      </div>

      <div style={s.simArea}>
        <svg width={W} height={H} style={s.svg}>
          <rect x={0} y={waterLevel} width={W} height={H - waterLevel} fill="#bcd8f5" />
          <rect
            x={W / 2 - boxSize / 2}
            y={objY}
            width={boxSize}
            height={boxSize}
            fill="#f0a94e"
            stroke="#8a5a1a"
            strokeWidth={2}
          />
        </svg>

        <div style={s.controls}>
          <label style={s.label}>
            Masse de l&apos;objet : {mass} g
            <input
              type="range"
              min={50}
              max={1500}
              step={50}
              value={mass}
              onChange={(e) => setMass(parseInt(e.target.value))}
              style={s.range}
            />
          </label>

          <label style={s.label}>
            Volume de l&apos;objet : {volume} cm³
            <input
              type="range"
              min={100}
              max={1500}
              step={50}
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              style={s.range}
            />
          </label>

          <div style={s.readout}>
            ρ = masse/volume = <strong>{density.toFixed(0)} kg/m³</strong> —{" "}
            {floats ? "l'objet flotte" : "l'objet coule"} (eau = 1000 kg/m³)
          </div>
        </div>
      </div>

      <div style={s.quizArea}>
        <p style={s.question}>
          Question : pour qu&apos;un objet <strong>flotte</strong> sur l&apos;eau, sa densité
          doit être...
        </p>
        <div style={s.choices}>
          <button style={btnStyle("less")} onClick={() => handleAnswer("less")} disabled={answered}>
            Inférieure à celle de l&apos;eau
          </button>
          <button style={btnStyle("more")} onClick={() => handleAnswer("more")} disabled={answered}>
            Supérieure à celle de l&apos;eau
          </button>
          <button style={btnStyle("equal")} onClick={() => handleAnswer("equal")} disabled={answered}>
            Exactement égale
          </button>
        </div>

        {answered && (
          <div style={quizState === "correct" ? s.feedbackOk : s.feedbackKo}>
            {quizState === "correct"
              ? "Exact ! Un objet flotte si sa densité est inférieure à celle du liquide. Ajuste masse/volume pour vérifier."
              : "Diminue la masse ou augmente le volume et observe le carré orange dans l'eau."}
          </div>
        )}
      </div>
    </div>
  );
}
