const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const adminController = require('../controllers/adminController');

// @route   GET api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (admin only)
router.get('/dashboard', auth, roleCheck('admin'), adminController.getDashboardStats);

// @route   GET api/admin/users
// @desc    Get all users
// @access  Private (admin only)
router.get('/users', auth, roleCheck('admin'), adminController.getAllUsers);

// @route   PUT api/admin/users/:id
// @desc    Update user status (approve/block)
// @access  Private (admin only)
router.put('/users/:id', auth, roleCheck('admin'), adminController.updateUserStatus);

// @route   GET api/admin/jobs
// @desc    Get all jobs
// @access  Private (admin only)
router.get('/jobs', auth, roleCheck('admin'), adminController.getAllJobs);

// @route   PUT api/admin/jobs/:id
// @desc    Update job status (approve/reject)
// @access  Private (admin only)
router.put('/jobs/:id', auth, roleCheck('admin'), adminController.updateJobStatus);

// @route   GET api/admin/applications
// @desc    Get all applications
// @access  Private (admin only)
router.get('/applications', auth, roleCheck('admin'), adminController.getAllApplications);

// @route   GET api/admin/stats/placement
// @desc    Get placement statistics
// @access  Private (admin only)
router.get('/stats/placement', auth, roleCheck('admin'), adminController.getPlacementStats);

// @route   POST api/admin/announcement
// @desc    Create an announcement
// @access  Private (admin only)
router.post('/announcement', auth, roleCheck('admin'), adminController.createAnnouncement);

// @route   GET api/admin/announcement
// @desc    Get all announcements
// @access  Private (admin only)
router.get('/announcement', auth, roleCheck('admin'), adminController.getAnnouncements);

// @route   DELETE api/admin/announcement/:id
// @desc    Delete an announcement
// @access  Private (admin only)
router.delete('/announcement/:id', auth, roleCheck('admin'), adminController.deleteAnnouncement);

module.exports = router;