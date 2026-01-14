import 'dart:async'; // Add async for Timer
import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:lottie/lottie.dart'; // Import Lottie
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/theme/theme.dart';
import '../../../../core/services/backend_service.dart';
import '../../../../core/utils/ui_utils.dart';
import '../../../../core/widgets/slide_action_button.dart';

class DepositBottomSheet extends StatefulWidget {
  final String address;

  const DepositBottomSheet({super.key, required this.address});

  @override
  State<DepositBottomSheet> createState() => _DepositBottomSheetState();
}

class _DepositBottomSheetState extends State<DepositBottomSheet> {
  final _amountController = TextEditingController(text: '1000');
  double _selectedAmount = 1000;
  bool _isLoading = false;
  String _loadingMessage = "Initiating Request...";
  Timer? _loadingTimer;

  @override
  void dispose() {
    _amountController.dispose();
    _loadingTimer?.cancel();
    super.dispose();
  }

  void _startLoadingAnimation() {
    int step = 0;
    _loadingMessage = "Initiating Request...";
    _loadingTimer = Timer.periodic(const Duration(milliseconds: 1500), (timer) {
      if (!mounted) return;
      setState(() {
        step++;
        if (step == 1) _loadingMessage = "Minting Tokens...";
        if (step == 2) _loadingMessage = "Finalizing Transaction...";
        if (step > 2) timer.cancel();
      });
    });
  }

  Future<void> _handleClaim() async {
    setState(() {
      _isLoading = true;
    });
    _startLoadingAnimation();

    final amount =
        double.tryParse(_amountController.text.trim()) ?? _selectedAmount;

    try {
      await BackendService().claimFaucet(
        address: widget.address,
        amount: amount,
      );

      if (!mounted) return;
      _loadingTimer?.cancel();
      context.pop(); // Close sheet
      UiUtils.showSuccess(context, "$amount USDT claimed successfully!");
    } catch (e) {
      if (!mounted) return;
      _loadingTimer?.cancel();
      String errorMessage = e.toString();
      if (errorMessage.contains("Exception:")) {
        errorMessage = errorMessage.replaceAll("Exception:", "").trim();
      }
      UiUtils.showError(context, errorMessage);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.viewInsetsOf(context);

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
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(24.w, 12.h, 24.w, 24.h),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
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
                  Gap(32.h),
                  if (_isLoading)
                    Center(
                      child: Padding(
                        padding: EdgeInsets.symmetric(vertical: 20.h),
                        child: Column(
                          children: [
                            SizedBox(
                              height: 180.h,
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
                      ),
                    )
                  else ...[
                    Center(
                      child: Container(
                        padding: EdgeInsets.all(16.w),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.water_drop_rounded,
                          size: 48.w,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                    Gap(24.h),
                    Center(
                      child: Text(
                        "Deposit (Testnet)",
                        style: AppTextStyles.heading2.copyWith(
                          fontSize: 24.sp,
                          height: 1.2,
                        ),
                      ),
                    ),
                    Gap(8.h),
                    Center(
                      child: Text(
                        "Get free testnet USDT to explore the platform",
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: Colors.grey[600],
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),

                    Gap(16.h),

                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: 20.w,
                        vertical: 16.h,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(24.r),
                        border: Border.all(color: Colors.grey[200]!),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: EdgeInsets.all(8.w),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.05),
                                  blurRadius: 10.r,
                                  offset: Offset(0, 2.h),
                                ),
                              ],
                            ),
                            child: Icon(
                              Icons.attach_money_rounded,
                              size: 24.w,
                              color: AppColors.primary,
                            ),
                          ),
                          Gap(16.w),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "Amount",
                                  style: AppTextStyles.caption.copyWith(
                                    color: Colors.grey[500],
                                    fontSize: 12.sp,
                                  ),
                                ),
                                Gap(4.h),
                                TextField(
                                  controller: _amountController,
                                  keyboardType: TextInputType.number,
                                  style: AppTextStyles.heading2.copyWith(
                                    fontSize: 28.sp,
                                    height: 1.0,
                                  ),
                                  decoration: InputDecoration(
                                    hintText: '0',
                                    border: InputBorder.none,
                                    isDense: true,
                                    contentPadding: EdgeInsets.zero,
                                    suffixText: 'USDT',
                                    suffixStyle: AppTextStyles.bodyLarge
                                        .copyWith(
                                          color: Colors.grey[400],
                                          fontWeight: FontWeight.w600,
                                        ),
                                  ),
                                  onChanged: (value) {
                                    final parsed = double.tryParse(value);
                                    if (parsed == null) return;
                                    setState(() => _selectedAmount = parsed);
                                  },
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Gap(40.h),
                    SlideActionButton(
                      text: "Slide to Claim",
                      isLoading: _isLoading,
                      onSlideComplete: _handleClaim,
                    ),
                    Gap(8.h),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
