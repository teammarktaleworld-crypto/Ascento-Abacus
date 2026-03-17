'use strict';

const crypto = require('crypto');
const AppError = require('../../core/AppError');
const Domain = require('../../models/domain.model.js');
const Session = require('../../models/Session.model');
const Teacher = require('../../models/teacher.model');

const teacherPopulate = {
  path: 'domainId',
};

const ensureDomainExists = async (domainId) => {
  const domain = await Domain.findById(domainId);
  if (!domain) {
    throw new AppError('Domain not found.', 404);
  }
  return domain;
};

const generateTemporaryPassword = () => {
  return `Teach@${crypto.randomBytes(4).toString('hex')}`;
};

const sanitiseTeacher = (teacher) => {
  const obj = teacher.toObject ? teacher.toObject() : { ...teacher };
  delete obj.password;
  return obj;
};

const create = async (data, adminId) => {
  await ensureDomainExists(data.domainId);

  const temporaryPassword = generateTemporaryPassword();
  const teacher = await Teacher.create({
    ...data,
    password: temporaryPassword,
    mustChangePassword: true,
    isPasswordTemporary: true,
    createdBy: adminId,
    updatedBy: adminId,
  });

  // Create a session for the new teacher
  const sessionKey = crypto.randomBytes(32).toString('hex');
  await Session.create({
    userId: teacher._id,
    userModel: 'Teacher',
    sessionKey,
    role: 'teacher',
    isActive: true,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days expiry
  });

  const createdTeacher = await Teacher.findById(teacher._id)
    .select('-password')
    .populate(teacherPopulate);

  return {
    teacher: sanitiseTeacher(createdTeacher),
    teacherEmail: createdTeacher.email,
    temporaryPassword,
    sessionKey,
  };
};

const list = async ({ page = 1, limit = 20, domainId, status } = {}) => {
  const numericPage = Math.max(Number(page) || 1, 1);
  const numericLimit = Math.max(Number(limit) || 20, 1);
  const filter = {};

  if (domainId) {
    filter.domainId = domainId;
  }

  if (status) {
    filter.status = status;
  }

  const skip = (numericPage - 1) * numericLimit;
  const [data, total] = await Promise.all([
    Teacher.find(filter)
      .select('-password')
      .populate(teacherPopulate)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(numericLimit),
    Teacher.countDocuments(filter),
  ]);

  return {
    data: data.map(sanitiseTeacher),
    total,
    page: numericPage,
    limit: numericLimit,
  };
};

const getById = async (id) => {
  const teacher = await Teacher.findById(id)
    .select('-password')
    .populate(teacherPopulate);

  if (!teacher) {
    throw new AppError('Teacher not found.', 404);
  }

  return sanitiseTeacher(teacher);
};

const update = async (id, data, adminId) => {
  const updateData = { ...data, updatedBy: adminId };

  delete updateData.password;
  delete updateData.sessionKey;
  delete updateData.role;

  if (updateData.domainId) {
    await ensureDomainExists(updateData.domainId);
  }

  const teacher = await Teacher.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true },
  )
    .select('-password')
    .populate(teacherPopulate);

  if (!teacher) {
    throw new AppError('Teacher not found.', 404);
  }

  if (teacher.status === 'inactive') {
    await Session.updateMany(
      { userId: teacher._id, userModel: 'Teacher', isActive: true },
      { isActive: false },
    );
    await Teacher.findByIdAndUpdate(teacher._id, { sessionKey: null });
    teacher.sessionKey = null;
  }

  return sanitiseTeacher(teacher);
};

const remove = async (id) => {
  const teacher = await Teacher.findByIdAndDelete(id).select('-password');

  if (!teacher) {
    throw new AppError('Teacher not found.', 404);
  }

  await Session.deleteMany({ userId: teacher._id, userModel: 'Teacher' });
};

const changePassword = async (teacherId, { currentPassword, newPassword }) => {
  if (!currentPassword || !newPassword) {
    throw new AppError('currentPassword and newPassword are required.', 400);
  }

  if (currentPassword === newPassword) {
    throw new AppError('New password must be different from the current password.', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters.', 400);
  }

  const teacher = await Teacher.findById(teacherId).select('+password');
  if (!teacher) {
    throw new AppError('Teacher not found.', 404);
  }

  const isMatch = await teacher.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect.', 401);
  }

  teacher.password = newPassword;
  teacher.mustChangePassword = false;
  teacher.isPasswordTemporary = false;
  teacher.updatedBy = teacher._id;
  await teacher.save();

  return sanitiseTeacher(teacher);
};

module.exports = { create, list, getById, update, remove, changePassword };