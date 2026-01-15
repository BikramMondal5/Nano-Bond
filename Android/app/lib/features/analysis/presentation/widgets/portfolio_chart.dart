import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../domain/analysis_data.dart';

class PortfolioChart extends StatefulWidget {
  final List<PortfolioPoint> history;
  final bool isProfit;

  const PortfolioChart({
    super.key,
    required this.history,
    this.isProfit = true,
  });

  @override
  State<PortfolioChart> createState() => _PortfolioChartState();
}

class _PortfolioChartState extends State<PortfolioChart> {
  @override
  Widget build(BuildContext context) {
    if (widget.history.isEmpty) return const SizedBox();

    final color = widget.isProfit ? Colors.green : Colors.red;

    // Normalize data for the chart
    final spots = widget.history.asMap().entries.map((e) {
      return FlSpot(e.key.toDouble(), e.value.value);
    }).toList();

    final minY = widget.history
        .map((e) => e.value)
        .reduce((a, b) => a < b ? a : b);
    final maxY = widget.history
        .map((e) => e.value)
        .reduce((a, b) => a > b ? a : b);
    final range = maxY - minY;

    return LineChart(
      LineChartData(
        gridData: const FlGridData(show: false),
        titlesData: const FlTitlesData(
          show: true,
          rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ), // Hide dates for cleaner look or implement smart hiding
        ),
        borderData: FlBorderData(show: false),
        minX: 0,
        maxX: spots.length.toDouble() - 1,
        minY: minY - (range * 0.1), // Add some padding
        maxY: maxY + (range * 0.1),
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            color: color,
            barWidth: 2,
            isStrokeCapRound: true,
            dotData: const FlDotData(show: false),
            belowBarData: BarAreaData(
              show: true,
              gradient: LinearGradient(
                colors: [
                  color.withValues(alpha: 0.2),
                  color.withValues(alpha: 0.0),
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
        ],
        lineTouchData: LineTouchData(
          // buttonZeroRotation removed
          touchTooltipData: LineTouchTooltipData(
            // tooltipBgColor: Colors.black87,
            getTooltipItems: (List<LineBarSpot> touchedBarSpots) {
              return touchedBarSpots.map((barSpot) {
                final date = widget.history[barSpot.x.toInt()].date;
                // Simple date format without heavy intl dependency inside this loop if possible,
                // but usually fine.
                return LineTooltipItem(
                  "${barSpot.y.toStringAsFixed(2)} USDT\n",
                  const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                  children: [
                    TextSpan(
                      text: "${date.day}/${date.month}",
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.8),
                        fontSize: 12,
                        fontWeight: FontWeight.normal,
                      ),
                    ),
                  ],
                );
              }).toList();
            },
          ),
          handleBuiltInTouches: true,
        ),
      ),
    );
  }
}
