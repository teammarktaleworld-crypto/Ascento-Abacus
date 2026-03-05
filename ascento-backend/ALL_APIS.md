# School ERP Backend API Documentation

## Tech Stack
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- RBAC Authorization
- Joi Validation
- Cloudinary Upload Support
- node-cron Reminder Jobs
- Swagger Documentation
- dotenv Environment Config

## Scalable Project Structure

```text
src/
  controllers/
  routes/
  models/
  middlewares/
  services/
  utils/
  config/
  validators/
  docs/
server.js
```

## Roles and Access
- **Admin**: Full access to all resources
- **Teacher**: Assigned classes/students only
- **Student**: Own data only
- **Parent**: Own child data only

## Supported Domains
- Vedic Math
- Abacus
- Generic School (Class 1 to Class 12)

Students are mapped to:
- domain
- class
- section

---

## Authentication APIs

### 1. Admin Login
**POST** `/auth/admin/login`

**Request:**
```json
{
  "email": "admin@school.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "admin@school.com",
      "role": "admin",
      "fullName": "School Admin"
    }
  }
}
```

**Error Responses:**
- **401 Unauthorized**: Invalid email or password
- **400 Bad Request**: Missing required fields

---

### 2. Teacher Login
**POST** `/auth/teacher/login`

**Request:**
```json
{
  "email": "teacher@school.com",
  "password": "teacherPass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439012",
      "email": "teacher@school.com",
      "role": "teacher",
      "fullName": "Mr. John Doe",
      "qualification": "B.Tech"
    }
  }
}
```

**Error Response:**
- **401 Unauthorized**: Invalid credentials
- **400 Bad Request**: Missing required fields

---

### 3. Student Login
**POST** `/auth/student/login`

**Request:**
```json
{
  "identifier": "STU001",
  "password": "studentPass123"
}
```
*Note: identifier can be either username or roll number*

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439013",
      "username": "STU001",
      "role": "student",
      "fullName": "Raj Kumar",
      "class": "Class 10",
      "section": "A"
    }
  }
}
```

**Error Response:**
- **401 Unauthorized**: Invalid identifier or password
- **400 Bad Request**: Missing required fields

---

### 4. Parent Request OTP
**POST** `/auth/parent/request-otp`

**Request:**
```json
{
  "phone": "+919876543210"
}
```
*OR*
```json
{
  "email": "parent@email.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "otpId": "507f1f77bcf86cd799439014",
    "expiresIn": 600,
    "contact": "****3210"
  }
}
```

**Error Response:**
- **404 Not Found**: Parent not registered with this contact
- **400 Bad Request**: Invalid phone or email format

---

### 5. Parent Login with OTP/Password
**POST** `/auth/parent/login`

**Request (with OTP):**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Request (with Password):**
```json
{
  "email": "parent@email.com",
  "password": "parentPass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439015",
      "phone": "+919876543210",
      "role": "parent",
      "fullName": "Mrs. Priya Kumar",
      "childName": "Raj Kumar"
    }
  }
}
```

**Error Response:**
- **401 Unauthorized**: Invalid OTP or password
- **400 Bad Request**: Missing required fields

---

### 6. Refresh Access Token
**POST** `/auth/refresh`

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

**Error Response:**
- **401 Unauthorized**: Invalid or expired refresh token

---

### 7. Get Current User Profile
**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "email": "user@school.com",
    "role": "student",
    "fullName": "Raj Kumar",
    "class": "Class 10",
    "section": "A",
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

**Error Response:**
- **401 Unauthorized**: Missing or invalid token

---

## Teacher Application APIs

### 1. Submit Teacher Application
**POST** `/teacher/apply`

**Description:** Public API for applying as a teacher. No authentication required.

**Request (Form Data/Multipart):**
```
fullName: John Doe
email: john.doe@email.com
phone: +919876543210
qualification: B.Tech
experience: 5
subjects: Mathematics,Science
domainId: 507f1f77bcf86cd799439017
resume: <file>
profilePhoto: <file>
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439018",
    "fullName": "John Doe",
    "email": "john.doe@email.com",
    "phone": "+919876543210",
    "qualification": "B.Tech",
    "experience": 5,
    "subjects": ["Mathematics", "Science"],
    "status": "pending",
    "resumeUrl": "https://cloudinary.com/...",
    "profilePhotoUrl": "https://cloudinary.com/...",
    "createdAt": "2026-03-05T10:30:00Z"
  }
}
```

**Error Response:**
- **400 Bad Request**: Validation failed
- **500 Internal Server Error**: File upload failed

---

### 2. Get All Teacher Applications
**GET** `/admin/teacher-applications`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
```
status: pending (optional)
search: John (optional)
page: 1 (optional)
limit: 10 (optional)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "_id": "507f1f77bcf86cd799439018",
        "fullName": "John Doe",
        "email": "john.doe@email.com",
        "phone": "+919876543210",
        "status": "pending",
        "createdAt": "2026-03-05T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

