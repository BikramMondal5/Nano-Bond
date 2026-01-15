import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/backend_service.dart';
import '../../auth/presentation/providers.dart';

enum TransactionType { invest, deposit, withdraw, claim }

class TransactionModel {
  final TransactionType type;
  final double amount;
  final DateTime date;
  final String title;
  final String subtitle;
  final String? txHash;

  TransactionModel({
    required this.type,
    required this.amount,
    required this.date,
    required this.title,
    required this.subtitle,
    this.txHash,
  });

  // Create from Backend JSON
  factory TransactionModel.fromBackend(Map<String, dynamic> json) {
    // Map backend type string to Enum
    final backendType = json['type']?.toString().toUpperCase() ?? 'UNKNOWN';
    TransactionType type;
    switch (backendType) {
      case 'DEPOSIT':
        type = TransactionType.deposit;
        break;
      case 'INVEST':
      case 'INVESTMENT':
        type = TransactionType.invest;
        break;
      case 'WITHDRAW':
      case 'REDEEM':
        type = TransactionType.withdraw; // Redeem bonds = Withdraw principal
        break;
      case 'COUPON':
      case 'CLAIM':
        type = TransactionType.claim;
        break;
      case 'FAUCET':
        type = TransactionType.deposit; // Faucet is a deposit
        break;
      default:
        type = TransactionType.deposit; // Fallback
    }

    // Map fields
    final asset = json['asset'] ?? 'USDT';
    final details = json['details'] ?? '';

    // Try to find hash in common fields
    String hash = '';
    if (json['txHash'] != null) {
      hash = json['txHash'].toString();
    } else if (json['hash'] != null) {
      hash = json['hash'].toString();
    } else if (json['transactionHash'] != null) {
      hash = json['transactionHash'].toString();
    } else if (json['id'] != null) {
      hash = json['id'].toString();
    } else if (json['_id'] != null) {
      hash = json['_id'].toString();
    }

    String title;
    switch (type) {
      case TransactionType.invest:
        title = "Investment";
        break;
      case TransactionType.withdraw:
        title = "Redemption";
        break;
      case TransactionType.claim:
        title = "Yield Claim";
        break;
      case TransactionType.deposit:
        title = "Deposit";
    }

    return TransactionModel(
      type: type,
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      date: DateTime.tryParse(json['timestamp'].toString()) ?? DateTime.now(),
      title: title,
      subtitle: details.isNotEmpty ? details.toString() : "$asset Transaction",
      txHash: hash,
    );
  }
}

final investmentProvider =
    AsyncNotifierProvider<InvestmentNotifier, List<TransactionModel>>(
      InvestmentNotifier.new,
    );

class InvestmentNotifier extends AsyncNotifier<List<TransactionModel>> {
  @override
  Future<List<TransactionModel>> build() async {
    final user = ref.watch(authStateProvider).value;
    if (user == null) return [];

    return _fetchHistory(user.address);
  }

  Future<List<TransactionModel>> _fetchHistory(String address) async {
    final rawHistory = await BackendService().getHistory(address);
    return rawHistory.map((e) => TransactionModel.fromBackend(e)).toList();
  }

  Future<void> refresh() async {
    final user = ref.read(authStateProvider).value;
    if (user == null) return;

    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async => _fetchHistory(user.address));
  }
}
