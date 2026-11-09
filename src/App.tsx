/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PaperSearchView } from './components/PaperSearchView';
import { TopicHubView } from './components/TopicHubView';
import { ResearchQuestionsView } from './components/ResearchQuestionsView';
import { KeywordGeneratorView } from './components/KeywordGeneratorView';
import { PaperSummarizerView } from './components/PaperSummarizerView';
import { GapAnalyzerView } from './components/GapAnalyzerView';
import { OutlineGeneratorView } from './components/OutlineGeneratorView';
import { FeatureTab, ResearchProjectContext, VerifiedSourceReference } from './types/research';
import { SAMPLE_TOPICS } from './constants/presets';
import { scholarPulseApi } from './services/api';

const DEFAULT_PROJECT_CONTEXT: ResearchProjectContext = {
  activeTopic: SAMPLE_TOPICS[0].topic,
  fieldOfStudy: SAMPLE_TOPICS[0].field,
  academicLevel: SAMPLE_TOPICS[0].level,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<FeatureTab>('paper-search');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Cross-module states for Paper Summarizer
  const [summarizerInitialText, setSummarizerInitialText] = useState<string>('');
  const [summarizerInitialTitle, setSummarizerInitialTitle] = useState<string>('');
  const [summarizerSourceRef, setSummarizerSourceRef] = useState<VerifiedSourceReference | undefined>(undefined);

  // Cross-module states for Research Gap Analyzer
  const [gapInitialText, setGapInitialText] = useState<string>('');
  const [gapInitialTopic, setGapInitialTopic] = useState<string>('');
  const [gapSourceRef, setGapSourceRef] = useState<VerifiedSourceReference | undefined>(undefined);

  const [projectContext, setProjectContext] = useState<ResearchProjectContext>(() => {
    try {
      const saved = localStorage.getItem('scholarpulse_project');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_PROJECT_CONTEXT;
  });

  useEffect(() => {
    try {
      localStorage.setItem('scholarpulse_project', JSON.stringify(projectContext));
    } catch {
      // ignore
    }
  }, [projectContext]);

  const updateProjectContext = (updates: Partial<ResearchProjectContext>) => {
    setProjectContext((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleUpdateTopic = (topic: string) => {
    updateProjectContext({ activeTopic: topic });
  };

  const handleSelectPaperForSummarizer = (
    text: string,
    title: string,
    sourceRef: VerifiedSourceReference
  ) => {
    setSummarizerInitialText(text);
    setSummarizerInitialTitle(title);
    setSummarizerSourceRef(sourceRef);
    setActiveTab('summarizer');
  };

  const handleSelectPaperForGapAnalyzer = (
    text: string,
    topic: string,
    sourceRef: VerifiedSourceReference
  ) => {
    setGapInitialText(text);
    setGapInitialTopic(topic);
    setGapSourceRef(sourceRef);
    setActiveTab('gap-analyzer');
  };

  const handleSendToGapAnalyzer = (
    text: string,
    title?: string,
    sourceRef?: VerifiedSourceReference
  ) => {
    setGapInitialText(text);
    if (title) setGapInitialTopic(title);
    if (sourceRef) setGapSourceRef(sourceRef);
    setActiveTab('gap-analyzer');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        projectContext={projectContext}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Academic Header */}
        <Header
          onToggleMobileMenu={() => setMobileSidebarOpen((prev) => !prev)}
          projectContext={projectContext}
          onUpdateProjectContext={updateProjectContext}
        />

        {/* Feature View Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'paper-search' && (
            <PaperSearchView
              projectContext={projectContext}
              onUpdateTopic={handleUpdateTopic}
              onNavigateTab={setActiveTab}
              onSelectPaperForSummarizer={handleSelectPaperForSummarizer}
              onSelectPaperForGapAnalyzer={handleSelectPaperForGapAnalyzer}
            />
          )}

          {activeTab === 'topic-hub' && (
            <TopicHubView
              projectContext={projectContext}
              onUpdateTopic={handleUpdateTopic}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'research-questions' && (
            <ResearchQuestionsView
              projectContext={projectContext}
              onUpdateTopic={handleUpdateTopic}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'keywords' && (
            <KeywordGeneratorView
              projectContext={projectContext}
              onUpdateTopic={handleUpdateTopic}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'summarizer' && (
            <PaperSummarizerView
              key={summarizerInitialText ? `sum-${summarizerInitialTitle.slice(0, 15)}` : 'default-sum'}
              projectContext={projectContext}
              initialText={summarizerInitialText}
              initialTitle={summarizerInitialTitle}
              initialSourceRef={summarizerSourceRef}
              onSendToGapAnalyzer={handleSendToGapAnalyzer}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'gap-analyzer' && (
            <GapAnalyzerView
              key={gapInitialText ? `gap-${gapInitialTopic.slice(0, 15)}` : 'default-gap'}
              projectContext={projectContext}
              initialText={gapInitialText}
              initialTopic={gapInitialTopic}
              initialSourceRef={gapSourceRef}
              onNavigateTab={setActiveTab}
              onTransferTopic={handleUpdateTopic}
            />
          )}

          {activeTab === 'outline-generator' && (
            <OutlineGeneratorView
              projectContext={projectContext}
              onUpdateTopic={handleUpdateTopic}
              onNavigateTab={setActiveTab}
            />
          )}
        </main>
      </div>
    </div>
  );
}
