'use strict';

const AppError = require('../../core/AppError');
const ClassModel = require('../../models/class.model');
const Meeting = require('../../models/Meeting.model');
const Section = require('../../models/Section.model');
const Subject = require('../../models/subject.model');
const Teacher = require('../../models/teacher.model');
const TeacherAssignment = require('../../models/TeacherAssignment.model');

const meetingPopulate = [
  { path: 'classId', populate: { path: 'domainId' } },
  { path: 'sectionId', populate: { path: 'classId' } },
  { path: 'subjectId', populate: { path: 'classId' } },
  { path: 'teacherId', select: '-password' },
];

const populateMeetingQuery = (query) => {
  meetingPopulate.forEach((populate) => {
    query.populate(populate);
  });
  return query;
};

const parseTimeToMinutes = (time, label) => {
  if (typeof time !== 'string' || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time.trim())) {
    throw new AppError(`${label} must be in HH:mm format.`, 400);
  }

  const [hour, minute] = time.trim().split(':').map(Number);
  return (hour * 60) + minute;
};

const normalizeMeetingDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('meetingDate must be a valid date.', 400);
  }

  parsed.setUTCHours(0, 0, 0, 0);
  return parsed;
};

const ensureReferenceIntegrity = async ({ classId, sectionId, subjectId, teacherId }) => {
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
};

const ensureTeacherCanViewClass = async ({ teacherId, classId }) => {
  const assignment = await TeacherAssignment.findOne({
    teacherId,
    classId,
    status: 'active',
  });

  if (!assignment) {
    throw new AppError('Teacher is not assigned to this class.', 403);
  }
};

const create = async (data, teacherId) => {
  const meetingDate = normalizeMeetingDate(data.meetingDate);
  const startMinutes = parseTimeToMinutes(data.startTime, 'startTime');
  const endMinutes = parseTimeToMinutes(data.endTime, 'endTime');

  if (endMinutes <= startMinutes) {
    throw new AppError('endTime must be greater than startTime.', 400);
  }

  await Promise.all([
    ensureReferenceIntegrity({
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

  const meeting = await Meeting.create({
    title: data.title,
    classId: data.classId,
    sectionId: data.sectionId,
    subjectId: data.subjectId,
    teacherId,
    meetingLink: data.meetingLink,
    meetingDate,
    startTime: data.startTime,
    endTime: data.endTime,
    description: data.description,
    createdBy: teacherId,
    updatedBy: teacherId,
  });

  return populateMeetingQuery(Meeting.findById(meeting._id));
};

const listForClass = async ({ classId, requesterRole, requesterId }) => {
  const classItem = await ClassModel.findById(classId);
  if (!classItem) {
    throw new AppError('Class not found.', 404);
  }

  if (requesterRole === 'teacher') {
    await ensureTeacherCanViewClass({ teacherId: requesterId, classId });
  }

  return populateMeetingQuery(
    Meeting.find({ classId }).sort({ meetingDate: 1, startTime: 1, createdAt: -1 }),
  );
};

const listForTeacher = async (teacherId, { classId, sectionId, subjectId } = {}) => {
  const filter = { teacherId };
  if (classId) filter.classId = classId;
  if (sectionId) filter.sectionId = sectionId;
  if (subjectId) filter.subjectId = subjectId;

  return populateMeetingQuery(
    Meeting.find(filter).sort({ meetingDate: 1, startTime: 1, createdAt: -1 }),
  );
};

module.exports = {
  create,
  listForClass,
  listForTeacher,
};
