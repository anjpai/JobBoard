const Profile = require('../models/profile');
const User = require('../models/user');

// @desc    Get current user's profile
// @access  Private
exports.getCurrentProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'email', 'role']);

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all profiles
// @access  Private/Admin
exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'email', 'role']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get profile by user ID
// @access  Public
exports.getProfileByUserId = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'email', 'role']);

    if (!profile) return res.status(400).json({ msg: 'Profile not found' });

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Create or update user profile
// @access  Private
exports.createOrUpdateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Build profile object based on user role
    const profileFields = {
      user: req.user.id
    };

    // Common fields
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.location) profileFields.location = req.body.location;
    if (req.body.website) profileFields.website = req.body.website;
    
    // Build social object
    profileFields.social = {};
    if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if (req.body.github) profileFields.social.github = req.body.github;

    // Role-specific fields
    if (user.role === 'student') {
      profileFields.studentInfo = {};
      if (req.body.degree) profileFields.studentInfo.degree = req.body.degree;
      if (req.body.fieldOfStudy) profileFields.studentInfo.fieldOfStudy = req.body.fieldOfStudy;
      if (req.body.university) profileFields.studentInfo.university = req.body.university;
      if (req.body.yearOfGraduation) profileFields.studentInfo.yearOfGraduation = req.body.yearOfGraduation;
      if (req.body.cgpa) profileFields.studentInfo.cgpa = req.body.cgpa;
      if (req.body.skills) {
        if (Array.isArray(req.body.skills)) {
          profileFields.studentInfo.skills = req.body.skills;
        } else {
          profileFields.studentInfo.skills = req.body.skills.split(',').map(skill => skill.trim());
        }
      }

      // Additional fields like projects, experience, education can be handled separately
    } else if (user.role === 'company') {
      profileFields.companyInfo = {};
      if (req.body.companyName) profileFields.companyInfo.companyName = req.body.companyName;
      if (req.body.industry) profileFields.companyInfo.industry = req.body.industry;
      if (req.body.companySize) profileFields.companyInfo.companySize = req.body.companySize;
      if (req.body.foundedYear) profileFields.companyInfo.foundedYear = req.body.foundedYear;
      if (req.body.description) profileFields.companyInfo.description = req.body.description;
      
      // Handle address if provided
      if (req.body.address) {
        profileFields.companyInfo.address = {};
        const { street, city, state, zipCode, country } = req.body.address;
        if (street) profileFields.companyInfo.address.street = street;
        if (city) profileFields.companyInfo.address.city = city;
        if (state) profileFields.companyInfo.address.state = state;
        if (zipCode) profileFields.companyInfo.address.zipCode = zipCode;
        if (country) profileFields.companyInfo.address.country = country;
      }
    }

    // Create or update profile
    let profile = await Profile.findOne({ user: req.user.id });
    if (profile) {
      // Update
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );
      return res.json(profile);
    }

    // Create
    profile = new Profile(profileFields);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Add student project
// @access  Private (Student)
exports.addProject = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    const newProject = {
      title: req.body.title,
      description: req.body.description,
      link: req.body.link
    };

    if (!profile.studentInfo) profile.studentInfo = {};
    if (!profile.studentInfo.projects) profile.studentInfo.projects = [];
    
    profile.studentInfo.projects.unshift(newProject);
    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete project from student profile
// @access  Private (Student)
exports.deleteProject = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile || !profile.studentInfo || !profile.studentInfo.projects) {
      return res.status(404).json({ msg: 'Profile or projects not found' });
    }

    // Get remove index
    const removeIndex = profile.studentInfo.projects
      .map(item => item.id)
      .indexOf(req.params.project_id);

    if (removeIndex === -1) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    profile.studentInfo.projects.splice(removeIndex, 1);
    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Similar functions can be implemented for experience, education, etc.