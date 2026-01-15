import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/theme.dart';
import '../providers/analysis_provider.dart';
import '../domain/analysis_data.dart';
import 'widgets/portfolio_chart.dart';
import 'widgets/holdings_pie_chart.dart';

class AnalysisScreen extends ConsumerStatefulWidget {
  const AnalysisScreen({super.key});

  @override
  ConsumerState<AnalysisScreen> createState() => _AnalysisScreenState();
}

class _AnalysisScreenState extends ConsumerState<AnalysisScreen> {
  // Time range selection is visual-only for now as we don't have historical API

  @override
  Widget build(BuildContext context) {
    final analysisAsync = ref.watch(analysisDataProvider);

    return Scaffold(
      backgroundColor: const Color(
        0xFFF5F7FA,
      ), // Light grey, professional background
      appBar: AppBar(
        title: Text(
          "Portfolio Analysis",
          style: GoogleFonts.manrope(
            fontWeight: FontWeight.w700,
            fontSize: 18.sp,
            color: Colors.black87,
          ),
        ),
        backgroundColor: const Color(0xFFF5F7FA),
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios_new,
            size: 20.w,
            color: Colors.black87,
          ),
          onPressed: () => context.pop(),
        ),
      ),
      body: analysisAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
        data: (data) {
          return SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 10.h),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSummaryCard(data),
                Gap(24.h),
                if (data.history.length > 2) ...[
                  _buildChartSection(data),
                  Gap(24.h),
                ],
                _buildAssetBreakdown(data),
                Gap(40.h),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSummaryCard(AnalysisData data) {
    bool isPositive = data.totalReturns >= 0;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(24.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 24.r,
            offset: Offset(0, 8.h),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            "Total Portfolio Value",
            style: GoogleFonts.manrope(
              color: Colors.grey[500],
              fontSize: 13.sp,
              fontWeight: FontWeight.w500,
            ),
          ),
          Gap(8.h),
          Text(
            "${data.currentValue.toStringAsFixed(2)} USDT",
            style: GoogleFonts.manrope(
              color: Colors.black,
              fontSize: 36.sp,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.5,
            ),
          ),
          Gap(8.h),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 6.h),
            decoration: BoxDecoration(
              color: isPositive
                  ? const Color(0xFFE8F5E9)
                  : const Color(0xFFFFEBEE),
              borderRadius: BorderRadius.circular(30.r),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  isPositive
                      ? Icons.arrow_outward_rounded
                      : Icons.arrow_downward_rounded,
                  color: isPositive ? Colors.green[700] : Colors.red[700],
                  size: 16.w,
                ),
                Gap(4.w),
                Text(
                  "${data.totalReturns.abs().toStringAsFixed(2)} USDT (${data.returnsPercentage.abs().toStringAsFixed(2)}%)",
                  style: GoogleFonts.manrope(
                    color: isPositive ? Colors.green[800] : Colors.red[800],
                    fontWeight: FontWeight.w700,
                    fontSize: 13.sp,
                  ),
                ),
              ],
            ),
          ),
          Gap(24.h),
          Row(
            children: [
              Expanded(
                child: _buildMiniStat(
                  "Invested Amount",
                  "${data.totalInvested.toStringAsFixed(2)} USDT",
                ),
              ),
              Container(width: 1.w, height: 40.h, color: Colors.grey[200]),
              Expanded(
                child: _buildMiniStat(
                  "Unrealized P/L",
                  "${data.totalReturns.toStringAsFixed(2)} USDT",
                  isColor: true,
                  isPositive: isPositive,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMiniStat(
    String label,
    String value, {
    bool isColor = false,
    bool isPositive = true,
  }) {
    return Column(
      children: [
        Text(
          label,
          style: GoogleFonts.manrope(
            color: Colors.grey[500],
            fontSize: 12.sp,
            fontWeight: FontWeight.w500,
          ),
        ),
        Gap(6.h),
        Text(
          value,
          style: GoogleFonts.manrope(
            color: isColor
                ? (isPositive ? Colors.green[700] : Colors.red[700])
                : Colors.black87,
            fontWeight: FontWeight.w700,
            fontSize: 16.sp,
          ),
        ),
      ],
    );
  }

  Widget _buildChartSection(AnalysisData data) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Performance",
          style: GoogleFonts.manrope(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Colors.black87,
          ),
        ),
        const Gap(16),
        Container(
          height: 300,
          padding: const EdgeInsets.only(right: 16, top: 10, bottom: 10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: PortfolioChart(
            history: data.history,
            isProfit: data.totalReturns >= 0,
          ),
        ),
      ],
    );
  }

  Widget _buildAssetBreakdown(AnalysisData data) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Allocation",
          style: GoogleFonts.manrope(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Colors.black87,
          ),
        ),
        const Gap(16),
        Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: HoldingsPieChart(holdings: data.holdings),
        ),
        const Gap(32),
        Text(
          "Your Holdings",
          style: GoogleFonts.manrope(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Colors.black87,
          ),
        ),
        const Gap(16),
        if (data.holdings.isEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.all(32.0),
              child: Text(
                "No investments found.",
                style: GoogleFonts.manrope(color: Colors.grey),
              ),
            ),
          ),

        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: data.holdings.length,
          separatorBuilder: (c, i) => const Gap(16),
          itemBuilder: (context, index) {
            final asset = data.holdings[index];
            return _buildAssetCard(asset);
          },
        ),
      ],
    );
  }

  Widget _buildAssetCard(AssetHolding asset) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          childrenPadding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          leading: Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.token, color: AppColors.primary),
          ),
          title: Text(
            asset.name,
            style: GoogleFonts.manrope(
              fontWeight: FontWeight.w700,
              fontSize: 16,
              color: Colors.black87,
            ),
          ),
          subtitle: Text(
            "${asset.ticker} • ${asset.quantity.toStringAsFixed(2)} Units",
            style: GoogleFonts.manrope(color: Colors.grey[500], fontSize: 13),
          ),
          trailing: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                "${asset.currentValue.toStringAsFixed(2)} USDT",
                style: GoogleFonts.manrope(
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                  color: Colors.black87,
                ),
              ),
              Text(
                "${asset.apy}% APY",
                style: GoogleFonts.manrope(
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                  color: Colors.green[700],
                ),
              ),
            ],
          ),
          children: [
            const Divider(color: Color(0xFFF0F0F0)),
            const Gap(16),
            _buildDetailRow(
              "Monthly Yield",
              "${asset.monthlyYield.toStringAsFixed(2)} USDT",
            ),
            const Gap(12),
            _buildDetailRow(
              "Projected Future Value",
              "${asset.futureValue.toStringAsFixed(2)} USDT",
            ),
            const Gap(12),
            _buildDetailRow("Investment Period", asset.investmentPeriod),
            const Gap(12),
            if (asset.proofUrl != null)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "Blockchain Proof",
                    style: GoogleFonts.manrope(
                      color: Colors.grey[600],
                      fontSize: 13,
                    ),
                  ),
                  InkWell(
                    onTap: () => launchUrl(Uri.parse(asset.proofUrl!)),
                    child: Row(
                      children: [
                        Text(
                          "View on Explorer",
                          style: GoogleFonts.manrope(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                        const Gap(4),
                        const Icon(
                          Icons.open_in_new,
                          size: 14,
                          color: AppColors.primary,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.manrope(color: Colors.grey[600], fontSize: 13),
        ),
        Text(
          value,
          style: GoogleFonts.manrope(
            color: Colors.black87,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ],
    );
  }
}
