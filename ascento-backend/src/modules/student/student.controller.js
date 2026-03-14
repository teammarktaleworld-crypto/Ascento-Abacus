'use strict';

const ApiResponse = require('../../core/ApiResponse');
const AppError = require('../../core/AppError');
const asyncHandler = require('../../core/asyncHandler');
const studentService = require('./student.service');

const create = asyncHandler(async (req, res) => {
  const {
    fullName,
    dateOfBirth,
    dob,
    age,
    gender,
    parentName,
    parentPhone,
    parentEmail,
    domainId,
    password,
    status,
    address,
    city,
    state,
    bloodGroup,
    profilePhoto,
  } = req.body;

  const resolvedDateOfBirth = dateOfBirth || dob;

  if (!fullName || !gender || !parentName || !parentPhone || !parentEmail || !domainId) {
    throw new AppError(
      'fullName, gender, parentName, parentPhone, parentEmail, and domainId are required.',
      400,
    );
  }

  const result = await studentService.create(
    {
      fullName,
      dateOfBirth: resolvedDateOfBirth,
      age,
      gender,
      parentName,
      parentPhone,
      parentEmail,
      domainId,
      password,
      status,
      address,
      city,
      state,
      bloodGroup,
      profilePhoto,
    },
    req.user._id,
  );

  return new ApiResponse(201, 'Student created', result).send(res);
});

const list = asyncHandler(async (req, res) => {
  const { page, limit, domainId, status, search } = req.query;
  const result = await studentService.list({ page, limit, domainId, status, search });
  return new ApiResponse(200, 'Students fetched', result).send(res);
});

const getById = asyncHandler(async (req, res) => {
  const student = await studentService.getById(req.params.id);
  return new ApiResponse(200, 'Student fetched', student).send(res);
});

const update = asyncHandler(async (req, res) => {
  const student = await studentService.update(req.params.id, req.body, req.user._id);
  return new ApiResponse(200, 'Student updated', student).send(res);
});

const remove = asyncHandler(async (req, res) => {
  await studentService.remove(req.params.id);
  return new ApiResponse(200, 'Student deleted').send(res);
});

module.exports = { create, list, getById, update, remove };