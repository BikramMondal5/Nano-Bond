import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;

class BondRegistryBondDto {
  final String bondId;
  final String bondName;
  final String issuer;
  final double? couponRate;
  final DateTime? startDate;
  final DateTime? maturityDate;
  final double minInvestment;
  final double maxSubscription;
  final String? description;
  final String? proofUrl;
  // On-chain data
  final double totalSupply;
  final double totalBackedValue;
  final String symbol;
  final String? contractAddress;
  final String? treasuryAddress;
  final String? distributorAddress;
  final DateTime? maturityDateOnChain;

  BondRegistryBondDto({
    required this.bondId,
    required this.bondName,
    required this.issuer,
    required this.couponRate,
    required this.startDate,
    required this.maturityDate,
    required this.minInvestment,
    required this.maxSubscription,
    required this.description,
    required this.proofUrl,
    required this.totalSupply,
    required this.totalBackedValue,
    required this.symbol,
    this.contractAddress,
    this.treasuryAddress,
    this.distributorAddress,
    this.maturityDateOnChain,
  });

  factory BondRegistryBondDto.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic v) {
      if (v == null) return null;
      try {
        return DateTime.parse(v.toString());
      } catch (_) {
        return null;
      }
    }

    DateTime? parseTimestamp(dynamic v) {
      if (v == null) return null;
      final num = double.tryParse(v.toString());
      if (num == null || num == 0) return null;
      return DateTime.fromMillisecondsSinceEpoch((num * 1000).toInt());
    }

    double? parseDouble(dynamic v) {
      if (v == null) return null;
      final s = v.toString();
      return double.tryParse(s);
    }

    return BondRegistryBondDto(
      bondId: (json['bondId'] ?? '').toString(),
      bondName: (json['bondName'] ?? '').toString(),
      issuer: (json['issuer'] ?? '').toString(),
      couponRate: parseDouble(json['couponRate']),
      startDate: parseDate(json['startDate']),
      maturityDate: parseDate(json['maturityDate']),
      minInvestment: parseDouble(json['minInvestment']) ?? 0,
      maxSubscription: parseDouble(json['maxSubscription']) ?? 0,
      description: json['description']?.toString(),
      proofUrl: json['proofUrl']?.toString(),
      totalSupply: parseDouble(json['totalSupply']) ?? 0,
      totalBackedValue: parseDouble(json['totalBackedValue']) ?? 0,
      symbol: (json['symbol'] ?? 'BOND').toString(),
      contractAddress: json['contractAddress']?.toString(),
      treasuryAddress: json['treasuryAddress']?.toString(),
      distributorAddress: json['distributorAddress']?.toString(),
      maturityDateOnChain: parseTimestamp(json['maturityDateOnChain']),
    );
  }
}

class BondRegistryService {
  String get _baseUrl {
    final v = dotenv.env['API_BASE_URL'] ?? '';
    return v.endsWith('/') ? v.substring(0, v.length - 1) : v;
  }

  Future<List<BondRegistryBondDto>> listBonds() async {
    if (_baseUrl.isEmpty) {
      throw Exception('Missing API_BASE_URL in .env');
    }

    final uri = Uri.parse('$_baseUrl/api/bonds');
    final res = await http.get(uri);

    if (res.statusCode < 200 || res.statusCode >= 300) {
      debugPrint('Bond list failed: ${res.statusCode} ${res.body}');
      throw Exception('Failed to load bonds');
    }

    final decoded = jsonDecode(res.body);
    final list = (decoded is Map<String, dynamic>)
        ? (decoded['bonds'] as List<dynamic>? ?? [])
        : <dynamic>[];

    return list
        .whereType<Map<String, dynamic>>()
        .map((e) => BondRegistryBondDto.fromJson(e))
        .where((b) => b.bondId.isNotEmpty && b.bondName.isNotEmpty)
        .toList();
  }
}