**Error Response:**
- **401 Unauthorized**: Admin token required
- **403 Forbidden**: Insufficient permissions

---

### 3. Approve Teacher Application
**POST** `/admin/approve-teacher/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request:**
```json
{
  "assignDomain": "507f1f77bcf86cd799439017",
  "assignClasses": ["507f1f77bcf86cd799439019", "507f1f77bcf86cd799439020"]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Teacher approved and account created",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "email": "john.doe@email.com",
    "role": "teacher",
    "fullName": "John Doe",
    "credentials": {
      "username": "john.doe",
      "tempPassword": "Temp@1234567"
    },
    "createdAt": "2026-03-05T10:35:00Z"
  }
}
```

**Error Response:**
- **404 Not Found**: Application not found
- **400 Bad Request**: Invalid domain or class IDs

---

### 4. Reject Teacher Application
**POST** `/admin/reject-teacher/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "remark": "Does not meet qualification requirements"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Application rejected",
  "data": {
    "_id": "507f1f77bcf86cd799439018",
    "status": "rejected",
    "remark": "Does not meet qualification requirements",
    "updatedAt": "2026-03-05T10:40:00Z"
  }
}
```

**Error Response:**
- **404 Not Found**: Application not found
- **400 Bad Request**: Application already processed

---

## Admin Panel APIs

### 1. Create Teacher
**POST** `/admin/create-teacher`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "fullName": "Mrs. Sarah Johnson",
  "email": "sarah.johnson@school.com",
  "phone": "+919876543211",
  "qualification": "M.Sc Physics",
  "experience": 8,
  "subjects": ["Physics", "Science"],
  "domainId": "507f1f77bcf86cd799439017"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Teacher created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "email": "sarah.johnson@school.com",
    "role": "teacher",
    "fullName": "Mrs. Sarah Johnson",
    "credentials": {
      "username": "sarah.johnson",
      "tempPassword": "TempPass@1234"
    }
  }
}
```

**Error Response:**
- **400 Bad Request**: Email already exists
- **422 Unprocessable Entity**: Validation failed

---

### 2. Create Student
**POST** `/admin/create-student`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "fullName": "Raj Kumar",
  "dateOfBirth": "2012-05-15",
  "gender": "Male",
  "domainId": "507f1f77bcf86cd799439017",
  "classId": "507f1f77bcf86cd799439023",
  "className": "Class 10",
  "section": "A",
  "rollNumber": "STU010",
  "parentName": "Mr. Ramesh Kumar",
  "parentPhone": "+919876543212",
  "parentEmail": "ramesh.kumar@email.com",
  "address": "123 Main Street, City",
  "admissionDate": "2025-06-01",
  "previousSchool": "ABC School",
  "previousMarks": 85
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Student created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439024",
    "username": "STU010",
    "role": "student",
    "fullName": "Raj Kumar",
    "email": "raj.kumar@student.school.com",
    "class": "Class 10",
    "section": "A",
    "rollNumber": "STU010",
    "parentId": "507f1f77bcf86cd799439025",
    "credentials": {
      "tempPassword": "StudentPass@1234"
    }
  }
}
```

**Error Response:**
- **400 Bad Request**: Roll number already exists
- **422 Unprocessable Entity**: Validation failed

---

### 3. Create Class
**POST** `/admin/create-class`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "className": "Class 10",
  "sections": ["A", "B", "C"],
  "domainId": "507f1f77bcf86cd799439017",
  "totalStrength": 120,
  "capacity": 40
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Class created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439023",
    "className": "Class 10",
    "sections": ["A", "B", "C"],
    "domain": {
      "_id": "507f1f77bcf86cd799439017",
      "name": "Generic School"
    },
    "totalEnrolled": 0,
    "capacity": 40
  }
}
```

---

### 4. Create Subject
**POST** `/admin/create-subject`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "subjectName": "Physics",
  "subjectCode": "PHY101",
  "description": "Physics for CBSE board",
  "domainId": "507f1f77bcf86cd799439017",
  "classIds": ["507f1f77bcf86cd799439023"]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Subject created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439026",
    "subjectName": "Physics",
    "subjectCode": "PHY101",
    "description": "Physics for CBSE board",
    "domain": "Generic School",
    "classes": ["Class 10"]
  }
}
```

---

### 5. Assign Teacher to Class
**POST** `/admin/assign-teacher`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "teacherId": "507f1f77bcf86cd799439022",
  "classId": "507f1f77bcf86cd799439023",
  "subjectId": "507f1f77bcf86cd799439026",
  "section": "A"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Teacher assigned successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439027",
    "teacher": {
      "_id": "507f1f77bcf86cd799439022",
      "fullName": "Mrs. Sarah Johnson"
    },
    "class": "Class 10",
    "section": "A",
    "subject": "Physics",
    "assignedAt": "2026-03-05T11:00:00Z"
  }
}
```

