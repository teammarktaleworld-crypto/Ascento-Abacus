require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/user.model');
const Domain = require('../models/domain.model');
const ClassModel = require('../models/class.model');
const Subject = require('../models/subject.model');
const Teacher = require('../models/teacher.model');
const Student = require('../models/student.model');

const { hashPassword } = require('../utils/password');
const teacherService = require('../services/teacher.service');
const studentService = require('../services/student.service');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@school.com';
  const password = process.env.ADMIN_PASSWORD || 'admin@123';

  // Clean up any users with null email first
  await User.deleteMany({ email: null });

  const existing = await User.findOne({ email, role: 'admin' });
  if (existing) {
    return { created: false, email, password: 'already_set' };
  }

  await User.create({
    fullName: 'Super Admin',
    email,
    password: await hashPassword(password),
    role: 'admin'
  });

  return { created: true, email, password };
}

async function seedDomainsAndClasses() {
  const domainPayload = [
    { name: 'Vedic Math', code: 'VEDIC_MATH', description: 'Vedic Math programs' },
    { name: 'Abacus', code: 'ABACUS', description: 'Abacus programs' },
    { name: 'Generic School', code: 'GENERIC_SCHOOL', description: 'Class 1-12 mainstream' }
  ];

  const domains = {};

  for (const payload of domainPayload) {
    let domain = await Domain.findOne({ code: payload.code });
    if (!domain) domain = await Domain.create(payload);
    domains[payload.code] = domain;
  }

  for (let cls = 1; cls <= 12; cls += 1) {
    await ClassModel.findOneAndUpdate(
      {
        domainId: domains.GENERIC_SCHOOL._id,
        className: `Class ${cls}`,
        section: 'A'
      },
      {
        domainId: domains.GENERIC_SCHOOL._id,
        className: `Class ${cls}`,
        standardNumber: cls,
        section: 'A'
      },
      { upsert: true, new: true }
    );
  }

  for (let level = 1; level <= 8; level += 1) {
    await ClassModel.findOneAndUpdate(
      {
        domainId: domains.ABACUS._id,
        className: `Level ${level}`,
        section: 'A'
      },
      {
        domainId: domains.ABACUS._id,
        className: `Level ${level}`,
        section: 'A'
      },
      { upsert: true, new: true }
    );
  }

  for (let level = 1; level <= 4; level += 1) {
    await ClassModel.findOneAndUpdate(
      {
        domainId: domains.VEDIC_MATH._id,
        className: `Level ${level}`,
        section: 'A'
      },
      {
        domainId: domains.VEDIC_MATH._id,
        className: `Level ${level}`,
        section: 'A'
      },
      { upsert: true, new: true }
    );
  }

  return domains;
}

async function seedSubjects(domains) {
  const genericClasses = await ClassModel.find({ domainId: domains.GENERIC_SCHOOL._id }).sort({ standardNumber: 1 });

  const genericSubjects = [
    { name: 'Math', code: 'MATH' },
    { name: 'Science', code: 'SCI' },
    { name: 'English', code: 'ENG' },
    { name: 'Social Science', code: 'SST' },
    { name: 'Computer', code: 'COMP' }
  ];

  for (const classDoc of genericClasses) {
    for (const subject of genericSubjects) {
      await Subject.findOneAndUpdate(
        { classId: classDoc._id, name: subject.name },
        {
          domainId: domains.GENERIC_SCHOOL._id,
          classId: classDoc._id,
          name: subject.name,
          code: subject.code
        },
        { upsert: true, new: true }
      );
    }
  }
}

