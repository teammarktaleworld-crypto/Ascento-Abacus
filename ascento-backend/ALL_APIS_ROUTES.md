# School ERP Backend - API List

Exact API endpoints currently registered in Express routes.
No duplicate method + path entries.

## System
GET /
GET /health
GET /docs
GET /docs.json

## Auth
POST /auth/admin/login
POST /auth/teacher/login
POST /auth/student/login
POST /auth/parent/request-otp
POST /auth/parent/login
POST /auth/refresh
GET /auth/me

## Admission And Applications
POST /admission/apply
POST /teacher/apply

## Teacher Portal
GET /teacher/classes
GET /teacher/students
POST /teacher/attendance
POST /teacher/marks
POST /teacher/add-marks
POST /teacher/assignment
POST /teacher/announcement
POST /teacher/publish-content
POST /teacher/schedule-class

## Student Portal
GET /student/content
GET /student/upcoming-classes
GET /student/results

## Parent Portal
GET /parent/student
GET /parent/attendance
GET /parent/results
GET /parent/upcoming-classes
GET /parent/report-card

## Domains
POST /domains
GET /domains

## Classes
POST /classes
GET /classes
POST /classes/:id/assign-teacher

## Subjects
POST /subjects
GET /subjects
POST /subjects/:id/assign-teacher

## Teachers
POST /teachers
GET /teachers
GET /teachers/me/classes
GET /teachers/me/classes/:classId/students
GET /teachers/:id
PUT /teachers/:id
DELETE /teachers/:id

## Students
POST /students
GET /students
GET /students/:id/progress
GET /students/:id
PUT /students/:id
DELETE /students/:id

## Attendance
POST /attendance
GET /attendance/class/:id
GET /attendance/student/:id

## Exams
POST /exams
GET /exams

## Marks
POST /marks
GET /marks/student/:id
GET /marks/exam/:id

## Results
POST /results/student/:id/generate
GET /results/student/:id
GET /results/student/:id/report-card

## Assignments
POST /assignments
GET /assignments/class/:id
GET /assignments/student/:id

## Admin
GET /admin/analytics
GET /admin/dashboard
POST /admin/create-teacher
POST /admin/create-student
POST /admin/create-class
POST /admin/create-subject
POST /admin/assign-teacher
GET /admin/teacher-applications
GET /admin/student-applications
POST /admin/approve-teacher/:id
POST /admin/approve-student/:id
POST /admin/reject-teacher/:id
POST /admin/reject-student/:id
GET /admin/export/students
GET /admin/export/report-card/:studentId
