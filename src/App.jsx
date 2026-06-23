import { AnimatePresence, motion } from "framer-motion";
import { Loader2, RotateCcw, Shuffle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadQuestions } from "./lib/questions.js";

const PLACEHOLDER = "버튼을 눌러 질문을 확인하세요!";
const PICK_DURATION_MS = 1350;
const shuffleTextMotion = {
  initial: {
    opacity: 0,
    y: 26,
    scale: 0.96,
    filter: "blur(7px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.16, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -26,
    scale: 1.02,
    filter: "blur(7px)",
    transition: { duration: 0.13, ease: "easeIn" },
  },
};

const revealTextMotion = {
  initial: {
    opacity: 0,
    y: 14,
    scale: 0.92,
    filter: "blur(5px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 280,
      damping: 18,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    filter: "blur(4px)",
    transition: { duration: 0.14 },
  },
};

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getShuffleQuestion(questions, currentQuestion) {
  if (questions.length <= 1) {
    return questions[0] ?? PLACEHOLDER;
  }

  const candidates = questions.filter((question) => question !== currentQuestion);
  return getRandomItem(candidates.length > 0 ? candidates : questions);
}

function pickFinalQuestion(questions, usedQuestions, currentQuestion) {
  if (questions.length <= 1) {
    return {
      question: questions[0] ?? PLACEHOLDER,
      shouldResetRound: false,
    };
  }

  const unusedQuestions = questions.filter(
    (question) => !usedQuestions.has(question) && question !== currentQuestion,
  );

  if (unusedQuestions.length > 0) {
    return {
      question: getRandomItem(unusedQuestions),
      shouldResetRound: false,
    };
  }

  const nextRoundQuestions = questions.filter(
    (question) => question !== currentQuestion,
  );

  return {
    question: getRandomItem(
      nextRoundQuestions.length > 0 ? nextRoundQuestions : questions,
    ),
    shouldResetRound: true,
  };
}

