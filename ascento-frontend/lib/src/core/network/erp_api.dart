import '../models/session_user.dart';
import 'api_client.dart';

class ErpApi {
  ErpApi(this._client);

  final ApiClient _client;

  void setSession(SessionUser? session) {
    _client.setToken(session?.accessToken);
  }

  Future<SessionUser> loginAdmin({required String email, required String password}) async {
    final data = await _client.post(
      '/auth/admin/login',
      body: {'email': email, 'password': password},
      authenticated: false,
    ) as Map<String, dynamic>;
    return SessionUser.fromLoginResponse(data, 'admin');
  }

  Future<SessionUser> loginTeacher({required String email, required String password}) async {
    final data = await _client.post(
      '/auth/teacher/login',
      body: {'email': email, 'password': password},
      authenticated: false,
    ) as Map<String, dynamic>;
    return SessionUser.fromLoginResponse(data, 'teacher');
  }

  Future<SessionUser> loginStudent({
    required String identifier,
    required String password,
  }) async {
    final data = await _client.post(
      '/auth/student/login',
      body: {'identifier': identifier, 'password': password},
      authenticated: false,
    ) as Map<String, dynamic>;
    return SessionUser.fromLoginResponse(data, 'student');
  }

  Future<Map<String, dynamic>> requestParentOtp({String? phone, String? email}) async {
    final data = await _client.post(
      '/auth/parent/request-otp',
      body: {
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        if (email != null && email.isNotEmpty) 'email': email,
      },
      authenticated: false,
    ) as Map<String, dynamic>;
    return data;
  }

  Future<SessionUser> loginParent({
    String? phone,
    String? email,
    String? password,
    String? otp,
  }) async {
    final data = await _client.post(
      '/auth/parent/login',
      body: {
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        if (email != null && email.isNotEmpty) 'email': email,
        if (password != null && password.isNotEmpty) 'password': password,
        if (otp != null && otp.isNotEmpty) 'otp': otp,
      },
      authenticated: false,
    ) as Map<String, dynamic>;
    return SessionUser.fromLoginResponse(data, 'parent');
  }

