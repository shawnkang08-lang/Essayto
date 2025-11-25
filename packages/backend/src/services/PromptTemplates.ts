import { SupportedLanguage } from './LanguageDetectionService.js';

export interface CorrectionPromptParams {
  essay: string;
  language: SupportedLanguage;
}

export interface TranslationPromptParams {
  text: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
}

export interface TopicPromptParams {
  mode: 'academic' | 'professional' | 'creative' | 'exam';
  difficulty: 1 | 2 | 3 | 4 | 5;
  language: SupportedLanguage;
  weaknesses?: string[];
}

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  id: 'Indonesian',
  zh: 'Chinese',
  en: 'English',
};

export class PromptTemplates {
  /**
   * Generate correction prompt for essay analysis
   */
  static correction(params: CorrectionPromptParams): { system: string; user: string } {
    const { essay, language } = params;
    const languageName = LANGUAGE_NAMES[language];

    const system = `You are an expert ${languageName} writing coach and editor. Your task is to analyze essays and provide detailed corrections for grammar, vocabulary, structure, and style.

You must be thorough, constructive, and educational in your feedback. Focus on helping the writer improve their skills.

IMPORTANT: You must respond ONLY with valid JSON. Do not include any text before or after the JSON object.`;

    const user = `Analyze the following ${languageName} essay and provide corrections:

Essay:
"""
${essay}
"""

Provide your analysis in the following JSON format:
{
  "corrections": [
    {
      "type": "grammar|vocabulary|structure|style",
      "original": "the incorrect text",
      "corrected": "the corrected text",
      "explanation": "why this is wrong and how to fix it",
      "position": {"start": 0, "end": 10},
      "severity": "error|warning|suggestion"
    }
  ],
  "polishedVersion": "the complete corrected essay with all improvements applied"
}

Rules:
1. Identify ALL errors, not just the most obvious ones
2. For each correction, provide the exact original text and corrected version
3. Explain WHY each correction is needed
4. Mark severity: "error" for grammar mistakes, "warning" for poor word choice, "suggestion" for style improvements
5. The polishedVersion should be the complete essay with all corrections applied
6. Position indicates character index in the original text
7. Be specific and educational in explanations`;

    return { system, user };
  }

  /**
   * Generate translation prompt
   */
  static translation(params: TranslationPromptParams): { system: string; user: string } {
    const { text, sourceLanguage, targetLanguage } = params;
    const sourceName = LANGUAGE_NAMES[sourceLanguage];
    const targetName = LANGUAGE_NAMES[targetLanguage];

    const system = `You are an expert translator specializing in ${sourceName} to ${targetName} translation. 

Your translations must:
- Preserve the original meaning and tone
- Use natural, fluent ${targetName}
- Maintain the same level of formality
- Keep cultural context appropriate

Respond ONLY with the translated text, nothing else.`;

    const user = `Translate the following ${sourceName} text to ${targetName}:

"""
${text}
"""

Provide only the translation, no explanations or additional text.`;

    return { system, user };
  }

  /**
   * Generate topic generation prompt
   */
  static topicGeneration(params: TopicPromptParams): { system: string; user: string } {
    const { mode, difficulty, language, weaknesses } = params;
    const languageName = LANGUAGE_NAMES[language];

    const difficultyDescriptions = {
      1: 'beginner (simple vocabulary, basic grammar)',
      2: 'elementary (common topics, straightforward structure)',
      3: 'intermediate (moderate complexity, varied vocabulary)',
      4: 'advanced (complex ideas, sophisticated language)',
      5: 'expert (highly nuanced, academic or professional level)',
    };

    const modeDescriptions = {
      academic: 'suitable for academic essays, research, or scholarly writing',
      professional: 'appropriate for business, workplace, or professional contexts',
      creative: 'encouraging creative expression, storytelling, or imaginative writing',
      exam: 'similar to standardized test prompts (IELTS, TOEFL, HSK)',
    };

    const system = `You are an expert ${languageName} writing instructor who creates engaging essay topics.

Your topics should:
- Be clear and specific
- Match the requested difficulty level
- Inspire thoughtful writing
- Be culturally appropriate

IMPORTANT: Respond ONLY with valid JSON. No additional text.`;

    let weaknessContext = '';
    if (weaknesses && weaknesses.length > 0) {
      weaknessContext = `\n\nThe writer needs practice with: ${weaknesses.join(', ')}. Create a topic that will help them improve in these areas.`;
    }

    const user = `Generate a ${mode} essay topic in ${languageName} at difficulty level ${difficulty}/5 (${difficultyDescriptions[difficulty]}).

The topic should be ${modeDescriptions[mode]}.${weaknessContext}

Respond in JSON format:
{
  "title": "A clear, engaging topic title",
  "description": "2-3 sentences providing context and guidance for the essay"
}

Make the topic interesting and thought-provoking!`;

    return { system, user };
  }

  /**
   * Generate structure analysis prompt
   */
  static structureAnalysis(params: CorrectionPromptParams): { system: string; user: string } {
    const { essay, language } = params;
    const languageName = LANGUAGE_NAMES[language];

    const system = `You are an expert ${languageName} writing coach specializing in essay structure and organization.

Analyze the essay's structure, coherence, and flow. Provide specific suggestions for improvement.

Respond ONLY with valid JSON.`;

    const user = `Analyze the structure of this ${languageName} essay:

"""
${essay}
"""

Provide analysis in JSON format:
{
  "structure": {
    "hasIntroduction": true|false,
    "hasConclusion": true|false,
    "paragraphCount": number,
    "coherenceScore": 0-100
  },
  "suggestions": [
    {
      "type": "structure",
      "issue": "description of the structural issue",
      "suggestion": "how to improve it"
    }
  ]
}`;

    return { system, user };
  }

  /**
   * Generate vocabulary enhancement prompt
   */
  static vocabularyEnhancement(params: CorrectionPromptParams): { system: string; user: string } {
    const { essay, language } = params;
    const languageName = LANGUAGE_NAMES[language];

    const system = `You are an expert ${languageName} vocabulary coach. Identify opportunities to enhance vocabulary with more sophisticated or precise word choices.

Focus on:
- Repetitive words that could be varied
- Basic words that could be elevated
- Imprecise words that could be more specific

Respond ONLY with valid JSON.`;

    const user = `Suggest vocabulary improvements for this ${languageName} essay:

"""
${essay}
"""

Provide suggestions in JSON format:
{
  "suggestions": [
    {
      "original": "the basic word or phrase",
      "alternatives": ["better option 1", "better option 2", "better option 3"],
      "context": "why these alternatives are better",
      "position": {"start": 0, "end": 10}
    }
  ]
}`;

    return { system, user };
  }
}
