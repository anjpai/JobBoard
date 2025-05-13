const User = require('../models/user');
const Job = require('../models/job');
const Profile = require('../models/profile');
const fs = require('fs');
const path = require('path');

// @desc    Get all companies
// @access  Public
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await User.find({ role: 'company' })
      .select('-password')
      .populate('profile');
    
    res.json(companies);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get company by ID
// @access  Public
exports.getCompanyById = async (req, res) => {
  try {
    const company = await User.findOne({ 
      _id: req.params.id, 
      role: 'company' 
    })
    .select('-password')
    .populate('profile');

    if (!company) {
      return res.status(404).json({ msg: 'Company not found' });
    }

    res.json(company);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Company not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Create or update company profile
// @access  Private (company only)
exports.updateCompanyProfile = async (req, res) => {
  const {
    name,
    website,
    location,
    industry,
    description,
    establishedYear,
    employeeCount,
    socialMedia
  } = req.body;

  // Build profile object
  const profileFields = {};
  profileFields.user = req.user.id;
  if (name) profileFields.name = name;
  if (website) profileFields.website = website;
  if (location) profileFields.location = location;
  if (industry) profileFields.industry = industry;
  if (description) profileFields.description = description;
  if (establishedYear) profileFields.establishedYear = establishedYear;
  if (employeeCount) profileFields.employeeCount = employeeCount;

  // Build social media object
  if (socialMedia) {
    profileFields.socialMedia = {};
    if (socialMedia.linkedin) profileFields.socialMedia.linkedin = socialMedia.linkedin;
    if (socialMedia.twitter) profileFields.socialMedia.twitter = socialMedia.twitter;
    if (socialMedia.facebook) profileFields.socialMedia.facebook = socialMedia.facebook;
  }

  // Handle logo upload
  if (req.file) {
    profileFields.logo = `/uploads/${req.file.filename}`;
  }

  try {
    let profile = await Profile.findOne({ user: req.user.id });

    // If profile exists, update it
    if (profile) {
      // If there's a new logo and the old logo exists, delete it
      if (req.file && profile.logo) {
        const oldLogoPath = path.join(__dirname, '..', profile.logo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }

      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );
    } else {
      // Create profile if it doesn't exist
      profile = new Profile(profileFields);
      await profile.save();

      // Update user with profile reference
      await User.findByIdAndUpdate(
        req.user.id,
        { profile: profile._id },
        { new: true }
      );
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get current company profile
// @access  Private (company only)
exports.getCurrentProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('profile'); // Add this line

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({
      success: true,
      user: user // Return full user object with populated profile
    });
  } catch (err) {
    console.error("Error in getCurrentProfile:", err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};



// @desc    Get all jobs posted by current company
// @access  Private (company only)
exports.getCompanyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ company: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(jobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all jobs posted by a specific company
// @access  Public
exports.getJobsByCompany = async (req, res) => {
  try {
    const companyExists = await User.findOne({ 
      _id: req.params.id, 
      role: 'company' 
    });

    if (!companyExists) {
      return res.status(404).json({ msg: 'Company not found' });
    }

    const jobs = await Job.find({ 
      company: req.params.id,
      status: 'approved' // Only show approved jobs
    }).sort({ createdAt: -1 });
    
    res.json(jobs);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Company not found' });
    }
    res.status(500).send('Server Error');
  }
};