import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConfig {
  static String _envOr(String key, String fallback) {
    final v = dotenv.env[key];
    if (v == null) return fallback;
    final trimmed = v.trim();
    if (trimmed.isEmpty) return fallback;
    return trimmed;
  }

  /// Base URL for the backend API.
  /// Uses the value from .env, or defaults to localhost for Android emulator.
  static String get baseUrl => _envOr('API_BASE_URL', 'http://10.0.2.2:3000');
}
