const router = require('express').Router();
const controller = require('../controllers/student.controller');
const authenticate = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createStudentSchema,
  updateStudentSchema
} = require('../validators/student.validation');

router.use(authenticate);

router.post('/', allowRoles('admin'), validate(createStudentSchema), controller.createStudent);
router.get('/', allowRoles('admin', 'teacher', 'parent', 'student'), controller.listStudents);
router.get('/:id/progress', allowRoles('admin', 'teacher', 'parent', 'student'), controller.progress);
router.get('/:id', allowRoles('admin', 'teacher', 'parent', 'student'), controller.getStudent);
router.put(
  '/:id',
  allowRoles('admin', 'teacher'),
  validate(updateStudentSchema),
  controller.updateStudent
);
router.delete('/:id', allowRoles('admin'), controller.deleteStudent);

module.exports = router;

