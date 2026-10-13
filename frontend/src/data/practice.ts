import type { LessonPractice } from '../services/videos';

// Built-in practice library. Every learner-facing string is bilingual so the
// page works in English and 繁體中文 without a second code path.

export interface Bilingual {
  en: string;
  zh: string;
}

export type ActivityCategory = 'practice' | 'games' | 'quizzes';
export type Level = 'beginner' | 'intermediate';

interface ActivityBase {
  id: string;
  category: ActivityCategory;
  level: Level;
  icon: string;
  // Set for activities built from a teacher's lesson practice.
  lessonId?: string;
  title: Bilingual;
  description: Bilingual;
}

// "Put the cat on top of the dog": drag the item to one of three spots around
// the anchor.
export type Position = 'on' | 'under' | 'next to';

export interface PositionRound {
  item: { emoji: string; name: string };
  anchor: { emoji: string; name: string };
  answer: Position;
}

export interface PositionActivity extends ActivityBase {
  kind: 'position';
  rounds: PositionRound[];
}

// Drag each picture into the right group.
export interface SortActivity extends ActivityBase {
  kind: 'sort';
  buckets: { id: string; emoji: string; label: Bilingual }[];
  items: { emoji: string; name: string; bucket: string }[];
}

// Tap the words in order to build the sentence.
export interface ScrambleActivity extends ActivityBase {
  kind: 'scramble';
  sentences: { text: string; zh: string }[];
}

// Match each word to its picture.
export interface MatchActivity extends ActivityBase {
  kind: 'match';
  // Built-in pairs use a picture; lesson pairs match English to Chinese.
  pairs: { emoji?: string; word: string; zh: string }[];
}

export interface QuizQuestion {
  prompt: string;
  promptZh: string;
  options: string[];
  answer: number;
  explanation: Bilingual;
}

export interface QuizActivity extends ActivityBase {
  kind: 'quiz';
  questions: QuizQuestion[];
}

export type Activity =
  | PositionActivity
  | SortActivity
  | ScrambleActivity
  | MatchActivity
  | QuizActivity;