async function seedTeachers(domains) {
  const genericClasses = await ClassModel.find({ domainId: domains.GENERIC_SCHOOL._id })
    .sort({ standardNumber: 1 })
    .limit(10);

  const teacherSeedData = [
    { name: 'Amit Sharma', email: 'teacher1@schoolerp.com', phone: '9000000001' },
    { name: 'Neha Verma', email: 'teacher2@schoolerp.com', phone: '9000000002' },
    { name: 'Raj Mehta', email: 'teacher3@schoolerp.com', phone: '9000000003' },
    { name: 'Pooja Iyer', email: 'teacher4@schoolerp.com', phone: '9000000004' },
    { name: 'Karan Singh', email: 'teacher5@schoolerp.com', phone: '9000000005' }
  ];

  const created = [];
  const existing = [];

  for (let i = 0; i < teacherSeedData.length; i += 1) {
    const item = teacherSeedData[i];
    const exists = await Teacher.findOne({ email: item.email });

    const classOne = genericClasses[(i * 2) % genericClasses.length];
    const classTwo = genericClasses[(i * 2 + 1) % genericClasses.length];

    if (exists) {
      existing.push(item.email);
      continue;
    }

    const newTeacher = await teacherService.createTeacher({
      name: item.name,
      email: item.email,
      phone: item.phone,
      domainIds: [domains.GENERIC_SCHOOL._id],
      subjectIds: [],
      assignedClassIds: [classOne._id, classTwo._id],
      experience: 4 + i,
      qualification: 'B.Ed, M.A',
      password: 'Teacher@123'
    });

    created.push(newTeacher.credentials);
  }

  return { created, existing };
}

function padNumber(num, digits) {
  return String(num).padStart(digits, '0');
}

async function seedStudents(domains) {
  const classes = await ClassModel.find({
    domainId: domains.GENERIC_SCHOOL._id,
    standardNumber: { $gte: 1, $lte: 10 }
  }).sort({ standardNumber: 1 });

  const created = [];
  const existing = [];

  for (let i = 1; i <= 50; i += 1) {
    const rollNumber = `STD${1000 + i}`;
    const already = await Student.findOne({ rollNumber });

    if (already) {
      existing.push(rollNumber);
      continue;
    }

    const classDoc = classes[(i - 1) % classes.length];

    const student = await studentService.createStudent({
      fullName: `Student ${i}`,
      dateOfBirth: `201${(i % 9) + 1}-0${((i % 9) + 1)}-10`,
      gender: i % 2 === 0 ? 'male' : 'female',
      domainId: domains.GENERIC_SCHOOL._id.toString(),
      classId: classDoc._id.toString(),
      className: classDoc.className,
      section: 'A',
      rollNumber,
      parentName: `Parent ${i}`,
      parentPhone: `91${padNumber(i, 8)}`,
      parentEmail: `parent${i}@example.com`,
      address: 'New Delhi',
      admissionDate: '2025-04-01',
      previousSchool: `Previous School ${i}`,
      previousMarks: [{ examName: 'Previous Final', percentage: 70 + (i % 25), year: 2024 }],
      documents: []
    });

    created.push({
      rollNumber,
      studentCredentials: student.studentCredentials,
      parentCredentials: student.parentCredentials
    });
  }

  return { created, existing };
}

async function run() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/school_erp';
  await connectDB(mongoUri);

  // Clear existing data
  console.log('Clearing existing data...');
  try {
    await mongoose.connection.db.dropCollection('users');
  } catch (error) {
    console.log('Users collection does not exist or already dropped');
  }
  try {
    await mongoose.connection.db.dropCollection('domains');
  } catch (error) {
    console.log('Domains collection does not exist or already dropped');
  }
  try {
    await mongoose.connection.db.dropCollection('classes');
  } catch (error) {
    console.log('Classes collection does not exist or already dropped');
  }
  try {
    await mongoose.connection.db.dropCollection('subjects');
  } catch (error) {
    console.log('Subjects collection does not exist or already dropped');
  }
  try {
    await mongoose.connection.db.dropCollection('teachers');
  } catch (error) {
    console.log('Teachers collection does not exist or already dropped');
  }
  try {
    await mongoose.connection.db.dropCollection('students');
  } catch (error) {
    console.log('Students collection does not exist or already dropped');
  }

  const admin = await seedAdmin();
  const domains = await seedDomainsAndClasses();
  await seedSubjects(domains);
  const teachers = await seedTeachers(domains);
  const students = await seedStudents(domains);

  console.log('\nSEED SUMMARY');
  console.log('Admin:', admin);
  console.log('Teachers created:', teachers.created.length, 'existing:', teachers.existing.length);
  console.log('Students created:', students.created.length, 'existing:', students.existing.length);

  if (teachers.created.length > 0) {
    console.log('Teacher credentials sample:', teachers.created.slice(0, 2));
  }

  if (students.created.length > 0) {
    console.log(
      'Student credentials sample:',
      students.created.slice(0, 3).map((item) => ({
        rollNumber: item.rollNumber,
        student: item.studentCredentials,
        parent: item.parentCredentials
      }))
    );
  }

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('Seed failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
