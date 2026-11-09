import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles, BookOpen, Search, ShieldCheck } from 'lucide-react';

interface LoadingStateProps {
  label?: string;
  sublabel?: string;
}

const ACADEMIC_PHRASES = [
  'Querying domain ontology and conceptual relationships...',
  'Synthesizing theoretical frameworks and paradigms...',
  'Verifying methodological alignment and scholarly rigor...',
  'Enforcing epistemic constraints (zero fabricated citations)...',
  'Structuring peer-review grade academic output...',
];

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Processing Academic Analysis',
  sublabel,
}) => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % ACADEMIC_PHRASES.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="py-16 px-6 flex flex-col items-center justify-center text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-inner">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      <h3 className="text-base font-semibold text-slate-800 mb-1">{label}</h3>
      <p className="text-xs font-medium text-indigo-700 min-h-5 transition-all duration-300">
        {sublabel || ACADEMIC_PHRASES[phraseIndex]}
      </p>

      <div className="mt-6 flex items-center gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Grounded in scholarship
        </span>
        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
        <span className="flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> No fabricated citations
        </span>
      </div>
    </div>
  );
};
