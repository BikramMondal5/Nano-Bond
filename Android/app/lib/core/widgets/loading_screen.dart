import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';

/// A loading screen widget that displays a Lottie animation
/// on a white background while waiting for backend data.
class LoadingScreen extends StatelessWidget {
  const LoadingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: SizedBox(
          width: 150,
          height: 150,
          child: Lottie.asset(
            'assets/animation/Loading.json',
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
}
