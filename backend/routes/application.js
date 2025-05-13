const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');
const applicationController = require('../controllers/applicationController');

// @route   POST api/applications/:jobId
// @desc    Apply for a job
// @access  Private (student only)
router.post(
  '/:jobId',
  auth,
  roleCheck('student'),
  upload.single('resume'),
  applicationController.applyForJob
);

// @route   GET api/applications/student
// @desc    Get all applications for current student
// @access  Private (student only)
router.get(
  '/student',
  auth,
  roleCheck('student'),
  applicationController.getStudentApplications
);

// @route   GET api/applications/company/:jobId
// @desc    Get all applications for a specific job
// @access  Private (company only)
router.get(
  '/company/:jobId',
  auth,
  roleCheck('company'),
  applicationController.getJobApplications
);

// @route   PUT api/applications/:id
// @desc    Update application status
// @access  Private (company only)
router.put(
  '/:id',
  auth,
  roleCheck('company'),
  applicationController.updateApplicationStatus
);

// @route   DELETE api/applications/:id
// @desc    Withdraw job application
// @access  Private (student only)
router.delete(
  '/:id',
  auth,
  roleCheck('student'),
  applicationController.withdrawApplication
);

module.exports = router;