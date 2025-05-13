const Job = require('../models/job');
const User = require('../models/user');

// @desc    Create a job posting
// @access  Private (Company)
exports.createJob = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'company') {
      return res.status(403).json({ msg: 'Not authorized to post jobs' });
    }

    if (user.role === 'company' && !user.isApproved) {
      return res.status(403).json({ msg: 'Your company account is pending approval' });
    }

    const {
      title,
      description,
      requirements,
      location,
      jobType,
      salary,
      positions,
      skills,
      applicationDeadline,
      eligibility
    } = req.body;

    // Create job object
    const jobFields = {
      company: req.user.id,
      title,
      description,
      requirements,
      location,
      jobType,
      positions
    };

    // Handle salary
    if (salary) {
      jobFields.salary = {};
      if (salary.min) jobFields.salary.min = salary.min;
      if (salary.max) jobFields.salary.max = salary.max;
      if (salary.currency) jobFields.salary.currency = salary.currency;
    }

    // Handle skills
    if (skills) {
      jobFields.skills = skills.split(',').map(skill => skill.trim());
    }

    // Handle application deadline
    if (applicationDeadline) jobFields.applicationDeadline = applicationDeadline;
    
    // Handle eligibility criteria
    if (eligibility) {
      jobFields.eligibility = {};
      if (eligibility.degrees) jobFields.eligibility.degrees = eligibility.degrees;
      if (eligibility.minCgpa) jobFields.eligibility.minCgpa = eligibility.minCgpa;
      if (eligibility.yearOfPassing) jobFields.eligibility.yearOfPassing = eligibility.yearOfPassing;
    }
    
    // Add application link if provided
    if (req.body.applicationLink) jobFields.applicationLink = req.body.applicationLink;

    // Create job
    const job = new Job(jobFields);
    await job.save();

    res.json(job);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all jobs
// @access  Public
exports.getAllJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {
      status: 'open',
      isApproved: true
    };
    
    // Add search filters
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Add other filters
    if (req.query.location) filter.location = req.query.location;
    if (req.query.type) filter.type = req.query.type;
    
    const jobs = await Job.find(filter)
      .select('title company location type salary createdAt')
      .populate('company', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
      
    const total = await Job.countDocuments(filter);
    
    res.json({
      jobs,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get job by ID
// @access  Public
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('company', ['name', 'email']);
    
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    res.json(job);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Job not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Update a job posting
// @access  Private (Company that created the job)
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Check user authorization
    if (job.company.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Build job update object based on request body
    const jobUpdate = {};
    if (req.body.title) jobUpdate.title = req.body.title;
    if (req.body.description) jobUpdate.description = req.body.description;
    if (req.body.requirements) jobUpdate.requirements = req.body.requirements;
    if (req.body.location) jobUpdate.location = req.body.location;
    if (req.body.jobType) jobUpdate.jobType = req.body.jobType;
    if (req.body.positions) jobUpdate.positions = req.body.positions;
    if (req.body.applicationDeadline) jobUpdate.applicationDeadline = req.body.applicationDeadline;
    if (req.body.status) jobUpdate.status = req.body.status;
    if (req.body.applicationLink) jobUpdate.applicationLink = req.body.applicationLink;
    
    // Handle salary
    if (req.body.salary) {
      jobUpdate.salary = job.salary || {};
      if (req.body.salary.min) jobUpdate.salary.min = req.body.salary.min;
      if (req.body.salary.max) jobUpdate.salary.max = req.body.salary.max;
      if (req.body.salary.currency) jobUpdate.salary.currency = req.body.salary.currency;
    }

    // Handle skills
    if (req.body.skills) {
      jobUpdate.skills = req.body.skills.split(',').map(skill => skill.trim());
    }
    
    // Handle eligibility criteria
    if (req.body.eligibility) {
      jobUpdate.eligibility = job.eligibility || {};
      if (req.body.eligibility.degrees) jobUpdate.eligibility.degrees = req.body.eligibility.degrees;
      if (req.body.eligibility.minCgpa) jobUpdate.eligibility.minCgpa = req.body.eligibility.minCgpa;
      if (req.body.eligibility.yearOfPassing) jobUpdate.eligibility.yearOfPassing = req.body.eligibility.yearOfPassing;
    }

    // Update job
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: jobUpdate },
      { new: true }
    );

    res.json(updatedJob);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a job posting
// @access  Private (Company that created the job)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Check user authorization
    if (job.company.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await job.deleteOne();
    res.json({ msg: 'Job removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Job not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Get jobs posted by the company
// @access  Private (Company)
exports.getCompanyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ company: req.user.id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Approve a job posting (admin only)
// @access  Private (Admin)
exports.approveJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    job.isApproved = true;
    await job.save();

    res.json(job);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Job not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Get all pending job approvals (admin only)
// @access  Private (Admin)
exports.getPendingJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ isApproved: false, status: { $ne: 'draft' } })
      .populate('company', ['name', 'email'])
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};