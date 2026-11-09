import React, { useEffect, useState } from 'react';
import {
  X,
  BookOpen,
  ExternalLink,
  FileText,
  Download,
  Sparkles,
  Lightbulb,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { PublicationRecord, VerifiedSourceReference } from '../types/research';
import { scholarPulseApi } from '../services/api';
import { CopyButton } from './Shared/CopyButton';

interface ArticleReaderModalProps {
  paper: PublicationRecord;
  onClose: () => void;
  onSummarize: (text: string, title: string, sourceRef: VerifiedSourceReference) => void;
  onAnalyzeGaps: (text: string, topic: string, sourceRef: VerifiedSourceReference) => void;
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
  paper,
  onClose,
  onSummarize,
  onAnalyzeGaps,
}) => {
  const [fullText, setFullText] = useState<string | null>(null);
  const [loadingFullText, setLoadingFullText] = useState(false);
  const [fullTextError, setFullTextError] = useState<string | null>(null);

  useEffect(() => {
    // If the paper has a PMCID, attempt to load the full text from Europe PMC
    if (paper.pmcid) {
      setLoadingFullText(true);
      scholarPulseApi
        .fetchPaperFullText(paper.pmcid)
        .then((res) => {
          if (res.text && res.text.length > 100) {
            setFullText(res.text);
          } else {
            setFullText(null);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch full text XML:', err);
          setFullTextError('Full-text XML could not be retrieved from Europe PMC. Showing verified abstract.');
        })
        .finally(() => {
          setLoadingFullText(false);
        });
    }
  }, [paper.pmcid]);

  const activeText = fullText || paper.abstractText || 'No abstract or full-text body indexed for this publication record.';
  const isFullText = Boolean(fullText);

  const sourceReference: VerifiedSourceReference = {
    paperId: paper.id,
    title: paper.title,
    authors: paper.authorString,
    journal: paper.journalTitle,
    year: paper.pubYear,
    doi: paper.doi,
    pmid: paper.pmid,
    pmcid: paper.pmcid,
    sourceUrl: paper.europePmcUrl,
    sourceType: isFullText ? 'full-text' : 'abstract-only',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/70">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {isFullText ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Full-Text Article (Open Access PMC)
                </span>
              ) : paper.abstractText ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-100/80 border border-blue-300 px-2.5 py-0.5 rounded-full">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  Verified Abstract Only (Closed / Paywalled Article)
                </span>
              ) : (
                <span className="text-[11px] font-bold text-slate-600 bg-slate-200 px-2.5 py-0.5 rounded-full">
                  Metadata Only
                </span>
              )}

              {paper.isOpenAccess && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Open Access
                </span>
              )}

              {paper.pubYear && (
                <span className="text-xs font-semibold text-slate-500">{paper.pubYear}</span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {paper.title}
            </h2>

            <p className="text-xs text-slate-600 mt-1 line-clamp-1">
              <span className="font-semibold text-slate-700">Authors:</span> {paper.authorString}
            </p>

            <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
              <span className="italic text-slate-700 font-medium">{paper.journalTitle}</span>
              {paper.doi && (
                <>
                  <span>•</span>
                  <span>DOI: {paper.doi}</span>
                </>
              )}
              {paper.pmid && (
                <>
                  <span>•</span>
                  <span>PMID: {paper.pmid}</span>
                </>
              )}
              {paper.pmcid && (
                <>
                  <span>•</span>
                  <span>PMCID: {paper.pmcid}</span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            title="Close reader"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-5 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                onSummarize(activeText, paper.title, sourceReference);
                onClose();
              }}
              disabled={!activeText || activeText.length < 50}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Summarize Paper (AI)</span>
            </button>

            <button
              onClick={() => {
                onAnalyzeGaps(activeText, paper.title, sourceReference);
                onClose();
              }}
              disabled={!activeText || activeText.length < 50}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Analyze Gaps (AI)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton text={activeText} label="Copy Text" size="sm" />

            {paper.pdfUrl && (
              <a
                href={paper.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                title="Download Official PDF"
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
              title="Open publication record on Europe PMC"
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
                title="Open DOI resolver"
              >
                <span>DOI</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-serif text-slate-800 leading-relaxed text-sm sm:text-base">
          {loadingFullText && (
            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center gap-3 text-xs text-indigo-900 font-sans">
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
              <span>Retrieving full-text XML from Europe PMC repository...</span>
            </div>
          )}

          {fullTextError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-900 font-sans">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{fullTextError}</span>
            </div>
          )}

          <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 font-sans text-xs text-slate-600 mb-4 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800">
                {isFullText ? 'Full-Text Content' : 'Publication Abstract'}
              </span>
              <span className="ml-2 text-slate-500">
                ({activeText.split(/\s+/).filter(Boolean).length} words)
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Source: Europe PMC Open Academic Graph
            </div>
          </div>

          <div className="whitespace-pre-wrap font-sans text-slate-800 text-sm leading-relaxed space-y-3">
            {activeText}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-sans">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Actual peer-reviewed publication metadata from Europe PMC</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-xs"
          >
            Close Reader
          </button>
        </div>
      </div>
    </div>
  );
};
