import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:gap/gap.dart';
import 'package:lottie/lottie.dart';
import '../../../../core/theme/theme.dart';

import 'widgets/portfolio_carousel.dart';
import 'widgets/history_drawer.dart';

import '../../invest/data/bond_model.dart';

import 'widgets/deposit_sheet.dart';
import 'widgets/withdraw_sheet.dart';
import 'widgets/bento_grid.dart';
import '../../invest/providers/bonds_provider.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/presentation/providers.dart';
import '../providers/user_portfolio_provider.dart';
import '../../profile/providers/kyc_status_provider.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  bool _animationCompleted = false;
  bool _hasLoadedOnce = false; // Track if initial load is complete

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(vsync: this);

    _animationController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        // Check if data is ready
        final authState = ref.read(authStateProvider);
        final bondsAsync = ref.read(bondsProvider);
        final portfolioAsync = ref.read(userPortfolioProvider);

        // Pre-fetch KYC status for Profile Screen
        ref.read(kycStatusProvider);

        // Consistent with build method logic
        final isDataLoaded =
            !authState.isLoading &&
            !bondsAsync.isLoading &&
            !portfolioAsync.isLoading;

        if (isDataLoaded) {
          if (mounted) {
            setState(() {
              _animationCompleted = true;
              _hasLoadedOnce = true; // Mark that we've loaded at least once
            });
          }
        } else {
          // Loop again if data is not yet loaded
          _animationController.forward(from: 0);
        }
      }
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _onAnimationLoaded(LottieComposition composition) {
    _animationController.duration = composition.duration;
    _animationController.forward();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final bondsAsync = ref.watch(bondsProvider);
    final portfolioAsync = ref.watch(userPortfolioProvider);

    // Check if all data is loaded
    final isDataLoaded =
        !authState.isLoading &&
        !bondsAsync.isLoading &&
        !portfolioAsync.isLoading;

    // Show content only when animation completes AND data is loaded
    // OR if we've already loaded once (for refresh scenarios)
    final showContent = (_animationCompleted && isDataLoaded) || _hasLoadedOnce;

    if (!showContent) {
      return Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: SizedBox(
            width: 150.w,
            height: 150.w,
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
        ),
      );
    }

    final user = authState.valueOrNull;
    final userImage = user?.profileImage;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        systemNavigationBarColor: Colors.transparent,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: RefreshIndicator(
          onRefresh: () async {
            // Reload all essential providers
            ref.invalidate(userPortfolioProvider);
            ref.invalidate(bondsProvider);
            // Wait for them to complete
            await Future.wait([
              ref.refresh(userPortfolioProvider.future),
              ref.refresh(bondsProvider.future),
            ]);
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(
              parent: ClampingScrollPhysics(),
            ),
            slivers: [
              SliverAppBar(
                floating: true,
                pinned: true,
                backgroundColor: AppColors.background,
                surfaceTintColor: Colors.transparent,
                expandedHeight: 80.h,
                toolbarHeight: 80.h,
                titleSpacing: 0,
                title: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 28.w),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "nano\nbonds",
                        textAlign: TextAlign.left,
                        style: GoogleFonts.manrope(
                          fontSize: 20.sp,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF001F3F), // Deep Navy
                          letterSpacing: -0.5,
                          height: 1.0,
                        ),
                      ),
                      GestureDetector(
                        onTap: () => context.push('/profile'),
                        child: Container(
                          width: 44.w,
                          height: 44.w,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.grey[200]!),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.05),
                                blurRadius: 10.r,
                                offset: Offset(0, 2.h),
                              ),
                            ],
                            image: userImage != null
                                ? DecorationImage(
                                    image: NetworkImage(userImage),
                                    fit: BoxFit.cover,
                                  )
                                : null,
                          ),
                          child: userImage == null
                              ? const Icon(
                                  Icons.person_outline,
                                  color: AppColors.primary,
                                )
                              : null,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              SliverPadding(
                padding: EdgeInsets.symmetric(horizontal: 24.w),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    const PortfolioCarousel(),
                    Gap(24.h),

                    // Quick Actions Row (Bento Style)
                    Row(
                      children: [
                        Expanded(
                          child: _buildQuickActionCard(
                            context,
                            SvgPicture.string(
                              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11.0001L11 2.0005L13 2.00049L13 11.0001L22.0001 10.9999L22.0002 12.9999L13 13.0001L13.0001 22L11.0001 22L11.0001 13.0001L2.00004 13.0003L2 11.0003L11 11.0001Z"></path></svg>',
                              width: 32.w,
                              height: 32.w,
                              colorFilter: const ColorFilter.mode(
                                Color(0xFF001F3F), // Deep Navy
                                BlendMode.srcIn,
                              ),
                            ),
                            "Deposit",
                            onTap: () {
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                backgroundColor: Colors.transparent,
                                builder: (context) => DepositBottomSheet(
                                  address:
                                      user?.address ??
                                      "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
                                ),
                              );
                            },
                          ),
                        ),
                        Gap(8.w),
                        Expanded(
                          child: _buildQuickActionCard(
                            context,
                            SvgPicture.string(
                              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12H4C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C9.25022 4 6.82447 5.38734 5.38451 7.50024L8 7.5V9.5H2V3.5H4L3.99989 5.99918C5.82434 3.57075 8.72873 2 12 2ZM13 7L12.9998 11.585L16.2426 14.8284L14.8284 16.2426L10.9998 12.413L11 7H13Z"></path></svg>',
                              width: 32.w,
                              height: 32.w,
                              colorFilter: const ColorFilter.mode(
                                Color(0xFF001F3F),
                                BlendMode.srcIn,
                              ),
                            ),
                            "History",
                            onTap: () {
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                backgroundColor: Colors.transparent,
                                builder: (context) => const HistoryDrawer(),
                              );
                            },
                          ),
                        ),
                        Gap(8.w),
                        Expanded(
                          child: _buildQuickActionCard(
                            context,
                            SvgPicture.string(
                              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.0049 22.0027C6.48204 22.0027 2.00488 17.5256 2.00488 12.0027C2.00488 6.4799 6.48204 2.00275 12.0049 2.00275C17.5277 2.00275 22.0049 6.4799 22.0049 12.0027C22.0049 17.5256 17.5277 22.0027 12.0049 22.0027ZM12.0049 20.0027C16.4232 20.0027 20.0049 16.421 20.0049 12.0027C20.0049 7.58447 16.4232 4.00275 12.0049 4.00275C7.5866 4.00275 4.00488 7.58447 4.00488 12.0027C4.00488 16.421 7.5866 20.0027 12.0049 20.0027ZM12.0049 7.053L16.9546 12.0027L12.0049 16.9525L7.05514 12.0027L12.0049 7.053ZM12.0049 9.88143L9.88356 12.0027L12.0049 14.1241L14.1262 12.0027L12.0049 9.88143Z"></path></svg>',
                              width: 32.w,
                              height: 32.w,
                              colorFilter: const ColorFilter.mode(
                                Color(0xFF001F3F),
                                BlendMode.srcIn,
                              ),
                            ),
                            "Redeem",
                            onTap: () {
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                backgroundColor: Colors.transparent,
                                builder: (context) => WithdrawBottomSheet(
                                  address:
                                      user?.address ??
                                      "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
                                ),
                              );
                            },
                          ),
                        ),
                        Gap(8.w),
                        Expanded(
                          child: _buildQuickActionCard(
                            context,
                            SvgPicture.string(
                              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 22H18V20C18 18.3431 16.6569 17 15 17H9C7.34315 17 6 18.3431 6 20V22H4V20C4 17.2386 6.23858 15 9 15H15C17.7614 15 20 17.2386 20 20V22ZM12 13C8.68629 13 6 10.3137 6 7C6 3.68629 8.68629 1 12 1C15.3137 1 18 3.68629 18 7C18 10.3137 15.3137 13 12 13ZM12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"></path></svg>',
                              width: 32.w,
                              height: 32.w,
                              colorFilter: const ColorFilter.mode(
                                Color(0xFF001F3F),
                                BlendMode.srcIn,
                              ),
                            ),
                            "Profile",
                            onTap: () => context.push('/profile'),
                          ),
                        ),
                      ],
                    ),

                    Gap(40.h),

                    ...(() {
                      final list = bondsAsync.valueOrNull;
                      final bonds = (list != null && list.isNotEmpty)
                          ? list
                          : <Bond>[];
                      return [BentoGrid(bonds: bonds)];
                    })(),
                    Gap(24.h), // Minimal bottom safe area
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickActionCard(
    BuildContext context,
    Widget icon,
    String label, {
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            height: 64.w,
            width: 64.w,
            decoration: BoxDecoration(
              color: Colors.white, // Full grey button
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10.r,
                  offset: Offset(0, 4.h),
                ),
              ],
            ),
            child: Center(child: icon),
          ),
          Gap(12.h),
          Text(
            label,
            style: GoogleFonts.manrope(
              color: Colors.black87, // Softer black
              fontWeight: FontWeight.w500, // Medium weight
              fontSize: 12.sp, // Smaller, cleaner
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
