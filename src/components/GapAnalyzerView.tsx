import React, { useState } from 'react';
import {
  Lightbulb,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Search,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { GapAnalyzerResult, ResearchProjectContext, FeatureTab, VerifiedSourceReference } from '../types/research';
import { SAMPLE_GAP_TEXTS } from '../constants/presets';
import { scholarPulseApi } from '../services/api';
import { CopyButton } from './Shared/CopyButton';
import { AlertBanner } from './Shared/AlertBanner';
import { LoadingState } from './Shared/LoadingState';
import { ExternalLink, BookOpen, ShieldCheck } from 'lucide-react';

interface GapAnalyzerViewProps {
  projectContext: ResearchProjectContext;
  initialText?: string;
  initialTopic?: string;
  initialSourceRef?: VerifiedSourceReference;
  onNavigateTab: (tab: FeatureTab) => void;
  onTransferTopic: (topic: string) => void;
}

export const GapAnalyzerView: React.FC<GapAnalyzerViewProps> = ({
  projectContext,
  initialText = '',
  initialTopic = '',
  initialSourceRef,
  onNavigateTab,
  onTransferTopic,
}) => {
  const [researchText, setResearchText] = useState(initialText);
  const [contextTopic, setContextTopic] = useState(initialTopic || projectContext.activeTopic);
  const [sourceRef, setSourceRef] = useState<VerifiedSourceReference | undefined>(initialSourceRef);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [result, setResult] = useState<GapAnalyzerResult | null>(null);

  const handleAnalyze = async (textToUse?: string, topicToUse?: string, refToUse?: VerifiedSourceReference) => {
    const targetText = (textToUse !== undefined ? textToUse : researchText).trim();
    if (!targetText || targetText.length < 50) {
      setError('Please provide at least 50 characters of research text (literature review, discussion, abstract).');
      return;
    }

    setLoading(true);
    setError(null);
    setErrorDetails(null);

    const activeRef = refToUse !== undefined ? refToUse : sourceRef;

    try {
      const data = await scholarPulseApi.analyzeGaps({
        researchText: targetText,
        contextTopic: (topicToUse !== undefined ? topicToUse : contextTopic).trim() || undefined,
        sourceReference: activeRef,
      });
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to analyze research gaps.');
      setErrorDetails(err?.details || null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPreset = (sample: typeof SAMPLE_GAP_TEXTS[0]) => {
    setContextTopic(sample.topic);
    setResearchText(sample.text);
    setSourceRef(undefined);
    handleAnalyze(sample.text, sample.topic, undefined);
  };

  const formatAsMarkdown = (): string => {
    if (!result) return '';
    const citationSection = result.sourceReference
      ? `\n> **Audited Publication Source:** ${result.sourceReference.authors} (${result.sourceReference.year || 'n.d.'}). *${result.sourceReference.title}*. ${result.sourceReference.journal || 'Academic Journal'}. [Europe PMC](${result.sourceReference.sourceUrl})${result.sourceReference.doi ? ` | [DOI: ${result.sourceReference.doi}](https://doi.org/${result.sourceReference.doi})` : ''}\n`
      : '';

    return `# Research Gap Analysis
Context Topic: ${contextTopic || 'General Literature'}
${citationSection}
> [!WARNING]
> ${result.warningDisclaimer}

## Critical Observations of Current Literature
${result.criticalObservations.map((o) => `- ${o}`).join('\n')}

## Hypothesized Research Gaps
${result.gaps
  .map(
    (g, idx) => `### ${idx + 1}. [${g.type}] ${g.title}
*Status: UNVERIFIED SUGGESTION*
- **Description:** ${g.description}
- **Scholarly Opportunity:** ${g.opportunity}
- **Feasibility & Risk:** ${g.riskAssessment}
- **Literature Validation Steps:**
${g.validationSteps.map((s) => `  * ${s}`).join('\n')}`
  )
  .join('\n\n')}

## Recommended Next Steps for Investigation
${result.recommendedNextSteps.map((s) => `- ${s}`).join('\n')}
`;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2.5 text-amber-600 font-semibold text-xs tracking-wider uppercase mb-1">
          <Lightbulb className="w-4 h-4" />
          <span>Module 05 • Scholarly Novelty Detection</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Research Gap Analyzer
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Identify plausible methodological blind spots, population absences, and conceptual omissions in
          literature. All suggested gaps are analytical hypotheses and must be systematically verified.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Context Topic or Thesis Area (Optional)
          </label>
          <input
            type="text"
            value={contextTopic}
            onChange={(e) => setContextTopic(e.target.value)}
            placeholder="e.g. Telemedicine adoption in rural chronic care"
            className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Supplied Literature Excerpt / State-of-the-Art Review
            </label>
            <span className="text-xs text-slate-400 font-mono">{researchText.length} characters</span>
          </div>
          <textarea
            rows={7}
            value={researchText}
            onChange={(e) => setResearchText(e.target.value)}
            placeholder="Paste literature review summary, state-of-the-art discussion, or multiple paper abstracts to surface blind spots..."
            className="w-full p-4 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
          />
        </div>

        {/* Preset Samples & Actions */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 font-medium">Try Preset Literature:</span>
            {SAMPLE_GAP_TEXTS.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => handleLoadPreset(sample)}
                className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 rounded-lg transition-colors border border-slate-200/80 font-medium"
              >
                {sample.topic}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleAnalyze()}
            disabled={loading}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-amber-600/30 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Auditing Literature Blind Spots...' : 'Analyze Research Gaps'}</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <AlertBanner
          type="error"
          title="Gap Analysis Failed"
          message={error}
          details={errorDetails || undefined}
          onClose={() => setError(null)}
        />
      )}

      {/* Loading */}
      {loading && <LoadingState label="Detecting Methodological & Conceptual Horizons" />}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Verified Source Citation Card if from Europe PMC */}
          {result.sourceReference && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    {result.sourceReference.sourceType === 'full-text'
                      ? 'Gaps Analyzed on Full-Text Article (Open Access PMC)'
                      : 'Gaps Analyzed on Publication Abstract'}
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
                  className="text-xs font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1"
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

          {/* Prominent Disclaimer Notice */}
          <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-800">
                  Epistemic Integrity Notice
                </h4>
                <p className="text-xs font-bold text-amber-900 mt-0.5">{result.warningDisclaimer}</p>
                <p className="text-[11px] text-amber-800/90 mt-1">
                  AI suggestions reflect structural absences in the provided text. Perform comprehensive
                  literature searches before declaring a gap in your dissertation or manuscript.
                </p>
              </div>
            </div>
            <CopyButton text={formatAsMarkdown()} label="Copy Gap Report (MD)" />
          </div>

          {/* Critical Observations */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Critical Observations of Supplied Literature
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-700">
              {result.criticalObservations.map((obs, idx) => (
                <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                  <span className="leading-relaxed font-medium">{obs}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Gap Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                Identified Research Gaps (Unverified Suggestions)
              </h3>
              <span className="text-xs font-mono text-slate-500">{result.gaps.length} Gaps Hypothesized</span>
            </div>

            {result.gaps.map((gap, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-amber-300 transition-all shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                      {gap.type}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-sm border border-amber-200">
                      Unverified Suggestion
                    </span>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {gap.riskAssessment}
                    </span>
                  </div>

                  <CopyButton
                    text={`[${gap.type}] ${gap.title}\n\nDescription: ${gap.description}\nOpportunity: ${gap.opportunity}\nValidation Steps:\n${gap.validationSteps.join('\n')}`}
                    label="Copy Gap"
                  />
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900 leading-snug">{gap.title}</h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{gap.description}</p>
                </div>

                <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
                  <span className="font-bold text-indigo-950 block mb-0.5">Scholarly Opportunity:</span>
                  <p className="text-indigo-900/90 leading-relaxed">{gap.opportunity}</p>
                </div>

                {/* Validation Steps in Literature */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-slate-500" />
                    How to Validate in Literature (Confirm Non-Duplication):
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {gap.validationSteps.map((step, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-400 font-mono text-[11px]">{sIdx + 1}.</span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Next Steps for Proposal */}
          <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <CheckCircle className="w-4 h-4" />
              Translating Gaps into a Thesis or Proposal
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              {result.recommendedNextSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
