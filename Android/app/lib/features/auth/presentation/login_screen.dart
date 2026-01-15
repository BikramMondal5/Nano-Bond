import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'dart:ui';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gap/gap.dart';
import 'package:lottie/lottie.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../../../core/theme/theme.dart';

import 'providers.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen>
    with WidgetsBindingObserver {
  bool _wasLoading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // When app resumes and we were loading, cancel the login
    // This handles when user closes the Web3Auth browser
    if (state == AppLifecycleState.resumed && _wasLoading) {
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          final authState = ref.read(authStateProvider);
          if (authState.isLoading) {
            // Reset to null state if login was cancelled
            ref.invalidate(authStateProvider);
          }
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    _wasLoading = authState.isLoading;

    ref.listen(authStateProvider, (previous, next) {
      if (next.hasValue && next.value != null) {
        context.go('/home');
      }
    });

    return Scaffold(
      body: Stack(
        children: [
          // 1. Background Image
          Positioned.fill(
            child: Image.asset(
              'assets/image/onboarding.jpg',
              fit: BoxFit.cover,
            ),
          ),

          // 2. Gradient Overlay (Subtle, for title contrast)
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.2), // Lighter gradient
                    Colors.black.withValues(alpha: 0.6),
                  ],
                  stops: const [0.5, 0.8, 1.0],
                ),
              ),
            ),
          ),

          // 3. Content
          SafeArea(
            child: Column(
              children: [
                const Spacer(),
                Gap(30.h),

                // Animated Logo
                Lottie.asset(
                  'assets/animation/DeeWork About Blockchain.json',
                  height: 420.h,
                  fit: BoxFit.contain,
                ),

                Gap(0),

                // Title above the card
                Transform.translate(
                  offset: Offset(0, -10.h),
                  child: Text(
                    "nanobonds",
                    style: AppTextStyles.heading1.copyWith(
                      fontFamily: 'Bw Nista Geometric DEMO',
                      fontSize: 42.sp,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.5,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
                  ),
                ),

                Gap(8.h),

                // Floating Bottom Card
                Padding(
                  padding: EdgeInsets.fromLTRB(24.w, 0, 24.w, 24.h),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(40.r),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                      child: Container(
                        width: double.infinity,
                        padding: EdgeInsets.symmetric(
                          horizontal: 24.w,
                          vertical: 32.h,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(
                            alpha: 0.6,
                          ), // Glassy Blue
                          borderRadius: BorderRadius.circular(40.r),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.15),
                            width: 1.w,
                          ),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              "Lets begin our journey together!",
                              textAlign: TextAlign.center,
                              style: AppTextStyles.bodyLarge.copyWith(
                                color: Colors.white.withValues(alpha: 0.95),
                                fontSize: 16.sp,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            Gap(24.h),

                            if (authState.isLoading)
                              Padding(
                                padding: EdgeInsets.symmetric(vertical: 8.0.h),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      "Signing in...",
                                      style: AppTextStyles.bodyMedium.copyWith(
                                        fontWeight: FontWeight.w600,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                              )
                            else
                              SizedBox(
                                height: 52.h,
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: () {
                                    ref
                                        .read(authStateProvider.notifier)
                                        .login();
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.white,
                                    foregroundColor: AppColors.primary,
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(26.r),
                                    ),
                                  ),
                                  icon: SvgPicture.asset(
                                    'assets/svg/google_icon.svg',
                                    height: 20.h,
                                    width: 20.h,
                                  ),
                                  label: Text(
                                    "Sign in with Google",
                                    style: TextStyle(
                                      fontSize: 15.sp,
                                      fontWeight: FontWeight.w600,
                                      fontFamily: 'Inter',
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
