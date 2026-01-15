import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/backend_service.dart';
import '../../auth/presentation/providers.dart';

final portfolioProvider = AsyncNotifierProvider<PortfolioNotifier, double>(
  PortfolioNotifier.new,
);

class PortfolioNotifier extends AsyncNotifier<double> {
  @override
  Future<double> build() async {
    final user = ref.watch(authStateProvider).value;
    if (user == null) return 0.0;

    // Fetch real USDT balance via Backend API (Faucet Service)
    return await BackendService().getUSDTBalance(user.address);
  }

  Future<void> refreshBalance() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => build());
  }
}
