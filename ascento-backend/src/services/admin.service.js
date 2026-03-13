const Student = require('../models/student.model');
const Teacher = require('../models/teacher.model');
const Parent = require('../models/parent.model');
const User = require('../models/user.model');
const Domain = require('../models/domain.model');
const ClassModel = require('../models/class.model');
const Subject = require('../models/subject.model');
const Attendance = require('../models/attendance.model');
const Exam = require('../models/exam.model');
const Mark = require('../models/mark.model');
const Result = require('../models/result.model');
const OnlineClass = require('../models/onlineClass.model');
const TeacherApplication = require('../models/teacherApplication.model');
const StudentAdmission = require('../models/studentAdmission.model');

const teacherService = require('./teacher.service');
const studentService = require('./student.service');
const classService = require('./class.service');
const subjectService = require('./subject.service');
const teacherApplicationService = require('./teacherApplication.service');
const studentAdmissionService = require('./studentAdmission.service');

async function analytics() {
  const [
    students,
    teachers,
    parents,
    domains,
    classes,
    subjects,
    attendance,
    exams,
    marks,
    results,
    studentsByDomain
  ] = await Promise.all([
    Student.countDocuments(),
    Teacher.countDocuments(),
    Parent.countDocuments(),
    Domain.countDocuments(),
    ClassModel.countDocuments(),
    Subject.countDocuments(),
    Attendance.countDocuments(),
    Exam.countDocuments(),
    Mark.countDocuments(),
    Result.countDocuments(),
    Student.aggregate([
      { $group: { _id: '$domainId', count: { $sum: 1 } } },
      { $lookup: { from: 'domains', localField: '_id', foreignField: '_id', as: 'domain' } },
      { $unwind: '$domain' },
      { $project: { _id: 0, domain: '$domain.name', code: '$domain.code', count: 1 } }
    ])
  ]);

  return {
    totals: {
      students,
      teachers,
      parents,
      domains,
      classes,
      subjects,
      attendance,
      exams,
      marks,
      results
    },
    studentsByDomain
  };
}

async function dashboard() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    totalDomains,
    attendanceToday,
    upcomingClasses,
    domains,
    recentStudents,
    recentApplications,
    recentAdmissions,
    recentOnlineClasses
  ] = await Promise.all([
    Student.countDocuments(),
    Teacher.countDocuments(),
    ClassModel.countDocuments(),
    Domain.countDocuments(),
    Attendance.countDocuments({ date: { $gte: todayStart, $lt: todayEnd } }),
    OnlineClass.find({ startDateTime: { $gte: new Date() }, isActive: true })
      .populate('classId', 'className section')
      .populate('subjectId', 'name')
      .populate('teacherId', 'name')
      .sort({ startDateTime: 1 })
      .limit(10),
    Domain.find().select('name code createdAt').sort({ createdAt: -1 }).limit(20),
    Student.find().sort({ createdAt: -1 }).limit(5).select('fullName rollNumber createdAt'),
    TeacherApplication.find().sort({ createdAt: -1 }).limit(5).select('fullName status createdAt'),
    StudentAdmission.find().sort({ createdAt: -1 }).limit(5).select('studentFullName status createdAt'),
    OnlineClass.find().sort({ createdAt: -1 }).limit(5).select('title createdAt')
  ]);

  const recentActivities = [
    ...recentStudents.map((item) => ({
      type: 'student_created',
      message: `Student created: ${item.fullName} (${item.rollNumber})`,
      createdAt: item.createdAt
    })),
    ...recentApplications.map((item) => ({
      type: 'teacher_application',
      message: `Teacher application ${item.status}: ${item.fullName}`,
      createdAt: item.createdAt
    })),
    ...recentAdmissions.map((item) => ({
      type: 'student_admission_application',
      message: `Student admission ${item.status}: ${item.studentFullName}`,
      createdAt: item.createdAt
    })),
    ...recentOnlineClasses.map((item) => ({
      type: 'online_class_scheduled',
      message: `Online class scheduled: ${item.title}`,
      createdAt: item.createdAt
    }))
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20);

  return {
    totalStudents,
    totalTeachers,
    totalClasses,
    totalDomains,
    attendanceToday,
    upcomingClasses,
    domains,
    recentActivities
  };
}

