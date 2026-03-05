import 'dart:convert';

import 'package:http/http.dart' as http;

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => 'ApiException(statusCode: $statusCode, message: $message)';
}

class ApiClient {
  ApiClient({required this.baseUrl});

  final String baseUrl;
  String? _token;

  void setToken(String? token) {
    _token = token;
  }

  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? query,
    bool authenticated = true,
  }) {
    return _request(
      method: 'GET',
      path: path,
      query: query,
      authenticated: authenticated,
    );
  }

  Future<dynamic> post(
    String path, {
    Map<String, dynamic>? body,
    Map<String, dynamic>? query,
    bool authenticated = true,
  }) {
    return _request(
      method: 'POST',
      path: path,
      body: body,
      query: query,
      authenticated: authenticated,
    );
  }

  Future<dynamic> put(
    String path, {
    Map<String, dynamic>? body,
    Map<String, dynamic>? query,
    bool authenticated = true,
  }) {
    return _request(
      method: 'PUT',
      path: path,
      body: body,
      query: query,
      authenticated: authenticated,
    );
  }

  Future<dynamic> _request({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    Map<String, dynamic>? query,
    required bool authenticated,
  }) async {
    final uri = Uri.parse('$baseUrl$path').replace(
      queryParameters: query == null
          ? null
          : query.map(
              (key, value) => MapEntry(key, value?.toString()),
            ),
    );

    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (authenticated && _token != null && _token!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_token';
    }

    late http.Response response;

    switch (method) {
      case 'GET':
        response = await http.get(uri, headers: headers);
      case 'POST':
        response = await http.post(
          uri,
          headers: headers,
          body: jsonEncode(body ?? <String, dynamic>{}),
        );
      case 'PUT':
        response = await http.put(
          uri,
          headers: headers,
          body: jsonEncode(body ?? <String, dynamic>{}),
        );
      default:
        throw const ApiException('Unsupported HTTP method');
    }

    final isJson = response.headers['content-type']?.contains('application/json') ?? false;
    dynamic data;

    if (isJson && response.body.isNotEmpty) {
      data = jsonDecode(response.body);
    } else {
      data = response.body;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }

    String message = 'Request failed';
    if (data is Map<String, dynamic> && data['message'] != null) {
      message = data['message'].toString();
    } else if (data is String && data.isNotEmpty) {
      message = data;
    }

    throw ApiException(message, statusCode: response.statusCode);
  }
}
