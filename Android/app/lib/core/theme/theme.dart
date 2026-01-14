import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'page_transitions.dart';

class AppColors {
  static const primary = Color(0xFF001F3D);
  static const accent = Color(0xFFED985F);
  static const secondaryAccent = Color(0xFFF7B980);
  static const background = Color(0xFFF5F7FA);
  static const white = Colors.white;
  static const black = Colors.black;
  static const glassBorder = Colors.white24;
}

class AppTextStyles {
  static TextStyle get heading1 => GoogleFonts.inter(
    fontSize: 28.sp,
    fontWeight: FontWeight.bold,
    color: AppColors.primary,
  );

  static TextStyle get heading2 => GoogleFonts.inter(
    fontSize: 22.sp,
    fontWeight: FontWeight.w600,
    color: AppColors.primary,
  );

  static TextStyle get heading3 => GoogleFonts.inter(
    fontSize: 18.sp,
    fontWeight: FontWeight.w600,
    color: AppColors.primary,
  );

  static TextStyle get bodyLarge => GoogleFonts.inter(
    fontSize: 16.sp,
    fontWeight: FontWeight.normal,
    color: AppColors.black,
  );

  static TextStyle get bodyMedium => GoogleFonts.inter(
    fontSize: 14.sp,
    color: AppColors.black.withAlpha((0.8 * 255).round()),
  );

  static TextStyle get caption =>
      GoogleFonts.inter(fontSize: 12.sp, color: Colors.grey);
}

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      primaryColor: AppColors.primary,
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: ColorScheme.fromSwatch().copyWith(
        primary: AppColors.primary,
        secondary: AppColors.accent,
      ),
      useMaterial3: true,
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: PremiumPageTransitionsBuilder(),
          TargetPlatform.iOS: PremiumPageTransitionsBuilder(),
        },
      ),
    );
  }
}
