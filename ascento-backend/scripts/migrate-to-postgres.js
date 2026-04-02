#!/usr/bin/env node
'use strict';

/**
 * ─── MongoDB → PostgreSQL Migration Script ───────────────────────────────────
 *
 * Reads all data from the existing MongoDB database and inserts it into
 * PostgreSQL via Prisma. Run this AFTER you have:
 *
 *   1. Set DATABASE_URL in .env to your PostgreSQL connection string
 *   2. Run `npx prisma migrate dev --name init` to create the tables
 *   3. Ensured MongoDB is still running and MONGO_URI is set
 *
 * Usage:
 *   node scripts/migrate-to-postgres.js
 *
 * The script is idempotent — it uses upsert so re-running is safe.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// ─── MongoDB Models ──────────────────────────────────────────────────────────

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('ERROR: MONGO_URI env var is required');
  process.exit(1);
}

// Helper: convert MongoDB ObjectId to string UUID-compatible ID
const idMap = new Map(); // oldMongoId → newUUID

function mapId(mongoId) {
  if (!mongoId) return null;
  const key = mongoId.toString();
  if (!idMap.has(key)) {
    // Generate a deterministic UUID-like string from the MongoDB ObjectId
    // This ensures the same MongoDB ID always maps to the same PG ID
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(key).digest('hex');
    const uuid = [
      hash.slice(0, 8),
      hash.slice(8, 12),
      '4' + hash.slice(13, 16),
      '8' + hash.slice(17, 20),
      hash.slice(20, 32),
    ].join('-');
    idMap.set(key, uuid);
  }
  return idMap.get(key);
}

// ─── Migration Functions ─────────────────────────────────────────────────────

async function migrateDomains() {
  const Domain = mongoose.model('Domain');
  const docs = await Domain.find().lean();
  console.log(`  Migrating ${docs.length} domains...`);
  for (const d of docs) {
    await prisma.domain.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        name: d.name,
        code: d.code,
        description: d.description || '',
        status: d.status || 'active',
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

async function migrateAcademicYears() {
  const AcademicYear = mongoose.model('AcademicYear');
  const docs = await AcademicYear.find().lean();
  console.log(`  Migrating ${docs.length} academic years...`);
  for (const d of docs) {
    await prisma.academicYear.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        name: d.name,
        startDate: d.startDate,
        endDate: d.endDate,
        status: d.status || 'inactive',
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

async function migrateAdmins() {
  const Admin = mongoose.model('Admin');
  const docs = await Admin.find().select('+password').lean();
  console.log(`  Migrating ${docs.length} admins...`);
  for (const d of docs) {
    await prisma.admin.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        name: d.name,
        email: d.email,
        password: d.password, // already hashed
        phone: d.phone || null,
        isActive: d.isActive !== false,
        profileImage: d.profileImage || null,
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

async function migrateStudents() {
  const Student = mongoose.model('Student');
  const docs = await Student.find().select('+password').lean();
  console.log(`  Migrating ${docs.length} students...`);
  for (const d of docs) {
    await prisma.student.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        fullName: d.fullName,
        password: d.password,
        gender: d.gender || 'other',
        dateOfBirth: d.dateOfBirth || null,
        age: d.age || null,
        parentName: d.parentName,
        parentPhone: d.parentPhone,
        parentEmail: d.parentEmail,
        domainId: mapId(d.domainId),
        userId: d.userId,
        rollNumber: d.rollNumber,
        address: d.address || null,
        city: d.city || null,
        state: d.state || null,
        bloodGroup: d.bloodGroup || null,
        profilePhoto: d.profilePhoto || null,
        isPasswordTemporary: d.isPasswordTemporary || false,
        status: d.status || 'active',
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

async function migrateTeachers() {
  const Teacher = mongoose.model('Teacher');
  const docs = await Teacher.find().select('+password').lean();
  console.log(`  Migrating ${docs.length} teachers...`);
  for (const d of docs) {
    await prisma.teacher.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        userId: d.userId,
        name: d.name,
        email: d.email,
        password: d.password,
        phone: d.phone || null,
        domainId: mapId(d.domainId),
        status: d.status || 'active',
        address: d.address || null,
        city: d.city || null,
        state: d.state || null,
        country: d.country || null,
        dateOfBirth: d.dateOfBirth || null,
        gender: d.gender || null,
        qualification: d.qualification || null,
        experienceYears: d.experienceYears || 0,
        joiningDate: d.joiningDate || null,
        profilePhoto: d.profilePhoto || null,
        mustChangePassword: d.mustChangePassword || false,
        isPasswordTemporary: d.isPasswordTemporary || false,
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

async function migrateParents() {
  const Parent = mongoose.model('Parent');
  const docs = await Parent.find().select('+password').lean();
  console.log(`  Migrating ${docs.length} parents...`);
  for (const d of docs) {
    await prisma.parent.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        name: d.name,
        email: d.email,
        password: d.password,
        phone: d.phone || null,
        occupation: d.occupation || null,
        relation: d.relation || 'guardian',
        isActive: d.isActive !== false,
        profileImage: d.profileImage || null,
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
    // Migrate children junction
    if (d.children && d.children.length > 0) {
      for (const childId of d.children) {
        try {
          await prisma.parentChild.upsert({
            where: { parentId_studentId: { parentId: mapId(d._id), studentId: mapId(childId) } },
            create: { parentId: mapId(d._id), studentId: mapId(childId) },
            update: {},
          });
        } catch (e) {
          console.warn(`    Skipping parent-child link: ${e.message}`);
        }
      }
    }
  }
}

async function migrateClasses() {
  const Class = mongoose.model('Class');
  const docs = await Class.find().lean();
  console.log(`  Migrating ${docs.length} classes...`);
  for (const d of docs) {
    await prisma.class.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        name: d.name,
        domainId: mapId(d.domainId),
        description: d.description || '',
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

async function migrateSections() {
  const Section = mongoose.model('Section');
  const docs = await Section.find().lean();
  console.log(`  Migrating ${docs.length} sections...`);
  for (const d of docs) {
    await prisma.section.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        name: d.name,
        classId: mapId(d.classId),
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

async function migrateSubjects() {
  const Subject = mongoose.model('Subject');
  const docs = await Subject.find().lean();
  console.log(`  Migrating ${docs.length} subjects...`);
  for (const d of docs) {
    await prisma.subject.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        name: d.name,
        code: d.code,
        classId: mapId(d.classId),
        description: d.description || '',
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

async function migrateEnrollments() {
  const Enrollment = mongoose.model('StudentEnrollment');
  const docs = await Enrollment.find().lean();
  console.log(`  Migrating ${docs.length} student enrollments...`);
  for (const d of docs) {
    await prisma.studentEnrollment.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        studentId: mapId(d.studentId),
        classId: mapId(d.classId),
        sectionId: mapId(d.sectionId),
        academicYear: d.academicYear,
        status: d.status || 'active',
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

async function migrateTeacherAssignments() {
  const TA = mongoose.model('TeacherAssignment');
  const docs = await TA.find().lean();
  console.log(`  Migrating ${docs.length} teacher assignments...`);
  for (const d of docs) {
    await prisma.teacherAssignment.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        teacherId: mapId(d.teacherId),
        classId: mapId(d.classId),
        sectionId: mapId(d.sectionId),
        subjectId: mapId(d.subjectId),
        academicYear: d.academicYear,
        status: d.status || 'active',
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

async function migrateAttendance() {
  const Attendance = mongoose.model('Attendance');
  const docs = await Attendance.find().lean();
  console.log(`  Migrating ${docs.length} attendance records...`);
  for (const d of docs) {
    await prisma.attendance.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        studentId: mapId(d.studentId),
        classId: mapId(d.classId),
        sectionId: mapId(d.sectionId),
        academicYear: d.academicYear,
        date: d.date,
        status: d.status,
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

async function migrateFees() {
  const Fee = mongoose.model('Fee');
  const docs = await Fee.find().lean();
  console.log(`  Migrating ${docs.length} fee records...`);
  for (const d of docs) {
    await prisma.fee.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        studentId: mapId(d.studentId),
        classId: mapId(d.classId),
        academicYearId: mapId(d.academicYearId),
        feeType: d.feeType,
        amount: d.amount,
        dueDate: d.dueDate,
        paymentStatus: d.paymentStatus || 'pending',
        paymentDate: d.paymentDate || null,
        paymentMethod: d.paymentMethod || null,
        transactionReference: d.transactionReference || null,
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

async function migrateExams() {
  const Exam = mongoose.model('Exam');
  const docs = await Exam.find().lean();
  console.log(`  Migrating ${docs.length} exams...`);
  for (const d of docs) {
    await prisma.exam.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        examName: d.examName,
        classId: mapId(d.classId),
        academicYearId: mapId(d.academicYearId),
        examStartDate: d.examStartDate,
        examEndDate: d.examEndDate,
        description: d.description || '',
        status: d.status || 'active',
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

async function migrateExamSubjects() {
  const ES = mongoose.model('ExamSubject');
  const docs = await ES.find().lean();
  console.log(`  Migrating ${docs.length} exam subjects...`);
  for (const d of docs) {
    await prisma.examSubject.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        examId: mapId(d.examId),
        subjectId: mapId(d.subjectId),
        totalMarks: d.totalMarks,
        passingMarks: d.passingMarks,
        examDate: d.examDate,
        startTime: d.startTime,
        endTime: d.endTime,
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

async function migrateMarks() {
  const Mark = mongoose.model('Mark');
  const docs = await Mark.find().lean();
  console.log(`  Migrating ${docs.length} marks...`);
  for (const d of docs) {
    await prisma.mark.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        studentId: mapId(d.studentId),
        examId: mapId(d.examId),
        subjectId: mapId(d.subjectId),
        marksObtained: d.marksObtained,
        remarks: d.remarks || '',
        enteredByTeacherId: mapId(d.enteredByTeacherId),
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

async function migrateHomework() {
  const Homework = mongoose.model('Homework');
  const docs = await Homework.find().lean();
  console.log(`  Migrating ${docs.length} homework items...`);
  for (const d of docs) {
    await prisma.homework.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        title: d.title,
        description: d.description || '',
        classId: mapId(d.classId),
        sectionId: mapId(d.sectionId),
        subjectId: mapId(d.subjectId),
        teacherId: mapId(d.teacherId),
        dueDate: d.dueDate,
        attachments: d.attachments || [],
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

async function migrateTimetables() {
  const TT = mongoose.model('Timetable');
  const docs = await TT.find().lean();
  console.log(`  Migrating ${docs.length} timetable entries...`);
  for (const d of docs) {
    await prisma.timetable.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        classId: mapId(d.classId),
        sectionId: mapId(d.sectionId),
        subjectId: mapId(d.subjectId),
        teacherId: mapId(d.teacherId),
        academicYearId: mapId(d.academicYearId),
        dayOfWeek: d.dayOfWeek,
        periodNumber: d.periodNumber,
        startTime: d.startTime,
        endTime: d.endTime,
        status: d.status || 'active',
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

async function migrateMeetings() {
  const Meeting = mongoose.model('Meeting');
  const docs = await Meeting.find().lean();
  console.log(`  Migrating ${docs.length} meetings...`);
  for (const d of docs) {
    await prisma.meeting.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        title: d.title,
        classId: mapId(d.classId),
        sectionId: mapId(d.sectionId),
        subjectId: mapId(d.subjectId),
        teacherId: mapId(d.teacherId),
        meetingLink: d.meetingLink,
        meetingDate: d.meetingDate,
        startTime: d.startTime,
        endTime: d.endTime,
        description: d.description || '',
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

async function migrateNotifications() {
  const Notif = mongoose.model('Notification');
  const docs = await Notif.find().lean();
  console.log(`  Migrating ${docs.length} notifications...`);
  for (const d of docs) {
    await prisma.notification.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        notificationId: d.notificationId || mapId(d._id),
        title: d.title,
        message: d.message,
        targetType: d.targetType,
        targetId: d.targetId ? mapId(d.targetId) : null,
        createdById: mapId(d.createdBy),
        status: d.status || 'active',
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

async function migrateEvents() {
  const Event = mongoose.model('Event');
  const docs = await Event.find().lean();
  console.log(`  Migrating ${docs.length} events...`);
  for (const d of docs) {
    await prisma.event.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        title: d.title,
        description: d.description || '',
        eventDate: d.eventDate,
        location: d.location || '',
        attachments: d.attachments || [],
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

async function migrateReminders() {
  const Reminder = mongoose.model('Reminder');
  const docs = await Reminder.find().lean();
  console.log(`  Migrating ${docs.length} reminders...`);
  for (const d of docs) {
    await prisma.reminder.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        title: d.title,
        description: d.description || '',
        targetType: d.targetType,
        targetId: mapId(d.targetId),
        reminderDate: d.reminderDate,
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

async function migrateEnquiries() {
  const Enquiry = mongoose.model('Enquiry');
  const docs = await Enquiry.find().lean();
  console.log(`  Migrating ${docs.length} enquiries...`);
  for (const d of docs) {
    const statusMap = { 'new': 'new', 'in-progress': 'in_progress', 'closed': 'closed' };
    await prisma.enquiry.upsert({
      where: { id: mapId(d._id) },
      create: {
        id: mapId(d._id),
        fullName: d.fullName,
        email: d.email,
        phoneNumber: d.phoneNumber,
        classInterested: d.classInterested,
        message: d.message,
        status: statusMap[d.status] || 'new',
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
      },
      update: {},
    });
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  MongoDB → PostgreSQL Migration');
  console.log('═══════════════════════════════════════════════\n');

  // Connect MongoDB
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('✓ MongoDB connected\n');

  // Load all Mongoose models
  require('../src/models/admin.model');
  require('../src/models/student.model');
  require('../src/models/teacher.model');
  require('../src/models/parent.model');
  require('../src/models/class.model');
  require('../src/models/Section.model');
  require('../src/models/subject.model');
  require('../src/models/domain.model');
  require('../src/models/attendance.model');
  require('../src/models/fee.model');
  require('../src/models/mark.model');
  require('../src/models/exam.model');
  require('../src/models/ExamSubject.model');
  require('../src/models/homework.model');
  require('../src/models/Timetable.model');
  require('../src/models/StudentEnrollment.model');
  require('../src/models/TeacherAssignment.model');
  require('../src/models/Meeting.model');
  require('../src/models/notification.model');
  require('../src/models/event.model');
  require('../src/models/Reminder.model');
  require('../src/models/enquiry.model');

  // Migrate in dependency order
  console.log('Starting migration...\n');

  // 1. Independent tables first
  await migrateDomains();
  await migrateAcademicYears();
  await migrateAdmins();

  // 2. Tables depending on Domain
  await migrateStudents();
  await migrateTeachers();
  await migrateParents();

  // 3. Tables depending on Domain → Class
  await migrateClasses();
  await migrateSections();
  await migrateSubjects();

  // 4. Junction / relationship tables
  await migrateEnrollments();
  await migrateTeacherAssignments();

  // 5. Operational data
  await migrateAttendance();
  await migrateExams();
  await migrateExamSubjects();
  await migrateMarks();
  await migrateFees();
  await migrateHomework();
  await migrateTimetables();
  await migrateMeetings();

  // 6. Communication
  await migrateNotifications();
  await migrateEvents();
  await migrateReminders();
  await migrateEnquiries();

  console.log('\n═══════════════════════════════════════════════');
  console.log('  ✓ Migration complete!');
  console.log(`  Total IDs mapped: ${idMap.size}`);
  console.log('═══════════════════════════════════════════════\n');

  await mongoose.disconnect();
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('\n✗ Migration failed:', err);
  process.exit(1);
});
