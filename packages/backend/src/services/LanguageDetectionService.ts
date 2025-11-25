import { franc } from 'franc';
import { ValidationError } from '../types/errors.js';

export type SupportedLanguage = 'id' | 'zh' | 'en';

export interface LanguageDetectionResult {
  language: SupportedLanguage;
  confidence: number;
  isReliable: boolean;
}

// ISO 639-3 codes used by franc
const LANGUAGE_CODE_MAP: Record<string, SupportedLanguage> = {
  ind: 'id', // Indonesian
  zsm: 'id', // Malay (often confused with Indonesian)
  cmn: 'zh', // Mandarin Chinese
  zho: 'zh', // Chinese
  eng: 'en', // English
};

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['id', 'zh', 'en'];

export class LanguageDetectionService {
  private readonly confidenceThreshold: number;
  private readonly minTextLength: number;

  constructor(confidenceThreshold: number = 0.95, minTextLength: number = 10) {
    this.confidenceThreshold = confidenceThreshold;
    this.minTextLength = minTextLength;
  }

  /**
   * Detect language from text
   * @param text - Text to analyze
   * @returns Language detection result
   */
  detect(text: string): LanguageDetectionResult {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new ValidationError('Text cannot be empty');
    }

    const cleanText = text.trim();

    // Check minimum length
    if (cleanText.length < this.minTextLength) {
      throw new ValidationError(
        `Text must be at least ${this.minTextLength} characters long for reliable detection`
      );
    }

    // Use franc for detection
    const detectedCode = franc(cleanText, { minLength: this.minTextLength });

    // Handle unknown language
    if (detectedCode === 'und') {
      return {
        language: 'en', // Default to English
        confidence: 0,
        isReliable: false,
      };
    }

    // Map to supported language
    const language = LANGUAGE_CODE_MAP[detectedCode];

    if (!language) {
      // If detected language is not supported, default to English
      return {
        language: 'en',
        confidence: 0,
        isReliable: false,
      };
    }

    // Calculate confidence (franc doesn't provide confidence, so we estimate)
    const confidence = this.estimateConfidence(cleanText, language);

    return {
      language,
      confidence,
      isReliable: confidence >= this.confidenceThreshold,
    };
  }

  /**
   * Detect language with fallback to manual override
   * @param text - Text to analyze
   * @param manualLanguage - Optional manual language override
   * @returns Detected or overridden language
   */
  detectWithFallback(text: string, manualLanguage?: SupportedLanguage): SupportedLanguage {
    // If manual language is provided and valid, use it
    if (manualLanguage && this.isValidLanguage(manualLanguage)) {
      return manualLanguage;
    }

    // Otherwise, detect automatically
    const result = this.detect(text);
    return result.language;
  }

  /**
   * Validate if language is supported
   * @param language - Language code to validate
   * @returns True if language is supported
   */
  isValidLanguage(language: string): language is SupportedLanguage {
    return SUPPORTED_LANGUAGES.includes(language as SupportedLanguage);
  }

  /**
   * Get list of supported languages
   * @returns Array of supported language codes
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return [...SUPPORTED_LANGUAGES];
  }

  /**
   * Estimate confidence based on text characteristics
   * This is a heuristic since franc doesn't provide confidence scores
   */
  private estimateConfidence(text: string, language: SupportedLanguage): number {
    const length = text.length;

    // Base confidence on text length
    let confidence = 0.5;

    if (length > 100) confidence = 0.8;
    if (length > 200) confidence = 0.9;
    if (length > 500) confidence = 0.95;

    // Adjust based on language-specific characteristics
    if (language === 'zh') {
      // Chinese text should have Chinese characters
      const chineseCharCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
      const chineseRatio = chineseCharCount / text.length;
      if (chineseRatio > 0.3) {
        confidence = Math.min(confidence + 0.1, 1.0);
      } else if (chineseRatio < 0.1) {
        confidence = Math.max(confidence - 0.2, 0.5);
      }
    } else if (language === 'en') {
      // English text should have mostly ASCII characters
      const asciiCharCount = (text.match(/[a-zA-Z]/g) || []).length;
      const asciiRatio = asciiCharCount / text.length;
      if (asciiRatio > 0.5) {
        confidence = Math.min(confidence + 0.1, 1.0);
      }
    } else if (language === 'id') {
      // Indonesian uses Latin script
      const latinCharCount = (text.match(/[a-zA-Z]/g) || []).length;
      const latinRatio = latinCharCount / text.length;
      if (latinRatio > 0.5) {
        confidence = Math.min(confidence + 0.05, 1.0);
      }
    }

    return Math.round(confidence * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Detect multiple languages in text (for mixed-language content)
   * @param text - Text to analyze
   * @returns Array of detected languages with their portions
   */
  detectMultiple(text: string): Array<{ language: SupportedLanguage; portion: number }> {
    // Split text into sentences
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    const languageCounts: Record<SupportedLanguage, number> = {
      id: 0,
      zh: 0,
      en: 0,
    };

    // Detect language for each sentence
    sentences.forEach((sentence) => {
      if (sentence.trim().length >= this.minTextLength) {
        try {
          const result = this.detect(sentence);
          languageCounts[result.language]++;
        } catch {
          // Skip sentences that are too short
        }
      }
    });

    const total = Object.values(languageCounts).reduce((sum, count) => sum + count, 0);

    if (total === 0) {
      return [{ language: 'en', portion: 1.0 }];
    }

    // Calculate portions
    return Object.entries(languageCounts)
      .filter(([_, count]) => count > 0)
      .map(([lang, count]) => ({
        language: lang as SupportedLanguage,
        portion: Math.round((count / total) * 100) / 100,
      }))
      .sort((a, b) => b.portion - a.portion);
  }
}
