import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/theme.dart';

import '../providers/bonds_provider.dart';
import 'widgets/bond_card.dart';

import 'package:flutter_screenutil/flutter_screenutil.dart';

// ...

class ExploreScreen extends ConsumerWidget {
  const ExploreScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bondsAsync = ref.watch(bondsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Colors.black87, size: 24.w),
          onPressed: () => context.pop(),
        ),
        title: Text(
          "Explore Bonds",
          style: AppTextStyles.heading2.copyWith(fontSize: 20.sp),
        ),
        centerTitle: true,
      ),
      body: bondsAsync.when(
        data: (bonds) {
          if (bonds.isEmpty) {
            return Center(
              child: Text(
                "No bonds available at the moment.",
                style: AppTextStyles.bodyMedium.copyWith(color: Colors.grey),
              ),
            );
          }
          final list = bonds;
          return ListView.separated(
            padding: EdgeInsets.all(24.w),
            itemCount: list.length,
            separatorBuilder: (context, index) => Gap(16.h),
            itemBuilder: (context, index) {
              final bond = list[index];
              return BondCard(bond: bond);
            },
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        error: (error, _) {
          return Center(
            child: Padding(
              padding: EdgeInsets.all(24.0.w),
              child: Text(
                "Failed to load bonds. Please check your connection.",
                textAlign: TextAlign.center,
                style: AppTextStyles.bodyMedium.copyWith(color: Colors.red),
              ),
            ),
          );
        },
      ),
    );
  }
}
