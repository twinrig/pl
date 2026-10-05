import 'package:flutter/material.dart';

class PlayColors {
  static const bg = Color(0xFF0C1524);
  static const surface = Color(0xFF132033);
  static const raised = Color(0xFF1C2D48);
  static const fg = Color(0xFFE7EEF8);
  static const muted = Color(0xFF8EA3BF);
  static const line = Color(0xFF2C4260);
  static const accent = Color(0xFF7EC8FF);
  static const ink = Color(0xFF071422);
  static const fieldA = Color(0xFF1B6B38);
  static const fieldB = Color(0xFF166233);
  static const endZone = Color(0xFF0E2A4A);
  static const firstDown = Color(0xFFE10600);
  static const series = Color(0xFFF5C518);
}

ThemeData playLogTheme() {
  const border = OutlineInputBorder(
    borderRadius: BorderRadius.all(Radius.circular(8)),
    borderSide: BorderSide(color: PlayColors.line),
  );
  final base = ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: PlayColors.bg,
    canvasColor: PlayColors.surface,
    dividerColor: PlayColors.line,
    colorScheme: const ColorScheme.dark(
      surface: PlayColors.surface,
      primary: PlayColors.accent,
      onPrimary: PlayColors.ink,
      onSurface: PlayColors.fg,
      secondary: PlayColors.accent,
    ),
    splashFactory: NoSplash.splashFactory,
    hoverColor: const Color(0x00000000),
    highlightColor: const Color(0x00000000),
    splashColor: const Color(0x00000000),
    focusColor: const Color(0x00000000),
    disabledColor: PlayColors.muted,
  );
  return base.copyWith(
    textTheme: base.textTheme.apply(
      bodyColor: PlayColors.fg,
      displayColor: PlayColors.fg,
    ),
    dialogTheme: const DialogThemeData(backgroundColor: PlayColors.surface),
    popupMenuTheme: const PopupMenuThemeData(
      color: PlayColors.surface,
      surfaceTintColor: Color(0x00000000),
      textStyle: TextStyle(
        color: PlayColors.fg,
        fontSize: 14,
        fontWeight: FontWeight.w600,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(8)),
        side: BorderSide(color: PlayColors.line),
      ),
    ),
    scrollbarTheme: ScrollbarThemeData(
      thumbVisibility: WidgetStateProperty.all(true),
      trackVisibility: WidgetStateProperty.all(true),
      thickness: WidgetStateProperty.all(8),
      radius: const Radius.circular(8),
      thumbColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.dragged)) return PlayColors.accent;
        if (states.contains(WidgetState.hovered)) return PlayColors.muted;
        return PlayColors.line;
      }),
      trackColor: WidgetStateProperty.all(PlayColors.raised),
      trackBorderColor: WidgetStateProperty.all(const Color(0x00000000)),
    ),
    inputDecorationTheme: const InputDecorationTheme(
      isDense: true,
      filled: true,
      fillColor: PlayColors.raised,
      hoverColor: Color(0x00000000),
      contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      border: border,
      enabledBorder: border,
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(8)),
        borderSide: BorderSide(color: PlayColors.accent),
      ),
      hintStyle: TextStyle(color: PlayColors.muted),
    ),
  );
}
