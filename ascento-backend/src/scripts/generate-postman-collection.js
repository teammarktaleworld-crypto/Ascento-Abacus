const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const ROUTES_FILE = path.join(ROOT_DIR, 'ALL_APIS_ROUTES.md');
const OUTPUT_FILE = path.join(ROOT_DIR, 'docs', 'School_ERP.postman_collection.json');

const SECTION_ORDER = [
  'System',
  'Auth',
  'Admission And Applications',
  'Teacher Portal',
  'Student Portal',
  'Parent Portal',
  'Domains',
  'Classes',
  'Subjects',
  'Teachers',
  'Students',
  'Attendance',
  'Exams',
  'Marks',
  'Results',
  'Assignments',
  'Admin'
];

const BODY_TEMPLATES = {
  'POST /auth/admin/login': { email: '{{adminEmail}}', password: '{{adminPassword}}' },
  'POST /auth/teacher/login': { identifier: '{{teacherIdentifier}}', password: '{{teacherPassword}}' },
  'POST /auth/student/login': { identifier: '{{studentIdentifier}}', password: '{{studentPassword}}' },
  'POST /auth/parent/request-otp': { phone: '{{parentPhone}}' },
  'POST /auth/parent/login': { email: '{{parentEmail}}', password: '{{parentPassword}}' },
  'POST /auth/refresh': { refreshToken: '{{refreshToken}}' },

  'POST /admission/apply': {
    studentFullName: '{{studentFullName}}',
    dateOfBirth: '{{studentDateOfBirth}}',
    gender: '{{studentGender}}',
    domainId: '{{domainId}}',
    classId: '{{classId}}',
    parentName: '{{parentName}}',
    parentPhone: '{{parentPhone}}',
    parentEmail: '{{parentEmail}}'
  },
  'POST /teacher/apply': {
    fullName: '{{teacherFullName}}',
    email: '{{teacherEmail}}',
    phone: '{{teacherPhone}}',
    qualification: '{{teacherQualification}}',
    experience: '{{teacherExperience}}',
    subjects: ['{{subjectName1}}', '{{subjectName2}}'],
    resumeBase64: '{{resumeBase64}}',
    documentUploads: [
      { name: '{{supportingDocumentName}}', base64: '{{supportingDocumentBase64}}' }
    ]
  },

  'POST /teacher/attendance': {
    date: '{{todayDate}}',
    classId: '{{classId}}',
    records: [{ studentId: '{{studentId}}', status: 'present' }]
  },
  'POST /teacher/marks': {
    examId: '{{examId}}',
    studentId: '{{studentId}}',
    subjectId: '{{subjectId}}',
    obtainedMarks: 80,
    totalMarks: 100
  },
  'POST /teacher/add-marks': {
    examId: '{{examId}}',
    studentId: '{{studentId}}',
    subjectId: '{{subjectId}}',
    obtainedMarks: 80,
    totalMarks: 100
  },
  'POST /teacher/assignment': {
    title: '{{assignmentTitle}}',
    description: '{{assignmentDescription}}',
    domainId: '{{domainId}}',
    classId: '{{classId}}',
    subjectId: '{{subjectId}}',
    dueDate: '{{futureDate}}'
  },
  'POST /teacher/announcement': {
    title: '{{announcementTitle}}',
    description: '{{announcementDescription}}',
    domainId: '{{domainId}}',
    classId: '{{classId}}',
    subjectId: '{{subjectId}}'
  },
  'POST /teacher/publish-content': {
    title: '{{contentTitle}}',
    description: '{{contentDescription}}',
    contentType: 'notes',
    domainId: '{{domainId}}',
    classId: '{{classId}}',
    subjectId: '{{subjectId}}'
  },
  'POST /teacher/schedule-class': {
    title: '{{classSessionTitle}}',
    description: '{{classSessionDescription}}',
    domainId: '{{domainId}}',
    classId: '{{classId}}',
    subjectId: '{{subjectId}}',
    date: '{{futureDate}}',
    startTime: '10:00',
    endTime: '11:00',
    meetingLink: '{{meetingLink}}'
  },

  'POST /domains': { name: '{{domainName}}', code: '{{domainCode}}', description: '{{domainDescription}}' },
  'POST /classes': {
    domainId: '{{domainId}}',
    className: '{{className}}',
    standardNumber: 6,
    section: '{{section}}'
  },
  'POST /classes/:id/assign-teacher': { teacherId: '{{teacherId}}' },
  'POST /subjects': {
    domainId: '{{domainId}}',
    classId: '{{classId}}',
    name: '{{subjectName1}}',
    code: '{{subjectCode}}'
  },
  'POST /subjects/:id/assign-teacher': { teacherId: '{{teacherId}}' },

  'POST /teachers': {
    name: '{{teacherFullName}}',
    email: '{{teacherEmail}}',
    phone: '{{teacherPhone}}',
    domainIds: ['{{domainId}}'],
    subjectIds: ['{{subjectId}}'],
    assignedClassIds: ['{{classId}}'],
    experience: '{{teacherExperience}}',
    qualification: '{{teacherQualification}}'
  },
  'PUT /teachers/:id': {
    name: '{{teacherFullName}}',
    email: '{{teacherEmail}}',
    phone: '{{teacherPhone}}',
    experience: '{{teacherExperience}}',
    qualification: '{{teacherQualification}}',
    isActive: true
  },

  'POST /students': {
    fullName: '{{studentFullName}}',
    dateOfBirth: '{{studentDateOfBirth}}',
    gender: '{{studentGender}}',
    domainId: '{{domainId}}',
    classId: '{{classId}}',
    className: '{{className}}',
    section: '{{section}}',
    rollNumber: '{{rollNumber}}',
    parentName: '{{parentName}}',
    parentPhone: '{{parentPhone}}',
    parentEmail: '{{parentEmail}}',
    address: '{{address}}'
  },
  'PUT /students/:id': {
    fullName: '{{studentFullName}}',
    address: '{{address}}',
    parentPhone: '{{parentPhone}}',
    improvementNotes: '{{improvementNotes}}'
  },

  'POST /attendance': {
    date: '{{todayDate}}',
    classId: '{{classId}}',
    records: [{ studentId: '{{studentId}}', status: 'present' }]
  },
  'POST /exams': {
    name: '{{examName}}',
    examType: 'MID_TERM',
    domainId: '{{domainId}}',
    classId: '{{classId}}',
    section: '{{section}}',
    examDate: '{{futureDate}}'
  },
  'POST /marks': {
    examId: '{{examId}}',
    studentId: '{{studentId}}',
    subjectId: '{{subjectId}}',
    obtainedMarks: 80,
    totalMarks: 100
  },
  'POST /results/student/:id/generate': { examId: '{{examId}}' },
  'POST /assignments': {
    title: '{{assignmentTitle}}',
    description: '{{assignmentDescription}}',
    domainId: '{{domainId}}',
    classId: '{{classId}}',
    subjectId: '{{subjectId}}',
    dueDate: '{{futureDate}}'
  },

  'POST /admin/create-teacher': {
    name: '{{teacherFullName}}',
    email: '{{teacherEmail}}',
    phone: '{{teacherPhone}}',
    domainIds: ['{{domainId}}'],
    subjectIds: ['{{subjectId}}'],
    assignedClassIds: ['{{classId}}'],
    experience: '{{teacherExperience}}',
    qualification: '{{teacherQualification}}'
  },
  'POST /admin/create-student': {
    fullName: '{{studentFullName}}',
    dateOfBirth: '{{studentDateOfBirth}}',
    gender: '{{studentGender}}',
    domainId: '{{domainId}}',
    classId: '{{classId}}',
    className: '{{className}}',
    section: '{{section}}',
    rollNumber: '{{rollNumber}}',
    parentName: '{{parentName}}',
    parentPhone: '{{parentPhone}}',
    parentEmail: '{{parentEmail}}',
    address: '{{address}}'
  },
  'POST /admin/create-class': {
    domainId: '{{domainId}}',
    className: '{{className}}',
    standardNumber: 6,
    section: '{{section}}'
  },
  'POST /admin/create-subject': {
    domainId: '{{domainId}}',
    classId: '{{classId}}',
    name: '{{subjectName1}}',
    code: '{{subjectCode}}'
  },
  'POST /admin/assign-teacher': {
    teacherId: '{{teacherId}}',
    classId: '{{classId}}',
    subjectId: '{{subjectId}}'
  },
  'POST /admin/approve-teacher/:id': {},
  'POST /admin/approve-student/:id': {
    classId: '{{classId}}',
    rollNumber: '{{rollNumber}}'
  },
  'POST /admin/reject-teacher/:id': { remark: '{{rejectRemark}}' },
  'POST /admin/reject-student/:id': { remark: '{{rejectRemark}}' }
};

