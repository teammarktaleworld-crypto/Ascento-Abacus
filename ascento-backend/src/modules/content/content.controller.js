// Content controller for teacher CRUD
'use strict';
const ApiResponse = require('../../core/ApiResponse');
const asyncHandler = require('../../core/asyncHandler');
const AppError = require('../../core/AppError');
const Content = require('./content.model');

const create = asyncHandler(async (req, res) => {
  const { title, description, type, classId, studentId, visibleTo } = req.body;
  if (!title) throw new AppError('Title is required.', 400);
  const content = await Content.create({
    title,
    description,
    type,
    classId,
    studentId,
    createdBy: req.user._id,
    visibleTo,
  });
  return new ApiResponse(201, 'Content created', content).send(res);
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const content = await Content.findByIdAndUpdate(id, req.body, { new: true });
  if (!content) throw new AppError('Content not found.', 404);
  return new ApiResponse(200, 'Content updated', content).send(res);
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const content = await Content.findByIdAndDelete(id);
  if (!content) throw new AppError('Content not found.', 404);
  return new ApiResponse(200, 'Content deleted').send(res);
});

const list = asyncHandler(async (req, res) => {
  const contents = await Content.find({ createdBy: req.user._id });
  return new ApiResponse(200, 'Content list', contents).send(res);
});

const getForStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const contents = await Content.find({
    $or: [
      { visibleTo: studentId },
      { studentId },
      { classId: req.user.classId },
    ],
  });
  return new ApiResponse(200, 'Content for student', contents).send(res);
});

module.exports = { create, update, remove, list, getForStudent };
