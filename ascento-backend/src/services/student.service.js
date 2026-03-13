const User = require('../models/user.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const Domain = require('../models/domain.model');
const ClassModel = require('../models/class.model');
const Attendance = require('../models/attendance.model');
const Mark = require('../models/mark.model');
const Result = require('../models/result.model');
const Assignment = require('../models/assignment.model');

const { parsePagination } = require('../utils/pagination');
const { randomPassword, hashPassword } = require('../utils/password');
const { uploadBase64 } = require('../utils/cloudinary');
const { generateUniquePublicId } = require('../utils/public-id');
const { ROLES } = require('../config/constants');
const {
  ensureStudentAccess,
  getTeacherByUserId,
  getParentByUserId,
  getStudentByUserId
} = require('./access.service');

async function uniqueUsername(base) {
  let candidate = base.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!candidate) candidate = 'student';

  let seq = 0;
  while (await User.findOne({ username: candidate })) {
    seq += 1;
    candidate = `${base.toLowerCase().replace(/[^a-z0-9]/g, '')}${seq}`;
  }

  return candidate;
}

async function buildUploadedDocuments(documentUploads) {
  if (!documentUploads || !documentUploads.length) return [];

  const uploads = [];
  for (const item of documentUploads) {
    const result = await uploadBase64(item.base64, 'school-erp/students/documents');
    uploads.push({
      name: item.name,
      url: result.url,
      publicId: result.publicId
    });
  }

  return uploads;
}

async function createOrReuseParent(payload) {
  const existingParent = await Parent.findOne({ phone: payload.parentPhone });
  if (existingParent) {
    return { parent: existingParent, parentCredentials: null };
  }

  const parentRawPassword = randomPassword(10);
  const parentUser = await User.create({
    fullName: payload.parentName,
    email: payload.parentEmail || undefined,
    phone: payload.parentPhone,
    password: await hashPassword(parentRawPassword),
    role: ROLES.PARENT
  });

  const parent = await Parent.create({
    userId: parentUser._id,
    name: payload.parentName,
    phone: payload.parentPhone,
    email: payload.parentEmail,
    address: payload.address,
    children: []
  });

  parentUser.profileId = parent._id;
  await parentUser.save();

  return {
    parent,
    parentCredentials: {
      phone: payload.parentPhone,
      password: parentRawPassword
    }
  };
}

async function createStudent(payload) {
  const [domain, classDoc, duplicateRoll] = await Promise.all([
    Domain.findById(payload.domainId),
    ClassModel.findById(payload.classId),
    Student.findOne({ rollNumber: payload.rollNumber })
  ]);

  if (!domain) throw { status: 404, message: 'Domain not found' };
  if (!classDoc) throw { status: 404, message: 'Class not found' };
  if (duplicateRoll) throw { status: 409, message: 'Roll number already exists' };

  if (classDoc.domainId.toString() !== domain._id.toString()) {
    throw { status: 400, message: 'Selected class does not belong to domain' };
  }

  const { parent, parentCredentials } = await createOrReuseParent(payload);

  const usernameBase = `stu${payload.rollNumber}`;
  const username = await uniqueUsername(usernameBase);
  const studentCode = await generateUniquePublicId('STU', Student, 'studentCode');
  const studentRawPassword = randomPassword(10);

  const studentUser = await User.create({
    fullName: payload.fullName,
    username,
    password: await hashPassword(studentRawPassword),
    role: ROLES.STUDENT
  });

  let profilePhoto = payload.profilePhoto;
  if (payload.profilePhotoBase64) {
    const upload = await uploadBase64(payload.profilePhotoBase64, 'school-erp/students/profile');
    profilePhoto = upload.url;
  }

  const uploadedDocuments = await buildUploadedDocuments(payload.documentUploads);

  const student = await Student.create({
    userId: studentUser._id,
    studentCode,
    parentId: parent._id,
    fullName: payload.fullName,
    dateOfBirth: payload.dateOfBirth,
    gender: payload.gender,
    domainId: payload.domainId,
    classId: payload.classId,
    className: payload.className,
    section: payload.section,
    rollNumber: payload.rollNumber,
    parentName: payload.parentName,
    parentPhone: payload.parentPhone,
    parentEmail: payload.parentEmail,
    address: payload.address,
    admissionDate: payload.admissionDate,
    previousSchool: payload.previousSchool,
    previousMarks: payload.previousMarks || [],
    documents: [...(payload.documents || []), ...uploadedDocuments],
    profilePhoto
  });

  studentUser.profileId = student._id;
  await studentUser.save();

  await Parent.findByIdAndUpdate(parent._id, { $addToSet: { children: student._id } });

  return {
    student,
    studentCredentials: {
      studentId: studentCode,
      rollNumber: payload.rollNumber,
      username,
      password: studentRawPassword
    },
    parentCredentials
  };
}

