import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:camera/camera.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:gap/gap.dart';
import 'package:nanobonds/core/services/kyc_service.dart';
import 'package:nanobonds/core/utils/id_parser.dart';
import 'package:nanobonds/core/widgets/biometric_guard.dart';
import 'package:nanobonds/features/auth/presentation/providers.dart';
import 'package:lottie/lottie.dart';
import 'package:google_fonts/google_fonts.dart';

class KycScannerScreen extends ConsumerStatefulWidget {
  const KycScannerScreen({super.key});

  @override
  ConsumerState<KycScannerScreen> createState() => _KycScannerScreenState();
}

class _KycScannerScreenState extends ConsumerState<KycScannerScreen> {
  CameraController? _cameraController;
  bool _isCameraInitialized = false;
  bool _isProcessing = false;
  Map<String, String> _extractedData = {};

  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    BiometricGuard.isAuthInProgress = true; // Bypass fingerprint during KYC
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        _showError("No cameras found on this device.");
        return;
      }

      final backCamera = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );

      _cameraController = CameraController(
        backCamera,
        ResolutionPreset.high,
        enableAudio: false,
      );

      await _cameraController!.initialize();

      if (mounted) {
        setState(() => _isCameraInitialized = true);
      }
    } catch (e) {
      _showError("Failed to initialize camera: $e");
    }
  }

  @override
  void dispose() {
    BiometricGuard.isAuthInProgress = false; // Re-enable fingerprint
    _cameraController?.dispose();
    super.dispose();
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: GoogleFonts.outfit()),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _captureImage() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }

    try {
      setState(() => _isProcessing = true);

      final XFile photo = await _cameraController!.takePicture();
      await _processImage(File(photo.path));
    } catch (e) {
      setState(() => _isProcessing = false);
      _showError("Failed to capture image: $e");
    }
  }

  Future<void> _pickFromGallery() async {
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: ImageSource.gallery,
      );
      if (pickedFile == null) return;

      setState(() => _isProcessing = true);
      await _processImage(File(pickedFile.path));
    } catch (e) {
      setState(() => _isProcessing = false);
      _showError("Failed to pick image: $e");
    }
  }

  Future<void> _processImage(File imageFile) async {
    try {
      final croppedFile = await ImageCropper().cropImage(
        sourcePath: imageFile.path,
        uiSettings: [
          AndroidUiSettings(
            toolbarTitle: 'Align ID Card',
            toolbarColor: const Color(0xFF1A1A2E),
            toolbarWidgetColor: Colors.white,
            activeControlsWidgetColor: const Color(0xFF6C63FF),
            statusBarLight: false,
            initAspectRatio: CropAspectRatioPreset.ratio3x2,
            lockAspectRatio: false,
            dimmedLayerColor: const Color(0xFF1A1A2E),
            cropFrameColor: const Color(0xFF6C63FF),
            cropGridColor: Colors.white38,
            backgroundColor: const Color(0xFF1A1A2E),
            showCropGrid: true,
          ),
          IOSUiSettings(
            title: 'Align ID Card',
            aspectRatioLockEnabled: false,
            resetAspectRatioEnabled: false,
          ),
        ],
      );

      if (croppedFile == null) {
        setState(() => _isProcessing = false);
        return;
      }

      final inputImage = InputImage.fromFilePath(croppedFile.path);
      final textRecognizer = TextRecognizer(
        script: TextRecognitionScript.latin,
      );
      final RecognizedText recognizedText = await textRecognizer.processImage(
        inputImage,
      );
      textRecognizer.close();

      final parsedData = IdParser.parseText(recognizedText.text);

      setState(() {
        _extractedData = parsedData;
        _isProcessing = false;
      });

      if (parsedData['type'] == 'UNKNOWN') {
        _showError("Could not detect a valid ID. Please try again.");
      } else {
        _showReviewSheet();
      }
    } catch (e) {
      setState(() => _isProcessing = false);
      _showError("Error processing image: $e");
    }
  }

  void _showReviewSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _ReviewSheetContent(extractedData: _extractedData),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Camera Preview
          if (_isCameraInitialized && _cameraController != null)
            ClipRRect(child: CameraPreview(_cameraController!))
          else
            Container(
              color: const Color(0xFF1A1A2E),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(
                      color: const Color(0xFF6C63FF),
                      strokeWidth: 3.w,
                    ),
                    Gap(16.h),
                    Text(
                      "Initializing Camera...",
                      style: GoogleFonts.outfit(
                        color: Colors.white54,
                        fontSize: 14.sp,
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Overlay Frame
          CustomPaint(size: Size.infinite, painter: _ScanFramePainter()),

          // Instruction Text
          Positioned(
            top: size.height * 0.28,
            left: 0,
            right: 0,
            child: Text(
              "Position your ID card within the frame",
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                color: Colors.white70,
                fontSize: 14.sp,
                fontWeight: FontWeight.w400,
              ),
            ),
          ),

          // Top Bar
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.7),
                    Colors.transparent,
                  ],
                ),
              ),
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: 20.w,
                    vertical: 16.h,
                  ),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: Container(
                          padding: EdgeInsets.all(10.w),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12.r),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.2),
                            ),
                          ),
                          child: Icon(
                            Icons.arrow_back_ios_new,
                            color: Colors.white,
                            size: 18.w,
                          ),
                        ),
                      ),
                      Gap(16.w),
                      Text(
                        "Verify Identity",
                        style: GoogleFonts.outfit(
                          color: Colors.white,
                          fontSize: 20.sp,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Bottom Controls
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: EdgeInsets.only(bottom: 50.h, top: 40.h),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.9),
                    Colors.black.withValues(alpha: 0.5),
                    Colors.transparent,
                  ],
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      GestureDetector(
                        onTap: _pickFromGallery,
                        child: Container(
                          padding: EdgeInsets.all(14.w),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(16.r),
                          ),
                          child: Icon(
                            Icons.photo_library_rounded,
                            color: Colors.white,
                            size: 26.w,
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: _captureImage,
                        child: Container(
                          width: 76.w,
                          height: 76.w,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 4.w),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(
                                  0xFF6C63FF,
                                ).withValues(alpha: 0.3),
                                blurRadius: 20.r,
                                spreadRadius: 2.w,
                              ),
                            ],
                          ),
                          child: Container(
                            margin: EdgeInsets.all(6.w),
                            decoration: const BoxDecoration(
                              color: Color(0xFF6C63FF),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.camera_alt_rounded,
                              color: Colors.white,
                              size: 28.w,
                            ),
                          ),
                        ),
                      ),
                      SizedBox(width: 70.w),
                    ],
                  ),
                ],
              ),
            ),
          ),

          if (_isProcessing)
            Positioned.fill(
              child: Container(
                color: Colors.black.withValues(alpha: 0.85),
                child: Column(
                  children: [
                    Expanded(flex: 45, child: const SizedBox()),
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: 32.w,
                        vertical: 28.h,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1A1A2E),
                        borderRadius: BorderRadius.circular(20.r),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircularProgressIndicator(
                            color: const Color(0xFF6C63FF),
                            strokeWidth: 3.w,
                          ),
                          Gap(20.h),
                          Text(
                            "Scanning ID...",
                            style: GoogleFonts.outfit(
                              color: Colors.white,
                              fontSize: 16.sp,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Expanded(flex: 55, child: SizedBox()),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ReviewSheetContent extends StatefulWidget {
  final Map<String, String> extractedData;

  const _ReviewSheetContent({required this.extractedData});

  @override
  State<_ReviewSheetContent> createState() => _ReviewSheetContentState();
}

class _ReviewSheetContentState extends State<_ReviewSheetContent> {
  bool _isVerifying = false;

  @override
  Widget build(BuildContext context) {
    return Consumer(
      builder: (context, ref, child) {
        return Container(
          height: 0.6.sh,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
          ),
          padding: EdgeInsets.all(24.w),
          child: Column(
            children: [
              Container(
                width: 40.w,
                height: 4.h,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2.r),
                ),
              ),
              Gap(24.h),
              SizedBox(
                width: 100.w,
                height: 100.w,
                child: Lottie.asset(
                  'assets/animation/success.json',
                  repeat: false,
                ),
              ),
              Gap(16.h),
              Text(
                "Review Details",
                style: GoogleFonts.outfit(
                  fontSize: 22.sp,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Gap(8.h),
              Text(
                "Confirm details before verification",
                style: GoogleFonts.outfit(color: Colors.grey),
              ),
              Gap(24.h),
              _buildInfoTile("Type", widget.extractedData['type'] ?? "N/A"),
              _buildInfoTile("Number", widget.extractedData['number'] ?? "N/A"),
              _buildInfoTile("DOB", widget.extractedData['dob'] ?? "N/A"),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF6C63FF),
                    padding: EdgeInsets.symmetric(vertical: 16.h),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12.r),
                    ),
                  ),
                  onPressed: _isVerifying
                      ? null
                      : () async {
                          setState(() => _isVerifying = true);

                          try {
                            final authState = ref.read(authStateProvider);
                            final user = authState.value;
                            final userAddress = user?.address;
                            final privateKey = user?.privateKey;

                            if (userAddress == null ||
                                privateKey == null ||
                                privateKey.isEmpty) {
                              throw Exception(
                                "User session invalid. Please re-login.",
                              );
                            }

                            final nationalId = widget.extractedData['number'];
                            final dob = widget.extractedData['dob'];
                            if (nationalId == null) {
                              throw Exception("Identity Number missing");
                            }

                            // Age verification - block users under 18
                            if (dob != null && dob.isNotEmpty) {
                              final age = _calculateAge(dob);
                              if (age != null && age < 18) {
                                throw Exception(
                                  "You must be 18 or older to use this service. Your age: $age years.",
                                );
                              }
                            }

                            // Sign Data
                            final authRepo = ref.read(authRepositoryProvider);
                            final signature = authRepo.signMessage(
                              privateKey,
                              nationalId,
                            );

                            final kycService = KycService();
                            // Call Secure Backend with Hash of ID+DOB
                            final result = await kycService.requestRegistration(
                              address: userAddress,
                              nationalId: nationalId,
                              dob:
                                  dob, // Include DOB in hash for unique identity
                              signature: signature,
                            );

                            final message = result['message'] as String?;
                            final isAlreadyVerified =
                                message == 'Already verified';

                            if (!context.mounted) {
                              return;
                            }

                            Navigator.pop(context); // Close sheet
                            Navigator.pop(context, {
                              'data': widget.extractedData,
                              'isAlreadyVerified': isAlreadyVerified,
                            }); // Return result map

                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  isAlreadyVerified
                                      ? "You are already verified!"
                                      : "KYC Verification Done!",
                                  style: GoogleFonts.outfit(),
                                ),
                                backgroundColor: isAlreadyVerified
                                    ? Colors.blue
                                    : Colors.green,
                              ),
                            );
                          } catch (e) {
                            if (!context.mounted) return;
                            setState(() => _isVerifying = false);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  "Verification Failed: $e",
                                  style: GoogleFonts.outfit(),
                                ),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        },
                  child: _isVerifying
                      ? SizedBox(
                          width: 20.w,
                          height: 20.w,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2.w,
                          ),
                        )
                      : Text(
                          "Confirm & Proceed",
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 16.sp,
                          ),
                        ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  /// Calculate age from DOB string (DD/MM/YYYY or DD-MM-YYYY)
  int? _calculateAge(String dob) {
    try {
      final parts = dob.split(RegExp(r'[/\-]'));
      if (parts.length != 3) return null;

      final day = int.parse(parts[0]);
      final month = int.parse(parts[1]);
      final year = int.parse(parts[2]);

      final birthDate = DateTime(year, month, day);
      final today = DateTime.now();

      int age = today.year - birthDate.year;

      // Adjust if birthday hasn't occurred this year
      if (today.month < birthDate.month ||
          (today.month == birthDate.month && today.day < birthDate.day)) {
        age--;
      }

      return age;
    } catch (e) {
      return null; // Return null if parsing fails
    }
  }

  Widget _buildInfoTile(String label, String value) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 8.h),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.outfit(color: Colors.grey[600], fontSize: 14.sp),
          ),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.w600,
              fontSize: 14.sp,
            ),
          ),
        ],
      ),
    );
  }
}

