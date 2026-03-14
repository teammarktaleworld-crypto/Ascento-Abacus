'use strict';

const AppError = require('../../core/AppError');
const AcademicYear = require('../../models/AcademicYear.model');
const ClassModel = require('../../models/class.model');
const Fee = require('../../models/fee.model');
const Student = require('../../models/student.model');
const StudentEnrollment = require('../../models/StudentEnrollment.model');

const feePopulate = [
  { path: 'studentId', select: '-password' },
  { path: 'classId', populate: { path: 'domainId' } },
  { path: 'academicYearId', select: 'name startDate endDate status' },
];

const populateFeeQuery = (query) => {
  feePopulate.forEach((populate) => {
    query.populate(populate);
  });
  return query;
};

const ensureReferences = async ({ studentId, classId, academicYearId }) => {
  const [student, classItem, academicYear] = await Promise.all([
    Student.findById(studentId).select('-password'),
    ClassModel.findById(classId),
    AcademicYear.findById(academicYearId),
  ]);

  if (!student) throw new AppError('Student not found.', 404);
  if (!classItem) throw new AppError('Class not found.', 404);
  if (!academicYear) throw new AppError('Academic year not found.', 404);

  if (String(student.domainId) !== String(classItem.domainId)) {
    throw new AppError('Student domain does not match class domain.', 400);
  }

  const enrollment = await StudentEnrollment.findOne({ studentId, classId });

  if (!enrollment) {
    throw new AppError('Student is not enrolled in the provided class.', 400);
  }
};

const create = async (data, adminId) => {
  await ensureReferences({
    studentId: data.studentId,
    classId: data.classId,
    academicYearId: data.academicYearId,
  });

  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new AppError('amount must be a number greater than or equal to 0.', 400);
  }

  const fee = await Fee.create({
    studentId: data.studentId,
    classId: data.classId,
    academicYearId: data.academicYearId,
    feeType: data.feeType,
    amount,
    dueDate: data.dueDate,
    paymentStatus: data.paymentStatus || 'pending',
    paymentDate: data.paymentDate || null,
    paymentMethod: data.paymentMethod || null,
    transactionReference: data.transactionReference || null,
    createdBy: adminId,
    updatedBy: adminId,
  });

  return populateFeeQuery(Fee.findById(fee._id));
};

const listForAdmin = async ({
  page = 1,
  limit = 20,
  studentId,
  classId,
  academicYearId,
  feeType,
  paymentStatus,
} = {}) => {
  const numericPage = Math.max(Number(page) || 1, 1);
  const numericLimit = Math.max(Number(limit) || 20, 1);
  const skip = (numericPage - 1) * numericLimit;

  const filter = {};
  if (studentId) filter.studentId = studentId;
  if (classId) filter.classId = classId;
  if (academicYearId) filter.academicYearId = academicYearId;
  if (feeType) filter.feeType = feeType;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const [data, total] = await Promise.all([
    populateFeeQuery(
      Fee.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(numericLimit),
    ),
    Fee.countDocuments(filter),
  ]);

  return { data, total, page: numericPage, limit: numericLimit };
};

const markAsPaid = async ({ feeId, paymentDate, paymentMethod, transactionReference }, adminId) => {
  const fee = await Fee.findById(feeId);
  if (!fee) {
    throw new AppError('Fee record not found.', 404);
  }

  if (fee.paymentStatus === 'paid') {
    throw new AppError('Fee is already marked as paid.', 409);
  }

  if (!paymentMethod) {
    throw new AppError('paymentMethod is required to mark fee as paid.', 400);
  }

  fee.paymentStatus = 'paid';
  fee.paymentDate = paymentDate || new Date();
  fee.paymentMethod = paymentMethod;
  fee.transactionReference = transactionReference || fee.transactionReference;
  fee.updatedBy = adminId;

  await fee.save();

  return populateFeeQuery(Fee.findById(fee._id));
};

const listForStudent = async (studentId, { paymentStatus, academicYearId } = {}) => {
  const filter = { studentId };
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (academicYearId) filter.academicYearId = academicYearId;

  return populateFeeQuery(Fee.find(filter).sort({ createdAt: -1 }));
};

module.exports = {
  create,
  listForAdmin,
  markAsPaid,
  listForStudent,
};
