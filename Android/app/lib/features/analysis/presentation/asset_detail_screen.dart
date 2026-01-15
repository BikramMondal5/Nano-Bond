import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'widgets/asset_chart.dart';
import '../../invest/presentation/invest_sheet.dart';

class AssetDetailScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic>? extra;

  const AssetDetailScreen({super.key, this.extra});

  @override
  ConsumerState<AssetDetailScreen> createState() => _AssetDetailScreenState();
}

class _AssetDetailScreenState extends ConsumerState<AssetDetailScreen> {
  String selectedTimeframe = "6M";
  final List<String> timeframes = ["1D", "1W", "3M", "6M", "All"];

  // Generate mock history based on a seed value for "Real Data" look
  List<double> _generateHistory(double seedValue, double apy) {
    if (seedValue <= 0) seedValue = 1000;
    List<double> data = [];
    double current = seedValue * 0.95; // Start slightly lower
    final random = DateTime.now().millisecondsSinceEpoch;
    // Using hash of name ensures same graph for same asset
    int seed = widget.extra?['name'].hashCode ?? random;

    // Simple seeded random generator logic (linear congruential generator)
    int lcg(int x) => (1103515245 * x + 12345) & 0x7fffffff;

    for (int i = 0; i < 20; i++) {
      seed = lcg(seed);
      double r = (seed % 100) / 100.0; // 0.0 to 1.0
      // Trend upwards if APY is high
      double trend = (apy / 100.0) * (seedValue / 50.0);
      double volatility = (r - 0.4) * (seedValue * 0.05);
      current = current + trend + volatility;
      if (current < 0) current = 100;
      data.add(current);
    }
    // Ensure last point matches or is close to current value
    data.add(seedValue);
    return data;
  }

