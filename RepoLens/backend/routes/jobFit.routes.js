const express = require('express');
const router = express.Router();
const jobFitController = require('../Controllers/jobFit.controller');

router.post('/analyses/:analysisId/job-fits', jobFitController.createJobFit);
router.get('/analyses/:analysisId/job-fits', jobFitController.getJobFits);

module.exports = router;
