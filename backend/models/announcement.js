const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AnnouncementSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  audience: {
    type: String,
    enum: ['all', 'students', 'companies'],
    default: 'all'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attachmentUrl: {
    type: String
  },
  expiryDate: {
    type: Date
  },
  important: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', AnnouncementSchema);