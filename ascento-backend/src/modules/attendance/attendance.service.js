'use strict';

const AppError = require('../../core/AppError');
const Attendance = require('../../models/attendance.model');
const ClassModel = require('../../models/class.model');
const Section = require('../../models/Section.model');
const Student = require('../../models/student.model');
const StudentEnrollment = require('../../models/StudentEnrollment.model');
const TeacherAssignment = require('../../models/TeacherAssignment.model');

const attendancePopulate = [
  { path: 'studentId', select: '-password' },
  { path: 'classId', populate: { path: 'domainId' } },
  { path: 'sectionId', populate: { path: 'classId' } },
];

const populateAttendanceQuery = (query) => {
  attendancePopulate.forEach((populate) => {
    query.populate(populate);
  });
  return query;
};

const validateAcademicYear = (academicYear) => {
  if (!/^\d{4}-\d{4}$/.test(academicYear)) {
    throw new AppError('academicYear must be in the format YYYY-YYYY.', 400);
  }
};

const normalizeAttendanceDate = (value) => {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError('date must be a valid date.', 400);
  }

  parsedDate.setUTCHours(0, 0, 0, 0);
  return parsedDate;
};

const loadValidatedReferences = async ({ studentId, classId, sectionId, academicYear }) => {
  const [student, classItem, section, enrollment] = await Promise.all([
    Student.findById(studentId).select('-password'),
    ClassModel.findById(classId),
    Section.findById(sectionId),
    StudentEnrollment.findOne({ studentId, classId, sectionId, academicYear }),
  ]);

  if (!student) throw new AppError('Student not found.', 404);
  if (!classItem) throw new AppError('Class not found.', 404);
  if (!section) throw new AppError('Section not found.', 404);
  if (!enrollment) throw new AppError('Student is not enrolled in the provided class, section, and academic year.', 400);

  if (String(section.classId) !== String(classItem._id)) {
    throw new AppError('Section does not belong to the provided class.', 400);
  }

  if (String(student.domainId) !== String(classItem.domainId)) {
    throw new AppError('Student domain does not match the class domain.', 400);
  }

  return { student, classItem, section, enrollment };
};

const ensureTeacherCanTakeAttendance = async ({ teacherId, classId, sectionId, academicYear }) => {
  const assignment = await TeacherAssignment.findOne({
    teacherId,
    classId,
    sectionId,
    academicYear,
    status: 'active',
  });

  if (!assignment) {
    throw new AppError('Teacher is not assigned to this class and section for the provided academic year.', 403);
  }

  return assignment;
};

const create = async (data, teacherId) => {
  validateAcademicYear(data.academicYear);
  const normalizedDate = normalizeAttendanceDate(data.date);

  await Promise.all([
    loadValidatedReferences(data),
    ensureTeacherCanTakeAttendance({
      teacherId,
      classId: data.classId,
      sectionId: data.sectionId,
      academicYear: data.academicYear,
    }),
  ]);

  const attendance = await Attendance.create({
    ...data,
    date: normalizedDate,
    createdBy: teacherId,
    updatedBy: teacherId,
  });

  return populateAttendanceQuery(Attendance.findById(attendance._id));
};

const list = async ({ page = 1, limit = 20, studentId, classId, sectionId, academicYear, status, date } = {}) => {
  const numericPage = Math.max(Number(page) || 1, 1);
  const numericLimit = Math.max(Number(limit) || 20, 1);
  const filter = {};

  if (studentId) filter.studentId = studentId;
  if (classId) filter.classId = classId;
  if (sectionId) filter.sectionId = sectionId;
  if (academicYear) filter.academicYear = academicYear;
  if (status) filter.status = status;
  if (date) filter.date = normalizeAttendanceDate(date);

  const skip = (numericPage - 1) * numericLimit;
  const dataQuery = Attendance.find(filter)
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(numericLimit);

  const [data, total] = await Promise.all([
    populateAttendanceQuery(dataQuery),
    Attendance.countDocuments(filter),
  ]);

  return { data, total, page: numericPage, limit: numericLimit };
};

const listForStudent = async (studentId, filters = {}) => {
  return list({ ...filters, studentId });
};

module.exports = { create, list, listForStudent };