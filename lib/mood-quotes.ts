export type MoodQuote = {
  text: string;
  author: string;
};

// Short, mood-lifting quotes written for this app (no external attribution needed).
const QUOTE_POOL: MoodQuote[] = [
  { text: 'Today is a fresh start. Take it one kind step at a time.', author: 'Moodify' },
  { text: 'You have survived 100% of your hard days so far.', author: 'Moodify' },
  { text: 'Small progress is still progress. Keep going.', author: 'Moodify' },
  { text: 'Breathe in calm, breathe out tension.', author: 'Moodify' },
  { text: 'Your feelings are valid, and they are not your destiny.', author: 'Moodify' },
  { text: 'You can be gentle with yourself and still grow.', author: 'Moodify' },
  { text: 'Rest is productive when it restores you.', author: 'Moodify' },
  { text: 'Choose one helpful thing. That is enough for today.', author: 'Moodify' },
  { text: 'Your mind can change course—one thought at a time.', author: 'Moodify' },
  { text: 'Hope is a skill. Practice it in small moments.', author: 'Moodify' },
  { text: 'Notice one good thing. Let it stay for a breath.', author: 'Moodify' },
  { text: 'You are allowed to start again, even now.', author: 'Moodify' },
  { text: 'Kindness to yourself is not a reward; it is a requirement.', author: 'Moodify' },
  { text: 'You don’t need to be perfect to be worthy.', author: 'Moodify' },
  { text: 'If it feels heavy, make the next step smaller.', author: 'Moodify' },
  { text: 'You can feel anxious and still be brave.', author: 'Moodify' },
  { text: 'Today, aim for steady—not flawless.', author: 'Moodify' },
  { text: 'Your pace is allowed to be different from others.', author: 'Moodify' },
  { text: 'What you practice becomes easier to access.', author: 'Moodify' },
  { text: 'A single deep breath is a reset button.', author: 'Moodify' },
  { text: 'Let the day be imperfect. Let you be human.', author: 'Moodify' },
  { text: 'You are not behind. You are becoming.', author: 'Moodify' },
  { text: 'Make space for comfort, not just productivity.', author: 'Moodify' },
  { text: 'You can ask for help and still be strong.', author: 'Moodify' },
  { text: 'Focus on what you can influence—one choice at a time.', author: 'Moodify' },
  { text: 'You can do hard things—especially gently.', author: 'Moodify' },
  { text: 'Let go of “all or nothing.” Try “some and steady.”', author: 'Moodify' },
  { text: 'This moment is enough. You are enough.', author: 'Moodify' },
  { text: 'Feelings move like weather. You don’t have to chase them.', author: 'Moodify' },
  { text: 'When you slow down, clarity can catch up.', author: 'Moodify' },
  { text: 'Give yourself credit for showing up.', author: 'Moodify' },
  { text: 'Try again, but softer this time.', author: 'Moodify' },
  { text: 'You can carry hope and uncertainty together.', author: 'Moodify' },
  { text: 'Your worth is not measured by your output.', author: 'Moodify' },
  { text: 'Pause. Exhale. Continue with care.', author: 'Moodify' },
  { text: 'You are learning—even when it’s messy.', author: 'Moodify' },
  { text: 'You’re allowed to protect your energy.', author: 'Moodify' },
  { text: 'Do the next right thing, then the next.', author: 'Moodify' },
  { text: 'Be patient with your progress; it’s still progress.', author: 'Moodify' },
  { text: 'You’re not a problem to fix—you’re a person to care for.', author: 'Moodify' },
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

export function getLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDailyMoodQuotes(date: Date, count = 5): MoodQuote[] {
  const dateKey = getLocalDateKey(date);
  const seed = hashStringToSeed(`moodify:${dateKey}`);
  const shuffled = shuffleDeterministic(QUOTE_POOL, seed);
  return shuffled.slice(0, Math.max(1, Math.min(count, shuffled.length)));
}
