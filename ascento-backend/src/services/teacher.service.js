const User = require('../models/user.model');
const Teacher = require('../models/teacher.model');
const ClassModel = require('../models/class.model');
const Subject = require('../models/subject.model');
const Student = require('../models/student.model');
const { parsePagination } = require('../utils/pagination');
const { randomPassword, hashPassword } = require('../utils/password');
const { generateUniquePublicId } = require('../utils/public-id');
const { ROLES } = require('../config/constants');
const { ensureTeacherClassAccess } = require('./access.service');

async function createTeacher(payload) {
  const email = payload.email.toLowerCase();
  const exists = await User.findOne({ $or: [{ email }, { phone: payload.phone }] });
  if (exists) {
    throw { status: 409, message: 'User with same email/phone already exists' };
  }

  const teacherCode = await generateUniquePublicId('TCH', Teacher, 'teacherCode');
  const rawPassword = payload.password || randomPassword(10);
  const user = await User.create({
    fullName: payload.name,
    email,
    phone: payload.phone,
    password: await hashPassword(rawPassword),
    role: ROLES.TEACHER
  });

  const teacher = await Teacher.create({
    userId: user._id,
    teacherCode,
    name: payload.name,
    email,
    phone: payload.phone,
    domainIds: payload.domainIds || [],
    subjectIds: payload.subjectIds || [],
    assignedClassIds: payload.assignedClassIds || [],
    experience: payload.experience,
    qualification: payload.qualification
  });

  user.profileId = teacher._id;
  await user.save();

  return {
    teacher,
    credentials: {
      teacherId: teacherCode,
      email,
      password: rawPassword
    }
  };
}

async function listTeachers(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.search) {
    filter.$or = [
      { teacherCode: new RegExp(query.search, 'i') },
      { name: new RegExp(query.search, 'i') },
      { email: new RegExp(query.search, 'i') },
      { phone: new RegExp(query.search, 'i') }
    ];
  }

  if (query.domainId) {
    filter.domainIds = query.domainId;
  }

  const [data, total] = await Promise.all([
    Teacher.find(filter)
      .populate('domainIds', 'name code')
      .populate('subjectIds', 'name code')
      .populate('assignedClassIds', 'className section')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Teacher.countDocuments(filter)
  ]);

  return { data, total, page, limit };
}

async function getTeacherById(id) {
  const teacher = await Teacher.findById(id)
    .populate('domainIds', 'name code')
    .populate('subjectIds', 'name code')
    .populate('assignedClassIds', 'className section');

  if (!teacher) throw { status: 404, message: 'Teacher not found' };
  return teacher;
}

async function updateTeacher(id, payload) {
  const teacher = await Teacher.findById(id);
  if (!teacher) throw { status: 404, message: 'Teacher not found' };

  const nextEmail = payload.email ? payload.email.toLowerCase() : teacher.email;
  const nextPhone = payload.phone || teacher.phone;

  const duplicateTeacher = await Teacher.findOne({
    _id: { $ne: teacher._id },
    $or: [{ email: nextEmail }, { phone: nextPhone }]
  });
  if (duplicateTeacher) {
    throw { status: 409, message: 'Teacher with same email/phone already exists' };
  }

  const duplicateUser = await User.findOne({
    _id: { $ne: teacher.userId },
    $or: [{ email: nextEmail }, { phone: nextPhone }]
  });
  if (duplicateUser) {
    throw { status: 409, message: 'User with same email/phone already exists' };
  }

  const fields = [
    'name',
    'phone',
    'domainIds',
    'subjectIds',
    'assignedClassIds',
    'experience',
    'qualification',
    'isActive'
  ];

  for (const key of fields) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      teacher[key] = payload[key];
    }
  }

  teacher.email = nextEmail;
  await teacher.save();

  const user = await User.findById(teacher.userId);
  if (user) {
    user.fullName = teacher.name;
    user.email = teacher.email;
    user.phone = teacher.phone;
    if (Object.prototype.hasOwnProperty.call(payload, 'isActive')) {
      user.isActive = payload.isActive;
    }
    await user.save();
  }

  return teacher;
}

async function deleteTeacher(id) {
  const teacher = await Teacher.findById(id);
  if (!teacher) throw { status: 404, message: 'Teacher not found' };

  await Promise.all([
    ClassModel.updateMany({ homeroomTeacherId: teacher._id }, { $set: { homeroomTeacherId: null } }),
    Subject.updateMany({ teacherId: teacher._id }, { $set: { teacherId: null } })
  ]);

  await Teacher.deleteOne({ _id: teacher._id });
  await User.deleteOne({ _id: teacher.userId });

  return { message: 'Teacher deleted successfully' };
}

async function getTeacherClasses(user) {
  const teacher = await Teacher.findOne({ userId: user.userId });
  if (!teacher) throw { status: 404, message: 'Teacher profile not found' };

  return ClassModel.find({ _id: { $in: teacher.assignedClassIds } })
    .populate('domainId', 'name code')
    .sort({ className: 1, section: 1 });
}

async function getTeacherClassStudents(user, classId, query) {
  await ensureTeacherClassAccess(user, classId);

  const { page, limit, skip } = parsePagination(query);
  const filter = { classId };

  if (query.search) {
    filter.$or = [
      { fullName: new RegExp(query.search, 'i') },
      { rollNumber: new RegExp(query.search, 'i') }
    ];
  }

  const [data, total] = await Promise.all([
    Student.find(filter)
      .sort({ rollNumber: 1 })
      .skip(skip)
      .limit(limit),
    Student.countDocuments(filter)
  ]);

  return { data, total, page, limit };
}

async function getTeacherStudents(user, query) {
  const teacher = await Teacher.findOne({ userId: user.userId });
  if (!teacher) throw { status: 404, message: 'Teacher profile not found' };

  const { page, limit, skip } = parsePagination(query);
  const filter = { classId: { $in: teacher.assignedClassIds } };

  if (query.classId) {
    await ensureTeacherClassAccess(user, query.classId);
    filter.classId = query.classId;
  }

  if (query.search) {
    filter.$or = [
      { fullName: new RegExp(query.search, 'i') },
      { rollNumber: new RegExp(query.search, 'i') }
    ];
  }

  const [data, total] = await Promise.all([
    Student.find(filter)
      .populate('classId', 'className section')
      .populate('domainId', 'name code')
      .sort({ className: 1, rollNumber: 1 })
      .skip(skip)
      .limit(limit),
    Student.countDocuments(filter)
  ]);

  return { data, total, page, limit };
}

module.exports = {
  createTeacher,
  listTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getTeacherClasses,
  getTeacherClassStudents,
  getTeacherStudents
};
