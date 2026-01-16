import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lottie/lottie.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/theme.dart';
import '../../../../core/services/backend_service.dart';
import '../../../../core/utils/ui_utils.dart';

import '../../providers/user_portfolio_provider.dart';
import '../../../invest/providers/bonds_provider.dart';

class WithdrawBottomSheet extends ConsumerStatefulWidget {
  final String address;

  const WithdrawBottomSheet({super.key, required this.address});

  @override
  ConsumerState<WithdrawBottomSheet> createState() =>
      _WithdrawBottomSheetState();
}

class _WithdrawBottomSheetState extends ConsumerState<WithdrawBottomSheet> {
  bool _isLoading = false;
  bool _showSuccess = false;
  bool _isClaimSuccess = false; // true = claim, false = redeem
  double _successAmount = 0;
  String _successBondName = '';
  String _loadingMessage = "Processing...";
  Timer? _loadingTimer;

  // Track which bond is being acted upon to show loading only on that card?
  // Or global loading since it's a bottom sheet blocking interaction is fine.
  // I'll stick to global loading for simplicity as per existing code.

  @override
  void dispose() {
    _loadingTimer?.cancel();
    super.dispose();
  }

  void _startLoadingAnimation(String message) {
    int step = 0;
    _loadingMessage = message;
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

  Future<void> _handleClaim(
    String bondId,
    double yieldAmount,
    String bondName,
  ) async {
    setState(() => _isLoading = true);
    _startLoadingAnimation("Initiating Claim...");

    try {
      await BackendService().claimYield(
        address: widget.address,
        bondId: bondId,
      );

      if (!mounted) return;
      _loadingTimer?.cancel();
      ref.invalidate(userPortfolioProvider);

      // Show success screen instead of just a toast
      setState(() {
        _isLoading = false;
        _showSuccess = true;
        _isClaimSuccess = true;
        _successAmount = yieldAmount;
        _successBondName = bondName;
      });
    } catch (e) {
      if (!mounted) return;
      _loadingTimer?.cancel();
      _handleError(e);
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handleRedeem(
    String bondId,
    double amount,
    String bondName,
  ) async {
    setState(() => _isLoading = true);
    _startLoadingAnimation("Redeeming Principal...");

    try {
      await BackendService().redeem(
        address: widget.address,
        bondAmount:
            amount, // Backend takes double? BackendService.redeem takes double bondAmount.
        bondId: bondId,
      );

      if (!mounted) return;
      _loadingTimer?.cancel();
      ref.invalidate(userPortfolioProvider);

      // Show success screen instead of just a toast
      setState(() {
        _isLoading = false;
        _showSuccess = true;
        _isClaimSuccess = false;
        _successAmount = amount;
        _successBondName = bondName;
      });
    } catch (e) {
      if (!mounted) return;
      _loadingTimer?.cancel();
      _handleError(e);
      setState(() => _isLoading = false);
    }
  }

  void _handleError(dynamic e) {
    String errorMessage = e.toString();
    if (errorMessage.contains("Exception:")) {
      errorMessage = errorMessage.replaceAll("Exception:", "").trim();
    }

    if (errorMessage.toLowerCase().contains("no yield available") ||
        errorMessage.toLowerCase().contains("nothing to claim")) {
      UiUtils.showError(context, "No yield available to claim right now.");
    } else if (errorMessage.toLowerCase().contains("bond not matured")) {
      UiUtils.showError(context, "Bond has not matured yet.");
    } else {
      UiUtils.showError(context, errorMessage);
    }
  }

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.viewInsetsOf(context);
    final portfolioAsync = ref.watch(userPortfolioProvider);

    return Padding(
      padding: EdgeInsets.only(bottom: viewInsets.bottom),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 520.w, maxHeight: 0.72.sh),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.background,
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

                // Header - Only show when not loading or showing success
                if (!_isLoading && !_showSuccess) ...[
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 24.w),
                    child: Center(
                      child: Text(
                        "Redeem",
                        style: GoogleFonts.outfit(
                          fontSize: 24.sp,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ),
                  Gap(16.h),
                ],

                if (_showSuccess)
                  _buildSuccessState()
                else if (_isLoading)
                  _buildLoadingState()
                else
                  Expanded(
                    child: portfolioAsync.when(
                      data: (portfolio) {
                        final holdings = portfolio.holdings;
                        if (holdings.isEmpty) {
                          return Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.account_balance_wallet_outlined,
                                  size: 64.w,
                                  color: Colors.grey[300],
                                ),
                                Gap(16.h),
                                Text(
                                  "No bonds found",
                                  style: AppTextStyles.bodyMedium.copyWith(
                                    color: Colors.grey,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }

                        return ListView.separated(
                          padding: EdgeInsets.fromLTRB(24.w, 0, 24.w, 24.h),
                          itemCount: holdings.length,
                          separatorBuilder: (_, _) => Gap(16.h),
                          itemBuilder: (context, index) =>
                              _buildBondCard(holdings[index]),
                        );
                      },
                      loading: () =>
                          const Center(child: CircularProgressIndicator()),
                      error: (err, _) =>
                          Center(child: Text("Error loading portfolio")),
                    ),
                  ),
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

  Widget _buildSuccessState() {
    return Expanded(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 20.h),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Success Animation
            Container(
              width: 120.w,
              height: 120.w,
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.check_circle_rounded,
                size: 80.w,
                color: Colors.green[600],
              ),
            ),
            Gap(32.h),
            // Success Title
            Text(
              _isClaimSuccess ? "Yield Claimed!" : "Redemption Successful!",
              style: GoogleFonts.outfit(
                fontSize: 24.sp,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
              textAlign: TextAlign.center,
            ),
            Gap(12.h),
            // Success Details
            Text(
              _isClaimSuccess
                  ? "You have successfully claimed yield"
                  : "You have successfully redeemed",
              style: GoogleFonts.manrope(
                fontSize: 14.sp,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            Gap(8.h),
            // Amount
            RichText(
              textAlign: TextAlign.center,
              text: TextSpan(
                children: [
                  TextSpan(
                    text: "\$${_successAmount.toStringAsFixed(2)}",
                    style: GoogleFonts.manrope(
                      fontSize: 32.sp,
                      fontWeight: FontWeight.w800,
                      color: Colors.green[600],
                    ),
                  ),
                ],
              ),
            ),
            Gap(8.h),
            Text(
              "from $_successBondName",
              style: GoogleFonts.manrope(
                fontSize: 14.sp,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
            Gap(16.h),
            // USDT Added info
            Container(
              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 10.h),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12.r),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.account_balance_wallet_outlined,
                    size: 18.w,
                    color: Colors.green[600],
                  ),
                  Gap(8.w),
                  Text(
                    "USDT added to your wallet",
                    style: GoogleFonts.manrope(
                      fontSize: 13.sp,
                      fontWeight: FontWeight.w600,
                      color: Colors.green[600],
                    ),
                  ),
                ],
              ),
            ),
            const Spacer(),
            // Done Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.symmetric(vertical: 16.h),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16.r),
                  ),
                  elevation: 0,
                ),
                child: Text(
                  "Done",
                  style: GoogleFonts.manrope(
                    fontSize: 16.sp,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
            Gap(16.h),
          ],
        ),
      ),
    );
  }

