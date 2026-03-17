'use strict';

const express = require('express');
const authRoutes = require('../auth/auth.routes');
const academicYearPublicRoutes = require('../modules/academic-year/academic-year.public.routes');
const teacherAttendanceRoutes = require('../modules/attendance/teacher.routes');
const classExamRoutes = require('../modules/exam/exam.class.routes');
const studentExamRoutes = require('../modules/exam/exam.student.routes');
const enquiryPublicRoutes = require('../modules/enquiry/enquiry.public.routes');
const eventRoutes = require('../modules/event/event.routes');
const studentFeeRoutes = require('../modules/fee/student.routes');
const studentHomeworkRoutes = require('../modules/homework/student.routes');
const studentMarksRoutes = require('../modules/marks/student.routes');
const classMeetingRoutes = require('../modules/meeting/class.routes');
const notificationRoutes = require('../modules/notification/notification.routes');
const classReportCardRoutes = require('../modules/report-card/class.routes');
const reminderRoutes = require('../modules/reminder/reminder.routes');
const studentReportCardRoutes = require('../modules/report-card/student.routes');
const classTimetableRoutes = require('../modules/timetable/class.routes');
const studentTimetableRoutes = require('../modules/timetable/student.routes');
const teacherMeetingRoutes = require('../modules/meeting/teacher.routes');
const teacherMarksRoutes = require('../modules/marks/teacher.routes');
const teacherHomeworkRoutes = require('../modules/homework/teacher.routes');
const teacherTimetableRoutes = require('../modules/timetable/teacher.routes');
const { authRouter: adminAuthRoutes, adminRouter: adminRoutes } = require('../modules/admin/admin.routes');
const studentSelfRoutes = require('../modules/student-enrollment/student.self.routes');
const teacherSelfRoutes = require('../modules/teacher/teacher.self.routes');
const teacherContentRoutes = require('../modules/content/content.routes');

const router = express.Router();

// Health check — no auth required
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 200,
    message: 'Server is up and running',
    timestamp: new Date().toISOString(),
  });
});

// Generic auth (login with role, /me, logout-all)
router.use('/auth', authRoutes);

// Website enquiry API → POST /api/enquiry
router.use('/', enquiryPublicRoutes);

// Reminder API → GET /api/reminders
router.use('/', reminderRoutes);

// Notification API → GET /api/notifications
router.use('/', notificationRoutes);

// Event API → GET /api/events
router.use('/', eventRoutes);

// Public academic year API → GET /api/academic-years/active
router.use('/academic-years', academicYearPublicRoutes);

// Admin auth  → POST /api/auth/admin/login | POST /api/auth/admin/logout
router.use('/auth/admin', adminAuthRoutes);
// Teacher content API → CRUD /api/teacher/content
router.use('/teacher', teacherContentRoutes);

// Admin API   → GET  /api/admin/profile | PUT /api/admin/change-password
router.use('/admin', adminRoutes);

// Teacher self-service API → POST /api/teachers/change-password
router.use('/teachers', teacherSelfRoutes);

// Teacher attendance API → POST /api/teacher/attendance
router.use('/teacher', teacherAttendanceRoutes);

// Teacher homework API → POST /api/teacher/homework
router.use('/teacher', teacherHomeworkRoutes);

// Teacher marks API → POST/PUT/GET /api/teacher/marks
router.use('/teacher', teacherMarksRoutes);

// Teacher meetings API → POST/GET /api/teacher/meetings
router.use('/teacher', teacherMeetingRoutes);

// Teacher timetable API → GET /api/teacher/timetable
router.use('/teacher', teacherTimetableRoutes);

// Class exams API → GET /api/class/exams/:classId
router.use('/class', classExamRoutes);

// Class report cards API → GET /api/class/report-cards/:classId
router.use('/class', classReportCardRoutes);

// Class meetings API → GET /api/class/meetings/:classId
router.use('/class', classMeetingRoutes);

// Class timetable API → GET /api/class/timetable/:classId
router.use('/class', classTimetableRoutes);

// Student self-service API → GET /api/student/current-class
router.use('/student', studentSelfRoutes);

// Student homework API → GET /api/student/homework
router.use('/student', studentHomeworkRoutes);

// Student exams API → GET /api/student/exams
router.use('/student', studentExamRoutes);

// Student marks API → GET /api/student/marks
router.use('/student', studentMarksRoutes);

// Student report card API → GET /api/student/report-card
router.use('/student', studentReportCardRoutes);

// Student fee API → GET /api/student/fees
router.use('/student', studentFeeRoutes);

// Student timetable API → GET /api/student/timetable
router.use('/student', studentTimetableRoutes);

module.exports = router;
