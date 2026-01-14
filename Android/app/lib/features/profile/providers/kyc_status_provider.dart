import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/backend_service.dart';
import '../../auth/presentation/providers.dart';

/// Provider that checks KYC verification status directly from the backend.
/// This ensures the badge only shows for users verified on-chain.
final kycStatusProvider = FutureProvider<bool>((ref) async {
  final user = ref.watch(authStateProvider).valueOrNull;
  if (user == null) return false;

  return await BackendService().checkKycStatus(user.address);
});
