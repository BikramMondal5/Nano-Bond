import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'bonds_drawer.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../invest/data/bond_model.dart';
import '../../../invest/presentation/invest_sheet.dart';

class BentoGrid extends StatelessWidget {
  final List<Bond> bonds;

  const BentoGrid({super.key, required this.bonds});

  @override
  Widget build(BuildContext context) {
    if (bonds.isEmpty) return const SizedBox();

    final bond1 = bonds[0];
    final bond2 = bonds.length > 1 ? bonds[1] : null;
    final bond3 = bonds.length > 2 ? bonds[2] : null;

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              flex: 3,
              child: _buildLargeBondCard(
                context,
                bond1,
                const Color(0xFFE8EAF6), // Light Indigo/Blue
                const Color(0xFF1A237E), // Deep Indigo
              ),
            ),
            const Gap(12),
            Expanded(flex: 2, child: _buildExploreCard(context)),
          ],
        ),
        if (bond2 != null) ...[
          const Gap(12),
          Row(
            children: [
              Expanded(
                child: _buildSmallBondCard(
                  context,
                  bond2,
                  const Color(0xFFE3F2FD), // Light Blue
                  const Color(0xFF1565C0), // Blue
                ),
              ),
              const Gap(12),
              Expanded(
                child: bond3 != null
                    ? _buildSmallBondCard(
                        context,
                        bond3,
                        const Color(0xFFECEFF1), // Blue Grey
                        const Color(0xFF455A64), // Dark Blue Grey
                      )
                    : const SizedBox(), // Placeholder if no 3rd bond
              ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildLargeBondCard(
    BuildContext context,
    Bond bond,
    Color bgColor,
    Color accentColor,
  ) {
    return GestureDetector(
      onTap: () => _showInvestSheet(context, bond),
      child: Container(
        height: 150,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(bond.icon, color: accentColor, size: 28),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    bond.apy,
                    style: GoogleFonts.manrope(
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                      color: accentColor,
                    ),
                  ),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  bond.title,
                  style: GoogleFonts.manrope(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: Colors.black87,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const Gap(2),
                Text(
                  bond.subtitle,
                  style: GoogleFonts.manrope(
                    fontWeight: FontWeight.w500,
                    fontSize: 11,
                    color: Colors.black54,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSmallBondCard(
    BuildContext context,
    Bond bond,
    Color bgColor,
    Color accentColor,
  ) {
    return GestureDetector(
      onTap: () => _showInvestSheet(context, bond),
      child: Container(
        height: 130,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: Icon(bond.icon, color: accentColor, size: 18),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  bond.apy,
                  style: GoogleFonts.manrope(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: accentColor,
                  ),
                ),
                const Gap(2),
                Text(
                  bond.title,
                  style: GoogleFonts.manrope(
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                    color: Colors.black87,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExploreCard(BuildContext context) {
    return GestureDetector(
      onTap: () {
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (context) => const BondsDrawer(),
        );
      },
      child: Container(
        height: 150,
        padding: const EdgeInsets.all(12),
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
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.arrow_outward,
                color: Color(0xFF001F3F), // Deep Navy
                size: 20,
              ),
            ),
            const Gap(12),
            Text(
              "Invest",
              textAlign: TextAlign.center,
              style: GoogleFonts.manrope(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: Colors.black87,
                height: 1.2,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showInvestSheet(BuildContext context, Bond bond) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => InvestBottomSheet(bond: bond),
    );
  }
}