---

### 6. Get Admin Dashboard
**GET** `/admin/dashboard`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalStudents": 450,
    "totalTeachers": 30,
    "totalClasses": 12,
    "totalDomains": 3,
    "attendanceToday": {
      "present": 420,
      "absent": 25,
      "late": 5
    },
    "upcomingClasses": [
      {
        "_id": "507f1f77bcf86cd799439028",
        "title": "Physics Class - Chapter 5",
        "class": "Class 10",
        "teacher": "Mrs. Sarah Johnson",
        "scheduledFor": "2026-03-05T14:00:00Z"
      }
    ],
    "recentActivities": [
      {
        "type": "student_created",
        "description": "Student 'Raj Kumar' created",
        "timestamp": "2026-03-05T10:30:00Z"
      }
    ]
  }
}
```

---

### 7. Export Students List
**GET** `/admin/export/students`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
```
classId: 507f1f77bcf86cd799439023 (optional)
format: csv (or xlsx)
```

**Success Response (200):**
```
CSV file streaming with student data
Content headers: Content-Type: text/csv, Content-Disposition: attachment
```

---

### 8. Export Report Card
**GET** `/admin/export/report-card/:studentId`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "studentName": "Raj Kumar",
    "rollNumber": "STU010",
    "class": "Class 10",
    "section": "A",
    "subjects": [
      {
        "subjectName": "Physics",
        "obtained": 85,
        "outOf": 100,
        "percentage": 85,
        "grade": "A"
      }
    ],
    "totalPercentage": 87,
    "overallGrade": "A",
    "remarks": "Excellent performance"
  }
}
```

---

## Student Management APIs

### 1. Create Student
**POST** `/students`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "fullName": "Priya Sharma",
  "dateOfBirth": "2011-08-20",
  "gender": "Female",
  "domainId": "507f1f77bcf86cd799439017",
  "classId": "507f1f77bcf86cd799439023",
  "className": "Class 10",
  "section": "B",
  "rollNumber": "STU011",
  "parentName": "Mrs. Meera Sharma",
  "parentPhone": "+919876543213",
  "parentEmail": "meera.sharma@email.com",
  "address": "456 Oak Avenue, City",
  "admissionDate": "2025-06-01"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Student created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439029",
    "fullName": "Priya Sharma",
    "username": "STU011",
    "role": "student",
    "class": "Class 10",
    "section": "B",
    "rollNumber": "STU011"
  }
}
```

---

### 2. Get All Students
**GET** `/students`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
```
classId: 507f1f77bcf86cd799439023 (optional)
search: Priya (optional)
page: 1
limit: 20
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "_id": "507f1f77bcf86cd799439024",
        "fullName": "Raj Kumar",
        "username": "STU010",
        "class": "Class 10",
        "section": "A",
        "rollNumber": "STU010"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 450,
      "pages": 23
    }
  }
}
```

---

### 3. Get Student by ID
**GET** `/students/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439024",
    "fullName": "Raj Kumar",
    "dateOfBirth": "2012-05-15",
    "gender": "Male",
    "username": "STU010",
    "email": "raj.kumar@student.school.com",
    "class": "Class 10",
    "section": "A",
    "rollNumber": "STU010",
    "parentId": "507f1f77bcf86cd799439025",
    "profilePhoto": "https://cloudinary.com/...",
    "admissionDate": "2025-06-01",
    "status": "active"
  }
}
```

---

### 4. Update Student
**PUT** `/students/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "fullName": "Raj Kumar Updated",
  "phone": "+919876543214",
  "address": "789 Pine Street, City"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Student updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439024",
    "fullName": "Raj Kumar Updated",
    "phone": "+919876543214",
    "address": "789 Pine Street, City"
  }
}
```

---

### 5. Get Student Progress
**GET** `/students/:id/progress`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "studentId": "507f1f77bcf86cd799439024",
    "studentName": "Raj Kumar",
    "summaryBySubject": [
      {
        "subjectName": "Physics",
        "subjectId": "507f1f77bcf86cd799439026",
        "totalMarks": 100,
        "obtainedMarks": 85,
        "percentage": 85,
        "grade": "A",
        "assessments": [
          {
            "examType": "UNIT_TEST",
            "date": "2026-02-15",
            "marksObtained": 85
          }
        ]
      }
    ],
    "overallPercentage": 87,
    "overallGrade": "A",
    "attendancePercentage": 92,
    "lastUpdated": "2026-03-05T12:00:00Z"
  }
}
```

---

## Teacher Panel APIs

### 1. Get Assigned Classes
**GET** `/teacher/classes`

