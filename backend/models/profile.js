const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProfileSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Common fields for both student and company
  name: {
    type: String
  },
  bio: {
    type: String
  },
  location: {
    type: String
  },
  website: {
    type: String
  },
  skills: {
    type: [String]
  },
  socialMedia: {
    linkedin: {
      type: String
    },
    github: {
      type: String
    },
    twitter: {
      type: String
    },
    facebook: {
      type: String
    }
  },
  // Student-specific fields
  studentDetails: {
    rollNumber: {
      type: String
    },
    branch: {
      type: String
    },
    program: {
      type: String
    },
    graduationYear: {
      type: Number
    },
    cgpa: {
      type: Number
    },
    currentSemester: {
      type: Number
    },
    backlogs: {
      type: Number,
      default: 0
    },
    certifications: [
      {
        title: {
          type: String,
          required: true
        },
        issuer: {
          type: String
        },
        issueDate: {
          type: Date
        },
        expiryDate: {
          type: Date
        },
        credentialUrl: {
          type: String
        }
      }
    ],
    projects: [
      {
        title: {
          type: String,
          required: true
        },
        description: {
          type: String
        },
        startDate: {
          type: Date
        },
        endDate: {
          type: Date
        },
        technologies: {
          type: [String]
        },
        projectUrl: {
          type: String
        },
        githubUrl: {
          type: String
        }
      }
    ],
    experience: [
      {
        title: {
          type: String,
          required: true
        },
        company: {
          type: String,
          required: true
        },
        location: {
          type: String
        },
        startDate: {
          type: Date
        },
        endDate: {
          type: Date
        },
        current: {
          type: Boolean,
          default: false
        },
        description: {
          type: String
        }
      }
    ],
    education: [
      {
        school: {
          type: String,
          required: true
        },
        degree: {
          type: String
        },
        fieldOfStudy: {
          type: String
        },
        from: {
          type: Date
        },
        to: {
          type: Date
        },
        current: {
          type: Boolean,
          default: false
        },
        percentage: {
          type: Number
        }
      }
    ]
  },
  // Company-specific fields
  companyDetails: {
    industry: {
      type: String
    },
    description: {
      type: String
    },
    logo: {
      type: String
    },
    establishedYear: {
      type: Number
    },
    employeeCount: {
      type: String
    },
    headquarters: {
      type: String
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Profile', ProfileSchema);