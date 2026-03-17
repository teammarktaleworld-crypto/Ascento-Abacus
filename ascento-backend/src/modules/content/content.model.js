// Content model for teacher-created materials
'use strict';
const mongoose = require('mongoose');
const auditFields = require('../../models/plugins/auditFields.plugin');

const ContentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['note', 'material', 'announcement'], default: 'note' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  visibleTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  date: { type: Date, default: Date.now },
}, { timestamps: true });

ContentSchema.plugin(auditFields);

module.exports = mongoose.model('Content', ContentSchema);
