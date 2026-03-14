'use strict';

const AppError = require('../../core/AppError');
const Exam = require('../../models/exam.model');
const ExamSubject = require('../../models/ExamSubject.model');
const Mark = require('../../models/mark.model');
const Student = require('../../models/student.model');
const StudentEnrollment = require('../../models/StudentEnrollment.model');
const Subject = require('../../models/subject.model');
const TeacherAssignment = require('../../models/TeacherAssignment.model');

const marksPopulate = [
  { path: 'studentId', select: '-password' },
  {
    path: 'examId',
    populate: [
      { path: 'classId', populate: { path: 'domainId' } },
      { path: 'academicYearId', select: 'name startDate endDate status' },
    ],
  },
  { path: 'subjectId', populate: { path: 'classId' } },
  { path: 'enteredByTeacherId', select: '-password' },
];

const populateMarkQuery = (query) => {
  marksPopulate.forEach((populate) => {
    query.populate(populate);
  });

  return query;
};

const normalizeMarks = (marksObtained) => {
  const numericMarks = Number(marksObtained);
  if (!Number.isFinite(numericMarks) || numericMarks < 0) {
    throw new AppError('marksObtained must be a number greater than or equal to 0.', 400);
  }

  return numericMarks;
};

const ensureTeacherAssigned = async ({ teacherId, classId, subjectId }) => {
  const assignment = await TeacherAssignment.findOne({
    teacherId,
    classId,
    subjectId,
    status: 'active',
  });

  if (!assignment) {
    throw new AppError('Teacher must be assigned to the class and subject.', 403);
  }

  return assignment;
};

const ensureStudentInExamClass = async ({ studentId, classId, academicYearName }) => {
  const [activeEnrollment, yearEnrollment] = await Promise.all([
    StudentEnrollment.findOne({ studentId, classId, status: 'active' }),
    StudentEnrollment.findOne({ studentId, classId, academicYear: academicYearName }),
  ]);

  if (!activeEnrollment && !yearEnrollment) {
    throw new AppError('Student is not enrolled in the exam class.', 400);
  }
};

const loadValidatedReferences = async ({ studentId, examId, subjectId, marksObtained, teacherId }) => {
  const [student, exam, subject, examSubject] = await Promise.all([
    Student.findById(studentId).select('-password'),
    Exam.findById(examId).populate('academicYearId'),
    Subject.findById(subjectId),
    ExamSubject.findOne({ examId, subjectId }),
  ]);

  if (!student) throw new AppError('Student not found.', 404);
  if (!exam) throw new AppError('Exam not found.', 404);
  if (!subject) throw new AppError('Subject not found.', 404);
  if (!examSubject) throw new AppError('Subject is not configured for this exam.', 400);

  if (String(subject.classId) !== String(exam.classId)) {
    throw new AppError('Subject does not belong to the exam class.', 400);
  }

  const numericMarks = normalizeMarks(marksObtained);
  if (numericMarks > examSubject.totalMarks) {
    throw new AppError(`marksObtained cannot exceed totalMarks (${examSubject.totalMarks}).`, 400);
  }

  await Promise.all([
    ensureTeacherAssigned({ teacherId, classId: exam.classId, subjectId }),
    ensureStudentInExamClass({
      studentId,
      classId: exam.classId,
      academicYearName: exam.academicYearId?.name,
    }),
  ]);

  return {
    student,
    exam,
    subject,
    examSubject,
    marksObtained: numericMarks,
  };
};

const create = async (data, teacherId) => {
  const validated = await loadValidatedReferences({
    studentId: data.studentId,
    examId: data.examId,
    subjectId: data.subjectId,
    marksObtained: data.marksObtained,
    teacherId,
  });

  const mark = await Mark.create({
    studentId: data.studentId,
    examId: data.examId,
    subjectId: data.subjectId,
    marksObtained: validated.marksObtained,
    remarks: data.remarks,
    enteredByTeacherId: teacherId,
    createdBy: teacherId,
    updatedBy: teacherId,
  });

  return populateMarkQuery(Mark.findById(mark._id));
};

const update = async (id, data, teacherId) => {
  const existing = await Mark.findById(id);
  if (!existing) {
    throw new AppError('Mark not found.', 404);
  }

  if (String(existing.enteredByTeacherId) !== String(teacherId)) {
    throw new AppError('You can only update marks entered by you.', 403);
  }

  const studentId = data.studentId || existing.studentId;
  const examId = data.examId || existing.examId;
  const subjectId = data.subjectId || existing.subjectId;
  const marksObtained = data.marksObtained !== undefined ? data.marksObtained : existing.marksObtained;

  const validated = await loadValidatedReferences({
    studentId,
    examId,
    subjectId,
    marksObtained,
    teacherId,
  });

  await Mark.findByIdAndUpdate(
    id,
    {
      studentId,
      examId,
      subjectId,
      marksObtained: validated.marksObtained,
      remarks: data.remarks !== undefined ? data.remarks : existing.remarks,
      updatedBy: teacherId,
    },
    { runValidators: true },
  );

  return populateMarkQuery(Mark.findById(id));
};

const listForTeacherByExam = async (teacherId, examId) => {
  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new AppError('Exam not found.', 404);
  }

  const assignments = await TeacherAssignment.find({
    teacherId,
    classId: exam.classId,
    status: 'active',
  }).select('subjectId');

  if (!assignments.length) {
    throw new AppError('Teacher is not assigned to this exam class.', 403);
  }

  const subjectIds = assignments.map((a) => a.subjectId);
  return populateMarkQuery(
    Mark.find({ examId, subjectId: { $in: subjectIds } }).sort({ createdAt: -1 }),
  );
};

const listForStudent = async (studentId, { examId, subjectId } = {}) => {
  const filter = { studentId };
  if (examId) {
    filter.examId = examId;
  }
  if (subjectId) {
    filter.subjectId = subjectId;
  }

  return populateMarkQuery(Mark.find(filter).sort({ createdAt: -1 }));
};

module.exports = {
  create,
  update,
  listForTeacherByExam,
  listForStudent,
};