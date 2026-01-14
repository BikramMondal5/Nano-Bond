import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:lottie/lottie.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/theme/theme.dart';
import '../../../../core/services/backend_service.dart';
import '../../../../core/utils/ui_utils.dart';

import '../../providers/user_portfolio_provider.dart';

class WithdrawBottomSheet extends ConsumerStatefulWidget {
  final String address;

  const WithdrawBottomSheet({super.key, required this.address});

  @override
  ConsumerState<WithdrawBottomSheet> createState() =>
      _WithdrawBottomSheetState();
}

class _WithdrawBottomSheetState extends ConsumerState<WithdrawBottomSheet> {
  bool _isLoading = false;
  String _loadingMessage = "Processing...";
  Timer? _loadingTimer;

  @override
  void dispose() {
    _loadingTimer?.cancel();
    super.dispose();
  }

  void _startLoadingAnimation() {
    int step = 0;
    _loadingMessage = "Initiating Claim...";
    _loadingTimer = Timer.periodic(const Duration(milliseconds: 1500), (timer) {
      if (!mounted) return;
      setState(() {
        step++;
        if (step == 1) _loadingMessage = "Processing Transaction...";
        if (step == 2) _loadingMessage = "Finalizing...";
        if (step > 2) timer.cancel();
      });
    });
  }

  Future<void> _handleClaim() async {
    final portfolio = ref.read(userPortfolioProvider).valueOrNull;
    if (portfolio == null || portfolio.holdings.isEmpty) {
      UiUtils.showError(context, "No bonds to claim yield from");
      return;
    }

    setState(() => _isLoading = true);
    _startLoadingAnimation();

    try {
      await BackendService().claimYield(
        address: widget.address,
        bondId: portfolio.holdings.first.bondId,
      );

      if (!mounted) return;
      _loadingTimer?.cancel();
      context.pop();
      UiUtils.showSuccess(context, "Yield claimed successfully!");
    } catch (e) {
      if (!mounted) return;
      _loadingTimer?.cancel();
      String errorMessage = e.toString();
      if (errorMessage.contains("Exception:")) {
        errorMessage = errorMessage.replaceAll("Exception:", "").trim();
      }

      // Check for specific "No yield" error from backend (matches AAService message)
      if (errorMessage.toLowerCase().contains("no yield available") ||
          errorMessage.toLowerCase().contains("nothing to claim")) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: Text("Server Response", style: AppTextStyles.heading2),
            content: Text(errorMessage, style: AppTextStyles.bodyMedium),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text(
                  "OK",
                  style: AppTextStyles.bodyLarge.copyWith(
                    color: AppColors.primary,
                  ),
                ),
              ),
            ],
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16.r),
            ),
            backgroundColor: Colors.white,
          ),
        );
      } else {
        UiUtils.showError(context, errorMessage);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.viewInsetsOf(context);
    final portfolioAsync = ref.watch(userPortfolioProvider);

    return Padding(
      padding: EdgeInsets.only(bottom: viewInsets.bottom),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 520.w),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(32.r)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 20.r,
                offset: Offset(0, -5.h),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Gap(12.h),
                Center(
                  child: Container(
                    width: 48.w,
                    height: 5.h,
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(2.5.r),
                    ),
                  ),
                ),
                Gap(16.h),
                if (_isLoading)
                  _buildLoadingState()
                else
                  _buildClaimContent(portfolioAsync),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 40.h),
      child: Column(
        children: [
          SizedBox(
            height: 150.h,
            child: Lottie.asset(
              'assets/animation/Coin.json',
              fit: BoxFit.contain,
            ),
          ),
          Gap(16.h),
          Text(
            _loadingMessage,
            style: AppTextStyles.heading2,
            textAlign: TextAlign.center,
          ),
          Gap(8.h),
          Text(
            "Please wait while we process your request",
            style: AppTextStyles.bodyMedium,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildClaimContent(AsyncValue<PortfolioModel> portfolioAsync) {
    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(24.w, 0, 24.w, 24.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              padding: EdgeInsets.all(16.w),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.north_east_rounded,
                size: 40.w,
                color: Colors.green,
              ),
            ),
          ),
          Gap(16.h),
          Center(
            child: Text(
              "Claim Your Yield",
              style: AppTextStyles.heading2.copyWith(fontSize: 20.sp),
            ),
          ),
          Gap(8.h),
          Center(
            child: Text(
              "Your principal returns automatically at maturity",
              style: AppTextStyles.bodyMedium.copyWith(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
          ),
          Gap(24.h),
          Container(
            width: double.infinity,
            padding: EdgeInsets.all(20.w),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.green.withValues(alpha: 0.1),
                  Colors.green.withValues(alpha: 0.05),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16.r),
              border: Border.all(color: Colors.green.withValues(alpha: 0.2)),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.attach_money_rounded,
                  size: 48.w,
                  color: Colors.green,
                ),
                Gap(12.h),
                Text(
                  "Pending Yield",
                  style: AppTextStyles.caption.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
                Gap(4.h),
                portfolioAsync.when(
                  loading: () => const CircularProgressIndicator(),
                  error: (_, __) => const Text("--"),
                  data: (portfolio) => Text(
                    "${(portfolio.pendingYield ?? 0.0).toStringAsFixed(2)} USDT",
                    style: AppTextStyles.heading2.copyWith(
                      fontSize: 28.sp,
                      color: Colors.green[700],
                    ),
                  ),
                ),
                Gap(4.h),
                Text(
                  "(Available Now)",
                  style: AppTextStyles.caption.copyWith(
                    color: Colors.grey[500],
                    fontSize: 11.sp,
                  ),
                ),
              ],
            ),
          ),
          Gap(24.h),
          // Slide to Claim - disabled until admin distributes yield
          // Conditional Claim Button
          portfolioAsync.when(
            data: (portfolio) {
              return SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _handleClaim,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green[600],
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(vertical: 16.h),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(100.r),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    "Redeem Your Yield",
                    style: AppTextStyles.bodyLarge.copyWith(
                      fontWeight: FontWeight.w600,
                      fontSize: 16.sp,
                      color: Colors.white,
                    ),
                  ),
                ),
              );
            },
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }
}
