import 'package:http/http.dart';
import 'package:web3dart/web3dart.dart';
import 'package:flutter/foundation.dart';

void main() async {
  const rpcUrl = 'https://rpc-amoy.polygon.technology';
  const usdcContractAddress = '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582';
  final address = '0xAA27B5C01824e99C59aDBbb12203879F2E04Ea81';

  debugPrint('LOG: Starting debug script...');
  debugPrint('LOG: RPC URL: $rpcUrl');
  debugPrint('LOG: Contract: $usdcContractAddress');
  debugPrint('LOG: Address: $address');

  final client = Web3Client(rpcUrl, Client());

  final abi = '''
      [
        {
          "constant": true,
          "inputs": [{"name": "_owner", "type": "address"}],
          "name": "balanceOf",
          "outputs": [{"name": "balance", "type": "uint256"}],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        },
        {
          "constant": true,
          "inputs": [],
          "name": "decimals",
          "outputs": [{"name": "", "type": "uint8"}],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        }
      ]
    ''';

  try {
    debugPrint('LOG: Creating contract...');
    final contract = DeployedContract(
      ContractAbi.fromJson(abi, 'USDC'),
      EthereumAddress.fromHex(usdcContractAddress),
    );

    final balanceFunction = contract.function('balanceOf');
    final decimalsFunction = contract.function('decimals');

    debugPrint('LOG: Calling balanceOf...');
    final balanceResult = await client.call(
      contract: contract,
      function: balanceFunction,
      params: [EthereumAddress.fromHex(address.toLowerCase())],
    );
    debugPrint('LOG: balanceResult: $balanceResult');

    debugPrint('LOG: Calling decimals...');
    final decimalsResult = await client.call(
      contract: contract,
      function: decimalsFunction,
      params: [],
    );
    debugPrint('LOG: decimalsResult: $decimalsResult');

    if (balanceResult.isEmpty) {
      debugPrint('LOG: Error: Balance result is empty');
      return;
    }

    final rawBalance = balanceResult.first as BigInt;
    final decimals = decimalsResult.isNotEmpty
        ? decimalsResult.first as BigInt
        : BigInt.from(18);

    debugPrint('LOG: Raw Balance: $rawBalance');
    debugPrint('LOG: Decimals: $decimals');

    final balance = rawBalance / BigInt.from(10).pow(decimals.toInt());
    debugPrint('LOG: Calculated Balance: $balance');
  } catch (e, st) {
    debugPrint('LOG: EXCEPTION: $e');
    debugPrint(st.toString());
  } finally {
    await client.dispose();
    debugPrint('LOG: Client disposed.');
  }
}
