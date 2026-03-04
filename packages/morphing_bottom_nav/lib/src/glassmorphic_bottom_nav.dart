import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:get_storage/get_storage.dart';

class GlassmorphicBottomNav extends StatefulWidget {
  final int selectedIndex;
  final Function(int) onDestinationSelected;
  final List<BottomNavItem> items;

  const GlassmorphicBottomNav({
    super.key,
    required this.selectedIndex,
    required this.onDestinationSelected,
    required this.items,
  });

  @override
  State<GlassmorphicBottomNav> createState() => _GlassmorphicBottomNavState();
}

class _GlassmorphicBottomNavState extends State<GlassmorphicBottomNav>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _positionAnimation;
  late Animation<Color?> _colorAnimation;

  @override
  void initState() {
    super.initState();
    final isEconomyMode = GetStorage().read('economy_mode') ?? false;
    _controller = AnimationController(
      duration: isEconomyMode ? Duration.zero : const Duration(milliseconds: 300),
      vsync: this,
    );
    
    // Initialize animations
    _positionAnimation = Tween<double>(
      begin: widget.selectedIndex.toDouble(),
      end: widget.selectedIndex.toDouble(),
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic, // Smoother slide
    ));
    
    _colorAnimation = ColorTween(
      begin: widget.items[widget.selectedIndex].color,
      end: widget.items[widget.selectedIndex].color,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOutCubic, // Smoother color transition
    ));
  }

  @override
  void didUpdateWidget(GlassmorphicBottomNav oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selectedIndex != widget.selectedIndex) {
      _animateToIndex(oldWidget.selectedIndex, widget.selectedIndex);
    }
  }

  void _animateToIndex(int fromIndex, int toIndex) {
    _positionAnimation = Tween<double>(
      begin: fromIndex.toDouble(),
      end: toIndex.toDouble(),
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOutCubic, // Smoother slide
      ),
    );
    
    _colorAnimation = ColorTween(
      begin: widget.items[fromIndex].color,
      end: widget.items[toIndex].color,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeInOutCubic, // Smoother color transition
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

    return LayoutBuilder(
      builder: (context, constraints) {
        final availableWidth = constraints.maxWidth;
        
        final itemWidth = availableWidth / widget.items.length;
        
        // Check economy mode for performance optimization
        final isEconomyMode = GetStorage().read('economy_mode') ?? false;
        
        return Container(
          width: availableWidth,
          height: 70,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(35),
            child: isEconomyMode
                ? _buildNavContentWithoutBlur(isDark, itemWidth)
                : BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
                    child: Container(
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
                    // Localized glow only around selected item
                    AnimatedBuilder(
                      animation: _controller,
                      builder: (context, child) {
                        final position = _controller.isAnimating
                            ? _positionAnimation.value
                            : widget.selectedIndex.toDouble();
                        final glowColor = _controller.isAnimating
                            ? _colorAnimation.value ?? widget.items[widget.selectedIndex].color
                            : widget.items[widget.selectedIndex].color;
                        
                        return Positioned(
                          left: itemWidth * position - (itemWidth * 0.75), // Shift left to center the wider container
                          top: 0,
                          width: itemWidth * 2.5, // Widen to allow glow overlap
                          height: 70,
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: RadialGradient(
                                center: const Alignment(0.0, 1.4), // Push center slightly below bottom edge for half-circle look
                                radius: 1.0, 
                                colors: [
                                  glowColor.withOpacity(0.5), // Center of glow
                                  glowColor.withOpacity(0.0), // Fade out
                                ],
                                stops: const [0.0, 1.0],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                    // Animated gradient border
                    AnimatedBuilder(
                      animation: _controller,
                      builder: (context, child) {
                        final position = _controller.isAnimating
                            ? _positionAnimation.value
                            : widget.selectedIndex.toDouble();
                        final borderColor = _controller.isAnimating
                            ? _colorAnimation.value ?? widget.items[widget.selectedIndex].color
                            : widget.items[widget.selectedIndex].color;
                        
                        return CustomPaint(
                          painter: _GradientBorderPainter(
                            position: position,
                            itemCount: widget.items.length,
                            selectedColor: borderColor,
                            isDark: isDark,
                          ),
                          child: Container(),
                        );
                      },
                    ),
                    // Nav items
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: List.generate(
                        widget.items.length,
                        (index) => _NavItem(
                          item: widget.items[index],
                          isSelected: widget.selectedIndex == index,
                          onTap: () => widget.onDestinationSelected(index),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
  
  Widget _buildNavContentWithoutBlur(bool isDark, double itemWidth) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? Colors.black : Colors.white,
        borderRadius: BorderRadius.circular(35),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.1) : Colors.black.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: List.generate(
          widget.items.length,
          (index) => _NavItem(
            item: widget.items[index],
            isSelected: widget.selectedIndex == index,
            onTap: () => widget.onDestinationSelected(index),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatefulWidget {
  final BottomNavItem item;
  final bool isSelected;
  final VoidCallback onTap;

  const _NavItem({
    required this.item,
    required this.isSelected,
    required this.onTap,
  });

  @override
  State<_NavItem> createState() => _NavItemState();
}

class _NavItemState extends State<_NavItem> with SingleTickerProviderStateMixin {
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeIn,
    );
    
    // Initialize fade controller with value 1.0 to prevent fade-in on rebuild
    _fadeController.value = 1.0;
  }

  @override
  void didUpdateWidget(_NavItem oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.isSelected != widget.isSelected) {
      if (widget.isSelected) {
        _fadeController.value = 1.0;
      }
    }
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Expanded(
      child: GestureDetector(
        onTap: widget.onTap,
        behavior: HitTestBehavior.opaque,
        child: AnimatedScale(
          scale: widget.isSelected ? 1.0 : 0.88,
          duration: const Duration(milliseconds: 300), // Reduced duration
          curve: Curves.easeOutBack, // Smoother pop
          child: AnimatedOpacity(
            opacity: widget.isSelected ? 1.0 : 0.5,
            duration: const Duration(milliseconds: 300),
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Icon(
                        widget.item.icon,
                        color: isDark ? Colors.white : Colors.black87,
                        size: 26,
                      ),
                      if (widget.item.showProBadge)
                        Positioned(
                          top: -6,
                          right: -8,
                          child: Container(
                            padding: const EdgeInsets.all(2),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [
                                  Color(0xFFFFD700),
                                  Color(0xFFFFA500),
                                ],
                              ),
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.orange.withOpacity(0.5),
                                  blurRadius: 4,
                                  spreadRadius: 1,
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.workspace_premium,
                              size: 12,
                              color: Colors.white,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    widget.item.label,
                    style: TextStyle(
                      color: isDark ? Colors.white : Colors.black87,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
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

class BottomNavItem {
  final IconData icon;
  final IconData? selectedIcon;
  final String label;
  final Color color;
  final bool showProBadge;

  const BottomNavItem({
    required this.icon,
    this.selectedIcon,
    required this.label,
    required this.color,
    this.showProBadge = false,
  });
}

class _GradientBorderPainter extends CustomPainter {
  final double position;
  final int itemCount;
  final Color selectedColor;
  final bool isDark;

  _GradientBorderPainter({
    required this.position,
    required this.itemCount,
    required this.selectedColor,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    final rrect = RRect.fromRectAndRadius(rect, const Radius.circular(35));
    
    final itemWidth = size.width / itemCount;
    final center = itemWidth * position + itemWidth / 2;
    
    final paint = Paint()
      ..shader = LinearGradient(
        colors: [
          selectedColor.withOpacity(0.0),
          selectedColor.withOpacity(1.0),
          selectedColor.withOpacity(1.0),
          selectedColor.withOpacity(0.0),
        ],
        stops: const [0.0, 0.45, 0.55, 1.0],
        begin: Alignment((center - itemWidth / 2) / size.width * 2 - 1, 0),
        end: Alignment((center + itemWidth / 2) / size.width * 2 - 1, 0),
      ).createShader(rect)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0;

    // Draw bottom border glow (clipped to bottom half)
    canvas.save();
    canvas.clipRect(Rect.fromLTWH(0, size.height / 2, size.width, size.height / 2));
    final path = Path()..addRRect(rrect);
    canvas.drawPath(path, paint);
    canvas.restore();
    
    // Add white border overlay
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
    return oldDelegate.position != position ||
        oldDelegate.selectedColor != selectedColor ||
        oldDelegate.isDark != isDark;
  }
}
