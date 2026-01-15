import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';

class BiometricService {
  final LocalAuthentication _auth;

  BiometricService({LocalAuthentication? auth})
    : _auth = auth ?? LocalAuthentication();

  Future<void> ensureAuthenticated() async {
    try {
      final isSupported = await _auth.isDeviceSupported();
      final canCheck = await _auth.canCheckBiometrics;

      if (!isSupported && !canCheck) {
        return;
      }

      final didAuthenticate = await _auth.authenticate(
        localizedReason: 'Confirm with biometrics to continue',
        // options: const AuthenticationOptions(
        //   biometricOnly: true,
        //   stickyAuth: true,
        // ),
      );

      if (!didAuthenticate) {
        throw Exception('Biometric authentication failed');
      }
    } on MissingPluginException {
      return;
    } on PlatformException catch (e) {
      if (e.code == 'NotAvailable') {
        // Biometrics/Security not set up on device. Proceeding without auth (dev mode/fallback).
        return;
      }
      rethrow;
    }
  }
}