const TOKEN_BY_SECTION = {
  System: null,
  Auth: null,
  'Admission And Applications': null,
  'Teacher Portal': 'teacherToken',
  'Student Portal': 'studentToken',
  'Parent Portal': 'parentToken',
  Domains: 'adminToken',
  Classes: 'adminToken',
  Subjects: 'adminToken',
  Teachers: 'adminToken',
  Students: 'adminToken',
  Attendance: 'adminToken',
  Exams: 'adminToken',
  Marks: 'adminToken',
  Results: 'adminToken',
  Assignments: 'adminToken',
  Admin: 'adminToken'
};

function parseRoutes(mdText) {
  const sections = {};
  let current = null;
  const lines = mdText.split(/\r?\n/);

  for (const line of lines) {
    if (line.startsWith('## ')) {
      current = line.slice(3).trim();
      sections[current] = [];
      continue;
    }

    const match = line.match(/^(GET|POST|PUT|PATCH|DELETE)\s+\/(.*)$/);
    if (match && current) {
      sections[current].push({ method: match[1], path: '/' + match[2] });
    }
  }

  return sections;
}

function pathToUrl(pathname) {
  const replaced = pathname.replace(/:([A-Za-z0-9_]+)/g, '{{$1}}');
  const segments = replaced.split('/').filter(Boolean);
  return {
    raw: `{{baseUrl}}${replaced}`,
    host: ['{{baseUrl}}'],
    path: segments
  };
}

