import React from 'react';
import {
  BookMarked,
  Compass,
  HelpCircle,
  Search,
  FileText,
  Lightbulb,
  Layers,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  BookOpen,
  X,
} from 'lucide-react';
import { FeatureTab, ResearchProjectContext } from '../types/research';

interface SidebarProps {
  activeTab: FeatureTab;
  onSelectTab: (tab: FeatureTab) => void;
  projectContext: ResearchProjectContext;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  projectContext,
  mobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'paper-search' as FeatureTab,
      label: 'Paper Search',
      badge: 'Europe PMC',
      description: 'Search & read authentic papers',
      icon: BookMarked,
    },
    {
      id: 'topic-hub' as FeatureTab,
      label: 'Topic Hub',
      badge: 'Landscape',
      description: 'Thematic overview & theories',
      icon: Compass,
    },
    {
      id: 'research-questions' as FeatureTab,
      label: 'Research Questions',
      badge: 'FINER',
      description: 'Methodologically aligned inquiries',
      icon: HelpCircle,
    },
    {
      id: 'keywords' as FeatureTab,
      label: 'Keywords & Booleans',
      badge: 'PubMed/IEEE',
      description: 'Controlled search strings',
      icon: Search,
    },
    {
      id: 'summarizer' as FeatureTab,
      label: 'Paper Summarizer',
      badge: 'Grounded',
      description: 'Objectives, methods & findings',
      icon: FileText,
    },
    {
      id: 'gap-analyzer' as FeatureTab,
      label: 'Research Gap Analyzer',
      badge: 'Unverified',
      description: 'Novelty & blind spot detector',
      icon: Lightbulb,
    },
    {
      id: 'outline-generator' as FeatureTab,
      label: 'Manuscript Outline',
      badge: 'IMRaD',
      description: 'Journal section architecture',
      icon: Layers,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-white text-base">ScholarPulse</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Academic Research Suite</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
            title="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Project Banner */}
        <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="uppercase tracking-wider font-semibold text-slate-400">Current Focus</span>
            <span className="text-emerald-400 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Active
            </span>
          </div>
          <p
            className="text-xs font-medium text-slate-200 line-clamp-2 leading-snug"
            title={projectContext.activeTopic}
          >
            {projectContext.activeTopic || 'No topic specified yet'}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
            <span className="truncate">{projectContext.fieldOfStudy}</span>
          </div>
        </div>

        {/* Feature Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
            Research Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                  isActive
                    ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-5 h-5 mt-0.5 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold truncate leading-tight">{item.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-sm font-mono shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-0.5 truncate ${
                      isActive ? 'text-indigo-100' : 'text-slate-400'
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Integrity Notice */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-slate-400">
          <div className="flex items-start gap-2.5 text-[11px] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300 block mb-0.5">Academic Epistemic Guard</span>
              Strict anti-hallucination protocols active. Factual citations & DOIs are never fabricated.
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
