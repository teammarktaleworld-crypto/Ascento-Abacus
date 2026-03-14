'use strict';

const AppError = require('../../core/AppError');
const Exam = require('../../models/exam.model');
const ExamSubject = require('../../models/ExamSubject.model');
const Subject = require('../../models/subject.model');

const examSubjectPopulate = [
  {
    path: 'examId',
    populate: [
      { path: 'classId', populate: { path: 'domainId' } },
      { path: 'academicYearId', select: 'name startDate endDate status' },
    ],
  },
  { path: 'subjectId', populate: { path: 'classId' } },
];

const populateExamSubjectQuery = (query) => {
  examSubjectPopulate.forEach((populate) => {
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

const parseTimeToMinutes = (timeValue, fieldName) => {
  if (typeof timeValue !== 'string') {
    throw new AppError(`${fieldName} must be in HH:mm format.`, 400);
  }

  const trimmed = timeValue.trim();
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(trimmed)) {
    throw new AppError(`${fieldName} must be in HH:mm format.`, 400);
  }

  const [hours, minutes] = trimmed.split(':').map(Number);
  return (hours * 60) + minutes;
};

const validateMarks = (totalMarks, passingMarks) => {
  const numericTotal = Number(totalMarks);
  const numericPassing = Number(passingMarks);

  if (!Number.isFinite(numericTotal) || numericTotal < 1) {
    throw new AppError('totalMarks must be a number greater than or equal to 1.', 400);
  }

  if (!Number.isFinite(numericPassing) || numericPassing < 0) {
    throw new AppError('passingMarks must be a number greater than or equal to 0.', 400);
  }

  if (numericPassing > numericTotal) {
    throw new AppError('passingMarks cannot be greater than totalMarks.', 400);
  }

  return {
    totalMarks: numericTotal,
    passingMarks: numericPassing,
  };
};

const loadValidatedReferences = async ({ examId, subjectId, examDate, startTime, endTime, totalMarks, passingMarks }) => {
  const [exam, subject] = await Promise.all([
    Exam.findById(examId).populate('academicYearId'),
    Subject.findById(subjectId),
  ]);

  if (!exam) throw new AppError('Exam not found.', 404);
  if (!subject) throw new AppError('Subject not found.', 404);

  if (String(subject.classId) !== String(exam.classId)) {
    throw new AppError('Subject does not belong to the exam class.', 400);
  }

  const normalizedExamDate = normalizeDate(examDate, 'examDate');
  const examStart = normalizeDate(exam.examStartDate, 'examStartDate');
  const examEnd = normalizeDate(exam.examEndDate, 'examEndDate');

  if (normalizedExamDate < examStart || normalizedExamDate > examEnd) {
    throw new AppError('examDate must be within the exam date range.', 400);
  }

  const startMinutes = parseTimeToMinutes(startTime, 'startTime');
  const endMinutes = parseTimeToMinutes(endTime, 'endTime');
  if (startMinutes >= endMinutes) {
    throw new AppError('startTime must be earlier than endTime.', 400);
  }

  const marks = validateMarks(totalMarks, passingMarks);

  return {
    exam,
    subject,
    examDate: normalizedExamDate,
    startTime: startTime.trim(),
    endTime: endTime.trim(),
    ...marks,
  };
};

const create = async (data, adminId) => {
  const validated = await loadValidatedReferences(data);

  const examSubject = await ExamSubject.create({
    examId: data.examId,
    subjectId: data.subjectId,
    totalMarks: validated.totalMarks,
    passingMarks: validated.passingMarks,
    examDate: validated.examDate,
    startTime: validated.startTime,
    endTime: validated.endTime,
    createdBy: adminId,
    updatedBy: adminId,
  });

  return populateExamSubjectQuery(ExamSubject.findById(examSubject._id));
};

const listByExam = async (examId) => {
  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new AppError('Exam not found.', 404);
  }

  return populateExamSubjectQuery(
    ExamSubject.find({ examId }).sort({ examDate: 1, startTime: 1, createdAt: -1 }),
  );
};

const update = async (id, data, adminId) => {
  const existing = await ExamSubject.findById(id);
  if (!existing) {
    throw new AppError('Exam subject not found.', 404);
  }

  const payload = {
    examId: data.examId || existing.examId,
    subjectId: data.subjectId || existing.subjectId,
    totalMarks: data.totalMarks !== undefined ? data.totalMarks : existing.totalMarks,
    passingMarks: data.passingMarks !== undefined ? data.passingMarks : existing.passingMarks,
    examDate: data.examDate || existing.examDate,
    startTime: data.startTime || existing.startTime,
    endTime: data.endTime || existing.endTime,
  };

  const validated = await loadValidatedReferences(payload);

  await ExamSubject.findByIdAndUpdate(
    id,
    {
      examId: payload.examId,
      subjectId: payload.subjectId,
      totalMarks: validated.totalMarks,
      passingMarks: validated.passingMarks,
      examDate: validated.examDate,
      startTime: validated.startTime,
      endTime: validated.endTime,
      updatedBy: adminId,
    },
    { runValidators: true },
  );

  return populateExamSubjectQuery(ExamSubject.findById(id));
};

const remove = async (id) => {
  const deleted = await ExamSubject.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError('Exam subject not found.', 404);
  }
};

module.exports = {
  create,
  listByExam,
  update,
  remove,
};