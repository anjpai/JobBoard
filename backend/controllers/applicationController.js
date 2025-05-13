const Application = require('../models/application');
const Job = require('../models/job');
const User = require('../models/user');
const fs = require('fs');
const path = require('path');
const emailUtility = require('../utils/emails');

// @desc    Apply for a job
// @access  Private (student only)
exports.applyForJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Check if job is still accepting applications
    if (job.status !== 'approved') {
      return res.status(400).json({ msg: 'This job is not accepting applications' });
    }

    // Check if application deadline has passed
    if (new Date(job.deadline) < new Date()) {
      return res.status(400).json({ msg: 'Application deadline has passed' });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      job: req.params.jobId,
      student: req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({ msg: 'You have already applied for this job' });
    }

    // Build application object
    const newApplication = new Application({
      job: req.params.jobId,
      company: job.company,
      student: req.user.id,
      status: 'pending',
      coverLetter: req.body.coverLetter
    });

    // Handle resume upload
    if (req.file) {
      newApplication.resume = `/uploads/${req.file.filename}`;
    }

    await newApplication.save();

    // Notify company about new application
    const company = await User.findById(job.company);
    if (company && company.email) {
      const student = await User.findById(req.user.id).select('name email');
      emailUtility.sendNewApplicationNotification(company.email, job.title, student.name);
    }

    res.json(newApplication);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all applications for current student
// @access  Private (student only)
exports.getStudentApplications = async (req, res) => {
  try {
    const applications = await Application.find({ student: req.user.id })
      .populate('job', 'title company status')
      .populate('company', 'name')
      .sort({ createdAt: -1 });
    
    res.json(applications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all applications for a specific job
// @access  Private (company only)
exports.getJobApplications = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Ensure company owns this job
    if (job.company.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('student', 'name email')
      .populate('job', 'title')
      .sort({ createdAt: -1 });
    
    res.json(applications);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Job not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Update application status
// @access  Private (company only)
exports.updateApplicationStatus = async (req, res) => {
  const { status, feedback } = req.body;
  
  // Check if status is valid
  const validStatuses = ['pending', 'reviewing', 'shortlisted', 'rejected', 'hired'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ msg: 'Invalid status' });
  }

  try {
    let application = await Application.findById(req.params.id)
      .populate('job', 'title company')
      .populate('student', 'name email');
    
    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }

    // Ensure company owns this job
    if (application.job.company.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Update application
    application.status = status;
    if (feedback) application.feedback = feedback;
    
    await application.save();

    // Send email notification to student
    if (application.student && application.student.email) {
      emailUtility.sendApplicationStatusUpdateNotification(
        application.student.email,
        application.job.title,
        status,
        feedback
      );
    }

    res.json(application);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Application not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Withdraw job application
// @access  Private (student only)
exports.withdrawApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }

    // Check if user owns this application
    if (application.student.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Delete resume file if exists
    if (application.resume) {
      const resumePath = path.join(__dirname, '..', application.resume);
      if (fs.existsSync(resumePath)) {
        fs.unlinkSync(resumePath);
      }
    }

    await application.remove();
    
    res.json({ msg: 'Application withdrawn' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Application not found' });
    }
    res.status(500).send('Server Error');
  }
};