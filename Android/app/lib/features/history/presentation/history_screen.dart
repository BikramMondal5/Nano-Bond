import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lottie/lottie.dart';

import '../../../core/theme/theme.dart';
import '../../invest/providers/investment_provider.dart';

class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});

  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen>
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

  @override
  Widget build(BuildContext context) {
    final transactionsAsync = ref.watch(investmentProvider);

    // Show loading animation until it completes at least once AND data is loaded
    final isDataLoaded =
        transactionsAsync.hasValue || transactionsAsync.hasError;
    final showContent = _animationCompleted && isDataLoaded;

    if (!showContent) {
      return Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: SizedBox(
            width: 150.w,
            height: 150.w,
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
        ),
      );
    }

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
          "History",
          style: AppTextStyles.heading2.copyWith(fontSize: 20.sp),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh, color: Colors.black87, size: 24.w),
            onPressed: () => ref.refresh(investmentProvider),
          ),
        ],
        centerTitle: true,
      ),
      body: transactionsAsync.when(
        data: (transactions) => transactions.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.history, size: 64.w, color: Colors.grey[300]),
                    Gap(16.h),
                    Text(
                      "No transactions yet",
                      style: AppTextStyles.bodyLarge.copyWith(
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              )
            : ListView.separated(
                padding: EdgeInsets.all(24.w),
                itemCount: transactions.length,
                separatorBuilder: (context, index) => Gap(16.h),
                itemBuilder: (context, index) {
                  final transaction = transactions[index];
                  return _buildTransactionCard(transaction);
                },
              ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Text('Error: $err', style: const TextStyle(color: Colors.red)),
        ),
      ),
    );
  }

  Widget _buildTransactionCard(TransactionModel transaction) {
    Color statusColor;
    IconData icon;

    switch (transaction.type) {
      case TransactionType.invest:
        statusColor = AppColors.primary;
        icon = Icons.trending_up;
        break;
      case TransactionType.deposit:
        statusColor = Colors.green;
        icon = Icons.arrow_downward;
        break;
      case TransactionType.withdraw:
        statusColor = Colors.orange;
        icon = Icons.arrow_upward;
        break;
      case TransactionType.claim:
        statusColor = Colors.purple;
        icon = Icons.redeem;
        break;
    }

    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10.r,
            offset: Offset(0, 4.h),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.all(12.w),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: statusColor, size: 24.w),
          ),
          Gap(16.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  transaction.title,
                  style: AppTextStyles.bodyLarge.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  transaction.subtitle,
                  style: AppTextStyles.caption.copyWith(color: Colors.grey),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                "₹${transaction.amount.toInt()}",
                style: AppTextStyles.heading3.copyWith(color: statusColor),
              ),
              Text(
                DateFormat('MMM dd, yyyy').format(transaction.date),
                style: AppTextStyles.caption.copyWith(fontSize: 12.sp),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
