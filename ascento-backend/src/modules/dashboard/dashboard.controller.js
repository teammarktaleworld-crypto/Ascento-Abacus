'use strict';

const ApiResponse = require('../../core/ApiResponse');
const asyncHandler = require('../../core/asyncHandler');
const dashboardService = require('./dashboard.service');

const getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboardAnalytics();
  return new ApiResponse(200, 'Dashboard analytics fetched', data).send(res);
});

// Student dashboard: aggregates attendance, homework, fees, exams, timetable, meetLinks
const getStudentDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  // Fetch attendance
  const attendanceService = require('../attendance/attendance.service');
  const homeworkService = require('../homework/homework.service');
  const feeService = require('../fee/fee.service');
  const examService = require('../exam/exam.service');
  const timetableService = require('../timetable/timetable.service');
  const meetingService = require('../meeting/meeting.service');
  const studentEnrollmentService = require('../student-enrollment/student-enrollment.service');

  // Attendance summary
  const attendance = await attendanceService.listForStudent(userId);
  // Pending homework
  const pendingHomework = await homeworkService.listForStudent(userId, { status: 'pending' });
  // Pending fees
  const pendingFees = await feeService.listForStudent(userId, { paymentStatus: 'pending' });
  // Timetable for today/week
  const enrollment = await studentEnrollmentService.getCurrentClass(userId);
  const timetableToday = await timetableService.listForStudent(userId, { dayOfWeek: new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase() });
  const timetableWeek = await timetableService.listForStudent(userId);
  // Upcoming exams
  const upcomingExams = await examService.listForStudent(userId, { status: 'active' });
  // Meet links
  const meetLinks = await meetingService.listForClass({ classId: enrollment.classId, requesterRole: 'student', requesterId: userId });

  // Structure response for frontend
  const response = {
    attendance: attendance.data ? {
      daily: attendance.data.length,
      weekly: attendance.data.length, // Placeholder, add real aggregation
      monthly: attendance.data.length // Placeholder, add real aggregation
    } : {},
    pendingHomework: pendingHomework.data || [],
    pendingFees: pendingFees.data || [],
    timetable: timetableToday.entries || [],
    upcomingExams: upcomingExams.data || [],
    meetLinks: meetLinks || [],
  };
  return new ApiResponse(200, 'Student dashboard fetched', response).send(res);
});

const getTeacherDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getTeacherDashboardAnalytics(req.user._id);
  return new ApiResponse(200, 'Teacher dashboard fetched', data).send(res);
});

module.exports = {
  getDashboard,
  getStudentDashboard,
  getTeacherDashboard,
};