'use strict';

const AppError = require('../../core/AppError');
const ClassModel = require('../../models/class.model');
const Parent = require('../../models/parent.model');
const Reminder = require('../../models/Reminder.model');
const Student = require('../../models/student.model');
const StudentEnrollment = require('../../models/StudentEnrollment.model');
const Teacher = require('../../models/teacher.model');
const TeacherAssignment = require('../../models/TeacherAssignment.model');

const normalizeReminderDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('reminderDate must be a valid date.', 400);
  }

  return parsed;
};

const ensureTargetExists = async (targetType, targetId) => {
  if (targetType === 'student') {
    const student = await Student.findById(targetId);
    if (!student) throw new AppError('Student target not found.', 404);
    return;
  }

  if (targetType === 'class') {
    const classItem = await ClassModel.findById(targetId);
    if (!classItem) throw new AppError('Class target not found.', 404);
    return;
  }

  if (targetType === 'teacher') {
    const teacher = await Teacher.findById(targetId);
    if (!teacher) throw new AppError('Teacher target not found.', 404);
    return;
  }

  throw new AppError('Invalid targetType.', 400);
};

const create = async (data, adminId) => {
  const reminderDate = normalizeReminderDate(data.reminderDate);
  await ensureTargetExists(data.targetType, data.targetId);

  const reminder = await Reminder.create({
    title: data.title,
    description: data.description,
    targetType: data.targetType,
    targetId: data.targetId,
    reminderDate,
    createdBy: adminId,
    updatedBy: adminId,
  });

  return Reminder.findById(reminder._id);
};

const getTeacherClassIds = async (teacherId) => {
  const assignments = await TeacherAssignment.find({
    teacherId,
    status: 'active',
  }).select('classId');

  return [...new Set(assignments.map((item) => String(item.classId)))];
};

const getStudentClassIds = async (studentId) => {
  const enrollments = await StudentEnrollment.find({ studentId }).select('classId');
  return [...new Set(enrollments.map((item) => String(item.classId)))];
};

const getParentTargets = async (parentId) => {
  const parent = await Parent.findById(parentId).select('children');
  if (!parent || !Array.isArray(parent.children) || !parent.children.length) {
    return { studentIds: [], classIds: [] };
  }

  const studentIds = parent.children.map((id) => String(id));
  const enrollments = await StudentEnrollment.find({ studentId: { $in: parent.children } }).select('classId');
  const classIds = [...new Set(enrollments.map((item) => String(item.classId)))];

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
        { targetType: 'teacher', targetId: user._id },
        { targetType: 'class', targetId: { $in: classIds } },
      ],
    };
  }

  if (user.role === 'student') {
    const classIds = await getStudentClassIds(user._id);
    return {
      $or: [
        { targetType: 'student', targetId: user._id },
        { targetType: 'class', targetId: { $in: classIds } },
      ],
    };
  }

  if (user.role === 'parent') {
    const { studentIds, classIds } = await getParentTargets(user._id);
    return {
      $or: [
        { targetType: 'student', targetId: { $in: studentIds } },
        { targetType: 'class', targetId: { $in: classIds } },
      ],
    };
  }

  return { _id: null };
};

const listForUser = async (user, { targetType, targetId } = {}) => {
  const baseFilter = await buildVisibilityFilter(user);

  const extraFilter = {};
  if (targetType) {
    extraFilter.targetType = targetType;
  }
  if (targetId) {
    extraFilter.targetId = targetId;
  }

  const filter = {
    ...baseFilter,
    ...extraFilter,
  };

  return Reminder.find(filter).sort({ reminderDate: 1, createdAt: -1 });
};

module.exports = {
  create,
  listForUser,
};
