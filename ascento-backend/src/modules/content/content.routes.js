// Content routes for teacher CRUD
'use strict';
const express = require('express');
const controller = require('./content.controller');
const validateSession = require('../../middleware/validateSession');
const validateRole = require('../../middleware/validateRole');
const requireTeacherPasswordChange = require('../../middleware/requireTeacherPasswordChange');
const router = express.Router();

router.use(validateSession, validateRole('teacher'), requireTeacherPasswordChange);

router.post('/content', controller.create);
router.put('/content/:id', controller.update);
router.delete('/content/:id', controller.remove);
router.get('/content', controller.list);
router.get('/content/:studentId', controller.getForStudent);

module.exports = router;
