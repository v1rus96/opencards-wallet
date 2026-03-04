import 'dart:ui';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:get_storage/get_storage.dart';
import 'glassmorphic_bottom_nav.dart';
import 'glassmorphic_action_bar.dart';
import 'common.dart';

/// Safe TextField wrapper that handles disposed controllers gracefully
class _SafeTextField extends StatefulWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final bool isDark;
  final bool isEditing;
  final String hintText;
  final VoidCallback onChanged;

  const _SafeTextField({
    super.key,
    required this.controller,
    required this.focusNode,
    required this.isDark,
    required this.isEditing,
    required this.hintText,
    required this.onChanged,
  });

  @override
  State<_SafeTextField> createState() => _SafeTextFieldState();
}


class _SafeTextFieldState extends State<_SafeTextField> {
  bool _isControllerValid = true;

  @override
  void initState() {
    super.initState();
    _checkController();
  }

  @override
  void didUpdateWidget(_SafeTextField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      _checkController();
    }
  }

  void _checkController() {
    if (!mounted) {
      _isControllerValid = false;
      return;
    }
    try {
      // Try to access the controller to verify it's not disposed
      // Accessing value will throw if controller is disposed
      final _ = widget.controller.value;
      _isControllerValid = true;
    } catch (e) {
      // Controller is disposed or invalid
      _isControllerValid = false;
      if (mounted) {
        // Don't update state if widget is disposed
        setState(() {});
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Re-check controller validity before building
    if (!mounted) {
      return const SizedBox.shrink();
    }
    
    // Verify controller is still valid before building TextField
    // Don't build TextField if controller is disposed
    if (!_isControllerValid) {
      return const SizedBox.shrink();
    }
    
    // Double-check controller is still valid by trying to access it
    try {
      // This will throw if controller is disposed
      final _ = widget.controller.value;
    } catch (_) {
      // Controller disposed, don't build TextField
      _isControllerValid = false;
      return const SizedBox.shrink();
    }

    // Use a key that includes controller validity to prevent rebuilding with disposed controller
    return TextField(
      key: ValueKey('safe_textfield_${widget.controller.hashCode}_${_isControllerValid}'),
      controller: widget.controller,
      focusNode: widget.focusNode,
      enableInteractiveSelection: false,
      onChanged: (_) {
        if (mounted) widget.onChanged();
      },
      style: TextStyle(
        color: widget.isDark ? Colors.white : Colors.black87,
        fontSize: 16,
        fontWeight: FontWeight.w500,
      ),
      cursorColor: widget.isDark ? Colors.white.withOpacity(0.8) : Colors.black87,
      decoration: InputDecoration(
        hintText: widget.isEditing ? 'Edit message...' : widget.hintText,
        hintStyle: TextStyle(
          color: widget.isDark ? Colors.white.withOpacity(0.4) : Colors.black38,
          fontSize: 16,
          fontWeight: FontWeight.w400,
        ),
        border: InputBorder.none,
        enabledBorder: InputBorder.none,
        focusedBorder: InputBorder.none,
        errorBorder: InputBorder.none,
        disabledBorder: InputBorder.none,
        contentPadding: const EdgeInsets.symmetric(vertical: 12),
        filled: false,
      ),
    );
  }
}

// Removed _ButtonBorderPainter and _InputBorderPainter as they are now in common.dart
// Removed MorphingBottomNavConfig as it is now in common.dart

class MorphingBottomNav extends StatefulWidget {
  final int selectedIndex;
  final Function(int) onDestinationSelected;
  final List<BottomNavItem> navItems;
  final MorphingBottomNavConfig config;
  final Function(String)? onSend;
  final Widget Function(VoidCallback onClose, VoidCallback onFullscreen)? floatingContentBuilder;
  final TextEditingController? externalInputController;

  const MorphingBottomNav({
    super.key,
    required this.selectedIndex,
    required this.onDestinationSelected,
    required this.navItems,
    this.config = const MorphingBottomNavConfig(),
    this.onSend,
    this.floatingContentBuilder,
    this.externalInputController,
  });

  @override
  State<MorphingBottomNav> createState() => _MorphingBottomNavState();
}

class _MorphingBottomNavState extends State<MorphingBottomNav>
    with SingleTickerProviderStateMixin {
  bool _isSearchMode = false;
  bool _isChatWindowVisible = false;
  VoidCallback? _onFullscreen;
  late AnimationController _morphController;
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  final ScrollController _chatScrollController = ScrollController();
  static const double _searchButtonSize = 70.0;

  bool get _effectiveSearchMode =>
      _isSearchMode || widget.config.forceInputBarExpanded;

  @override
  void initState() {
    super.initState();
    final isEconomyMode = GetStorage().read('economy_mode') ?? false;
    _morphController = AnimationController(
      duration: isEconomyMode ? Duration.zero : const Duration(milliseconds: 300),
      vsync: this,
    );
    if (widget.config.forceInputBarExpanded) {
      _isSearchMode = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _morphController.forward();
      });
    }
  }

  @override
  void didUpdateWidget(MorphingBottomNav oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.config.forceInputBarExpanded != widget.config.forceInputBarExpanded) {
      if (widget.config.forceInputBarExpanded) {
        setState(() => _isSearchMode = true);
        _morphController.forward();
      } else {
        if (_isChatWindowVisible) setState(() => _isChatWindowVisible = false);
        setState(() => _isSearchMode = false);
        _morphController.reverse();
        _searchFocusNode.unfocus();
        if (widget.externalInputController == null) {
          _searchController.clear();
        } else {
          widget.externalInputController!.clear();
        }
      }
    }
    // Collapse search mode only when action bar CHANGES from inactive to active (e.g. navigating to a detail page)
    if (widget.config.isActionBar && !oldWidget.config.isActionBar && _isSearchMode && !widget.config.forceInputBarExpanded) {
      setState(() {
        _isSearchMode = false;
        _isChatWindowVisible = false;
      });
      _morphController.reverse();
      _searchFocusNode.unfocus();
    }
  }

  @override
  void dispose() {
    _morphController.dispose();
    if (widget.externalInputController == null) {
      _searchController.dispose();
    }
    _searchFocusNode.dispose();
    _chatScrollController.dispose();
    super.dispose();
  }

  TextEditingController? get _inputController {
    if (!mounted) return null;
    return widget.externalInputController ?? _searchController;
  }

  void _toggleSearchMode() {
    if (!_isSearchMode) {
      // Opening search mode
      setState(() {
        _isSearchMode = true;
      });
      _morphController.forward();
      // Delay chat window until after morph animation completes (only if enabled)
      if (widget.config.enableFloatingWindow) {
        Future.delayed(const Duration(milliseconds: 350), () {
          if (mounted) {
            setState(() {
              _isChatWindowVisible = true;
            });
            widget.config.onChatWindowVisibilityChanged?.call(true);
          }
        });
      }
      // Wait for the morph animation (300ms) to complete so the TextField is fully in the tree and Overlay is ready.
      Future.delayed(const Duration(milliseconds: 350), () {
        // Ensure widget is mounted, search mode is still active, AND Overlay is available
        if (mounted && _isSearchMode) {
          try {
            _searchFocusNode.requestFocus();
          } catch (e) {
            debugPrint('Error requesting focus: $e');
          }
        }
      });
    } else {
      // Closing search mode - hide chat first, then morph
      if (_isChatWindowVisible && widget.config.enableFloatingWindow) {
        setState(() {
          _isChatWindowVisible = false;
        });
        widget.config.onChatWindowVisibilityChanged?.call(false);
      }
      // Wait for chat to fade out, then trigger morph
      Future.delayed(const Duration(milliseconds: 100), () {
        if (mounted) {
          setState(() {
            _isSearchMode = false;
          });
          _morphController.reverse();
          _searchFocusNode.unfocus();
          if (widget.externalInputController == null) {
            _searchController.clear();
          } else {
            widget.externalInputController!.clear();
          }
        }
      });
    }
  }

  void _handleFullscreen() {
    // Close the chat window first, then trigger the fullscreen callback
    _closeChatWindow();
    _onFullscreen?.call();
  }

  void _closeChatWindow() {
    if (widget.config.enableFloatingWindow) {
      setState(() {
        _isChatWindowVisible = false;
      });
      widget.config.onChatWindowVisibilityChanged?.call(false);
      // Also exit search mode after a delay
      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted && !_isChatWindowVisible && _isSearchMode) {
          _toggleSearchMode();
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final searchModeHeight = 56.0; // Smaller height in search mode
    final normalHeight = 70.0; // Normal height
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    // Store the root context BEFORE wrapping with Overlay.
    // This context has the Navigator ancestor needed for bottom sheets.
    final rootContext = context;

    // Wrap with Overlay to provide ancestor for TextField/EditableText widgets.
    // This fixes the "No Overlay widget found" error when text fields get focus.
    return Overlay(
      initialEntries: [
        OverlayEntry(
          builder: (overlayContext) {
            final isEconomyMode = GetStorage().read('economy_mode') ?? false;
            return AnimatedContainer(
              duration: isEconomyMode ? Duration.zero : const Duration(milliseconds: 300),
              height: _isChatWindowVisible && widget.config.enableFloatingWindow
                  ? screenHeight * 0.75
                  : normalHeight + 24 + MediaQuery.of(context).viewInsets.bottom,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  // Progressive dark shadow gradient (from top transparent to dark at bottom)
                  Positioned(
            left: 0,
            right: 0,
            bottom: MediaQuery.of(context).viewInsets.bottom,
            child: IgnorePointer(
              child: Container(
                height: 120, // Extended height for smoother gradient
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: isDark ? [
                      Colors.black.withOpacity(0.0),
                      Colors.black.withOpacity(0.1),
                      Colors.black.withOpacity(0.5),
                      Colors.black.withOpacity(0.95),
                    ] : [
                      Colors.white.withOpacity(0.0),
                      Colors.white.withOpacity(0.4),
                      Colors.white.withOpacity(0.8),
                      Colors.white.withOpacity(0.95),
                    ],
                    stops: const [0.0, 0.4, 0.75, 1.0],
                  ),
                ),
              ),
            ),
          ),
                  // Floating chat window with fade transition (only if enabled)
                  if (widget.config.enableFloatingWindow && (_isChatWindowVisible || _isSearchMode))
                    AnimatedPositioned(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeOutExpo, // Snappier entrance
                      left: 16,
                      right: 16,
                      bottom: (_isChatWindowVisible ? 120 : -500) + MediaQuery.of(context).viewInsets.bottom, // Slide up/down
                      child: IgnorePointer(
                        ignoring: !_isChatWindowVisible,
                        child: AnimatedOpacity(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut,
                          opacity: _isChatWindowVisible ? 1.0 : 0.0,
                          child: _buildFloatingChatWindow(isDark),
                        ),
                      ),
                    ),
                  // Bottom navigation — symmetric horizontal padding so bar is centered with equal side spacing
                  Positioned(
            left: 0,
            right: 0,
            bottom: MediaQuery.of(context).viewInsets.bottom,
            child: Padding(
              padding: EdgeInsets.only(
                left: 6 + MediaQuery.paddingOf(context).left,
                right: 8 + MediaQuery.paddingOf(context).right, // Reduced from 12 to 8 for tighter spacing
                bottom: 24,
              ),
              child: Builder(
                builder: (context) {
                  // Check if we're in "back button only" mode (hideNavItems + showBackButton + no search + no real nav items)
                  // In this case, show ONLY the back button with no spacers or expanded areas
                  // navItems might have a dummy item (transparent, empty label) - check for that too
                  final isBackButtonOnlyMode = widget.config.hideNavItems && 
                      widget.config.showBackButton && 
                      !widget.config.showSearchButton && 
                      !_effectiveSearchMode &&
                      widget.config.centerWidget == null &&
                      (widget.navItems.isEmpty || 
                       (widget.navItems.length == 1 && 
                        widget.navItems.first.label.isEmpty && 
                        widget.navItems.first.color == Colors.transparent));
                  
                  if (isBackButtonOnlyMode) {
                    // Back button only mode - button on the bottom left
                    return Align(
                      alignment: Alignment.centerLeft,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.start,
                        children: [
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                            width: normalHeight,
                            height: normalHeight,
                            decoration: const BoxDecoration(),
                            clipBehavior: Clip.hardEdge,
                            child: AnimatedOpacity(
                              duration: const Duration(milliseconds: 200),
                              opacity: 1.0,
                              child: _buildBackButton(isDark),
                            ),
                          ),
                        ],
                      ),
                    );
                  }
                  
                  // Normal mode - show back button with spacers and other elements
                  return Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Main back button only when collapsed; when expanded we show mini back only (left of input)
                      Builder(
                        builder: (context) {
                          final isEconomyMode = GetStorage().read('economy_mode') ?? false;
                          return AnimatedContainer(
                            duration: isEconomyMode ? Duration.zero : const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                            width: (widget.config.showBackButton && !_effectiveSearchMode) ? normalHeight : 0,
                            height: normalHeight,
                            decoration: const BoxDecoration(),
                            clipBehavior: Clip.hardEdge,
                            child: AnimatedOpacity(
                              duration: isEconomyMode ? Duration.zero : const Duration(milliseconds: 200),
                              opacity: (widget.config.showBackButton && !_effectiveSearchMode) ? 1.0 : 0.0,
                              child: _buildBackButton(isDark),
                            ),
                          );
                        },
                      ),
                      Builder(
                        builder: (context) {
                          final isEconomyMode = GetStorage().read('economy_mode') ?? false;
                          return AnimatedContainer(
                            duration: isEconomyMode ? Duration.zero : const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                            width: (widget.config.showBackButton && !_effectiveSearchMode) ? 16 : 0,
                          );
                        },
                      ),
                      // Morphing navbar/circle button with animation (hidden when hideNavItems is true)
                      if (!_effectiveSearchMode)
                        Expanded(
                          child: Builder(
                            builder: (context) {
                              final isEconomyMode = GetStorage().read('economy_mode') ?? false;
                              return AnimatedContainer(
                                duration: isEconomyMode ? Duration.zero : const Duration(milliseconds: 400),
                                curve: Curves.fastLinearToSlowEaseIn,
                                height: normalHeight,
                                child: AnimatedSwitcher(
                                  duration: isEconomyMode ? Duration.zero : const Duration(milliseconds: 300),
                                  layoutBuilder: (Widget? currentChild, List<Widget> previousChildren) {
                                    return Stack(
                                      fit: StackFit.expand,
                                      alignment: Alignment.center,
                                      children: <Widget>[
                                        ...previousChildren,
                                        if (currentChild != null) currentChild,
                                      ],
                                    );
                                  },
                                  transitionBuilder: (Widget child, Animation<double> animation) {
                                    if (isEconomyMode) return child;
                                    final offsetAnimation = Tween<Offset>(
                                      begin: const Offset(0.0, 1.0), // Always Enter from Bottom
                                      end: Offset.zero,
                                    ).animate(CurvedAnimation(
                                      parent: animation,
                                      curve: Curves.easeOutCubic,
                                    ));
                                    return SlideTransition(
                                      position: offsetAnimation,
                                      child: child,
                                    );
                                  },
                                  child: widget.config.centerWidget != null
                                      ? widget.config.isActionBar
                                          ? GlassmorphicActionBar(
                                              key: const ValueKey('action_bar'),
                                              actionColor: widget.config.actionColor ?? const Color(0xFFF59E0B),
                                              child: Center(
                                                key: const ValueKey('center_widget'),
                                                child: widget.config.centerWidget!,
                                              ),
                                            )
                                          : Center(
                                              key: const ValueKey('center_widget'),
                                              child: widget.config.centerWidget!,
                                            )
                                      : widget.config.hideNavItems
                                          ? SizedBox.expand(key: const ValueKey('hidden_nav'))
                                          : GlassmorphicBottomNav(
                                              key: ValueKey('navbar_${widget.config.depth}'),
                                              selectedIndex: widget.selectedIndex,
                                              onDestinationSelected: widget.onDestinationSelected,
                                              items: widget.navItems,
                                            ),
                                ),
                              );
                            },
                          ),
                        ),
                      // Circle nav button when in search mode (hidden when forceInputBarExpanded + back, e.g. chat room)
                      Builder(
                        builder: (context) {
                          final isEconomyMode = GetStorage().read('economy_mode') ?? false;
                          return AnimatedContainer(
                            duration: isEconomyMode ? Duration.zero : const Duration(milliseconds: 400),
                            curve: Curves.fastLinearToSlowEaseIn,
                            width: (!widget.config.hideNavItems && _effectiveSearchMode && !(widget.config.forceInputBarExpanded && widget.config.showBackButton)) ? searchModeHeight : 0,
                            height: searchModeHeight,
                            clipBehavior: Clip.hardEdge,
                            decoration: const BoxDecoration(),
                            child: _buildCircleNavButton(isDark),
                          );
                        },
                      ),
                      // Spacer when nav items hidden (smaller so mini back sits more to the left on chat room)
                      Builder(
                        builder: (context) {
                          final isEconomyMode = GetStorage().read('economy_mode') ?? false;
                          return AnimatedContainer(
                            duration: isEconomyMode ? Duration.zero : const Duration(milliseconds: 400),
                            curve: Curves.fastLinearToSlowEaseIn,
                            width: _effectiveSearchMode ? 4 : 8, // Reduced from 16 to 8 for better spacing
                            height: searchModeHeight, // Add explicit height constraint to fix interpolation error
                          );
                        },
                      ),
                      // Mini close (X) button when floating chat is open on e.g. lessons / lesson details
                      if (_effectiveSearchMode && widget.config.showMiniCloseButton) ...[
                        _buildMiniCloseButton(isDark, searchModeHeight),
                        const SizedBox(width: 8),
                      ],
                      // Mini back button (when input expanded) – same size as send button; tap collapses or runs onMiniBackPressed
                      if (_effectiveSearchMode && widget.config.showMiniBackButton) ...[
                        _buildMiniBackButton(isDark, searchModeHeight),
                        const SizedBox(width: 8),
                      ],
                      // Morphing search button/input with animation
                      if (_effectiveSearchMode)
                        Flexible(
                          child: Builder(
                            builder: (context) {
                              final isEconomyMode = GetStorage().read('economy_mode') ?? false;
                              return AnimatedContainer(
                                duration: isEconomyMode ? Duration.zero : const Duration(milliseconds: 300),
                                curve: Curves.easeInOut,
                                height: searchModeHeight,
                                child: AnimatedSwitcher(
                                  duration: isEconomyMode ? Duration.zero : const Duration(milliseconds: 200),
                                  switchInCurve: Curves.easeIn,
                                  switchOutCurve: Curves.easeOut,
                                  transitionBuilder: (child, animation) {
                                    return isEconomyMode ? child : FadeTransition(
                                      opacity: animation,
                                      child: child,
                                    );
                                  },
                                  child: _buildSearchInput(isDark, rootContext),
                                ),
                              );
                            },
                          ),
                        )
                      else if (widget.config.showSearchButton && !widget.config.forceInputBarExpanded)
                        Builder(
                          builder: (context) {
                            final isEconomyMode = GetStorage().read('economy_mode') ?? false;
                            return AnimatedContainer(
                              duration: isEconomyMode ? Duration.zero : const Duration(milliseconds: 300),
                              curve: Curves.easeInOut,
                              width: normalHeight,
                              height: normalHeight,
                              child: AnimatedSwitcher(
                                duration: isEconomyMode ? Duration.zero : const Duration(milliseconds: 200),
                                switchInCurve: Curves.easeIn,
                                switchOutCurve: Curves.easeOut,
                                transitionBuilder: (child, animation) {
                                  return isEconomyMode ? child : FadeTransition(
                                    opacity: animation,
                                    child: child,
                                  );
                                },
                                child: _buildSearchButton(isDark),
                              ),
                            );
                          },
                        ),
                      // Send button appears when input bar is visible (if enabled)
                      if (_effectiveSearchMode && widget.config.enableSendButton) ...[
                        const SizedBox(width: 8),
                        Builder(
                          builder: (context) {
                            final isEconomyMode = GetStorage().read('economy_mode') ?? false;
                            return AnimatedContainer(
                              duration: isEconomyMode ? Duration.zero : const Duration(milliseconds: 300),
                              curve: Curves.easeInOut,
                              width: searchModeHeight,
                              height: searchModeHeight,
                              child: _buildSendButton(isDark),
                            );
                          },
                        ),
                      ],
                    ],
                  );
                },
              ),
            ),
          ),
        ],
      ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildCircleNavButton(bool isDark) {
    final isEconomyMode = GetStorage().read('economy_mode') ?? false;
    return GestureDetector(
      key: const ValueKey('circle_nav'),
      onTap: _toggleSearchMode,
      child: Container(
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
        ),
        child: ClipOval(
          child: isEconomyMode
              ? Container(
                  decoration: BoxDecoration(
                    color: isDark ? Colors.black : Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isDark ? Colors.white.withOpacity(0.1) : Colors.black.withOpacity(0.1),
                      width: 1,
                    ),
                  ),
                  child: Center(
                    child: Icon(
                      widget.navItems[widget.selectedIndex].icon,
                      color: isDark ? Colors.white : Colors.black87,
                      size: 28,
                    ),
                  ),
                )
              : BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
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
                      shape: BoxShape.circle,
                    ),
                    child: Stack(
                      children: [
                        // Colored glow effect for selected item
                        Center(
                          child: Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: widget.navItems[widget.selectedIndex].color
                                      .withOpacity(0.6),
                                  blurRadius: 20,
                                  spreadRadius: 5,
                                ),
                              ],
                            ),
                          ),
                        ),
                        // Icon
                        Center(
                          child: Icon(
                            widget.navItems[widget.selectedIndex].icon,
                            color: isDark ? Colors.white : Colors.black87,
                            size: 28,
                          ),
                        ),
                        // Navbar-style gradient border
                        Positioned.fill(
                          child: CustomPaint(
                            painter: GlassmorphicBorderPainter(isDark: isDark),
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

  Widget _buildBackButton(bool isDark) {
    final isEconomyMode = GetStorage().read('economy_mode') ?? false;
    return GestureDetector(
      key: const ValueKey('back_button'),
      onTap: widget.config.onBackPressed,
      child: Container(
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
        ),
        child: ClipOval(
          child: isEconomyMode
              ? Container(
                  decoration: BoxDecoration(
                    color: isDark ? Colors.black : Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isDark ? Colors.white.withOpacity(0.1) : Colors.black.withOpacity(0.1),
                      width: 1,
                    ),
                  ),
                  child: Center(
                    child: Icon(
                      widget.config.backIcon ?? Icons.arrow_back_rounded,
                      color: isDark ? Colors.white : Colors.black87,
                      size: 28,
                    ),
                  ),
                )
              : BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
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
                shape: BoxShape.circle,
              ),
              child: Stack(
                children: [
                  Center(
                    child: Icon(
                      widget.config.backIcon ?? Icons.arrow_back_rounded,
                      color: isDark ? Colors.white.withOpacity(0.8) : Colors.black87,
                      size: 28,
                    ),
                  ),
                  // Navbar-style gradient border
                  Positioned.fill(
                    child: CustomPaint(
                      painter: GlassmorphicBorderPainter(isDark: isDark),
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

  Widget _buildMiniCloseButton(bool isDark, double size) {
    final isEconomyMode = GetStorage().read('economy_mode') ?? false;
    return SizedBox(
      width: size,
      height: size,
      child: GestureDetector(
        key: const ValueKey('mini_close_button'),
        onTap: _closeChatWindow,
        child: ClipOval(
          child: isEconomyMode
              ? Container(
                  decoration: BoxDecoration(
                    color: isDark ? Colors.black : Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isDark ? Colors.white.withOpacity(0.1) : Colors.black.withOpacity(0.1),
                      width: 1,
                    ),
                  ),
                  child: Center(
                    child: Icon(
                      Icons.close_rounded,
                      size: 26,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                )
              : BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: isDark
                      ? [Colors.black.withOpacity(0.16), Colors.black.withOpacity(0.04)]
                      : [Colors.white.withOpacity(0.8), Colors.white.withOpacity(0.4)],
                ),
                shape: BoxShape.circle,
              ),
              child: Stack(
                children: [
                  Center(
                    child: Icon(
                      Icons.close_rounded,
                      size: 26,
                      color: isDark ? Colors.white.withOpacity(0.9) : Colors.black87,
                    ),
                  ),
                  Positioned.fill(
                    child: CustomPaint(
                      painter: GlassmorphicBorderPainter(isDark: isDark),
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

  Widget _buildMiniBackButton(bool isDark, double size) {
    final isEconomyMode = GetStorage().read('economy_mode') ?? false;
    return SizedBox(
      width: size,
      height: size,
      child: GestureDetector(
        key: const ValueKey('mini_back_button'),
        onTap: () {
          if (widget.config.onMiniBackPressed != null) {
            widget.config.onMiniBackPressed!();
          } else {
            _toggleSearchMode();
          }
        },
        child: ClipOval(
          child: isEconomyMode
              ? Container(
                  decoration: BoxDecoration(
                    color: isDark ? Colors.black : Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isDark ? Colors.white.withOpacity(0.1) : Colors.black.withOpacity(0.1),
                      width: 1,
                    ),
                  ),
                  child: Center(
                    child: Icon(
                      Icons.arrow_back_ios_rounded,
                      size: 22,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                )
              : BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: isDark
                      ? [Colors.black.withOpacity(0.16), Colors.black.withOpacity(0.04)]
                      : [Colors.white.withOpacity(0.8), Colors.white.withOpacity(0.4)],
                ),
                shape: BoxShape.circle,
              ),
              child: Stack(
                children: [
                  Center(
                    child: Icon(
                      Icons.arrow_back_ios_rounded,
                      size: 22,
                      color: isDark ? Colors.white.withOpacity(0.9) : Colors.black87,
                    ),
                  ),
                  Positioned.fill(
                    child: CustomPaint(
                      painter: GlassmorphicBorderPainter(isDark: isDark),
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

  Widget _buildSearchButton(bool isDark) {
    final isEconomyMode = GetStorage().read('economy_mode') ?? false;
    final unreadCount = widget.config.chatUnreadCount;
    final showBadge = unreadCount > 0;
    return Stack(
      clipBehavior: Clip.none,
      children: [
        SizedBox(
          width: _searchButtonSize,
          height: _searchButtonSize,
          child: GestureDetector(
            key: const ValueKey('search_button'),
            onTap: widget.config.onFabPressed ?? _toggleSearchMode,
            child: Container(
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
              ),
              child: ClipOval(
              child: isEconomyMode
                  ? Container(
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isDark ? Colors.white.withOpacity(0.1) : Colors.black.withOpacity(0.1),
                          width: 1,
                        ),
                      ),
                      child: Center(
                        child: Icon(
                          widget.config.searchIcon,
                          color: isDark ? Colors.white : Colors.black87,
                          size: 28,
                        ),
                      ),
                    )
                  : BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
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
                    shape: BoxShape.circle,
                  ),
                  child: Stack(
                    children: [
                      Center(
                        child: Icon(
                          widget.config.searchIcon,
                          color: isDark ? Colors.white.withOpacity(0.5) : Colors.black54,
                          size: 28,
                        ),
                      ),
                      // Navbar-style gradient border
                      Positioned.fill(
                        child: CustomPaint(
                          painter: GlassmorphicBorderPainter(isDark: isDark),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
        ),
        // Unread count badge at top-right of chat button
        if (showBadge)
          Positioned(
            top: -4,
            right: -4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
              decoration: BoxDecoration(
                color: Colors.red,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.25),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              alignment: Alignment.center,
              child: Text(
                unreadCount > 99 ? '99+' : unreadCount.toString(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildInputBarLeftIcon(bool isDark) {
    final icon = Icon(
      widget.config.inputBarLeftIcon,
      color: isDark ? Colors.white.withOpacity(0.7) : Colors.black54,
      size: 24,
    );
    final onPressed = widget.config.onInputBarLeftIconPressed;
    if (onPressed == null) return icon;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => onPressed(context),
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: icon,
        ),
      ),
    );
  }

  Widget _buildInputBarRightIcon(bool isDark, BuildContext rootContext) {
    final iconData = widget.config.inputBarRightIcon!;
    final icon = Icon(
      iconData,
      color: isDark ? Colors.white.withOpacity(0.7) : Colors.black54,
      size: 22,
    );
    final onPressed = widget.config.onInputBarRightIconPressed;
    if (onPressed == null) return icon;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        // Use rootContext which has Navigator ancestor for bottom sheets
        onTap: () => onPressed(rootContext),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
          child: icon,
        ),
      ),
    );
  }

  Widget _buildReplyPreviewRow(bool isDark) {
    final text = widget.config.replyPreviewText ?? '';
    if (text.isEmpty) return const SizedBox.shrink();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 10, 8, 6),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.06),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.reply_rounded,
            size: 18,
            color: isDark ? Colors.white.withOpacity(0.7) : Colors.black54,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 13,
                color: isDark ? Colors.white.withOpacity(0.85) : Colors.black87,
                fontWeight: FontWeight.w500,
              ),
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
            ),
          ),
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: widget.config.onCancelReply,
              borderRadius: BorderRadius.circular(16),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
                child: Icon(
                  Icons.close_rounded,
                  size: 18,
                  color: isDark ? Colors.white70 : Colors.black54,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchInput(bool isDark, BuildContext rootContext) {
    final isEditing = widget.config.isEditing;
    final gradientColors = isEditing
        ? (isDark
            ? [Colors.blueAccent.withOpacity(0.2), Colors.blueAccent.withOpacity(0.08)]
            : [Colors.blueAccent.withOpacity(0.12), Colors.blueAccent.withOpacity(0.05)])
        : (isDark
            ? [Colors.white.withOpacity(0.12), Colors.white.withOpacity(0.04)]
            : [Colors.black.withOpacity(0.05), Colors.black.withOpacity(0.02)]);
    final borderColor = isEditing
        ? Colors.blueAccent.withOpacity(0.4)
        : (isDark ? Colors.white.withOpacity(0.2) : Colors.black.withOpacity(0.08));

    return Container(
      key: const ValueKey('search_input'),
      constraints: const BoxConstraints(
        minHeight: 56,
        maxHeight: 200,
      ),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        border: Border.all(
          color: borderColor,
          width: 1.5,
        ),
      ),
      child: Builder(
        builder: (context) {
          final isEconomyMode = GetStorage().read('economy_mode') ?? false;
          final inputContent = Container(
            decoration: BoxDecoration(
              color: isEconomyMode
                  ? (isDark ? Colors.black : Colors.white)
                  : null,
              gradient: isEconomyMode
                  ? null
                  : LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: gradientColors,
                    ),
              borderRadius: BorderRadius.circular(28),
              border: isEconomyMode
                  ? Border.all(
                      color: isDark ? Colors.white.withOpacity(0.1) : Colors.black.withOpacity(0.1),
                      width: 1.5,
                    )
                  : null,
            ),
            child: Stack(
              fit: StackFit.expand,
              children: [
                ConstrainedBox(
                  constraints: const BoxConstraints(
                    minHeight: 56,
                    maxHeight: 200,
                  ),
                  child: SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.start,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (widget.config.replyPreviewText != null &&
                            widget.config.replyPreviewText!.isNotEmpty &&
                            widget.config.onCancelReply != null)
                          _buildReplyPreviewRow(isDark),
                        Row(
                          children: [
                            if (widget.config.showInputBarLeftIcon) ...[
                              const SizedBox(width: 14),
                              _buildInputBarLeftIcon(isDark),
                              const SizedBox(width: 10),
                            ] else
                              const SizedBox(width: 6), // Minimal left padding when attach is on the right
                            Expanded(
                              child: Builder(
                                builder: (context) {
                                  // Check if widget is still mounted first
                                  if (!mounted) {
                                    return const SizedBox.shrink();
                                  }
                                  
                                  final controller = _inputController;
                                  if (controller == null) {
                                    return const SizedBox.shrink();
                                  }
                                  
                                  // Wrap TextField in a widget that checks controller validity
                                  // Use a key to prevent rebuilding with disposed controller
                                  return _SafeTextField(
                                    key: ValueKey('textfield_${controller.hashCode}'),
                                    controller: controller,
                                    focusNode: _searchFocusNode,
                                    isDark: isDark,
                                    isEditing: isEditing,
                                    hintText: widget.config.searchHintText,
                                    onChanged: () {
                                      if (mounted) setState(() {});
                                    },
                                  );
                                },
                              ),
                            ),
                            // Clear button when text is entered (except when editing)
                            Builder(
                              builder: (context) {
                                final controller = _inputController;
                                if (controller == null) return const SizedBox.shrink();
                                try {
                                  final text = controller.text;
                                  if (text.isNotEmpty && !isEditing) {
                                    return GestureDetector(
                                      onTap: () {
                                        try {
                                          controller.clear();
                                          if (mounted) setState(() {});
                                        } catch (_) {
                                          // Controller disposed, ignore
                                        }
                                      },
                                      child: Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                                        child: Icon(
                                          Icons.clear_rounded,
                                          color: isDark ? Colors.white.withOpacity(0.6) : Colors.black45,
                                          size: 20,
                                        ),
                                      ),
                                    );
                                  }
                                  return const SizedBox.shrink();
                                } catch (_) {
                                  return const SizedBox.shrink();
                                }
                              },
                            ),
                            // Attach file button
                            if (widget.config.inputBarRightIcon != null && widget.config.onInputBarRightIconPressed != null)
                              _buildInputBarRightIcon(isDark, rootContext),
                            // Cancel edit button (X only)
                            if (isEditing && widget.config.onCancelEdit != null)
                              Material(
                                color: Colors.transparent,
                                child: InkWell(
                                  onTap: widget.config.onCancelEdit,
                                  borderRadius: BorderRadius.circular(16),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                                    child: Icon(
                                      Icons.close_rounded,
                                      size: 18,
                                      color: isDark ? Colors.white70 : Colors.black54,
                                    ),
                                  ),
                                ),
                              ),
                            const SizedBox(width: 6),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                if (!isEconomyMode)
                  Positioned.fill(
                    child: IgnorePointer(
                      child: CustomPaint(
                        painter: GlassmorphicBorderPainter(isDark: isDark, borderRadius: 28),
                      ),
                    ),
                  ),
              ],
            ),
          );
          
          return ClipRRect(
            borderRadius: BorderRadius.circular(28),
            child: isEconomyMode
                ? inputContent
                : BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                    child: inputContent,
                  ),
          );
        },
      ),
    );
  }

  Widget _buildSendButton(bool isDark) {
    final isEconomyMode = GetStorage().read('economy_mode') ?? false;
    return GestureDetector(
      onTap: () {
        final controller = _inputController;
        if (controller == null) return;
        try {
          final text = controller.text.trim();
          final canSendWithEmptyText = widget.externalInputController != null && widget.onSend != null;
          if (text.isNotEmpty || canSendWithEmptyText) {
            controller.clear();
            if (mounted) setState(() {}); // Force rebuild so TextField shows empty immediately
            if (widget.onSend != null) {
              widget.onSend!(text);
            } else {
              debugPrint('Searching for: $text');
            }
            _searchFocusNode.requestFocus();
          }
        } catch (_) {
          // Controller disposed, ignore
        }
      },
      child: Container(
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
        ),
        child: ClipOval(
          child: isEconomyMode
              ? Container(
                  decoration: BoxDecoration(
                    color: isDark ? Colors.black : Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isDark ? Colors.white.withOpacity(0.1) : Colors.black.withOpacity(0.1),
                      width: 1,
                    ),
                  ),
                  child: Center(
                    child: Icon(
                      Icons.send_rounded,
                      color: isDark ? Colors.white : Colors.black87,
                      size: 22,
                    ),
                  ),
                )
              : BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
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
                shape: BoxShape.circle,
              ),
              child: Stack(
                children: [
                  Center(
                    child: Icon(
                      Icons.send_rounded,
                      color: isDark ? Colors.white.withOpacity(0.9) : Colors.black87,
                      size: 22,
                    ),
                  ),
                  // Navbar-style gradient border
                  Positioned.fill(
                    child: CustomPaint(
                      painter: GlassmorphicBorderPainter(isDark: isDark),
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

  Widget _buildFloatingChatWindow(bool isDark) {
    const chatHeight = 400.0;
    final isEconomyMode = GetStorage().read('economy_mode') ?? false;
    
    return TweenAnimationBuilder<double>(
      duration: isEconomyMode ? Duration.zero : const Duration(milliseconds: 400),
      tween: Tween<double>(begin: 0.0, end: 1.0),
      curve: Curves.easeOutExpo, // Snappier scale/fade
      builder: (context, value, child) {
        return Transform.scale(
          scale: 0.85 + (value * 0.15), // Scale from 0.85 to 1.0
          child: Opacity(
            opacity: value, // Fade from 0 to 1
            child: child,
          ),
        );
      },
      child: SizedBox(
        height: chatHeight,
        child: widget.floatingContentBuilder?.call(_closeChatWindow, _handleFullscreen) ?? Container(
          height: chatHeight,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 30,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Builder(
            builder: (context) {
              final isEconomyMode = GetStorage().read('economy_mode') ?? false;
              final chatContent = Container(
                decoration: BoxDecoration(
                  color: isEconomyMode
                      ? (isDark ? Colors.black : Colors.white)
                      : null,
                  gradient: isEconomyMode
                      ? null
                      : LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: isDark ? [
                            Colors.white.withOpacity(0.06),
                            Colors.white.withOpacity(0.02),
                          ] : [
                            Colors.white.withOpacity(0.9),
                            Colors.white.withOpacity(0.8),
                          ],
                        ),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.05),
                    width: 1.5,
                  ),
                ),
                child: RepaintBoundary(
                  child: Column(
                    children: [
                      // Chat window header
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          border: Border(
                            bottom: BorderSide(
                              color: isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.05),
                              width: 1,
                            ),
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.chat_bubble_rounded,
                              color: isDark ? Colors.white.withOpacity(0.9) : Colors.black87,
                              size: 24,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                widget.config.chatWindowTitle,
                                style: TextStyle(
                                  color: isDark ? Colors.white.withOpacity(0.9) : Colors.black87,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            IconButton(
                              icon: Icon(
                                Icons.close_rounded,
                                color: isDark ? Colors.white.withOpacity(0.8) : Colors.black54,
                                size: 24,
                              ),
                              onPressed: _closeChatWindow,
                            ),
                          ],
                        ),
                      ),
                      // Chat content area
                      Expanded(
                        child: ListView(
                          controller: _chatScrollController,
                          padding: const EdgeInsets.all(16),
                          children: [
                            _buildChatMessage(
                              widget.config.welcomeMessage,
                              isSystem: true,
                              isDark: isDark,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
              
              return ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: isEconomyMode
                    ? chatContent
                    : BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                        child: chatContent,
                      ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildChatMessage(String message, {bool isSystem = false, required bool isDark}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isSystem
            ? (isDark ? Colors.white.withOpacity(0.03) : Colors.black.withOpacity(0.03))
            : (isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.06)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        message,
        style: TextStyle(
          color: isDark ? Colors.white.withOpacity(0.9) : Colors.black87,
          fontSize: 14,
          fontWeight: FontWeight.w400,
        ),
      ),
    );
  }
}
