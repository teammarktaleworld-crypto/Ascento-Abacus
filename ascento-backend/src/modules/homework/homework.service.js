'use strict';

const AppError = require('../../core/AppError');
const ClassModel = require('../../models/class.model');
const Homework = require('../../models/homework.model');
const Section = require('../../models/Section.model');
const StudentEnrollment = require('../../models/StudentEnrollment.model');
const Subject = require('../../models/subject.model');
const Teacher = require('../../models/teacher.model');
const TeacherAssignment = require('../../models/TeacherAssignment.model');

const homeworkPopulate = [
  { path: 'classId', populate: { path: 'domainId' } },
  { path: 'sectionId', populate: { path: 'classId' } },
  { path: 'subjectId', populate: { path: 'classId' } },
  { path: 'teacherId', select: '-password' },
];

const populateHomeworkQuery = (query) => {
  homeworkPopulate.forEach((populate) => {
    query.populate(populate);
  });
  return query;
};

const normalizeDueDate = (value) => {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError('dueDate must be a valid date.', 400);
  }

  parsedDate.setUTCHours(0, 0, 0, 0);
  return parsedDate;
};

const normalizeAttachments = (attachments) => {
  if (attachments === undefined) {
    return [];
  }

  if (!Array.isArray(attachments)) {
    throw new AppError('attachments must be an array of strings.', 400);
  }

  if (attachments.some((item) => typeof item !== 'string')) {
    throw new AppError('attachments must be an array of strings.', 400);
  }

  return attachments.map((item) => item.trim()).filter(Boolean);
};

const loadValidatedReferences = async ({ classId, sectionId, subjectId, teacherId }) => {
  const [classItem, section, subject, teacher] = await Promise.all([
    ClassModel.findById(classId),
    Section.findById(sectionId),
    Subject.findById(subjectId),
    Teacher.findById(teacherId).select('-password'),
  ]);

  if (!classItem) throw new AppError('Class not found.', 404);
  if (!section) throw new AppError('Section not found.', 404);
  if (!subject) throw new AppError('Subject not found.', 404);
  if (!teacher) throw new AppError('Teacher not found.', 404);

  if (String(section.classId) !== String(classItem._id)) {
    throw new AppError('Section does not belong to the provided class.', 400);
  }

  if (String(subject.classId) !== String(classItem._id)) {
    throw new AppError('Subject does not belong to the provided class.', 400);
  }

  if (String(teacher.domainId) !== String(classItem.domainId)) {
    throw new AppError('Teacher domain does not match the class domain.', 400);
  }

  return { classItem, section, subject, teacher };
};

const ensureTeacherAssignment = async ({ teacherId, classId, sectionId, subjectId }) => {
  const assignment = await TeacherAssignment.findOne({
    teacherId,
    classId,
    sectionId,
    subjectId,
    status: 'active',
  });

  if (!assignment) {
    throw new AppError('Teacher is not assigned to this class, section, and subject.', 403);
  }

  return assignment;
};

const getCurrentEnrollment = async (studentId) => {
  const activeEnrollment = await StudentEnrollment.findOne({
    studentId,
    status: 'active',
  }).sort({ createdAt: -1 });

  if (activeEnrollment) {
    return activeEnrollment;
  }

  return StudentEnrollment.findOne({ studentId }).sort({ createdAt: -1 });
};

const create = async (data, teacherId) => {
  const dueDate = normalizeDueDate(data.dueDate);
  const attachments = normalizeAttachments(data.attachments);

  await Promise.all([
    loadValidatedReferences({
      classId: data.classId,
      sectionId: data.sectionId,
      subjectId: data.subjectId,
      teacherId,
    }),
    ensureTeacherAssignment({
      teacherId,
      classId: data.classId,
      sectionId: data.sectionId,
      subjectId: data.subjectId,
    }),
  ]);

  const homework = await Homework.create({
    title: data.title,
    description: data.description,
    classId: data.classId,
    sectionId: data.sectionId,
    subjectId: data.subjectId,
    teacherId,
    dueDate,
    attachments,
    createdBy: teacherId,
    updatedBy: teacherId,
  });

  return populateHomeworkQuery(Homework.findById(homework._id));
};

const listForStudent = async (studentId, { page = 1, limit = 20, subjectId } = {}) => {
  const enrollment = await getCurrentEnrollment(studentId);

  if (!enrollment) {
    throw new AppError('No enrollment found for this student.', 404);
  }

  const numericPage = Math.max(Number(page) || 1, 1);
  const numericLimit = Math.max(Number(limit) || 20, 1);
  const skip = (numericPage - 1) * numericLimit;

  const filter = {
    classId: enrollment.classId,
    sectionId: enrollment.sectionId,
  };

  if (subjectId) {
    filter.subjectId = subjectId;
  }

  const dataQuery = Homework.find(filter)
    .sort({ dueDate: 1, createdAt: -1 })
    .skip(skip)
    .limit(numericLimit);

  const [data, total] = await Promise.all([
    populateHomeworkQuery(dataQuery),
    Homework.countDocuments(filter),
  ]);

  return { data, total, page: numericPage, limit: numericLimit };
};

module.exports = { create, listForStudent };