import OpenAI from 'openai';
import { CacheService } from '../config/redis.js';
import crypto from 'crypto';

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai'; // 'openai' or 'groq'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
const OPENAI_MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS || '2000');
const OPENAI_TEMPERATURE = parseFloat(process.env.OPENAI_TEMPERATURE || '0.7');
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  useCache?: boolean;
  cacheTTL?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cached: boolean;
}

export class LLMClient {
  private client: OpenAI;
  private cacheService: CacheService | null;
  private model: string;

  constructor(cacheService?: CacheService) {
    const apiKey = LLM_PROVIDER === 'groq' ? GROQ_API_KEY : OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error(`${LLM_PROVIDER.toUpperCase()}_API_KEY is not configured`);
    }

    // Configure client based on provider
    if (LLM_PROVIDER === 'groq') {
      this.client = new OpenAI({
        apiKey: GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
        timeout: REQUEST_TIMEOUT,
        maxRetries: 0,
      });
      this.model = GROQ_MODEL;
      console.log('🚀 Using Groq LLM with model:', this.model);
    } else {
      this.client = new OpenAI({
        apiKey: OPENAI_API_KEY,
        timeout: REQUEST_TIMEOUT,
        maxRetries: 0,
      });
      this.model = OPENAI_MODEL;
      console.log('🚀 Using OpenAI LLM with model:', this.model);
    }

    this.cacheService = cacheService || null;
  }

  /**
   * Generate cache key from prompt
   */
  private generateCacheKey(prompt: string, systemPrompt?: string): string {
    const content = `${systemPrompt || ''}:${prompt}`;
    return `llm:${crypto.createHash('sha256').update(content).digest('hex')}`;
  }

  /**
   * Call LLM with retry logic
   */
  async call(request: LLMRequest): Promise<LLMResponse> {
    const {
      prompt,
      systemPrompt,
      temperature = OPENAI_TEMPERATURE,
      maxTokens = OPENAI_MAX_TOKENS,
      useCache = true,
      cacheTTL = 86400, // 24 hours
    } = request;

    // Check cache first
    if (useCache && this.cacheService) {
      const cacheKey = this.generateCacheKey(prompt, systemPrompt);
      const cached = await this.cacheService.get<LLMResponse>(cacheKey);

      if (cached) {
        console.log('✅ LLM cache hit');
        return { ...cached, cached: true };
      }
    }

    // Call LLM with retry logic
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`🤖 Calling LLM (attempt ${attempt}/${MAX_RETRIES})...`);

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

        if (systemPrompt) {
          messages.push({
            role: 'system',
            content: systemPrompt,
          });
        }

        messages.push({
          role: 'user',
          content: prompt,
        });

        const completion = await this.client.chat.completions.create({
          model: this.model,
          messages,
          temperature,
          max_tokens: maxTokens,
        });

        const content = completion.choices[0]?.message?.content || '';

        const response: LLMResponse = {
          content,
          usage: completion.usage
            ? {
                promptTokens: completion.usage.prompt_tokens,
                completionTokens: completion.usage.completion_tokens,
                totalTokens: completion.usage.total_tokens,
              }
            : undefined,
          cached: false,
        };

        // Cache the response
        if (useCache && this.cacheService) {
          const cacheKey = this.generateCacheKey(prompt, systemPrompt);
          await this.cacheService.set(cacheKey, response, cacheTTL);
        }

        console.log('✅ LLM call successful');
        return response;
      } catch (error: any) {
        lastError = error;
        console.error(`❌ LLM call attempt ${attempt} failed:`, error.message);

        // Don't retry on certain errors
        if (error.status === 401 || error.status === 403) {
          throw new Error('Invalid API key or insufficient permissions');
        }

        if (error.status === 400) {
          throw new Error('Invalid request to LLM API');
        }

        // Wait before retrying (exponential backoff)
        if (attempt < MAX_RETRIES) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`LLM call failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
  }

  /**
   * Call LLM and parse JSON response
   */
  async callJSON<T = any>(request: LLMRequest): Promise<T> {
    const response = await this.call(request);

    try {
      // Try to extract JSON from markdown code blocks
      let jsonStr = response.content.trim();

      // Remove markdown code blocks if present
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      }

      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Failed to parse LLM JSON response:', response.content);
      throw new Error('LLM returned invalid JSON');
    }
  }

  /**
   * Stream LLM response (for long essays)
   */
  async *stream(request: LLMRequest): AsyncGenerator<string> {
    const { prompt, systemPrompt, temperature = OPENAI_TEMPERATURE, maxTokens = OPENAI_MAX_TOKENS } = request;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  }

  /**
   * Test connection to LLM API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.call({
        prompt: 'Hello',
        systemPrompt: 'You are a helpful assistant. Respond with just "OK".',
        maxTokens: 10,
        useCache: false,
      });

      return response.content.trim().toLowerCase().includes('ok');
    } catch (error) {
      console.error('LLM connection test failed:', error);
      return false;
    }
  }
}
