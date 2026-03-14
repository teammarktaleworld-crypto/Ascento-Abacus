'use strict';

const AppError = require('../../core/AppError');
const Enquiry = require('../../models/enquiry.model');

const create = async (data) => Enquiry.create({
  fullName: data.fullName,
  email: data.email,
  phoneNumber: data.phoneNumber,
  classInterested: data.classInterested,
  message: data.message,
  status: data.status || 'new',
});

const listForAdmin = async ({ page = 1, limit = 20, status, search } = {}) => {
  const numericPage = Math.max(Number(page) || 1, 1);
  const numericLimit = Math.max(Number(limit) || 20, 1);
  const skip = (numericPage - 1) * numericLimit;

  const filter = {};
  if (status) {
    filter.status = status;
  }

  if (search && String(search).trim()) {
    const keyword = String(search).trim();
    filter.$or = [
      { fullName: { $regex: keyword, $options: 'i' } },
      { email: { $regex: keyword, $options: 'i' } },
      { phoneNumber: { $regex: keyword, $options: 'i' } },
      { classInterested: { $regex: keyword, $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    Enquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(numericLimit),
    Enquiry.countDocuments(filter),
  ]);

  return { data, total, page: numericPage, limit: numericLimit };
};

const update = async (id, payload, adminId) => {
  const allowedFields = ['fullName', 'email', 'phoneNumber', 'classInterested', 'message', 'status'];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      updateData[field] = payload[field];
    }
  });

  if (!Object.keys(updateData).length) {
    throw new AppError('At least one updatable field is required.', 400);
  }

  updateData.updatedBy = adminId;

  const enquiry = await Enquiry.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!enquiry) {
    throw new AppError('Enquiry not found.', 404);
  }

  return enquiry;
};

const remove = async (id) => {
  const enquiry = await Enquiry.findByIdAndDelete(id);
  if (!enquiry) {
    throw new AppError('Enquiry not found.', 404);
  }
};

module.exports = {
  create,
  listForAdmin,
  update,
  remove,
};
