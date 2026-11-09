import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  BookOpen,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  HelpCircle,
  Share2,
  Database,
  CheckCircle,
} from 'lucide-react';
import { TopicHubResult, ResearchProjectContext, FeatureTab } from '../types/research';
import { ACADEMIC_FIELDS, ACADEMIC_LEVELS, SAMPLE_TOPICS } from '../constants/presets';
import { scholarPulseApi } from '../services/api';
import { CopyButton } from './Shared/CopyButton';
import { AlertBanner } from './Shared/AlertBanner';
import { LoadingState } from './Shared/LoadingState';

interface TopicHubViewProps {
  projectContext: ResearchProjectContext;
  onUpdateTopic: (topic: string) => void;
  onNavigateTab: (tab: FeatureTab) => void;
}

export const TopicHubView: React.FC<TopicHubViewProps> = ({
  projectContext,
  onUpdateTopic,
  onNavigateTab,
}) => {
  const [topicInput, setTopicInput] = useState(projectContext.activeTopic);
  const [academicLevel, setAcademicLevel] = useState(projectContext.academicLevel);
  const [fieldOfStudy, setFieldOfStudy] = useState(projectContext.fieldOfStudy);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [result, setResult] = useState<TopicHubResult | null>(null);

  const handleGenerate = async (topicToUse?: string) => {
    const targetTopic = (topicToUse || topicInput).trim();
    if (!targetTopic) {
      setError('Please provide a research topic to analyze.');
      return;
    }

    onUpdateTopic(targetTopic);
    setLoading(true);
    setError(null);
    setErrorDetails(null);

    try {
      const data = await scholarPulseApi.generateTopicHub({
        topic: targetTopic,
        academicLevel,
        fieldOfStudy,
      });
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate topic hub overview.');
      setErrorDetails(err?.details || null);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (sample: typeof SAMPLE_TOPICS[0]) => {
    setTopicInput(sample.topic);
    setFieldOfStudy(sample.field);
    setAcademicLevel(sample.level);
    handleGenerate(sample.topic);
  };

  const formatAsMarkdown = (): string => {
    if (!result) return '';
    return `# Topic Hub: ${topicInput}
Academic Level: ${academicLevel}
Field of Study: ${fieldOfStudy}

## Domain Overview
${result.overview}

## Foundational Research Themes
${result.foundationalThemes
  .map(
    (t) => `### ${t.theme}
${t.description}
*Key Questions:*
${t.keyQuestionsAddressed.map((q) => `- ${q}`).join('\n')}`
  )
  .join('\n\n')}

## Core Theories & Frameworks
${result.coreTheoriesAndFrameworks
  .map((c) => `- **${c.name}**: ${c.description} (Relevance: ${c.relevance})`)
  .join('\n')}

## Major Subfields
${result.majorSubfields.map((s) => `- **${s.subfield}** [${s.status}]: ${s.focus}`).join('\n')}

## Common Methodologies & Data Types
${result.commonMethodologies
  .map(
    (m) => `### ${m.approach}
- Tools & Designs: ${m.standardToolsOrDesigns}
- Typical Data: ${m.typicalDataTypes}`
  )
  .join('\n\n')}

## Current Debates & Frontier Trends
${result.currentDebatesAndTrends.map((d) => `- ${d}`).join('\n')}
`;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Module Title Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2.5 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
          <Compass className="w-4 h-4" />
          <span>Module 01 • Conceptual Mapping</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Topic Hub & Theoretical Overview
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Synthesize an epistemically grounded overview of your research domain: core theoretical frameworks,
          subfield maturity, standardized methodology archetypes, and frontier debates.
        </p>
      </div>

      {/* Input Controls Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Research Topic or Domain Inquiry
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="e.g. Explainable AI in Clinical Decision Support for Oncology..."
              className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
            />
            <button
              onClick={() => handleGenerate()}
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-indigo-600/30 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Synthesizing...' : 'Generate Topic Hub'}</span>
            </button>
          </div>
        </div>

        {/* Filters & Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Level</label>
            <select
              value={academicLevel}
              onChange={(e) => setAcademicLevel(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 outline-hidden"
            >
              {ACADEMIC_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Field of Study</label>
            <select
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 outline-hidden"
            >
              {ACADEMIC_FIELDS.map((fld) => (
                <option key={fld} value={fld}>
                  {fld}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sample Preset Chips */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Try Sample Topic:</span>
          {SAMPLE_TOPICS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetClick(sample)}
              className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg transition-colors border border-slate-200/60 font-medium"
            >
              {sample.topic.split(' ').slice(0, 4).join(' ')}...
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <AlertBanner
          type="error"
          title="Analysis Request Failed"
          message={error}
          details={errorDetails || undefined}
          onClose={() => setError(null)}
        />
      )}

      {/* Loading State */}
      {loading && <LoadingState label="Mapping Theoretical Domain & Methodology Archetypes" />}

      {/* Results View */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Top Actions & Overview Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-indigo-600">
                  Epistemic Landscape
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">{topicInput}</h2>
              </div>
              <div className="flex items-center gap-2">
                <CopyButton text={formatAsMarkdown()} label="Copy Full Hub (Markdown)" size="sm" />
              </div>
            </div>

            <div className="prose prose-slate max-w-none">
              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                Domain Synthesis
              </h3>
              <p className="text-sm leading-relaxed text-slate-700 bg-slate-50/70 p-4 rounded-xl border border-slate-200/70">
                {result.overview}
              </p>
            </div>
          </div>

          {/* Foundational Themes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Foundational Research Themes</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.foundationalThemes.map((theme, idx) => (
                <div
                  key={idx}
                  className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[11px] font-mono font-bold text-indigo-600 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100">
                      Theme 0{idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-2">{theme.theme}</h4>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{theme.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Key Inquiries Addressed
                    </span>
                    <ul className="space-y-1">
                      {theme.keyQuestionsAddressed.map((q, qIdx) => (
                        <li key={qIdx} className="text-xs text-slate-700 flex items-start gap-1.5">
                          <span className="text-indigo-500 font-bold">•</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Theories & Methodologies Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Core Theories */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Layers className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Core Theories & Frameworks
                </h3>
              </div>
              <div className="space-y-3">
                {result.coreTheoriesAndFrameworks.map((theory, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs">
                    <div className="font-bold text-slate-900 text-sm">{theory.name}</div>
                    <p className="text-slate-600 mt-1 leading-relaxed">{theory.description}</p>
                    <div className="mt-2 text-[11px] font-medium text-indigo-700 bg-indigo-50/60 px-2.5 py-1 rounded-md border border-indigo-100/60">
                      <span className="font-semibold text-indigo-900">Application:</span> {theory.relevance}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Common Methodologies */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Standard Methodologies & Data
                </h3>
              </div>
              <div className="space-y-3">
                {result.commonMethodologies.map((method, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                    <div className="font-bold text-slate-900 text-sm">{method.approach}</div>
                    <div className="text-slate-600">
                      <span className="font-semibold text-slate-700">Tools / Designs:</span>{' '}
                      {method.standardToolsOrDesigns}
                    </div>
                    <div className="text-slate-600">
                      <span className="font-semibold text-slate-700">Typical Data:</span> {method.typicalDataTypes}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Subfields & Frontier Debates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Major Subfields */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Database className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Subfields & Maturity Status
                </h3>
              </div>
              <div className="space-y-2.5">
                {result.majorSubfields.map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50/60 transition-colors flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-800">{sub.subfield}</div>
                      <p className="text-xs text-slate-600 mt-0.5">{sub.focus}</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                      {sub.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Frontier Debates */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Current Debates & Trends
                </h3>
              </div>
              <ul className="space-y-2.5">
                {result.currentDebatesAndTrends.map((debate, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-amber-50/40 border border-amber-200/50 text-xs text-slate-800 flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span className="leading-relaxed font-medium">{debate}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Cross-Module Action Links */}
          <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-purple-50 p-5 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Next Research Steps</h4>
              <p className="text-xs text-slate-600">
                Seamlessly transfer &ldquo;{topicInput}&rdquo; to craft research questions, retrieve Boolean search
                terms, or build a manuscript outline.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onNavigateTab('research-questions')}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Draft Questions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigateTab('keywords')}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Generate Booleans</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigateTab('outline-generator')}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Build Outline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
