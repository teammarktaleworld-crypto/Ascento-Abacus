'use strict';

const AppError = require('../../core/AppError');
const ClassModel = require('../../models/class.model');
const Section = require('../../models/Section.model');
const Subject = require('../../models/subject.model');
const Teacher = require('../../models/teacher.model');
const TeacherAssignment = require('../../models/TeacherAssignment.model');

const assignmentPopulate = [
  { path: 'teacherId', select: '-password' },
  { path: 'classId', populate: { path: 'domainId' } },
  { path: 'sectionId', populate: { path: 'classId' } },
  { path: 'subjectId', populate: { path: 'classId' } },
];

const populateAssignmentQuery = (query) => {
  assignmentPopulate.forEach((populate) => {
    query.populate(populate);
  });
  return query;
};

const loadValidatedReferences = async ({ teacherId, classId, sectionId, subjectId }) => {
  const [teacher, classItem, section, subject] = await Promise.all([
    Teacher.findById(teacherId).select('-password'),
    ClassModel.findById(classId),
    Section.findById(sectionId),
    Subject.findById(subjectId),
  ]);

  if (!teacher) throw new AppError('Teacher not found.', 404);
  if (!classItem) throw new AppError('Class not found.', 404);
  if (!section) throw new AppError('Section not found.', 404);
  if (!subject) throw new AppError('Subject not found.', 404);

  if (String(section.classId) !== String(classItem._id)) {
    throw new AppError('Section does not belong to the provided class.', 400);
  }

  if (String(subject.classId) !== String(classItem._id)) {
    throw new AppError('Subject does not belong to the provided class.', 400);
  }

  if (String(teacher.domainId) !== String(classItem.domainId)) {
    throw new AppError('Teacher domain does not match the class domain.', 400);
  }

  return { teacher, classItem, section, subject };
};

const create = async (data, adminId) => {
  await loadValidatedReferences(data);

  const assignment = await TeacherAssignment.create({
    ...data,
    createdBy: adminId,
    updatedBy: adminId,
  });

  return populateAssignmentQuery(TeacherAssignment.findById(assignment._id));
};

const list = async ({ page = 1, limit = 20, teacherId, classId, academicYear, status } = {}) => {
  const numericPage = Math.max(Number(page) || 1, 1);
  const numericLimit = Math.max(Number(limit) || 20, 1);
  const filter = {};

  if (teacherId) filter.teacherId = teacherId;
  if (classId) filter.classId = classId;
  if (academicYear) filter.academicYear = academicYear;
  if (status) filter.status = status;

  const skip = (numericPage - 1) * numericLimit;
  const dataQuery = TeacherAssignment.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(numericLimit);

  const [data, total] = await Promise.all([
    populateAssignmentQuery(dataQuery),
    TeacherAssignment.countDocuments(filter),
  ]);

  return { data, total, page: numericPage, limit: numericLimit };
};

const update = async (id, data, adminId) => {
  const existing = await TeacherAssignment.findById(id);
  if (!existing) {
    throw new AppError('Teacher assignment not found.', 404);
  }

  if (data.academicYear && data.academicYear !== existing.academicYear) {
    throw new AppError('academicYear cannot be changed. Create a new assignment for a new academic year.', 400);
  }

  const merged = {
    teacherId: data.teacherId || existing.teacherId,
    classId: data.classId || existing.classId,
    sectionId: data.sectionId || existing.sectionId,
    subjectId: data.subjectId || existing.subjectId,
  };

  await loadValidatedReferences(merged);

  const assignment = await TeacherAssignment.findByIdAndUpdate(
    id,
    { ...data, updatedBy: adminId },
    { new: true, runValidators: true },
  );

  return populateAssignmentQuery(TeacherAssignment.findById(assignment._id));
};

const remove = async (id) => {
  const assignment = await TeacherAssignment.findByIdAndDelete(id);
  if (!assignment) {
    throw new AppError('Teacher assignment not found.', 404);
  }
};

module.exports = { create, list, update, remove };