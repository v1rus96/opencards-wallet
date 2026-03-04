import 'dart:ui';
import 'package:flutter/material.dart';
import 'common.dart';

class FloatingChatWindow extends StatefulWidget {
  final MorphingBottomNavConfig config;
  final bool isDark;
  final VoidCallback onClose;
  final Widget? child;
  final VoidCallback? onFullscreen;
  /// When false, the close button in the header is hidden (e.g. floating chat on home).
  /// When true, close button is shown (e.g. chat room or when used in contexts that need it).
  final bool showCloseButton;

  const FloatingChatWindow({
    super.key,
    required this.config,
    required this.isDark,
    required this.onClose,
    this.child,
    this.onFullscreen,
    this.showCloseButton = true,
  });

  @override
  State<FloatingChatWindow> createState() => _FloatingChatWindowState();
}

class _FloatingChatWindowState extends State<FloatingChatWindow> {
  final GlobalKey<OverlayState> _overlayKey = GlobalKey<OverlayState>();

  @override
  Widget build(BuildContext context) {
    // Wrap with Overlay to provide ancestor for TextField/EditableText widgets.
    // This fixes the "No Overlay widget found" error when text fields get focus.
    return Overlay(
      key: _overlayKey,
      initialEntries: [
        OverlayEntry(
          builder: (context) => _buildContent(context),
        ),
      ],
    );
  }

  Widget _buildContent(BuildContext context) {
    // Original layout (fixed 400 height, glassmorphic container).
    return ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 500, minWidth: 200),
          child: Container(
          height: 400,
          width: double.infinity,
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
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: widget.isDark ? [
                      Colors.white.withOpacity(0.06),
                      Colors.white.withOpacity(0.02),
                    ] : [
                      Colors.white.withOpacity(0.9),
                      Colors.white.withOpacity(0.8),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: widget.isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.05),
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
                              color: widget.isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.05),
                              width: 1,
                            ),
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.chat_bubble_rounded,
                              color: widget.isDark ? Colors.white.withOpacity(0.9) : Colors.black87,
                              size: 24,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    widget.config.chatWindowTitle,
                                    style: TextStyle(
                                      color: widget.isDark ? Colors.white.withOpacity(0.9) : Colors.black87,
                                      fontSize: 18,
                                      fontWeight: FontWeight.w600,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                    maxLines: 1,
                                  ),
                                  if (widget.config.chatRoomDescription != null &&
                                      widget.config.chatRoomDescription!.isNotEmpty) ...[
                                    const SizedBox(height: 2),
                                    Text(
                                      widget.config.chatRoomDescription!,
                                      style: TextStyle(
                                        color: widget.isDark ? Colors.white.withOpacity(0.6) : Colors.black54,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w400,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                      maxLines: 1,
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            if (widget.onFullscreen != null)
                              IconButton(
                                icon: Icon(
                                  Icons.open_in_full_rounded,
                                  color: widget.isDark ? Colors.white.withOpacity(0.8) : Colors.black54,
                                  size: 22,
                                ),
                                onPressed: widget.onFullscreen,
                              ),
                            if (widget.showCloseButton)
                              IconButton(
                                icon: Icon(
                                  Icons.close_rounded,
                                  color: widget.isDark ? Colors.white.withOpacity(0.8) : Colors.black54,
                                  size: 24,
                                ),
                                onPressed: widget.onClose,
                              ),
                          ],
                        ),
                      ),
                      // Chat content area
                      Expanded(
                        child: widget.child ?? ListView(
                          padding: const EdgeInsets.all(16),
                          children: [
                            _buildChatMessage(
                              widget.config.welcomeMessage,
                              isSystem: true,
                              isDark: widget.isDark,
                            ),
                          ],
                        ),
                  ),
                ],
              ),
            ),
          ),
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
