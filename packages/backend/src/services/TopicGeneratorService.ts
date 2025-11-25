import { LLMClient } from './LLMClient.js';
import { PromptTemplates } from './PromptTemplates.js';
import { ProgressService } from './ProgressService.js';
import { SupportedLanguage } from './LanguageDetectionService.js';
import { Rank } from '../models/Progress.js';
import { Topic } from '../models/Essay.js';
import { v4 as uuidv4 } from 'uuid';

export type TopicMode = 'academic' | 'professional' | 'creative' | 'exam';
export type TopicDifficulty = 1 | 2 | 3 | 4 | 5;

export interface TopicGenerationRequest {
  mode: TopicMode;
  difficulty?: TopicDifficulty;
  language: SupportedLanguage;
  userId?: string;
}

interface LLMTopicResponse {
  title: string;
  description: string;
}

export class TopicGeneratorService {
  private llmClient: LLMClient;
  private progressService: ProgressService;

  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
    this.progressService = new ProgressService();
  }

  /**
   * Map rank to difficulty level
   */
  private rankToDifficulty(rank: Rank): TopicDifficulty {
    const rankMap: Record<Rank, TopicDifficulty> = {
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 4,
      diamond: 5,
    };
    return rankMap[rank];
  }

  /**
   * Generate personalized topic
   */
  async generateTopic(request: TopicGenerationRequest): Promise<Topic> {
    let difficulty = request.difficulty;
    let weaknesses: string[] = [];

    // If user ID provided, personalize based on their progress
    if (request.userId) {
      const progress = await this.progressService.getUserProgress(request.userId);

      // Use user's rank to determine difficulty if not specified
      if (!difficulty) {
        difficulty = this.rankToDifficulty(progress.rank);
      }

      // Extract weakness categories
      weaknesses = progress.weaknesses.slice(0, 3).map((w) => w.category);
    }

    // Default difficulty if still not set
    if (!difficulty) {
      difficulty = 3; // Medium difficulty
    }

    // Generate topic using LLM
    const prompt = PromptTemplates.topicGeneration({
      mode: request.mode,
      difficulty,
      language: request.language,
      weaknesses: weaknesses.length > 0 ? weaknesses : undefined,
    });

    try {
      const response = await this.llmClient.callJSON<LLMTopicResponse>({
        prompt: prompt.user,
        systemPrompt: prompt.system,
        temperature: 0.8, // Higher temperature for more creative topics
        maxTokens: 500,
        useCache: false, // Don't cache topics to ensure variety
      });

      return {
        id: uuidv4(),
        title: response.title,
        description: response.description,
        mode: request.mode,
        difficulty,
      };
    } catch (error) {
      console.error('Failed to generate topic:', error);
      // Fallback to predefined topics
      return this.getFallbackTopic(request.mode, difficulty, request.language);
    }
  }

  /**
   * Get fallback topic if LLM fails
   */
  private getFallbackTopic(
    mode: TopicMode,
    difficulty: TopicDifficulty,
    language: SupportedLanguage
  ): Topic {
    const fallbackTopics: Record<TopicMode, Record<SupportedLanguage, string[]>> = {
      academic: {
        en: [
          'The Impact of Technology on Education',
          'Climate Change and Its Global Effects',
          'The Role of Social Media in Modern Society',
        ],
        id: [
          'Dampak Teknologi terhadap Pendidikan',
          'Perubahan Iklim dan Efek Globalnya',
          'Peran Media Sosial dalam Masyarakat Modern',
        ],
        zh: ['技术对教育的影响', '气候变化及其全球影响', '社交媒体在现代社会中的作用'],
      },
      professional: {
        en: [
          'Effective Leadership in the Workplace',
          'The Future of Remote Work',
          'Building a Strong Team Culture',
        ],
        id: [
          'Kepemimpinan Efektif di Tempat Kerja',
          'Masa Depan Kerja Jarak Jauh',
          'Membangun Budaya Tim yang Kuat',
        ],
        zh: ['职场中的有效领导力', '远程工作的未来', '建立强大的团队文化'],
      },
      creative: {
        en: [
          'A Day in the Life of a Time Traveler',
          'The Last Book on Earth',
          'When Robots Dream',
        ],
        id: [
          'Sehari dalam Kehidupan Seorang Penjelajah Waktu',
          'Buku Terakhir di Bumi',
          'Ketika Robot Bermimpi',
        ],
        zh: ['时间旅行者的一天', '地球上的最后一本书', '当机器人做梦时'],
      },
      exam: {
        en: [
          'Some people believe that technology has made our lives easier. Discuss both views and give your opinion.',
          'What are the advantages and disadvantages of living in a big city?',
          'Should governments invest more in public transportation?',
        ],
        id: [
          'Beberapa orang percaya bahwa teknologi telah membuat hidup kita lebih mudah. Diskusikan kedua pandangan dan berikan pendapat Anda.',
          'Apa keuntungan dan kerugian tinggal di kota besar?',
          'Haruskah pemerintah berinvestasi lebih banyak dalam transportasi umum?',
        ],
        zh: [
          '有些人认为技术使我们的生活更轻松。讨论两种观点并给出你的意见。',
          '住在大城市有哪些优点和缺点？',
          '政府应该在公共交通上投资更多吗？',
        ],
      },
    };

    const topics = fallbackTopics[mode][language];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    return {
      id: uuidv4(),
      title: randomTopic,
      description: 'Write an essay on this topic.',
      mode,
      difficulty,
    };
  }

  /**
   * Get topic history for user
   */
  async getTopicHistory(userId: string, limit: number = 10): Promise<Topic[]> {
    const { pool } = await import('../config/database.js');

    const query = `
      SELECT DISTINCT topic
      FROM essays
      WHERE user_id = $1 AND topic IS NOT NULL
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [userId, limit]);

    return result.rows.map((row) => row.topic);
  }
}
