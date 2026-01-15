import 'package:flutter/material.dart';

class PremiumPageTransitionsBuilder extends PageTransitionsBuilder {
  const PremiumPageTransitionsBuilder();

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    // Custom "Premium" feel:
    // 1. Slide from right (standard) but with a custom curve
    // 2. Slight fade in
    // 3. Small parallax effect on exit could be added, but let's stick to entrance first.

    const begin = Offset(1.0, 0.0);
    const end = Offset.zero;

    // Apple uses a curve similar to cubic(0.25, 0.1, 0.25, 1.0)
    // Material Standard is often standardEasing
    // We'll use a slightly more "snappy" but smooth curve
    const curve = Curves.fastOutSlowIn;

    final tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
    final offsetAnimation = animation.drive(tween);

    // Add a subtle fade for extra smoothness
    final fadeAnimation = CurvedAnimation(
      parent: animation,
      curve: const Interval(0.0, 0.5, curve: Curves.easeIn),
    );

    return SlideTransition(
      position: offsetAnimation,
      child: FadeTransition(opacity: fadeAnimation, child: child),
    );
  }
}
