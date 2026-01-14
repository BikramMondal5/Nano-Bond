# Flutter R8/Proguard Rules for GBond

# Ignore warnings from dependencies using reflection or optional modules
# These are required to fix the "Missing classes detected while running R8" error
-dontwarn com.google.errorprone.annotations.**
-dontwarn javax.naming.**
-dontwarn org.bouncycastle.jsse.**
-dontwarn org.conscrypt.**
-dontwarn org.openjsse.**
-dontwarn org.slf4j.impl.**
-dontwarn com.google.crypto.tink.**

# ML Kit Text Recognition optional languages
-dontwarn com.google.mlkit.vision.text.chinese.**
-dontwarn com.google.mlkit.vision.text.devanagari.**
-dontwarn com.google.mlkit.vision.text.japanese.**
-dontwarn com.google.mlkit.vision.text.korean.**
