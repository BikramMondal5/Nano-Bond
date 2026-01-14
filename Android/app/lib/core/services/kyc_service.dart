import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;

class KycService {
  String get _baseUrl {
    final v = dotenv.env['API_BASE_URL'] ?? '';
    return v.endsWith('/') ? v.substring(0, v.length - 1) : v;
  }

  Future<Map<String, dynamic>> requestRegistration({
    required String address,
    String? nationalId,
    String? signature,
  }) async {
    if (_baseUrl.isEmpty) {
      throw Exception('Missing API_BASE_URL in .env');
    }

    // Use main backend endpoint for KYC registration
    final uri = Uri.parse('$_baseUrl/api/kyc/register');
    debugPrint('Connecting to KYC API: $uri');

    final headers = <String, String>{'Content-Type': 'application/json'};

    final res = await http.post(
      uri,
      headers: headers,
      body: jsonEncode({
        'address': address,
        if (nationalId != null) 'nationalId': nationalId,
        if (signature != null) 'signature': signature,
      }),
    );

    if (res.statusCode < 200 || res.statusCode >= 300) {
      debugPrint('KYC register failed: ${res.statusCode} ${res.body}');
      throw Exception('KYC registration failed: ${res.body}');
    }

    final decoded = jsonDecode(res.body);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }

    return {'success': false, 'error': 'Invalid response format'};
  }
}