**Headers:**
```
Authorization: Bearer <teacher_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "classes": [
      {
        "_id": "507f1f77bcf86cd799439023",
        "className": "Class 10",
        "section": "A",
        "totalStudents": 40,
        "subject": "Physics"
      }
    ]
  }
}
```

---

### 2. Get Class Students
**GET** `/teacher/students`

**Headers:**
```
Authorization: Bearer <teacher_token>
```

**Query Parameters:**
```
classId: 507f1f77bcf86cd799439023
section: A
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "_id": "507f1f77bcf86cd799439024",
        "fullName": "Raj Kumar",
        "rollNumber": "STU010",
        "email": "raj.kumar@student.school.com"
      }
    ]
  }
}
```

---

### 3. Mark Attendance
**POST** `/teacher/attendance`

**Headers:**
```
Authorization: Bearer <teacher_token>
```

**Request:**
```json
{
  "classId": "507f1f77bcf86cd799439023",
  "section": "A",
  "date": "2026-03-05",
  "attendance": [
    {
      "studentId": "507f1f77bcf86cd799439024",
      "status": "present"
    },
    {
      "studentId": "507f1f77bcf86cd799439030",
      "status": "absent"
    },
    {
      "studentId": "507f1f77bcf86cd799439031",
      "status": "late"
    }
  ]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439032",
    "classId": "507f1f77bcf86cd799439023",
    "date": "2026-03-05",
    "totalStudents": 40,
    "presentCount": 38,
    "absentCount": 1,
    "lateCount": 1
  }
}
```

---

### 4. Add Marks
**POST** `/teacher/add-marks`

**Headers:**
```
Authorization: Bearer <teacher_token>
```

**Request:**
```json
{
  "examId": "507f1f77bcf86cd799439033",
  "classId": "507f1f77bcf86cd799439023",
  "subjectId": "507f1f77bcf86cd799439026",
  "marks": [
    {
      "studentId": "507f1f77bcf86cd799439024",
      "marksObtained": 85,
      "outOf": 100
    },
    {
      "studentId": "507f1f77bcf86cd799439030",
      "marksObtained": 92,
      "outOf": 100
    }
  ]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Marks added successfully",
  "data": {
    "examId": "507f1f77bcf86cd799439033",
    "classId": "507f1f77bcf86cd799439023",
    "subjectId": "507f1f77bcf86cd799439026",
    "marksAdded": 2,
    "timestamp": "2026-03-05T13:00:00Z"
  }
}
```

---

### 5. Create Assignment
**POST** `/teacher/assignment`

**Headers:**
```
Authorization: Bearer <teacher_token>
Content-Type: application/json
```

**Request:**
```json
{
  "title": "Chapter 5 - Waves Exercise",
  "description": "Solve all questions from exercise 5.1 and 5.2",
  "classId": "507f1f77bcf86cd799439023",
  "subjectId": "507f1f77bcf86cd799439026",
  "dueDate": "2026-03-10",
  "totalMarks": 20,
  "instructions": "Submit in PDF format"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Assignment created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439034",
    "title": "Chapter 5 - Waves Exercise",
    "description": "Solve all questions from exercise 5.1 and 5.2",
    "classId": "507f1f77bcf86cd799439023",
    "subjectId": "507f1f77bcf86cd799439026",
    "dueDate": "2026-03-10",
    "totalMarks": 20,
    "createdBy": "507f1f77bcf86cd799439022",
    "createdAt": "2026-03-05T13:10:00Z"
  }
}
```

---

### 6. Post Announcement
**POST** `/teacher/announcement`

**Headers:**
```
Authorization: Bearer <teacher_token>
```

**Request:**
```json
{
  "title": "Class 10A - Important Notice",
  "description": "Physics practical exam will be held on March 15th. Please prepare accordingly.",
  "classId": "507f1f77bcf86cd799439023",
  "priority": "high"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Announcement posted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439035",
    "title": "Class 10A - Important Notice",
    "description": "Physics practical exam will be held on March 15th.",
    "classId": "507f1f77bcf86cd799439023",
    "postedBy": "507f1f77bcf86cd799439022",
    "priority": "high",
    "createdAt": "2026-03-05T13:15:00Z"
  }
}
```

---

### 7. Publish Content
**POST** `/teacher/publish-content`

**Headers:**
```
Authorization: Bearer <teacher_token>
Content-Type: multipart/form-data
```

**Request (Form Data):**
```
title: Electromagnetic Waves - Part 1
description: Comprehensive notes on electromagnetic waves
contentType: notes
classId: 507f1f77bcf86cd799439023
subjectId: 507f1f77bcf86cd799439026
file: <file upload>
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Content published successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439036",
    "title": "Electromagnetic Waves - Part 1",
    "contentType": "notes",
    "classId": "507f1f77bcf86cd799439023",
    "subjectId": "507f1f77bcf86cd799439026",
    "fileUrl": "https://cloudinary.com/...",
    "publishedBy": "507f1f77bcf86cd799439022",
    "publishedAt": "2026-03-05T13:20:00Z"
  }
}
```

