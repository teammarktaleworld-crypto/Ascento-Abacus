require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/user.model');
const Domain = require('../models/domain.model');
const ClassModel = require('../models/class.model');
const Subject = require('../models/subject.model');
const Teacher = require('../models/teacher.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const TeacherApplication = require('../models/teacherApplication.model');

const DEMO_DOMAIN_CODES = ['VEDIC_MATH', 'ABACUS', 'GENERIC_SCHOOL'];

async function run() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_erp';
  await connectDB(mongoUri);

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
    $or: [
      { email: /^teacher\d+@schoolerp\.com$/i },
      { phone: /^90000000\d{2}$/ }
    ]
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

  const demoDomains = await Domain.find({ code: { $in: DEMO_DOMAIN_CODES } }).select('_id');
  const demoDomainIds = demoDomains.map((d) => d._id);

  const classesResult = await ClassModel.deleteMany({ domainId: { $in: demoDomainIds } });
  summary.classesDeleted = classesResult.deletedCount || 0;

  const subjectsResult = await Subject.deleteMany({ domainId: { $in: demoDomainIds } });
  summary.subjectsDeleted = subjectsResult.deletedCount || 0;

  const domainsResult = await Domain.deleteMany({ _id: { $in: demoDomainIds } });
  summary.domainsDeleted = domainsResult.deletedCount || 0;

  console.log('Demo data cleanup summary:');
  console.table(summary);

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('Cleanup failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
