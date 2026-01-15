import 'package:google_fonts/google_fonts.dart';
import '../../../invest/presentation/invest_sheet.dart';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import '../../providers/user_portfolio_provider.dart';
import '../../../invest/data/bond_model.dart'; // Import Bond Model
import '../../../invest/providers/bonds_provider.dart';

class PortfolioCard extends ConsumerWidget {
  const PortfolioCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Read the portfolio data
    final portfolioAsync = ref.watch(userPortfolioProvider);
    final portfolio = portfolioAsync.value ?? PortfolioModel.empty();
    final allBonds = ref.watch(bondsProvider).value ?? [];

    // Default Token (if empty)
    String tokenName = "GOI Bond 2030";
    String tokenSubtitle = "GOI-2030";
    IconData tokenIcon = Icons.account_balance; // Default icon
    double tokenValue = 0.00;
    double tokenApy = 7.5;
    String maturityYear = "2030";

    // Use first holding if available
    if (portfolio.holdings.isNotEmpty) {
      final holding = portfolio.holdings.first;
      tokenName = holding.bondName;
      tokenValue = holding.value;
      tokenApy = holding.apy;
      tokenSubtitle = holding.bondId; // Dynamic ID from API (e.g. GOI-30, MNT)

      // Try to find rich details (Icon) for this bond
      try {
        final bond = allBonds.firstWhere((b) => b.bondId == holding.bondId);
        tokenIcon = bond.icon;
      } catch (_) {
        // Keep default icon if not found locally
      }

      // Extract year from maturity string (assuming YYYY-MM-DD or similar)
      if (holding.maturityDate.isNotEmpty) {
        final parts = holding.maturityDate.split('-');
        if (parts.isNotEmpty) {
          maturityYear = parts[0];
        }
      }
    }

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(32), // Modern wider radius
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF001F3F), // Deep Navy
            Color(0xFF003366), // Slightly lighter Navy
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF001F3F).withValues(alpha: 0.4),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(32),
        child: InkWell(
          borderRadius: BorderRadius.circular(32),
          onTap: () {
            // Find the bond object from allBonds
            Bond? bond;
            try {
              bond = allBonds.firstWhere(
                (b) => b.title == tokenName || b.bondId == tokenSubtitle,
              );
            } catch (_) {
              // Fallback to first bond if not found
              bond = allBonds.isNotEmpty ? allBonds.first : null;
            }

            if (bond != null) {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (context) => InvestBottomSheet(bond: bond!),
              );
            }
          },
          child: Stack(
            children: [
              // Content
              Padding(
                padding: const EdgeInsets.all(28.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header: Name + APY
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          portfolio.holdings.isNotEmpty
                              ? tokenName
                              : "Wallet Balance",
                          style: GoogleFonts.manrope(
                            color: Colors.white.withValues(alpha: 0.9),
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            letterSpacing: 0.5,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(
                              0xFF4CAF50,
                            ).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(
                                0xFF4CAF50,
                              ).withValues(alpha: 0.5),
                              width: 1,
                            ),
                          ),
                          // Badge with Up-Right Arrow
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.north_east,
                                color: Color(0xFF4CAF50),
                                size: 14,
                              ),
                              const Gap(4),
                              Text(
                                tokenApy.toStringAsFixed(1),
                                style: GoogleFonts.manrope(
                                  color: const Color(
                                    0xFF4CAF50,
                                  ), // Standard Green
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const Gap(24),

                    // Value
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          (portfolio.holdings.isNotEmpty
                                  ? tokenValue
                                  : portfolio.walletBalance)
                              .toStringAsFixed(2),
                          style: GoogleFonts.manrope(
                            color: Colors.white,
                            fontSize: 42,
                            fontWeight: FontWeight.bold,
                            height: 1.0,
                            letterSpacing: -1.0,
                          ),
                        ),
                        const Gap(8),
                        Text(
                          "USDT",
                          style: GoogleFonts.manrope(
                            color: Colors.white.withValues(alpha: 0.6),
                            fontSize: 20,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),

                    const Gap(32),

                    // Footer: Chips
                    Row(
                      children: [
                        _buildInfoChip(
                          Icons.calendar_today_rounded,
                          "Maturing $maturityYear",
                        ),
                        const Gap(12),
                        _buildInfoChip(tokenIcon, tokenSubtitle),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF000E1D).withValues(alpha: 0.4), // Darker pill bg
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white70, size: 16),
          const Gap(8),
          Text(
            label,
            style: GoogleFonts.manrope(
              color: Colors.white70,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
