import 'dart:ui';
import 'package:flutter/material.dart';
import 'common.dart';

/// Glassmorphic action button matching the exact UI of the bottom nav
/// back/search circle buttons: blur, gradient, border.
/// Used in sidebar layout for Back and Search/Chat buttons.
class GlassmorphicActionButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool isDark;
  final String? tooltip;
  final double width;
  final double height;
  /// Which side to draw the glass border (for visual separation from content)
  final AxisDirection borderOnSide;
  final bool isActive;

  const GlassmorphicActionButton({
    super.key,
    required this.icon,
    required this.onTap,
    required this.isDark,
    this.tooltip,
    this.width = 56,
    this.height = 56,
    this.borderOnSide = AxisDirection.right,
    this.isActive = false,
  });

  @override
  Widget build(BuildContext context) {
    final isCircle = width <= height * 1.1;
    final borderRadius = isCircle ? null : BorderRadius.circular(height / 2);

    // Build the base button content
    final buttonContent = isCircle
        ? _buildCircle(size: width)
        : _buildPill(borderRadius: borderRadius!);

    // Wrap with gesture detector
    final gestureWidget = GestureDetector(
      onTap: onTap,
      child: Container(
        width: width,
        height: height,
        decoration: const BoxDecoration(),
        child: buttonContent,
      ),
    );

    // Conditionally add tooltip with proper overlay check
    if (tooltip != null && tooltip!.isNotEmpty) {
      return _TooltipWrapper(
        tooltip: tooltip!,
        child: gestureWidget,
      );
    }
    return gestureWidget;
  }

  Widget _buildCircle({required double size}) {
    return Container(
      decoration: const BoxDecoration(shape: BoxShape.circle),
      child: ClipOval(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: isDark
                    ? [
                        Colors.black.withOpacity(0.16),
                        Colors.black.withOpacity(0.04),
                      ]
                    : [
                        Colors.white.withOpacity(0.8),
                        Colors.white.withOpacity(0.4),
                      ],
              ),
              shape: BoxShape.circle,
            ),
            child: Stack(
              children: [
                Center(
                  child: Icon(
                    icon,
                    color: isActive
                        ? (isDark ? Colors.white : Colors.black87)
                        : (isDark ? Colors.white.withOpacity(0.8) : Colors.black87),
                    size: 28,
                  ),
                ),
                Positioned.fill(
                  child: CustomPaint(
                    painter: GlassmorphicBorderPainter(
                      isDark: isDark,
                      borderRadius: size / 2,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPill({required BorderRadius borderRadius}) {
    return ClipRRect(
      borderRadius: borderRadius,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: isDark
                  ? [
                      Colors.black.withOpacity(0.16),
                      Colors.black.withOpacity(0.04),
                    ]
                  : [
                      Colors.white.withOpacity(0.8),
                      Colors.white.withOpacity(0.4),
                    ],
            ),
            borderRadius: borderRadius,
          ),
          child: Stack(
            children: [
              Center(
                child: Icon(
                  icon,
                  color: isActive
                      ? (isDark ? Colors.white : Colors.black87)
                      : (isDark ? Colors.white.withOpacity(0.8) : Colors.black87),
                  size: 28,
                ),
              ),
              Positioned.fill(
                child: CustomPaint(
                  painter: GlassmorphicBorderPainter(
                    isDark: isDark,
                    borderRadius: height / 2,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Wrapper widget that conditionally adds tooltip only when overlay is available
class _TooltipWrapper extends StatelessWidget {
  final String tooltip;
  final Widget child;

  const _TooltipWrapper({
    required this.tooltip,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    // Check if overlay is available using maybeOf
    final overlay = Overlay.maybeOf(context);
    if (overlay != null) {
      return Tooltip(
        message: tooltip,
        child: child,
      );
    }
    // No overlay available, return child without tooltip
    return child;
  }
}
