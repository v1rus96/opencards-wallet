import 'dart:ui';
import 'package:flutter/material.dart';
import 'common.dart';

/// Glassmorphic sidebar: all navigation in one vertical list (icon + label).
/// placed vertically on the left for tablet/laptop/desktop.
/// Uses same blur, gradient, border radius, nav item style (icon + label, glow).
/// Optionally shows a back/home button at the bottom inside the sidebar.
class GlassmorphicSidebar extends StatefulWidget {
  final int selectedIndex;
  final ValueChanged<int> onDestinationSelected;
  final List<SidebarDestination> destinations;
  /// When true (desktop), show labels to the right of icons; when false (tablet), icons only.
  final bool isExtended;
  /// When true, show back/home button at the bottom of the sidebar (inside the panel).
  final bool showBackButton;
  final VoidCallback? onBackPressed;
  final IconData? backIcon;

  const GlassmorphicSidebar({
    super.key,
    required this.selectedIndex,
    required this.onDestinationSelected,
    required this.destinations,
    this.isExtended = true,
    this.showBackButton = false,
    this.onBackPressed,
    this.backIcon,
  });

  @override
  State<GlassmorphicSidebar> createState() => _GlassmorphicSidebarState();
}

class _GlassmorphicSidebarState extends State<GlassmorphicSidebar>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _positionAnimation;
  late Animation<Color?> _colorAnimation;

  static const double _itemHeight = 56.0;
  static const double _cornerRadius = 20.0;
  static const double _sidebarWidthExtended = 200.0;
  static const double _sidebarWidthCompact = 64.0;

  @override
  void initState() {
    super.initState();
    final count = widget.destinations.length;
    final safeIndex = count == 0 ? 0 : widget.selectedIndex.clamp(0, count - 1);
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _positionAnimation = Tween<double>(
      begin: safeIndex.toDouble(),
      end: safeIndex.toDouble(),
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    ));
    _colorAnimation = ColorTween(
      begin: count > 0 ? widget.destinations[safeIndex].color : Colors.transparent,
      end: count > 0 ? widget.destinations[safeIndex].color : Colors.transparent,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOutCubic,
    ));
  }

  @override
  void didUpdateWidget(GlassmorphicSidebar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selectedIndex != widget.selectedIndex) {
      _animateToIndex(oldWidget.selectedIndex, widget.selectedIndex);
    }
  }

  void _animateToIndex(int fromIndex, int toIndex) {
    final count = widget.destinations.length;
    if (count == 0) return;
    final safeFrom = fromIndex.clamp(0, count - 1);
    final safeTo = toIndex.clamp(0, count - 1);
    _positionAnimation = Tween<double>(
      begin: safeFrom.toDouble(),
      end: safeTo.toDouble(),
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOutCubic,
      ),
    );
    _colorAnimation = ColorTween(
      begin: widget.destinations[safeFrom].color,
      end: widget.destinations[safeTo].color,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeInOutCubic,
      ),
    );
    _controller.forward(from: 0);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final count = widget.destinations.length;
    if (count == 0) return const SizedBox.shrink();

    final safeSelectedIndex = widget.selectedIndex.clamp(0, count - 1);
    final hasBack = widget.showBackButton && widget.onBackPressed != null;
    // Glow/border position: back is first row (index 0), nav items start at 1
    final selectedPosition = hasBack ? 1.0 + safeSelectedIndex.toDouble() : safeSelectedIndex.toDouble();
    final totalRows = count + (hasBack ? 1 : 0);
    final width = widget.isExtended ? _sidebarWidthExtended : _sidebarWidthCompact;

    return Padding(
      padding: EdgeInsets.only(left: widget.isExtended ? 12 : 8, top: 16, bottom: 16),
      child: SizedBox(
        width: width,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(_cornerRadius),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: isDark
                      ? [
                          Colors.white.withOpacity(0.08),
                          Colors.white.withOpacity(0.02),
                        ]
                      : [
                          Colors.white.withOpacity(0.85),
                          Colors.white.withOpacity(0.5),
                        ],
                ),
                borderRadius: BorderRadius.circular(_cornerRadius),
                border: Border.all(
                  color: isDark ? Colors.white.withOpacity(0.12) : Colors.black.withOpacity(0.06),
                  width: 1,
                ),
              ),
              child: Stack(
                children: [
                  // Glow under selected nav item only (not under back)
                  AnimatedBuilder(
                    animation: _controller,
                    builder: (context, child) {
                      final position = _controller.isAnimating
                          ? (hasBack ? 1.0 + _positionAnimation.value : _positionAnimation.value)
                          : selectedPosition;
                      final glowColor = _controller.isAnimating
                          ? (_colorAnimation.value ??
                              widget.destinations[safeSelectedIndex].color)
                          : widget.destinations[safeSelectedIndex].color;
                      return Positioned(
                        left: 6,
                        top: _itemHeight * position + 4,
                        right: 6,
                        height: _itemHeight - 8,
                        child: Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: glowColor.withOpacity(0.35),
                                blurRadius: 20,
                                spreadRadius: 0,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                  // Subtle gradient border along full sidebar
                  AnimatedBuilder(
                    animation: _controller,
                    builder: (context, child) {
                      final position = _controller.isAnimating
                          ? (hasBack ? 1.0 + _positionAnimation.value : _positionAnimation.value)
                          : selectedPosition;
                      final borderColor = _controller.isAnimating
                          ? (_colorAnimation.value ??
                              widget.destinations[safeSelectedIndex].color)
                          : widget.destinations[safeSelectedIndex].color;
                      return CustomPaint(
                        painter: _VerticalGradientBorderPainter(
                          position: position,
                          itemCount: totalRows,
                          itemHeight: _itemHeight,
                          selectedColor: borderColor,
                          isDark: isDark,
                          cornerRadius: _cornerRadius,
                        ),
                        child: const SizedBox.expand(),
                      );
                    },
                  ),
                  // One list: Back (if any) then all nav items
                  LayoutBuilder(
                    builder: (context, constraints) {
                      return SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        physics: const BouncingScrollPhysics(),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (hasBack)
                              _SidebarBackButton(
                                icon: widget.backIcon ?? Icons.arrow_back_rounded,
                                label: 'Back',
                                onTap: widget.onBackPressed!,
                                isExtended: widget.isExtended,
                                sidebarWidth: width,
                                itemHeight: _itemHeight,
                              ),
                            ...List.generate(
                              count,
                              (index) => _SidebarNavItem(
                                destination: widget.destinations[index],
                                isSelected: safeSelectedIndex == index,
                                isExtended: widget.isExtended,
                                sidebarWidth: width,
                                itemHeight: _itemHeight,
                                onTap: () => widget.onDestinationSelected(index),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SidebarNavItem extends StatelessWidget {
  final SidebarDestination destination;
  final bool isSelected;
  final bool isExtended;
  final double sidebarWidth;
  final double itemHeight;
  final VoidCallback onTap;

  const _SidebarNavItem({
    required this.destination,
    required this.isSelected,
    required this.isExtended,
    required this.sidebarWidth,
    required this.itemHeight,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final icon = isSelected
        ? (destination.selectedIcon ?? destination.icon)
        : destination.icon;
    final iconSize = isExtended ? 22.0 : 24.0;
    final iconColor = isDark
        ? (isSelected ? Colors.white : Colors.white70)
        : (isSelected ? Colors.black87 : Colors.black54);

    return SizedBox(
      height: itemHeight,
      width: sidebarWidth,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: EdgeInsets.symmetric(
              horizontal: isExtended ? 12 : 8,
              vertical: 8,
            ),
            child: isExtended
                ? Row(
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: [
                      Stack(
                        clipBehavior: Clip.none,
                        children: [
                          Icon(icon, color: iconColor, size: iconSize),
                          if (destination.showProBadge)
                            Positioned(
                              top: -4,
                              right: -6,
                              child: Container(
                                padding: const EdgeInsets.all(2),
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [Color(0xFFFFD700), Color(0xFFFFA500)],
                                  ),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.workspace_premium, size: 10, color: Colors.white),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          destination.label,
                          style: TextStyle(
                            color: iconColor,
                            fontSize: 13,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        ),
                      ),
                    ],
                  )
                : Center(
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Icon(icon, color: iconColor, size: iconSize),
                        if (destination.showProBadge)
                          Positioned(
                            top: -4,
                            right: -6,
                            child: Container(
                              padding: const EdgeInsets.all(2),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Color(0xFFFFD700), Color(0xFFFFA500)],
                                ),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.workspace_premium, size: 10, color: Colors.white),
                            ),
                          ),
                      ],
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}

/// Back button at the top of the sidebar (same row style as nav items).
class _SidebarBackButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isExtended;
  final double sidebarWidth;
  final double itemHeight;

  const _SidebarBackButton({
    required this.icon,
    required this.label,
    required this.onTap,
    required this.isExtended,
    required this.sidebarWidth,
    required this.itemHeight,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final iconColor = isDark ? Colors.white70 : Colors.black54;
    final iconSize = isExtended ? 22.0 : 24.0;
    return SizedBox(
      height: itemHeight,
      width: sidebarWidth,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: EdgeInsets.symmetric(
              horizontal: isExtended ? 12 : 8,
              vertical: 8,
            ),
            child: isExtended
                ? Row(
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: [
                      Icon(icon, color: iconColor, size: iconSize),
                      const SizedBox(width: 12),
                      Text(
                        label,
                        style: TextStyle(
                          color: iconColor,
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                    ],
                  )
                : Center(
                    child: Icon(icon, color: iconColor, size: iconSize),
                  ),
          ),
        ),
      ),
    );
  }
}

/// Vertical variant of the bottom nav gradient border: highlight follows selected index along the vertical axis.
class _VerticalGradientBorderPainter extends CustomPainter {
  final double position;
  final int itemCount;
  final double itemHeight;
  final Color selectedColor;
  final bool isDark;
  final double cornerRadius;

  _VerticalGradientBorderPainter({
    required this.position,
    required this.itemCount,
    required this.itemHeight,
    required this.selectedColor,
    required this.isDark,
    required this.cornerRadius,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    final rrect = RRect.fromRectAndRadius(
      rect,
      Radius.circular(cornerRadius),
    );
    final center = itemHeight * position + itemHeight / 2;

    final paint = Paint()
      ..shader = LinearGradient(
        colors: [
          selectedColor.withOpacity(0.0),
          selectedColor.withOpacity(1.0),
          selectedColor.withOpacity(1.0),
          selectedColor.withOpacity(0.0),
        ],
        stops: const [0.0, 0.45, 0.55, 1.0],
        begin: Alignment(0, (center - itemHeight / 2) / size.height * 2 - 1),
        end: Alignment(0, (center + itemHeight / 2) / size.height * 2 - 1),
      ).createShader(rect)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0;

    final path = Path()..addRRect(rrect);
    canvas.drawPath(path, paint);

    final whitePaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: isDark
            ? [
                Colors.white.withOpacity(0.6),
                Colors.white.withOpacity(0.2),
              ]
            : [
                Colors.black.withOpacity(0.2),
                Colors.black.withOpacity(0.05),
              ],
      ).createShader(rect)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawPath(path, whitePaint);
  }

  @override
  bool shouldRepaint(_VerticalGradientBorderPainter oldDelegate) {
    return oldDelegate.position != position ||
        oldDelegate.itemHeight != itemHeight ||
        oldDelegate.selectedColor != selectedColor ||
        oldDelegate.isDark != isDark;
  }
}
