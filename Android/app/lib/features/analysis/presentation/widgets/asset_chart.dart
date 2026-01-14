import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

class AssetChart extends StatelessWidget {
  final List<double> history;

  const AssetChart({super.key, required this.history});

  @override
  Widget build(BuildContext context) {
    if (history.isEmpty) return const SizedBox();

    final spots = history.asMap().entries.map((e) {
      return FlSpot(e.key.toDouble(), e.value);
    }).toList();

    final minY = history.reduce((a, b) => a < b ? a : b);
    final maxY = history.reduce((a, b) => a > b ? a : b);
    final range = maxY - minY;

    return LineChart(
      LineChartData(
        gridData: const FlGridData(show: false),
        titlesData: const FlTitlesData(show: false),
        borderData: FlBorderData(show: false),
        minY: minY - (range * 0.1),
        maxY: maxY + (range * 0.1),
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            color: Colors.white,
            barWidth: 3,
            isStrokeCapRound: true,
            dotData: const FlDotData(show: false),
            belowBarData: BarAreaData(show: false),
          ),
        ],
        lineTouchData: LineTouchData(
          handleBuiltInTouches: true,
          getTouchedSpotIndicator:
              (LineChartBarData barData, List<int> spotIndexes) {
                return spotIndexes.map((spotIndex) {
                  return TouchedSpotIndicatorData(
                    FlLine(
                      color: Colors.white.withValues(alpha: 0.5),
                      strokeWidth: 2,
                    ),
                    FlDotData(
                      getDotPainter: (spot, percent, barData, index) {
                        return FlDotCirclePainter(
                          radius: 6,
                          color: Colors.white,
                          strokeWidth: 2,
                          strokeColor: Colors.deepPurple,
                        );
                      },
                    ),
                  );
                }).toList();
              },
          touchTooltipData: LineTouchTooltipData(
            // Removed tooltipBgColor to use default or safe implicit value
            getTooltipItems: (List<LineBarSpot> touchedBarSpots) {
              return touchedBarSpots.map((barSpot) {
                return LineTooltipItem(
                  barSpot.y.toStringAsFixed(2),
                  const TextStyle(
                    color: Colors.deepPurple,
                    fontWeight: FontWeight.bold,
                  ),
                );
              }).toList();
            },
          ),
        ),
      ),
    );
  }
}