  @override
  Widget build(BuildContext context) {
    // Basic args extraction (mocking if null)
    final String assetName =
        widget.extra?['name'] as String? ?? "GOI Bond 2030";
    final double currentValue =
        (widget.extra?['value'] as num?)?.toDouble() ?? 729.44;
    final double profit =
        (widget.extra?['profit'] as num?)?.toDouble() ?? 37.67;
    final double percent =
        (widget.extra?['percent'] as num?)?.toDouble() ?? 5.25;
    final bool isPositive = profit >= 0;

    // Generate dynamic real-looking data
    final List<double> chartData = _generateHistory(currentValue, percent);

    return Scaffold(
      backgroundColor: const Color(0xFF1E1E1E), // Dark background
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: Text(
          "Asset Analysis",
          style: GoogleFonts.manrope(
            fontWeight: FontWeight.w600,
            fontSize: 16,
            color: Colors.white,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(20.w),
        child: Column(
          children: [
            // 1. Purple Chart Card
            _buildChartCard(
              assetName,
              currentValue,
              profit,
              percent,
              isPositive,
              chartData,
            ),

            const Gap(24),

            // 2. Stats Rows
            Row(
              children: [
                Expanded(child: _buildStatCard("8", "Owned")),
                Gap(12.w),
                Expanded(child: _buildStatCard("\$5,835", "Total Value")),
                Gap(12.w),
                Expanded(
                  child: _buildStatCard(
                    "+\$850",
                    "Profit",
                    valueColor: const Color(0xFF00B894),
                  ),
                ),
              ],
            ),

            const Gap(24),

            // 2.5 Token Market Info (New)
            _buildTokenInfoSection(),

            const Gap(24),

            // 3. Trading Panel
            _buildTradingPanel(currentValue),

            const Gap(40),
          ],
        ),
      ),
    );
  }

  Widget _buildChartCard(
    String name,
    double value,
    double profit,
    double percent,
    bool isPositive,
    List<double> chartData,
  ) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(24.w),
      decoration: BoxDecoration(
        color: const Color(0xFF8B5CF6), // Vivid Purple
        borderRadius: BorderRadius.circular(32.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "\$${value.toStringAsFixed(2)}",
                style: GoogleFonts.manrope(
                  fontSize: 36,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  letterSpacing: -1,
                ),
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.show_chart,
                  color: Colors.white,
                  size: 20,
                ),
              ),
            ],
          ),
          const Gap(4),
          Row(
            children: [
              Icon(
                Icons.north_east,
                size: 16,
                color: Colors.white.withValues(alpha: 0.8),
              ),
              Gap(4.w),
              Text(
                "\$${profit.abs().toStringAsFixed(2)} (${percent.toStringAsFixed(2)}%)",
                style: GoogleFonts.manrope(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.white.withValues(alpha: 0.8),
                ),
              ),
            ],
          ),

          const Gap(24),

          // Chart
          SizedBox(height: 180, child: AssetChart(history: chartData)),

          const Gap(24),

          // Timeframes
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children:
                timeframes.map<Widget>((tf) {
                  final isSelected = tf == selectedTimeframe;
                  return GestureDetector(
                    onTap: () => setState(() => selectedTimeframe = tf),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected ? Colors.white : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        tf,
                        style: GoogleFonts.manrope(
                          color: isSelected
                              ? const Color(0xFF8B5CF6)
                              : Colors.white.withValues(alpha: 0.6),
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  );
                }).toList() +
                [
                  // Calendar Icon
                  Container(
                    padding: const EdgeInsets.all(8),
                    child: Icon(
                      Icons.calendar_today_rounded,
                      color: Colors.white.withValues(alpha: 0.6),
                      size: 20,
                    ),
                  ),
                ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String value, String label, {Color? valueColor}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF2A2A2A), // Dark Grey
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: GoogleFonts.manrope(
              color: valueColor ?? Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
          const Gap(4),
          Text(
            label,
            style: GoogleFonts.manrope(
              color: Colors.grey[500],
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTokenInfoSection() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF2A2A2A),
        borderRadius: BorderRadius.circular(32),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Market Stats",
            style: GoogleFonts.manrope(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
          const Gap(20),
          Row(
            children: [
              Expanded(child: _buildInfoItem("Total Supply", "\$50M")),
              Expanded(child: _buildInfoItem("Tokens Minted", "1.0M")),
            ],
          ),
          const Gap(20),
          Row(
            children: [
              Expanded(child: _buildInfoItem("Claimed", "450k")),
              Expanded(child: _buildInfoItem("Lock-in Time", "3 Years")),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.manrope(
            color: Colors.grey[500],
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
        const Gap(6),
        Text(
          value,
          style: GoogleFonts.manrope(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }

  Widget _buildTradingPanel(double price) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF2A2A2A),
        borderRadius: BorderRadius.circular(32),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Quantity",
                style: GoogleFonts.manrope(
                  color: Colors.grey[400],
                  fontSize: 14,
                ),
              ),
              // Toggle
              Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E1E1E),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    _buildToggleOption("Market", true),
                    _buildToggleOption("Limit", false),
                  ],
                ),
              ),
            ],
          ),
          const Gap(20),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                "24",
                style: GoogleFonts.manrope(
                  color: Colors.white,
                  fontSize: 48,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Gap(8),
              Text(
                "\$${(price * 24).toStringAsFixed(2)}",
                style: GoogleFonts.manrope(
                  color: Colors.grey[500],
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const Spacer(),
              Text(
                "Fee: ~\$8.5",
                style: GoogleFonts.manrope(
                  color: Colors.grey[600],
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const Gap(24),
          Row(
            children: [
              Expanded(
                child: Container(
                  height: 56,
                  decoration: BoxDecoration(
                    color: const Color(0xFF3A3A3A),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    "Sell",
                    style: GoogleFonts.manrope(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
              const Gap(16),
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    // Check if we have a full Bond object to pass
                    if (widget.extra?['bond_object'] != null) {
                      final bond = widget.extra!['bond_object'];
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (context) => InvestBottomSheet(bond: bond),
                      );
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text("Cannot buy: Chart data only"),
                        ),
                      );
                    }
                  },
                  child: Container(
                    height: 56,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      "Buy",
                      style: GoogleFonts.manrope(
                        color: Colors.black,
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildToggleOption(String text, bool isSelected) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isSelected ? Colors.white : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        text,
        style: GoogleFonts.manrope(
          color: isSelected ? Colors.black : Colors.grey[500],
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
