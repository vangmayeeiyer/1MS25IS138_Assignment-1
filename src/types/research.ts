/**
 * ScholarPulse – Academic Research Assistant Data Types
 */

export type FeatureTab =
  | 'paper-search'
  | 'topic-hub'
  | 'research-questions'
  | 'keywords'
  | 'summarizer'
  | 'gap-analyzer'
  | 'outline-generator';

export interface PublicationRecord {
  id: string;
  source: string;
  pmid?: string;
  pmcid?: string;
  doi?: string;
  title: string;
  authorString: string;
  journalTitle: string;
  pubYear: string;
  abstractText?: string;
  isOpenAccess: boolean;
  hasFullText: boolean;
  citedByCount?: number;
  europePmcUrl: string;
  doiUrl?: string;
  pmcUrl?: string;
  pdfUrl?: string;
  fullTextSourceType: 'full-text' | 'abstract-only' | 'metadata-only';
}

export interface PaperSearchResponse {
  hitCount: number;
  papers: PublicationRecord[];
  query: string;
  page: number;
  pageSize: number;
}

export interface VerifiedSourceReference {
  paperId: string;
  title: string;
  authors: string;
  journal?: string;
  year?: string;
  doi?: string;
  pmid?: string;
  pmcid?: string;
  sourceUrl: string;
  sourceType: 'full-text' | 'abstract-only';
}

export interface TopicHubResult {
  overview: string;
  foundationalThemes: Array<{
    theme: string;
    description: string;
    keyQuestionsAddressed: string[];
  }>;
  coreTheoriesAndFrameworks: Array<{
    name: string;
    description: string;
    relevance: string;
  }>;
  majorSubfields: Array<{
    subfield: string;
    focus: string;
    status: string;
  }>;
  commonMethodologies: Array<{
    approach: string;
    standardToolsOrDesigns: string;
    typicalDataTypes: string;
  }>;
  currentDebatesAndTrends: string[];
}

export interface ResearchQuestionItem {
  category: string;
  question: string;
  targetVariables: string;
  feasibility: string;
  rationale: string;
  suggestedMethodology: string;
}

export interface ResearchQuestionsResult {
  topicSummary: string;
  questions: ResearchQuestionItem[];
  methodologyAdvice: string[];
}

export interface BooleanStringItem {
  database: string;
  query: string;
  syntaxNotes: string;
}

export interface KeywordGeneratorResult {
  primaryKeywords: string[];
  thesaurusSynonyms: Array<{
    term: string;
    synonyms: string[];
    meshOrDescriptorTerm?: string;
  }>;
  conceptualCategories: Array<{
    category: string;
    keywords: string[];
  }>;
  booleanStrings: BooleanStringItem[];
  searchStrategyAdvice: string[];
}

export interface PaperSummarizerResult {
  executiveSummary: string;
  researchObjectives: string[];
  methodology: {
    studyDesign: string;
    sampleOrDataset: string;
    dataCollection: string;
    analyticalMethods: string;
  };
  keyFindings: string[];
  contributions: string[];
  limitations: string[];
  practicalImplications: string[];
  evidenceGroundedNotice: string;
  sourceReference?: VerifiedSourceReference;
}

export interface ResearchGapItem {
  type: string;
  title: string;
  description: string;
  opportunity: string;
  validationSteps: string[];
  riskAssessment: string;
}

export interface GapAnalyzerResult {
  warningDisclaimer: string;
  criticalObservations: string[];
  gaps: ResearchGapItem[];
  recommendedNextSteps: string[];
  sourceReference?: VerifiedSourceReference;
}

export interface ManuscriptSection {
  sectionNumber: string;
  title: string;
  estimatedWords: string;
  purpose: string;
  guidingQuestions: string[];
  contentChecklist: string[];
  writingTips: string;
}

export interface ManuscriptOutlineResult {
  titleSuggestion: string;
  targetWordCount: string;
  paperTypeConfirmed: string;
  abstractTemplate: string;
  sections: ManuscriptSection[];
  journalSubmissionChecklist: string[];
}

export interface ResearchProjectContext {
  activeTopic: string;
  fieldOfStudy: string;
  academicLevel: string;
}
