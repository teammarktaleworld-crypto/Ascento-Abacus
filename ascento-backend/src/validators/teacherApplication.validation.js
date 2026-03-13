const { Joi, objectId } = require('./common');

const teacherApplySchema = Joi.object({
  fullName: Joi.string().trim().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(8).max(20).required(),
  qualification: Joi.string().trim().required(),
  experience: Joi.number().min(0).required(),
  subjects: Joi.array().items(Joi.string().trim()).min(1).required(),
  domainId: objectId.allow(null),
  specialization: Joi.string().allow('', null),
  currentOrganization: Joi.string().trim().allow('', null),
  address: Joi.string().trim().allow('', null),
  coverLetter: Joi.string().trim().allow('', null),
  noticePeriodDays: Joi.number().min(0).default(0),
  expectedSalary: Joi.number().min(0).allow(null),
  availabilityDate: Joi.date().allow(null),
  resume: Joi.object({ url: Joi.string().uri().required(), publicId: Joi.string().allow('', null) }).allow(null),
  supportingDocuments: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().trim().required(),
        url: Joi.string().uri().required(),
        publicId: Joi.string().allow('', null)
      })
    )
    .default([]),
  profilePhoto: Joi.object({ url: Joi.string().uri().required(), publicId: Joi.string().allow('', null) }).allow(null),
  resumeBase64: Joi.string().allow('', null),
  documentUploads: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().trim().required(),
        base64: Joi.string().required()
      })
    )
    .default([]),
  profilePhotoBase64: Joi.string().allow('', null)
})
  .or('resume', 'resumeBase64')
  .custom((value, helpers) => {
    const docCount = (value.supportingDocuments?.length || 0) + (value.documentUploads?.length || 0);
    if (docCount < 1) {
      return helpers.error('any.custom', {
        message: 'At least one supporting document is required'
      });
    }
    return value;
  }, 'supporting documents validation')
  .messages({
    'any.custom': '{{#message}}'
  });

const rejectApplicationSchema = Joi.object({
  remark: Joi.string().allow('', null)
});

module.exports = {
  teacherApplySchema,
  rejectApplicationSchema
};