export default function App() {
  const [questions, setQuestions] = useState([]);
  const [displayQuestion, setDisplayQuestion] = useState(PLACEHOLDER);
  const [lastQuestion, setLastQuestion] = useState("");
  const [usedQuestions, setUsedQuestions] = useState(() => new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isPicking, setIsPicking] = useState(false);
  const [revealKey, setRevealKey] = useState(0);
  const [shuffleStep, setShuffleStep] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    loadQuestions()
      .then((loadedQuestions) => {
        if (isMounted) {
          setQuestions(loadedQuestions);
          setUsedQuestions(new Set());
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      window.clearTimeout(timerRef.current);
    };
  }, []);

  const questionCountLabel = useMemo(() => {
    if (isLoading) return "질문을 불러오는 중";
    if (questions.length === 0) return "질문 없음";

    const remainingCount = Math.max(questions.length - usedQuestions.size, 0);

    if (remainingCount === 0) {
      return `${questions.length}개 모두 확인`;
    }

    return `${remainingCount}개 남음`;
  }, [isLoading, questions.length, usedQuestions.size]);

  const resetRound = useCallback(() => {
    if (isPicking) {
      return;
    }

    window.clearTimeout(timerRef.current);
    setUsedQuestions(new Set());
    setLastQuestion("");
    setDisplayQuestion(PLACEHOLDER);
    setRevealKey((key) => key + 1);
    setShuffleStep(0);
  }, [isPicking]);

  const pickQuestion = useCallback(() => {
    if (isPicking || isLoading || questions.length === 0) {
      return;
    }

    window.clearTimeout(timerRef.current);

    const { question: finalQuestion, shouldResetRound } = pickFinalQuestion(
      questions,
      usedQuestions,
      lastQuestion,
    );
    const startedAt = performance.now();

    setIsPicking(true);
    setShuffleStep(0);

    const shuffle = () => {
      const elapsed = performance.now() - startedAt;
      const progress = Math.min(elapsed / PICK_DURATION_MS, 1);
      const easingDelay = 32 + progress ** 2.6 * 165;

      if (progress >= 1) {
        setDisplayQuestion(finalQuestion);
        setLastQuestion(finalQuestion);
        setUsedQuestions((previousQuestions) => {
          const nextQuestions = shouldResetRound
            ? new Set()
            : new Set(previousQuestions);

          nextQuestions.add(finalQuestion);
          return nextQuestions;
        });
        setRevealKey((key) => key + 1);
        setIsPicking(false);
        return;
      }

      setDisplayQuestion((currentQuestion) =>
        getShuffleQuestion(questions, currentQuestion),
      );
      setShuffleStep((step) => step + 1);
      timerRef.current = window.setTimeout(shuffle, easingDelay);
    };

    shuffle();
  }, [isLoading, isPicking, lastQuestion, questions, usedQuestions]);

  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-900 [font-family:var(--font-playful)]">
      <header className="sticky top-0 z-20 bg-white/85 px-4 py-4 backdrop-blur-md">
        <nav className="mx-auto flex max-w-md items-center justify-center">
          <a
            className="group flex min-h-11 items-center justify-center px-4"
            href="/"
            aria-label="Econovation home"
          >
            <img
              className="h-16 max-w-[300px] object-contain"
              src="/logo2.png"
              alt="Econovation"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </a>
        </nav>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-84px)] w-full max-w-md flex-col justify-center px-5 pb-8 pt-2">
        <section className="space-y-6">
          <div className="text-center">
            <p className="text-sm font-black tracking-[0.14em] text-[#6677c7]">
              네트워킹 데이
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-wide text-slate-900 drop-shadow-[0_3px_0_rgba(129,140,248,0.18)]">
              무슨 질문이 나올까요 💡
            </h1>
          </div>

          <motion.div
            className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-[2.2rem] bg-[#e9ecff] p-4 shadow-[0_16px_28px_rgba(99,102,241,0.18),inset_6px_6px_10px_rgba(255,255,255,0.85),inset_-8px_-8px_14px_rgba(129,140,248,0.18)]"
            animate={{ y: [-4, 5, -4], rotate: [-1.5, 1.5, -1.5] }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <img
              className="relative z-10 h-full w-full object-contain"
              src="/logo.png"
              alt="Econovation mascot"
              onError={(event) => {
                if (!event.currentTarget.dataset.fallback) {
                  event.currentTarget.dataset.fallback = "true";
                  event.currentTarget.src = "/logo.webp";
                  return;
                }

                event.currentTarget.style.display = "none";
              }}
            />
          </motion.div>

          <motion.article
            className="relative mt-2 flex min-h-[260px] items-center justify-center rounded-[2rem] bg-[#7185d8] px-6 py-11 shadow-[0_20px_34px_rgba(99,102,241,0.24),inset_6px_6px_10px_rgba(255,255,255,0.42),inset_-8px_-8px_14px_rgba(67,56,202,0.22)]"
            animate={
              isPicking
                ? {
                    scale: 0.975,
                    boxShadow:
                      "0 14px 24px rgba(99,102,241,0.22), inset 5px 5px 9px rgba(255,255,255,0.38), inset -7px -7px 12px rgba(67,56,202,0.24)",
                  }
                : {
                    scale: 1,
                    boxShadow:
                      "0 20px 34px rgba(99,102,241,0.24), inset 6px 6px 10px rgba(255,255,255,0.42), inset -8px -8px 14px rgba(67,56,202,0.22)",
                  }
            }
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <div className="absolute right-5 top-0 z-10 -translate-y-1/2">
              <span className="inline-flex items-center rounded-full bg-[#f4f6ff] px-4 py-2 text-xs font-black text-[#6677c7] shadow-[0_8px_16px_rgba(99,102,241,0.18),inset_3px_3px_5px_rgba(255,255,255,0.9),inset_-4px_-4px_7px_rgba(129,140,248,0.16)]">
                {questionCountLabel}
              </span>
            </div>

            <div className="relative z-10 flex min-h-[170px] w-full items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={
                    isPicking ? `shuffle-${shuffleStep}` : `question-${revealKey}`
                  }
                  className={`text-balance break-keep text-center text-2xl font-black leading-snug text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.16)] ${
                    isPicking
                      ? "drop-shadow-[0_5px_0_rgba(0,0,0,0.14)]"
                      : ""
                  }`}
                  variants={isPicking ? shuffleTextMotion : revealTextMotion}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  aria-live="polite"
                >
                  {displayQuestion}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.article>

          <div className="space-y-4 pt-1">
            <motion.button
              className="flex w-full items-center justify-center gap-3 rounded-[1.6rem] bg-[#818cf8] px-5 py-4 text-xl font-black text-white shadow-[0_14px_24px_rgba(99,102,241,0.28),inset_5px_5px_9px_rgba(255,255,255,0.44),inset_-6px_-6px_11px_rgba(67,56,202,0.28)] transition disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={pickQuestion}
              disabled={isLoading || isPicking || questions.length === 0}
              whileTap={{ scale: 0.95 }}
              whileHover={
                isPicking
                  ? { scale: 1 }
                  : {
                      scale: 1.035,
                      y: -3,
                      transition: {
                        type: "spring",
                        stiffness: 360,
                        damping: 14,
                      },
                    }
              }
            >
              {isPicking ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Shuffle className="h-5 w-5" aria-hidden="true" />
              )}
              {isPicking ? "섞는 중" : "질문 뽑기"}
            </motion.button>

            <motion.button
              className="mx-auto flex items-center justify-center gap-2 rounded-2xl bg-[#eef1ff] px-5 py-3 text-sm font-black text-[#6677c7] shadow-[0_10px_18px_rgba(99,102,241,0.16),inset_3px_3px_6px_rgba(255,255,255,0.88),inset_-5px_-5px_9px_rgba(129,140,248,0.16)] transition disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              onClick={resetRound}
              disabled={isLoading || isPicking || questions.length === 0}
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: isPicking ? 1 : 1.025, y: isPicking ? 0 : -1 }}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              새로운 라운드
            </motion.button>
          </div>
        </section>
      </main>
    </div>
  );
}
