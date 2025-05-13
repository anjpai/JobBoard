const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const jobController = require('../controllers/jobcontroller');

// @route   POST api/jobs
// @desc    Create a job posting
// @access  Private (Company)
router.post('/', [auth, roleCheck('company')], jobController.createJob);

// @route   GET api/jobs
// @desc    Get all approved and open jobs
// @access  Public
router.get('/', jobController.getAllJobs);

// @route   GET api/jobs/:id
// @desc    Get job by ID
// @access  Public
router.get('/:id', jobController.getJobById);

// @route   PUT api/jobs/:id
// @desc    Update a job posting
// @access  Private (Company that created the job)
router.put('/:id', [auth, roleCheck('company')], jobController.updateJob);

// @route   DELETE api/jobs/:id
// @desc    Delete a job posting
// @access  Private (Company that created the job)
router.delete('/:id', [auth, roleCheck('company')], jobController.deleteJob);

// @route   GET api/jobs/company/me
// @desc    Get jobs posted by the company
// @access  Private (Company)
router.get('/company/me', [auth, roleCheck('company')], jobController.getCompanyJobs);

// @route   PUT api/jobs/approve/:id
// @desc    Approve a job posting (admin only)
// @access  Private (Admin)
router.put('/approve/:id', [auth, roleCheck('admin')], jobController.approveJob);

// @route   GET api/jobs/admin/pending
// @desc    Get all pending job approvals (admin only)
// @access  Private (Admin)
router.get('/admin/pending', [auth, roleCheck('admin')], jobController.getPendingJobs);

module.exports = router;