import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Target,
  FlaskConical,
  Award,
  CheckCircle2,
  Copy,
  Lightbulb,
} from 'lucide-react';
import { PaperSummarizerResult, ResearchProjectContext, FeatureTab, VerifiedSourceReference } from '../types/research';
import { SAMPLE_RESEARCH_PAPERS } from '../constants/presets';
import { scholarPulseApi } from '../services/api';
import { CopyButton } from './Shared/CopyButton';
import { AlertBanner } from './Shared/AlertBanner';
import { LoadingState } from './Shared/LoadingState';
import { ExternalLink, BookOpen } from 'lucide-react';

interface PaperSummarizerViewProps {
  projectContext: ResearchProjectContext;
  initialText?: string;
  initialTitle?: string;
  initialSourceRef?: VerifiedSourceReference;
  onSendToGapAnalyzer: (text: string, title?: string, sourceRef?: VerifiedSourceReference) => void;
  onNavigateTab: (tab: FeatureTab) => void;
}

export const PaperSummarizerView: React.FC<PaperSummarizerViewProps> = ({
  projectContext,
  initialText = '',
  initialTitle = '',
  initialSourceRef,
  onSendToGapAnalyzer,
  onNavigateTab,
}) => {
  const [paperTitle, setPaperTitle] = useState(initialTitle);
  const [paperText, setPaperText] = useState(initialText);
  const [sourceRef, setSourceRef] = useState<VerifiedSourceReference | undefined>(initialSourceRef);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [result, setResult] = useState<PaperSummarizerResult | null>(null);

  const handleGenerate = async (textToUse?: string, titleToUse?: string, refToUse?: VerifiedSourceReference) => {
    const targetText = (textToUse !== undefined ? textToUse : paperText).trim();
    if (!targetText || targetText.length < 50) {
      setError('Please provide at least 50 characters of paper text (abstract, excerpt, or full text) to summarize.');
      return;
    }

    setLoading(true);
    setError(null);
    setErrorDetails(null);

    const activeRef = refToUse !== undefined ? refToUse : sourceRef;

    try {
      const data = await scholarPulseApi.summarizePaper({
        paperText: targetText,
        paperTitle: (titleToUse !== undefined ? titleToUse : paperTitle).trim() || undefined,
        sourceReference: activeRef,
      });
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to summarize research paper.');
      setErrorDetails(err?.details || null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = (sample: typeof SAMPLE_RESEARCH_PAPERS[0]) => {
    setPaperTitle(sample.title);
    setPaperText(sample.text);
    setSourceRef(undefined);
    handleGenerate(sample.text, sample.title, undefined);
  };

  const formatAsMarkdown = (): string => {
    if (!result) return '';
    const citationSection = result.sourceReference
      ? `\n> **Verified Publication Source:** ${result.sourceReference.authors} (${result.sourceReference.year || 'n.d.'}). *${result.sourceReference.title}*. ${result.sourceReference.journal || 'Academic Journal'}. [Europe PMC](${result.sourceReference.sourceUrl})${result.sourceReference.doi ? ` | [DOI: ${result.sourceReference.doi}](https://doi.org/${result.sourceReference.doi})` : ''}\n`
      : '';

    return `# Research Paper Summary: ${paperTitle || 'Supplied Research Excerpt'}
${citationSection}
## Executive Summary (TL;DR)
${result.executiveSummary}

## Research Objectives
${result.researchObjectives.map((o) => `- ${o}`).join('\n')}

## Methodology & Experimental Design
- **Study Design:** ${result.methodology.studyDesign}
- **Sample / Dataset:** ${result.methodology.sampleOrDataset}
- **Data Collection:** ${result.methodology.dataCollection}
- **Analytical Methods:** ${result.methodology.analyticalMethods}

## Key Empirical Findings
${result.keyFindings.map((f) => `- ${f}`).join('\n')}

## Authors' Claimed Contributions
${result.contributions.map((c) => `- ${c}`).join('\n')}

## Acknowledged Limitations & Constraints
${result.limitations.map((l) => `- ${l}`).join('\n')}

## Practical Implications
${result.practicalImplications.map((p) => `- ${p}`).join('\n')}

---
*${result.evidenceGroundedNotice}*
`;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2.5 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
          <FileText className="w-4 h-4" />
          <span>Module 04 • Evidence-Grounded Extraction</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Research Paper Summarizer
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Extract unambiguous, evidence-grounded objectives, methodology details, core findings, acknowledged
          caveats, and practical implications directly from paper excerpts.
        </p>
      </div>

      {/* Input Text Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Paper Title / Identifier (Optional)
          </label>
          <input
            type="text"
            value={paperTitle}
            onChange={(e) => setPaperTitle(e.target.value)}
            placeholder="e.g. Evaluating Neural Retrieval in Low-Resource Clinical QA"
            className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Paste Research Paper Text (Abstract, Section, or Excerpt)
            </label>
            <span className="text-xs text-slate-400 font-mono">
              {paperText.length} characters
            </span>
          </div>
          <textarea
            rows={7}
            value={paperText}
            onChange={(e) => setPaperText(e.target.value)}
            placeholder="Paste paper abstract, introduction, methodology, or discussion text here..."
            className="w-full p-4 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
          />
        </div>

        {/* Preset Samples & Actions */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 font-medium">Load Sample Paper:</span>
            {SAMPLE_RESEARCH_PAPERS.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => handleLoadSample(sample)}
                className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg transition-colors border border-slate-200/80 font-medium truncate max-w-[200px]"
                title={sample.title}
              >
                {sample.title}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleGenerate()}
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Synthesizing Text...' : 'Summarize Paper'}</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <AlertBanner
          type="error"
          title="Summarization Failed"
          message={error}
          details={errorDetails || undefined}
          onClose={() => setError(null)}
        />
      )}

      {/* Loading */}
      {loading && <LoadingState label="Deconstructing Paper Methodology & Empirical Claims" />}

      {/* Result Cards */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Integrity Badge */}
          <div className="bg-emerald-50/70 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{result.evidenceGroundedNotice}</span>
            </div>
            <CopyButton text={formatAsMarkdown()} label="Copy Summary (MD)" />
          </div>

          {/* Verified Source Citation Card if from Europe PMC */}
          {result.sourceReference && (
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 shadow-xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-100/90 border border-indigo-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    {result.sourceReference.sourceType === 'full-text'
                      ? 'Verified Full-Text Article (Open Access)'
                      : 'Verified Publication Abstract'}
                  </span>
                  {result.sourceReference.year && (
                    <span className="text-xs font-semibold text-slate-600">
                      Published {result.sourceReference.year}
                    </span>
                  )}
                </div>

                <a
                  href={result.sourceReference.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                >
                  <span>Europe PMC Record</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {result.sourceReference.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  <span className="font-semibold text-slate-700">Authors:</span>{' '}
                  {result.sourceReference.authors}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 font-mono flex-wrap pt-1">
                {result.sourceReference.journal && (
                  <span className="font-sans italic text-slate-700 font-medium">
                    {result.sourceReference.journal}
                  </span>
                )}
                {result.sourceReference.doi && (
                  <a
                    href={`https://doi.org/${result.sourceReference.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-indigo-700"
                  >
                    DOI: {result.sourceReference.doi}
                  </a>
                )}
                {result.sourceReference.pmid && (
                  <span>PMID: {result.sourceReference.pmid}</span>
                )}
                {result.sourceReference.pmcid && (
                  <span>PMCID: {result.sourceReference.pmcid}</span>
                )}
              </div>
            </div>
          )}

          {/* Executive Summary TL;DR */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Executive Takeaway (TL;DR)
            </span>
            <p className="text-sm font-medium leading-relaxed text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              {result.executiveSummary}
            </p>
          </div>

          {/* Objectives & Methodology Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Research Objectives */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Target className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Research Objectives & Problem
                </h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {result.researchObjectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                    <span className="leading-relaxed font-medium">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Methodology Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <FlaskConical className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Methodology & Data Profile
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="font-bold text-slate-800 block mb-0.5">Study Design:</span>
                  <span className="text-slate-600">{result.methodology.studyDesign}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="font-bold text-slate-800 block mb-0.5">Sample / Dataset:</span>
                  <span className="text-slate-600">{result.methodology.sampleOrDataset}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="font-bold text-slate-800 block mb-0.5">Data Collection:</span>
                  <span className="text-slate-600">{result.methodology.dataCollection}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="font-bold text-slate-800 block mb-0.5">Analytical Methods:</span>
                  <span className="text-slate-600">{result.methodology.analyticalMethods}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Findings & Contributions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Findings */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Key Empirical Findings
                </h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {result.keyFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2.5 bg-blue-50/40 rounded-lg border border-blue-100/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span className="leading-relaxed font-medium">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Claimed Contributions */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Award className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Claimed Contributions
                </h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {result.contributions.map((contrib, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2.5 bg-violet-50/40 rounded-lg border border-violet-100/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-600 mt-1.5 shrink-0" />
                    <span className="leading-relaxed font-medium">{contrib}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Limitations & Practical Implications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stated Limitations */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Acknowledged Limitations & Boundaries
                </h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {result.limitations.map((lim, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2.5 bg-amber-50/50 rounded-lg border border-amber-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                    <span className="leading-relaxed font-medium">{lim}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Practical Implications */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Lightbulb className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Practical & Translational Implications
                </h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {result.practicalImplications.map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2.5 bg-teal-50/40 rounded-lg border border-teal-100/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                    <span className="leading-relaxed font-medium">{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Synergy Banner: Transfer to Gap Analyzer */}
          <div className="bg-gradient-to-r from-amber-50 via-slate-50 to-orange-50 p-5 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                Want to identify research gaps in this paper?
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Pass this text directly into the Research Gap Analyzer to uncover unaddressed methodological or
                population blind spots.
              </p>
            </div>
            <button
              onClick={() => {
                onSendToGapAnalyzer(paperText, paperTitle, result.sourceReference || sourceRef);
                onNavigateTab('gap-analyzer');
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <span>Transfer to Gap Analyzer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
