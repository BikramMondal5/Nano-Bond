import 'package:flutter/material.dart';

class Bond {
  final String bondId;
  final String title;
  final String subtitle;
  final String apy;
  final String minInvestment;
  final IconData icon;
  final Color apyColor;
  final String? proofUrl;
  final Color backgroundColor;
  // On-chain data
  final double totalSupply;
  final double totalBackedValue;
  final String symbol;
  final DateTime? maturityDate;

  const Bond({
    required this.bondId,
    required this.title,
    required this.subtitle,
    required this.apy,
    required this.minInvestment,
    required this.icon,
    this.apyColor = Colors.green,
    this.proofUrl,
    this.backgroundColor = Colors.white,
    this.totalSupply = 0,
    this.totalBackedValue = 0,
    this.symbol = 'BOND',
    this.maturityDate,
  });
}

/*
final List<Bond> mockedBonds = [
  const Bond(
    bondId: "GOI-2030",
    title: "GOI Bond 2030",
    subtitle: "Govt of India • Sovereign",
    apy: "7.5% APY",
    minInvestment: "100 USDT",
    icon: Icons.account_balance,
    apyColor: Color(0xFF4A49B8), // Dark purple text for APY
    backgroundColor: Color(0xFFEEECF9), // Light purple background
    proofUrl:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12203&Mode=0",
  ),
  const Bond(
    bondId: "GREEN-ENERGY",
    title: "Green Energy Bond",
    subtitle: "NTPC • AAA Rated",
    apy: "8.1% APY",
    minInvestment: "100 USDT",
    icon: Icons.eco,
    apyColor: Color(0xFF2E5C55), // Dark green text
    backgroundColor: Color(0xFFECF4F4), // Light greenish-grey background
    proofUrl: "https://www.ntpc.co.in/en/investors/bonds",
  ),
  const Bond(
    bondId: "INFRA-DEV",
    title: "Infra Dev Bond",
    subtitle: "NHAI • Tax Free",
    apy: "6.0% APY",
    minInvestment: "100 USDT",
    icon: Icons.add_road,
    apyColor: Color(0xFF0D47A1), // Dark blue
    backgroundColor: Color(0xFFE3F2FD), // Light blue background
    proofUrl: "https://nhai.gov.in/nhai/NHAI-bonds.htm",
  ),
  const Bond(
    bondId: "SDL-MH",
    title: "State Dev Loan",
    subtitle: "Maharashtra Govt • SDL",
    apy: "7.65% APY",
    minInvestment: "100 USDT",
    icon: Icons.location_city,
    apyColor: Color(0xFFE65100), // Dark orange
    backgroundColor: Color(0xFFFFF3E0), // Light orange background
    proofUrl:
        "https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=52456",
  ),
  const Bond(
    bondId: "CORP-HDFC",
    title: "Corporate Bond",
    subtitle: "HDFC • AAA Rated",
    apy: "8.5% APY",
    minInvestment: "100 USDT",
    icon: Icons.business,
    apyColor: Colors.green,
    proofUrl: "https://www.hdfcbank.com/personal/borrow/loans/bonds",
  ),
  const Bond(
    bondId: "MUNI-PUNE",
    title: "Municipal Bond",
    subtitle: "Pune Municipal Corp",
    apy: "7.9% APY",
    minInvestment: "100 USDT",
    icon: Icons.domain,
    apyColor: Colors.green,
    proofUrl: "https://pmc.gov.in/en/municipal-bonds",
  ),
  const Bond(
    bondId: "FRB-2033",
    title: "Floating Rate Bond",
    subtitle: "GOI • RBI 2033",
    apy: "8.05% APY",
    minInvestment: "100 USDT",
    icon: Icons.waves,
    apyColor: Colors.green,
    proofUrl:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12203&Mode=0",
  ),
];
*/
