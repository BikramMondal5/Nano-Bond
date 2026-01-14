import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../home/providers/user_portfolio_provider.dart';
import '../../invest/providers/bonds_provider.dart';
import '../domain/analysis_data.dart';
import '../../../../core/services/backend_service.dart';
import '../../auth/presentation/providers.dart';

part 'analysis_provider.g.dart';

@riverpod
Future<AnalysisData> analysisData(Ref ref) async {
  final portfolio = await ref.watch(userPortfolioProvider.future);
  final allBonds = await ref.watch(bondsProvider.future);
  final user = ref.watch(authStateProvider).valueOrNull;

  final holdings = portfolio.holdings.map((holding) {
    // Find detailed bond info if available
    final bondDetails = allBonds
        .where((b) => b.bondId == holding.bondId)
        .firstOrNull;

    return AssetHolding(
      name: holding.bondName,
      ticker: holding.bondId,
      quantity: holding.balance, // Assuming balance is unit quantity
      averagePrice: 100.0, // Default face value if purchase price is unknown
      currentPrice: (holding.balance > 0)
          ? (holding.value / holding.balance)
          : 100.0,
      type:
          bondDetails?.subtitle.split('•').firstOrNull?.trim() ??
          "Bond", // Heuristic from subtitle
      proofUrl: bondDetails?.proofUrl,
      apy: holding.apy,
      maturityDate: DateTime.tryParse(
        holding.maturityDate,
      ), // Try parsing ISO string
    );
  }).toList();

  // Fetch liquid USDT balance if user is logged in
  if (user != null) {
    try {
      final usdtBalance = await BackendService().getUSDTBalance(user.address);
      if (usdtBalance > 0) {
        holdings.add(
          AssetHolding(
            name: "Mantle USDT",
            ticker: "USDT",
            quantity: usdtBalance,
            averagePrice: 1.0,
            currentPrice: 1.0,
            type: "Liquid Cash",
            apy: 0.0,
            proofUrl: null, // No proof for wallet balance
          ),
        );
      }
    } catch (e) {
      // Ignore error fetching balance, just don't add it
    }
  }

  // Calculate totals
  final totalInvested = holdings
      .where((h) => h.type != "Liquid Cash")
      .fold(0.0, (sum, item) => sum + item.investedValue);
  final walletBalance = holdings
      .where((h) => h.type == "Liquid Cash")
      .fold(0.0, (sum, item) => sum + item.currentValue);

  // Total Net Worth = Bond Value + Wallet Balance
  // Note: portfolio.totalValue only includes bonds usually, so we add walletBalance
  final currentValue = portfolio.totalValue + walletBalance;

  // Returns is calculated only on investments
  final totalReturns = portfolio.totalValue - totalInvested;
  final returnsPercentage = (totalInvested > 0)
      ? (totalReturns / totalInvested) * 100
      : 0.0;

  // Real history not available yet, mock a flat line or simple projection for now
  final history = <PortfolioPoint>[
    PortfolioPoint(
      DateTime.now().subtract(const Duration(days: 1)),
      currentValue,
    ),
    PortfolioPoint(DateTime.now(), currentValue),
  ];

  return AnalysisData(
    totalInvested: totalInvested,
    currentValue: currentValue,
    totalReturns: totalReturns,
    returnsPercentage: returnsPercentage,
    history: history,
    holdings: holdings,
  );
}
