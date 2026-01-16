import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lottie/lottie.dart';
import '../../../invest/presentation/invest_sheet.dart';
import '../../../invest/data/bond_model.dart';
import '../../providers/user_portfolio_provider.dart';
import '../../../invest/providers/bonds_provider.dart';
import 'bonds_drawer.dart';

class PortfolioCarousel extends ConsumerStatefulWidget {
  const PortfolioCarousel({super.key});

  @override
  ConsumerState<PortfolioCarousel> createState() => _PortfolioCarouselState();
}

class _PortfolioCarouselState extends ConsumerState<PortfolioCarousel> {
  late PageController _pageController;
  Timer? _autoSlideTimer;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    // Start from a large index to allow backward scrolling
    _pageController = PageController(viewportFraction: 1.0, initialPage: 1000);
  }

  @override
  void dispose() {
    _autoSlideTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _manageAutoSlide(bool shouldSlide) {
    if (shouldSlide && _autoSlideTimer == null) {
      _autoSlideTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
        if (_pageController.hasClients) {
          _pageController.nextPage(
            duration: const Duration(milliseconds: 600),
            curve: Curves.easeInOut,
          );
        }
      });
    } else if (!shouldSlide && _autoSlideTimer != null) {
      _autoSlideTimer!.cancel();
      _autoSlideTimer = null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final portfolioAsync = ref.watch(userPortfolioProvider);
    final portfolio = portfolioAsync.value ?? PortfolioModel.empty();
    final allBonds = ref.watch(bondsProvider).value ?? [];
    final holdings = portfolio.holdings;

    // Manage auto-slide timer based on item count
    _manageAutoSlide(holdings.length > 1);

    // If no holdings, show a placeholder card
    if (holdings.isEmpty) {
      return _buildEmptyState(context);
    }

    // If only one holding, show single card without carousel/dots
    if (holdings.length == 1) {
      final holding = holdings.first;
      return Column(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(32),
            child: SizedBox(
              height: 200,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2.5),
                child: _buildHoldingCard(context, holding, allBonds),
              ),
            ),
          ),
        ],
      );
    }

    // Multiple holdings: Show Carousel
    return Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(32),
          child: SizedBox(
            height: 200,
            child: PageView.builder(
              controller: _pageController,
              // itemCount is null for infinite scrolling
              onPageChanged: (index) {
                final length = holdings.length;
                if (length > 0) {
                  setState(() => _currentPage = index % length);
                }
              },
              itemBuilder: (context, index) {
                final length = holdings.length;
                final modIndex = index % length;
                final holding = holdings[modIndex];

                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2.5),
                  child: _buildHoldingCard(context, holding, allBonds),
                );
              },
            ),
          ),
        ),
        // Page indicator dots
        if (holdings.length > 1) ...[
          const Gap(12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              holdings.length,
              (index) => AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: _currentPage == index ? 20 : 8,
                height: 8,
                decoration: BoxDecoration(
                  color: _currentPage == index
                      ? const Color(0xFF3D5A80)
                      : Colors.grey[300],
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildHoldingCard(
    BuildContext context,
    dynamic holding,
    List<Bond> allBonds,
  ) {
    String tokenName = holding.bondName;
    double tokenValue = holding.value;
    double tokenApy = holding.apy;
    String tokenSubtitle = holding.bondId;
    IconData tokenIcon = Icons.account_balance;
    String maturityYear = "2030";

    // Try to find rich details (Icon) for this bond
    try {
      final bond = allBonds.firstWhere((b) => b.bondId == holding.bondId);
      tokenIcon = bond.icon;
    } catch (_) {}

    // Extract year from maturity string
    if (holding.maturityDate.isNotEmpty) {
      final parts = holding.maturityDate.split('-');
      if (parts.isNotEmpty) {
        maturityYear = parts[0];
      }
    }

    return _buildCard(
      context: context,
      tokenName: tokenName,
      tokenSubtitle: tokenSubtitle,
      tokenIcon: tokenIcon,
      tokenValue: tokenValue,
      tokenApy: tokenApy,
      maturityYear: maturityYear,
      allBonds: allBonds,
    );
  }

  Widget _buildCard({
    required BuildContext context,
    required String tokenName,
    required String tokenSubtitle,
    required IconData tokenIcon,
    required double tokenValue,
    required double tokenApy,
    required String maturityYear,
    required List<Bond> allBonds,
  }) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(32),
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
            Bond? bond;
            try {
              bond = allBonds.firstWhere(
                (b) => b.title == tokenName || b.bondId == tokenSubtitle,
              );
            } catch (_) {
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
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Header: Name + APY
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      tokenName,
                      style: GoogleFonts.manrope(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.north_east,
                            color: Colors.greenAccent,
                            size: 14,
                          ),
                          const Gap(4),
                          Text(
                            "${tokenApy.toStringAsFixed(1)}%",
                            style: GoogleFonts.manrope(
                              color: Colors.greenAccent,
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                // Value
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      tokenValue.toStringAsFixed(2),
                      style: GoogleFonts.manrope(
                        color: Colors.white,
                        fontSize: 36,
                        fontWeight: FontWeight.w700,
                        height: 1.1,
                      ),
                    ),
                    const Gap(8),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Text(
                        "USDT",
                        style: GoogleFonts.manrope(
                          color: Colors.white60,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
                // Info chips
                Row(
                  children: [
                    _buildInfoChip(
                      Icons.calendar_today,
                      "Maturing $maturityYear",
                    ),
                    const Gap(12),
                    _buildInfoChip(tokenIcon, tokenSubtitle),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 180,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(32),
        color: const Color(0xFF001F3F), // Deep Navy
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
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (context) => const BondsDrawer(),
            );
          },
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Lottie animation centered
              SizedBox(
                width: 100,
                height: 100,
                child: Lottie.asset(
                  'assets/animation/Finance guru.json',
                  fit: BoxFit.contain,
                ),
              ),
              const Gap(12),
              Text(
                "Tap to explore bonds",
                style: GoogleFonts.manrope(
                  color: Colors.white70,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
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
        color: const Color(0xFF000E1D).withValues(alpha: 0.4),
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
