"use client";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { academy, type Lesson } from "@/lib/academy-data";
import { atenaModel, type Area } from "@/lib/atena";
import { currentHub, updateHub, markActivity } from "@/lib/local-progress";
import { AtenaToolLayout } from "./atena-tool-layout";
const order: Area[] = ["mat", "nat", "hum", "ling", "red"];
export function StudyAcademy() {
  const [area, setArea] = useState<Area>("mat"),
    [index, setIndex] = useState(0),
    [done, setDone] = useState<Record<string, boolean>>({}),
    [choice, setChoice] = useState<number | null>(null),
    [message, setMessage] = useState("");
  useEffect(() => {
    const h = currentHub(),
      track = order.includes(h.course?.track as Area)
        ? (h.course!.track as Area)
        : "mat",
      saved = h.course?.done || {};
    setArea(track);
    setDone(saved);
    const next = academy[track].units.findIndex((l) => !saved[l.id]);
    setIndex(next < 0 ? 0 : next);
  }, []);
  const list = academy[area].units,
    lesson = list[index] || list[0],
    all = order.flatMap((a) => academy[a].units),
    completed = all.filter((l) => done[l.id]).length,
    correct = choice === lesson.c;
  function selectArea(next: Area) {
    setArea(next);
    const first = academy[next].units.findIndex((l) => !done[l.id]);
    setIndex(first < 0 ? 0 : first);
    setChoice(null);
    setMessage("");
    try {
      updateHub((h) => ({
        ...h,
        course: { ...h.course, track: next, done: h.course?.done || {} },
      }));
    } catch {
      setMessage(
        "Não foi possível salvar a área. Você pode continuar estudando.",
      );
    }
  }
  function answer(n: number) {
    if (choice !== null) return;
    setChoice(n);
    if (n !== lesson.c) {
      setMessage(
        "Leia a explicação. Depois tente novamente: aprender continua liberado.",
      );
      return;
    }
    const first = !done[lesson.id];
    setDone((d) => ({ ...d, [lesson.id]: true }));
    try {
      updateHub((h) =>
        markActivity({
          ...h,
          xp: (Number(h.xp) || 0) + (first ? 18 : 4),
          course: {
            ...h.course,
            track: area,
            done: { ...h.course?.done, [lesson.id]: true },
          },
        }),
      );
      setMessage(
        first
          ? "Lição concluída. Seu progresso está salvo."
          : "Revisão concluída. Você pode repetir sempre que quiser.",
      );
    } catch {
      setMessage(
        "Lição concluída. O navegador não permitiu salvar; exporte uma cópia pelo Hub.",
      );
    }
  }
  function next() {
    setChoice(null);
    setMessage("");
    if (index + 1 < list.length) {
      setIndex((i) => i + 1);
      return;
    }
    const nextArea = order.find((a) =>
      academy[a].units.some((l) => !done[l.id]),
    );
    if (nextArea) {
      selectArea(nextArea);
      setMessage(
        "Uma nova trilha começa. As anteriores continuam disponíveis.",
      );
    } else {
      setIndex(0);
      setMessage(
        "As 40 lições estão concluídas. Escolha qualquer área para revisar ou pratique questões.",
      );
    }
  }
  return (
    <AtenaToolLayout
      active="estudos"
      title="Aprender é continuar."
      kicker="ATENA / ACADEMIA DE ESTUDOS"
    >
      <section className="atena-academy-overview">
        <div>
          <Trophy size={24} />
          <span>
            <strong>
              {completed} de {all.length}
            </strong>
            <small>lições concluídas no seu aparelho</small>
          </span>
        </div>
        <div
          className="atena-course-progress"
          role="progressbar"
          aria-label="Progresso das trilhas"
          aria-valuemin={0}
          aria-valuemax={all.length}
          aria-valuenow={completed}
        >
          <span style={{ width: (completed / all.length) * 100 + "%" }} />
        </div>
        <p>
          40 lições autorais · 5 áreas · aprendizado sem bloqueio de energia
        </p>
      </section>
      <div className="atena-area-tabs" aria-label="Áreas de estudo">
        {order.map((a) => (
          <button
            key={a}
            aria-pressed={area === a}
            onClick={() => selectArea(a)}
          >
            <span>{academy[a].icon}</span>
            {academy[a].title}
            <small>
              {academy[a].units.filter((l) => done[l.id]).length}/
              {academy[a].units.length}
            </small>
          </button>
        ))}
      </div>
      <div className="atena-academy-grid">
        <section
          className="atena-panel atena-course-map"
          aria-labelledby="courseMapTitle"
        >
          <span className="atena-kicker">SUA TRILHA</span>
          <h2 id="courseMapTitle">{academy[area].title}</h2>
          <p>Escolha uma lição para aprender ou revisar.</p>
          <div>
            {list.map((unit, i) => (
              <button
                key={unit.id}
                className={index === i ? "selected" : ""}
                aria-current={index === i ? "step" : undefined}
                onClick={() => {
                  setIndex(i);
                  setChoice(null);
                  setMessage("");
                }}
              >
                <span>{done[unit.id] ? <Check size={15} /> : i + 1}</span>
                <div>
                  <strong>{unit.title}</strong>
                  <small>
                    {done[unit.id]
                      ? "Concluída · revisar"
                      : "Uma ideia e um desafio"}
                  </small>
                </div>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        </section>
        <article
          className="atena-panel atena-lesson"
          aria-labelledby="lessonHeading"
        >
          <div className="atena-lesson-label">
            <span className="atena-kicker">
              {atenaModel.names[area]} / LIÇÃO {index + 1} DE {list.length}
            </span>
            {done[lesson.id] && (
              <span className="atena-lesson-done">
                <Check size={13} />
                Concluída
              </span>
            )}
          </div>
          <h2 id="lessonHeading">{lesson.title}</h2>
          <p>{lesson.desc}</p>
          <div className="atena-concept">
            <span>IDEIA-CHAVE</span>
            <p>{lesson.concept}</p>
          </div>
          <span className="atena-kicker">AGORA, COLOQUE EM PRÁTICA</span>
          <h3>{lesson.q}</h3>
          <div className="atena-lesson-options">
            {lesson.o.map((option, n) => (
              <button
                key={n}
                disabled={choice !== null}
                onClick={() => answer(n)}
                className={
                  choice === null
                    ? ""
                    : n === lesson.c
                      ? "correct"
                      : n === choice
                        ? "incorrect"
                        : ""
                }
              >
                <span>{String.fromCharCode(65 + n)}</span>
                {option}
                {choice !== null && n === lesson.c && <Check size={18} />}
              </button>
            ))}
          </div>
          {choice !== null && (
            <div
              className={
                "atena-answer-feedback " + (correct ? "correct" : "incorrect")
              }
              role="status"
            >
              <strong>
                {correct
                  ? "Isso. Você conectou as ideias."
                  : "Vamos entender esse passo."}
              </strong>
              <p>{lesson.e}</p>
            </div>
          )}
          <p className="atena-tool-status" role="status">
            {message}
          </p>
          <div className="atena-inline-actions">
            {choice !== null &&
              (correct ? (
                <button className="atena-button primary" onClick={next}>
                  {index + 1 < list.length
                    ? "Próxima lição"
                    : "Continuar meu percurso"}
                  <ArrowRight size={17} />
                </button>
              ) : (
                <button
                  className="atena-button primary"
                  onClick={() => {
                    setChoice(null);
                    setMessage("");
                  }}
                >
                  Tentar novamente
                  <RotateCcw size={17} />
                </button>
              ))}
            <a
              className="atena-button secondary"
              href="./estudar.html#questoes"
            >
              Praticar mais questões
            </a>
          </div>
        </article>
      </div>
    </AtenaToolLayout>
  );
}
