
export interface VocabWord {
  id?: string;
  hanzi: string;
  pinyin: string;
  translations: string[];
  level: number | string;
  examples?: string[];
  traditional?: string;
  partOfSpeech?: string;
  translationsThai?: string[];
  sheetExample?: string;
}

export interface AppData {
  [level: string]: VocabWord[];
}

export type ViewMode = 'home' | 'list' | 'flashcard' | 'quiz' | 'speed' | 'match' | 'write' | 'pinyin' | 'game_setup';

export enum HSKLevel {
  ONE = '1',
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6'
}

export interface GeminiExplanation {
  meaning: string;
  usage: string;
  examples: { chinese: string; pinyin: string; english: string }[];
}
