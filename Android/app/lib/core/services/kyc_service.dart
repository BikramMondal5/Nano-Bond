import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:web3dart/crypto.dart';

class KycService {
  String get _baseUrl {
    final v = dotenv.env['API_BASE_URL'] ?? '';
    return v.endsWith('/') ? v.substring(0, v.length - 1) : v;
  }

  /// Hash nationalId on device using keccak256 (same as Solidity)
  /// This ensures raw ID NEVER leaves the device
  String _hashNationalId(String nationalId) {
    final bytes = utf8.encode(nationalId);
    final hash = keccak256(Uint8List.fromList(bytes));
    return '0x${bytesToHex(hash)}';
  }

  Future<Map<String, dynamic>> requestRegistration({
    required String address,
    String? nationalId,
    String? signature,
  }) async {
    if (_baseUrl.isEmpty) {
      throw Exception('Missing API_BASE_URL in .env');
    }

    // SECURITY: Hash nationalId on device before sending
    // Raw ID never leaves the phone
    String? nationalIdHash;
    if (nationalId != null) {
      nationalIdHash = _hashNationalId(nationalId);
      debugPrint('KYC: Hashed ID on device (raw ID never sent to server)');
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
        if (nationalIdHash != null)
          'nationalIdHash': nationalIdHash, // Send HASH only
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
