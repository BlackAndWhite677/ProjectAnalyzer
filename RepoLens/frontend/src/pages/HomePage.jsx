import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { analyzeRepo } from '../api/analyze.api';

const EXAMPLES = [
  'https://github.com/expressjs/express',
  'https://github.com/facebook/react',
  'https://github.com/axios/axios',
];

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a GitHub repository URL.');
      return;
    }

    setLoading(true);
    try {
      const res = await analyzeRepo(url.trim());
      const data = res.data;
      navigate('/analysis', { state: { result: data } });
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-bg-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <span className="text-xl font-bold text-text-primary">RepoLens</span>
        </div>
        <Link
          to="/history"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History
        </Link>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-2xl w-full text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-sm text-primary mb-8">
            <span className="w-2 h-2 rounded-full bg-primary inline-block animate-pulse"></span>
            AI-Powered GitHub Project Analyzer
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold text-text-primary mb-4 leading-tight">
            Understand any
            <span className="text-primary"> GitHub repo</span>
            <br />in seconds
          </h1>
          <p className="text-lg text-text-secondary mb-12">
            Enter a public GitHub repository URL and get an instant AI-powered breakdown — tech stack, structure, modules, and improvement suggestions.
          </p>

          {/* Input Form */}
          <form onSubmit={handleAnalyze} className="w-full">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="github-url-input"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                disabled={loading}
                className="flex-1 bg-bg-card border border-bg-border rounded-lg px-4 py-3.5 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                id="analyze-btn"
                disabled={loading}
                className="bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-3.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Analyze Repository
                  </>
                )}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-left">
                {error}
              </div>
            )}

            {/* Loading tip */}
            {loading && (
              <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg text-primary/80 text-sm">
                ⏳ Downloading and analyzing repository... this may take 15–30 seconds.
              </div>
            )}
          </form>

          {/* Example repos */}
          <div className="mt-8">
            <p className="text-sm text-text-muted mb-3">Try an example:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setUrl(ex)}
                  disabled={loading}
                  className="text-xs bg-bg-card border border-bg-border text-text-secondary hover:text-primary hover:border-primary/50 rounded-full px-3 py-1.5 transition-colors disabled:opacity-40"
                >
                  {ex.replace('https://github.com/', '')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mt-20">
          {[
            { icon: '🔍', title: 'Tech Stack Detection', desc: 'Automatically identifies frameworks, languages, and tools used.' },
            { icon: '🗂️', title: 'Project Structure', desc: 'Visual directory tree with module explanations.' },
            { icon: '💡', title: 'AI Suggestions', desc: 'Practical improvement recommendations tailored to the repo.' },
          ].map((f) => (
            <div key={f.title} className="bg-bg-card border border-bg-border rounded-lg p-5">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">{f.title}</h3>
              <p className="text-xs text-text-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-bg-border px-6 py-4 text-center text-xs text-text-muted">
        RepoLens · Local AI GitHub Project Analyzer · College Full-Stack Project
      </footer>
    </div>
  );
}