async function createTeacher(payload) {
  return teacherService.createTeacher(payload);
}

async function createStudent(payload) {
  return studentService.createStudent(payload);
}

async function createClass(payload) {
  return classService.createClass(payload);
}

async function createSubject(payload) {
  return subjectService.createSubject(payload);
}

async function assignTeacher(payload) {
  const result = {};

  if (payload.classId) {
    result.classAssignment = await classService.assignTeacherToClass(payload.classId, payload.teacherId);
  }

  if (payload.subjectId) {
    result.subjectAssignment = await subjectService.assignTeacherToSubject(
      payload.subjectId,
      payload.teacherId
    );
  }

  return result;
}

async function teacherApplications(query) {
  return teacherApplicationService.listTeacherApplications(query);
}

async function studentApplications(query) {
  return studentAdmissionService.listAdmissionApplications(query);
}

async function approveTeacherApplication(applicationId, adminUserId) {
  return teacherApplicationService.approveTeacherApplication(applicationId, adminUserId);
}

async function approveStudentApplication(applicationId, adminUserId, payload) {
  return studentAdmissionService.approveAdmissionApplication(applicationId, adminUserId, payload);
}

async function rejectTeacherApplication(applicationId, adminUserId, remark) {
  return teacherApplicationService.rejectTeacherApplication(applicationId, adminUserId, remark);
}

async function rejectStudentApplication(applicationId, adminUserId, remark) {
  return studentAdmissionService.rejectAdmissionApplication(applicationId, adminUserId, remark);
}

async function exportStudentsSheet() {
  const students = await Student.find()
    .populate('domainId', 'name code')
    .populate('classId', 'className section')
    .sort({ fullName: 1 });

  const rows = [
    [
      'fullName',
      'rollNumber',
      'domain',
      'className',
      'section',
      'parentName',
      'parentPhone',
      'admissionDate'
    ]
  ];

  students.forEach((student) => {
    rows.push([
      student.fullName,
      student.rollNumber,
      student.domainId ? student.domainId.name : '',
      student.className || (student.classId ? student.classId.className : ''),
      student.section || (student.classId ? student.classId.section : ''),
      student.parentName,
      student.parentPhone,
      student.admissionDate ? new Date(student.admissionDate).toISOString().slice(0, 10) : ''
    ]);
  });

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csv;
}

