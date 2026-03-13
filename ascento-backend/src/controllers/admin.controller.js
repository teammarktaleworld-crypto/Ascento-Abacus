const adminService = require('../services/admin.service');
const asyncHandler = require('../utils/async-handler');

const analytics = asyncHandler(async (req, res) => {
  const data = await adminService.analytics();
  res.json(data);
});

const dashboard = asyncHandler(async (req, res) => {
  const data = await adminService.dashboard();
  res.json(data);
});

const createTeacher = asyncHandler(async (req, res) => {
  const data = await adminService.createTeacher(req.body);
  res.status(201).json(data);
});

const createStudent = asyncHandler(async (req, res) => {
  const data = await adminService.createStudent(req.body);
  res.status(201).json(data);
});

const createClass = asyncHandler(async (req, res) => {
  const data = await adminService.createClass(req.body);
  res.status(201).json(data);
});

const createSubject = asyncHandler(async (req, res) => {
  const data = await adminService.createSubject(req.body);
  res.status(201).json(data);
});

const assignTeacher = asyncHandler(async (req, res) => {
  const data = await adminService.assignTeacher(req.body);
  res.json(data);
});

const teacherApplications = asyncHandler(async (req, res) => {
  const data = await adminService.teacherApplications(req.query);
  res.json(data);
});

const studentApplications = asyncHandler(async (req, res) => {
  const data = await adminService.studentApplications(req.query);
  res.json(data);
});

const approveTeacher = asyncHandler(async (req, res) => {
  const data = await adminService.approveTeacherApplication(req.params.id, req.user.userId);
  res.json(data);
});

const approveStudent = asyncHandler(async (req, res) => {
  const data = await adminService.approveStudentApplication(
    req.params.id,
    req.user.userId,
    req.body
  );
  res.json(data);
});

const rejectTeacher = asyncHandler(async (req, res) => {
  const data = await adminService.rejectTeacherApplication(
    req.params.id,
    req.user.userId,
    req.body.remark
  );
  res.json(data);
});

const rejectStudent = asyncHandler(async (req, res) => {
  const data = await adminService.rejectStudentApplication(
    req.params.id,
    req.user.userId,
    req.body.remark
  );
  res.json(data);
});

const cleanupDemoData = asyncHandler(async (req, res) => {
  const data = await adminService.cleanupDemoData();
  res.json({ message: 'Demo data cleanup completed', summary: data });
});

const exportStudents = asyncHandler(async (req, res) => {
  const csv = await adminService.exportStudentsSheet();
  res.setHeader('Content-Type', 'application/vnd.ms-excel');
  res.setHeader('Content-Disposition', 'attachment; filename="students_sheet.csv"');
  res.send(csv);
});

const exportReportCard = asyncHandler(async (req, res) => {
  const text = await adminService.exportStudentReportCard(req.params.studentId);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="report_card.pdf"');
  res.send(text);
});

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
  approveTeacher,
  approveStudent,
  rejectTeacher,
  rejectStudent,
  cleanupDemoData,
  exportStudents,
  exportReportCard
};
