import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import '../../domain/analysis_data.dart';
import 'package:google_fonts/google_fonts.dart';

class HoldingsPieChart extends StatefulWidget {
  final List<AssetHolding> holdings;

  const HoldingsPieChart({super.key, required this.holdings});

  @override
  State<HoldingsPieChart> createState() => _HoldingsPieChartState();
}

class _HoldingsPieChartState extends State<HoldingsPieChart> {
  int touchedIndex = -1;

  @override
  Widget build(BuildContext context) {
    // If no holdings, show empty state (handled by parent typically, but safe guard here)
    if (widget.holdings.isEmpty) return const SizedBox();

    // Calculate total value for percentages
    final double totalValue = widget.holdings.fold(
      0,
      (sum, item) => sum + item.currentValue,
    );

    return Column(
      children: [
        SizedBox(
          height: 200,
          child: PieChart(
            PieChartData(
              pieTouchData: PieTouchData(
                touchCallback: (FlTouchEvent event, pieTouchResponse) {
                  setState(() {
                    if (!event.isInterestedForInteractions ||
                        pieTouchResponse == null ||
                        pieTouchResponse.touchedSection == null) {
                      touchedIndex = -1;
                      return;
                    }
                    touchedIndex =
                        pieTouchResponse.touchedSection!.touchedSectionIndex;
                  });
                },
              ),
              borderData: FlBorderData(show: false),
              sectionsSpace: 2,
              centerSpaceRadius: 40,
              sections: _generateSections(totalValue),
            ),
          ),
        ),
        const SizedBox(height: 20),
        // Legend
        Wrap(
          spacing: 16,
          runSpacing: 8,
          alignment: WrapAlignment.center,
          children: widget.holdings.asMap().entries.map((entry) {
            final index = entry.key;
            final item = entry.value;
            final isTouched = index == touchedIndex;
            final color = _getColor(index);

            return Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: color,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  item.ticker,
                  style: GoogleFonts.manrope(
                    fontSize: 12,
                    fontWeight: isTouched ? FontWeight.bold : FontWeight.normal,
                    color: Colors.black87,
                  ),
                ),
              ],
            );
          }).toList(),
        ),
      ],
    );
  }

  List<PieChartSectionData> _generateSections(double totalValue) {
    return List.generate(widget.holdings.length, (i) {
      final isTouched = i == touchedIndex;
      final item = widget.holdings[i];
      final double percentage = (totalValue > 0)
          ? (item.currentValue / totalValue) * 100
          : 0;
      final fontSize = isTouched
          ? 16.0
          : 0.0; // Hide text unless touched for cleaner look
      final radius = isTouched ? 60.0 : 50.0;
      final color = _getColor(i);

      return PieChartSectionData(
        color: color,
        value: item.currentValue,
        title: '${percentage.toStringAsFixed(1)}%',
        radius: radius,
        titleStyle: GoogleFonts.manrope(
          fontSize: fontSize,
          fontWeight: FontWeight.bold,
          color: Colors.white,
          shadows: [const Shadow(color: Colors.black26, blurRadius: 2)],
        ),
        badgeWidget: isTouched ? _buildTooltip(item) : null,
        badgePositionPercentageOffset: .98,
      );
    });
  }

  Widget _buildTooltip(AssetHolding item) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black87,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        "${item.ticker}: ${item.currentValue.toStringAsFixed(2)} USDT",
        style: const TextStyle(color: Colors.white, fontSize: 10),
      ),
    );
  }

  Color _getColor(int index) {
    // Generate a palette based on index
    const colors = [
      Color(0xFF2E7D32), // Green
      Color(0xFF1565C0), // Blue
      Color(0xFFF9A825), // Yellow/Orange
      Color(0xFF6A1B9A), // Purple
      Color(0xFF00838F), // Teal
      Color(0xFFAD1457), // Pink
      Color(0xFF424242), // Grey
    ];
    return colors[index % colors.length];
  }
}
