import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/home/presentation/home_screen.dart';
import '../features/invest/presentation/success_screen.dart';
import '../features/invest/presentation/explore_screen.dart';
import '../features/profile/presentation/profile_screen.dart';
import '../features/history/presentation/history_screen.dart';
import '../features/auth/presentation/providers.dart';
import '../features/kyc/screens/kyc_scanner_screen.dart';
import '../features/analysis/presentation/analysis_screen.dart';
import '../features/analysis/presentation/asset_detail_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final isLoggedIn = authState.value != null;
      final isLoggingIn = state.uri.toString() == '/login';

      if (isLoggedIn && isLoggingIn) {
        return '/';
      }

      // If not logged in and not on login page, redirect to login
      // Exception: Allow deep links or specific public pages if any (none for now)
      if (!isLoggedIn && !isLoggingIn) {
        return '/login';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/', builder: (context, state) => const HomeScreen()),
      GoRoute(
        path: '/success',
        builder: (context, state) {
          return SuccessScreen(extra: state.extra);
        },
      ),
      GoRoute(
        path: '/explore',
        builder: (context, state) => const ExploreScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/history',
        builder: (context, state) => const HistoryScreen(),
      ),
      GoRoute(
        path: '/kyc-scanner',
        builder: (context, state) => const KycScannerScreen(),
      ),
      GoRoute(
        path: '/analysis',
        builder: (context, state) => const AnalysisScreen(),
      ),
      GoRoute(
        path: '/asset-detail',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return AssetDetailScreen(extra: extra);
        },
      ),
    ],
    // Handle unmatched deep links (like Web3Auth callback)
    errorBuilder: (context, state) {
      // If it's a Web3Auth callback, redirect to home
      if (state.uri.toString().contains('auth')) {
        return const HomeScreen();
      }
      return const LoginScreen();
    },
  );
});
