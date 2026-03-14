'use strict';

const AppError = require('../../core/AppError');
const ClassModel = require('../../models/class.model');
const Notification = require('../../models/notification.model');
const Parent = require('../../models/parent.model');
const Student = require('../../models/student.model');
const StudentEnrollment = require('../../models/StudentEnrollment.model');
const Teacher = require('../../models/teacher.model');
const TeacherAssignment = require('../../models/TeacherAssignment.model');

const ensureTargetExists = async (targetType, targetId) => {
  if (targetType === 'broadcast') {
    return;
  }

  if (!targetId) {
    throw new AppError('targetId is required for this targetType.', 400);
  }

  if (targetType === 'student') {
    const student = await Student.findById(targetId);
    if (!student) throw new AppError('Student target not found.', 404);
    return;
  }

  if (targetType === 'teacher') {
    const teacher = await Teacher.findById(targetId);
    if (!teacher) throw new AppError('Teacher target not found.', 404);
    return;
  }

  if (targetType === 'class') {
    const classItem = await ClassModel.findById(targetId);
    if (!classItem) throw new AppError('Class target not found.', 404);
    return;
  }

  throw new AppError('Invalid targetType.', 400);
};

const create = async (data, adminId) => {
  await ensureTargetExists(data.targetType, data.targetId);

  return Notification.create({
    title: data.title,
    message: data.message,
    targetType: data.targetType,
    targetId: data.targetType === 'broadcast' ? null : data.targetId,
    createdBy: adminId,
    status: data.status || 'active',
    updatedBy: adminId,
  });
};

const getTeacherClassIds = async (teacherId) => {
  const assignments = await TeacherAssignment.find({ teacherId, status: 'active' }).select('classId');
  return [...new Set(assignments.map((row) => String(row.classId)))];
};

const getStudentClassIds = async (studentId) => {
  const enrollments = await StudentEnrollment.find({ studentId }).select('classId');
  return [...new Set(enrollments.map((row) => String(row.classId)))];
};

const getParentTargets = async (parentId) => {
  const parent = await Parent.findById(parentId).select('children');
  if (!parent || !Array.isArray(parent.children) || !parent.children.length) {
    return { studentIds: [], classIds: [] };
  }

  const studentIds = parent.children.map((id) => String(id));
  const enrollments = await StudentEnrollment.find({ studentId: { $in: parent.children } }).select('classId');
  const classIds = [...new Set(enrollments.map((row) => String(row.classId)))];
  return { studentIds, classIds };
};

const buildVisibilityFilter = async (user) => {
  if (user.role === 'admin') {
    return {};
  }

  if (user.role === 'teacher') {
    const classIds = await getTeacherClassIds(user._id);
    return {
      $or: [
        { targetType: 'broadcast' },
        { targetType: 'teacher', targetId: user._id },
        { targetType: 'class', targetId: { $in: classIds } },
      ],
    };
  }

  if (user.role === 'student') {
    const classIds = await getStudentClassIds(user._id);
    return {
      $or: [
        { targetType: 'broadcast' },
        { targetType: 'student', targetId: user._id },
        { targetType: 'class', targetId: { $in: classIds } },
      ],
    };
  }

  if (user.role === 'parent') {
    const { studentIds, classIds } = await getParentTargets(user._id);
    return {
      $or: [
        { targetType: 'broadcast' },
        { targetType: 'student', targetId: { $in: studentIds } },
        { targetType: 'class', targetId: { $in: classIds } },
      ],
    };
  }

  return { _id: null };
};

const listForUser = async (user, { status, targetType } = {}) => {
  const visibility = await buildVisibilityFilter(user);

  const filter = {
    ...visibility,
  };

  if (status) {
    filter.status = status;
  }

  if (targetType) {
    filter.targetType = targetType;
  }

  return Notification.find(filter)
    .populate({ path: 'createdBy', select: '-password' })
    .sort({ createdAt: -1 });
};

module.exports = {
  create,
  listForUser,
};
