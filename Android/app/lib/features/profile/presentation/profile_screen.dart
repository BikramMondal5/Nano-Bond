import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter/services.dart';
import '../../../../core/utils/ui_utils.dart';

import '../../../core/theme/theme.dart';
import '../../auth/presentation/providers.dart';
import '../../home/providers/portfolio_provider.dart';
import '../../home/providers/user_portfolio_provider.dart';
import '../providers/kyc_status_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).valueOrNull;
    final balanceAsync = ref.watch(portfolioProvider);
    final kycStatusAsync = ref.watch(kycStatusProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Colors.black87, size: 24.w),
          onPressed: () => context.pop(),
        ),
        title: Text(
          "Profile",
          style: AppTextStyles.heading2.copyWith(fontSize: 20.sp),
        ),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(portfolioProvider);
          ref.invalidate(kycStatusProvider);
          ref.invalidate(
            userPortfolioProvider,
          ); // Also refresh the portfolio/yield
          await Future.delayed(const Duration(seconds: 1));
        },
        child: SingleChildScrollView(
          physics:
              const AlwaysScrollableScrollPhysics(), // Ensure scroll allows refresh even if content is short
          padding: EdgeInsets.fromLTRB(24.w, 24.w, 24.w, 48.h),
          child: Column(
            children: [
              // User Header
              Column(
                children: [
                  Container(
                    width: 80.w,
                    height: 80.w,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.grey[200]!, width: 3.w),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 10.r,
                          offset: Offset(0, 4.h),
                        ),
                      ],
                      image: user?.profileImage != null
                          ? DecorationImage(
                              image: NetworkImage(user!.profileImage!),
                              fit: BoxFit.cover,
                            )
                          : null,
                    ),
                    child: user?.profileImage == null
                        ? Icon(Icons.person, size: 36.w, color: Colors.grey)
                        : null,
                  ),
                  Gap(10.h),
                  Text(
                    user?.name ?? 'User',
                    style: GoogleFonts.outfit(
                      fontSize: 20.sp,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  Gap(2.h),
                  Text(
                    user?.email ?? '',
                    style: GoogleFonts.inter(
                      fontSize: 12.sp,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
              Gap(24.h),

              // Wallet Balance Card
              Container(
                width: double.infinity,
                padding: EdgeInsets.all(20.w),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1E3C72), Color(0xFF2A5298)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24.r),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF1E3C72).withValues(alpha: 0.3),
                      blurRadius: 16.r,
                      offset: Offset(0, 8.h),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              "Web3Auth Wallet",
                              style: GoogleFonts.inter(
                                color: Colors.white70,
                                fontSize: 14.sp,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            Container(
                              padding: EdgeInsets.symmetric(
                                horizontal: 8.w,
                                vertical: 4.h,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white24,
                                borderRadius: BorderRadius.circular(12.r),
                              ),
                              child: Text(
                                "Mantle Sepolia",
                                style: GoogleFonts.inter(
                                  color: Colors.white,
                                  fontSize: 10.sp,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                        Gap(8.h),
                        GestureDetector(
                          onTap: () {
                            if (user != null && user.address.isNotEmpty) {
                              Clipboard.setData(
                                ClipboardData(text: user.address),
                              );
                              Clipboard.setData(
                                ClipboardData(text: user.address),
                              );
                              UiUtils.showSuccess(
                                context,
                                "Address copied to clipboard",
                              );
                            }
                          },
                          child: Row(
                            children: [
                              Text(
                                user != null && user.address.isNotEmpty
                                    ? "${user.address.substring(0, 6)}...${user.address.substring(user.address.length - 4)}"
                                    : "0x...",
                                style: GoogleFonts.sourceCodePro(
                                  color: Colors.white,
                                  fontSize: 16.sp,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 1.w,
                                ),
                              ),
                              Gap(8.w),
                              Icon(
                                Icons.copy_rounded,
                                color: Colors.white.withValues(alpha: 0.7),
                                size: 16.w,
                              ),
                            ],
                          ),
                        ),
                        Gap(24.h),
                        Text(
                          "Wallet Balance",
                          style: GoogleFonts.inter(
                            color: Colors.white70,
                            fontSize: 12.sp,
                          ),
                        ),
                        Gap(4.h),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.baseline,
                              textBaseline: TextBaseline.alphabetic,
                              children: [
                                balanceAsync.when(
                                  data: (balance) {
                                    return Text(
                                      balance.toStringAsFixed(2),
                                      style: GoogleFonts.outfit(
                                        color: Colors.white,
                                        fontSize: 32.sp,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    );
                                  },
                                  loading: () => Text(
                                    "00.00",
                                    style: GoogleFonts.outfit(
                                      color: Colors.white.withValues(
                                        alpha: 0.5,
                                      ),
                                      fontSize: 32.sp,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  error: (_, __) => Text(
                                    "00.00",
                                    style: GoogleFonts.outfit(
                                      color: Colors.white.withValues(
                                        alpha: 0.5,
                                      ),
                                      fontSize: 32.sp,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                Gap(4.w),
                                Text(
                                  "USDT",
                                  style: GoogleFonts.inter(
                                    color: Colors.white70,
                                    fontSize: 14.sp,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                            if (kycStatusAsync.valueOrNull == true)
                              Container(
                                padding: EdgeInsets.symmetric(
                                  horizontal: 10.w,
                                  vertical: 6.h,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(
                                    0xFF00E676,
                                  ).withValues(alpha: 0.15),
                                  border: Border.all(
                                    color: const Color(0xFF00E676),
                                    width: 1.w,
                                  ),
                                  borderRadius: BorderRadius.circular(20.r),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.verified_rounded,
                                      color: const Color(0xFF00E676),
                                      size: 14.w,
                                    ),
                                    Gap(4.w),
                                    Text(
                                      "Verified",
                                      style: GoogleFonts.outfit(
                                        fontSize: 12.sp,
                                        fontWeight: FontWeight.w600,
                                        color: const Color(0xFF00E676),
                                        letterSpacing: 0.5.w,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              Gap(32.h),

              // Menu Options
              _buildLinkItem(
                icon: Icons.verified_user_outlined, // Ignored
                label: "KYC Verification",
                customIcon: SvgPicture.string(
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.0072 2.10365C8.60556 1.64993 7.08193 2.28104 6.41168 3.59294L5.6059 5.17011C5.51016 5.35751 5.35775 5.50992 5.17036 5.60566L3.59318 6.41144C2.28128 7.08169 1.65018 8.60532 2.10389 10.0069L2.64935 11.6919C2.71416 11.8921 2.71416 12.1077 2.64935 12.3079L2.10389 13.9929C1.65018 15.3945 2.28129 16.9181 3.59318 17.5883L5.17036 18.3941C5.35775 18.4899 5.51016 18.6423 5.6059 18.8297L6.41169 20.4068C7.08194 21.7187 8.60556 22.3498 10.0072 21.8961L11.6922 21.3507C11.8924 21.2859 12.1079 21.2859 12.3081 21.3507L13.9931 21.8961C15.3947 22.3498 16.9183 21.7187 17.5886 20.4068L18.3944 18.8297C18.4901 18.6423 18.6425 18.4899 18.8299 18.3941L20.4071 17.5883C21.719 16.9181 22.3501 15.3945 21.8964 13.9929L21.3509 12.3079C21.2861 12.1077 21.2861 11.8921 21.3509 11.6919L21.8964 10.0069C22.3501 8.60531 21.719 7.08169 20.4071 6.41144L18.8299 5.60566C18.6425 5.50992 18.4901 5.3575 18.3944 5.17011L17.5886 3.59294C16.9183 2.28104 15.3947 1.64993 13.9931 2.10365L12.3081 2.6491C12.1079 2.71391 11.8924 2.71391 11.6922 2.6491L10.0072 2.10365ZM8.19271 4.50286C8.41612 4.06556 8.924 3.8552 9.39119 4.00643L11.0762 4.55189C11.6768 4.74632 12.3235 4.74632 12.9241 4.55189L14.6091 4.00643C15.0763 3.8552 15.5841 4.06556 15.8076 4.50286L16.6133 6.08004C16.9006 6.64222 17.3578 7.09946 17.92 7.38668L19.4972 8.19246C19.9345 8.41588 20.1448 8.92375 19.9936 9.39095L19.4481 11.076C19.2537 11.6766 19.2537 12.3232 19.4481 12.9238L19.9936 14.6088C20.1448 15.076 19.9345 15.5839 19.4972 15.8073L17.92 16.6131C17.3578 16.9003 16.9006 17.3576 16.6133 17.9197L15.8076 19.4969C15.5841 19.9342 15.0763 20.1446 14.6091 19.9933L12.9241 19.4479C12.3235 19.2535 11.6768 19.2535 11.0762 19.4479L9.3912 19.9933C8.924 20.1446 8.41612 19.9342 8.19271 19.4969L7.38692 17.9197C7.09971 17.3576 6.64246 16.9003 6.08028 16.6131L4.50311 15.8073C4.06581 15.5839 3.85544 15.076 4.00668 14.6088L4.55213 12.9238C4.74656 12.3232 4.74656 11.6766 4.55213 11.076L4.00668 9.39095C3.85544 8.92375 4.06581 8.41588 4.50311 8.19246L6.08028 7.38668C6.64246 7.09946 7.09971 6.64222 7.38692 6.08004L8.19271 4.50286ZM6.75972 11.7573L11.0023 15.9999L18.0734 8.92885L16.6592 7.51464L11.0023 13.1715L8.17394 10.343L6.75972 11.7573Z"></path></svg>',
                  width: 24.w,
                  height: 24.w,
                  colorFilter: const ColorFilter.mode(
                    AppColors.primary,
                    BlendMode.srcIn,
                  ),
                ),
                onTap: () async {
                  final result = await context.push('/kyc-scanner');

                  if (result != null && result is Map && context.mounted) {
                    final isAlreadyVerified =
                        result['isAlreadyVerified'] == true;

                    // Refresh status immediately
                    ref.invalidate(kycStatusProvider);

                    // Only show "Minting SBT" if it was a FRESH verification
                    if (!isAlreadyVerified) {
                      UiUtils.showSuccess(
                        context,
                        "KYC Verified! Minting Solebound Token...",
                      );
                      await Future.delayed(const Duration(seconds: 2));

                      if (context.mounted) {
                        UiUtils.showSuccess(
                          context,
                          "SBT Minted Successfully (Valid for 1 Year)",
                        );
                      }
                    } else {
                      // Already handled by Scanner Screen snackbar, but we can do a light refresh confirm?
                      // Actually user explicitely asked to REMOVE it. So do nothing here except refresh.
                    }
                  }
                },
              ),
              _buildLinkItem(
                icon: Icons.help_outline, // Ignored
                label: "Help & Support",
                customIcon: SvgPicture.string(
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11 15H13V17H11V15ZM13 13.3551V14H11V12.5C11 11.9477 11.4477 11.5 12 11.5C12.8284 11.5 13.5 10.8284 13.5 10C13.5 9.17157 12.8284 8.5 12 8.5C11.2723 8.5 10.6656 9.01823 10.5288 9.70577L8.56731 9.31346C8.88637 7.70919 10.302 6.5 12 6.5C13.933 6.5 15.5 8.067 15.5 10C15.5 11.5855 14.4457 12.9248 13 13.3551Z"></path></svg>',
                  width: 24.w,
                  height: 24.w,
                  colorFilter: const ColorFilter.mode(
                    AppColors.primary,
                    BlendMode.srcIn,
                  ),
                ),
                onTap: () {},
              ),
              _buildLinkItem(
                icon: Icons.logout, // Ignored because customIcon is provided
                label: "Logout",
                onTap: () async {
                  showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (context) => Center(
                      child: Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 24.w,
                          vertical: 16.h,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16.r),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            SizedBox(
                              width: 20.w,
                              height: 20.w,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.w,
                              ),
                            ),
                            Gap(16.w),
                            Text(
                              "Logging out...",
                              style: AppTextStyles.bodyLarge.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );

                  await ref.read(authStateProvider.notifier).logout();

                  if (context.mounted) {
                    Navigator.of(context).pop(); // Dismiss dialog
                    context.go('/login');
                  }
                },
                customIcon: SvgPicture.string(
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 11H20.5329C20.5769 11.3847 20.6 11.7792 20.6 12.1837C20.6 14.9184 19.6204 17.2204 17.9224 18.7837C16.4367 20.1551 14.404 20.9592 11.9796 20.9592C8.46933 20.9592 5.43266 18.947 3.9551 16.0123C3.34695 14.8 3 13.4286 3 11.9796C3 10.5306 3.34695 9.1592 3.9551 7.94698C5.43266 5.01226 8.46933 3 11.9796 3C14.4 3 16.4326 3.88983 17.9877 5.33878L16.5255 6.80101C15.3682 5.68153 13.8028 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.5265 19 18.1443 16.3923 18.577 13H12V11Z"></path></svg>',
                  width: 24.w,
                  height: 24.w,
                  colorFilter: const ColorFilter.mode(
                    AppColors.primary,
                    BlendMode.srcIn,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLinkItem({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    bool isDestructive = false,
    Widget? customIcon,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16.r),
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: 16.h, horizontal: 8.w),
        child: Row(
          children: [
            Container(
              padding: EdgeInsets.all(10.w),
              decoration: BoxDecoration(
                color: isDestructive ? Colors.red[50] : Colors.grey[100],
                shape: BoxShape.circle,
              ),
              child:
                  customIcon ??
                  Icon(
                    icon,
                    color: isDestructive ? Colors.red : AppColors.primary,
                    size: 24.w,
                  ),
            ),
            Gap(16.w),
            Expanded(
              child: Text(
                label,
                style: AppTextStyles.bodyLarge.copyWith(
                  fontWeight: FontWeight.w500,
                  color: isDestructive ? Colors.red : Colors.black87,
                  fontSize: 16.sp,
                ),
              ),
            ),
            Icon(Icons.arrow_forward_ios, color: Colors.grey[400], size: 16.w),
          ],
        ),
      ),
    );
  }
}
