const router = require('express').Router();
const controller = require('../controllers/admin.controller');
const authenticate = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');

const { createTeacherSchema } = require('../validators/teacher.validation');
const { createStudentSchema } = require('../validators/student.validation');
const { createClassSchema } = require('../validators/class.validation');
const { createSubjectSchema } = require('../validators/subject.validation');
const { assignTeacherSchema } = require('../validators/admin.validation');
const { rejectApplicationSchema } = require('../validators/teacherApplication.validation');
const {
  approveStudentApplicationSchema
} = require('../validators/studentAdmission.validation');

router.use(authenticate);
router.use(allowRoles('admin'));

router.get('/analytics', controller.analytics);
router.get('/dashboard', controller.dashboard);

router.post('/create-teacher', validate(createTeacherSchema), controller.createTeacher);
router.post('/create-student', validate(createStudentSchema), controller.createStudent);
router.post('/create-class', validate(createClassSchema), controller.createClass);
router.post('/create-subject', validate(createSubjectSchema), controller.createSubject);
router.post('/assign-teacher', validate(assignTeacherSchema), controller.assignTeacher);

router.get('/teacher-applications', controller.teacherApplications);
router.get('/student-applications', controller.studentApplications);
router.post('/approve-teacher/:id', controller.approveTeacher);
router.post('/approve-student/:id', validate(approveStudentApplicationSchema), controller.approveStudent);
router.post('/reject-teacher/:id', validate(rejectApplicationSchema), controller.rejectTeacher);
router.post('/reject-student/:id', validate(rejectApplicationSchema), controller.rejectStudent);
router.post('/cleanup-demo-data', controller.cleanupDemoData);

router.get('/export/students', controller.exportStudents);
router.get('/export/report-card/:studentId', controller.exportReportCard);

module.exports = router;