export const activities: Activity[] = [
  {
    id: 'where-does-it-go',
    kind: 'position',
    category: 'practice',
    level: 'beginner',
    icon: '🐱',
    title: { en: 'Where does it go?', zh: '放在哪裡？' },
    description: {
      en: 'Drag the picture to the right place: on, under, or next to.',
      zh: '把圖片拖到正確的位置：on、under 或 next to。',
    },
    rounds: [
      { item: { emoji: '🐱', name: 'cat' }, anchor: { emoji: '🐶', name: 'dog' }, answer: 'on' },
      { item: { emoji: '🐭', name: 'mouse' }, anchor: { emoji: '🪑', name: 'chair' }, answer: 'under' },
      { item: { emoji: '🐦', name: 'bird' }, anchor: { emoji: '🌳', name: 'tree' }, answer: 'next to' },
      { item: { emoji: '🍎', name: 'apple' }, anchor: { emoji: '📚', name: 'book' }, answer: 'on' },
      { item: { emoji: '⚽', name: 'ball' }, anchor: { emoji: '🛏️', name: 'bed' }, answer: 'under' },
      { item: { emoji: '🐸', name: 'frog' }, anchor: { emoji: '🐢', name: 'turtle' }, answer: 'next to' },
    ],
  },
  {
    id: 'sort-it-out',
    kind: 'sort',
    category: 'practice',
    level: 'beginner',
    icon: '🧺',
    title: { en: 'Sort it out', zh: '分類遊戲' },
    description: {
      en: 'Drag each picture into animals, food, or things at school.',
      zh: '把每張圖片拖進「動物」、「食物」或「學校用品」。',
    },
    buckets: [
      { id: 'animals', emoji: '🐾', label: { en: 'Animals', zh: '動物' } },
      { id: 'food', emoji: '🍽️', label: { en: 'Food', zh: '食物' } },
      { id: 'school', emoji: '🎒', label: { en: 'At school', zh: '學校用品' } },
    ],
    items: [
      { emoji: '🐘', name: 'elephant', bucket: 'animals' },
      { emoji: '🐧', name: 'penguin', bucket: 'animals' },
      { emoji: '🦁', name: 'lion', bucket: 'animals' },
      { emoji: '🍕', name: 'pizza', bucket: 'food' },
      { emoji: '🍌', name: 'banana', bucket: 'food' },
      { emoji: '🍪', name: 'cookie', bucket: 'food' },
      { emoji: '✏️', name: 'pencil', bucket: 'school' },
      { emoji: '📓', name: 'notebook', bucket: 'school' },
      { emoji: '🎒', name: 'backpack', bucket: 'school' },
    ],
  },
  {
    id: 'sentence-builder',
    kind: 'scramble',
    category: 'games',
    level: 'beginner',
    icon: '🧩',
    title: { en: 'Sentence builder', zh: '句子拼圖' },
    description: {
      en: 'Tap the words in the right order to make a sentence.',
      zh: '依照正確順序點選單字，組成句子。',
    },
    sentences: [
      { text: 'The cat is sleeping', zh: '貓咪正在睡覺。' },
      { text: 'I like to read books', zh: '我喜歡看書。' },
      { text: 'She goes to school by bus', zh: '她搭公車去上學。' },
      { text: 'We are playing in the park', zh: '我們正在公園裡玩。' },
      { text: 'My brother can swim very well', zh: '我弟弟（哥哥）游泳游得很好。' },
    ],
  },
  {
    id: 'picture-match',
    kind: 'match',
    category: 'games',
    level: 'beginner',
    icon: '🃏',
    title: { en: 'Picture match', zh: '圖片配對' },
    description: {
      en: 'Match every word with its picture as fast as you can.',
      zh: '用最快的速度把單字和圖片配成一對。',
    },
    pairs: [
      { emoji: '🍎', word: 'apple', zh: '蘋果' },
      { emoji: '🚌', word: 'bus', zh: '公車' },
      { emoji: '🐟', word: 'fish', zh: '魚' },
      { emoji: '🌧️', word: 'rain', zh: '下雨' },
      { emoji: '📖', word: 'book', zh: '書' },
      { emoji: '🏠', word: 'house', zh: '房子' },
    ],
  },
  {
    id: 'vocabulary-quiz',
    kind: 'quiz',
    category: 'quizzes',
    level: 'beginner',
    icon: '📝',
    title: { en: 'Everyday words quiz', zh: '日常單字小測驗' },
    description: {
      en: 'Five quick questions about common English words.',
      zh: '五題關於常用英文單字的小測驗。',
    },
    questions: [
      {
        prompt: 'Which word means a place where you learn?',
        promptZh: '哪個字是「學習的地方」？',
        options: ['kitchen', 'school', 'garden', 'bank'],
        answer: 1,
        explanation: { en: 'A school is where students learn.', zh: 'school 是學生學習的地方。' },
      },
      {
        prompt: 'What is the opposite of "hot"?',
        promptZh: '"hot" 的相反詞是什麼？',
        options: ['warm', 'big', 'cold', 'fast'],
        answer: 2,
        explanation: { en: 'Hot and cold are opposites.', zh: 'hot（熱）和 cold（冷）是相反詞。' },
      },
      {
        prompt: 'We use a ___ to write.',
        promptZh: '我們用 ___ 來寫字。',
        options: ['spoon', 'pencil', 'shoe', 'cup'],
        answer: 1,
        explanation: { en: 'You write with a pencil.', zh: '寫字用 pencil（鉛筆）。' },
      },
      {
        prompt: 'Which one is a fruit?',
        promptZh: '哪一個是水果？',
        options: ['carrot', 'bread', 'orange', 'rice'],
        answer: 2,
        explanation: { en: 'An orange is a fruit.', zh: 'orange（柳橙）是水果。' },
      },
      {
        prompt: 'Which word means "very happy"?',
        promptZh: '哪個字是「非常開心」？',
        options: ['sad', 'angry', 'tired', 'excited'],
        answer: 3,
        explanation: { en: 'Excited means very happy about something.', zh: 'excited 是對某件事感到很興奮、很開心。' },
      },
    ],
  },
  {
    id: 'grammar-quiz',
    kind: 'quiz',
    category: 'quizzes',
    level: 'intermediate',
    icon: '✍️',
    title: { en: 'Grammar check', zh: '文法檢查' },
    description: {
      en: 'Pick the correct word to finish each sentence.',
      zh: '選出正確的單字完成句子。',
    },
    questions: [
      {
        prompt: 'She ___ to school every day.',
        promptZh: '她每天都去上學。',
        options: ['go', 'goes', 'going', 'gone'],
        answer: 1,
        explanation: { en: 'With she/he/it we add -es: goes.', zh: '主詞是 she/he/it 時，動詞要加 -es：goes。' },
      },
      {
        prompt: 'There ___ two cats in the garden.',
        promptZh: '花園裡有兩隻貓。',
        options: ['is', 'am', 'are', 'be'],
        answer: 2,
        explanation: { en: 'Two cats is plural, so we use "are".', zh: '兩隻貓是複數，所以用 are。' },
      },
      {
        prompt: 'I ___ my homework yesterday.',
        promptZh: '我昨天寫了作業。',
        options: ['do', 'does', 'did', 'doing'],
        answer: 2,
        explanation: { en: '"Yesterday" is past tense: did.', zh: 'yesterday 表示過去，用 did。' },
      },
      {
        prompt: 'The book is ___ the table.',
        promptZh: '書在桌子上。',
        options: ['on', 'at', 'in', 'to'],
        answer: 0,
        explanation: { en: 'Use "on" for something resting on a surface.', zh: '東西放在表面上用 on。' },
      },
      {
        prompt: 'He is ___ than his sister.',
        promptZh: '他比他姊姊（妹妹）高。',
        options: ['tall', 'taller', 'tallest', 'more tall'],
        answer: 1,
        explanation: { en: 'Comparing two people: tall → taller.', zh: '比較兩個人：tall → taller。' },
      },
    ],
  },
];

