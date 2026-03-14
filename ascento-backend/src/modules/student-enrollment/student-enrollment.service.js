'use strict';

const AppError = require('../../core/AppError');
const ClassModel = require('../../models/class.model');
const Section = require('../../models/Section.model');
const Student = require('../../models/student.model');
const StudentEnrollment = require('../../models/StudentEnrollment.model');

const enrollmentPopulate = [
  { path: 'studentId', select: '-password' },
  { path: 'classId', populate: { path: 'domainId' } },
  { path: 'sectionId', populate: { path: 'classId' } },
];

const populateEnrollmentQuery = (query) => {
  enrollmentPopulate.forEach((populate) => {
    query.populate(populate);
  });
  return query;
};

const validateAcademicYear = (academicYear) => {
  if (!/^\d{4}-\d{4}$/.test(academicYear)) {
    throw new AppError('academicYear must be in the format YYYY-YYYY.', 400);
  }
};

const getCurrentEnrollmentRecord = async (studentId) => {
  const activeEnrollment = await StudentEnrollment.findOne({ studentId, status: 'active' }).sort({ createdAt: -1 });

  if (activeEnrollment) {
    return activeEnrollment;
  }

  return StudentEnrollment.findOne({ studentId }).sort({ createdAt: -1 });
};

const loadValidatedReferences = async ({ studentId, classId, sectionId }) => {
  const [student, classItem, section] = await Promise.all([
    Student.findById(studentId).select('-password'),
    ClassModel.findById(classId),
    Section.findById(sectionId),
  ]);

  if (!student) throw new AppError('Student not found.', 404);
  if (!classItem) throw new AppError('Class not found.', 404);
  if (!section) throw new AppError('Section not found.', 404);

  if (String(section.classId) !== String(classItem._id)) {
    throw new AppError('Section does not belong to the provided class.', 400);
  }

  if (String(student.domainId) !== String(classItem.domainId)) {
    throw new AppError('Student domain does not match the class domain.', 400);
  }

  return { student, classItem, section };
};

const create = async (data, adminId) => {
  validateAcademicYear(data.academicYear);
  await loadValidatedReferences(data);

  const enrollment = await StudentEnrollment.create({
    ...data,
    createdBy: adminId,
    updatedBy: adminId,
  });

  if (enrollment.status === 'active') {
    await StudentEnrollment.updateMany(
      {
        studentId: enrollment.studentId,
        _id: { $ne: enrollment._id },
        status: 'active',
      },
      { status: 'inactive', updatedBy: adminId },
    );
  }

  return populateEnrollmentQuery(StudentEnrollment.findById(enrollment._id));
};

const promote = async (
  { studentId, fromClassId, toClassId, fromSectionId, toSectionId, newAcademicYear },
  adminId,
) => {
  validateAcademicYear(newAcademicYear);

  if (String(fromClassId) === String(toClassId) && String(fromSectionId) === String(toSectionId)) {
    throw new AppError('Promotion target must differ from the current class or section.', 400);
  }

  const currentEnrollment = await getCurrentEnrollmentRecord(studentId);

  if (!currentEnrollment) {
    throw new AppError('No current enrollment found for this student.', 404);
  }

  if (String(currentEnrollment.classId) !== String(fromClassId)) {
    throw new AppError('fromClassId does not match the student\'s current class.', 400);
  }

  if (String(currentEnrollment.sectionId) !== String(fromSectionId)) {
    throw new AppError('fromSectionId does not match the student\'s current section.', 400);
  }

  const existingEnrollment = await StudentEnrollment.findOne({
    studentId,
    academicYear: newAcademicYear,
  });

  if (existingEnrollment) {
    throw new AppError('Student is already enrolled for the provided academic year.', 409);
  }

  return create(
    {
      studentId,
      classId: toClassId,
      sectionId: toSectionId,
      academicYear: newAcademicYear,
      status: 'active',
    },
    adminId,
  );
};

const list = async ({ page = 1, limit = 20, studentId, academicYear, status } = {}) => {
  const numericPage = Math.max(Number(page) || 1, 1);
  const numericLimit = Math.max(Number(limit) || 20, 1);
  const filter = {};

  if (studentId) filter.studentId = studentId;
  if (academicYear) filter.academicYear = academicYear;
  if (status) filter.status = status;

  const skip = (numericPage - 1) * numericLimit;
  const dataQuery = StudentEnrollment.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(numericLimit);

  const [data, total] = await Promise.all([
    populateEnrollmentQuery(dataQuery),
    StudentEnrollment.countDocuments(filter),
  ]);

  return { data, total, page: numericPage, limit: numericLimit };
};

const getCurrentClass = async (studentId) => {
  const activeEnrollment = await populateEnrollmentQuery(
    StudentEnrollment.findOne({ studentId, status: 'active' }).sort({ createdAt: -1 }),
  );

  if (activeEnrollment) {
    return activeEnrollment;
  }

  const latestEnrollment = await populateEnrollmentQuery(
    StudentEnrollment.findOne({ studentId }).sort({ createdAt: -1 }),
  );

  if (!latestEnrollment) {
    throw new AppError('No enrollment found for this student.', 404);
  }

  return latestEnrollment;
};

module.exports = { create, promote, list, getCurrentClass };