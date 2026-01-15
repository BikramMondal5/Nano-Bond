import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'core/theme/theme.dart';
import 'core/router.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'core/widgets/biometric_guard.dart'; // Import Guard

import 'package:flutter/services.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: '.env');

  // Set up transparent system navigation bar
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      systemNavigationBarColor:
          Colors.transparent, // Transparent navigation bar
      systemNavigationBarIconBrightness:
          Brightness.light, // Light icons for dark bg
      statusBarColor: Colors.transparent, // Transparent status bar
      statusBarIconBrightness: Brightness.dark, // Dark icons for light bg
    ),
  );

  // Enable edge-to-edge mode to let app draw behind bars
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ScreenUtilInit(
      designSize: const Size(375, 812),
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (_, child) {
        return MaterialApp.router(
          title: 'nanobonds',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          routerConfig: ref.watch(routerProvider),
          builder: (context, child) {
            // Handle Web3Auth deep link callback & Secure App
            final appContent = child ?? const SizedBox.shrink();
            return BiometricGuard(child: appContent);
          },
        );
      },
    );
  }
}
