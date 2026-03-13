const TeacherApplication = require('../models/teacherApplication.model');
const { uploadBase64 } = require('../utils/cloudinary');
const { parsePagination } = require('../utils/pagination');
const { generateUniquePublicId } = require('../utils/public-id');
const teacherService = require('./teacher.service');

async function applyTeacher(payload) {
  const hasResume = Boolean(payload.resumeBase64 || (payload.resume && payload.resume.url));
  const uploadedDocuments = [];

  if (!Number.isFinite(Number(payload.experience)) || Number(payload.experience) < 0) {
    throw { status: 400, message: 'Teacher experience must be a valid number' };
  }

  if (!hasResume) {
    throw { status: 400, message: 'Teacher CV or resume is required' };
  }

  if (!Array.isArray(payload.supportingDocuments)) {
    payload.supportingDocuments = [];
  }

  if (!Array.isArray(payload.documentUploads)) {
    payload.documentUploads = [];
  }

  for (const item of payload.documentUploads) {
    const upload = await uploadBase64(item.base64, 'school-erp/teacher-applications/documents');
    uploadedDocuments.push({
      name: item.name,
      url: upload.url,
      publicId: upload.publicId
    });
  }

  const supportingDocuments = [...payload.supportingDocuments, ...uploadedDocuments];
  if (!supportingDocuments.length) {
    throw { status: 400, message: 'At least one supporting document is required' };
  }

  const duplicate = await TeacherApplication.findOne({
    $or: [{ email: payload.email.toLowerCase() }, { phone: payload.phone }],
    status: { $in: ['pending', 'approved'] }
  });

  if (duplicate) {
    throw { status: 409, message: 'Application already exists for this email/phone' };
  }

  const resume = payload.resume || {};
  const profilePhoto = payload.profilePhoto || {};

  if (payload.resumeBase64) {
    const upload = await uploadBase64(payload.resumeBase64, 'school-erp/teacher-applications/resume');
    resume.url = upload.url;
    resume.publicId = upload.publicId;
  }

  if (payload.profilePhotoBase64) {
    const upload = await uploadBase64(
      payload.profilePhotoBase64,
      'school-erp/teacher-applications/profile'
    );
    profilePhoto.url = upload.url;
    profilePhoto.publicId = upload.publicId;
  }

  const applicationCode = await generateUniquePublicId('TAP', TeacherApplication, 'applicationCode');

  return TeacherApplication.create({
    applicationCode,
    fullName: payload.fullName,
    email: payload.email.toLowerCase(),
    phone: payload.phone,
    qualification: payload.qualification,
    experience: payload.experience,
    subjects: payload.subjects || [],
    domainId: payload.domainId || null,
    specialization: payload.specialization,
    currentOrganization: payload.currentOrganization,
    address: payload.address,
    coverLetter: payload.coverLetter,
    noticePeriodDays: payload.noticePeriodDays,
    expectedSalary: payload.expectedSalary,
    availabilityDate: payload.availabilityDate,
    resume,
    supportingDocuments,
    profilePhoto,
    status: 'pending'
  });
}

async function listTeacherApplications(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.$or = [
      { applicationCode: new RegExp(query.search, 'i') },
      { fullName: new RegExp(query.search, 'i') },
      { email: new RegExp(query.search, 'i') },
      { phone: new RegExp(query.search, 'i') }
    ];
  }

  const [data, total] = await Promise.all([
    TeacherApplication.find(filter)
      .populate('domainId', 'name code')
      .populate('reviewedBy', 'fullName email')
      .populate('createdTeacherId', 'teacherCode name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    TeacherApplication.countDocuments(filter)
  ]);

  return { data, total, page, limit };
}

async function approveTeacherApplication(applicationId, adminUserId) {
  const application = await TeacherApplication.findById(applicationId);
  if (!application) {
    throw { status: 404, message: 'Teacher application not found' };
  }

  if (application.status !== 'pending') {
    throw { status: 400, message: 'Only pending applications can be approved' };
  }

  const created = await teacherService.createTeacher({
    name: application.fullName,
    email: application.email,
    phone: application.phone,
    qualification: application.qualification,
    experience: application.experience,
    domainIds: application.domainId ? [application.domainId] : [],
    subjectIds: [],
    assignedClassIds: []
  });

  application.status = 'approved';
  application.reviewedBy = adminUserId;
  application.createdTeacherId = created.teacher._id;
  application.reviewRemark = 'Approved by admin';
  await application.save();

  return {
    application,
    teacher: created.teacher,
    credentials: created.credentials
  };
}

async function rejectTeacherApplication(applicationId, adminUserId, remark) {
  const application = await TeacherApplication.findById(applicationId);
  if (!application) {
    throw { status: 404, message: 'Teacher application not found' };
  }

  if (application.status !== 'pending') {
    throw { status: 400, message: 'Only pending applications can be rejected' };
  }

  application.status = 'rejected';
  application.reviewedBy = adminUserId;
  application.reviewRemark = remark || 'Rejected by admin';
  await application.save();

  return application;
}

module.exports = {
  applyTeacher,
  listTeacherApplications,
  approveTeacherApplication,
  rejectTeacherApplication
};
