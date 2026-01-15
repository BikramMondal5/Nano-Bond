import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/bond_registry_service.dart';
import '../data/bond_model.dart';

final bondRegistryServiceProvider = Provider((ref) => BondRegistryService());

final bondsProvider = AsyncNotifierProvider<BondsNotifier, List<Bond>>(
  BondsNotifier.new,
);

class BondsNotifier extends AsyncNotifier<List<Bond>> {
  @override
  Future<List<Bond>> build() async {
    final service = ref.read(bondRegistryServiceProvider);
    final list = await service.listBonds();

    // Basic icon mapping
    IconData pickIcon(String issuer) {
      final lower = issuer.toLowerCase();
      if (lower.contains('gov') ||
          lower.contains('treasury') ||
          lower.contains('rbi')) {
        return Icons.account_balance;
      }
      if (lower.contains('green') || lower.contains('energy')) {
        return Icons.eco;
      }
      if (lower.contains('infra') || lower.contains('nhai')) {
        return Icons.add_road;
      }
      return Icons.account_balance_wallet_rounded;
    }

    return list
        .map(
          (b) => Bond(
            bondId: b.bondId,
            title: b.bondName,
            subtitle: b.issuer,
            apy: b.couponRate != null
                ? '${b.couponRate!.toStringAsFixed(2)}% APY'
                : '—',
            minInvestment: 'USDT ${b.minInvestment.toStringAsFixed(0)}',
            icon: pickIcon(b.issuer),
            apyColor: Colors.green,
            proofUrl: b.proofUrl,
            totalSupply: b.totalSupply,
            totalBackedValue: b.totalBackedValue,
            symbol: b.symbol,
            maturityDate: b.maturityDate,
          ),
        )
        .toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => build());
  }
}
