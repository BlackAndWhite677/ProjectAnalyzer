import React, { useEffect, useState } from 'react';
import { createJobFit, getJobFits } from '../api/jobFit.api';

const MIN_JOB_DESCRIPTION_LENGTH = 40;

function formatDate(dateString) {
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleString();
}

function scoreColor(score) {
  if (score >= 75) return 'text-green-400';
  if (score >= 45) return 'text-orange-400';
  return 'text-red-400';
}

function RequirementList({ title, requirements, emptyMessage }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-2">{title}</h3>
      {requirements.length === 0 ? (
        <p className="text-sm text-text-muted">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {requirements.map((requirement) => (
            <li key={`${requirement.skill}-${requirement.priority}`} className="rounded-lg bg-bg-secondary p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-text-primary">{requirement.skill}</span>
                <span className="text-xs rounded-full border border-bg-border px-2 py-0.5 text-text-secondary">
                  {requirement.priority}
                </span>
              </div>
              {requirement.evidence?.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {requirement.evidence.map((evidence) => (
                    <li key={`${evidence.source}-${evidence.excerpt}`} className="text-xs text-text-secondary">
                      <span className="text-primary">{evidence.source}:</span> {evidence.excerpt}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function JobFitResult({ jobFit }) {
  const demonstrated = jobFit.requirements.filter((item) => item.status === 'demonstrated');
  const unverified = jobFit.requirements.filter((item) => item.status === 'unverified');
  const scoring = jobFit.scoring || {};

  return (
    <article className="bg-bg-card border border-bg-border rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Evidence-based Project Fit</h3>
          <p className="text-xs text-text-muted mt-1">{formatDate(jobFit.createdAt)}</p>
        </div>
        <div className={`text-3xl font-bold ${scoreColor(jobFit.score)}`}>{jobFit.score}%</div>
      </div>

      <p className="text-xs text-text-secondary mb-5">
        Score = validated demonstrated weight ({scoring.demonstratedWeight || 0}) / total requirement weight ({scoring.totalWeight || 0}).
        Required skills weigh 3; preferred skills weigh 1.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <RequirementList
          title="Demonstrated by saved project evidence"
          requirements={demonstrated}
          emptyMessage="No requirements were supported by the saved analysis."
        />
        <RequirementList
          title="Unverified"
          requirements={unverified}
          emptyMessage="All extracted requirements had supporting evidence."
        />
      </div>

      <p className="text-xs text-text-muted mt-5">
        A skill is unverified when the saved analysis does not prove it. This feature does not label unmentioned skills as missing.
      </p>
    </article>
  );
}

export default function JobFitPanel({ analysisId }) {
  const [jobDescription, setJobDescription] = useState('');
  const [jobFits, setJobFits] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(Boolean(analysisId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    if (!analysisId) {
      setLoadingHistory(false);
      return () => {
        active = false;
      };
    }

    (async () => {
      try {
        const response = await getJobFits(analysisId);
        if (active) setJobFits(response.data.jobFits || []);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load Job Fit history.');
      } finally {
        if (active) setLoadingHistory(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [analysisId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!analysisId) {
      setError('This analysis does not have an ID available for Job Fit comparisons.');
      return;
    }

    if (jobDescription.trim().length < MIN_JOB_DESCRIPTION_LENGTH) {
      setError(`Please enter at least ${MIN_JOB_DESCRIPTION_LENGTH} characters from the job description.`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await createJobFit(analysisId, jobDescription.trim());
      setJobFits((current) => [response.data.jobFit, ...current]);
      setJobDescription('');
    } catch (err) {
      setError(err.message || 'Job Fit analysis failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!analysisId) {
    return (
      <div className="bg-bg-card border border-bg-border rounded-xl p-6 text-text-muted">
        Job Fit is available after this project analysis has been saved.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-bg-card border border-bg-border rounded-xl p-6">
        <h2 className="text-base font-semibold text-text-primary mb-2">Compare this project with a job description</h2>
        <p className="text-sm text-text-secondary mb-4">
          The description is used only for this comparison. It is not saved in the project or comparison history.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="job-description" className="sr-only">Job description</label>
          <textarea
            id="job-description"
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            disabled={submitting}
            rows={8}
            placeholder="Paste the job description here..."
            className="w-full resize-y bg-bg-secondary border border-bg-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary disabled:opacity-50"
          />

          {error && (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs text-text-muted">Required skills count 3 points; preferred skills count 1 point.</span>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Comparing...' : 'Analyze Job Fit'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold text-text-primary">Previous Job Fit comparisons</h2>
        {loadingHistory && <p className="text-sm text-text-muted">Loading comparisons...</p>}
        {!loadingHistory && jobFits.length === 0 && (
          <p className="text-sm text-text-muted">No Job Fit comparisons have been saved for this project.</p>
        )}
        {!loadingHistory && jobFits.map((jobFit) => <JobFitResult key={jobFit._id} jobFit={jobFit} />)}
      </div>
    </div>
  );
}
