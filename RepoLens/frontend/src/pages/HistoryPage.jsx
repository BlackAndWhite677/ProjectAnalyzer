import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAnalysisHistory } from '../api/analyze.api';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function LangDots({ languageStats }) {
  if (!languageStats) return null;
  const COLORS = ['bg-primary', 'bg-blue-500', 'bg-green-500', 'bg-orange-400', 'bg-pink-500'];
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {Object.keys(languageStats).slice(0, 4).map((lang, i) => (
        <span key={lang} className="flex items-center gap-1 text-xs text-text-muted">
          <span className={`w-2 h-2 rounded-full ${COLORS[i % COLORS.length]}`}></span>
          <span className="capitalize">{lang}</span>
        </span>
      ))}
    </div>
  );
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await getAnalysisHistory();
        setAnalyses(res.data.analyses || []);
      } catch (err) {
        setError(err.message || 'Failed to load history.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-bg-border px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <span className="text-xl font-bold text-text-primary">RepoLens</span>
        </Link>
        <Link
          to="/"
          className="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Analyze New Repo
        </Link>
      </nav>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Analysis History</h1>
          <p className="text-text-secondary text-sm mt-1">Previously analyzed repositories</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && analyses.length === 0 && (
          <div className="text-center py-20 text-text-muted">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium mb-1">No analyses yet</p>
            <p className="text-sm">Analyze a GitHub repository to see it here.</p>
            <Link to="/" className="mt-4 inline-block text-primary hover:underline text-sm">
              Start analyzing →
            </Link>
          </div>
        )}

        {!loading && analyses.length > 0 && (
          <div className="grid gap-4">
            {analyses.map((item) => (
              <div
                key={item._id}
                className="bg-bg-card border border-bg-border rounded-xl p-5 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => navigate('/analysis', { state: { result: item } })}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
                      </svg>
                      <span className="font-semibold text-text-primary truncate">{item.projectName || item.repoName}</span>
                    </div>
                    <p className="text-xs text-text-muted mb-2">{item.repoName}</p>
                    {item.summary && (
                      <p className="text-sm text-text-secondary line-clamp-2">{item.summary}</p>
                    )}
                    <LangDots languageStats={item.languageStats} />
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-xs text-text-muted">{timeAgo(item.createdAt)}</span>
                    <span className="text-xs text-primary hover:underline">View →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="border-t border-bg-border px-6 py-4 text-center text-xs text-text-muted">
        RepoLens · Local AI GitHub Project Analyzer
      </footer>
    </div>
  );
}
