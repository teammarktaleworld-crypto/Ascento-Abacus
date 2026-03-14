'use strict';

const AppError = require('../../core/AppError');
const Exam = require('../../models/exam.model');
const ExamSubject = require('../../models/ExamSubject.model');
const Mark = require('../../models/mark.model');
const StudentEnrollment = require('../../models/StudentEnrollment.model');

const roundToTwo = (value) => Math.round(value * 100) / 100;

const toIdString = (value) => String(value);

const toObjectId = (value) => value;

const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
};

const defaultRemarksByGrade = {
  'A+': 'Outstanding performance',
  A: 'Excellent performance',
  B: 'Good performance',
  C: 'Satisfactory performance',
  D: 'Needs improvement',
  F: 'Significant improvement needed',
};

const calculateSubjectGrade = (obtained, total) => {
  if (!total || total <= 0) {
    return 'F';
  }

  const percentage = (Number(obtained) / Number(total)) * 100;
  return calculateGrade(roundToTwo(percentage));
};

const getExamById = async (examId) => {
  const exam = await Exam.findById(examId).populate([
    { path: 'classId', select: 'name' },
    { path: 'academicYearId', select: 'name startDate endDate status' },
  ]);

  if (!exam) {
    throw new AppError('Exam not found.', 404);
  }

  return exam;
};

const getLatestExamIdForStudent = async (studentId) => {
  const latestMark = await Mark.findOne({ studentId }).sort({ createdAt: -1 }).select('examId');
  if (!latestMark) {
    throw new AppError('No marks found for this student.', 404);
  }

  return latestMark.examId;
};

const resolveExamForStudent = async ({ studentId, examId }) => {
  const resolvedExamId = examId || (await getLatestExamIdForStudent(studentId));
  const exam = await getExamById(resolvedExamId);

  const enrollment = await StudentEnrollment.findOne({
    studentId,
    classId: exam.classId,
  });

  if (!enrollment) {
    throw new AppError('Student is not enrolled in the exam class.', 400);
  }

  return exam;
};

const resolveExamForClass = async ({ classId, examId }) => {
  if (examId) {
    const exam = await getExamById(examId);
    if (toIdString(exam.classId._id || exam.classId) !== toIdString(classId)) {
      throw new AppError('Exam does not belong to the requested class.', 400);
    }
    return exam;
  }

  const latestExam = await Exam.findOne({ classId })
    .sort({ examStartDate: -1, createdAt: -1 })
    .select('_id');

  if (!latestExam) {
    throw new AppError('No exam found for this class.', 404);
  }

  return getExamById(latestExam._id);
};

const getExamSubjects = async (examId) => {
  const examSubjects = await ExamSubject.find({ examId })
    .populate({ path: 'subjectId', select: 'name code' })
    .sort({ examDate: 1, createdAt: 1 });

  if (!examSubjects.length) {
    throw new AppError('No subjects configured for this exam.', 400);
  }

  return examSubjects;
};

const buildRankingMap = async ({ examId, totalMarks }) => {
  const grouped = await Mark.aggregate([
    { $match: { examId: toObjectId(examId) } },
    {
      $group: {
        _id: '$studentId',
        totalObtained: { $sum: '$marksObtained' },
      },
    },
  ]);

  const scoreRows = grouped
    .map((item) => ({
      studentId: toIdString(item._id),
      totalObtained: Number(item.totalObtained) || 0,
      percentage: totalMarks > 0 ? roundToTwo((Number(item.totalObtained) / totalMarks) * 100) : 0,
    }))
    .sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      if (b.totalObtained !== a.totalObtained) return b.totalObtained - a.totalObtained;
      return a.studentId.localeCompare(b.studentId);
    });

  const rankingMap = new Map();
  let previousPercentage = null;
  let previousRank = 0;

  scoreRows.forEach((row, index) => {
    const rank = previousPercentage !== null && row.percentage === previousPercentage
      ? previousRank
      : index + 1;

    rankingMap.set(row.studentId, {
      rank,
      totalObtained: row.totalObtained,
      percentage: row.percentage,
    });

    previousPercentage = row.percentage;
    previousRank = rank;
  });

  return rankingMap;
};

