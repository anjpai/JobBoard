const User = require('../models/user');
const Job = require('../models/job');
const Application = require('../models/application');
const Profile = require('../models/profile');
const mongoose = require('mongoose');
const emailUtility = require('../utils/emails');
const Announcement = require('../models/announcement'); // if using Mongoose

// @desc    Get admin dashboard statistics
// @access  Private (admin oanly)
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = {
      totalStudents: await User.countDocuments({ role: 'student' }),
      totalCompanies: await User.countDocuments({ role: 'company' }),
      totalJobs: await Job.countDocuments(),
      activeJobs: await Job.countDocuments({ status: 'approved' }),
      totalApplications: await Application.countDocuments(),
      pendingJobApprovals: await Job.countDocuments({ status: 'pending' }),
      pendingCompanyApprovals: await User.countDocuments({ 
        role: 'company', 
        status: 'pending' 
      }),
      recentPlacements: await Application.countDocuments({ 
        status: 'hired',
        updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
    };
    
    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
// adminController.js

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message } = req.body;
    const newAnnouncement = await Announcement.create({ title, message });
    res.status(201).json({ success: true, data: newAnnouncement });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
// @desc    Get all announcements
// @access  Private (admin only)
exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all users
// @access  Private (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, sort, search } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by role if provided
    if (role && ['student', 'company'].includes(role)) {
      query.role = role;
    }
    
    // Filter by status if provided
    if (status && ['pending', 'approved', 'blocked'].includes(status)) {
      query.status = status;
    }
    
    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Exclude admins
    query.role = { $ne: 'admin' };
    
    // Build sort options
    const sortOptions = {};
    if (sort) {
      const parts = sort.split(':');
      sortOptions[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1; // Default sort by newest
    }
    
    const users = await User.find(query)
      .select('-password')
      .populate('profile')
      .sort(sortOptions);
    
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update user status (approve/block)
// @access  Private (admin only)
exports.updateUserStatus = async (req, res) => {
  const { status } = req.body;
  
  // Check if status is valid
  if (!['pending', 'approved', 'blocked'].includes(status)) {
    return res.status(400).json({ msg: 'Invalid status' });
  }
  
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Don't allow changing admin status
    if (user.role === 'admin') {
      return res.status(400).json({ msg: 'Cannot modify admin status' });
    }
    
    // Update user status
    user.status = status;
    await user.save();
    
    // Send email notification
    if (user.email) {
      emailUtility.sendStatusUpdateNotification(user.email, status, user.role);
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Get all jobs
// @access  Private (admin only)
exports.getAllJobs = async (req, res) => {
  try {
    const { status, company, sort, search } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by status if provided
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }
    
    // Filter by company if provided
    if (company) {
      query.company = company;
    }
    
    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort options
    const sortOptions = {};
    if (sort) {
      const parts = sort.split(':');
      sortOptions[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1; // Default sort by newest
    }
    
    const jobs = await Job.find(query)
      .populate('company', 'name email')
      .sort(sortOptions);
    
    res.json(jobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
// @desc    Delete an announcement
// @access  Private (admin only)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ msg: 'Announcement not found' });
    }
    res.json({ msg: 'Announcement deleted', announcement });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update job status (approve/reject)
// @access  Private (admin only)
exports.updateJobStatus = async (req, res) => {
  const { status, feedback } = req.body;
  
  // Check if status is valid
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ msg: 'Invalid status' });
  }
  
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'email name');
    
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }
    
    // Update job status
    job.status = status;
    if (feedback) job.adminFeedback = feedback;
    
    await job.save();
    
    // Send email notification to company
    if (job.company && job.company.email) {
      emailUtility.sendJobStatusUpdateNotification(
        job.company.email,
        job.title,
        status,
        feedback
      );
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

// @desc    Get all applications
// @access  Private (admin only)
exports.getAllApplications = async (req, res) => {
  try {
    const { status, job, student, company, sort } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by job if provided
    if (job) {
      query.job = job;
    }
    
    // Filter by student if provided
    if (student) {
      query.student = student;
    }
    
    // Filter by company if provided
    if (company) {
      query.company = company;
    }
    
    // Build sort options
    const sortOptions = {};
    if (sort) {
      const parts = sort.split(':');
      sortOptions[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1; // Default sort by newest
    }
    
    const applications = await Application.find(query)
      .populate('student', 'name email')
      .populate('company', 'name')
      .populate('job', 'title')
      .sort(sortOptions);
    
    res.json(applications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get placement statistics
// @access  Private (admin only)
exports.getPlacementStats = async (req, res) => {
  try {
    // Get current academic year
    const currentYear = new Date().getFullYear();
    const startDate = new Date(`${currentYear-1}-07-01`);
    const endDate = new Date(`${currentYear}-06-30`);
    
    // Total placements for current academic year
    const totalPlacements = await Application.countDocuments({
      status: 'hired',
      updatedAt: { $gte: startDate, $lte: endDate }
    });
    
    // Company-wise statistics
    const companyStats = await Application.aggregate([
      {
        $match: {
          status: 'hired',
          updatedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'company',
          foreignField: '_id',
          as: 'companyInfo'
        }
      },
      { $unwind: '$companyInfo' },
      {
        $group: {
          _id: '$company',
          companyName: { $first: '$companyInfo.name' },
          hiringCount: { $sum: 1 }
        }
      },
      { $sort: { hiringCount: -1 } },
    ]);
    
    // Program/Branch-wise statistics
    const branchStats = await Application.aggregate([
      {
        $match: {
          status: 'hired',
          updatedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: '$studentInfo' },
      {
        $lookup: {
          from: 'profiles',
          localField: 'studentInfo._id',
          foreignField: 'user',
          as: 'profileInfo'
        }
      },
      { $unwind: '$profileInfo' },
      {
        $group: {
          _id: '$profileInfo.branch',
          branchName: { $first: '$profileInfo.branch' },
          placementCount: { $sum: 1 }
        }
      },
      { $sort: { placementCount: -1 } }
    ]);
    
    // Salary range statistics
    const salaryStats = await Application.aggregate([
      {
        $match: {
          status: 'hired',
          updatedAt: { $gte: startDate, $lte: endDate },
          'offerDetails.salary': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          avgSalary: { $avg: '$offerDetails.salary' },
          maxSalary: { $max: '$offerDetails.salary' },
          minSalary: { $min: '$offerDetails.salary' }
        }
      }
    ]);
    
    // Placement trends (monthly)
    const monthlyTrends = await Application.aggregate([
      {
        $match: {
          status: 'hired',
          updatedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { 
            month: { $month: '$updatedAt' }, 
            year: { $year: '$updatedAt' } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.json({
      academicYear: `${currentYear-1}-${currentYear}`,
      totalPlacements,
      companyStats,
      branchStats,
      salaryStats: salaryStats[0] || { avgSalary: 0, maxSalary: 0, minSalary: 0 },
      monthlyTrends
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get admin reports (downloadable CSV data)
// @access  Private (admin only)
exports.getReports = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;
    
    // Validate dates
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    let data = [];
    
    switch (reportType) {
      case 'placements':
        data = await Application.find({
          status: 'hired',
          updatedAt: { $gte: start, $lte: end }
        })
        .populate('student', 'name email')
        .populate('job', 'title salary')
        .populate('company', 'name')
        .lean();
        break;
        
      case 'companies':
        data = await User.find({
          role: 'company',
          createdAt: { $gte: start, $lte: end }
        })
        .select('-password')
        .lean();
        break;
        
      case 'students':
        data = await User.find({
          role: 'student',
          createdAt: { $gte: start, $lte: end }
        })
        .select('-password')
        .populate('profile')
        .lean();
        break;
        
      case 'jobs':
        data = await Job.find({
          createdAt: { $gte: start, $lte: end }
        })
        .populate('company', 'name')
        .lean();
        break;
        
      default:
        return res.status(400).json({ msg: 'Invalid report type' });
    }
    
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get a specific user's details
// @access  Private (admin only)
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('profile');
      
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Get additional data based on user role
    let additionalData = {};
    
    if (user.role === 'student') {
      // Get student's applications
      const applications = await Application.find({ student: user._id })
        .populate('job', 'title')
        .populate('company', 'name');
        
      additionalData = { applications };
    } else if (user.role === 'company') {
      // Get company's jobs and applications
      const jobs = await Job.find({ company: user._id });
      const applications = await Application.find({ company: user._id })
        .populate('student', 'name email')
        .populate('job', 'title');
        
      additionalData = { jobs, applications };
    }
    
    res.json({
      user,
      ...additionalData
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Update application status
// @access  Private (admin only)
exports.updateApplicationStatus = async (req, res) => {
  const { status, adminNotes } = req.body;
  
  // Check if status is valid
  if (!['pending', 'shortlisted', 'rejected', 'interviewed', 'offered', 'hired', 'declined'].includes(status)) {
    return res.status(400).json({ msg: 'Invalid status' });
  }
  
  try {
    const application = await Application.findById(req.params.id)
      .populate('student', 'email name')
      .populate('company', 'name')
      .populate('job', 'title');
    
    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }
    
    // Update application status
    application.status = status;
    if (adminNotes) application.adminNotes = adminNotes;
    
    await application.save();
    
    // Send email notification to student
    if (application.student && application.student.email) {
      emailUtility.sendApplicationStatusUpdateNotification(
        application.student.email,
        application.student.name,
        application.job.title,
        application.company.name,
        status
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

// @desc    Delete user account
// @access  Private (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Don't allow deleting admin
    if (user.role === 'admin') {
      return res.status(400).json({ msg: 'Cannot delete admin accounts' });
    }
    
    // Handle dependent records based on user role
    if (user.role === 'student') {
      // Delete student's profile
      await Profile.findOneAndRemove({ user: req.params.id });
      
      // Update application statuses for this student
      await Application.updateMany(
        { student: req.params.id },
        { status: 'cancelled', adminNotes: 'Student account was deleted' }
      );
    } else if (user.role === 'company') {
      // Update job statuses for this company
      await Job.updateMany(
        { company: req.params.id },
        { status: 'rejected', adminFeedback: 'Company account was deleted' }
      );
      
      // Update application statuses for this company's jobs
      await Application.updateMany(
        { company: req.params.id },
        { status: 'rejected', adminNotes: 'Company account was deleted' }
      );
    }
    
    // Delete the user
    await user.remove();
    
    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Get system analytics
// @access  Private (admin only)
exports.getSystemAnalytics = async (req, res) => {
  try {
    // User registration trends
    const userRegistrations = await User.aggregate([
      {
        $match: {
          role: { $in: ['student', 'company'] }
        }
      },
      {
        $group: {
          _id: { 
            month: { $month: '$createdAt' }, 
            year: { $year: '$createdAt' },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Job posting trends
    const jobPostings = await Job.aggregate([
      {
        $group: {
          _id: { 
            month: { $month: '$createdAt' }, 
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Application trends
    const applicationTrends = await Application.aggregate([
      {
        $group: {
          _id: { 
            month: { $month: '$createdAt' }, 
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Placement success rate (ratio of hired to total applications)
    const placementSuccessRate = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalApplications = placementSuccessRate.reduce((acc, curr) => acc + curr.count, 0);
    const hiredCount = placementSuccessRate.find(item => item._id === 'hired')?.count || 0;
    const successRate = totalApplications > 0 ? (hiredCount / totalApplications * 100).toFixed(2) : 0;
    
    res.json({
      userRegistrations,
      jobPostings,
      applicationTrends,
      placementSummary: {
        totalApplications,
        hiredCount,
        successRate: parseFloat(successRate)
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};