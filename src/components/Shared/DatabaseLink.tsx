import React from 'react';
import { ExternalLink } from 'lucide-react';

interface DatabaseLinkProps {
  database: string;
  query: string;
}

export const DatabaseLink: React.FC<DatabaseLinkProps> = ({ database, query }) => {
  const getSearchUrl = (db: string, q: string): string | null => {
    const encoded = encodeURIComponent(q.trim());
    const lower = db.toLowerCase();

    if (lower.includes('google scholar')) {
      return `https://scholar.google.com/scholar?q=${encoded}`;
    }
    if (lower.includes('pubmed') || lower.includes('medline')) {
      return `https://pubmed.ncbi.nlm.nih.gov/?term=${encoded}`;
    }
    if (lower.includes('ieee')) {
      return `https://ieeexplore.ieee.org/search/searchresult.jsp?queryText=${encoded}`;
    }
    if (lower.includes('scopus')) {
      return `https://www.scopus.com/search/form.uri?display=basic#basic`;
    }
    if (lower.includes('web of science')) {
      return `https://www.webofscience.com/wos/woscc/basic-search`;
    }
    return `https://scholar.google.com/scholar?q=${encoded}`;
  };

  const url = getSearchUrl(database, query);
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200/60 rounded-lg transition-colors"
      title={`Open search query directly in ${database}`}
    >
      <span>Search on {database.split(' ')[0]}</span>
      <ExternalLink className="w-3.5 h-3.5" />
    </a>
  );
};
