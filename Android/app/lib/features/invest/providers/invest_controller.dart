import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/backend_service.dart';
import '../../../../core/services/kyc_service.dart';
import '../../auth/presentation/providers.dart';
import '../../home/providers/portfolio_provider.dart';
import '../../home/providers/user_portfolio_provider.dart';
import 'investment_provider.dart';
import 'dart:math';
import '../../auth/data/auth_repository.dart';

enum InvestStatus { initial, loading, success }

class InvestState {
  final InvestStatus status;
  final String message;
  final String? txHash;

  const InvestState({required this.status, required this.message, this.txHash});

  factory InvestState.initial() =>
      const InvestState(status: InvestStatus.initial, message: '');
}

final investControllerProvider =
    NotifierProvider<InvestController, InvestState>(InvestController.new);

class InvestController extends Notifier<InvestState> {
  @override
  InvestState build() {
    return InvestState.initial();
  }

  void reset() {
    state = InvestState.initial();
  }

  Future<void> invest(double amount, {String bondId = 'GOI-2030'}) async {
    state = const InvestState(
      status: InvestStatus.loading,
      message: "Processing Investment...",
    );

    try {
      final user = ref.read(authStateProvider).value;
      if (user == null) {
        throw Exception("User session invalid. Please re-login.");
      }

      // KYC (IdentityRegistry registration) is required to receive GBOND
      state = const InvestState(
        status: InvestStatus.loading,
        message: "Verifying KYC...",
      );
      try {
        await KycService().requestRegistration(address: user.address);
      } catch (_) {
        // Non-fatal: if already verified or server not configured, chain tx may still succeed.
      }

      // Invest via Backend (Gasless)
      state = const InvestState(
        status: InvestStatus.loading,
        message: "Transferring Funds...",
      );

      // 1. Prepare Request Data
      final requestId =
          '${DateTime.now().millisecondsSinceEpoch}-${Random().nextInt(100000)}';
      final timestamp = DateTime.now().millisecondsSinceEpoch;

      // 2. Sign Message (Security)
      final privateKey = user.privateKey;
      if (privateKey == null || privateKey.isEmpty) {
        throw Exception(
          "Session invalid (Missing Signing Key). Please re-login.",
        );
      }

      // Payload: INVEST:${address}:${amount}:${bondId}:${requestId}:${timestamp}
      final payload =
          "INVEST:${user.address}:$amount:$bondId:$requestId:$timestamp";
      final signature = AuthRepository().signMessage(privateKey, payload);

      // 3. Call Backend with Signature
      final result = await BackendService().invest(
        address: user.address,
        amount: amount,
        bondId: bondId,
        requestId: requestId,
        timestamp: timestamp,
        signature: signature,
      );

      final txHash = result['txHash'] as String;
      final newBalance = result['newBalance'];

      if (newBalance != null && newBalance is num) {
        // Optimistic Update
        ref
            .read(userPortfolioProvider.notifier)
            .updateOptimisticBalance(newBalance.toDouble());
      }

      state = const InvestState(
        status: InvestStatus.loading,
        message: "Confirming on Blockchain...",
      );

      // Refresh Portfolio after a short delay to ensure backend has processed it
      await Future.delayed(const Duration(seconds: 2));

      // Force complete refresh by invalidating the provider
      ref.invalidate(portfolioProvider);
      ref.invalidate(userPortfolioProvider);

      // Refresh History
      ref.invalidate(investmentProvider);

      state = InvestState(
        status: InvestStatus.success,
        message: "Investment Successful!",
        txHash: txHash,
      );
    } catch (e) {
      state = InvestState(
        status: InvestStatus.initial, // Reset status
        message: "Failed: ${e.toString()}",
      );
      // Log/Show error to user via other means if needed
    }
  }
}