---

### 8. Schedule Class/Online Meeting
**POST** `/teacher/schedule-class`

**Headers:**
```
Authorization: Bearer <teacher_token>
```

**Request:**
```json
{
  "title": "Physics Class - Electromagnetic Waves",
  "description": "Live class on electromagnetic spectrum and properties",
  "classId": "507f1f77bcf86cd799439023",
  "subjectId": "507f1f77bcf86cd799439026",
  "date": "2026-03-06",
  "startTime": "14:00",
  "endTime": "15:00",
  "meetingLink": "https://meet.meet.google.com/abc-defg-hij"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Class scheduled successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439037",
    "title": "Physics Class - Electromagnetic Waves",
    "description": "Live class on electromagnetic spectrum and properties",
    "classId": "507f1f77bcf86cd799439023",
    "subjectId": "507f1f77bcf86cd799439026",
    "scheduledFor": "2026-03-06T14:00:00Z",
    "meetingLink": "https://meet.meet.google.com/abc-defg-hij",
    "createdBy": "507f1f77bcf86cd799439022"
  }
}
```

---

## Content and Class APIs

### 1. Get Student Content
**GET** `/student/content`

**Headers:**
```
Authorization: Bearer <student_token>
```

**Query Parameters:**
```
classId: 507f1f77bcf86cd799439023 (optional)
subjectId: 507f1f77bcf86cd799439026 (optional)
contentType: notes (optional - notes, pdf, video, assignment)
page: 1
limit: 20
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "_id": "507f1f77bcf86cd799439036",
        "title": "Electromagnetic Waves - Part 1",
        "description": "Comprehensive notes on electromagnetic waves",
        "contentType": "notes",
        "subject": "Physics",
        "fileUrl": "https://cloudinary.com/...",
        "publishedBy": "Mrs. Sarah Johnson",
        "publishedAt": "2026-03-05T13:20:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

---

### 2. Get Upcoming Classes
**GET** `/student/upcoming-classes`

**Headers:**
```
Authorization: Bearer <student_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "upcomingClasses": [
      {
        "_id": "507f1f77bcf86cd799439037",
        "title": "Physics Class - Electromagnetic Waves",
        "description": "Live class on electromagnetic spectrum and properties",
        "subject": "Physics",
        "className": "Class 10",
        "teacher": "Mrs. Sarah Johnson",
        "scheduledFor": "2026-03-06T14:00:00Z",
        "meetingLink": "https://meet.meet.google.com/abc-defg-hij"
      }
    ]
  }
}
```

---

## Attendance APIs

### 1. Mark Attendance (Teacher)
**POST** `/teacher/attendance`

*Refer to Teacher Panel APIs section above*

---

### 2. Get Class Attendance
**GET** `/attendance/class/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
```
startDate: 2026-02-01
endDate: 2026-03-05
section: A
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "classId": "507f1f77bcf86cd799439023",
    "className": "Class 10",
    "section": "A",
    "records": [
      {
        "date": "2026-03-05",
        "totalPresent": 38,
        "totalAbsent": 1,
        "totalLate": 1,
        "details": [
          {
            "studentName": "Raj Kumar",
            "rollNumber": "STU010",
            "status": "present"
          }
        ]
      }
    ]
  }
}
```

---

### 3. Get Student Attendance
**GET** `/attendance/student/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "studentId": "507f1f77bcf86cd799439024",
    "studentName": "Raj Kumar",
    "className": "Class 10",
    "section": "A",
    "totalDaysPresent": 85,
    "totalDaysAbsent": 5,
    "totalDaysLate": 2,
    "attendancePercentage": 92,
    "records": [
      {
        "date": "2026-03-05",
        "status": "present"
      }
    ]
  }
}
```

---

## Exam and Marks APIs

### 1. Create Exam
**POST** `/exams`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "examName": "Mid Term Physics",
  "examType": "MID_TERM",
  "classId": "507f1f77bcf86cd799439023",
  "subjectId": "507f1f77bcf86cd799439026",
  "totalMarks": 100,
  "date": "2026-03-15",
  "startTime": "09:00",
  "endTime": "11:00",
  "instructions": "Attempt all questions. Calculators allowed."
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Exam created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439033",
    "examName": "Mid Term Physics",
    "examType": "MID_TERM",
    "class": "Class 10",
    "subject": "Physics",
    "totalMarks": 100,
    "date": "2026-03-15",
    "createdAt": "2026-03-05T14:00:00Z"
  }
}
```

---

### 2. Get All Exams
**GET** `/exams`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
classId: 507f1f77bcf86cd799439023
examType: MID_TERM
page: 1
limit: 10
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "exams": [
      {
        "_id": "507f1f77bcf86cd799439033",
        "examName": "Mid Term Physics",
        "examType": "MID_TERM",
        "class": "Class 10",
        "subject": "Physics",
        "totalMarks": 100,
        "date": "2026-03-15"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 24
    }
  }
}
```

