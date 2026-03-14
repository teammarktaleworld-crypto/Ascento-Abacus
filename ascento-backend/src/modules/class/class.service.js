'use strict';

const AppError = require('../../core/AppError');
const ClassModel = require('../../models/class.model');
const Domain = require('../../models/domain.model.js');

const ensureDomainExists = async (domainId) => {
  const domain = await Domain.findById(domainId);
  if (!domain) {
    throw new AppError('Domain not found.', 404);
  }
  return domain;
};

const create = async (data, adminId) => {
  await ensureDomainExists(data.domainId);

  const classItem = await ClassModel.create({
    ...data,
    createdBy: adminId,
    updatedBy: adminId,
  });

  return ClassModel.findById(classItem._id).populate('domainId');
};

const list = async ({ page = 1, limit = 20, domainId } = {}) => {
  const numericPage = Math.max(Number(page) || 1, 1);
  const numericLimit = Math.max(Number(limit) || 20, 1);
  const filter = {};

  if (domainId) {
    filter.domainId = domainId;
  }

  const skip = (numericPage - 1) * numericLimit;
  const [data, total] = await Promise.all([
    ClassModel.find(filter)
      .populate('domainId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(numericLimit),
    ClassModel.countDocuments(filter),
  ]);

  return { data, total, page: numericPage, limit: numericLimit };
};

const getById = async (id) => {
  const classItem = await ClassModel.findById(id).populate('domainId');
  if (!classItem) {
    throw new AppError('Class not found.', 404);
  }
  return classItem;
};

const update = async (id, data, adminId) => {
  if (data.domainId) {
    await ensureDomainExists(data.domainId);
  }

  const classItem = await ClassModel.findByIdAndUpdate(
    id,
    { ...data, updatedBy: adminId },
    { new: true, runValidators: true },
  ).populate('domainId');

  if (!classItem) {
    throw new AppError('Class not found.', 404);
  }

  return classItem;
};

const remove = async (id) => {
  const classItem = await ClassModel.findByIdAndDelete(id);
  if (!classItem) {
    throw new AppError('Class not found.', 404);
  }
};

module.exports = { create, list, getById, update, remove };