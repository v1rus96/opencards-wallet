import 'dart:ui';
import 'package:flutter/material.dart';

class GlassmorphicActionBar extends StatefulWidget {
  final Widget child;
  final Color actionColor;
  final VoidCallback? onTap;

  const GlassmorphicActionBar({
    super.key,
    required this.child,
    this.actionColor = const Color(0xFFF59E0B),
    this.onTap,
  });
  
  @override
  State<GlassmorphicActionBar> createState() => _GlassmorphicActionBarState();
}

class _GlassmorphicActionBarState extends State<GlassmorphicActionBar> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
       duration: const Duration(seconds: 4),
       vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: widget.onTap,
      behavior: HitTestBehavior.opaque,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(35),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
          child: Container(
            height: 70,
            width: double.infinity,
            decoration: BoxDecoration(
               gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: isDark ? [
                    Colors.black.withOpacity(0.16),
                    Colors.black.withOpacity(0.04),
                  ] : [
                    Colors.white.withOpacity(0.8),
                    Colors.white.withOpacity(0.4),
                  ],
                ),
                borderRadius: BorderRadius.circular(35),
            ),
            child: Stack(
              children: [
                // Radial gradient glow effect (like active nav item)
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(35),
                      gradient: RadialGradient(
                        center: const Alignment(0.0, 1.2),
                        radius: 1.8,
                        colors: [
                          widget.actionColor.withOpacity(0.7),
                          widget.actionColor.withOpacity(0.3),
                          widget.actionColor.withOpacity(0.0),
                        ],
                        stops: const [0.0, 0.45, 1.0],
                      ),
                    ),
                  ),
                ),
                // Animated border
                Positioned.fill(
                  child: AnimatedBuilder(
                    animation: _controller,
                    builder: (context, child) {
                      return CustomPaint(
                        painter: _GradientBorderPainter(
                          isDark: isDark,
                          animationValue: _controller.value,
                          selectedColor: widget.actionColor,
                        ),
                        child: child,
                      );
                    },
                    child: Center(child: widget.child),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _GradientBorderPainter extends CustomPainter {
  final double animationValue;
  final Color selectedColor;
  final bool isDark;

  _GradientBorderPainter({
    required this.animationValue,
    required this.selectedColor,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (size.width <= 0 || size.height <= 0) return;
    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    final rrect = RRect.fromRectAndRadius(rect, const Radius.circular(35));
    
    // Rotating Sweep Gradient for animated border loop
    final paint = Paint()
      ..shader = SweepGradient(
        colors: [
          selectedColor.withOpacity(0.0),
          selectedColor.withOpacity(0.1),
          selectedColor.withOpacity(1.0),
          selectedColor.withOpacity(0.1),
          selectedColor.withOpacity(0.0),
        ],
        stops: const [0.0, 0.1, 0.25, 0.4, 0.5],
        transform: GradientRotation(animationValue * 2 * 3.14159), // Rotate 360 deg
      ).createShader(rect)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0;

    final path = Path()..addRRect(rrect);
    canvas.drawPath(path, paint);
    
    // Add white border overlay (Glassmorphic effect)
    final whitePaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: isDark ? [
          Colors.white.withOpacity(0.6),
          Colors.white.withOpacity(0.2),
        ] : [
          Colors.black.withOpacity(0.2),
          Colors.black.withOpacity(0.05),
        ],
      ).createShader(rect)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    
    canvas.drawPath(path, whitePaint);
  }

  @override
  bool shouldRepaint(_GradientBorderPainter oldDelegate) {
    return oldDelegate.animationValue != animationValue ||
        oldDelegate.selectedColor != selectedColor ||
        oldDelegate.isDark != isDark;
  }
}