---

### 3. Add Marks
**POST** `/teacher/add-marks`

*Refer to Teacher Panel APIs section above*

---

### 4. Get Student Marks
**GET** `/marks/student/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "studentId": "507f1f77bcf86cd799439024",
    "studentName": "Raj Kumar",
    "class": "Class 10",
    "marks": [
      {
        "examName": "Unit Test 1",
        "examType": "UNIT_TEST",
        "subject": "Physics",
        "marksObtained": 85,
        "outOf": 100,
        "percentage": 85,
        "date": "2026-02-15"
      },
      {
        "examName": "Mid Term Physics",
        "examType": "MID_TERM",
        "subject": "Physics",
        "marksObtained": 92,
        "outOf": 100,
        "percentage": 92,
        "date": "2026-03-15"
      }
    ]
  }
}
```

---

### 5. Get Exam Marks
**GET** `/marks/exam/:id`

**Headers:**
```
Authorization: Bearer <teacher_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "examId": "507f1f77bcf86cd799439033",
    "examName": "Mid Term Physics",
    "totalStudents": 40,
    "marksEntries": [
      {
        "studentId": "507f1f77bcf86cd799439024",
        "studentName": "Raj Kumar",
        "rollNumber": "STU010",
        "marksObtained": 92,
        "outOf": 100,
        "percentage": 92,
        "grade": "A"
      }
    ],
    "classAverage": 78.5,
    "highestMarks": 98,
    "lowestMarks": 45
  }
}
```

---

## Student Results APIs

### 1. Get Student Results
**GET** `/student/results`

**Headers:**
```
Authorization: Bearer <student_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "studentId": "507f1f77bcf86cd799439024",
    "studentName": "Raj Kumar",
    "class": "Class 10",
    "results": [
      {
        "_id": "507f1f77bcf86cd799439038",
        "examName": "Mid Term",
        "examType": "MID_TERM",
        "subjectMarks": [
          {
            "subject": "Physics",
            "marksObtained": 92,
            "outOf": 100,
            "percentage": 92,
            "grade": "A"
          },
          {
            "subject": "Chemistry",
            "marksObtained": 88,
            "outOf": 100,
            "percentage": 88,
            "grade": "A"
          }
        ],
        "totalMarks": 180,
        "totalOut": 200,
        "percentage": 90,
        "grade": "A",
        "rank": 2,
        "generatedAt": "2026-03-16T00:00:00Z"
      }
    ]
  }
}
```

---

### 2. Generate Report Card
**POST** `/results/student/:id/generate`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "examType": "MID_TERM",
  "classId": "507f1f77bcf86cd799439023"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Report card generated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439039",
    "studentName": "Raj Kumar",
    "class": "Class 10",
    "examType": "MID_TERM",
    "generatedAt": "2026-03-16T10:00:00Z",
    "reportCardUrl": "https://cloudinary.com/..."
  }
}
```

---

### 3. Get Report Card
**GET** `/results/student/:id/report-card`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "studentId": "507f1f77bcf86cd799439024",
    "studentName": "Raj Kumar",
    "class": "Class 10",
    "section": "A",
    "rollNumber": "STU010",
    "reportCard": {
      "examName": "Mid Term",
      "examDate": "2026-03-15",
      "subjects": [
        {
          "subjectName": "Physics",
          "marksObtained": 92,
          "outOf": 100,
          "percentage": 92,
          "grade": "A"
        },
        {
          "subjectName": "Chemistry",
          "marksObtained": 88,
          "outOf": 100,
          "percentage": 88,
          "grade": "A"
        }
      ],
      "totalMarks": 180,
      "totalOut": 200,
      "overallPercentage": 90,
      "overallGrade": "A",
      "comments": "Excellent performance in this exam"
    }
  }
}
```

---

## Parent Portal APIs

### 1. Get Child Info
**GET** `/parent/student`

**Headers:**
```
Authorization: Bearer <parent_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "parentId": "507f1f77bcf86cd799439025",
    "parentName": "Mr. Ramesh Kumar",
    "children": [
      {
        "_id": "507f1f77bcf86cd799439024",
        "fullName": "Raj Kumar",
        "class": "Class 10",
        "section": "A",
        "rollNumber": "STU010",
        "currentGPA": 4.0,
        "status": "active"
      }
    ]
  }
}
```

---

### 2. Get Child Attendance
**GET** `/parent/attendance`

**Headers:**
```
Authorization: Bearer <parent_token>
```

