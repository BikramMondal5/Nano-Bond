import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart';
import 'package:web3dart/web3dart.dart';

void main() {
  test('Debug USDC Balance Fetch Isolated', () async {
    const rpcUrl = 'https://rpc-amoy.polygon.technology';
    const usdcContractAddress = '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582';
    // const address = '0xAA27B5C01824e99C59aDBbb12203879F2E04Ea81';
    // Use the checksummed address from PolygonScan just in case, though it shouldn't matter
    final address = '0xAA27B5C01824e99C59aDBbb12203879F2E04Ea81';

    debugPrint('Checking RPC connectivity...');
    try {
      final response = await post(
        Uri.parse(rpcUrl),
        body: '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}',
        headers: {'Content-Type': 'application/json'},
      );
      debugPrint('RPC Response Code: ${response.statusCode}');
      debugPrint('RPC Response Body: ${response.body}');
    } catch (e) {
      debugPrint('RPC Connection Failed: $e');
    }

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
      debugPrint('Creating contract...');
      final contract = DeployedContract(
        ContractAbi.fromJson(abi, 'USDC'),
        EthereumAddress.fromHex(usdcContractAddress),
      );

      final balanceFunction = contract.function('balanceOf');
      final decimalsFunction = contract.function('decimals');

      debugPrint('Calling balanceOf for $address...');
      final balanceResult = await client.call(
        contract: contract,
        function: balanceFunction,
        params: [EthereumAddress.fromHex(address)],
      );
      debugPrint('balanceResult: $balanceResult');

      debugPrint('Calling decimals...');
      final decimalsResult = await client.call(
        contract: contract,
        function: decimalsFunction,
        params: [],
      );
      debugPrint('decimalsResult: $decimalsResult');

      if (balanceResult.isEmpty) {
        debugPrint('Error: Balance result is empty');
        return;
      }

      final BigInt rawBalance = balanceResult.first as BigInt;
      final BigInt decimals = decimalsResult.isNotEmpty
          ? decimalsResult.first as BigInt
          : BigInt.from(18);

      debugPrint('Raw Balance: $rawBalance');
      debugPrint('Decimals: $decimals');

      final balance = rawBalance / BigInt.from(10).pow(decimals.toInt());
      debugPrint('Calculated Balance: $balance');
    } catch (e, st) {
      debugPrint('EXCEPTION: $e');
      debugPrint(st.toString());
    } finally {
      client.dispose();
    }
  });
}
