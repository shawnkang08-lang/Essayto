import { EssayRepository } from '../repositories/EssayRepository.js';
import { CorrectionService } from './CorrectionService.js';
import { LanguageDetectionService } from './LanguageDetectionService.js';
import { Essay, CreateEssayDto, UpdateEssayDto, EssayFilters, PaginationParams } from '../models/Essay.js';
import { CorrectionResult } from '../models/Correction.js';
import { PaginatedResponse } from '../types/index.js';
import { ValidationError } from '../types/errors.js';

export class EssayService {
  private essayRepository: EssayRepository;
  private correctionService: CorrectionService;
  private languageService: LanguageDetectionService;

  constructor(essayRepository: EssayRepository, correctionService: CorrectionService) {
    this.essayRepository = essayRepository;
    this.correctionService = correctionService;
    this.languageService = new LanguageDetectionService();
  }

  /**
   * Save essay draft
   */
  async saveDraft(data: CreateEssayDto): Promise<Essay> {
    // Auto-detect language if not provided
    if (!data.language) {
      const detected = this.languageService.detect(data.originalText);
      data.language = detected.language;
    }

    return this.essayRepository.create(data);
  }

  /**
   * Submit essay for correction (async processing)
   */
  async submitEssay(essayId: string, userId: string): Promise<Essay> {
    const essay = await this.essayRepository.findById(essayId, userId);

    if (!essay) {
      throw new ValidationError('Essay not found');
    }

    if (essay.status === 'processing') {
      throw new ValidationError('Essay is already being processed');
    }

    // Update status to processing
    await this.essayRepository.updateStatus(essayId, 'processing');

    // Process essay asynchronously
    this.processEssayAsync(essayId, essay.originalText, essay.language).catch((error) => {
      console.error(`Failed to process essay ${essayId}:`, error);
      this.essayRepository.updateStatus(essayId, 'failed');
    });

    // Return essay with processing status
    return {
      ...essay,
      status: 'processing',
    };
  }

  /**
   * Process essay asynchronously
   */
  private async processEssayAsync(
    essayId: string,
    text: string,
    language: 'id' | 'zh' | 'en'
  ): Promise<void> {
    try {
      console.log(`🔄 Processing essay ${essayId}...`);
      console.log(`📊 Text length: ${text.length} chars, Language: ${language}`);

      // Get corrections and score
      const result = await this.correctionService.correctEssay({
        text,
        language,
      });

      console.log(`📝 Got ${result.corrections.length} corrections`);

      // Update essay with results
      await this.essayRepository.updateResults(
        essayId,
        result.corrections,
        result.polishedVersion,
        result.score,
        'completed'
      );

      console.log(`✅ Essay ${essayId} processed successfully with score: ${result.score.overall}`);
    } catch (error: any) {
      console.error(`❌ Failed to process essay ${essayId}:`);
      console.error(`Error message: ${error.message}`);
      console.error(`Error stack:`, error.stack);
      await this.essayRepository.updateStatus(essayId, 'failed');
    }
  }

  /**
   * Get essay by ID
   */
  async getEssay(essayId: string, userId: string): Promise<Essay> {
    const essay = await this.essayRepository.findById(essayId, userId);

    if (!essay) {
      throw new ValidationError('Essay not found');
    }

    return essay;
  }

  /**
   * List essays with filters and pagination
   */
  async listEssays(filters: EssayFilters, pagination: PaginationParams): Promise<PaginatedResponse<Essay>> {
    return this.essayRepository.find(filters, pagination);
  }

  /**
   * Update essay draft
   */
  async updateDraft(essayId: string, userId: string, data: UpdateEssayDto): Promise<Essay> {
    const essay = await this.essayRepository.findById(essayId, userId);

    if (!essay) {
      throw new ValidationError('Essay not found');
    }

    if (essay.status !== 'draft') {
      throw new ValidationError('Can only update draft essays');
    }

    // Auto-detect language if text is updated but language is not provided
    if (data.originalText && !data.language) {
      const detected = this.languageService.detect(data.originalText);
      data.language = detected.language;
    }

    return this.essayRepository.update(essayId, userId, data);
  }

  /**
   * Delete essay
   */
  async deleteEssay(essayId: string, userId: string): Promise<void> {
    return this.essayRepository.delete(essayId, userId);
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<{
    totalEssays: number;
    averageScore: number | null;
  }> {
    const [totalEssays, averageScore] = await Promise.all([
      this.essayRepository.countByUser(userId),
      this.essayRepository.getAverageScore(userId),
    ]);

    return {
      totalEssays,
      averageScore,
    };
  }
}
