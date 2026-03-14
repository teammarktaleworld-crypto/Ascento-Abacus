'use strict';

const AppError = require('../../core/AppError');
const AcademicYear = require('../../models/AcademicYear.model');
const ClassModel = require('../../models/class.model');
const Exam = require('../../models/exam.model');
const StudentEnrollment = require('../../models/StudentEnrollment.model');
const TeacherAssignment = require('../../models/TeacherAssignment.model');

const examPopulate = [
  { path: 'classId', populate: { path: 'domainId' } },
  { path: 'academicYearId', select: 'name startDate endDate status' },
];

const populateExamQuery = (query) => {
  examPopulate.forEach((populate) => {
    query.populate(populate);
  });
  return query;
};

const normalizeDate = (value, fieldName) => {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError(`${fieldName} must be a valid date.`, 400);
  }

  parsedDate.setUTCHours(0, 0, 0, 0);
  return parsedDate;
};

const validateDateRange = (startDate, endDate, startField, endField) => {
  if (startDate > endDate) {
    throw new AppError(`${startField} must be earlier than or equal to ${endField}.`, 400);
  }
};

const validateExamWithinAcademicYear = (examStartDate, examEndDate, academicYear) => {
  const yearStart = new Date(academicYear.startDate);
  const yearEnd = new Date(academicYear.endDate);

  if (examStartDate < yearStart || examEndDate > yearEnd) {
    throw new AppError('Exam dates must fall within the selected academic year.', 400);
  }
};

const ensureClassExists = async (classId) => {
  const classItem = await ClassModel.findById(classId);
  if (!classItem) {
    throw new AppError('Class not found.', 404);
  }

  return classItem;
};

const ensureAcademicYearExists = async (academicYearId) => {
  const academicYear = await AcademicYear.findById(academicYearId);
  if (!academicYear) {
    throw new AppError('Academic year not found.', 404);
  }

  return academicYear;
};

const getActiveAcademicYear = async () => {
  const activeAcademicYear = await AcademicYear.findOne({ status: 'active' }).sort({ startDate: -1, createdAt: -1 });

  if (!activeAcademicYear) {
    throw new AppError('No active academic year found.', 404);
  }

  return activeAcademicYear;
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

const create = async (data, adminId) => {
  const examStartDate = normalizeDate(data.examStartDate, 'examStartDate');
  const examEndDate = normalizeDate(data.examEndDate, 'examEndDate');
  validateDateRange(examStartDate, examEndDate, 'examStartDate', 'examEndDate');

  const [academicYear] = await Promise.all([
    ensureAcademicYearExists(data.academicYearId),
    ensureClassExists(data.classId),
  ]);

  validateExamWithinAcademicYear(examStartDate, examEndDate, academicYear);

  const exam = await Exam.create({
    ...data,
    examStartDate,
    examEndDate,
    createdBy: adminId,
    updatedBy: adminId,
  });

  return populateExamQuery(Exam.findById(exam._id));
};

const list = async ({ page = 1, limit = 20, classId, academicYearId, status } = {}) => {
  const numericPage = Math.max(Number(page) || 1, 1);
  const numericLimit = Math.max(Number(limit) || 20, 1);
  const filter = {};

  if (classId) filter.classId = classId;
  if (academicYearId) filter.academicYearId = academicYearId;
  if (status) filter.status = status;

  const skip = (numericPage - 1) * numericLimit;
  const dataQuery = Exam.find(filter)
    .sort({ examStartDate: 1, createdAt: -1 })
    .skip(skip)
    .limit(numericLimit);

  const [data, total] = await Promise.all([
    populateExamQuery(dataQuery),
    Exam.countDocuments(filter),
  ]);

  return { data, total, page: numericPage, limit: numericLimit };
};

const getById = async (id) => {
  const exam = await populateExamQuery(Exam.findById(id));
  if (!exam) {
    throw new AppError('Exam not found.', 404);
  }

  return exam;
};

const update = async (id, data, adminId) => {
  const existing = await Exam.findById(id);
  if (!existing) {
    throw new AppError('Exam not found.', 404);
  }

  const classId = data.classId || existing.classId;
  const academicYearId = data.academicYearId || existing.academicYearId;
  const examStartDate = data.examStartDate ? normalizeDate(data.examStartDate, 'examStartDate') : existing.examStartDate;
  const examEndDate = data.examEndDate ? normalizeDate(data.examEndDate, 'examEndDate') : existing.examEndDate;

  validateDateRange(examStartDate, examEndDate, 'examStartDate', 'examEndDate');

  const [academicYear] = await Promise.all([
    ensureAcademicYearExists(academicYearId),
    ensureClassExists(classId),
  ]);

  validateExamWithinAcademicYear(examStartDate, examEndDate, academicYear);

  await Exam.findByIdAndUpdate(
    id,
    {
      ...data,
      classId,
      academicYearId,
      examStartDate,
      examEndDate,
      updatedBy: adminId,
    },
    { new: true, runValidators: true },
  );

  return populateExamQuery(Exam.findById(id));
};

const remove = async (id) => {
  const exam = await Exam.findByIdAndDelete(id);
  if (!exam) {
    throw new AppError('Exam not found.', 404);
  }
};

const ensureTeacherCanViewClassExams = async (teacherId, classId, academicYearId) => {
  if (academicYearId) {
    await ensureAcademicYearExists(academicYearId);
  }

  const assignment = await TeacherAssignment.findOne({
    teacherId,
    classId,
    status: 'active',
  });

  if (!assignment) {
    throw new AppError('Teacher is not assigned to the provided class for the academic year.', 403);
  }
};

const listByClass = async (classId, { academicYearId, status } = {}) => {
  await ensureClassExists(classId);

  const targetAcademicYearId = academicYearId || (await getActiveAcademicYear())._id;
  if (academicYearId) {
    await ensureAcademicYearExists(academicYearId);
  }

  const filter = {
    classId,
    academicYearId: targetAcademicYearId,
  };

  if (status) {
    filter.status = status;
  }

  return populateExamQuery(Exam.find(filter).sort({ examStartDate: 1, createdAt: -1 }));
};

const listForStudent = async (studentId, { academicYearId, status } = {}) => {
  const enrollment = await getCurrentEnrollment(studentId);
  if (!enrollment) {
    throw new AppError('No enrollment found for this student.', 404);
  }

  const targetAcademicYearId = academicYearId || (await getActiveAcademicYear())._id;
  if (academicYearId) {
    await ensureAcademicYearExists(academicYearId);
  }

  const filter = {
    classId: enrollment.classId,
    academicYearId: targetAcademicYearId,
  };

  if (status) {
    filter.status = status;
  }

  return populateExamQuery(Exam.find(filter).sort({ examStartDate: 1, createdAt: -1 }));
};

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
  ensureTeacherCanViewClassExams,
  listByClass,
  listForStudent,
};