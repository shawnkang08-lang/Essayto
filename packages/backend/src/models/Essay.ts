import { SupportedLanguage } from '../services/LanguageDetectionService.js';
import { Correction, Score } from './Correction.js';

export type EssayStatus = 'draft' | 'processing' | 'completed' | 'failed';

export interface Topic {
  id?: string;
  title: string;
  description: string;
  mode?: 'academic' | 'professional' | 'creative' | 'exam';
  difficulty?: number;
}

export interface Essay {
  id: string;
  userId: string;
  originalText: string;
  language: SupportedLanguage;
  corrections: Correction[];
  polishedVersion: string | null;
  score: Score | null;
  topic: Topic | null;
  status: EssayStatus;
  createdAt: Date;
  completedAt: Date | null;
}

export interface CreateEssayDto {
  userId: string;
  originalText: string;
  language?: SupportedLanguage;
  topic?: Topic;
}

export interface UpdateEssayDto {
  originalText?: string;
  language?: SupportedLanguage;
  topic?: Topic;
}

export interface EssayFilters {
  userId: string;
  language?: SupportedLanguage;
  status?: EssayStatus;
  dateFrom?: Date;
  dateTo?: Date;
  minScore?: number;
  maxScore?: number;
  topic?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}
