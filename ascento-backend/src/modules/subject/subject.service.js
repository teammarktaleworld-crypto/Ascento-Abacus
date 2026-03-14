'use strict';

const AppError = require('../../core/AppError');
const ClassModel = require('../../models/class.model');
const Subject = require('../../models/subject.model');

const classPopulate = {
  path: 'classId',
  populate: { path: 'domainId' },
};

const ensureClassExists = async (classId) => {
  const classItem = await ClassModel.findById(classId);
  if (!classItem) {
    throw new AppError('Class not found.', 404);
  }
  return classItem;
};

const create = async (data, adminId) => {
  await ensureClassExists(data.classId);

  const subject = await Subject.create({
    ...data,
    createdBy: adminId,
    updatedBy: adminId,
  });

  return Subject.findById(subject._id).populate(classPopulate);
};

const list = async ({ page = 1, limit = 20, classId } = {}) => {
  const numericPage = Math.max(Number(page) || 1, 1);
  const numericLimit = Math.max(Number(limit) || 20, 1);
  const filter = {};

  if (classId) {
    filter.classId = classId;
  }

  const skip = (numericPage - 1) * numericLimit;
  const [data, total] = await Promise.all([
    Subject.find(filter)
      .populate(classPopulate)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(numericLimit),
    Subject.countDocuments(filter),
  ]);

  return { data, total, page: numericPage, limit: numericLimit };
};

const getById = async (id) => {
  const subject = await Subject.findById(id).populate(classPopulate);
  if (!subject) {
    throw new AppError('Subject not found.', 404);
  }
  return subject;
};

const update = async (id, data, adminId) => {
  if (data.classId) {
    await ensureClassExists(data.classId);
  }

  const subject = await Subject.findByIdAndUpdate(
    id,
    { ...data, updatedBy: adminId },
    { new: true, runValidators: true },
  ).populate(classPopulate);

  if (!subject) {
    throw new AppError('Subject not found.', 404);
  }

  return subject;
};

const remove = async (id) => {
  const subject = await Subject.findByIdAndDelete(id);
  if (!subject) {
    throw new AppError('Subject not found.', 404);
  }
};

module.exports = { create, list, getById, update, remove };