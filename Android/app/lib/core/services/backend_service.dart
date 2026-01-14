import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import '../../features/home/providers/user_portfolio_provider.dart';

/// Service to communicate with the backend API
class BackendService {
  String get _baseUrl {
    final v = dotenv.env['API_BASE_URL'] ?? '';
    return v.endsWith('/') ? v.substring(0, v.length - 1) : v;
  }

  String? get _apiKey {
    final v = dotenv.env['KYC_API_KEY'];
    if (v == null || v.trim().isEmpty) return null;
    return v.trim();
  }

  /// Get debt monitor status
  Future<DebtMonitorStatus> getDebtStatus() async {
    if (_baseUrl.isEmpty) {
      throw Exception('Missing API_BASE_URL in .env');
    }

    try {
      final uri = Uri.parse('$_baseUrl/api/debt/status');
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (_apiKey != null) {
        headers['x-api-key'] = _apiKey!;
      }

      final res = await http.get(uri, headers: headers);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        final decoded = jsonDecode(res.body);
        return DebtMonitorStatus.fromJson(decoded);
      } else {
        debugPrint('Debt status failed: ${res.statusCode} ${res.body}');
        throw Exception('Failed to fetch debt status');
      }
    } catch (e) {
      debugPrint('Error fetching debt status: $e');
      rethrow;
    }
  }

  /// Check KYC verification status
  Future<bool> checkKycStatus(String address) async {
    if (_baseUrl.isEmpty) return false;

    try {
      final uri = Uri.parse('$_baseUrl/api/kyc/status/$address');
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (_apiKey != null) {
        headers['x-api-key'] = _apiKey!;
      }

      final res = await http.get(uri, headers: headers);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        final decoded = jsonDecode(res.body);
        return decoded['isVerified'] == true;
      }
      return false;
    } catch (e) {
      debugPrint('Error checking KYC status: $e');
      return false;
    }
  }

  /// Trigger yield distribution (admin function)
  Future<YieldDistributionResult> distributeYield({
    required double amount,
  }) async {
    if (_baseUrl.isEmpty) {
      throw Exception('Missing API_BASE_URL in .env');
    }

    try {
      final uri = Uri.parse('$_baseUrl/api/admin/distribute-yield');
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (_apiKey != null) {
        headers['x-api-key'] = _apiKey!;
      }

      final res = await http.post(
        uri,
        headers: headers,
        body: jsonEncode({'amount': amount}),
      );

      if (res.statusCode >= 200 && res.statusCode < 300) {
        final decoded = jsonDecode(res.body);
        return YieldDistributionResult.fromJson(decoded);
      } else {
        debugPrint('Yield distribution failed: ${res.statusCode} ${res.body}');
        throw Exception('Failed to distribute yield');
      }
    } catch (e) {
      debugPrint('Error distributing yield: $e');
      rethrow;
    }
  }

  /// Get bond information
  Future<BondInfo> getBondInfo(String bondAddress) async {
    if (_baseUrl.isEmpty) {
      throw Exception('Missing API_BASE_URL in .env');
    }

    try {
      final uri = Uri.parse('$_baseUrl/api/bonds/$bondAddress');
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (_apiKey != null) {
        headers['x-api-key'] = _apiKey!;
      }

      final res = await http.get(uri, headers: headers);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        final decoded = jsonDecode(res.body);
        return BondInfo.fromJson(decoded);
      } else {
        debugPrint('Bond info failed: ${res.statusCode} ${res.body}');
        throw Exception('Failed to fetch bond info');
      }
    } catch (e) {
      debugPrint('Error fetching bond info: $e');
      rethrow;
    }
  }

  /// Invest in bond (gasless via backend)
  Future<String> invest({
    required String address,
    required double amount,
    String bondId = 'GOI-2030',
  }) async {
    if (_baseUrl.isEmpty) {
      throw Exception('Missing API_BASE_URL in .env');
    }

    try {
      final uri = Uri.parse('$_baseUrl/api/invest');
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (_apiKey != null) {
        headers['x-api-key'] = _apiKey!;
      }

      final res = await http.post(
        uri,
        headers: headers,
        body: jsonEncode({
          'address': address,
          'amount': amount,
          'bondId': bondId,
        }),
      );

      if (res.statusCode >= 200 && res.statusCode < 300) {
        final decoded = jsonDecode(res.body);
        if (decoded['success'] == true) {
          return decoded['txHash'] ?? '';
        } else {
          throw Exception(decoded['error'] ?? 'Investment failed');
        }
      } else {
        debugPrint('Investment failed: ${res.statusCode} ${res.body}');
        // Try to parse error message from body
        try {
          final decoded = jsonDecode(res.body);
          throw Exception(decoded['error'] ?? 'Investment failed');
        } catch (_) {
          throw Exception('Investment failed: ${res.statusCode}');
        }
      }
    } catch (e) {
      debugPrint('Error processing investment: $e');
      rethrow;
    }
  }

  /// Get user portfolio summary
  Future<PortfolioModel> getPortfolio(String address) async {
    if (_baseUrl.isEmpty) {
      throw Exception('Missing API_BASE_URL in .env');
    }

    try {
      final uri = Uri.parse('$_baseUrl/api/portfolio/$address');
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (_apiKey != null) {
        headers['x-api-key'] = _apiKey!;
      }

      final res = await http.get(uri, headers: headers);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        final decoded = jsonDecode(res.body);
        return PortfolioModel.fromJson(decoded);
      } else {
        debugPrint('Portfolio fetch failed: ${res.statusCode} ${res.body}');
        throw Exception('Failed to fetch portfolio');
      }
    } catch (e) {
      debugPrint('Error fetching portfolio: $e');
      return PortfolioModel.empty();
    }
  }

  /// Get transaction history
  Future<List<Map<String, dynamic>>> getHistory(String address) async {
    if (_baseUrl.isEmpty) {
      throw Exception('Missing API_BASE_URL in .env');
    }

    try {
      final uri = Uri.parse('$_baseUrl/api/history/$address');
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (_apiKey != null) {
        headers['x-api-key'] = _apiKey!;
      }

      final res = await http.get(uri, headers: headers);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        final decoded = jsonDecode(res.body);
        final list = decoded['history'] as List;
        return list.cast<Map<String, dynamic>>();
      } else {
        debugPrint('History fetch failed: ${res.statusCode} ${res.body}');
        return [];
      }
    } catch (e) {
      debugPrint('Error fetching history: $e');
      return [];
    }
  }

  /// Claim from USDT Faucet
  Future<String> claimFaucet({
    required String address,
    required double amount,
  }) async {
    if (_baseUrl.isEmpty) {
      throw Exception('Missing API_BASE_URL in .env');
    }

    try {
      final uri = Uri.parse('$_baseUrl/api/faucet/usdt');
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (_apiKey != null) {
        headers['x-api-key'] = _apiKey!;
      }

      final res = await http.post(
        uri,
        headers: headers,
        body: jsonEncode({'address': address, 'amount': amount}),
      );

      if (res.statusCode >= 200 && res.statusCode < 300) {
        final decoded = jsonDecode(res.body);
        if (decoded['success'] == true) {
          return decoded['txHash'] ?? '';
        } else {
          throw Exception(decoded['error'] ?? 'Faucet claim failed');
        }
      } else {
        debugPrint('Faucet claim failed: ${res.statusCode} ${res.body}');
        try {
          final decoded = jsonDecode(res.body);
          throw Exception(decoded['error'] ?? 'Faucet claim failed');
        } catch (_) {
          throw Exception('Faucet claim failed: ${res.statusCode}');
        }
      }
    } catch (e) {
      debugPrint('Error claiming from faucet: $e');
      rethrow;
    }
  }

  /// Get USDT Balance from Faucet API
  Future<double> getUSDTBalance(String address) async {
    if (_baseUrl.isEmpty) {
      throw Exception('Missing API_BASE_URL in .env');
    }

    try {
      final uri = Uri.parse('$_baseUrl/api/faucet/balance/$address');
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (_apiKey != null) {
        headers['x-api-key'] = _apiKey!;
      }

      final res = await http.get(uri, headers: headers);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        final decoded = jsonDecode(res.body);
        return (decoded['balance'] as num).toDouble();
      } else {
        debugPrint('Balance fetch failed: ${res.statusCode} ${res.body}');
        return 0.0;
      }
    } catch (e) {
      debugPrint('Error fetching balance: $e');
      return 0.0;
    }
  }

  /// Get Faucet Usage Stats (for rate limit display)
  Future<Map<String, dynamic>> getFaucetUsage(String address) async {
    if (_baseUrl.isEmpty) {
      throw Exception('Missing API_BASE_URL in .env');
    }

    try {
      final uri = Uri.parse('$_baseUrl/api/faucet/usage/$address');
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (_apiKey != null) {
        headers['x-api-key'] = _apiKey!;
      }

      final res = await http.get(uri, headers: headers);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        return jsonDecode(res.body);
      } else {
        debugPrint('Faucet usage fetch failed: ${res.statusCode} ${res.body}');
        return {'claimed': 0, 'limit': 10000, 'remaining': 10000};
      }
    } catch (e) {
      debugPrint('Error fetching faucet usage: $e');
      return {'claimed': 0, 'limit': 10000, 'remaining': 10000};
    }
  }

  /// Redeem bonds (gasless via backend)
  Future<String> redeem({
    required String address,
    required double bondAmount,
    String bondId = 'GOI-2030',
  }) async {
    if (_baseUrl.isEmpty) {
      throw Exception('Missing API_BASE_URL in .env');
    }

    try {
      final uri = Uri.parse('$_baseUrl/api/redeem');
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (_apiKey != null) {
        headers['x-api-key'] = _apiKey!;
      }

      final res = await http.post(
        uri,
        headers: headers,
        body: jsonEncode({
          'address': address,
          'amount': bondAmount.toString(),
          'bondId': bondId,
        }),
      );

      if (res.statusCode >= 200 && res.statusCode < 300) {
        final decoded = jsonDecode(res.body);
        if (decoded['success'] == true) {
          return decoded['txHash'] ?? '';
        } else {
          throw Exception(decoded['error'] ?? 'Redemption failed');
        }
      } else {
        debugPrint('Redemption failed: ${res.statusCode} ${res.body}');
        try {
          final decoded = jsonDecode(res.body);
          throw Exception(decoded['error'] ?? 'Redemption failed');
        } catch (_) {
          throw Exception('Redemption failed: ${res.statusCode}');
        }
      }
    } catch (e) {
      debugPrint('Error processing redemption: $e');
      rethrow;
    }
  }

  /// Claim yield (gasless via backend)
  Future<String> claimYield({
    required String address,
    String bondId = 'GOI-2030',
  }) async {
    if (_baseUrl.isEmpty) {
      throw Exception('Missing API_BASE_URL in .env');
    }

    try {
      final uri = Uri.parse('$_baseUrl/api/claim');
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (_apiKey != null) {
        headers['x-api-key'] = _apiKey!;
      }

      final res = await http.post(
        uri,
        headers: headers,
        body: jsonEncode({'address': address, 'bondId': bondId}),
      );

      if (res.statusCode >= 200 && res.statusCode < 300) {
        final decoded = jsonDecode(res.body);
        if (decoded['success'] == true) {
          return decoded['txHash'] ?? '';
        } else {
          throw Exception(decoded['error'] ?? 'Claim failed');
        }
      } else {
        debugPrint('Claim failed: ${res.statusCode} ${res.body}');
        try {
          final decoded = jsonDecode(res.body);
          throw Exception(decoded['error'] ?? 'Claim failed');
        } catch (_) {
          throw Exception('Claim failed: ${res.statusCode}');
        }
      }
    } catch (e) {
      debugPrint('Error claiming yield: $e');
      rethrow;
    }
  }
}

