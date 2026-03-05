import 'package:flutter/foundation.dart';

class AppConfig {
  const AppConfig._();

  static String get apiBaseUrl {
    const fromEnv = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    if (fromEnv.isNotEmpty) {
      return fromEnv;
    }

    if (kIsWeb) {
      return 'http://localhost:4000';
    }

    return 'http://10.0.2.2:4000';
  }
}
