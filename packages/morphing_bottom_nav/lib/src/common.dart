import 'package:flutter/material.dart';

/// Configuration class for MorphingBottomNav and GlassmorphicSidebar
class MorphingBottomNavConfig {
  /// Icon for the FAB / chat button (bottom nav) that opens the chat.
  final IconData searchIcon;
  /// Icon on the left of the input bar (e.g. attach).
  final IconData inputBarLeftIcon;
  /// Called when the input bar left icon (attach) is tapped. Receives [BuildContext] for showing dialogs/sheets.
  final void Function(BuildContext context)? onInputBarLeftIconPressed;
  /// When false, left icon and extra left spacing are hidden (e.g. chat room with attach on right).
  final bool showInputBarLeftIcon;

  /// Icon on the right of the input bar (e.g. attach when left is hidden).
  final IconData? inputBarRightIcon;
  /// Called when the input bar right icon is tapped.
  final void Function(BuildContext context)? onInputBarRightIconPressed;
  final bool enableFloatingWindow;
  final bool enableSendButton;
  final String searchHintText;
  final String chatWindowTitle;
  /// Optional room description (e.g. from GET room info). Shown below title in floating chat header.
  final String? chatRoomDescription;
  final String welcomeMessage;
  final bool showBackButton;
  final IconData? backIcon;
  final VoidCallback? onBackPressed;
  final bool hideNavItems;
  final int depth;
  const MorphingBottomNavConfig({
    this.searchIcon = Icons.search_rounded,
    this.inputBarLeftIcon = Icons.attach_file_rounded,
    this.onInputBarLeftIconPressed,
    this.showInputBarLeftIcon = true,
    this.inputBarRightIcon,
    this.onInputBarRightIconPressed,
    this.enableFloatingWindow = true,
    this.enableSendButton = true,

    this.searchHintText = 'Search...',
    this.chatWindowTitle = 'Search Results',
    this.chatRoomDescription,
    this.welcomeMessage = 'Welcome! Start typing to search...',
    this.showBackButton = false,
    this.backIcon,
    this.onBackPressed,
    this.hideNavItems = false,
    this.depth = 0,
    this.onFabPressed,
    this.centerWidget,
    this.actionColor,
    this.isActionBar = false,
    this.showSearchButton = true,
    this.chatUnreadCount = 0,
    this.isEditing = false,
    this.onCancelEdit,
    this.replyPreviewText,
    this.onCancelReply,

    this.forceInputBarExpanded = false,
    this.showMiniBackButton = false,
    this.onMiniBackPressed,
    this.showMiniCloseButton = false,
    this.onChatWindowVisibilityChanged,
  });
  

  final VoidCallback? onFabPressed;
  final Widget? centerWidget;
  final Color? actionColor;
  final bool isActionBar;
  final bool showSearchButton;
  /// Unread count to show on the chat/search button (top-right badge). 0 = no badge.
  final int chatUnreadCount;
  final bool isEditing;
  final VoidCallback? onCancelEdit;
  /// When non-empty, show "Replying to ..." above the input field with a cancel button.
  final String? replyPreviewText;
  /// Called when user cancels the reply (e.g. tap X on reply preview).
  final VoidCallback? onCancelReply;
  /// When true, the input bar is always expanded (no FAB). Used e.g. on chat room screen.
  final bool forceInputBarExpanded;
  /// When true, show a small back button next to the input bar (e.g. to leave chat room).
  final bool showMiniBackButton;
  /// Called when the mini back button is tapped.
  final VoidCallback? onMiniBackPressed;
  /// When true, show a small X button next to the input bar to close the floating chat (e.g. on lessons / lesson details).
  final bool showMiniCloseButton;
  /// Called when the floating chat window visibility changes (true = open, false = closed). Use to e.g. block taps on content behind.
  final void Function(bool isVisible)? onChatWindowVisibilityChanged;
}

/// Sidebar destination item (same data as BottomNavItem, for sidebar use)
class SidebarDestination {
  final IconData icon;
  final IconData? selectedIcon;
  final String label;
  final Color color;
  final bool showProBadge;

  const SidebarDestination({
    required this.icon,
    this.selectedIcon,
    required this.label,
    required this.color,
    this.showProBadge = false,
  });
}

/// Custom painter for button borders matching navbar style.
/// When [borderRadius] is 0, uses a full circle/pill (min dimension / 2) so
/// circle buttons get a visible rounded border.
class GlassmorphicBorderPainter extends CustomPainter {
  final bool isDark;
  final double borderRadius;

  GlassmorphicBorderPainter({required this.isDark, this.borderRadius = 0});

  @override
  void paint(Canvas canvas, Size size) {
    const strokeWidth = 1.5;
    if (size.width <= strokeWidth || size.height <= strokeWidth) return;
    // Inset the rect by half the stroke width so the glassy border
    // is fully visible inside the clipped circle/pill, and not cut off.
    final rect = Rect.fromLTWH(
      strokeWidth / 2,
      strokeWidth / 2,
      size.width - strokeWidth,
      size.height - strokeWidth,
    );
    final radius = borderRadius > 0
        ? borderRadius
        : (rect.width < rect.height ? rect.width : rect.height) / 2;
    final rrect = RRect.fromRectAndRadius(rect, Radius.circular(radius));

    final paint = Paint()
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
      ..strokeWidth = strokeWidth;

    canvas.drawRRect(rrect, paint);
  }

  @override
  bool shouldRepaint(GlassmorphicBorderPainter oldDelegate) => oldDelegate.isDark != isDark || oldDelegate.borderRadius != borderRadius;
}
