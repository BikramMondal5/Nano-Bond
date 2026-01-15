class AnalysisData {
  final double totalInvested;
  final double currentValue;
  final double totalReturns;
  final double returnsPercentage;
  final List<PortfolioPoint> history;
  final List<AssetHolding> holdings;

  AnalysisData({
    required this.totalInvested,
    required this.currentValue,
    required this.totalReturns,
    required this.returnsPercentage,
    required this.history,
    required this.holdings,
  });
}

class PortfolioPoint {
  final DateTime date;
  final double value;

  PortfolioPoint(this.date, this.value);
}

class AssetHolding {
  final String name;
  final String ticker;
  final double quantity; // bondTokenLeft
  final double averagePrice;
  final double currentPrice;
  final String type;
  final String? proofUrl;
  final double apy;
  final DateTime? maturityDate;

  AssetHolding({
    required this.name,
    required this.ticker,
    required this.quantity,
    required this.averagePrice,
    required this.currentPrice,
    required this.type,
    this.proofUrl,
    required this.apy,
    this.maturityDate,
  });

  double get investedValue => quantity * averagePrice;
  double get currentValue => quantity * currentPrice;
  double get returns => currentValue - investedValue;
  double get returnsPercentage =>
      (investedValue > 0) ? (returns / investedValue) * 100 : 0.0;

  double get monthlyYield => (investedValue * (apy / 100)) / 12;

  // Approx Future Value at maturity (Simple Interest approximation)
  double get futureValue {
    if (maturityDate == null) return currentValue;
    final now = DateTime.now();
    if (maturityDate!.isBefore(now)) return currentValue;
    final days = maturityDate!.difference(now).inDays;
    final years = days / 365.0;
    return investedValue * (1 + (apy / 100) * years);
  }

  String get investmentPeriod {
    if (maturityDate == null) return "N/A";
    final now = DateTime.now();
    if (maturityDate!.isBefore(now)) return "Matured";
    final days = maturityDate!.difference(now).inDays;
    final years = (days / 365).floor();
    final remainingDays = days % 365;
    if (years > 0) {
      return "$years years $remainingDays days left";
    }
    return "$days days left";
  }
}
