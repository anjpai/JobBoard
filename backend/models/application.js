const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ApplicationSchema = new Schema({
  job: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'shortlisted', 'rejected', 'hired'],
    default: 'pending'
  },
  resume: {
    type: String,
    required: true
  },
  coverLetter: {
    type: String
  },
  feedback: {
    type: String
  },
  interviews: [
    {
      round: {
        type: Number,
        required: true
      },
      date: {
        type: Date,
        required: true
      },
      location: {
        type: String
      },
      mode: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline'
      },
      meetingLink: {
        type: String
      },
      status: {
        type: String,
        enum: ['scheduled', 'completed', 'pending', 'cancelled'],
        default: 'scheduled'
      },
      feedback: {
        type: String
      }
    }
  ],
  offerDetails: {
    salary: {
      type: Number
    },
    position: {
      type: String
    },
    joiningDate: {
      type: Date
    },
    offerLetterUrl: {
      type: String
    },
    offerAccepted: {
      type: Boolean,
      default: false
    }
  }
}, { timestamps: true });

// Create compound index for preventing duplicate applications
ApplicationSchema.index({ job: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);