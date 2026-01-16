import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/backend_service.dart';
import '../../auth/presentation/providers.dart';

/// The Identity Registry contract address on Mantle Sepolia
/// This is where user verification tokens (SBTs) are stored on-chain
const String kIdentityRegistryAddress =
    '0xA6E2f0948b06B0Aed66050f69448c469A1762a65';

/// Block explorer URL for Mantle Sepolia testnet
const String kBlockExplorerUrl = 'https://explorer.sepolia.mantle.xyz';

/// Data class containing KYC verification info
class KycVerificationData {
  final bool isVerified;
  final String? registryAddress;
  final String? explorerUrl;

  const KycVerificationData({
    required this.isVerified,
    this.registryAddress,
    this.explorerUrl,
  });

  /// Get the block explorer URL for the identity registry token page
  String? get tokenExplorerUrl {
    if (!isVerified || registryAddress == null) return null;
    return '$kBlockExplorerUrl/address/$registryAddress';
  }
}

/// Provider that checks KYC verification status directly from the backend.
/// This ensures the badge only shows for users verified on-chain.
final kycStatusProvider = FutureProvider<bool>((ref) async {
  final user = ref.watch(authStateProvider).value;
  if (user == null) return false;

  return await BackendService().checkKycStatus(user.address);
});

/// Provider that returns full KYC verification data including registry address
/// for block explorer linking.
final kycVerificationDataProvider = FutureProvider<KycVerificationData>((
  ref,
) async {
  final user = ref.watch(authStateProvider).value;
  if (user == null) {
    return const KycVerificationData(isVerified: false);
  }

  final isVerified = await BackendService().checkKycStatus(user.address);

  return KycVerificationData(
    isVerified: isVerified,
    registryAddress: isVerified ? kIdentityRegistryAddress : null,
    explorerUrl: isVerified ? kBlockExplorerUrl : null,
  );
});
