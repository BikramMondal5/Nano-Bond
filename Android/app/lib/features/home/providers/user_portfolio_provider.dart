import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/backend_service.dart';
import '../../auth/presentation/providers.dart';

class PortfolioModel {
  final double totalValue;
  final double walletBalance; // NEW: USDT Balance
  final double? pendingYield; // NEW: Claimable Yield (Nullable for safety)
  final String currency;
  final double averageApy;
  final DateTime? nextMaturityDate;
  final List<PortfolioHolding> holdings;

  PortfolioModel({
    required this.totalValue,
    required this.walletBalance,
    this.pendingYield,
    required this.currency,
    required this.averageApy,
    this.nextMaturityDate,
    required this.holdings,
  });

  factory PortfolioModel.fromJson(Map<String, dynamic> json) {
    return PortfolioModel(
      totalValue: _parseDouble(json['totalValue']),
      walletBalance: _parseDouble(json['walletBalance']),
      pendingYield: _parseDouble(json['pendingYield']),
      currency: json['currency'] as String? ?? 'USDT',
      averageApy: _parseDouble(json['averageApy']),
      nextMaturityDate: json['nextMaturityDate'] != null
          ? DateTime.tryParse(json['nextMaturityDate'])
          : null,
      holdings:
          (json['holdings'] as List<dynamic>?)
              ?.map((e) => PortfolioHolding.fromJson(e))
              .where(
                (h) => h.value > 0.0001,
              ) // Lower threshold to capture small balances
              .toList() ??
          [],
    );
  }

  static double _parseDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0.0;
  }

  factory PortfolioModel.empty() {
    return PortfolioModel(
      totalValue: 0.0,
      walletBalance: 0.0,
      pendingYield: 0.0,
      currency: 'USDT',
      averageApy: 0.0,
      holdings: [],
    );
  }
}

class PortfolioHolding {
  final String bondId;
  final String bondName;
  final double balance;
  final double value;
  final double apy;
  final String maturityDate;
  final String? proofUrl;

  PortfolioHolding({
    required this.bondId,
    required this.bondName,
    required this.balance,
    required this.value,
    required this.apy,
    required this.maturityDate,
    this.proofUrl,
  });

  factory PortfolioHolding.fromJson(Map<String, dynamic> json) {
    return PortfolioHolding(
      bondId: json['bondId'] as String? ?? '',
      bondName: json['bondName'] as String? ?? 'Unknown Bond',
      balance: PortfolioModel._parseDouble(json['balance']),
      value: PortfolioModel._parseDouble(json['value']),
      apy: PortfolioModel._parseDouble(json['apy']),
      maturityDate: json['maturityDate'] as String? ?? '',
      proofUrl: json['proofUrl'] as String?,
    );
  }
}

final userPortfolioProvider =
    AsyncNotifierProvider<UserPortfolioNotifier, PortfolioModel>(
      UserPortfolioNotifier.new,
    );

class UserPortfolioNotifier extends AsyncNotifier<PortfolioModel> {
  @override
  Future<PortfolioModel> build() async {
    final user = ref.watch(authStateProvider).valueOrNull;
    if (user == null) return PortfolioModel.empty();

    final backend = BackendService();
    // Parallel fetch: Portfolio (Bonds) + Wallet (Usdt)
    final results = await Future.wait([
      backend.getPortfolio(user.address),
      backend.getUSDTBalance(user.address),
    ]);

    final portfolio = results[0] as PortfolioModel;
    final usdtBalance = results[1] as double;

    return PortfolioModel(
      totalValue: portfolio.totalValue,
      walletBalance: usdtBalance, // Injected
      pendingYield: portfolio.pendingYield,
      currency: portfolio.currency,
      averageApy: portfolio.averageApy,
      nextMaturityDate: portfolio.nextMaturityDate,
      holdings: portfolio.holdings,
    );
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => build());
  }
}
