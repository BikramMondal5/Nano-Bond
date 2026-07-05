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

  /// Hash identity data on device using keccak256 (same as Solidity)
  /// Combines nationalId + dob for a unique identity fingerprint
  /// This ensures raw ID NEVER leaves the device
  String _hashIdentity(String nationalId, {String? dob}) {
    // Combine ID + DOB for unique hash (prevents duplicate registrations)
    // Format: "AADHAAR_NUMBER:DD/MM/YYYY" or just "AADHAAR_NUMBER" if no DOB
    final dataToHash = dob != null && dob.isNotEmpty
        ? '$nationalId:$dob'
        : nationalId;

    final bytes = utf8.encode(dataToHash);
    final hash = keccak256(Uint8List.fromList(bytes));
    return '0x${bytesToHex(hash)}';
  }

  Future<Map<String, dynamic>> requestRegistration({
    required String address,
    String? nationalId,
    String? dob,
    String? signature,
  }) async {
    if (_baseUrl.isEmpty) {
      throw Exception('Missing API_BASE_URL in .env');
    }

    // SECURITY: Hash nationalId + DOB on device before sending
    // Raw ID never leaves the phone
    String? identityHash;
    if (nationalId != null) {
      identityHash = _hashIdentity(nationalId, dob: dob);
      debugPrint(
        'KYC: Hashed ID+DOB on device (raw data never sent to server)',
      );
      debugPrint('KYC: Hash includes DOB: ${dob != null && dob.isNotEmpty}');
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
        if (identityHash != null)
          'nationalIdHash': identityHash, // Send HASH only (includes DOB)
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
