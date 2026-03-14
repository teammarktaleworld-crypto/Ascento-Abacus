'use strict';

const AppError = require('../../core/AppError');
const Event = require('../../models/event.model');

const normalizeEventDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('eventDate must be a valid date.', 400);
  }

  return parsed;
};

const normalizeAttachments = (attachments) => {
  if (attachments === undefined) {
    return [];
  }

  if (!Array.isArray(attachments)) {
    throw new AppError('attachments must be an array of strings.', 400);
  }

  if (attachments.some((item) => typeof item !== 'string')) {
    throw new AppError('attachments must be an array of strings.', 400);
  }

  return attachments.map((item) => item.trim()).filter(Boolean);
};

const create = async (data, adminId) => {
  const eventDate = normalizeEventDate(data.eventDate);
  const attachments = normalizeAttachments(data.attachments);

  const event = await Event.create({
    title: data.title,
    description: data.description,
    eventDate,
    location: data.location,
    attachments,
    createdBy: adminId,
    updatedBy: adminId,
  });

  return Event.findById(event._id);
};

const list = async ({ fromDate, toDate } = {}) => {
  const filter = {};

  if (fromDate || toDate) {
    filter.eventDate = {};

    if (fromDate) {
      const from = new Date(fromDate);
      if (Number.isNaN(from.getTime())) {
        throw new AppError('fromDate must be a valid date.', 400);
      }
      filter.eventDate.$gte = from;
    }

    if (toDate) {
      const to = new Date(toDate);
      if (Number.isNaN(to.getTime())) {
        throw new AppError('toDate must be a valid date.', 400);
      }
      filter.eventDate.$lte = to;
    }
  }

  return Event.find(filter).sort({ eventDate: 1, createdAt: -1 });
};

module.exports = {
  create,
  list,
};
