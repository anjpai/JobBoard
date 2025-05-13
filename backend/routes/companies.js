const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');
const companyController = require('../controllers/companyController');

// @route   GET api/companies
// @desc    Get all companies
// @access  Public
router.get('/', companyController.getAllCompanies);

// @route   GET api/companies/:id
// @desc    Get company by ID
// @access  Public
router.get('/:id', companyController.getCompanyById);

// @route   POST api/companies
// @desc    Create or update company profile
// @access  Private (company only)
router.post(
  '/profile',
  auth,
  roleCheck('company'),
  upload.single('logo'),
  companyController.updateCompanyProfile
);

// @route   GET api/companies/profile/me
// @desc    Get current company profile
// @access  Private (company only)
router.get('/profile/me', auth, roleCheck('company'), companyController.getCurrentProfile);

// @route   GET api/companies/jobs
// @desc    Get all jobs posted by current company
// @access  Private (company only)
router.get('/jobs/me', auth, roleCheck('company'), companyController.getCompanyJobs);

// @route   GET api/companies/:id/jobs
// @desc    Get all jobs posted by a specific company
// @access  Public
router.get('/:id/jobs', companyController.getJobsByCompany);

module.exports = router;