const buildSubjects = ({ examSubjects, marksBySubjectId }) => examSubjects.map((examSubject) => {
  const subjectId = toIdString(examSubject.subjectId?._id || examSubject.subjectId);
  const mark = marksBySubjectId.get(subjectId);
  const marksObtained = mark ? Number(mark.marksObtained) : 0;

  return {
    subjectId,
    subjectName: examSubject.subjectId?.name || null,
    marksObtained,
    totalMarks: Number(examSubject.totalMarks),
    grade: calculateSubjectGrade(marksObtained, Number(examSubject.totalMarks)),
    remarks: mark?.remarks || '',
  };
});

const buildReportCardFromMarks = ({ studentId, exam, examSubjects, marks, rankingMap }) => {
  const marksBySubjectId = new Map(
    marks.map((mark) => [toIdString(mark.subjectId?._id || mark.subjectId), mark]),
  );

  const subjects = buildSubjects({ examSubjects, marksBySubjectId });
  const totalMarks = subjects.reduce((sum, subject) => sum + Number(subject.totalMarks), 0);
  const totalObtained = subjects.reduce((sum, subject) => sum + Number(subject.marksObtained), 0);
  const percentage = totalMarks > 0 ? roundToTwo((totalObtained / totalMarks) * 100) : 0;
  const grade = calculateGrade(percentage);

  const ranking = rankingMap.get(toIdString(studentId));

  return {
    studentId: toIdString(studentId),
    examId: toIdString(exam._id),
    subjects,
    totalMarks,
    percentage,
    grade,
    rank: ranking ? ranking.rank : null,
    remarks: defaultRemarksByGrade[grade],
  };
};

const getStudentReportCard = async ({ studentId, examId }) => {
  const exam = await resolveExamForStudent({ studentId, examId });
  const examSubjects = await getExamSubjects(exam._id);
  const totalMarks = examSubjects.reduce((sum, row) => sum + Number(row.totalMarks), 0);
  const rankingMap = await buildRankingMap({ examId: exam._id, totalMarks });

  const marks = await Mark.find({ studentId, examId: exam._id }).populate({
    path: 'subjectId',
    select: 'name code',
  });

  return buildReportCardFromMarks({
    studentId,
    exam,
    examSubjects,
    marks,
    rankingMap,
  });
};

const getClassReportCards = async ({ classId, examId }) => {
  const exam = await resolveExamForClass({ classId, examId });
  const examSubjects = await getExamSubjects(exam._id);
  const totalMarks = examSubjects.reduce((sum, row) => sum + Number(row.totalMarks), 0);
  const rankingMap = await buildRankingMap({ examId: exam._id, totalMarks });

  if (!rankingMap.size) {
    return [];
  }

  const studentIds = Array.from(rankingMap.keys());

  const marks = await Mark.find({
    examId: exam._id,
    studentId: { $in: studentIds },
  }).populate({ path: 'subjectId', select: 'name code' });

  const marksByStudent = new Map();
  marks.forEach((mark) => {
    const key = toIdString(mark.studentId);
    if (!marksByStudent.has(key)) {
      marksByStudent.set(key, []);
    }
    marksByStudent.get(key).push(mark);
  });

  return studentIds
    .map((studentId) => buildReportCardFromMarks({
      studentId,
      exam,
      examSubjects,
      marks: marksByStudent.get(studentId) || [],
      rankingMap,
    }))
    .sort((a, b) => {
      if (a.rank === null && b.rank === null) return 0;
      if (a.rank === null) return 1;
      if (b.rank === null) return -1;
      return a.rank - b.rank;
    });
};

module.exports = {
  getStudentReportCard,
  getClassReportCards,
};