  Future<Map<String, dynamic>> getDashboard() async {
    return (await _client.get('/admin/dashboard')) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getAnalytics() async {
    return (await _client.get('/admin/analytics')) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> listTeacherApplications({
    String? status,
    String? search,
    int page = 1,
    int limit = 20,
  }) async {
    return (await _client.get(
      '/admin/teacher-applications',
      query: {
        if (status != null && status.isNotEmpty) 'status': status,
        if (search != null && search.isNotEmpty) 'search': search,
        'page': page,
        'limit': limit,
      },
    )) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> approveTeacherApplication(String id) async {
    return (await _client.post('/admin/approve-teacher/$id', body: {})) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> rejectTeacherApplication(String id, {String? remark}) async {
    return (await _client.post(
      '/admin/reject-teacher/$id',
      body: {if (remark != null && remark.isNotEmpty) 'remark': remark},
    )) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> teacherApply(Map<String, dynamic> payload) async {
    return (await _client.post('/teacher/apply', body: payload, authenticated: false))
        as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createTeacher(Map<String, dynamic> payload) async {
    return (await _client.post('/admin/create-teacher', body: payload)) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createStudent(Map<String, dynamic> payload) async {
    return (await _client.post('/admin/create-student', body: payload)) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createClass(Map<String, dynamic> payload) async {
    return (await _client.post('/admin/create-class', body: payload)) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createSubject(Map<String, dynamic> payload) async {
    return (await _client.post('/admin/create-subject', body: payload)) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> assignTeacher(Map<String, dynamic> payload) async {
    return (await _client.post('/admin/assign-teacher', body: payload)) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createDomain(Map<String, dynamic> payload) async {
    return (await _client.post('/domains', body: payload)) as Map<String, dynamic>;
  }

  Future<List<dynamic>> listDomains() async {
    return (await _client.get('/domains')) as List<dynamic>;
  }

  Future<Map<String, dynamic>> listClasses({String? domainId, int page = 1, int limit = 50}) async {
    return (await _client.get(
      '/classes',
      query: {
        if (domainId != null && domainId.isNotEmpty) 'domainId': domainId,
        'page': page,
        'limit': limit,
      },
    )) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> listSubjects({
    String? domainId,
    String? classId,
    int page = 1,
    int limit = 100,
  }) async {
    return (await _client.get(
      '/subjects',
      query: {
        if (domainId != null && domainId.isNotEmpty) 'domainId': domainId,
        if (classId != null && classId.isNotEmpty) 'classId': classId,
        'page': page,
        'limit': limit,
      },
    )) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> listTeachers({String? search, int page = 1, int limit = 50}) async {
    return (await _client.get(
      '/teachers',
      query: {
        if (search != null && search.isNotEmpty) 'search': search,
        'page': page,
        'limit': limit,
      },
    )) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> listStudents({
    String? classId,
    String? domainId,
    String? search,
    int page = 1,
    int limit = 50,
  }) async {
    return (await _client.get(
      '/students',
      query: {
        if (classId != null && classId.isNotEmpty) 'classId': classId,
        if (domainId != null && domainId.isNotEmpty) 'domainId': domainId,
        if (search != null && search.isNotEmpty) 'search': search,
        'page': page,
        'limit': limit,
      },
    )) as Map<String, dynamic>;
  }

  Future<List<dynamic>> teacherClasses() async {
    return (await _client.get('/teacher/classes')) as List<dynamic>;
  }

  Future<Map<String, dynamic>> teacherStudents({String? classId, int page = 1, int limit = 50}) async {
    return (await _client.get(
      '/teacher/students',
      query: {
        if (classId != null && classId.isNotEmpty) 'classId': classId,
        'page': page,
        'limit': limit,
      },
    )) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> teacherMarkAttendance(Map<String, dynamic> payload) async {
    return (await _client.post('/teacher/attendance', body: payload)) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> teacherAddMarks(Map<String, dynamic> payload) async {
    return (await _client.post('/teacher/add-marks', body: payload)) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> teacherCreateAssignment(Map<String, dynamic> payload) async {
    return (await _client.post('/teacher/assignment', body: payload)) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> teacherAnnouncement(Map<String, dynamic> payload) async {
    return (await _client.post('/teacher/announcement', body: payload)) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> teacherPublishContent(Map<String, dynamic> payload) async {
    return (await _client.post('/teacher/publish-content', body: payload)) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> teacherScheduleClass(Map<String, dynamic> payload) async {
    return (await _client.post('/teacher/schedule-class', body: payload)) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createExam(Map<String, dynamic> payload) async {
    return (await _client.post('/exams', body: payload)) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> listExams({String? classId, int page = 1, int limit = 50}) async {
    return (await _client.get(
      '/exams',
      query: {
        if (classId != null && classId.isNotEmpty) 'classId': classId,
        'page': page,
        'limit': limit,
      },
    )) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> studentContent({int page = 1, int limit = 20}) async {
    return (await _client.get('/student/content', query: {'page': page, 'limit': limit}))
        as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> studentUpcomingClasses({int page = 1, int limit = 20}) async {
    return (await _client.get('/student/upcoming-classes', query: {'page': page, 'limit': limit}))
        as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> studentResults({int page = 1, int limit = 20}) async {
    return (await _client.get('/student/results', query: {'page': page, 'limit': limit}))
        as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> parentStudent({String? studentId}) async {
    return (await _client.get('/parent/student', query: {if (studentId != null) 'studentId': studentId}))
        as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> parentAttendance({String? studentId, int page = 1, int limit = 20}) async {
    return (await _client.get(
      '/parent/attendance',
      query: {
        if (studentId != null && studentId.isNotEmpty) 'studentId': studentId,
        'page': page,
        'limit': limit,
      },
    )) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> parentResults({String? studentId, int page = 1, int limit = 20}) async {
    return (await _client.get(
      '/parent/results',
      query: {
        if (studentId != null && studentId.isNotEmpty) 'studentId': studentId,
        'page': page,
        'limit': limit,
      },
    )) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> parentUpcomingClasses({int page = 1, int limit = 20}) async {
    return (await _client.get('/parent/upcoming-classes', query: {'page': page, 'limit': limit}))
        as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> parentReportCard({String? studentId, String? examId}) async {
    return (await _client.get(
      '/parent/report-card',
      query: {
        if (studentId != null && studentId.isNotEmpty) 'studentId': studentId,
        if (examId != null && examId.isNotEmpty) 'examId': examId,
      },
    )) as Map<String, dynamic>;
  }
}
