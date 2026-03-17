# Teacher API Documentation

## Base URL
`/api/teacher`

---

## Authentication
- **POST /api/auth/login**
  - Login with role: teacher
  - Body: `{ email, password, role: 'teacher' }`
- **POST /api/auth/logout**
- **POST /api/auth/logout-all**
- **GET /api/auth/me**

---

## Teacher Self-Service
- **POST /api/teachers/change-password**

---

## Dashboard
- **GET /api/teacher/dashboard**
  - Returns summary: total students, pending assignments, attendance %, upcoming exams

---

## Attendance Management
- **POST /api/teacher/attendance**
  - Mark attendance for class/day
  - Body example:
    ```json
    {
      "class": "5A",
      "date": "2026-03-17",
      "students": [
        {"name": "John Doe", "status": "present"},
        {"name": "Jane Doe", "status": "absent"}
      ]
    }
    ```
- **GET /api/teacher/attendance**
  - Query attendance per student/class
  - Supports daily, weekly, monthly summaries

---

## Assignments (Homework)
- **POST /api/teacher/homework**
- **PUT /api/teacher/homework/:id**
- **DELETE /api/teacher/homework/:id**
- **GET /api/teacher/homework**
  - Response includes: title, description, due date, submission count, total students, status summary

---

## Marks
- **POST /api/teacher/marks**
- **PUT /api/teacher/marks/:id**
- **GET /api/teacher/marks/:examId**

---

## Exams
- **POST /api/class/exams**
- **GET /api/class/exams/:classId**
- **GET /api/student/exams**

---

## Meet Links
- **POST /api/teacher/meetings**
  - Create meet link for class
- **GET /api/teacher/meetings**
  - Get meet links per class with teacher name and link

---

## Timetable
---

## Content Management (Modules)
Teachers can create, update, delete, and view content (notes, materials, announcements) for classes or individual students.

- **POST /api/teacher/content** — Create content (notes/materials)
- **PUT /api/teacher/content/:id** — Update content
- **DELETE /api/teacher/content/:id** — Delete content
- **GET /api/teacher/content** — List all content created by teacher
- **GET /api/teacher/content/:studentId** — Get content for a particular student

### Visibility
- Content created by teachers can be viewed by:
  - **Students** (assigned to the class or individually)
  - **Admin** (for monitoring and review)

### CRUD Operations
- Teachers: Full CRUD (create, read, update, delete)
- Students: Can read/view content assigned to them or their class
- Admin: Can read/view all content

---
- **GET /api/teacher/timetable**

---

## Admin APIs (Visible in Teacher App)
- **GET /api/admin/profile**
- **PUT /api/admin/change-password**
- **GET /api/admin/dashboard**

---

## Response Structure Example
```json
{
  "class": "5A",
  "date": "2026-03-17",
  "students": [
    {"name": "John Doe", "status": "present"},
    {"name": "Jane Doe", "status": "absent"}
  ],
  "content": [
    {
      "title": "Math Notes",
      "description": "Algebra basics",
      "createdBy": "teacherId",
      "visibleTo": ["studentId", "adminId"],
      "type": "note",
      "date": "2026-03-17"
    }
  ]
}
```

---

## Notes
- All endpoints require JWT authentication and session key.
- Role-based access enforced for teacher/admin.
- Responses are structured for frontend charts/tables.
- Modular routes, no duplication with admin APIs.
