const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Internship', 'Contract'],
    required: true
  },
  salary: {
    min: {
      type: Number
    },
    max: {
      type: Number
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  positions: {
    type: Number,
    required: true
  },
  skills: {
    type: [String],
    required: true
  },
  applicationDeadline: {
    type: Date,
    required: true
  },
  eligibility: {
    degrees: {
      type: [String],
      default: []
    },
    minCgpa: {
      type: Number,
      default: 0
    },
    yearOfPassing: {
      type: [Number],
      default: []
    }
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'in-review', 'draft'],
    default: 'open'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  applicationLink: {
    type: String
  },
  additionalDocuments: {
    type: [String]
  },
  applicationCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('jobs', JobSchema);