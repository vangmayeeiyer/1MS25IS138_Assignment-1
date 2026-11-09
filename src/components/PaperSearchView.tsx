import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  ExternalLink,
  Sparkles,
  Lightbulb,
  FileText,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Download,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookMarked,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  PublicationRecord,
  PaperSearchResponse,
  ResearchProjectContext,
  FeatureTab,
  VerifiedSourceReference,
} from '../types/research';
import { SAMPLE_TOPICS } from '../constants/presets';
import { scholarPulseApi } from '../services/api';
import { CopyButton } from './Shared/CopyButton';
import { AlertBanner } from './Shared/AlertBanner';
import { LoadingState } from './Shared/LoadingState';
import { ArticleReaderModal } from './ArticleReaderModal';

interface PaperSearchViewProps {
  projectContext: ResearchProjectContext;
  onUpdateTopic: (topic: string) => void;
  onNavigateTab: (tab: FeatureTab) => void;
  onSelectPaperForSummarizer: (text: string, title: string, sourceRef: VerifiedSourceReference) => void;
  onSelectPaperForGapAnalyzer: (text: string, topic: string, sourceRef: VerifiedSourceReference) => void;
}

export const PaperSearchView: React.FC<PaperSearchViewProps> = ({
  projectContext,
  onUpdateTopic,
  onNavigateTab,
  onSelectPaperForSummarizer,
  onSelectPaperForGapAnalyzer,
}) => {
  const [searchInput, setSearchInput] = useState(projectContext.activeTopic);
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'cited' | 'date'>('relevance');
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<PaperSearchResponse | null>(null);

  // Expanded abstracts tracking
  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});

  // Active paper for reader modal
  const [readingPaper, setReadingPaper] = useState<PublicationRecord | null>(null);

  // Auto-search on initial mount if topic exists
  useEffect(() => {
    if (projectContext.activeTopic && !searchResult) {
      handleSearch(projectContext.activeTopic, 1, openAccessOnly, sortBy);
    }
  }, []);

  const handleSearch = async (
    queryToUse?: string,
    page: number = 1,
    oaOnly: boolean = openAccessOnly,
    sort: string = sortBy
  ) => {
    const q = (queryToUse !== undefined ? queryToUse : searchInput).trim();
    if (!q) {
      setError('Please enter a research topic or keyword to search.');
      return;
    }

    setLoading(true);
    setError(null);
    setErrorDetails(null);
    setCurrentPage(page);

    try {
      const data = await scholarPulseApi.searchPapers({
        query: q,
        page,
        pageSize: 12,
        openAccessOnly: oaOnly,
        sort,
      });
      setSearchResult(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to search publications from Europe PMC.');
      setErrorDetails(err?.details || null);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (topic: string) => {
    setSearchInput(topic);
    onUpdateTopic(topic);
    handleSearch(topic, 1, openAccessOnly, sortBy);
  };

  const toggleAbstract = (id: string) => {
    setExpandedAbstracts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getSourceReference = (paper: PublicationRecord): VerifiedSourceReference => ({
    paperId: paper.id,
    title: paper.title,
    authors: paper.authorString,
    journal: paper.journalTitle,
    year: paper.pubYear,
    doi: paper.doi,
    pmid: paper.pmid,
    pmcid: paper.pmcid,
    sourceUrl: paper.europePmcUrl,
    sourceType: paper.pmcid ? 'full-text' : 'abstract-only',
  });

  const handleSummarizePaper = (paper: PublicationRecord) => {
    const textToUse = paper.abstractText || `Publication: ${paper.title}\nAuthors: ${paper.authorString}\nJournal: ${paper.journalTitle} (${paper.pubYear})`;
    const sourceRef = getSourceReference(paper);
    onSelectPaperForSummarizer(textToUse, paper.title, sourceRef);
    onNavigateTab('summarizer');
  };

  const handleAnalyzeGaps = (paper: PublicationRecord) => {
    const textToUse = paper.abstractText || `Publication: ${paper.title}\nAuthors: ${paper.authorString}\nJournal: ${paper.journalTitle} (${paper.pubYear})`;
    const sourceRef = getSourceReference(paper);
    onSelectPaperForGapAnalyzer(textToUse, paper.title, sourceRef);
    onNavigateTab('gap-analyzer');
  };

  const totalPages = searchResult ? Math.ceil(searchResult.hitCount / 12) : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2.5 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
          <BookMarked className="w-4 h-4" />
          <span>Real-World Literature Integration • Europe PMC REST API</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Research Paper Search
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Search over 40 million authentic peer-reviewed publications from Europe PMC. Retrieve genuine
          abstracts, open-access full-text articles, DOIs, and feed verified literature directly into AI summaries
          and gap analysis.
        </p>
      </div>

      {/* Search Input & Controls */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Search Academic Publications (Europe PMC)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchInput, 1)}
                placeholder="Search by topic, keyword, author, or research problem..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
            <button
              onClick={() => handleSearch(searchInput, 1)}
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-indigo-600/30 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Searching...' : 'Search Papers'}</span>
            </button>
          </div>
        </div>

        {/* Filters: Open Access & Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors">
              <input
                type="checkbox"
                checked={openAccessOnly}
                onChange={(e) => {
                  setOpenAccessOnly(e.target.checked);
                  handleSearch(searchInput, 1, e.target.checked, sortBy);
                }}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span>Open-Access Full Text Only</span>
            </label>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  const newSort = e.target.value as 'relevance' | 'cited' | 'date';
                  setSortBy(newSort);
                  handleSearch(searchInput, 1, openAccessOnly, newSort);
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 outline-hidden"
              >
                <option value="relevance">Most Relevant</option>
                <option value="cited">Highest Citations</option>
                <option value="date">Latest Publications</option>
              </select>
            </div>
          </div>

          {/* Quick sync with current topic */}
          {projectContext.activeTopic && searchInput !== projectContext.activeTopic && (
            <button
              onClick={() => {
                setSearchInput(projectContext.activeTopic);
                handleSearch(projectContext.activeTopic, 1, openAccessOnly, sortBy);
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sync with Active Topic</span>
            </button>
          )}
        </div>

        {/* Preset Sample Searches */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Try Preset Topic:</span>
          {SAMPLE_TOPICS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetClick(sample.topic)}
              className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg transition-colors border border-slate-200/80 font-medium"
            >
              {sample.topic.split(' ').slice(0, 4).join(' ')}...
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <AlertBanner
          type="error"
          title="Europe PMC Search Error"
          message={error}
          details={errorDetails || undefined}
          onClose={() => setError(null)}
        />
      )}

      {/* Loading State */}
      {loading && <LoadingState label="Querying Europe PMC Bibliographic Index" />}

      {/* Search Results */}
      {searchResult && !loading && (
        <div className="space-y-6">
          {/* Result Count Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-800">
                Found{' '}
                <strong className="text-indigo-600">{searchResult.hitCount.toLocaleString()}</strong>{' '}
                verified academic publications in Europe PMC for &ldquo;{searchResult.query}&rdquo;
              </span>
            </div>

            <span className="text-xs font-mono text-slate-500">
              Page {searchResult.page} of {Math.max(totalPages, 1)}
            </span>
          </div>

          {/* Honest Empty State if hitCount === 0 */}
          {searchResult.papers.length === 0 && (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No Academic Publications Found
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                We queried the Europe PMC index for &ldquo;{searchResult.query}&rdquo;, but no publication
                records were returned.
              </p>
              <div className="p-4 bg-slate-50 rounded-xl max-w-md mx-auto text-xs text-slate-700 text-left space-y-1.5 border border-slate-200/80">
                <span className="font-bold text-slate-900 block mb-1">Search Recommendations:</span>
                <div>• Remove quotation marks or complex Boolean operators.</div>
                <div>• Try broader keywords (e.g. &ldquo;telemedicine&rdquo; instead of specific long phrases).</div>
                <div>• Uncheck &ldquo;Open-Access Full Text Only&rdquo; if enabled.</div>
              </div>
            </div>
          )}

          {/* Publication Cards List */}
          <div className="space-y-4">
            {searchResult.papers.map((paper) => {
              const isExpanded = expandedAbstracts[paper.id];
              const abstractText = paper.abstractText;
              const hasFullText = paper.hasFullText;

              return (
                <div
                  key={paper.id}
                  className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs space-y-4"
                >
                  {/* Top Badges & Identifiers */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {paper.pmcid ? (
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Open Access Full-Text (PMC)
                        </span>
                      ) : paper.isOpenAccess ? (
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          Open Access
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                          Abstract Only
                        </span>
                      )}

                      {typeof paper.citedByCount === 'number' && paper.citedByCount > 0 && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                          Cited by {paper.citedByCount}
                        </span>
                      )}

                      {paper.pubYear && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {paper.pubYear}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono flex-wrap">
                      {paper.doi && (
                        <a
                          href={paper.doiUrl || `https://doi.org/${paper.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-indigo-600 hover:underline"
                          title="Open DOI resolver"
                        >
                          DOI: {paper.doi}
                        </a>
                      )}
                      {paper.pmid && (
                        <span>PMID: {paper.pmid}</span>
                      )}
                      {paper.pmcid && (
                        <span>PMCID: {paper.pmcid}</span>
                      )}
                    </div>
                  </div>

                  {/* Title & Bibliographic Citation */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      <a
                        href={paper.europePmcUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-indigo-600 transition-colors"
                        title="View publication on Europe PMC"
                      >
                        {paper.title}
                      </a>
                    </h3>

                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      <span className="font-semibold text-slate-800">Authors:</span> {paper.authorString}
                    </p>

                    <div className="mt-1 text-xs text-slate-500 font-medium flex items-center gap-2">
                      <span className="italic text-slate-700">{paper.journalTitle}</span>
                      {paper.pubYear && <span>({paper.pubYear})</span>}
                    </div>
                  </div>

                  {/* Abstract Display */}
                  {abstractText ? (
                    <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 text-xs text-slate-700 leading-relaxed font-sans">
                      <span className="font-bold text-slate-900 block mb-1">
                        Verified Publication Abstract:
                      </span>
                      <p>
                        {isExpanded ? abstractText : `${abstractText.slice(0, 320)}...`}
                      </p>
                      {abstractText.length > 320 && (
                        <button
                          onClick={() => toggleAbstract(paper.id)}
                          className="mt-2 text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExpanded ? 'Collapse Abstract' : 'Read Full Abstract'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 italic border border-slate-200/50">
                      Abstract text not indexed by publisher. Full metadata and publisher links available below.
                    </div>
                  )}

                  {/* Action Toolbar */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Primary AI & Reading Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setReadingPaper(paper)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        title="Read complete paper text in reader"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Read Article</span>
                      </button>

                      <button
                        onClick={() => handleSummarizePaper(paper)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        title="Transfer paper text and citation into Paper Summarizer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Summarize Paper (AI)</span>
                      </button>

                      <button
                        onClick={() => handleAnalyzeGaps(paper)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        title="Transfer paper text and citation into Research Gap Analyzer"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Analyze Gaps (AI)</span>
                      </button>
                    </div>

                    {/* Links to Original Sources */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {paper.pdfUrl && (
                        <a
                          href={paper.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs flex items-center gap-1 transition-colors"
                          title="Open official PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>PDF</span>
                        </a>
                      )}

                      <a
                        href={paper.europePmcUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1 transition-colors"
                        title="Open on Europe PMC"
                      >
                        <span>Europe PMC</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {paper.doiUrl && (
                        <a
                          href={paper.doiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1 transition-colors"
                          title="Open official DOI"
                        >
                          <span>DOI</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <button
                onClick={() => handleSearch(searchInput, currentPage - 1, openAccessOnly, sortBy)}
                disabled={currentPage <= 1 || loading}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Previous Page
              </button>

              <span className="text-xs font-medium text-slate-600">
                Page <strong className="text-slate-900">{currentPage}</strong> of {totalPages}
              </span>

              <button
                onClick={() => handleSearch(searchInput, currentPage + 1, openAccessOnly, sortBy)}
                disabled={currentPage >= totalPages || loading}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Next Page
              </button>
            </div>
          )}
        </div>
      )}

      {/* In-App Article Reader Modal */}
      {readingPaper && (
        <ArticleReaderModal
          paper={readingPaper}
          onClose={() => setReadingPaper(null)}
          onSummarize={(text, title, sourceRef) => {
            onSelectPaperForSummarizer(text, title, sourceRef);
            onNavigateTab('summarizer');
          }}
          onAnalyzeGaps={(text, topic, sourceRef) => {
            onSelectPaperForGapAnalyzer(text, topic, sourceRef);
            onNavigateTab('gap-analyzer');
          }}
        />
      )}
    </div>
  );
};
