import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  BookMarked,
  Tags,
  SlidersHorizontal,
  ExternalLink,
  Copy,
  Info,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { KeywordGeneratorResult, ResearchProjectContext, FeatureTab } from '../types/research';
import { scholarPulseApi } from '../services/api';
import { CopyButton } from './Shared/CopyButton';
import { AlertBanner } from './Shared/AlertBanner';
import { LoadingState } from './Shared/LoadingState';
import { DatabaseLink } from './Shared/DatabaseLink';

interface KeywordGeneratorViewProps {
  projectContext: ResearchProjectContext;
  onUpdateTopic: (topic: string) => void;
  onNavigateTab: (tab: FeatureTab) => void;
}

export const KeywordGeneratorView: React.FC<KeywordGeneratorViewProps> = ({
  projectContext,
  onUpdateTopic,
  onNavigateTab,
}) => {
  const [topicInput, setTopicInput] = useState(projectContext.activeTopic);
  const [inclusionCriteria, setInclusionCriteria] = useState('');
  const [exclusionCriteria, setExclusionCriteria] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [result, setResult] = useState<KeywordGeneratorResult | null>(null);

  const handleGenerate = async () => {
    const trimmed = topicInput.trim();
    if (!trimmed) {
      setError('Please provide a research topic to generate keywords for.');
      return;
    }

    onUpdateTopic(trimmed);
    setLoading(true);
    setError(null);
    setErrorDetails(null);

    try {
      const data = await scholarPulseApi.generateKeywords({
        topic: trimmed,
        inclusionCriteria: inclusionCriteria.trim() || undefined,
        exclusionCriteria: exclusionCriteria.trim() || undefined,
      });
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate keywords & search queries.');
      setErrorDetails(err?.details || null);
    } finally {
      setLoading(false);
    }
  };

  const formatAllAsMarkdown = (): string => {
    if (!result) return '';
    return `# Systematic Search Strings & Keyword Matrix: ${topicInput}

## Primary Keywords
${result.primaryKeywords.map((k) => `- ${k}`).join('\n')}

## Controlled Vocabulary & Thesaurus Synonyms
${result.thesaurusSynonyms
  .map(
    (t) => `### ${t.term} ${t.meshOrDescriptorTerm ? `[MeSH/Controlled: ${t.meshOrDescriptorTerm}]` : ''}
Synonyms: ${t.synonyms.join(', ')}`
  )
  .join('\n\n')}

## Database-Specific Boolean Queries
${result.booleanStrings
  .map(
    (b) => `### ${b.database}
\`\`\`
${b.query}
\`\`\`
*Syntax Notes:* ${b.syntaxNotes}`
  )
  .join('\n\n')}

## Search Strategy Advice
${result.searchStrategyAdvice.map((a) => `- ${a}`).join('\n')}
`;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2.5 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
          <Search className="w-4 h-4" />
          <span>Module 03 • Systematic Search Strategy</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Keyword Generator & Boolean Search Builder
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Construct reproducible, high-precision search strings tailored to PubMed, IEEE Xplore, Google Scholar,
          and Scopus with MeSH/controlled vocabularies and wildcards.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Research Topic or Research Question
          </label>
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="e.g. Microplastics bioaccumulation in freshwater aquatic invertebrates..."
            className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Inclusion Criteria (Optional)
            </label>
            <input
              type="text"
              value={inclusionCriteria}
              onChange={(e) => setInclusionCriteria(e.target.value)}
              placeholder="e.g. Peer-reviewed empirical studies, post-2018, freshwater ecosystems"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Exclusion Criteria (Optional)
            </label>
            <input
              type="text"
              value={exclusionCriteria}
              onChange={(e) => setExclusionCriteria(e.target.value)}
              placeholder="e.g. Marine ocean environments, grey literature, non-English"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-hidden"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Building Boolean Ontologies...' : 'Generate Keywords & Booleans'}</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <AlertBanner
          type="error"
          title="Search String Generation Failed"
          message={error}
          details={errorDetails || undefined}
          onClose={() => setError(null)}
        />
      )}

      {/* Loading */}
      {loading && <LoadingState label="Synthesizing Controlled Vocabularies & Syntax Strings" />}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Top Primary Keywords Chips */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <Tags className="w-3.5 h-3.5" />
                  Primary Subject Keywords
                </span>
                <p className="text-xs text-slate-500 mt-0.5">Click any chip to copy individual keyword</p>
              </div>
              <CopyButton text={formatAllAsMarkdown()} label="Copy All Booleans (Markdown)" />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {result.primaryKeywords.map((kw, idx) => (
                <button
                  key={idx}
                  onClick={() => navigator.clipboard.writeText(kw)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/80 transition-colors flex items-center gap-1.5 group cursor-pointer"
                  title="Click to copy"
                >
                  <span>{kw}</span>
                  <Copy className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 opacity-60" />
                </button>
              ))}
            </div>
          </div>

          {/* Database-Tailored Boolean Strings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Database-Specific Boolean Queries</h3>
            </div>

            <div className="space-y-4">
              {result.booleanStrings.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{item.database}</span>
                      <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm">
                        Optimized Syntax
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <DatabaseLink database={item.database} query={item.query} />
                      <CopyButton text={item.query} label="Copy Query" />
                    </div>
                  </div>

                  {/* Preformatted Query Box */}
                  <div className="relative">
                    <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
                      {item.query}
                    </pre>
                  </div>

                  <div className="text-xs text-slate-600 flex items-start gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-700">Syntax Notes:</strong> {item.syntaxNotes}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Thesaurus & Conceptual Categories Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Thesaurus / MeSH */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <SlidersHorizontal className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Thesaurus & Controlled Descriptors
                </h3>
              </div>
              <div className="space-y-3">
                {result.thesaurusSynonyms.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-sm">{item.term}</span>
                      {item.meshOrDescriptorTerm && (
                        <span className="text-[10px] font-mono bg-violet-100 text-violet-800 px-2 py-0.5 rounded-sm">
                          {item.meshOrDescriptorTerm}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {item.synonyms.map((s, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded text-[11px]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conceptual Categories */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Tags className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Conceptual Categories (PICO / Construct)
                </h3>
              </div>
              <div className="space-y-3">
                {result.conceptualCategories.map((cat, idx) => (
                  <div key={idx} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs">
                    <span className="font-bold text-indigo-900 text-xs uppercase tracking-wider block mb-1">
                      {cat.category}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cat.keywords.map((kw, kwIdx) => (
                        <span
                          key={kwIdx}
                          className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded text-[11px] font-medium"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Search Strategy Advice */}
          <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              Librarian Search Strategy Tips
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              {result.searchStrategyAdvice.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
