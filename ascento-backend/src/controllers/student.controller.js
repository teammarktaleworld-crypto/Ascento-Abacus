const studentService = require('../services/student.service');
const asyncHandler = require('../utils/async-handler');

const createStudent = asyncHandler(async (req, res) => {
  const data = await studentService.createStudent(req.body);
  res.status(201).json(data);
});

const listStudents = asyncHandler(async (req, res) => {
  const data = await studentService.listStudents(req.query, req.user);
  res.json(data);
});

const getStudent = asyncHandler(async (req, res) => {
  const data = await studentService.getStudentById(req.params.id, req.user);
  res.json(data);
});

const updateStudent = asyncHandler(async (req, res) => {
  const data = await studentService.updateStudent(req.params.id, req.body, req.user);
  res.json(data);
});

const progress = asyncHandler(async (req, res) => {
  const data = await studentService.studentProgress(req.params.id, req.user);
  res.json(data);
});

const deleteStudent = asyncHandler(async (req, res) => {
  const data = await studentService.deleteStudent(req.params.id, req.user);
  res.json(data);
});

module.exports = {
  createStudent,
  listStudents,
  getStudent,
  updateStudent,
  progress,
  deleteStudent
};
