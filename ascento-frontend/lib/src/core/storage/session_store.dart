import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/session_user.dart';

class SessionStore {
  const SessionStore._();

  static const String _key = 'ascento_session';

  static Future<void> save(SessionUser session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(session.toJson()));
  }

  static Future<SessionUser?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null || raw.isEmpty) {
      return null;
    }

    final decoded = jsonDecode(raw) as Map<String, dynamic>;
    return SessionUser.fromJson(decoded);
  }

  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
