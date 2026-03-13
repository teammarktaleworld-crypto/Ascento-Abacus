# School ERP Backend Complete API Contract

## Base URL
https://ascento-abacus-ow3u.onrender.com

## Files Used To Build This Contract
- Routes: src/routes/*.routes.js + src/routes/index.js + src/app.js
- Validation: src/validators/*.validation.js
- Response logic: src/controllers/*.controller.js + src/services/*.service.js
- Data fields: src/models/*.model.js

## Authorization
Protected APIs require:

Authorization: Bearer <accessToken>

Role values:
- admin
- teacher
- student
- parent

## Shared Error Format
```json
{
  "message": "Error text",
  "details": ["optional validation errors"]
}
```

## Shared Pagination Format
Most listing APIs return:
```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "limit": 20
}
```

---

## 1) System APIs

### GET /
Auth: Public

Response 200:
```json
{
  "service": "School ERP Backend API",
  "version": "2.0.0",
  "docs": "/docs",
  "health": "/health"
}
```

### GET /health
Auth: Public

Response 200:
```json
{
  "status": "ok",
  "timestamp": "ISO date"
}
```

### GET /docs
Auth: Public
Response: HTML documentation page

### GET /docs.json
Auth: Public
Response: OpenAPI JSON

---

## 2) Authentication APIs

### POST /auth/admin/login
Auth: Public
Body:
```json
{
  "email": "admin@school.com",
  "password": "min 6 chars"
}
```
Response 200:
```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt",
  "user": {
    "id": "ObjectId",
    "fullName": "string",
    "email": "string|null",
    "phone": "string|null",
    "username": "string|null",
    "role": "admin",
    "profileId": "ObjectId|null"
  }
}
```

### POST /auth/teacher/login
Auth: Public
Body:
```json
{
  "identifier": "teacherCode or email",
  "password": "min 6 chars"
}
```
Response 200: same token object as above (role teacher)

### POST /auth/student/login
Auth: Public
Body:
```json
{
  "identifier": "username or rollNumber or studentCode",
  "password": "min 6 chars"
}
```
Response 200: same token object as above (role student)

### POST /auth/parent/request-otp
Auth: Public
Body:
```json
{
  "phone": "string"
}
```
or
```json
{
  "email": "string"
}
```
Response 200:
```json
{
  "message": "OTP generated and sent",
  "otpCodeForTesting": "123456",
  "destinationPhone": "string"
}
```

### POST /auth/parent/login
Auth: Public
Body with OTP:
```json
{
  "phone": "string",
  "otp": "6 digits"
}
```
Body with password:
```json
{
  "email": "string",
  "password": "min 6 chars"
}
```
Response 200: same token object as above (role parent)

### POST /auth/refresh
Auth: Public
Body:
```json
{
  "refreshToken": "jwt"
}
```
Response 200:
```json
{
  "accessToken": "jwt"
}
```

### GET /auth/me
Auth: Logged in user
Response 200:
```json
{
  "_id": "ObjectId",
  "fullName": "string",
  "email": "string|null",
  "phone": "string|null",
  "username": "string|null",
  "role": "admin|teacher|student|parent",
  "profileId": "ObjectId|null",
  "isActive": true,
  "lastLoginAt": "ISO date",
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

---

## 3) Public Application APIs

### POST /admission/apply
Auth: Public
Body schema:
- studentFullName required
- dateOfBirth required
- gender required (male, female, other)
- domainId required
- classId optional
- parentName required
- parentPhone required
- optional: parentEmail, address, previousSchool, previousMarks, documents, profilePhoto, profilePhotoBase64, documentUploads, medicalNotes, note

Sample body:
```json
{
  "studentFullName": "Student Name",
  "dateOfBirth": "2014-06-01",
  "gender": "male",
  "domainId": "ObjectId",
  "classId": "ObjectId",
  "parentName": "Parent Name",
  "parentPhone": "9999999999",
  "parentEmail": "parent@example.com"
}
```
Response 201: created StudentAdmission document

### POST /teacher/apply
Auth: Public
Body schema:
- fullName, email, phone, qualification, experience required
- subjects required array with at least 1 value
- resume or resumeBase64 required
- at least one supporting document required: supportingDocuments[] or documentUploads[]
- optional: profilePhoto/profilePhotoBase64, specialization, expectedSalary, coverLetter, etc.

Sample body:
```json
{
  "fullName": "Teacher Name",
  "email": "teacher@example.com",
  "phone": "9999999999",
  "qualification": "B.Ed",
  "experience": 3,
  "subjects": ["Math"],
  "resumeBase64": "base64...",
  "documentUploads": [
    {
      "name": "Degree Certificate",
      "base64": "base64..."
    }
  ]
}
```
Response 201: created TeacherApplication document

Note: Admin endpoint `POST /admin/create-teacher` creates teacher directly and does not require resume/documents.

---

## 4) Teacher Portal APIs
Auth: teacher

### GET /teacher/classes
Response 200: array of Class documents assigned to teacher

### GET /teacher/students
Query: classId optional, search optional, page, limit
Response 200: pagination with student rows from teacher classes

### POST /teacher/attendance
Body:
```json
{
  "date": "2026-03-13",
  "classId": "ObjectId",
  "note": "optional",
  "records": [
    { "studentId": "ObjectId", "status": "present" }
  ]
}
```
Response 201:
```json
{
  "count": 1,
  "data": [
    {
      "_id": "ObjectId",
      "date": "ISO date",
      "classId": "ObjectId",
      "studentId": "ObjectId",
      "status": "present|absent|late",
      "markedBy": "ObjectId|null",
      "note": "string"
    }
  ]
}
```

### POST /teacher/marks
### POST /teacher/add-marks
Body:
```json
{
  "examId": "ObjectId",
  "studentId": "ObjectId",
  "subjectId": "ObjectId",
  "obtainedMarks": 78,
  "totalMarks": 100
}
```
Response 201: Mark document (examId, studentId, subjectId populated)

### POST /teacher/assignment
Body:
```json
{
  "title": "Homework 1",
  "description": "optional",
  "domainId": "ObjectId",
  "classId": "ObjectId",
  "subjectId": "ObjectId",
  "dueDate": "2026-03-20",
  "attachmentBase64": "optional",
  "attachmentName": "optional"
}
```
Response 201: created Assignment document

### POST /teacher/announcement
Body:
```json
{
  "title": "Important",
  "description": "optional",
  "domainId": "ObjectId",
  "classId": "ObjectId",
  "subjectId": "ObjectId",
  "fileBase64": "optional",
  "videoLink": "optional"
}
```
Response 201: created Content document with contentType announcement

### POST /teacher/publish-content
Body:
```json
{
  "title": "Chapter Notes",
  "description": "optional",
  "contentType": "notes",
  "domainId": "ObjectId",
  "classId": "ObjectId",
  "subjectId": "ObjectId",
  "fileBase64": "optional",
  "videoLink": "optional"
}
```
Response 201: created Content document

### POST /teacher/schedule-class
Body:
```json
{
  "title": "Live Class",
  "description": "optional",
  "domainId": "ObjectId",
  "classId": "ObjectId",
  "subjectId": "ObjectId",
  "date": "2026-03-20",
  "startTime": "10:00",
  "endTime": "11:00",
  "meetingLink": "https://..."
}
```
Response 201: created OnlineClass document

---

## 5) Student Portal APIs
Auth: student

### GET /student/content
Query: contentType, subjectId, search, page, limit
Response 200: pagination with Content documents for student's class/domain

### GET /student/upcoming-classes
Query: page, limit
Response 200: pagination with upcoming OnlineClass documents

### GET /student/results
Query: examId, page, limit
Response 200: pagination with Result documents for logged-in student

---

## 6) Parent Portal APIs
Auth: parent

### GET /parent/student
Query: studentId optional
Response 200:
```json
{
  "parent": { "_id": "ObjectId", "name": "string", "children": [] },
  "student": { "_id": "ObjectId", "fullName": "string" },
  "children": []
}
```

### GET /parent/attendance
Query: studentId optional, page, limit
Response 200:
```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "limit": 20,
  "summary": {
    "present": 0,
    "absent": 0,
    "percentage": 0
  }
}
```

### GET /parent/results
Query: studentId optional, examId optional, page, limit
Response 200: pagination with Result documents

### GET /parent/upcoming-classes
Query: page, limit
Response 200: pagination with OnlineClass documents for parent children

### GET /parent/report-card
Query: studentId optional, examId optional
Response 200:
```json
{
  "student": {},
  "result": {},
  "attendance": {
    "total": 0,
    "present": 0,
    "percentage": 0
  }
}
```

---

## 7) Domain APIs

### POST /domains
Auth: admin
Body:
```json
{
  "name": "Generic School",
  "code": "GENERIC_SCHOOL",
  "description": "optional"
}
```
Response 201: Domain document

### GET /domains
Auth: admin, teacher, student, parent
Response 200: array of Domain documents

---

## 8) Class APIs

### POST /classes
Auth: admin
Body:
```json
{
  "domainId": "ObjectId",
  "className": "Class 6",
  "standardNumber": 6,
  "section": "A"
}
```
Response 201: Class document

### GET /classes
Auth: admin, teacher, student, parent
Query: domainId, className, section, page, limit
Response 200: pagination with Class documents

### POST /classes/:id/assign-teacher
Auth: admin
Body:
```json
{
  "teacherId": "ObjectId"
}
```
Response 200: updated Class document with homeroomTeacherId

---

## 9) Subject APIs

### POST /subjects
Auth: admin
Body:
```json
{
  "domainId": "ObjectId",
  "classId": "ObjectId",
  "name": "Math",
  "code": "MATH"
}
```
Response 201: Subject document

### GET /subjects
Auth: admin, teacher, student, parent
Query: domainId, classId, name, page, limit
Response 200: pagination with Subject documents

### POST /subjects/:id/assign-teacher
Auth: admin
Body:
```json
{
  "teacherId": "ObjectId"
}
```
Response 200: updated Subject document

---

## 10) Teacher Management APIs

### POST /teachers
Auth: admin
Body:
```json
{
  "name": "Teacher Name",
  "email": "teacher@example.com",
  "phone": "9999999999",
  "domainIds": ["ObjectId"],
  "subjectIds": ["ObjectId"],
  "assignedClassIds": ["ObjectId"],
  "experience": 3,
  "qualification": "MSc",
  "password": "optional"
}
```
Response 201:
```json
{
  "teacher": {},
  "credentials": {
    "teacherId": "TCHxxxxxx",
    "email": "teacher@example.com",
    "password": "generatedOrGiven"
  }
}
```

### GET /teachers
Auth: admin, teacher
Query: search, domainId, page, limit
Response 200: pagination with teacher list

### GET /teachers/me/classes
Auth: teacher
Response 200: class array

### GET /teachers/me/classes/:classId/students
Auth: teacher
Query: search, page, limit
Response 200: pagination with students

### GET /teachers/:id
Auth: admin, teacher
Response 200: teacher detail with populated domain/subject/class references

### PUT /teachers/:id
Auth: admin
Body (all optional):
```json
{
  "name": "Teacher Updated",
  "email": "updated.teacher@example.com",
  "phone": "9999999998",
  "domainIds": ["ObjectId"],
  "subjectIds": ["ObjectId"],
  "assignedClassIds": ["ObjectId"],
  "experience": 5,
  "qualification": "M.Ed",
  "isActive": true
}
```
Response 200: updated Teacher document

### DELETE /teachers/:id
Auth: admin
Response 200:
```json
{
  "message": "Teacher deleted successfully"
}
```

---

## 11) Student Management APIs

### POST /students
Auth: admin
Body:
```json
{
  "fullName": "Student Name",
  "dateOfBirth": "2014-06-01",
  "gender": "male",
  "domainId": "ObjectId",
  "classId": "ObjectId",
  "className": "Class 6",
  "section": "A",
  "rollNumber": "12",
  "parentName": "Parent",
  "parentPhone": "9999999999",
  "parentEmail": "optional",
  "address": "optional",
  "admissionDate": "optional",
  "previousSchool": "optional",
  "previousMarks": [],
  "documents": [],
  "profilePhoto": "optional url",
  "profilePhotoBase64": "optional",
  "documentUploads": []
}
```
Response 201:
```json
{
  "student": {},
  "studentCredentials": {
    "studentId": "STUxxxxxx",
    "rollNumber": "12",
    "username": "stu12",
    "password": "generated"
  },
  "parentCredentials": {
    "phone": "9999999999",
    "password": "generated"
  }
}
```

### GET /students
Auth: admin, teacher, parent, student
Query: domainId, classId, section, search, page, limit
Response 200: pagination with student list

### GET /students/:id
Auth: admin, teacher, parent, student
Response 200: one student document

### PUT /students/:id
Auth: admin, teacher
Body: updateStudentSchema fields
Note: teacher can update only improvementNotes; admin can update full allowed profile fields.
Response 200: updated student document

### DELETE /students/:id
Auth: admin
Response 200:
```json
{
  "message": "Student deleted successfully"
}
```

### GET /students/:id/progress
Auth: admin, teacher, parent, student
Response 200:
```json
{
  "student": {},
  "dashboard": {
    "attendance": { "total": 0, "present": 0, "percentage": 0 },
    "marks": [],
    "results": [],
    "assignments": [],
    "improvementNotes": ""
  }
}
```

---

## 12) Attendance APIs

### POST /attendance
Auth: admin, teacher
Body: same as teacher attendance body
Response 201: count + attendance records

### GET /attendance/class/:id
Auth: admin, teacher
Query: date optional, page, limit
Response 200: pagination with class attendance records

### GET /attendance/student/:id
Auth: admin, teacher, parent, student
Query: from, to, page, limit
Response 200: pagination + summary (present/absent/percentage)

---

## 13) Exam APIs

### POST /exams
Auth: admin, teacher
Body:
```json
{
  "name": "Mid Term",
  "examType": "MID_TERM",
  "domainId": "ObjectId",
  "classId": "ObjectId",
  "section": "A",
  "examDate": "2026-03-25"
}
```
Response 201: Exam document

### GET /exams
Auth: admin, teacher, parent, student
Query: domainId, classId, examType, page, limit
Response 200: pagination with exam list

---

## 14) Mark APIs

### POST /marks
Auth: admin, teacher
Body: createMarkSchema
Response 201: Mark document with examId/subjectId/studentId populated

### GET /marks/student/:id
Auth: admin, teacher, parent, student
Query: examId optional, page, limit
Response 200: pagination with marks

### GET /marks/exam/:id
Auth: admin, teacher
Query: page, limit
Response 200: pagination with marks of exam

---

## 15) Result APIs

### POST /results/student/:id/generate
Auth: admin, teacher
Body or query must include examId

Body example:
```json
{
  "examId": "ObjectId"
}
```
Response 201: generated Result document

### GET /results/student/:id
Auth: admin, teacher, parent, student
Query: examId optional, page, limit
Response 200: pagination with result list

### GET /results/student/:id/report-card
Auth: admin, teacher, parent, student
Query: examId optional
Response 200:
```json
{
  "student": {},
  "result": {},
  "attendance": { "total": 0, "present": 0, "percentage": 0 }
}
```

---

## 16) Assignment APIs

### POST /assignments
Auth: admin, teacher
Body: createAssignmentSchema
Response 201: Assignment document

### GET /assignments/class/:id
Auth: admin, teacher
Query: page, limit
Response 200: pagination with assignments by class

### GET /assignments/student/:id
Auth: admin, teacher, parent, student
Query: page, limit
Response 200: pagination with assignments for student class

---

## 17) Admin APIs
Auth: admin only

### GET /admin/analytics
Response 200:
```json
{
  "totals": {
    "students": 0,
    "teachers": 0,
    "parents": 0,
    "domains": 0,
    "classes": 0,
    "subjects": 0,
    "attendance": 0,
    "exams": 0,
    "marks": 0,
    "results": 0
  },
  "studentsByDomain": [
    {
      "domain": "string",
      "code": "GENERIC_SCHOOL",
      "count": 0
    }
  ]
}
```

### GET /admin/dashboard
Response 200:
```json
{
  "totalStudents": 0,
  "totalTeachers": 0,
  "totalClasses": 0,
  "attendanceToday": 0,
  "upcomingClasses": [],
  "recentActivities": []
}
```

### POST /admin/create-teacher
Body: createTeacherSchema
Response 201: same as POST /teachers

### POST /admin/create-student
Body: createStudentSchema
Response 201: same as POST /students

### POST /admin/create-class
Body: createClassSchema
Response 201: same as POST /classes

### POST /admin/create-subject
Body: createSubjectSchema
Response 201: same as POST /subjects

### POST /admin/assign-teacher
Body:
```json
{
  "teacherId": "ObjectId",
  "classId": "optional ObjectId",
  "subjectId": "optional ObjectId"
}
```
At least one of classId or subjectId is required.

Response 200:
```json
{
  "classAssignment": {},
  "subjectAssignment": {}
}
```

### GET /admin/teacher-applications
Query: status, search, page, limit
Response 200: pagination with TeacherApplication rows

### GET /admin/student-applications
Query: status, domainId, classId, search, page, limit
Response 200: pagination with StudentAdmission rows

### POST /admin/approve-teacher/:id
Response 200:
```json
{
  "application": {},
  "teacher": {},
  "credentials": {
    "teacherId": "TCHxxxxxx",
    "email": "teacher@example.com",
    "password": "generated"
  }
}
```

### POST /admin/approve-student/:id
Body:
```json
{
  "classId": "ObjectId",
  "rollNumber": "string",
  "domainId": "optional ObjectId",
  "admissionDate": "optional",
  "remark": "optional"
}
```
Response 200:
```json
{
  "application": {},
  "student": {},
  "studentCredentials": {
    "studentId": "STUxxxxxx",
    "rollNumber": "string",
    "username": "string",
    "password": "generated"
  },
  "parentCredentials": {
    "phone": "string",
    "password": "generated"
  }
}
```

### POST /admin/reject-teacher/:id
Body:
```json
{
  "remark": "optional"
}
```
Response 200: updated TeacherApplication

### POST /admin/reject-student/:id
Body:
```json
{
  "remark": "optional"
}
```
Response 200: updated StudentAdmission

### GET /admin/export/students
Response 200:
- Content-Type: application/vnd.ms-excel
- File download: students_sheet.csv

### GET /admin/export/report-card/:studentId
Response 200:
- Content-Type: application/pdf
- File download: report_card.pdf

---

## Active Endpoint Count
- 80 active endpoints
- Exact route index available in ALL_APIS_ROUTES.md
