import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import '../invest_sheet.dart';
import '../../../../core/theme/theme.dart';
import '../../data/bond_model.dart';

import 'package:flutter_screenutil/flutter_screenutil.dart';

// ...

class BondCard extends StatelessWidget {
  final Bond bond;

  const BondCard({super.key, required this.bond});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (context) => InvestBottomSheet(bond: bond),
        );
      },
      child: Container(
        padding: EdgeInsets.all(20.w),
        decoration: BoxDecoration(
          color: bond.backgroundColor, // Use dynamic pastel color
          borderRadius: BorderRadius.circular(32.r),
          // Soft shadow or no shadow for a flat "card" feel
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: EdgeInsets.all(12.w),
                  decoration: BoxDecoration(
                    color: Colors.white, // White icon background
                    borderRadius: BorderRadius.circular(16.r),
                  ),
                  child: Icon(bond.icon, color: AppColors.primary, size: 28.w),
                ),
                const Spacer(),
                Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: 12.w,
                    vertical: 8.h,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white, // White badge background
                    borderRadius: BorderRadius.circular(20.r),
                  ),
                  child: Text(
                    bond.apy,
                    style: TextStyle(
                      color: bond.apyColor, // Custom APY text color
                      fontWeight: FontWeight.w800,
                      fontSize: 13.sp,
                    ),
                  ),
                ),
              ],
            ),
            Gap(32.h),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        bond.title,
                        style: AppTextStyles.heading2.copyWith(fontSize: 18.sp),
                      ),
                      Gap(4.h),
                      Text(
                        bond.subtitle,
                        style: AppTextStyles.caption.copyWith(
                          color: Colors.grey[700],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            // Removed divider and bottom row to match the new minimalist card design
          ],
        ),
      ),
    );
  }
}
