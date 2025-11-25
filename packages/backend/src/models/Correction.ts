import { SupportedLanguage } from '../services/LanguageDetectionService.js';

export type CorrectionType = 'grammar' | 'vocabulary' | 'structure' | 'style';
export type CorrectionSeverity = 'error' | 'warning' | 'suggestion';

export interface Correction {
  id: string;
  type: CorrectionType;
  originalText: string;
  correctedText: string;
  explanation: string;
  position: {
    start: number;
    end: number;
  };
  severity: CorrectionSeverity;
}

export interface Score {
  overall: number;
  grammar: number;
  vocabulary: number;
  structure: number;
  fluency: number;
  coherence: number;
  timestamp: Date;
}

export interface CorrectionResult {
  corrections: Correction[];
  polishedVersion: string;
  score: Score;
  language: SupportedLanguage;
  originalLength: number;
  correctedLength: number;
}

export interface CorrectionRequest {
  text: string;
  language: SupportedLanguage;
  userId?: string;
}
