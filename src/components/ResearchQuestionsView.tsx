import React, { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  Filter,
  CheckCircle2,
  Copy,
  ArrowRight,
  BookOpen,
  Target,
  Sliders,
  Layers,
} from 'lucide-react';
import { ResearchQuestionsResult, ResearchQuestionItem, ResearchProjectContext, FeatureTab } from '../types/research';
import { scholarPulseApi } from '../services/api';
import { CopyButton } from './Shared/CopyButton';
import { AlertBanner } from './Shared/AlertBanner';
import { LoadingState } from './Shared/LoadingState';

interface ResearchQuestionsViewProps {
  projectContext: ResearchProjectContext;
  onUpdateTopic: (topic: string) => void;
  onNavigateTab: (tab: FeatureTab) => void;
}

const METHODOLOGY_PREFERENCES = [
  'Balanced (Mixed, Quant, Qual, Computational)',
  'Quantitative / Experimental & Quasi-Experimental',
  'Qualitative / Phenomenological & Grounded Theory',
  'Mixed Methods (Exploratory/Explanatory Sequential)',
  'Computational / Modeling & Algorithmic Benchmarks',
  'Systematic Review & Meta-Analysis',
];

export const ResearchQuestionsView: React.FC<ResearchQuestionsViewProps> = ({
  projectContext,
  onUpdateTopic,
  onNavigateTab,
}) => {
  const [topicInput, setTopicInput] = useState(projectContext.activeTopic);
  const [focusArea, setFocusArea] = useState('');
  const [targetMethodology, setTargetMethodology] = useState(METHODOLOGY_PREFERENCES[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchQuestionsResult | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  const handleGenerate = async () => {
    const trimmed = topicInput.trim();
    if (!trimmed) {
      setError('Please provide a research topic or problem statement.');
      return;
    }

    onUpdateTopic(trimmed);
    setLoading(true);
    setError(null);
    setErrorDetails(null);

    try {
      const data = await scholarPulseApi.generateResearchQuestions({
        topic: trimmed,
        focusArea: focusArea.trim() || undefined,
        targetMethodology,
      });
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to formulate research questions.');
      setErrorDetails(err?.details || null);
    } finally {
      setLoading(false);
    }
  };

  const categories = result ? ['All', ...Array.from(new Set(result.questions.map((q) => q.category)))] : [];

  const filteredQuestions = result
    ? selectedCategoryFilter === 'All'
      ? result.questions
      : result.questions.filter((q) => q.category === selectedCategoryFilter)
    : [];

  const formatAllAsMarkdown = (): string => {
    if (!result) return '';
    return `# Research Questions: ${topicInput}
${focusArea ? `Focus Area: ${focusArea}\n` : ''}Target Methodology: ${targetMethodology}

## Overview
${result.topicSummary}

## Formulated Research Questions
${result.questions
  .map(
    (q, idx) => `### ${idx + 1}. [${q.category}]
**Question:** ${q.question}
- **Variables / Constructs:** ${q.targetVariables}
- **Feasibility:** ${q.feasibility}
- **Rationale:** ${q.rationale}
- **Suggested Methodology:** ${q.suggestedMethodology}`
  )
  .join('\n\n')}

## Methodology Advice
${result.methodologyAdvice.map((a) => `- ${a}`).join('\n')}
`;
  };

  const getFeasibilityBadge = (feasibility: string) => {
    const lower = feasibility.toLowerCase();
    if (lower.includes('high')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (lower.includes('mod')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2.5 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
          <HelpCircle className="w-4 h-4" />
          <span>Module 02 • Problem Formulation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Research Question Generator
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Develop testable, high-impact research questions adhering to the FINER framework (Feasible,
          Interesting, Novel, Ethical, Relevant) aligned with sound empirical methodologies.
        </p>
      </div>

      {/* Input Controls */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Core Research Topic
          </label>
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="e.g. Algorithmic fairness in credit risk assessment..."
            className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Specific Angle or Sub-Focus (Optional)
            </label>
            <input
              type="text"
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              placeholder="e.g. Disparate impact across marginalized demographic cohorts"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Target Methodological Paradigm
            </label>
            <select
              value={targetMethodology}
              onChange={(e) => setTargetMethodology(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 outline-hidden"
            >
              {METHODOLOGY_PREFERENCES.map((pref) => (
                <option key={pref} value={pref}>
                  {pref}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Formulating Questions...' : 'Generate Questions'}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <AlertBanner
          type="error"
          title="Question Generation Failed"
          message={error}
          details={errorDetails || undefined}
          onClose={() => setError(null)}
        />
      )}

      {/* Loading State */}
      {loading && <LoadingState label="Formulating FINER-Aligned Research Inquiries" />}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Header Card & Category Filter */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-indigo-600">
                  Formulated Inquiry Spectrum
                </span>
                <p className="text-xs text-slate-500 mt-0.5">{result.topicSummary}</p>
              </div>
              <div className="flex items-center gap-2">
                <CopyButton text={formatAllAsMarkdown()} label="Copy All Questions" />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                    selectedCategoryFilter === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Question Cards */}
          <div className="space-y-4">
            {filteredQuestions.map((q, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                      {q.category}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${getFeasibilityBadge(
                        q.feasibility
                      )}`}
                    >
                      Feasibility: {q.feasibility}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CopyButton
                      text={`Question: ${q.question}\nCategory: ${q.category}\nVariables: ${q.targetVariables}\nMethodology: ${q.suggestedMethodology}\nRationale: ${q.rationale}`}
                      label="Copy Question"
                    />
                  </div>
                </div>

                {/* Question Statement */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    &ldquo;{q.question}&rdquo;
                  </h3>
                </div>

                {/* Details Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50/80 p-4 rounded-xl border border-slate-200/70">
                  <div>
                    <span className="font-bold text-slate-700 block mb-0.5 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-indigo-600" />
                      Target Constructs / Variables:
                    </span>
                    <p className="text-slate-600 leading-relaxed">{q.targetVariables}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block mb-0.5 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-violet-600" />
                      Recommended Methodology:
                    </span>
                    <p className="text-slate-600 leading-relaxed">{q.suggestedMethodology}</p>
                  </div>
                  <div className="md:col-span-2 pt-2 border-t border-slate-200/60">
                    <span className="font-bold text-slate-700 block mb-0.5">Academic Rationale & Value:</span>
                    <p className="text-slate-600 leading-relaxed">{q.rationale}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Methodological Guidance Card */}
          <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              Methodological Implementation Guidance
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              {result.methodologyAdvice.map((advice, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{advice}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
