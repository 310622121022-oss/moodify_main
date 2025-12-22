'use client';

import { useEffect, useMemo, useState } from 'react';

type MoodQuote = {
  text: string;
  author: string;
};

const QUOTE_POOL: MoodQuote[] = [
  { text: 'Today is a fresh start. Take it one kind step at a time.', author: 'A. Rivera' },
  { text: 'You have survived 100% of your hard days so far.', author: 'Anonymous' },
  { text: 'Small progress is still progress. Keep going.', author: 'M. Patel' },
  { text: 'Breathe in calm, breathe out tension.', author: 'The Calm Coach' },
  { text: 'Your feelings are valid, and they are not your destiny.', author: 'S. Kim' },
  { text: 'You can be gentle with yourself and still grow.', author: 'N. Johnson' },
  { text: 'Rest is productive when it restores you.', author: 'The Kind Voice' },
  { text: 'Choose one helpful thing. That is enough for today.', author: 'R. Ali' },
  { text: 'Your mind can change course—one thought at a time.', author: 'J. Chen' },
  { text: 'Hope is a skill. Practice it in small moments.', author: 'Anonymous' },
  { text: 'Notice one good thing. Let it stay for a breath.', author: 'K. Moore' },
  { text: 'You are allowed to start again, even now.', author: 'The Gentle Guide' },
  { text: 'Kindness to yourself is not a reward; it is a requirement.', author: 'P. Singh' },
  { text: 'You don’t need to be perfect to be worthy.', author: 'Anonymous' },
  { text: 'If it feels heavy, make the next step smaller.', author: 'L. Garcia' },
  { text: 'You can feel anxious and still be brave.', author: 'D. Nguyen' },
  { text: 'Today, aim for steady—not flawless.', author: 'The Calm Coach' },
  { text: 'Your pace is allowed to be different from others.', author: 'A. Rivera' },
  { text: 'What you practice becomes easier to access.', author: 'J. Chen' },
  { text: 'A single deep breath is a reset button.', author: 'The Kind Voice' },
  { text: 'Let the day be imperfect. Let you be human.', author: 'M. Patel' },
  { text: 'You are not behind. You are becoming.', author: 'S. Kim' },
  { text: 'Make space for comfort, not just productivity.', author: 'N. Johnson' },
  { text: 'You can ask for help and still be strong.', author: 'R. Ali' },
  { text: 'Focus on what you can influence—one choice at a time.', author: 'The Gentle Guide' },
  { text: 'You can do hard things—especially gently.', author: 'P. Singh' },
  { text: 'Let go of “all or nothing.” Try “some and steady.”', author: 'K. Moore' },
  { text: 'This moment is enough. You are enough.', author: 'Anonymous' },
  { text: 'Feelings move like weather. You don’t have to chase them.', author: 'D. Nguyen' },
  { text: 'When you slow down, clarity can catch up.', author: 'L. Garcia' },
  { text: 'Give yourself credit for showing up.', author: 'A. Rivera' },
  { text: 'Try again, but softer this time.', author: 'The Kind Voice' },
  { text: 'You can carry hope and uncertainty together.', author: 'S. Kim' },
  { text: 'Your worth is not measured by your output.', author: 'N. Johnson' },
  { text: 'Pause. Exhale. Continue with care.', author: 'The Calm Coach' },
  { text: 'You are learning—even when it’s messy.', author: 'M. Patel' },
  { text: 'You’re allowed to protect your energy.', author: 'R. Ali' },
  { text: 'Do the next right thing, then the next.', author: 'J. Chen' },
  { text: 'Be patient with your progress; it’s still progress.', author: 'P. Singh' },
  { text: 'You’re not a problem to fix—you’re a person to care for.', author: 'The Gentle Guide' },
];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function shuffleDeterministic<T>(items: T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDailyMoodQuotesByDateKey(dateKey: string, count = 5): MoodQuote[] {
  const seed = hashStringToSeed(`moodify:${dateKey}`);
  const shuffled = shuffleDeterministic(QUOTE_POOL, seed);
  return shuffled.slice(0, Math.max(1, Math.min(count, shuffled.length)));
}


export function QuoteCarousel() {
  const [dateKey, setDateKey] = useState(() => getLocalDateKey(new Date()));
  const [currentIndex, setCurrentIndex] = useState(0);

  const quotes: MoodQuote[] = useMemo(() => {
    // Always show exactly 5 mood-lifting quotes per day.
    return getDailyMoodQuotesByDateKey(dateKey, 5);
  }, [dateKey]);

  useEffect(() => {
    // At local midnight, refresh the day's quote set automatically.
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0,
    );

    const timeoutMs = Math.max(1, nextMidnight.getTime() - now.getTime());
    const timeout = setTimeout(() => {
      setDateKey(getLocalDateKey(new Date()));
      setCurrentIndex(0);
    }, timeoutMs);

    return () => clearTimeout(timeout);
  }, [dateKey]);

  useEffect(() => {
    if (quotes.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % quotes.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [quotes.length]);

  const goToQuote = (index: number) => {
    setCurrentIndex(index);
  };

  const currentQuote = quotes[currentIndex] ?? quotes[0];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-2">
        <h2 className="text-[20px] md:text-[24px] font-semibold text-primary text-center">
          Quote of the Day
        </h2>
        <svg
          width="13"
          height="12"
          viewBox="0 0 13 12"
          className="h-4 w-4 md:h-5 md:w-5 fill-destructive"
          aria-hidden="true"
        >
          <path d="M1.02933 1.29836C2.53313 -0.205442 4.94357 -0.249349 6.50033 1.16663C8.05709 -0.249349 10.4675 -0.205442 11.9713 1.29836C13.5203 2.84737 13.5203 5.35874 11.9713 6.90775L6.97133 11.9078C6.84626 12.0328 6.67663 12.1031 6.49999 12.1031C6.32336 12.1031 6.15373 12.0328 6.02866 11.9078L1.02866 6.90775C-0.520347 5.35874 -0.520347 2.84737 1.02933 1.29836Z" />
        </svg>
      </div>

      <div className="mt-3 flex justify-center">
        <div className="w-full max-w-[720px] px-4">
          <div className="relative mx-auto w-full max-w-[640px] aspect-[324/92] rounded-[15px] bg-primary">
            <div className="absolute left-[1.85%] top-[5.43%] h-[88.04%] w-[95.68%] rounded-[15px] bg-background" />

            <div
              className="absolute left-[1.85%] top-[5.43%] flex h-[88.04%] w-[95.68%] flex-col items-center justify-center px-4 md:px-8 text-center"
            >
              <div
                key={`${dateKey}:${currentIndex}`}
                className="animate-in fade-in slide-in-from-bottom-1 duration-300"
              >
                <p className="text-[14px] md:text-[18px] font-semibold leading-snug text-primary">
                  &ldquo;{currentQuote.text}&rdquo;
                </p>
                <p className="mt-1 text-[12px] md:text-[14px] leading-none text-primary/70">
                  — {currentQuote.author}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            {quotes.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToQuote(index)}
                className={`rounded-full transition-colors ${
                  index === currentIndex
                    ? 'h-2 w-2 bg-primary'
                    : 'h-2 w-2 bg-primary/30 hover:bg-primary/50'
                }`}
                aria-label={`Go to quote ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
