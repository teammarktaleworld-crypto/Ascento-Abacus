'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const env = require('../config/env');
const auditFieldsPlugin = require('./plugins/auditFields.plugin');

const generateRollNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `STU-${timestamp}-${suffix}`;
};

const studentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'fullName is required'],
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    default: 'student',
    immutable: true,
    enum: ['student'],
  },
  dateOfBirth: {
    type: Date,
  },
  age: {
    type: Number,
    min: [1, 'age must be at least 1'],
    max: [120, 'age must be less than or equal to 120'],
  },
  gender: {
    type: String,
    required: [true, 'gender is required'],
    enum: ['male', 'female', 'other'],
  },
  parentName: {
    type: String,
    required: [true, 'parentName is required'],
    trim: true,
  },
  parentPhone: {
    type: String,
    required: [true, 'parentPhone is required'],
    trim: true,
  },
  parentEmail: {
    type: String,
    required: [true, 'parentEmail is required'],
    lowercase: true,
    trim: true,
  },
  domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    required: [true, 'domainId is required'],
    index: true,
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true,
    default: generateRollNumber,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  state: {
    type: String,
    trim: true,
  },
  bloodGroup: {
    type: String,
    trim: true,
  },
  profilePhoto: {
    type: String,
  },
  sessionKey: {
    type: String,
    default: null,
    trim: true,
  },
  isPasswordTemporary: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
});

studentSchema.plugin(auditFieldsPlugin);

studentSchema.virtual('isActive').get(function () {
  return this.status === 'active';
});

studentSchema.virtual('dob')
  .get(function () {
    return this.dateOfBirth;
  })
  .set(function (value) {
    this.dateOfBirth = value;
  });

studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, env.BCRYPT_SALT_ROUNDS);
  next();
});

studentSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (update && update.password) {
    update.password = await bcrypt.hash(update.password, env.BCRYPT_SALT_ROUNDS);
  }
  next();
});

studentSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.Student || mongoose.model('Student', studentSchema);
