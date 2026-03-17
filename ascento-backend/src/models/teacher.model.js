'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const auditFieldsPlugin = require('./plugins/auditFields.plugin');

const teacherSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    index: true,
    default: function () { return undefined; }, // allow pre-save hook to generate
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  phone: {
    type: String,
    trim: true,
  },
  domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    required: [true, 'domainId is required'],
    index: true,
  },
  role: {
    type: String,
    default: 'teacher',
    immutable: true,
    enum: ['teacher'],
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
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
  country: {
    type: String,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  qualification: {
    type: String,
    trim: true,
  },
  experienceYears: {
    type: Number,
    min: [0, 'experienceYears cannot be negative'],
    default: 0,
  },
  joiningDate: {
    type: Date,
  },
  profilePhoto: {
    type: String,
  },
  sessionKey: {
    type: String,
    default: null,
    trim: true,
  },
  mustChangePassword: {
    type: Boolean,
    default: false,
  },
  isPasswordTemporary: {
    type: Boolean,
    default: false,
  },
});

teacherSchema.plugin(auditFieldsPlugin);

teacherSchema.virtual('isActive').get(function () {
  return this.status === 'active';
});

teacherSchema.set('toJSON', { virtuals: true });
teacherSchema.set('toObject', { virtuals: true });

teacherSchema.pre('save', async function (next) {
  // Generate userId if not set
  if (!this.userId) {
    // Example: TEA-YYYY-XXXX (increment per year)
    const year = new Date().getFullYear();
    const Teacher = mongoose.models.Teacher || mongoose.model('Teacher');
    const count = await Teacher.countDocuments({
      createdAt: {
        $gte: new Date(`${year}-01-01T00:00:00.000Z`),
        $lte: new Date(`${year}-12-31T23:59:59.999Z`)
      }
    });
    const nextNum = (count + 1).toString().padStart(4, '0');
    this.userId = `TEA-${year}-${nextNum}`;
  }
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, env.BCRYPT_SALT_ROUNDS);
  }
  next();
});

teacherSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (update && update.password) {
    update.password = await bcrypt.hash(update.password, env.BCRYPT_SALT_ROUNDS);
  }
  next();
});

teacherSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);
// Role-based update method
teacherSchema.methods.updateFieldsByRole = function (data, role) {
  const teacherFields = [
    'name', 'phone', 'address', 'city', 'state', 'country', 'profilePhoto'
  ];
  const adminFields = [
    ...teacherFields,
    'email', 'gender', 'dateOfBirth', 'qualification', 'experienceYears', 'joiningDate',
    'domainId', 'status', 'role', 'sessionKey', 'mustChangePassword', 'isPasswordTemporary'
  ];
  const allowedFields = role === 'admin' ? adminFields : teacherFields;
  for (const key of allowedFields) {
    if (data[key] !== undefined) this[key] = data[key];
  }
};
