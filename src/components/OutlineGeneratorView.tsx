import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  FileText,
  Download,
  Copy,
  Printer,
  CheckCircle2,
  ListChecks,
  Compass,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { ManuscriptOutlineResult, ResearchProjectContext, FeatureTab } from '../types/research';
import { MANUSCRIPT_TYPES, TARGET_AUDIENCES } from '../constants/presets';
import { scholarPulseApi } from '../services/api';
import { CopyButton } from './Shared/CopyButton';
import { AlertBanner } from './Shared/AlertBanner';
import { LoadingState } from './Shared/LoadingState';

interface OutlineGeneratorViewProps {
  projectContext: ResearchProjectContext;
  onUpdateTopic: (topic: string) => void;
  onNavigateTab: (tab: FeatureTab) => void;
}

export const OutlineGeneratorView: React.FC<OutlineGeneratorViewProps> = ({
  projectContext,
  onUpdateTopic,
  onNavigateTab,
}) => {
  const [topicInput, setTopicInput] = useState(projectContext.activeTopic);
  const [paperType, setPaperType] = useState(MANUSCRIPT_TYPES[0]);
  const [targetAudience, setTargetAudience] = useState(TARGET_AUDIENCES[0]);
  const [keyInputs, setKeyInputs] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [result, setResult] = useState<ManuscriptOutlineResult | null>(null);

  const handleGenerate = async () => {
    const trimmed = topicInput.trim();
    if (!trimmed) {
      setError('Please provide a research topic or tentative manuscript focus.');
      return;
    }

    onUpdateTopic(trimmed);
    setLoading(true);
    setError(null);
    setErrorDetails(null);

    try {
      const data = await scholarPulseApi.generateOutline({
        topic: trimmed,
        paperType,
        targetAudience,
        keyInputs: keyInputs.trim() || undefined,
      });
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to construct manuscript outline.');
      setErrorDetails(err?.details || null);
    } finally {
      setLoading(false);
    }
  };

  const formatAsMarkdown = (): string => {
    if (!result) return '';
    return `# Manuscript Outline: ${result.titleSuggestion}
Format: ${result.paperTypeConfirmed}
Target Venue: ${targetAudience}
Target Word Count: ${result.targetWordCount}

## Structural Abstract Template
${result.abstractTemplate}

## Section Roadmap
${result.sections
  .map(
    (s) => `### ${s.sectionNumber} ${s.title} (${s.estimatedWords})
**Purpose:** ${s.purpose}

**Guiding Questions:**
${s.guidingQuestions.map((q) => `- ${q}`).join('\n')}

**Content Checklist:**
${s.contentChecklist.map((c) => `- [ ] ${c}`).join('\n')}

*Editorial Writing Tip:* ${s.writingTips}`
  )
  .join('\n\n')}

## Journal Submission Readiness Checklist
${result.journalSubmissionChecklist.map((item) => `- [ ] ${item}`).join('\n')}
`;
  };

  const handleDownloadMarkdown = () => {
    const content = formatAsMarkdown();
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (result?.titleSuggestion || 'manuscript_outline')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .slice(0, 40);
    link.download = `${safeName}_outline.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2.5 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
          <Layers className="w-4 h-4" />
          <span>Module 06 • Publication Architecture</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Manuscript Outline Generator
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Construct an end-to-end manuscript architecture with IMRaD section milestones, guiding research
          questions, word count budgets, and submission checklists.
        </p>
      </div>

      {/* Input Controls */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Manuscript Topic or Working Title
          </label>
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="e.g. Transformer interpretability in clinical oncology NLP..."
            className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Manuscript Format / Type</label>
            <select
              value={paperType}
              onChange={(e) => setPaperType(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 outline-hidden"
            >
              {MANUSCRIPT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Target Publication Venue / Audience
            </label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 outline-hidden"
            >
              {TARGET_AUDIENCES.map((aud) => (
                <option key={aud} value={aud}>
                  {aud}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Key Inputs, Findings, or Preliminary Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={keyInputs}
            onChange={(e) => setKeyInputs(e.target.value)}
            placeholder="e.g. Conducted 5-fold cross-validation on MIMIC-IV dataset with BioLink-BERT; achieved 41% reduction in irrelevant grounding..."
            className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Structuring Sections...' : 'Generate Outline'}</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <AlertBanner
          type="error"
          title="Outline Generation Failed"
          message={error}
          details={errorDetails || undefined}
          onClose={() => setError(null)}
        />
      )}

      {/* Loading */}
      {loading && <LoadingState label="Synthesizing IMRaD Blueprint & Section Word Budgets" />}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Header Bar with Action Buttons */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-indigo-600">
                  Recommended Working Title
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                  &ldquo;{result.titleSuggestion}&rdquo;
                </h2>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                  <span className="font-semibold text-slate-800">
                    Target Budget: <span className="text-indigo-600">{result.targetWordCount}</span>
                  </span>
                  <span>•</span>
                  <span>{result.paperTypeConfirmed}</span>
                  <span>•</span>
                  <span>{targetAudience}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleDownloadMarkdown}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer"
                  title="Download .md file"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download .md</span>
                </button>
                <CopyButton text={formatAsMarkdown()} label="Copy Outline" />
              </div>
            </div>

            {/* Abstract Template */}
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
                Structural Abstract Formula
              </span>
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-wrap">
                {result.abstractTemplate}
              </div>
            </div>
          </div>

          {/* Section-by-Section Roadmap */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-indigo-600" />
                Section Roadmap & Milestones
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {result.sections.length} Structural Sections
              </span>
            </div>

            {result.sections.map((section, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                      {section.sectionNumber}
                    </span>
                    <h4 className="text-base font-bold text-slate-900">{section.title}</h4>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                    Budget: {section.estimatedWords}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  <strong className="text-slate-900">Purpose:</strong> {section.purpose}
                </p>

                {/* Guiding Questions & Checklist */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Guiding Questions */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-xs space-y-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                      Guiding Questions to Answer:
                    </span>
                    <ul className="space-y-1.5 text-slate-600">
                      {section.guidingQuestions.map((q, qIdx) => (
                        <li key={qIdx} className="flex items-start gap-1.5">
                          <span className="text-indigo-600 font-bold">•</span>
                          <span className="leading-relaxed">{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Content Checklist */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-xs space-y-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                      Required Content Checkpoints:
                    </span>
                    <ul className="space-y-1.5 text-slate-600">
                      {section.contentChecklist.map((c, cIdx) => (
                        <li key={cIdx} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span className="leading-relaxed">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Editorial Writing Tip */}
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Editorial Writing Tip:</strong> {section.writingTips}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Submission Readiness Checklist */}
          <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              Journal Submission Readiness Protocol
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
              {result.journalSubmissionChecklist.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 p-2 bg-slate-800/60 rounded-lg">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