function bodyFor(method, pathname) {
  const key = `${method} ${pathname}`;
  if (!['POST', 'PUT', 'PATCH'].includes(method)) return null;
  const template = BODY_TEMPLATES[key] || {};
  return {
    mode: 'raw',
    raw: JSON.stringify(template, null, 2)
  };
}

function eventForAuth(requestName, pathName) {
  const tokenMap = {
    '/auth/admin/login': 'adminToken',
    '/auth/teacher/login': 'teacherToken',
    '/auth/student/login': 'studentToken',
    '/auth/parent/login': 'parentToken',
    '/auth/refresh': 'accessToken'
  };

  const varName = tokenMap[pathName];
  if (!varName) return undefined;

  return [
    {
      listen: 'test',
      script: {
        type: 'text/javascript',
        exec: [
          'pm.test("Status code is 2xx", function () { pm.expect(pm.response.code).to.be.within(200, 299); });',
          'let data = {};',
          'try { data = pm.response.json(); } catch (e) {}',
          `const token = data.accessToken || data?.data?.accessToken || data?.tokens?.accessToken;`,
          `if (token) { pm.collectionVariables.set("${varName}", token); }`
        ]
      }
    }
  ];
}

function requestName(method, pathname) {
  const cleanPath = pathname.replace(/\//g, ' ').replace(/:/g, '').trim();
  return `${method} ${cleanPath}`;
}

function buildCollection(sectionsMap) {
  const items = [];

  for (const section of SECTION_ORDER) {
    const endpoints = sectionsMap[section] || [];
    if (!endpoints.length) continue;

    const folder = {
      name: section,
      item: endpoints.map((endpoint) => {
        const headers = [];
        const tokenVar = TOKEN_BY_SECTION[section];

        if (tokenVar) {
          headers.push({ key: 'Authorization', value: `Bearer {{${tokenVar}}}` });
        }

        const body = bodyFor(endpoint.method, endpoint.path);
        if (body) {
          headers.push({ key: 'Content-Type', value: 'application/json' });
        }

        const request = {
          method: endpoint.method,
          header: headers,
          url: pathToUrl(endpoint.path)
        };

        if (body) request.body = body;

        const item = {
          name: requestName(endpoint.method, endpoint.path),
          request
        };

        const events = eventForAuth(item.name, endpoint.path);
        if (events) item.event = events;

        return item;
      })
    };

    items.push(folder);
  }

  return {
    info: {
      name: 'School ERP API - Complete',
      description:
        'Auto-generated complete Postman collection from ALL_APIS_ROUTES.md. Contains all active endpoints with placeholders.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    item: items,
    variable: [
      { key: 'baseUrl', value: 'https://ascento-abacus-ow3u.onrender.com' },

      { key: 'adminEmail', value: '' },
      { key: 'adminPassword', value: '' },
      { key: 'teacherIdentifier', value: '' },
      { key: 'teacherPassword', value: '' },
      { key: 'studentIdentifier', value: '' },
      { key: 'studentPassword', value: '' },
      { key: 'parentEmail', value: '' },
      { key: 'parentPhone', value: '' },
      { key: 'parentPassword', value: '' },

      { key: 'adminToken', value: '' },
      { key: 'teacherToken', value: '' },
      { key: 'studentToken', value: '' },
      { key: 'parentToken', value: '' },
      { key: 'refreshToken', value: '' },
      { key: 'accessToken', value: '' },

      { key: 'domainId', value: '' },
      { key: 'classId', value: '' },
      { key: 'subjectId', value: '' },
      { key: 'teacherId', value: '' },
      { key: 'studentId', value: '' },
      { key: 'examId', value: '' },

      { key: 'teacherFullName', value: '' },
      { key: 'teacherEmail', value: '' },
      { key: 'teacherPhone', value: '' },
      { key: 'teacherQualification', value: '' },
      { key: 'teacherExperience', value: '0' },

      { key: 'studentFullName', value: '' },
      { key: 'studentDateOfBirth', value: '' },
      { key: 'studentGender', value: 'male' },
      { key: 'className', value: '' },
      { key: 'section', value: 'A' },
      { key: 'rollNumber', value: '' },
      { key: 'parentName', value: '' },
      { key: 'address', value: '' },
      { key: 'admissionDate', value: '' },
      { key: 'previousSchool', value: '' },
      { key: 'improvementNotes', value: '' },

      { key: 'subjectName1', value: '' },
      { key: 'subjectName2', value: '' },
      { key: 'subjectCode', value: '' },
      { key: 'domainName', value: '' },
      { key: 'domainCode', value: '' },
      { key: 'domainDescription', value: '' },

      { key: 'resumeBase64', value: '' },
      { key: 'supportingDocumentName', value: '' },
      { key: 'supportingDocumentBase64', value: '' },

      { key: 'assignmentTitle', value: '' },
      { key: 'assignmentDescription', value: '' },
      { key: 'announcementTitle', value: '' },
      { key: 'announcementDescription', value: '' },
      { key: 'contentTitle', value: '' },
      { key: 'contentDescription', value: '' },
      { key: 'classSessionTitle', value: '' },
      { key: 'classSessionDescription', value: '' },
      { key: 'meetingLink', value: '' },
      { key: 'examName', value: '' },
      { key: 'todayDate', value: '' },
      { key: 'futureDate', value: '' },
      { key: 'rejectRemark', value: '' }
    ]
  };
}

function main() {
  const routesMarkdown = fs.readFileSync(ROUTES_FILE, 'utf8');
  const sections = parseRoutes(routesMarkdown);
  const collection = buildCollection(sections);
  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(collection, null, 2)}\n`, 'utf8');

  const count = collection.item.reduce((sum, folder) => sum + folder.item.length, 0);
  console.log(`Generated Postman collection with ${count} requests at ${path.relative(ROOT_DIR, OUTPUT_FILE)}`);
}

main();
