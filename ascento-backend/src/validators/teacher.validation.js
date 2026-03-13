const { Joi, objectId } = require('./common');

const createTeacherSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(8).max(20).required(),
  domainIds: Joi.array().items(objectId).default([]),
  subjectIds: Joi.array().items(objectId).default([]),
  assignedClassIds: Joi.array().items(objectId).default([]),
  experience: Joi.number().min(0).default(0),
  qualification: Joi.string().allow('', null),
  password: Joi.string().min(6)
});

const updateTeacherSchema = Joi.object({
  name: Joi.string().trim(),
  email: Joi.string().email(),
  phone: Joi.string().min(8).max(20),
  domainIds: Joi.array().items(objectId),
  subjectIds: Joi.array().items(objectId),
  assignedClassIds: Joi.array().items(objectId),
  experience: Joi.number().min(0),
  qualification: Joi.string().allow('', null),
  isActive: Joi.boolean()
});

module.exports = {
  createTeacherSchema,
  updateTeacherSchema
};
