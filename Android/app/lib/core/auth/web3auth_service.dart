import 'package:web3auth_flutter/enums.dart';
import 'package:web3auth_flutter/input.dart';
import 'package:web3auth_flutter/output.dart';
import 'package:web3auth_flutter/web3auth_flutter.dart';

class Web3AuthService {
  final String clientId;
  final Uri redirectUrl;
  final Network network;

  const Web3AuthService({
    required this.clientId,
    required this.redirectUrl,
    this.network = Network.sapphire_devnet,
  });

  Future<void> init() async {
    await Web3AuthFlutter.init(
      Web3AuthOptions(
        clientId: clientId,
        network: network,
        redirectUrl: redirectUrl,
      ),
    );

    try {
      await Web3AuthFlutter.initialize();
    } catch (_) {
      return;
    }
  }

  Future<Web3AuthResponse> loginWithGoogle() async {
    await init();
    try {
      final response = await Web3AuthFlutter.login(
        LoginParams(loginProvider: Provider.google),
      );
      // Check if we got a valid response
      if (response.privKey == null || response.privKey!.isEmpty) {
        throw Exception('Login cancelled or failed');
      }
      return response;
    } catch (e) {
      // Rethrow with a cleaner message for user cancellation
      throw Exception('Login cancelled: ${e.toString()}');
    }
  }

  Future<void> logout() async {
    await init();
    await Web3AuthFlutter.logout();
  }
}
