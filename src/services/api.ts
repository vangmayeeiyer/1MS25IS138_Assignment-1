/**
 * Client API services for ScholarPulse
 */

import {
  TopicHubResult,
  ResearchQuestionsResult,
  KeywordGeneratorResult,
  PaperSummarizerResult,
  GapAnalyzerResult,
  ManuscriptOutlineResult,
  PaperSearchResponse,
  VerifiedSourceReference,
} from '../types/research';

export class ScholarPulseError extends Error {
  code?: string;
  details?: string;

  constructor(message: string, code?: string, details?: string) {
    super(message);
    this.name = 'ScholarPulseError';
    this.code = code;
    this.details = details;
  }
}

async function requestJson<T>(url: string, body?: Record<string, any>, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    const isPost = body !== undefined;
    response = await fetch(url, {
      method: isPost ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: isPost ? JSON.stringify(body) : undefined,
      ...options,
    });
  } catch (netErr: any) {
    throw new ScholarPulseError(
      'Network connection failed. Please ensure the local server is running.',
      'NETWORK_ERROR',
      netErr?.message
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new ScholarPulseError(
      `Received non-JSON response from server (Status: ${response.status}).`,
      'PARSE_ERROR'
    );
  }

  if (!response.ok) {
    throw new ScholarPulseError(
      data.error || `Server request failed with status ${response.status}`,
      data.code || 'SERVER_ERROR',
      data.details
    );
  }

  return data as T;
}

export const scholarPulseApi = {
  checkHealth: async (): Promise<{ status: string; hasKey: boolean }> => {
    try {
      const res = await fetch('/api/health');
      return await res.json();
    } catch {
      return { status: 'offline', hasKey: false };
    }
  },

  searchPapers: async (params: {
    query: string;
    page?: number;
    pageSize?: number;
    openAccessOnly?: boolean;
    sort?: string;
  }): Promise<PaperSearchResponse> => {
    const searchParams = new URLSearchParams();
    searchParams.set('query', params.query);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params.openAccessOnly) searchParams.set('openAccessOnly', 'true');
    if (params.sort) searchParams.set('sort', params.sort);

    return requestJson<PaperSearchResponse>(`/api/scholarpulse/papers/search?${searchParams.toString()}`);
  },

  fetchPaperFullText: async (pmcid: string): Promise<{ pmcid: string; text: string; wordCount: number }> => {
    return requestJson<{ pmcid: string; text: string; wordCount: number }>(
      `/api/scholarpulse/papers/fulltext?pmcid=${encodeURIComponent(pmcid)}`
    );
  },

  generateTopicHub: async (params: {
    topic: string;
    academicLevel?: string;
    fieldOfStudy?: string;
  }): Promise<TopicHubResult> => {
    return requestJson<TopicHubResult>('/api/scholarpulse/topic-hub', params);
  },

  generateResearchQuestions: async (params: {
    topic: string;
    focusArea?: string;
    targetMethodology?: string;
  }): Promise<ResearchQuestionsResult> => {
    return requestJson<ResearchQuestionsResult>('/api/scholarpulse/research-questions', params);
  },

  generateKeywords: async (params: {
    topic: string;
    inclusionCriteria?: string;
    exclusionCriteria?: string;
  }): Promise<KeywordGeneratorResult> => {
    return requestJson<KeywordGeneratorResult>('/api/scholarpulse/keywords', params);
  },

  summarizePaper: async (params: {
    paperText: string;
    paperTitle?: string;
    sourceReference?: VerifiedSourceReference;
  }): Promise<PaperSummarizerResult> => {
    return requestJson<PaperSummarizerResult>('/api/scholarpulse/summarizer', params);
  },

  analyzeGaps: async (params: {
    researchText: string;
    contextTopic?: string;
    sourceReference?: VerifiedSourceReference;
  }): Promise<GapAnalyzerResult> => {
    return requestJson<GapAnalyzerResult>('/api/scholarpulse/gap-analyzer', params);
  },

  generateOutline: async (params: {
    topic: string;
    paperType?: string;
    targetAudience?: string;
    keyInputs?: string;
  }): Promise<ManuscriptOutlineResult> => {
    return requestJson<ManuscriptOutlineResult>('/api/scholarpulse/outline-generator', params);
  },
};