**Query Parameters:**
```
studentId: 507f1f77bcf86cd799439024
month: 2026-03
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "studentName": "Raj Kumar",
    "month": "March 2026",
    "totalDays": 20,
    "presentDays": 18,
    "absentDays": 1,
    "lateDays": 1,
    "attendancePercentage": 90,
    "attendanceRecords": [
      {
        "date": "2026-03-05",
        "status": "present"
      },
      {
        "date": "2026-03-06",
        "status": "absent"
      }
    ]
  }
}
```

---

### 3. Get Child Results
**GET** `/parent/results`

**Headers:**
```
Authorization: Bearer <parent_token>
```

**Query Parameters:**
```
studentId: 507f1f77bcf86cd799439024
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "studentName": "Raj Kumar",
    "results": [
      {
        "examName": "Unit Test 1",
        "examType": "UNIT_TEST",
        "totalMarks": 180,
        "marksObtained": 170,
        "percentage": 94.4,
        "grade": "A+",
        "date": "2026-02-15"
      },
      {
        "examName": "Mid Term",
        "examType": "MID_TERM",
        "totalMarks": 200,
        "marksObtained": 180,
        "percentage": 90,
        "grade": "A",
        "date": "2026-03-15"
      }
    ]
  }
}
```

---

### 4. Get Upcoming Classes
**GET** `/parent/upcoming-classes`

**Headers:**
```
Authorization: Bearer <parent_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "upcomingClasses": [
      {
        "_id": "507f1f77bcf86cd799439037",
        "title": "Physics Class - Electromagnetic Waves",
        "subject": "Physics",
        "teacher": "Mrs. Sarah Johnson",
        "className": "Class 10",
        "scheduledFor": "2026-03-06T14:00:00Z",
        "meetingLink": "https://meet.meet.google.com/abc-defg-hij"
      }
    ]
  }
}
```

---

### 5. Get Report Card
**GET** `/parent/report-card`

**Headers:**
```
Authorization: Bearer <parent_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "studentName": "Raj Kumar",
    "class": "Class 10",
    "section": "A",
    "reportCard": {
      "examName": "Mid Term",
      "subjects": [
        {
          "subject": "Physics",
          "marksObtained": 92,
          "percentage": 92,
          "grade": "A"
        },
        {
          "subject": "Chemistry",
          "marksObtained": 88,
          "percentage": 88,
          "grade": "A"
        }
      ],
      "totalPercentage": 90,
      "overallGrade": "A"
    }
  }
}
```

---

## Domain, Class & Subject APIs

### 1. Create Domain
**POST** `/domains`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "domainName": "Vedic Mathematics",
  "description": "Ancient mathematical techniques for fast computation",
  "image": "vedic_math.jpg"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Domain created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439040",
    "domainName": "Vedic Mathematics",
    "description": "Ancient mathematical techniques for fast computation"
  }
}
```

---

### 2. Get All Domains
**GET** `/domains`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "domains": [
      {
        "_id": "507f1f77bcf86cd799439017",
        "domainName": "Generic School",
        "description": "CBSE Curriculum",
        "totalClasses": 12
      },
      {
        "_id": "507f1f77bcf86cd799439040",
        "domainName": "Vedic Mathematics",
        "description": "Ancient mathematical techniques",
        "totalClasses": 5
      }
    ]
  }
}
```

---

### 3. Create Class
**POST** `/classes`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "className": "Class 10",
  "sections": ["A", "B", "C"],
  "domainId": "507f1f77bcf86cd799439017",
  "capacity": 40
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Class created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439023",
    "className": "Class 10",
    "sections": ["A", "B", "C"],
    "domainId": "507f1f77bcf86cd799439017"
  }
}
```

---

### 4. Get All Classes
**GET** `/classes`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
domainId: 507f1f77bcf86cd799439017 (optional)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "classes": [
      {
        "_id": "507f1f77bcf86cd799439023",
        "className": "Class 10",
        "sections": ["A", "B", "C"],
        "domain": "Generic School",
        "totalEnrolled": 115,
        "capacity": 120
      }
    ]
  }
}
```

---

### 5. Assign Teacher to Class
**POST** `/classes/:id/assign-teacher`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "teacherId": "507f1f77bcf86cd799439022",
  "subjectId": "507f1f77bcf86cd799439026",
  "section": "A"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Teacher assigned successfully",
  "data": {
    "classId": "507f1f77bcf86cd799439023",
    "teacherId": "507f1f77bcf86cd799439022",
    "teacherName": "Mrs. Sarah Johnson",
    "subject": "Physics",
    "section": "A",
    "assignedAt": "2026-03-05T14:30:00Z"
  }
}
```

---

### 6. Create Subject
**POST** `/subjects`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "subjectName": "Physics",
  "subjectCode": "PHY101",
  "description": "Physics for CBSE board",
  "domainId": "507f1f77bcf86cd799439017",
  "classIds": ["507f1f77bcf86cd799439023"]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Subject created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439026",
    "subjectName": "Physics",
    "subjectCode": "PHY101",
    "domain": "Generic School",
    "classes": ["Class 10"]
  }
}
```

