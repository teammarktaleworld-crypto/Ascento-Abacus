'use strict';

const Attendance = require('../../models/attendance.model');
const ClassModel = require('../../models/class.model');
const Enquiry = require('../../models/enquiry.model');
const Fee = require('../../models/fee.model');
const Meeting = require('../../models/Meeting.model');
const Notification = require('../../models/notification.model');
const Student = require('../../models/student.model');
const Subject = require('../../models/subject.model');
const Teacher = require('../../models/teacher.model');

const getDayBounds = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

const getMonthBounds = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
};

const toTwoDecimals = (value) => Math.round(value * 100) / 100;

const getDashboardAnalytics = async () => {
  const now = new Date();
  const { start: startOfToday, end: endOfToday } = getDayBounds(now);
  const { start: startOfMonth, end: endOfMonth } = getMonthBounds(now);

  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    totalSubjects,
    newStudentsToday,
    newTeachersToday,
    attendanceToday,
    feesCollectedAgg,
    pendingFeesAgg,
    upcomingMeetings,
    recentNotices,
    recentEnquiries,
  ] = await Promise.all([
    Student.countDocuments(),
    Teacher.countDocuments(),
    ClassModel.countDocuments(),
    Subject.countDocuments(),
    Student.countDocuments({ createdAt: { $gte: startOfToday, $lt: endOfToday } }),
    Teacher.countDocuments({ createdAt: { $gte: startOfToday, $lt: endOfToday } }),
    Attendance.aggregate([
      {
        $match: {
          date: { $gte: startOfToday, $lt: endOfToday },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $eq: ['$status', 'present'] }, 1, 0],
            },
          },
        },
      },
    ]),
    Fee.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          paymentDate: { $gte: startOfMonth, $lt: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
        },
      },
    ]),
    Fee.aggregate([
      {
        $match: {
          paymentStatus: 'pending',
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
        },
      },
    ]),
    Meeting.find({ meetingDate: { $gte: startOfToday } })
      .sort({ meetingDate: 1, startTime: 1 })
      .limit(5)
      .populate({ path: 'classId', select: 'name' })
      .populate({ path: 'sectionId', select: 'name' })
      .populate({ path: 'subjectId', select: 'name code' })
      .populate({ path: 'teacherId', select: 'name email' })
      .lean(),
    Notification.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title message targetType targetId createdAt status')
      .lean(),
    Enquiry.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName email phoneNumber classInterested status createdAt')
      .lean(),
  ]);

  const attendanceTotal = attendanceToday[0]?.total || 0;
  const attendancePresent = attendanceToday[0]?.present || 0;
  const attendanceTodayPercentage =
    attendanceTotal > 0 ? toTwoDecimals((attendancePresent / attendanceTotal) * 100) : 0;

  return {
    totalStudents,
    totalTeachers,
    totalClasses,
    totalSubjects,
    newStudentsToday,
    newTeachersToday,
    attendanceTodayPercentage,
    feesCollectedThisMonth: feesCollectedAgg[0]?.totalAmount || 0,
    pendingFees: pendingFeesAgg[0]?.totalAmount || 0,
    upcomingMeetings,
    recentNotices,
    recentEnquiries,
  };
};

module.exports = {
  getDashboardAnalytics,
};