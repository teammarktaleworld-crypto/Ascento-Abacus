const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '..');
const ROOT_DIR = path.resolve(SRC_DIR, '..');
const ROUTES_DIR = path.join(SRC_DIR, 'routes');
const APP_FILE = path.join(SRC_DIR, 'app.js');
const ROUTE_INDEX_FILE = path.join(ROUTES_DIR, 'index.js');
const OUTPUT_FILE = path.join(ROOT_DIR, 'ALL_APIS_ROUTES.md');

const SECTION_BY_ROUTE_FILE = {
  'auth.routes': 'Auth',
  'admission.routes': 'Admission And Applications',
  'teacher-application.routes': 'Admission And Applications',
  'teacher.routes': 'Teacher Portal',
  'student.routes': 'Student Portal',
  'parent.routes': 'Parent Portal',
  'domains.routes': 'Domains',
  'classes.routes': 'Classes',
  'subjects.routes': 'Subjects',
  'teachers.routes': 'Teachers',
  'students.routes': 'Students',
  'attendance.routes': 'Attendance',
  'exams.routes': 'Exams',
  'marks.routes': 'Marks',
  'results.routes': 'Results',
  'assignments.routes': 'Assignments',
  'admin.routes': 'Admin'
};

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

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function extractMethodsFromFile(content, objectName) {
  const endpoints = [];
  const pattern = new RegExp(`${objectName}\\.(get|post|put|patch|delete)\\s*\\(\\s*['\"]([^'\"]+)['\"]`, 'gi');
  let match = pattern.exec(content);

  while (match) {
    endpoints.push({ method: match[1].toUpperCase(), path: match[2] });
    match = pattern.exec(content);
  }

  return endpoints;
}

function joinPath(basePath, routePath) {
  const base = basePath === '/' ? '' : basePath;
  const route = routePath === '/' ? '' : routePath;
  const combined = `${base}${route}`;
  return combined || '/';
}

function normalizeRouteEntries(indexContent) {
  const entries = [];
  const pattern = /router\.use\(\s*['\"]([^'\"]+)['\"]\s*,\s*require\(\s*['\"]\.\/([^'\"]+)['\"]\s*\)\s*\)/g;
  let match = pattern.exec(indexContent);

  while (match) {
    entries.push({
      mountPath: match[1],
      routeModuleName: match[2]
    });
    match = pattern.exec(indexContent);
  }

  return entries;
}

function initSections() {
  const sections = {};
  for (const section of SECTION_ORDER) {
    sections[section] = [];
  }
  return sections;
}

function pushUnique(sections, seen, sectionName, method, endpointPath) {
  const key = `${method} ${endpointPath}`;
  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  sections[sectionName].push(key);
}

function generate() {
  const sections = initSections();
  const seen = new Set();

  const appContent = read(APP_FILE);
  const systemEndpoints = extractMethodsFromFile(appContent, 'app');
  for (const endpoint of systemEndpoints) {
    pushUnique(sections, seen, 'System', endpoint.method, endpoint.path);
  }

  const indexContent = read(ROUTE_INDEX_FILE);
  const entries = normalizeRouteEntries(indexContent);

  for (const entry of entries) {
    const sectionName = SECTION_BY_ROUTE_FILE[entry.routeModuleName];
    if (!sectionName) {
      continue;
    }

    const routeFilePath = path.join(ROUTES_DIR, `${entry.routeModuleName}.js`);
    if (!fs.existsSync(routeFilePath)) {
      continue;
    }

    const routeContent = read(routeFilePath);
    const endpoints = extractMethodsFromFile(routeContent, 'router');
    for (const endpoint of endpoints) {
      const fullPath = joinPath(entry.mountPath, endpoint.path);
      pushUnique(sections, seen, sectionName, endpoint.method, fullPath);
    }
  }

  const lines = [
    '# School ERP Backend - API List',
    '',
    'Exact API endpoints currently registered in Express routes.',
    'No duplicate method + path entries.',
    ''
  ];

  for (const section of SECTION_ORDER) {
    if (!sections[section].length) {
      continue;
    }

    lines.push(`## ${section}`);
    for (const endpoint of sections[section]) {
      lines.push(endpoint);
    }
    lines.push('');
  }

  fs.writeFileSync(OUTPUT_FILE, `${lines.join('\n').trim()}\n`, 'utf8');
  console.log(`Generated ${path.relative(ROOT_DIR, OUTPUT_FILE)} with ${seen.size} unique APIs.`);
}

generate();
