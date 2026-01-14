import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web3dart/web3dart.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:web3auth_flutter/output.dart'; // Import for Web3AuthResponse
import 'package:web3dart/crypto.dart';

import '../../../core/auth/web3auth_service.dart';
import '../../../core/widgets/biometric_guard.dart';
import 'user_model.dart';

class AuthRepository {
  String get _web3AuthClientId => dotenv.env['WEB3AUTH_CLIENT_ID'] ?? '';
  String get _web3AuthRedirectUrl => dotenv.env['WEB3AUTH_REDIRECT_URL'] ?? '';

  Future<UserModel> login() async {
    if (_web3AuthClientId.isEmpty || _web3AuthRedirectUrl.isEmpty) {
      throw Exception(
        "Web3Auth configuration missing. Please check .env file.",
      );
    }

    debugPrint("Logging in with Web3Auth...");

    // Persist "Auth Mode" to disk to survive App Kill/Restart
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('auth_in_progress', true);
    await prefs.setInt(
      'auth_start_time',
      DateTime.now().millisecondsSinceEpoch,
    );

    // Also set in-memory flag
    BiometricGuard.isAuthInProgress = true;

    Web3AuthResponse response;
    try {
      response = await Web3AuthService(
        clientId: _web3AuthClientId,
        redirectUrl: Uri.parse(_web3AuthRedirectUrl),
      ).loginWithGoogle();
    } finally {
      // Clear flags
      await prefs.setBool('auth_in_progress', false);
      BiometricGuard.isAuthInProgress = false;
    }

    // Use the real private key from Web3Auth
    final seed = (response.privKey ?? '').isNotEmpty
        ? response.privKey!
        : (response.sessionId ?? '');

    if (seed.isNotEmpty) {
      final credentials = EthPrivateKey.fromHex(seed);
      final address = credentials.address.hex;

      final user = UserModel(
        address: address,
        name: response.userInfo?.name,
        email: response.userInfo?.email,
        profileImage: response.userInfo?.profileImage,
        privateKey: seed,
      );

      // Persist user session
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_session', jsonEncode(user.toJson()));

      return user;
    }

    throw Exception("Failed to retrieve valid session from Web3Auth");
  }

  Future<void> logout() async {
    if (_web3AuthClientId.isEmpty || _web3AuthRedirectUrl.isEmpty) {
      return;
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user_session');

    await Web3AuthService(
      clientId: _web3AuthClientId,
      redirectUrl: Uri.parse(_web3AuthRedirectUrl),
    ).logout();
  }

  Future<UserModel?> getUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString('user_session');
      if (userJson != null) {
        return UserModel.fromJson(jsonDecode(userJson));
      }
    } catch (e) {
      debugPrint("Error restoring session: $e");
    }
    return null;
  }

  // V2: Sign message for KYC
  String signMessage(String privateKey, String message) {
    if (privateKey.isEmpty) throw Exception("Private key not available");

    final credentials = EthPrivateKey.fromHex(privateKey);
    final payload = Uint8List.fromList(utf8.encode(message));
    final signature = credentials.signPersonalMessageToUint8List(payload);

    return bytesToHex(signature, include0x: true);
  }
}
