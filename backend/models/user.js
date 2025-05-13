const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['student', 'company', 'admin'],
    default: 'student'
  },
  // Add this profile reference field
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile'
  },
  isApproved: {
    type: Boolean,
    default: function() { return this.role !== 'company'; }
  },
  avatar: { type: String, default: '' },
  contactNumber: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
