// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:nanobonds/main.dart';

void main() {
  testWidgets('App boots to login', (WidgetTester tester) async {
    // Set screen size to ensure ScreenUtil works
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 3.0;

    // Reset view after test
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const ProviderScope(child: MyApp()));
    await tester.pump(const Duration(seconds: 2));

    expect(find.text('nanobonds'), findsOneWidget);
    expect(find.text('Sign in with Google'), findsOneWidget);
  });
}
