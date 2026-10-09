import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

// ─── Helper Components ──────────────────────────────────────────────────────

function Badge({ children, color = 'purple' }) {
  const colors = {
    purple: 'bg-primary/10 text-primary border-primary/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    green: 'bg-green-500/10 text-green-400 border-green-500/30',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    gray: 'bg-bg-secondary text-text-secondary border-bg-border',
  };
  return (
    <span className={`inline-block border rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

function Card({ title, icon, children }) {
  return (
    <div className="bg-bg-card border border-bg-border rounded-xl p-6">
      <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function LangBar({ languageStats }) {
  if (!languageStats || Object.keys(languageStats).length === 0) return null;

  const total = Object.values(languageStats).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const COLORS = ['bg-primary', 'bg-blue-500', 'bg-green-500', 'bg-orange-400', 'bg-pink-500', 'bg-yellow-400'];
  const entries = Object.entries(languageStats)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  return (
    <div>
      <div className="flex rounded-full h-2 overflow-hidden mb-3">
        {entries.map(([lang, bytes], i) => (
          <div
            key={lang}
            className={COLORS[i % COLORS.length]}
            style={{ width: `${((bytes / total) * 100).toFixed(1)}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {entries.map(([lang, bytes], i) => (
          <div key={lang} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className={`inline-block w-2 h-2 rounded-full ${COLORS[i % COLORS.length]}`}></span>
            <span className="capitalize">{lang}</span>
            <span className="text-text-muted">({((bytes / total) * 100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const TABS = ['Overview', 'Tech Stack', 'Structure', 'Modules', 'How It Works', 'Suggestions'];

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');

  const result = location.state?.result;

  if (!result) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center text-text-secondary">
          <p className="mb-4">No analysis data found.</p>
          <Link to="/" className="text-primary hover:underline">← Go back home</Link>
        </div>
      </div>
    );
  }

  const {
    projectName, repoName, githubUrl,
    summary, technologies, structure,
    modules, workflow, suggestions, languageStats
  } = result;

  const techCategories = [
    { label: 'Frontend', key: 'frontend', color: 'blue' },
    { label: 'Backend', key: 'backend', color: 'green' },
    { label: 'Database', key: 'database', color: 'orange' },
    { label: 'Languages', key: 'languages', color: 'purple' },
    { label: 'Tools', key: 'tools', color: 'gray' },
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-bg-border px-6 py-4 flex items-center justify-between sticky top-0 bg-bg z-10">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-text-primary">RepoLens</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            {repoName}
          </a>
          <Link to="/history" className="text-sm text-text-secondary hover:text-text-primary transition-colors">History</Link>
          <button
            onClick={() => navigate('/')}
            className="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New Analysis
          </button>
        </div>
      </nav>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-1">{projectName || repoName}</h1>
          <p className="text-text-secondary text-sm">{repoName}</p>

          {/* Language bar */}
          {languageStats && Object.keys(languageStats).length > 0 && (
            <div className="mt-4 bg-bg-card border border-bg-border rounded-xl p-4">
              <LangBar languageStats={languageStats} />
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-bg-border mb-8 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'Overview' && (
          <Card title="Project Overview" icon="📋">
            <p className="text-text-secondary leading-relaxed">{summary || 'No summary available.'}</p>
          </Card>
        )}

        {activeTab === 'Tech Stack' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {techCategories.map(({ label, key, color }) => {
              const items = technologies?.[key] || [];
              if (items.length === 0) return null;
              return (
                <Card key={key} title={label} icon={
                  { frontend: '🖥️', backend: '⚙️', database: '🗄️', languages: '💻', tools: '🔧' }[key]
                }>
                  <div className="flex flex-wrap gap-2">
                    {items.map((tech) => (
                      <Badge key={tech} color={color}>{tech}</Badge>
                    ))}
                  </div>
                </Card>
              );
            })}
            {Object.values(technologies || {}).every(a => !a || a.length === 0) && (
              <p className="text-text-muted col-span-2">No technology information available.</p>
            )}
          </div>
        )}

        {activeTab === 'Structure' && (
          <Card title="Project Structure" icon="🗂️">
            <pre className="text-xs text-green-400 bg-bg-secondary rounded-lg p-4 overflow-x-auto leading-relaxed font-mono whitespace-pre">
              {structure || 'No structure available.'}
            </pre>
          </Card>
        )}

        {activeTab === 'Modules' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules && modules.length > 0 ? modules.map((mod, i) => (
              <div key={i} className="bg-bg-card border border-bg-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">
                    {(mod.name || '?')[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-text-primary font-mono">{mod.name}</span>
                </div>
                <p className="text-sm text-text-secondary">{mod.description}</p>
              </div>
            )) : (
              <p className="text-text-muted">No module information available.</p>
            )}
          </div>
        )}

        {activeTab === 'How It Works' && (
          <Card title="How It Works" icon="⚡">
            <pre className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap font-sans">
              {workflow || 'No workflow information available.'}
            </pre>
          </Card>
        )}

        {activeTab === 'Suggestions' && (
          <Card title="Improvement Suggestions" icon="💡">
            {suggestions && suggestions.length > 0 ? (
              <ol className="space-y-3">
                {suggestions.map((s, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-text-secondary text-sm">{s}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-text-muted">No suggestions available.</p>
            )}
          </Card>
        )}
      </div>

      <footer className="border-t border-bg-border px-6 py-4 text-center text-xs text-text-muted">
        RepoLens · Local AI GitHub Project Analyzer
      </footer>
    </div>
  );
}