class _ScanFramePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = Colors.black54;

    final path = Path()..addRect(Rect.fromLTWH(0, 0, size.width, size.height));

    final frameW = size.width * 0.85;
    final frameH = frameW * 0.63;
    final frameL = (size.width - frameW) / 2;
    final frameT = (size.height - frameH) / 2 - 40;

    final frameRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(frameL, frameT, frameW, frameH),
      const Radius.circular(16),
    );

    final cutout = Path()..addRRect(frameRect);
    final overlay = Path.combine(PathOperation.difference, path, cutout);

    canvas.drawPath(overlay, paint);

    final borderPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawRRect(frameRect, borderPaint);

    _drawCorner(canvas, frameRect.outerRect);
  }

  void _drawCorner(Canvas canvas, Rect rect) {
    final paint = Paint()
      ..color = const Color(0xFF6C63FF)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round;

    const radius = 16.0;
    const armLen = 30.0;

    final tlPath = Path()
      ..moveTo(rect.left, rect.top + radius + armLen)
      ..lineTo(rect.left, rect.top + radius)
      ..arcToPoint(
        Offset(rect.left + radius, rect.top),
        radius: const Radius.circular(radius),
      )
      ..lineTo(rect.left + radius + armLen, rect.top);
    canvas.drawPath(tlPath, paint);

    final trPath = Path()
      ..moveTo(rect.right - radius - armLen, rect.top)
      ..lineTo(rect.right - radius, rect.top)
      ..arcToPoint(
        Offset(rect.right, rect.top + radius),
        radius: const Radius.circular(radius),
      )
      ..lineTo(rect.right, rect.top + radius + armLen);
    canvas.drawPath(trPath, paint);

    final blPath = Path()
      ..moveTo(rect.left, rect.bottom - radius - armLen)
      ..lineTo(rect.left, rect.bottom - radius)
      ..arcToPoint(
        Offset(rect.left + radius, rect.bottom),
        radius: const Radius.circular(radius),
        clockwise: false,
      )
      ..lineTo(rect.left + radius + armLen, rect.bottom);
    canvas.drawPath(blPath, paint);

    final brPath = Path()
      ..moveTo(rect.right - radius - armLen, rect.bottom)
      ..lineTo(rect.right - radius, rect.bottom)
      ..arcToPoint(
        Offset(rect.right, rect.bottom - radius),
        radius: const Radius.circular(radius),
        clockwise: false,
      )
      ..lineTo(rect.right, rect.bottom - radius - armLen);
    canvas.drawPath(brPath, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
