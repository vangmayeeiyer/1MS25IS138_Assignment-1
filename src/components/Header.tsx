import React, { useState } from 'react';
import {
  Menu,
  Sparkles,
  BookOpen,
  Edit3,
  Check,
  RotateCcw,
  GraduationCap,
  ChevronDown,
} from 'lucide-react';
import { ResearchProjectContext } from '../types/research';
import { ACADEMIC_FIELDS, ACADEMIC_LEVELS, SAMPLE_TOPICS } from '../constants/presets';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  projectContext: ResearchProjectContext;
  onUpdateProjectContext: (ctx: Partial<ResearchProjectContext>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  projectContext,
  onUpdateProjectContext,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTopic, setTempTopic] = useState(projectContext.activeTopic);

  const handleSaveTopic = () => {
    if (tempTopic.trim()) {
      onUpdateProjectContext({ activeTopic: tempTopic.trim() });
    }
    setIsEditing(false);
  };

  const handleSelectSample = (sample: typeof SAMPLE_TOPICS[0]) => {
    onUpdateProjectContext({
      activeTopic: sample.topic,
      fieldOfStudy: sample.field,
      academicLevel: sample.level,
    });
    setTempTopic(sample.topic);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Topic Context */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            title="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2 max-w-xl">
                <input
                  type="text"
                  value={tempTopic}
                  onChange={(e) => setTempTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTopic()}
                  placeholder="Enter research topic..."
                  className="w-full text-sm font-medium px-3 py-1.5 border border-indigo-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-indigo-50/30"
                  autoFocus
                />
                <button
                  onClick={handleSaveTopic}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setTempTopic(projectContext.activeTopic);
                    setIsEditing(false);
                  }}
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Topic:</span>
                </div>
                <div
                  onClick={() => {
                    setTempTopic(projectContext.activeTopic);
                    setIsEditing(true);
                  }}
                  className="group flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-md transition-colors"
                  title="Click to edit topic"
                >
                  <span className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md md:max-w-xl">
                    {projectContext.activeTopic}
                  </span>
                  <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Topic Quick Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium mr-1">Presets:</span>
            {SAMPLE_TOPICS.slice(0, 2).map((sample, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSample(sample)}
                className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-lg transition-colors border border-slate-200/80 font-medium truncate max-w-[140px]"
                title={sample.topic}
              >
                {sample.topic.split(' ')[0]} {sample.topic.split(' ')[1]}...
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Level / Field Dropdown trigger or badge */}
          <div className="hidden md:flex items-center gap-2">
            <select
              value={projectContext.academicLevel}
              onChange={(e) => onUpdateProjectContext({ academicLevel: e.target.value })}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 outline-hidden"
              title="Academic Level"
            >
              {ACADEMIC_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
