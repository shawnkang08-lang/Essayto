import { LLMClient } from './LLMClient.js';
import { PromptTemplates } from './PromptTemplates.js';
import { LanguageDetectionService, SupportedLanguage } from './LanguageDetectionService.js';
import {
  Correction,
  CorrectionResult,
  CorrectionRequest,
  Score,
  CorrectionType,
} from '../models/Correction.js';
import { v4 as uuidv4 } from 'uuid';

interface LLMCorrectionResponse {
  corrections: Array<{
    type: CorrectionType;
    original: string;
    corrected: string;
    explanation: string;
    position: { start: number; end: number };
    severity: 'error' | 'warning' | 'suggestion';
  }>;
  polishedVersion: string;
}

export class CorrectionService {
  private llmClient: LLMClient;
  private languageService: LanguageDetectionService;

  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
    this.languageService = new LanguageDetectionService();
  }

  /**
   * Process essay and generate corrections
   */
  async correctEssay(request: CorrectionRequest): Promise<CorrectionResult> {
    const { text, language } = request;

    console.log(`📝 Processing essay correction (${language}, ${text.length} chars)`);

    // Step 1: Get corrections from LLM
    const corrections = await this.getCorrections(text, language);

    // Step 2: Calculate scores
    const score = this.calculateScore(corrections, text.length);

    // Step 3: Build result
    const result: CorrectionResult = {
      corrections,
      polishedVersion: corrections.length > 0 
        ? await this.getPolishedVersion(text, language, corrections)
        : text,
      score,
      language,
      originalLength: text.length,
      correctedLength: corrections.length > 0 
        ? (await this.getPolishedVersion(text, language, corrections)).length 
        : text.length,
    };

    console.log(`✅ Correction complete: ${corrections.length} corrections, score: ${score.overall}`);

    return result;
  }

  /**
   * Get corrections from LLM
   */
  private async getCorrections(text: string, language: SupportedLanguage): Promise<Correction[]> {
    try {
      const prompt = PromptTemplates.correction({ essay: text, language });

      const response = await this.llmClient.callJSON<LLMCorrectionResponse>({
        prompt: prompt.user,
        systemPrompt: prompt.system,
        temperature: 0.3, // Lower temperature for more consistent corrections
        maxTokens: 3000,
        useCache: true,
        cacheTTL: 86400, // 24 hours
      });

      // Transform LLM response to Correction objects
      return response.corrections.map((c) => ({
        id: uuidv4(),
        type: c.type,
        originalText: c.original,
        correctedText: c.corrected,
        explanation: c.explanation,
        position: c.position,
        severity: c.severity,
      }));
    } catch (error) {
      console.error('Failed to get corrections from LLM:', error);
      throw new Error('Failed to analyze essay');
    }
  }

  /**
   * Get polished version from LLM response or generate it
   */
  private async getPolishedVersion(
    originalText: string,
    language: SupportedLanguage,
    corrections: Correction[]
  ): Promise<string> {
    try {
      const prompt = PromptTemplates.correction({ essay: originalText, language });
      const response = await this.llmClient.callJSON<LLMCorrectionResponse>({
        prompt: prompt.user,
        systemPrompt: prompt.system,
        temperature: 0.3,
        maxTokens: 3000,
        useCache: true,
      });

      return response.polishedVersion || this.applyCorrections(originalText, corrections);
    } catch (error) {
      console.error('Failed to get polished version:', error);
      return this.applyCorrections(originalText, corrections);
    }
  }

  /**
   * Apply corrections to original text (fallback method)
   */
  private applyCorrections(text: string, corrections: Correction[]): string {
    // Sort corrections by position (descending) to apply from end to start
    const sortedCorrections = [...corrections].sort((a, b) => b.position.start - a.position.start);

    let result = text;
    for (const correction of sortedCorrections) {
      const { start, end } = correction.position;
      if (start >= 0 && end <= result.length) {
        result = result.substring(0, start) + correction.correctedText + result.substring(end);
      }
    }

    return result;
  }

  /**
   * Calculate score based on corrections and essay length
   */
  calculateScore(corrections: Correction[], essayLength: number): Score {
    // Count corrections by type
    const grammarErrors = corrections.filter((c) => c.type === 'grammar');
    const vocabErrors = corrections.filter((c) => c.type === 'vocabulary');
    const structureErrors = corrections.filter((c) => c.type === 'structure');
    const styleIssues = corrections.filter((c) => c.type === 'style');

    // Calculate error density (errors per 100 characters)
    const errorDensity = (corrections.length / essayLength) * 100;

    // Calculate individual scores (start at 100, deduct points)
    const grammarScore = Math.max(0, 100 - grammarErrors.length * 3);
    const vocabularyScore = Math.max(0, 100 - vocabErrors.length * 2);
    const structureScore = Math.max(0, 100 - structureErrors.length * 4);

    // Fluency based on error density
    const fluencyScore = Math.max(0, 100 - errorDensity * 5);

    // Coherence is a combination of structure and style
    const coherenceScore = Math.round(structureScore * 0.7 + Math.max(0, 100 - styleIssues.length * 2) * 0.3);

    // Overall score is weighted average
    const overall = Math.round(
      grammarScore * 0.25 +
        vocabularyScore * 0.2 +
        structureScore * 0.25 +
        fluencyScore * 0.15 +
        coherenceScore * 0.15
    );

    return {
      overall: Math.max(0, Math.min(100, overall)),
      grammar: Math.max(0, Math.min(100, Math.round(grammarScore))),
      vocabulary: Math.max(0, Math.min(100, Math.round(vocabularyScore))),
      structure: Math.max(0, Math.min(100, Math.round(structureScore))),
      fluency: Math.max(0, Math.min(100, Math.round(fluencyScore))),
      coherence: Math.max(0, Math.min(100, coherenceScore)),
      timestamp: new Date(),
    };
  }

  /**
   * Get correction statistics
   */
  getCorrectionStats(corrections: Correction[]): {
    total: number;
    byType: Record<CorrectionType, number>;
    bySeverity: Record<string, number>;
  } {
    const byType: Record<CorrectionType, number> = {
      grammar: 0,
      vocabulary: 0,
      structure: 0,
      style: 0,
    };

    const bySeverity: Record<string, number> = {
      error: 0,
      warning: 0,
      suggestion: 0,
    };

    corrections.forEach((c) => {
      byType[c.type]++;
      bySeverity[c.severity]++;
    });

    return {
      total: corrections.length,
      byType,
      bySeverity,
    };
  }
}
