'use strict';

const AppError = require('../../core/AppError');
const ClassModel = require('../../models/class.model');
const Section = require('../../models/Section.model');

const ensureClassExists = async (classId) => {
  const classItem = await ClassModel.findById(classId);
  if (!classItem) {
    throw new AppError('Class not found.', 404);
  }
  return classItem;
};

const create = async (data, adminId) => {
  await ensureClassExists(data.classId);

  const section = await Section.create({
    ...data,
    createdBy: adminId,
    updatedBy: adminId,
  });

  return Section.findById(section._id).populate({
    path: 'classId',
    populate: { path: 'domainId' },
  });
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
    Section.find(filter)
      .populate({ path: 'classId', populate: { path: 'domainId' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(numericLimit),
    Section.countDocuments(filter),
  ]);

  return { data, total, page: numericPage, limit: numericLimit };
};

const update = async (id, data, adminId) => {
  if (data.classId) {
    await ensureClassExists(data.classId);
  }

  const section = await Section.findByIdAndUpdate(
    id,
    { ...data, updatedBy: adminId },
    { new: true, runValidators: true },
  ).populate({ path: 'classId', populate: { path: 'domainId' } });

  if (!section) {
    throw new AppError('Section not found.', 404);
  }

  return section;
};

const remove = async (id) => {
  const section = await Section.findByIdAndDelete(id);
  if (!section) {
    throw new AppError('Section not found.', 404);
  }
};

module.exports = { create, list, update, remove };