const teacherService = require('../services/teacher.service');
const asyncHandler = require('../utils/async-handler');

const createTeacher = asyncHandler(async (req, res) => {
  const data = await teacherService.createTeacher(req.body);
  res.status(201).json(data);
});

const listTeachers = asyncHandler(async (req, res) => {
  const data = await teacherService.listTeachers(req.query);
  res.json(data);
});

const getTeacher = asyncHandler(async (req, res) => {
  const data = await teacherService.getTeacherById(req.params.id);
  res.json(data);
});

const updateTeacher = asyncHandler(async (req, res) => {
  const data = await teacherService.updateTeacher(req.params.id, req.body);
  res.json(data);
});

const deleteTeacher = asyncHandler(async (req, res) => {
  const data = await teacherService.deleteTeacher(req.params.id);
  res.json(data);
});

const myClasses = asyncHandler(async (req, res) => {
  const data = await teacherService.getTeacherClasses(req.user);
  res.json(data);
});

const myClassStudents = asyncHandler(async (req, res) => {
  const data = await teacherService.getTeacherClassStudents(req.user, req.params.classId, req.query);
  res.json(data);
});

module.exports = {
  createTeacher,
  listTeachers,
  getTeacher,
  updateTeacher,
  deleteTeacher,
  myClasses,
  myClassStudents
};