async function listStudents(query, user) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.domainId) filter.domainId = query.domainId;
  if (query.classId) filter.classId = query.classId;
  if (query.section) filter.section = query.section;

  if (query.search) {
    filter.$or = [
      { studentCode: new RegExp(query.search, 'i') },
      { fullName: new RegExp(query.search, 'i') },
      { rollNumber: new RegExp(query.search, 'i') },
      { parentName: new RegExp(query.search, 'i') }
    ];
  }

  if (user.role === ROLES.TEACHER) {
    const teacher = await getTeacherByUserId(user.userId);
    if (!teacher) throw { status: 404, message: 'Teacher profile not found' };
    filter.classId = { $in: teacher.assignedClassIds };
  }

  if (user.role === ROLES.PARENT) {
    const parent = await getParentByUserId(user.userId);
    if (!parent) throw { status: 404, message: 'Parent profile not found' };
    filter.parentId = parent._id;
  }

  if (user.role === ROLES.STUDENT) {
    const ownStudent = await getStudentByUserId(user.userId);
    if (!ownStudent) throw { status: 404, message: 'Student profile not found' };
    filter._id = ownStudent._id;
  }

  const [data, total] = await Promise.all([
    Student.find(filter)
      .populate('domainId', 'name code')
      .populate('classId', 'className section')
      .populate('parentId', 'name phone email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Student.countDocuments(filter)
  ]);

  return { data, total, page, limit };
}

async function getStudentById(studentId, user) {
  const student = await Student.findById(studentId)
    .populate('domainId', 'name code')
    .populate('classId', 'className section')
    .populate('parentId', 'name phone email address');

  await ensureStudentAccess(user, student);
  return student;
}

async function updateStudent(studentId, payload, user) {
  const student = await Student.findById(studentId);
  await ensureStudentAccess(user, student);

  if (user.role === ROLES.TEACHER) {
    student.improvementNotes = payload.improvementNotes || student.improvementNotes;
    await student.save();
    return student;
  }

  if (payload.profilePhotoBase64) {
    const upload = await uploadBase64(payload.profilePhotoBase64, 'school-erp/students/profile');
    payload.profilePhoto = upload.url;
  }

  const uploadedDocuments = await buildUploadedDocuments(payload.documentUploads);
  if (uploadedDocuments.length) {
    payload.documents = [...(payload.documents || student.documents || []), ...uploadedDocuments];
  }

  const allowed = [
    'fullName',
    'dateOfBirth',
    'gender',
    'domainId',
    'classId',
    'className',
    'section',
    'parentName',
    'parentPhone',
    'parentEmail',
    'address',
    'admissionDate',
    'previousSchool',
    'previousMarks',
    'documents',
    'profilePhoto',
    'improvementNotes'
  ];

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      student[key] = payload[key];
    }
  }

  await student.save();
  return student;
}

async function studentProgress(studentId, user) {
  const student = await Student.findById(studentId).populate('classId domainId');
  await ensureStudentAccess(user, student);

  const [attendance, marks, results, assignments] = await Promise.all([
    Attendance.find({ studentId }).sort({ date: -1 }).limit(120),
    Mark.find({ studentId }).populate('examId subjectId').sort({ createdAt: -1 }),
    Result.find({ studentId }).populate('examId').sort({ publishedAt: -1 }),
    Assignment.find({ classId: student.classId })
      .populate('subjectId', 'name')
      .sort({ dueDate: 1 })
      .limit(50)
  ]);

  const totalAttendance = attendance.length;
  const presentAttendance = attendance.filter((item) => item.status === 'present').length;
  const attendancePercentage =
    totalAttendance > 0 ? Number(((presentAttendance / totalAttendance) * 100).toFixed(2)) : 0;

  return {
    student,
    dashboard: {
      attendance: {
        total: totalAttendance,
        present: presentAttendance,
        percentage: attendancePercentage
      },
      marks,
      results,
      assignments,
      improvementNotes: student.improvementNotes || ''
    }
  };
}

async function deleteStudent(studentId, user) {
  const student = await Student.findById(studentId);
  await ensureStudentAccess(user, student);

  await Parent.updateOne({ _id: student.parentId }, { $pull: { children: student._id } });
  await Student.deleteOne({ _id: student._id });
  await User.deleteOne({ _id: student.userId });

  return { message: 'Student deleted successfully' };
}

module.exports = {
  createStudent,
  listStudents,
  getStudentById,
  updateStudent,
  studentProgress,
  deleteStudent
};
