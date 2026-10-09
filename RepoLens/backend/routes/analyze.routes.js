const express = require('express');
const router = express.Router();
const analyzeController = require('../Controllers/analyze.controller');

// POST /api/analyze - analyze a public GitHub repo
router.post('/analyze', analyzeController.analyze);

// GET /api/analyses - get analysis history
router.get('/analyses', analyzeController.getHistory);

// GET /api/analyses/:id - get single analysis
router.get('/analyses/:id', analyzeController.getAnalysis);

module.exports = router;
