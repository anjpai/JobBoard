const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const profileController = require('../controllers/profileController');

// @route   GET api/users/profile/me
// @desc    Get current user's profile
// @access  Private
router.get('/profile/me', auth, profileController.getCurrentProfile);

// @route   GET api/users/profile
// @desc    Get all profiles
// @access  Private/Admin
router.get('/profile', [auth, roleCheck('admin')], profileController.getAllProfiles);

// @route   GET api/users/profile/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get('/profile/:user_id', profileController.getProfileByUserId);

// @route   POST api/users/profile
// @desc    Create or update user profile
// @access  Private
router.post('/profile', auth, profileController.createOrUpdateProfile);

// Student specific routes

// @route   PUT api/users/profile/project
// @desc    Add project to student profile
// @access  Private (Student)
router.put('/profile/project', [auth, roleCheck('student')], profileController.addProject);

// @route   DELETE api/users/profile/project/:project_id
// @desc    Delete project from student profile
// @access  Private (Student)
router.delete('/profile/project/:project_id', [auth, roleCheck('student')], profileController.deleteProject);

// Additional routes for experience, education, etc. can be added similarly

module.exports = router;