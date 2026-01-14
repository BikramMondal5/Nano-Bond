import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:lottie/lottie.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/theme/theme.dart';
import '../../../invest/providers/investment_provider.dart';

class HistoryDrawer extends ConsumerStatefulWidget {
  const HistoryDrawer({super.key});

  @override
  ConsumerState<HistoryDrawer> createState() => _HistoryDrawerState();
}

class _HistoryDrawerState extends ConsumerState<HistoryDrawer>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  bool _animationCompleted = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(vsync: this);
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _onAnimationLoaded(LottieComposition composition) {
    _animationController.duration = composition.duration;
    _animationController.forward().then((_) {
      if (mounted) {
        setState(() {
          _animationCompleted = true;
        });
      }
    });
  }

  Future<void> _launchExplorer(String txHash) async {
    if (txHash.isEmpty) return;
    // Mantle Sepolia Testnet Explorer
    final uri = Uri.parse('https://explorer.sepolia.mantle.xyz/tx/$txHash');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    final transactionsAsync = ref.watch(investmentProvider);

    // Show loading animation until it completes at least once AND data is loaded
    final isDataLoaded =
        transactionsAsync.hasValue || transactionsAsync.hasError;
    final showContent = _animationCompleted && isDataLoaded;

    return Container(
      height: 0.75.sh,
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24.r),
          topRight: Radius.circular(24.r),
        ),
      ),
      child: Column(
        children: [
          // Drawer Handle
          Container(
            margin: EdgeInsets.only(top: 12.h, bottom: 8.h),
            width: 40.w,
            height: 4.h,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2.r),
            ),
          ),

          // Header
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 16.h),
            child: Row(
              mainAxisAlignment: MainAxisAlignment
                  .center, // Center title if desired, or keep left?
              // Reference image has it on the Left.
              // "History" text on left. No buttons.
              children: [
                Text(
                  "History",
                  style: GoogleFonts.outfit(
                    fontSize: 28.sp,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                    letterSpacing: -0.5,
                  ),
                ),
              ],
            ),
          ),

          // Content
          Expanded(
            child: !showContent
                ? Center(
                    child: SizedBox(
                      width: 120.w,
                      height: 120.w,
                      child: Lottie.asset(
                        'assets/animation/Loading.json',
                        controller: _animationController,
                        onLoaded: _onAnimationLoaded,
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) {
                          debugPrint("Lottie Loading Error: $error");
                          return const CircularProgressIndicator();
                        },
                      ),
                    ),
                  )
                : transactionsAsync.when(
                    data: (transactions) {
                      if (transactions.isEmpty) {
                        return Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.history,
                                size: 64.w,
                                color: Colors.grey[300],
                              ),
                              Gap(16.h),
                              Text(
                                "No transactions yet",
                                style: GoogleFonts.manrope(
                                  fontSize: 16.sp,
                                  color: Colors.grey,
                                ),
                              ),
                            ],
                          ),
                        );
                      }

                      // Sort latest to old
                      final sortedTransactions = List<TransactionModel>.from(
                        transactions,
                      )..sort((a, b) => b.date.compareTo(a.date));

                      return ListView.separated(
                        padding: EdgeInsets.all(24.w),
                        itemCount: sortedTransactions.length,
                        separatorBuilder: (context, index) => Gap(12.h),
                        itemBuilder: (context, index) {
                          final transaction = sortedTransactions[index];
                          return _buildTransactionItem(transaction);
                        },
                      );
                    },
                    loading: () =>
                        const Center(child: CircularProgressIndicator()),
                    error: (err, stack) => Center(
                      child: Text(
                        'Error: $err',
                        style: const TextStyle(color: Colors.red),
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionItem(TransactionModel transaction) {
    Color cardColor;
    Color contentColor;
    Color iconBgColor;
    IconData icon;
    String statusText;

    // Bento Grid Pastel Colors
    switch (transaction.type) {
      case TransactionType.invest:
        cardColor = const Color(0xFFEFEEFC); // Light Lavender
        contentColor = AppColors.primary; // Dark Text
        iconBgColor = AppColors.primary.withValues(alpha: 0.08);
        icon = Icons.north_east;
        statusText = "Invested";
        break;
      case TransactionType.deposit:
        cardColor = const Color(0xFFE6F2FF); // Light Blue
        contentColor = AppColors.primary; // Dark Text
        iconBgColor = AppColors.primary.withValues(alpha: 0.08);
        icon = Icons.arrow_downward;
        statusText = "Deposited";
        break;
      case TransactionType.withdraw:
        cardColor = const Color(0xFFF5F5F7); // Light Grey
        contentColor = AppColors.primary; // Dark Text
        iconBgColor = AppColors.primary.withValues(alpha: 0.08);
        icon = Icons.arrow_upward;
        statusText = "Withdrawn";
        break;
      case TransactionType.claim:
        cardColor = const Color(0xFFE0F2F1); // Soft Mint/Teal
        contentColor = AppColors.primary; // Dark Text
        iconBgColor = AppColors.primary.withValues(alpha: 0.08);
        icon = Icons.redeem;
        statusText = "Claimed";
        break;
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
                bottomLeft: Radius.circular(24.r),
                bottomRight: Radius.circular(
                  24.r,
                ), // Making it look like the top card sits on the bottom sheet, or we can follow the image where it looks like a single card split.
                // Actually the image shows the top colored part has rounded corners at the bottom too?
                // Looking closer at the image: The top colored part seems to have rounded corners on all sides, sitting ON TOP of or merged with a white card?
                // Or it's a split card. Let's do a split card: Top rounded top-left/top-right. Bottom rounded bottom-left/bottom-right.
                // BUT the image cards look like: Top colored part has rounded corners (all 4? or just top?).
                // Let's look at the "Sr UX Designer" card. It looks like the colored part ends, and the white part starts.
                // I will do: Top part rounded top-left/top-right.
              ).copyWith(bottomLeft: Radius.zero, bottomRight: Radius.zero),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Icon Box and Title
                    Expanded(
                      child: Row(
                        children: [
                          Container(
                            height: 48.w,
                            width: 48.w,
                            decoration: BoxDecoration(
                              color: iconBgColor,
                              borderRadius: BorderRadius.circular(12.r),
                            ),
                            child: Icon(icon, color: contentColor, size: 24.w),
                          ),
                          Gap(12.w),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  transaction.type == TransactionType.claim
                                      ? "Yield Claim"
                                      : transaction.title,
                                  style: GoogleFonts.manrope(
                                    fontSize: 16.sp,
                                    fontWeight: FontWeight.bold,
                                    color: contentColor,
                                  ),
                                ),
                                Text(
                                  transaction.subtitle,
                                  style: GoogleFonts.manrope(
                                    fontSize: 12.sp,
                                    color: contentColor.withValues(alpha: 0.8),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Gap(8.w),
                    // View Button
                    GestureDetector(
                      onTap: () {
                        if (transaction.txHash != null &&
                            transaction.txHash!.isNotEmpty) {
                          _launchExplorer(transaction.txHash!);
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                "Transaction hash not available",
                                style: GoogleFonts.manrope(color: Colors.white),
                              ),
                              backgroundColor: Colors.black87,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      },
                      child: Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 14.w,
                          vertical: 8.h,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white, // White background
                          borderRadius: BorderRadius.circular(20.r),
                          // No border or very subtle if needed
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              "View",
                              style: GoogleFonts.manrope(
                                fontSize: 12.sp,
                                fontWeight: FontWeight.w600,
                                color: AppColors.primary, // Dark text
                              ),
                            ),
                            Gap(6.w),
                            Icon(
                              Icons.north_east,
                              size: 12.w,
                              color: AppColors.primary, // Dark icon
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                Gap(16.h),
                // Chips/Tags (Optional, mimicking the image's tags)
                Row(
                  children: [
                    _buildTag(statusText, contentColor, iconBgColor),
                    Gap(8.w),
                    _buildTag(
                      "${transaction.amount.toInt()} USDT",
                      contentColor,
                      iconBgColor,
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Bottom White Section
          Container(
            padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 16.h),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(24.r),
                bottomRight: Radius.circular(24.r),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(Icons.access_time, size: 16.w, color: Colors.grey),
                    Gap(6.w),
                    Text(
                      _formatDate(transaction.date),
                      style: GoogleFonts.manrope(
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
                Text(
                  "${transaction.amount.toInt()} USDT",
                  style: GoogleFonts.manrope(
                    fontSize: 16.sp,
                    fontWeight: FontWeight.w800,
                    color: Colors.black87,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTag(String text, Color textColor, Color bgColor) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20.r),
      ),
      child: Text(
        text,
        style: GoogleFonts.manrope(
          fontSize: 10.sp,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    // "Posted 2 days ago" style
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      return "Today";
    } else if (difference.inDays == 1) {
      return "Yesterday";
    } else if (difference.inDays < 7) {
      return "${difference.inDays} days ago";
    } else {
      return DateFormat('MMM dd, yyyy').format(date);
    }
  }
}
