import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../domain/models.dart';
import '../theme.dart';

class SectionLabel extends StatelessWidget {
  const SectionLabel(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          color: PlayColors.muted,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.selected = false,
    this.filled = false,
    this.compact = false,
    this.expand = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool selected;
  final bool filled;
  final bool compact;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;
    final on = enabled && (selected || filled);
    final radius = BorderRadius.circular(compact ? 6 : 8);
    final labelWidget = Text(
      label,
      overflow: TextOverflow.ellipsis,
      style: TextStyle(
        color: !enabled
            ? PlayColors.muted
            : on
            ? PlayColors.ink
            : PlayColors.fg,
        fontSize: compact ? 12 : 14,
        fontWeight: on ? FontWeight.w800 : FontWeight.w600,
      ),
    );
    return Semantics(
      button: true,
      enabled: enabled,
      child: GestureDetector(
        onTap: onPressed,
        behavior: HitTestBehavior.opaque,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: on ? PlayColors.accent : PlayColors.raised,
            borderRadius: radius,
            border: Border.all(color: on ? PlayColors.accent : PlayColors.line),
          ),
          child: SizedBox(
            height: compact ? 32 : 40,
            width: expand ? double.infinity : null,
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: compact ? 8 : 12),
              child: expand
                  ? Center(child: labelWidget)
                  : Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [labelWidget],
                    ),
            ),
          ),
        ),
      ),
    );
  }
}

class BoundField extends StatefulWidget {
  const BoundField({
    super.key,
    required this.value,
    required this.onChanged,
    this.fieldKey,
    this.hint,
    this.numeric = false,
    this.center = false,
    this.width,
    this.maxLines = 1,
  });

  final String value;
  final ValueChanged<String> onChanged;
  final Key? fieldKey;
  final String? hint;
  final bool numeric;
  final bool center;
  final double? width;
  final int maxLines;

  @override
  State<BoundField> createState() => _BoundFieldState();
}

class _BoundFieldState extends State<BoundField> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.value);
  }

  @override
  void didUpdateWidget(BoundField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.value != _controller.text) {
      _controller.value = TextEditingValue(
        text: widget.value,
        selection: TextSelection.collapsed(offset: widget.value.length),
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.width,
      child: TextField(
        key: widget.fieldKey,
        controller: _controller,
        keyboardType: widget.numeric
            ? TextInputType.number
            : TextInputType.text,
        inputFormatters: widget.numeric
            ? [FilteringTextInputFormatter.allow(RegExp(r'[0-9]'))]
            : null,
        textAlign: widget.center ? TextAlign.center : TextAlign.start,
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        maxLines: widget.maxLines,
        decoration: InputDecoration(
          hintText: widget.hint,
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 8,
            vertical: 6,
          ),
          hintStyle: const TextStyle(fontSize: 13, color: PlayColors.muted),
        ),
        onChanged: widget.onChanged,
      ),
    );
  }
}

class JerseyField extends StatelessWidget {
  const JerseyField({
    super.key,
    required this.label,
    required this.value,
    required this.hint,
    required this.onChanged,
    this.fieldKey,
  });

  final String label;
  final String value;
  final String hint;
  final ValueChanged<String> onChanged;
  final Key? fieldKey;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 84,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: PlayColors.muted,
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
            ),
          ),
          const SizedBox(height: 4),
          BoundField(
            fieldKey: fieldKey,
            value: value,
            numeric: true,
            center: true,
            hint: '#',
            onChanged: onChanged,
          ),
          const SizedBox(height: 4),
          SizedBox(
            height: 16,
            child: hint.isEmpty
                ? null
                : Text(
                    hint,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: PlayColors.muted,
                      fontSize: 12,
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class TeamSelect extends StatelessWidget {
  const TeamSelect({
    super.key,
    required this.teams,
    required this.value,
    required this.onChanged,
    this.compact = false,
  });

  final List<Team> teams;
  final String value;
  final ValueChanged<String> onChanged;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: compact ? MainAxisSize.min : MainAxisSize.max,
      children: [
        for (var i = 0; i < teams.length; i++)
          Flexible(
            fit: compact ? FlexFit.loose : FlexFit.tight,
            child: AppButton(
              label: teams[i].name.isEmpty ? 'Team' : teams[i].name,
              selected: teams[i].id == value,
              compact: compact,
              expand: !compact,
              onPressed: () => onChanged(teams[i].id),
            ),
          ),
      ],
    );
  }
}

class OverlayCard extends StatelessWidget {
  const OverlayCard({super.key, required this.child, this.maxWidth = 720});

  final Widget child;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: ColoredBox(
        color: PlayColors.bg.withValues(alpha: 0.86),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: ConstrainedBox(
                constraints: BoxConstraints(maxWidth: maxWidth),
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: PlayColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: PlayColors.line),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: child,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class Panel extends StatelessWidget {
  const Panel({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: PlayColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: PlayColors.line),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
        child: child,
      ),
    );
  }
}