/// Debt monitor status model
class DebtMonitorStatus {
  final double totalDebtIssued;
  final double totalAssetBacking;
  final bool isHealthy;
  final DateTime timestamp;

  DebtMonitorStatus({
    required this.totalDebtIssued,
    required this.totalAssetBacking,
    required this.isHealthy,
    required this.timestamp,
  });

  factory DebtMonitorStatus.fromJson(Map<String, dynamic> json) {
    return DebtMonitorStatus(
      totalDebtIssued: _parseDouble(json['totalDebtIssued']) ?? 0.0,
      totalAssetBacking: _parseDouble(json['totalAssetBacking']) ?? 0.0,
      isHealthy: json['isHealthy'] == true,
      timestamp: _parseDateTime(json['timestamp']) ?? DateTime.now(),
    );
  }

  static double? _parseDouble(dynamic v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    final s = v.toString();
    return double.tryParse(s);
  }

  static DateTime? _parseDateTime(dynamic v) {
    if (v == null) return null;
    try {
      return DateTime.parse(v.toString());
    } catch (_) {
      return null;
    }
  }
}

/// Yield distribution result model
class YieldDistributionResult {
  final bool success;
  final String? transactionHash;
  final String? message;

  YieldDistributionResult({
    required this.success,
    this.transactionHash,
    this.message,
  });

  factory YieldDistributionResult.fromJson(Map<String, dynamic> json) {
    return YieldDistributionResult(
      success: json['success'] == true,
      transactionHash: json['transactionHash']?.toString(),
      message: json['message']?.toString(),
    );
  }
}

/// Bond information model
class BondInfo {
  final String name;
  final String symbol;
  final String address;
  final double totalSupply;
  final double couponRate;
  final DateTime? maturityDate;

  BondInfo({
    required this.name,
    required this.symbol,
    required this.address,
    required this.totalSupply,
    required this.couponRate,
    this.maturityDate,
  });

  factory BondInfo.fromJson(Map<String, dynamic> json) {
    return BondInfo(
      name: json['name']?.toString() ?? 'Unknown',
      symbol: json['symbol']?.toString() ?? 'BOND',
      address: json['address']?.toString() ?? '',
      totalSupply: DebtMonitorStatus._parseDouble(json['totalSupply']) ?? 0.0,
      couponRate: DebtMonitorStatus._parseDouble(json['couponRate']) ?? 0.0,
      maturityDate: DebtMonitorStatus._parseDateTime(json['maturityDate']),
    );
  }
}
