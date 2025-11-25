import { LLMClient } from './LLMClient.js';
import { PromptTemplates } from './PromptTemplates.js';
import { SupportedLanguage } from './LanguageDetectionService.js';
import { ValidationError } from '../types/errors.js';

export interface TranslationRequest {
  text: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  cached: boolean;
}

export class TranslationService {
  private llmClient: LLMClient;

  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }

  /**
   * Translate text between supported languages
   */
  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const { text, sourceLanguage, targetLanguage } = request;

    // Validate input
    if (!text || text.trim().length === 0) {
      throw new ValidationError('Text cannot be empty');
    }

    if (sourceLanguage === targetLanguage) {
      throw new ValidationError('Source and target languages must be different');
    }

    console.log(`🌐 Translating from ${sourceLanguage} to ${targetLanguage}...`);

    // Generate translation prompt
    const prompt = PromptTemplates.translation({
      text,
      sourceLanguage,
      targetLanguage,
    });

    try {
      const response = await this.llmClient.call({
        prompt: prompt.user,
        systemPrompt: prompt.system,
        temperature: 0.3, // Lower temperature for more accurate translations
        maxTokens: Math.min(text.length * 3, 3000), // Estimate tokens needed
        useCache: true,
        cacheTTL: 86400, // 24 hours
      });

      console.log(`✅ Translation complete`);

      return {
        originalText: text,
        translatedText: response.content.trim(),
        sourceLanguage,
        targetLanguage,
        cached: response.cached,
      };
    } catch (error) {
      console.error('Translation failed:', error);
      throw new Error('Failed to translate text');
    }
  }

  /**
   * Batch translate multiple texts
   */
  async translateBatch(
    texts: string[],
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage
  ): Promise<TranslationResult[]> {
    const promises = texts.map((text) =>
      this.translate({
        text,
        sourceLanguage,
        targetLanguage,
      })
    );

    return Promise.all(promises);
  }

  /**
   * Get supported language pairs
   */
  getSupportedLanguagePairs(): Array<{
    source: SupportedLanguage;
    target: SupportedLanguage;
  }> {
    const languages: SupportedLanguage[] = ['id', 'zh', 'en'];
    const pairs: Array<{ source: SupportedLanguage; target: SupportedLanguage }> = [];

    for (const source of languages) {
      for (const target of languages) {
        if (source !== target) {
          pairs.push({ source, target });
        }
      }
    }

    return pairs;
  }
}
