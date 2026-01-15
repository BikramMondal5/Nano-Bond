import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';
// import 'package:local_auth/error_codes.dart' as auth_error; // Removed in v3
import 'package:gap/gap.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/theme.dart';
import '../../features/auth/presentation/providers.dart';

class BiometricGuard extends ConsumerStatefulWidget {
  final Widget child;

  // Static flag to bypass guard during Web3Auth login (In-Memory)
  static bool isAuthInProgress = false;

  const BiometricGuard({super.key, required this.child});

  @override
  ConsumerState<BiometricGuard> createState() => _BiometricGuardState();
}

class _BiometricGuardState extends ConsumerState<BiometricGuard>
    with WidgetsBindingObserver {
  final LocalAuthentication _auth = LocalAuthentication();
  bool _isAuthenticated = false;
  bool _isAuthenticating = false;
  String? _errorMessage;
  DateTime? _lastBackgroundTime;
  bool _wasAuthenticatedBeforeBackground = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Check if we are recovering from a crash/restart during Auth
    _checkAuthPersistence();
  }

  Future<void> _checkAuthPersistence() async {
    final prefs = await SharedPreferences.getInstance();
    final isAuthInProgress = prefs.getBool('auth_in_progress') ?? false;
    final authStartTime = prefs.getInt('auth_start_time') ?? 0;

    // 5 Minute timeout for auth flow recovery
    final diff = DateTime.now().millisecondsSinceEpoch - authStartTime;
    final isValid = diff < 5 * 60 * 1000;

    if (isAuthInProgress && isValid) {
      if (mounted) {
        setState(() {
          _isAuthenticated = true; // Recover session and skip initial lock
        });
      }
    } else {
      // Normal flow: Check biometrics on launch
      _checkBiometricsAndAuthenticate();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive) {
      // SKIP LOCKING if authentication is in progress (Web3Auth)
      if (BiometricGuard.isAuthInProgress) return;

      // SKIP LOCKING if user is NOT logged in
      final user = ref.read(authStateProvider).value;
      if (user == null) return;

      // Remember if user was logged in, then lock UI for security snapshot
      _wasAuthenticatedBeforeBackground = _isAuthenticated;
      _lastBackgroundTime = DateTime.now();

      setState(() {
        _isAuthenticated = false;
        _errorMessage = null;
      });
    } else if (state == AppLifecycleState.resumed) {
      // Check for return from auth flow (if app wasn't killed but flag persisted)
      if (BiometricGuard.isAuthInProgress) return;

      // If user is not logged in, ensure we are unlocked
      final user = ref.read(authStateProvider).value;
      if (user == null) {
        setState(() => _isAuthenticated = true);
        return;
      }

      final timeSinceBackground = _lastBackgroundTime != null
          ? DateTime.now().difference(_lastBackgroundTime!)
          : const Duration(hours: 1); // Default to long duration if null

      // If user was logged in and returns within 60 seconds (Grace Period)
      if (_wasAuthenticatedBeforeBackground &&
          timeSinceBackground.inSeconds < 60) {
        setState(() {
          _isAuthenticated = true; // Auto-unlock
        });
      } else {
        // Otherwise, prompt auth
        if (!_isAuthenticated) {
          _checkBiometricsAndAuthenticate();
        }
      }
    }
  }

  Future<void> _checkBiometricsAndAuthenticate() async {
    if (_isAuthenticating) return;

    // SKIP AUTH if user is not logged in
    final user = ref.read(authStateProvider).value;
    if (user == null) {
      if (mounted) setState(() => _isAuthenticated = true);
      return;
    }

    try {
      if (mounted) {
        setState(() {
          _isAuthenticating = true;
          _errorMessage = null;
        });
      }

      final bool canCheckBiometrics = await _auth.canCheckBiometrics;
      final bool isDeviceSupported = await _auth.isDeviceSupported();

      if (!canCheckBiometrics && !isDeviceSupported) {
        if (mounted) {
          setState(() {
            _errorMessage =
                "Device security not available. Please set a Screen Lock (PIN/Pattern).";
            _isAuthenticating = false;
          });
        }
        return;
      }

      final authenticated = await _auth.authenticate(
        localizedReason: 'Authenticate to access nanobonds',
        // options: const AuthenticationOptions(
        //   stickyAuth: true,
        //   biometricOnly: false,
        // ),
      );

      if (mounted) {
        setState(() {
          _isAuthenticated = authenticated;
        });

        if (!authenticated) {
          // User cancelled authentication
          _closeApp();
        }
      }
    } on PlatformException catch (e) {
      if (mounted) {
        debugPrint("Auth Error: ${e.code} - ${e.message}");
        String msg = "Authentication failed.";
        if (e.code == 'NotEnrolled') {
          msg = "No biometrics enrolled. Please set up security.";
        } else if (e.code == 'LockedOut' || e.code == 'PermanentlyLockedOut') {
          msg = "Too many attempts. Try again later.";
        } else if (e.code == 'PasscodeNotSet') {
          msg = "Please set a PIN/Password in device settings.";
        } else if (e.code == 'NotAvailable') {
          msg = "Security not available on this device.";
        }

        setState(() {
          _errorMessage = msg;
        });
      }
    } finally {
      if (mounted) setState(() => _isAuthenticating = false);
    }
  }

  void _closeApp() {
    if (Platform.isAndroid) {
      SystemNavigator.pop();
    } else if (Platform.isIOS) {
      exit(0);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // The App itself
        widget.child,

        // Security Overlay
        if (!_isAuthenticated)
          Material(
            color: AppColors.primary,
            child: SizedBox.expand(
              child: Padding(
                padding: const EdgeInsets.all(32.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      _errorMessage != null
                          ? Icons.error_outline
                          : Icons.lock_person_rounded,
                      size: 80,
                      color: Colors.white,
                    ),
                    const Gap(24),
                    Text(
                      _errorMessage != null ? "Security Issue" : "Secured",
                      style: AppTextStyles.heading2.copyWith(
                        color: Colors.white,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const Gap(16),
                    Text(
                      _errorMessage ?? "Authentication Required",
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: Colors.white70,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const Gap(48),
                    ElevatedButton(
                      onPressed: _checkBiometricsAndAuthenticate,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 32,
                          vertical: 16,
                        ),
                      ),
                      child: Text(_errorMessage != null ? "Retry" : "Unlock"),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}
