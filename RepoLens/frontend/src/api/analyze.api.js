import clientAPI from "./client";

// Analyze a GitHub repository
export const analyzeRepo = (githubUrl) =>
  clientAPI.post("/analyze", { githubUrl });

// Get analysis history
export const getAnalysisHistory = () =>
  clientAPI.get("/analyses");

// Get single analysis by ID
export const getAnalysisById = (id) =>
  clientAPI.get(`/analyses/${id}`);