  Widget _buildBondCard(PortfolioHolding holding) {
    // Maturity date for display purposes
    final maturity =
        DateTime.tryParse(holding.maturityDate) ??
        DateTime.now().add(const Duration(days: 3650));

    // Styling constants (Matching History Drawer Pastel Vibes)
    final cardColor = const Color(0xFFEFEEFC); // Lavender like 'Invested'
    final contentColor = AppColors.primary;

    // Yield Amount Logic: Use per-holding pendingYield
    final holdingYield = holding.pendingYield ?? 0;
    final hasYield = holdingYield > 0.01;

    // Formatting APY: If > 1, assume it's like 700 (meaning 7.00% or 700%? user said 700.0% is typo).
    // If backend sends 7.0 for 7%, then (7 * 100) = 700.
    // If backend sends 0.07 for 7%, then (0.07 * 100) = 7.0.
    // User sees "700.0%", implying value was 7.0. So we should probably NOT multiply by 100 if it's already > 1.
    // Or just check range.
    String apyText;
    if (holding.apy > 1.0) {
      // Likely already percentage e.g. 7.0
      apyText = "${holding.apy.toStringAsFixed(1)}%";
    } else {
      // Likely decimal e.g. 0.07
      apyText = "${(holding.apy * 100).toStringAsFixed(1)}%";
    }

    // Lookup Bond Icon from Registry
    final bondsAsync = ref.watch(bondsProvider);
    IconData bondIcon = Icons.shield_outlined; // Default

    if (bondsAsync.hasValue) {
      try {
        final bond = bondsAsync.value!.firstWhere(
          (b) => b.bondId == holding.bondId,
        );
        bondIcon = bond.icon;
      } catch (_) {}
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10.r,
            offset: Offset(0, 4.h),
          ),
        ],
      ),
      child: Column(
        children: [
          // Top Colored Section
          Container(
            padding: EdgeInsets.all(16.w),
            decoration: BoxDecoration(
              color: cardColor,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(24.r),
                topRight: Radius.circular(24.r),
              ),
            ),
            child: Row(
              children: [
                Container(
                  height: 48.w,
                  width: 48.w,
                  decoration: BoxDecoration(
                    color:
                        Colors.white, // White icon bg as per Bento/Card style
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  // User said "icon use same". If refering to shield in screenshot, I'll keep verified_user_outlined or check BondCard icon.
                  // BondCard uses `bond.icon`. Here we don't have bond icon in holding.
                  // Default to shield as it looks good and matches "Government Bond" theme.
                  child: Icon(bondIcon, color: contentColor, size: 24.w),
                ),
                Gap(12.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        holding.bondName,
                        style: GoogleFonts.manrope(
                          fontSize: 16.sp,
                          fontWeight: FontWeight.bold,
                          color: contentColor,
                        ),
                      ),
                      Text(
                        holding.bondId, // or symbol
                        style: GoogleFonts.manrope(
                          fontSize: 12.sp,
                          color: contentColor.withValues(alpha: 0.6),
                        ),
                      ),
                    ],
                  ),
                ),
                // Price/Value
                Text(
                  "\$${holding.value.toStringAsFixed(0)}",
                  style: GoogleFonts.manrope(
                    fontSize: 18.sp,
                    fontWeight: FontWeight.w800,
                    color: contentColor,
                  ),
                ),
              ],
            ),
          ),

          // Middle Info Section (Maturity & Rates)
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 20.h),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildInfoColumn(
                  "APY",
                  apyText,
                  color: Colors.black87,
                ), // Darker color for value
                _buildInfoColumn(
                  "Maturity",
                  DateFormat('MMM dd, yyyy').format(maturity),
                  color: Colors.black87,
                ),
                _buildInfoColumn(
                  "Status",
                  holding.isUnlocked ? "Unlocked" : "Locked",
                  color: holding.isUnlocked ? Colors.green : Colors.orange,
                ),
              ],
            ),
          ),

          // Divider
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 24.w),
            child: Divider(color: Colors.grey[100], height: 1.h),
          ),

          // Bottom Actions
          Padding(
            padding: EdgeInsets.all(16.w),
            child: Row(
              children: [
                // Claim Yield Button
                Expanded(
                  child: ElevatedButton(
                    onPressed: hasYield
                        ? () => _handleClaim(
                            holding.bondId,
                            holdingYield,
                            holding.bondName,
                          )
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green[600],
                      disabledBackgroundColor: Colors.grey[200],
                      foregroundColor: Colors.white,
                      disabledForegroundColor: Colors.grey[400],
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12.r),
                      ),
                      padding: EdgeInsets.symmetric(vertical: 12.h),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.north_east_rounded, size: 16.w),
                        Gap(6.w),
                        Text(
                          hasYield
                              ? "Claim \$${holdingYield.toStringAsFixed(2)}"
                              : "Claim Yield",
                          style: GoogleFonts.manrope(
                            fontWeight: FontWeight.w600,
                            fontSize: 14.sp,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Gap(12.w),
                // Withdraw Principal Button
                Expanded(
                  child: OutlinedButton(
                    onPressed: holding.isUnlocked
                        ? () => _handleRedeem(
                            holding.bondId,
                            holding.balance,
                            holding.bondName,
                          )
                        : null,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      disabledForegroundColor: Colors.grey[400],
                      side: BorderSide(
                        color: holding.isUnlocked
                            ? AppColors.primary
                            : Colors.grey[300]!,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12.r),
                      ),
                      padding: EdgeInsets.symmetric(vertical: 12.h),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.arrow_upward_rounded, size: 16.w),
                        Gap(6.w),
                        Text(
                          "Withdraw",
                          style: GoogleFonts.manrope(
                            fontWeight: FontWeight.w600,
                            fontSize: 14.sp,
                          ),
                        ),
                      ],
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

  Widget _buildInfoColumn(String label, String value, {Color? color}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.manrope(
            fontSize: 11.sp,
            color: Colors.grey[500],
            fontWeight: FontWeight.w500,
          ),
        ),
        Gap(2.h),
        Text(
          value,
          style: GoogleFonts.manrope(
            fontSize: 13.sp,
            color: color ?? AppColors.primary,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}
