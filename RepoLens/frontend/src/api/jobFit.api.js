import clientAPI from './client';

export const createJobFit = (analysisId, jobDescription) =>
  clientAPI.post(`/analyses/${analysisId}/job-fits`, { jobDescription });

export const getJobFits = (analysisId) =>
  clientAPI.get(`/analyses/${analysisId}/job-fits`);
