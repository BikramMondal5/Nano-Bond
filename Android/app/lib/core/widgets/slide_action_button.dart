import 'package:flutter/material.dart';
import 'package:nanobonds/core/theme/theme.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:flutter_screenutil/flutter_screenutil.dart';

class SlideActionButton extends StatefulWidget {
  final String text;
  final VoidCallback? onSlideComplete;
  final Color? backgroundColor;
  final Color? thumbColor;
  final double? height;
  final bool isLoading;
  final bool enabled;

  const SlideActionButton({
    super.key,
    required this.text,
    this.onSlideComplete,
    this.backgroundColor,
    this.thumbColor,
    this.height,
    this.isLoading = false,
    this.enabled = true,
  });

  @override
  State<SlideActionButton> createState() => _SlideActionButtonState();
}

class _SlideActionButtonState extends State<SlideActionButton>
    with SingleTickerProviderStateMixin {
  double _dragValue = 0.0;
  double _maxWidth = 0.0;
  bool _submitted = false;

  @override
  Widget build(BuildContext context) {
    // Default height 56.h
    final effectiveHeight = widget.height?.h ?? 56.h;

    final isEnabled = widget.enabled && widget.onSlideComplete != null;
    final bgColor = isEnabled
        ? (widget.backgroundColor ?? AppColors.primary)
        : Colors.grey[400]!;

    return LayoutBuilder(
      builder: (context, constraints) {
        _maxWidth = constraints.maxWidth;
        final thumbSize = effectiveHeight - 8.w;
        final maxDrag = _maxWidth - thumbSize - 8.w;

        return Container(
          height: effectiveHeight,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(effectiveHeight / 2),
            boxShadow: [
              BoxShadow(
                color: bgColor.withValues(alpha: 0.3),
                blurRadius: 10.r,
                offset: Offset(0, 4.h),
              ),
            ],
          ),
          child: Stack(
            children: [
              // Centered Text
              Center(
                child: Opacity(
                  opacity:
                      1.0 - _dragValue.clamp(0.0, 1.0), // Fade text as you drag
                  child: Text(
                    widget.text,
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontSize: 18.sp,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),

              // Loading Indicator (if submitting)
              if (widget.isLoading)
                Center(
                  child: SizedBox(
                    width: 24.w,
                    height: 24.h,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2.w,
                    ),
                  ),
                ),

              // Draggable Thumb
              if (!widget.isLoading)
                Positioned(
                  left: 4.w + (maxDrag * _dragValue),
                  top: 4.h, // padding for thumb
                  child: GestureDetector(
                    onHorizontalDragUpdate: isEnabled
                        ? (details) {
                            if (_submitted) return;
                            setState(() {
                              double delta = details.primaryDelta! / maxDrag;
                              _dragValue = (_dragValue + delta).clamp(0.0, 1.0);
                            });
                          }
                        : null,
                    onHorizontalDragEnd: isEnabled
                        ? (details) {
                            if (_submitted) return;
                            if (_dragValue > 0.8) {
                              // Complete
                              setState(() {
                                _dragValue = 1.0;
                                _submitted = true;
                              });
                              widget.onSlideComplete?.call();
                            } else {
                              // Snap back
                              setState(() {
                                _dragValue = 0.0;
                              });
                            }
                          }
                        : null,
                    child: Container(
                      width: thumbSize,
                      height: thumbSize,
                      decoration: BoxDecoration(
                        color: widget.thumbColor ?? Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 4.r,
                          ),
                        ],
                      ),
                      child: Center(
                        child: Icon(
                          Icons.arrow_forward_rounded,
                          color: isEnabled
                              ? (widget.backgroundColor ?? AppColors.primary)
                              : Colors.grey[400],
                          size: 24.sp,
                        ),
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
}