async function exportStudentReportCard(studentId) {
  const student = await Student.findById(studentId)
    .populate('domainId', 'name')
    .populate('classId', 'className section')
    .populate('parentId', 'name phone');

  if (!student) throw { status: 404, message: 'Student not found' };

  const result = await Result.findOne({ studentId })
    .populate('examId', 'name examType examDate')
    .sort({ publishedAt: -1 });

  if (!result) throw { status: 404, message: 'No generated result found for this student' };

  const attendanceTotal = await Attendance.countDocuments({ studentId });
  const attendancePresent = await Attendance.countDocuments({ studentId, status: 'present' });
  const attendancePercent =
    attendanceTotal > 0 ? ((attendancePresent / attendanceTotal) * 100).toFixed(2) : '0.00';

  const lines = [];
  lines.push('SCHOOL ERP REPORT CARD');
  lines.push('');
  lines.push(`Student: ${student.fullName}`);
  lines.push(`Roll Number: ${student.rollNumber}`);
  lines.push(`Domain: ${student.domainId ? student.domainId.name : ''}`);
  lines.push(`Class: ${student.className} ${student.section}`);
  lines.push(`Parent: ${student.parentName} (${student.parentPhone})`);
  lines.push(`Exam: ${result.examId ? result.examId.name : ''}`);
  lines.push('');
  lines.push('Subject-wise Marks:');

  result.subjectWise.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.subjectName}: ${item.obtainedMarks}/${item.totalMarks}`);
  });

  lines.push('');
  lines.push(`Total: ${result.totalObtained}/${result.totalMarks}`);
  lines.push(`Percentage: ${result.percentage}%`);
  lines.push(`Grade: ${result.grade}`);
  lines.push(`Attendance: ${attendancePresent}/${attendanceTotal} (${attendancePercent}%)`);

  return lines.join('\n');
}

async function cleanupDemoData() {
  const summary = {
    studentsDeleted: 0,
    parentsDeleted: 0,
    teachersDeleted: 0,
    teacherApplicationsDeleted: 0,
    usersDeleted: 0,
    subjectsDeleted: 0,
    classesDeleted: 0,
    domainsDeleted: 0
  };

  const studentDocs = await Student.find({
    $or: [
      { rollNumber: /^STD\d+$/i },
      { fullName: /^Student\s+\d+$/i },
      { parentEmail: /^parent\d+@example\.com$/i }
    ]
  }).select('_id userId parentId');

  const studentIds = studentDocs.map((s) => s._id);
  const parentIdsFromStudents = studentDocs
    .map((s) => s.parentId)
    .filter(Boolean)
    .map((id) => id.toString());
  const userIdsFromStudents = studentDocs
    .map((s) => s.userId)
    .filter(Boolean)
    .map((id) => id.toString());

  if (studentIds.length) {
    const result = await Student.deleteMany({ _id: { $in: studentIds } });
    summary.studentsDeleted = result.deletedCount || 0;
  }

  const teacherDocs = await Teacher.find({
    $or: [{ email: /^teacher\d+@schoolerp\.com$/i }, { phone: /^90000000\d{2}$/ }]
  }).select('_id userId');

  const teacherIds = teacherDocs.map((t) => t._id);
  const userIdsFromTeachers = teacherDocs
    .map((t) => t.userId)
    .filter(Boolean)
    .map((id) => id.toString());

  if (teacherIds.length) {
    const result = await Teacher.deleteMany({ _id: { $in: teacherIds } });
    summary.teachersDeleted = result.deletedCount || 0;
  }

  const parentResult = await Parent.deleteMany({
    $or: [
      { _id: { $in: parentIdsFromStudents } },
      { email: /^parent\d+@example\.com$/i },
      { phone: /^91\d{8}$/ }
    ]
  });
  summary.parentsDeleted = parentResult.deletedCount || 0;

  const appResult = await TeacherApplication.deleteMany({
    $or: [
      { email: /^apply\.teacher\d+@mail\.com$/i },
      { fullName: /^Applicant Teacher\s+\d+$/i }
    ]
  });
  summary.teacherApplicationsDeleted = appResult.deletedCount || 0;

  const userResult = await User.deleteMany({
    $or: [
      { _id: { $in: [...userIdsFromStudents, ...userIdsFromTeachers] } },
      { email: /^teacher\d+@schoolerp\.com$/i },
      { email: /^parent\d+@example\.com$/i },
      { username: /^student/i }
    ],
    role: { $ne: 'admin' }
  });
  summary.usersDeleted = userResult.deletedCount || 0;

  const demoDomains = await Domain.find({
    code: { $in: ['VEDIC_MATH', 'ABACUS', 'GENERIC_SCHOOL'] }
  }).select('_id');
  const demoDomainIds = demoDomains.map((d) => d._id);

  const classesResult = await ClassModel.deleteMany({ domainId: { $in: demoDomainIds } });
  summary.classesDeleted = classesResult.deletedCount || 0;

  const subjectsResult = await Subject.deleteMany({ domainId: { $in: demoDomainIds } });
  summary.subjectsDeleted = subjectsResult.deletedCount || 0;

  const domainsResult = await Domain.deleteMany({ _id: { $in: demoDomainIds } });
  summary.domainsDeleted = domainsResult.deletedCount || 0;

  return summary;
}

module.exports = {
  analytics,
  dashboard,
  createTeacher,
  createStudent,
  createClass,
  createSubject,
  assignTeacher,
  teacherApplications,
  studentApplications,
  approveTeacherApplication,
  approveStudentApplication,
  rejectTeacherApplication,
  rejectStudentApplication,
  cleanupDemoData,
  exportStudentsSheet,
  exportStudentReportCard
};
