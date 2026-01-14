import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lottie/lottie.dart';

import '../../../invest/providers/bonds_provider.dart';
import '../../../../core/theme/theme.dart';
import '../../../invest/data/bond_model.dart';
import '../../../invest/presentation/invest_sheet.dart';

class BondsDrawer extends ConsumerStatefulWidget {
  const BondsDrawer({super.key});

  @override
  ConsumerState<BondsDrawer> createState() => _BondsDrawerState();
}

class _BondsDrawerState extends ConsumerState<BondsDrawer>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  bool _animationCompleted = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(vsync: this);
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _onAnimationLoaded(LottieComposition composition) {
    _animationController.duration = composition.duration;
    _animationController.forward().then((_) {
      if (mounted) {
        setState(() {
          _animationCompleted = true;
        });
      }
    });
  }

  void _openInvestSheet(BuildContext context, Bond bond) {
    // Close the drawer first
    Navigator.of(context).pop();

    // Then open the invest sheet
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => InvestBottomSheet(bond: bond),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bonds = ref.watch(bondsProvider).valueOrNull ?? [];
    final showContent = _animationCompleted;

    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      child: Column(
        children: [
          // Drawer Handle
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  "Explore Bonds",
                  style: GoogleFonts.outfit(
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                    letterSpacing: -0.5,
                  ),
                ),
              ],
            ),
          ),

          // Content
          Expanded(
            child: !showContent
                ? Center(
                    child: SizedBox(
                      width: 120,
                      height: 120,
                      child: Lottie.asset(
                        'assets/animation/Loading.json',
                        controller: _animationController,
                        onLoaded: _onAnimationLoaded,
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) {
                          debugPrint("Lottie Loading Error: $error");
                          return const CircularProgressIndicator();
                        },
                      ),
                    ),
                  )
                : bonds.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.account_balance,
                          size: 64,
                          color: Colors.grey[300],
                        ),
                        const Gap(16),
                        Text(
                          "No bonds available",
                          style: GoogleFonts.manrope(
                            fontSize: 16,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(24),
                    itemCount: bonds.length,
                    separatorBuilder: (context, index) => const Gap(12),
                    itemBuilder: (context, index) {
                      final bond = bonds[index];
                      return _buildBondItem(bond);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildBondItem(Bond bond) {
    // Pastel colors for variety
    final colors = [
      const Color(0xFFEFEEFC), // Light Lavender
      const Color(0xFFE6F2FF), // Light Blue
      const Color(0xFFE0F2F1), // Soft Mint
      const Color(0xFFFFF3E0), // Light Orange
    ];
    final cardColor = colors[bond.title.hashCode % colors.length];
    const contentColor = AppColors.primary;
    final iconBgColor = AppColors.primary.withValues(alpha: 0.08);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Top Colored Section
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cardColor,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(24),
                topRight: Radius.circular(24),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Icon Box and Title
                    Expanded(
                      child: Row(
                        children: [
                          Container(
                            height: 48,
                            width: 48,
                            decoration: BoxDecoration(
                              color: iconBgColor,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              bond.icon,
                              color: contentColor,
                              size: 24,
                            ),
                          ),
                          const Gap(12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  bond.title,
                                  style: GoogleFonts.manrope(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: contentColor,
                                  ),
                                ),
                                Text(
                                  bond.subtitle,
                                  style: GoogleFonts.manrope(
                                    fontSize: 12,
                                    color: contentColor.withValues(alpha: 0.8),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Gap(8),
                    // Invest Button (Circular style)
                    GestureDetector(
                      onTap: () => _openInvestSheet(context, bond),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: const BoxDecoration(
                          color: Color(0xFF001F3F), // Dark Navy
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.north_east,
                          size: 16,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
                const Gap(16),
                // Tags
                Row(
                  children: [
                    _buildTag(bond.apy, contentColor, iconBgColor),
                    const Gap(8),
                    _buildTag(
                      "Min ${bond.minInvestment}",
                      contentColor,
                      iconBgColor,
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Bottom White Section
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(24),
                bottomRight: Radius.circular(24),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.account_balance,
                      size: 16,
                      color: Colors.grey,
                    ),
                    const Gap(6),
                    Text(
                      bond.bondId,
                      style: GoogleFonts.manrope(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
                Text(
                  bond.minInvestment,
                  style: GoogleFonts.manrope(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Colors.black87,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTag(String text, Color textColor, Color bgColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: GoogleFonts.manrope(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }
}