// Turns a lesson's teacher-authored practice into playable activities. A
// section with nothing in it produces no activity.
export function lessonActivities(lesson: { id: string; title: string; practice?: LessonPractice | null }): Activity[] {
  const p = lesson.practice;
  if (!p) return [];
  const base = { level: 'beginner' as Level, lessonId: lesson.id };
  const named = (en: string, zh: string): Bilingual => ({
    en: `${lesson.title}: ${en}`,
    zh: `${lesson.title}：${zh}`,
  });
  const out: Activity[] = [];

  if (p.quiz.length > 0) {
    out.push({
      ...base,
      id: `lesson-${lesson.id}-quiz`,
      kind: 'quiz',
      category: 'quizzes',
      icon: '📝',
      title: named('Quiz', '小測驗'),
      description: { en: 'Questions about this lesson.', zh: '關於這堂課的題目。' },
      questions: p.quiz.map((q) => ({
        prompt: q.prompt,
        promptZh: q.promptZh ?? '',
        options: q.options,
        answer: q.answer,
        explanation: {
          en: q.explanation ?? '',
          zh: q.explanationZh ?? q.explanation ?? '',
        },
      })),
    });
  }
  if (p.match.length >= 2) {
    out.push({
      ...base,
      id: `lesson-${lesson.id}-match`,
      kind: 'match',
      category: 'games',
      icon: '🃏',
      title: named('Word match', '單字配對'),
      description: { en: 'Match the words from this lesson to their meaning.', zh: '把這堂課的單字配到它的意思。' },
      pairs: p.match,
    });
  }
  if (p.scramble.length > 0) {
    out.push({
      ...base,
      id: `lesson-${lesson.id}-scramble`,
      kind: 'scramble',
      category: 'games',
      icon: '🧩',
      title: named('Sentence builder', '句子拼圖'),
      description: { en: 'Put the words of this lesson in order.', zh: '把這堂課的句子排成正確順序。' },
      sentences: p.scramble.map((x) => ({ text: x.text, zh: x.zh ?? '' })),
    });
  }
  return out;
}

export function getActivity(id: string): Activity | undefined {
  return activities.find((a) => a.id === id);
}

export function pick(text: Bilingual, language: 'en' | 'zh'): string {
  return text[language];
}
