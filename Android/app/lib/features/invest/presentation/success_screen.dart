import 'package:url_launcher/url_launcher.dart'; // Add url_launcher
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:gap/gap.dart';
import 'package:lottie/lottie.dart';
import '../../../../core/theme/theme.dart';
import '../../../../core/widgets/primary_button.dart';

import 'package:flutter_screenutil/flutter_screenutil.dart';

// ... (imports remain)

class SuccessScreen extends StatelessWidget {
  final Object? extra; // Changed to Object? to accept Map

  const SuccessScreen({super.key, this.extra});

  Future<void> _launchExplorer(String txHash) async {
    final url = Uri.parse("https://explorer.sepolia.mantle.xyz/tx/$txHash");
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    String? bondTitle;
    String? txHash;

    if (extra is Map) {
      final map = extra as Map;
      bondTitle = map['title'] as String?;
      txHash = map['txHash'] as String?;
    } else if (extra is String) {
      bondTitle = extra as String;
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(24.0.w),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              // Dynamic Lottie Asset
              SizedBox(
                height: 200.h,
                child: Lottie.asset(
                  'assets/animation/success.json',
                  repeat: false,
                  errorBuilder: (context, error, stackTrace) {
                    debugPrint("Lottie Error: $error");
                    return Center(
                      child: Text(
                        "Error: $error",
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.red, fontSize: 12.sp),
                      ),
                    );
                  },
                ),
              ),
              Gap(32.h),
              Text(
                "Bond Purchased!",
                style: AppTextStyles.heading2.copyWith(fontSize: 28.sp),
              ),
              Gap(12.h),
              RichText(
                textAlign: TextAlign.center,
                text: TextSpan(
                  style: AppTextStyles.bodyLarge.copyWith(
                    color: Colors.grey[600],
                  ),
                  children: [
                    const TextSpan(text: "You now own a fraction of\n"),
                    TextSpan(
                      text: "${bondTitle ?? "Government of India Bond 2030"}.",
                      style: AppTextStyles.bodyLarge.copyWith(
                        color: Colors.black87,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              if (txHash != null) ...[
                TextButton.icon(
                  onPressed: () => _launchExplorer(txHash!),
                  icon: Icon(Icons.open_in_new, size: 18.sp),
                  label: const Text("View on Block Explorer"),
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.primary,
                  ),
                ),
                Gap(16.h),
              ],
              PrimaryButton(
                text: "Done",
                fullWidth: true,
                onPressed: () {
                  context.go('/');
                },
              ),
              Gap(24.h),
            ],
          ),
        ),
      ),
    );
  }
}
