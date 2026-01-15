import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gap/gap.dart';
import 'package:lottie/lottie.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../../../core/theme/theme.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../providers/invest_controller.dart';
import '../../../../core/widgets/slide_action_button.dart';

import '../data/bond_model.dart';

class InvestBottomSheet extends ConsumerStatefulWidget {
  final Bond bond;
  const InvestBottomSheet({super.key, required this.bond});

  @override
  ConsumerState<InvestBottomSheet> createState() => _InvestBottomSheetState();
}

class _InvestBottomSheetState extends ConsumerState<InvestBottomSheet> {
  late TextEditingController _amountController;
  late double _selectedAmount;
  String _loadingMessage = "Processing Investment...";
  Timer? _loadingTimer;

  @override
  void initState() {
    super.initState();
    final minAmount = _getMinInvestment();
    _selectedAmount = minAmount;
    _amountController = TextEditingController(
      text: minAmount.toStringAsFixed(0),
    );
  }

  @override
  void dispose() {
    _amountController.dispose();
    _loadingTimer?.cancel();
    super.dispose();
  }

  void _startLoadingAnimation() {
    int step = 0;
    _loadingMessage = "Processing Investment...";
    _loadingTimer = Timer.periodic(const Duration(milliseconds: 2000), (timer) {
      if (!mounted) return;
      setState(() {
        step++;
        if (step == 1) _loadingMessage = "Transferring Funds...";
        if (step == 2) _loadingMessage = "Confirming on Blockchain...";
        if (step > 2) timer.cancel();
      });
    });
  }

  double _getMinInvestment() {
    // "100 USDT" -> 100.0
    // "Min USDT 500" -> 500.0
    final numericString = widget.bond.minInvestment.replaceAll(
      RegExp(r'[^0-9.]'),
      '',
    );
    return double.tryParse(numericString) ?? 100.0;
  }

  @override
  Widget build(BuildContext context) {
    final investState = ref.watch(investControllerProvider);
    final minAmount = _getMinInvestment();

    // Listen for success
    ref.listen(investControllerProvider, (previous, next) {
      if (next.status == InvestStatus.loading &&
          previous?.status != InvestStatus.loading) {
        _startLoadingAnimation();
      }

      if (next.status == InvestStatus.success) {
        _loadingTimer?.cancel();
        context.pop(); // Close sheet
        ref.read(investControllerProvider.notifier).reset();
        context.go(
          '/success',
          extra: {'title': widget.bond.title, 'txHash': next.txHash},
        ); // Go to success with txHash
      }

      if (next.status == InvestStatus.initial &&
          previous?.status == InvestStatus.loading) {
        _loadingTimer?.cancel();
      }
    });

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
                  if (investState.status == InvestStatus.loading)
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
                              "Please do not close the app",
                              style: AppTextStyles.bodyMedium,
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    )
                  else ...[
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Expanded(
                          child: Text(
                            "Invest in\n${widget.bond.title}",
                            style: AppTextStyles.heading2.copyWith(
                              fontSize: 24.sp,
                              height: 1.2,
                            ),
                          ),
                        ),
                        GestureDetector(
                          onTap: () async {
                            final urlString =
                                widget.bond.proofUrl?.isNotEmpty == true
                                ? widget.bond.proofUrl!
                                : 'https://www.google.com'; // Default fallback
                            final url = Uri.parse(urlString);
                            if (await canLaunchUrl(url)) {
                              await launchUrl(
                                url,
                                mode: LaunchMode.externalApplication,
                              );
                            }
                          },
                          child: Container(
                            padding: EdgeInsets.all(12.w),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: SvgPicture.asset(
                              'assets/svg/external-link-svgrepo-com.svg',
                              width: 28.w,
                              height: 28.w,
                              colorFilter: ColorFilter.mode(
                                AppColors.primary,
                                BlendMode.srcIn,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    Gap(8.h),
                    RichText(
                      text: TextSpan(
                        style: AppTextStyles.bodyLarge.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                        children: [
                          TextSpan(
                            text: "Current Yield: ",
                            style: TextStyle(color: Colors.blueGrey[800]),
                          ),
                          TextSpan(
                            text: widget.bond.apy.replaceAll(' APY', ''),
                            style: const TextStyle(color: Colors.green),
                          ),
                          TextSpan(
                            text: " APY",
                            style: TextStyle(color: Colors.blueGrey[800]),
                          ),
                        ],
                      ),
                    ),
                    Gap(24.h),
                    // Bond Info - Bento Grid
                    Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: _buildBentoItem(
                                "Issuer",
                                widget.bond.subtitle,
                                Icons.business_rounded,
                                const Color(0xFFEDF3F8),
                                const Color(0xFF102E4A),
                              ),
                            ),
                            Gap(12.w),
                            Expanded(
                              child: _buildBentoItem(
                                "Minimum",
                                widget.bond.minInvestment,
                                Icons.attach_money_rounded,
                                const Color(0xFFEDF3F8),
                                const Color(0xFF102E4A),
                              ),
                            ),
                          ],
                        ),
                        Gap(12.h),
                        Row(
                          children: [
                            Expanded(
                              child: _buildBentoItem(
                                "Symbol",
                                widget.bond.symbol,
                                Icons.verified_user_rounded,
                                const Color(0xFFEDF3F8), // Same as Total Supply
                                const Color(0xFF102E4A), // Deep dark blue text
                              ),
                            ),
                            Gap(12.w),
                            Expanded(
                              child: _buildBentoItem(
                                "Maturity Date",
                                _formatMaturityDate(widget.bond.maturityDate),
                                Icons.lock_clock_rounded,
                                const Color(0xFFEDF3F8), // Same as Total Supply
                                const Color(0xFF102E4A), // Deep dark blue text
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Gap(24.h),
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
                                    fontWeight: FontWeight
                                        .w600, // Reduced from default bold
                                    color: _selectedAmount < minAmount
                                        ? Colors.red
                                        : null,
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
                                if (_selectedAmount < minAmount)
                                  Padding(
                                    padding: EdgeInsets.only(top: 4.h),
                                    child: Text(
                                      "Minimum investment is ${minAmount.toStringAsFixed(0)} USDT",
                                      style: AppTextStyles.caption.copyWith(
                                        color: Colors.red,
                                        fontSize: 11.sp,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    Gap(32.h),
                    SlideActionButton(
                      text: "Slide to Invest",
                      isLoading: investState.status == InvestStatus.loading,
                      enabled: _selectedAmount >= minAmount,
                      onSlideComplete: _selectedAmount >= minAmount
                          ? () {
                              final amount =
                                  double.tryParse(
                                    _amountController.text.trim(),
                                  ) ??
                                  _selectedAmount;
                              ref
                                  .read(investControllerProvider.notifier)
                                  .invest(amount, bondId: widget.bond.bondId);
                            }
                          : null,
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

  Widget _buildBentoItem(
    String label,
    String value,
    IconData icon, // Kept for API compatibility but not used
    Color bgColor,
    Color textColor,
  ) {
    return Container(
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          // Removed icon for cleaner look
          Text(
            label,
            style: TextStyle(
              color: textColor.withValues(alpha: 0.7),
              fontSize: 11.sp,
              fontWeight: FontWeight.w500,
            ),
          ),
          Gap(4.h),
          Text(
            value,
            style: TextStyle(
              color: textColor,
              fontSize: 17.sp,
              fontWeight: FontWeight.w600, // Reduced from w800
              letterSpacing: -0.5,
            ),
          ),
        ],
      ),
    );
  }

  String _formatMaturityDate(DateTime? date) {
    if (date == null) return '—';
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}