---

### 7. Get All Subjects
**GET** `/subjects`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
classId: 507f1f77bcf86cd799439023 (optional)
domainId: 507f1f77bcf86cd799439017 (optional)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "subjects": [
      {
        "_id": "507f1f77bcf86cd799439026",
        "subjectName": "Physics",
        "subjectCode": "PHY101",
        "domain": "Generic School"
      }
    ]
  }
}
```

---

### 8. Assign Teacher to Subject
**POST** `/subjects/:id/assign-teacher`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "teacherId": "507f1f77bcf86cd799439022",
  "classId": "507f1f77bcf86cd799439023"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Teacher assigned to subject successfully",
  "data": {
    "subjectId": "507f1f77bcf86cd799439026",
    "teacherId": "507f1f77bcf86cd799439022",
    "classId": "507f1f77bcf86cd799439023",
    "assignedAt": "2026-03-05T14:35:00Z"
  }
}
```

---

## Notification and Reminder System

### Reminder Triggers
The system uses **node-cron** background jobs that run every minute:
- **30 minutes before class**: Send notification reminder
- **10 minutes before class**: Send urgent notification reminder

### Delivery Channels
- Push notifications
- Email notifications

### Notification Storage
All notifications are stored in the `notifications` collection with timestamps and delivery status.

---

## Database Models Implemented
- User
- Student
- Teacher
- Parent
- TeacherApplication
- Domain
- Class
- Subject
- Attendance
- Exam
- Marks
- Result
- Content
- Assignment
- OnlineClass
- Notification
- RefreshToken
- Book
- Enquiry
- Event
- Fee
- Homework
- Issue
- Like
- Post
- OTP

---

## Production Features Included
- ✅ **Pagination, Filtering & Search**: All list endpoints support pagination with customizable page and limit
- ✅ **File Upload**: Cloudinary integration for document, photo, and media uploads
- ✅ **Request Validation**: Joi schema validation on all inputs
- ✅ **Security**: Rate limiting and Helmet.js for HTTP headers
- ✅ **Centralized Error Handling**: Consistent error responses across all endpoints
- ✅ **Logging**: Request/response logging for debugging
- ✅ **JWT Authentication**: Secure token-based authentication with refresh mechanism
- ✅ **RBAC Authorization**: Role-based access control (Admin, Teacher, Student, Parent)
- ✅ **Cron Jobs**: Automated reminder notifications
- ✅ **Response Standardization**: All endpoints return consistent JSON structure

---

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

---

## Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Validation failed |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error - Server error |

---

## API Testing Assets

### Postman Collection
- **Location**: `docs/School_ERP.postman_collection.json`
- **Features**: Pre-configured requests for all endpoints with sample data
- **Import**: Import this file into Postman to test all APIs directly

### Seed Test Data
**Command**: `npm run seed`

**Seeded Data Includes**:
- 1 Admin account
- 5 Teachers (assigned to various classes)
- 50 Students (distributed across classes)
- 10+ Classes (Generic school + domain-specific)
- 15+ Subjects
- Sample assignments, announcements, and content

---

## Swagger Documentation

### Access Swagger UI
- **URL**: `http://localhost:PORT/api-docs` (or `/docs`)
- **JSON Schema**: `http://localhost:PORT/api-docs.json` (or `/docs.json`)

### Features
- Interactive API testing
- Request/response schemas
- Authentication setup
- Real-time API exploration

---

## Authentication Headers

All protected endpoints require the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

**Example**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2ODc1MzAyMDAsImV4cCI6MTY4NzUzMzgwMH0.7zKq...
```

---

## Environment Configuration

Create a `.env` file in the root directory with these variables:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/school_erp

# JWT
JWT_SECRET=your_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Cloudinary
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

---

## Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Seed Database**
   ```bash
   npm run seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access APIs**
   - Base URL: `http://localhost:5000`
   - Swagger Docs: `http://localhost:5000/api-docs`

---

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Default Limit**: 100 requests per 15 minutes per IP
- **Admin Endpoints**: 500 requests per 15 minutes
- **File Upload**: 50 MB maximum file size

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "field": "email",
      "message": "Invalid email format"
    }
  }
}
```

---

## Support & Documentation

- **API Documentation**: See Swagger UI at `/api-docs`
- **Postman Collection**: Import from `docs/School_ERP.postman_collection.json`
- **Code Documentation**: See `src/docs/README.md` for detailed controller and service documentation
- **Issue Reporting**: Submit issues to the project repository

---

*Last Updated: March 5, 2026*
