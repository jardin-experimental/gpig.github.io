"use client";

import React, { useState } from "react";
import { simStyles as s } from "./sim-styles";

type QuizState = "idle" | "correct" | "incorrect";
type Choice = "decrease" | "increase" | "same";
const CORRECT: Choice = "decrease";

export default function OpticsQuiz() {
  const [focal, setFocal] = useState(5); // cm
  const [objDist, setObjDist] = useState(12); // cm, distance objet-lentille
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<Choice | null>(null);
  const [quizState, setQuizState] = useState<QuizState>("idle");

  // Formule des lentilles minces : 1/f = 1/do + 1/di  ->  di = (f*do)/(do-f)
  const validSetup = objDist > focal;
  const imgDist = validSetup ? (focal * objDist) / (objDist - focal) : null;
  const magnification = imgDist != null ? -(imgDist / objDist) : null;

  const W = 300;
  const H = 160;
  const lensX = 150;
  const scale = 6;
  const objX = lensX - objDist * scale * 0.4;
  const imgX = imgDist != null ? lensX + imgDist * scale * 0.4 : null;

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
        <span style={s.eyebrow}>Simulation — Optique</span>
        <h3 style={s.title}>Lentille convergente</h3>
      </div>

      <div style={s.simArea}>
        <svg width={W} height={H} style={s.svg}>
          <line x1={20} y1={80} x2={280} y2={80} stroke="#e2e2ea" />
          <ellipse cx={lensX} cy={80} rx={8} ry={55} fill="#dbe8de" stroke="#3F6B46" strokeWidth={2} />
          <line x1={lensX - focal * scale * 0.4} y1={75} x2={lensX - focal * scale * 0.4} y2={85} stroke="#8a8a99" />
          <line x1={lensX + focal * scale * 0.4} y1={75} x2={lensX + focal * scale * 0.4} y2={85} stroke="#8a8a99" />

          {/* Objet */}
          <line x1={objX} y1={80} x2={objX} y2={40} stroke="#3fb27f" strokeWidth={3} markerEnd="url(#arrowGreen)" />

          {/* Image (si formable) */}
          {imgX != null && magnification != null && (
            <line
              x1={imgX}
              y1={80}
              x2={imgX}
              y2={80 - 40 * magnification}
              stroke="#e2586b"
              strokeWidth={3}
            />
          )}
        </svg>

        <div style={s.controls}>
          <label style={s.label}>
            Distance focale f : {focal} cm
            <input
              type="range"
              min={2}
              max={10}
              step={0.5}
              value={focal}
              onChange={(e) => setFocal(parseFloat(e.target.value))}
              style={s.range}
            />
          </label>

          <label style={s.label}>
            Distance objet-lentille : {objDist} cm
            <input
              type="range"
              min={3}
              max={30}
              step={1}
              value={objDist}
              onChange={(e) => setObjDist(parseInt(e.target.value))}
              style={s.range}
            />
          </label>

          <div style={s.readout}>
            {validSetup
              ? `Image à ${imgDist!.toFixed(1)} cm, grandissement ${magnification!.toFixed(2)}`
              : "Objet trop proche : aucune image réelle (dans le foyer)"}
          </div>
        </div>
      </div>

      <div style={s.quizArea}>
        <p style={s.question}>
          Question : quand tu <strong>éloignes l&apos;objet</strong> de la lentille, que
          devient la distance de l&apos;image ?
        </p>
        <div style={s.choices}>
          <button style={btnStyle("decrease")} onClick={() => handleAnswer("decrease")} disabled={answered}>
            Elle diminue (se rapproche de f)
          </button>
          <button style={btnStyle("increase")} onClick={() => handleAnswer("increase")} disabled={answered}>
            Elle augmente
          </button>
          <button style={btnStyle("same")} onClick={() => handleAnswer("same")} disabled={answered}>
            Elle reste la même
          </button>
        </div>

        {answered && (
          <div style={quizState === "correct" ? s.feedbackOk : s.feedbackKo}>
            {quizState === "correct"
              ? "Exact ! Plus l'objet s'éloigne, plus l'image se rapproche du foyer image."
              : "Déplace le curseur distance objet et regarde où se forme le trait rouge (l'image)."}
          </div>
        )}
      </div>
    </div>
  );
}
