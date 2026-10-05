import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../state/play_log_controller.dart';
import '../theme.dart';
import 'bits.dart';

class FieldBoard extends StatelessWidget {
  const FieldBoard({
    super.key,
    required this.offenseName,
    required this.defenseName,
    required this.offenseScore,
    required this.defenseScore,
    required this.ball,
    required this.series,
    required this.firstDown,
    required this.kick,
    required this.flipped,
    required this.quarter,
    required this.placeMode,
    required this.onQuarter,
    required this.onFlip,
    required this.onPlaceMode,
    required this.onPlace,
    this.grassHeight = 68,
  });

  final String offenseName;
  final String defenseName;
  final int offenseScore;
  final int defenseScore;
  final double ball;
  final double series;
  final double firstDown;
  final double? kick;
  final bool flipped;
  final String quarter;
  final PlaceMode placeMode;
  final ValueChanged<String> onQuarter;
  final VoidCallback onFlip;
  final ValueChanged<PlaceMode> onPlaceMode;
  final ValueChanged<num> onPlace;
  final double grassHeight;

  double _view(double yard) => flipped ? 100 - yard : yard;

  @override
  Widget build(BuildContext context) {
    final leftName = flipped ? defenseName : offenseName;
    final rightName = flipped ? offenseName : defenseName;
    final leftScore = flipped ? defenseScore : offenseScore;
    final rightScore = flipped ? offenseScore : defenseScore;
    const numbers = [10, 20, 30, 40, 50, 40, 30, 20, 10];
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: PlayColors.line),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        clipBehavior: Clip.hardEdge,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(
              height: grassHeight,
              child: Row(
                children: [
                  _EndZone(name: leftName, score: leftScore),
                  Expanded(
                    child: _Grass(
                      ball: _view(ball),
                      series: _view(series),
                      firstDown: _view(firstDown),
                      kick: kick == null ? null : _view(kick!),
                      numbers: numbers,
                      flipped: flipped,
                      onPlace: onPlace,
                      progress: ball,
                    ),
                  ),
                  _EndZone(name: rightName, score: rightScore),
                ],
              ),
            ),
            ColoredBox(
              color: PlayColors.surface,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  alignment: WrapAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        for (final q in const ['1', '2', '3', '4', 'OT'])
                          Padding(
                            padding: const EdgeInsets.only(right: 4),
                            child: AppButton(
                              label: q,
                              compact: true,
                              selected: quarter == q,
                              onPressed: () => onQuarter(q),
                            ),
                          ),
                      ],
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        for (final mode in [
                          (PlaceMode.ball, 'Ball'),
                          (PlaceMode.start, 'Start'),
                          (PlaceMode.line, '1st down'),
                          if (kick != null) (PlaceMode.kick, 'Kick line'),
                        ])
                          Padding(
                            padding: const EdgeInsets.only(right: 4),
                            child: AppButton(
                              label: mode.$2,
                              compact: true,
                              selected: placeMode == mode.$1,
                              onPressed: () => onPlaceMode(mode.$1),
                            ),
                          ),
                      ],
                    ),
                    AppButton(
                      label: 'Flip ends',
                      compact: true,
                      onPressed: onFlip,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EndZone extends StatelessWidget {
  const _EndZone({required this.name, required this.score});

  final String name;
  final int score;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: PlayColors.endZone,
      child: SizedBox(
        width: 76,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '$score',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              (name.isEmpty ? 'Team' : name).toUpperCase(),
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Grass extends StatefulWidget {
  const _Grass({
    required this.ball,
    required this.series,
    required this.firstDown,
    required this.kick,
    required this.numbers,
    required this.flipped,
    required this.onPlace,
    required this.progress,
  });

  final double ball;
  final double series;
  final double firstDown;
  final double? kick;
  final List<int> numbers;
  final bool flipped;
  final ValueChanged<num> onPlace;
  final double progress;

  @override
  State<_Grass> createState() => _GrassState();
}

class _GrassState extends State<_Grass> {
  final _focus = FocusNode();
  int? _sent;

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  void _fromPointer(
    PointerEvent event,
    BoxConstraints constraints, {
    required bool force,
  }) {
    final width = constraints.maxWidth;
    if (width <= 0) return;
    final box = context.findRenderObject() as RenderBox?;
    if (box == null) return;
    final local = box.globalToLocal(event.position);
    final ratio = (local.dx / width).clamp(0.0, 1.0);
    final visual = (ratio * 100).round().clamp(1, 99);
    final progress = widget.flipped ? 100 - visual : visual;
    if (!force && _sent == progress) return;
    _sent = progress;
    widget.onPlace(progress);
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Focus(
          focusNode: _focus,
          child: Listener(
            onPointerDown: (event) {
              _focus.requestFocus();
              _fromPointer(event, constraints, force: true);
            },
            onPointerMove: (event) =>
                _fromPointer(event, constraints, force: false),
            onPointerUp: (_) => _sent = null,
            child: CallbackShortcuts(
              bindings: {
                const SingleActivator(LogicalKeyboardKey.arrowRight): () {
                  final step = widget.flipped ? -1 : 1;
                  widget.onPlace((widget.progress.round() + step).clamp(1, 99));
                },
                const SingleActivator(LogicalKeyboardKey.arrowLeft): () {
                  final step = widget.flipped ? -1 : 1;
                  widget.onPlace((widget.progress.round() - step).clamp(1, 99));
                },
              },
              child: CustomPaint(
                painter: _FieldPainter(
                  ball: widget.ball,
                  series: widget.series,
                  firstDown: widget.firstDown,
                  kick: widget.kick,
                  numbers: widget.numbers,
                ),
                child: const SizedBox.expand(),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _FieldPainter extends CustomPainter {
  _FieldPainter({
    required this.ball,
    required this.series,
    required this.firstDown,
    required this.kick,
    required this.numbers,
  });

  final double ball;
  final double series;
  final double firstDown;
  final double? kick;
  final List<int> numbers;

  @override
  void paint(Canvas canvas, Size size) {
    final stripe = Paint();
    const stripeWidth = 8.0;
    for (var x = 0.0; x < size.width; x += stripeWidth * 2) {
      stripe.color = PlayColors.fieldA;
      canvas.drawRect(Rect.fromLTWH(x, 0, stripeWidth, size.height), stripe);
      stripe.color = PlayColors.fieldB;
      canvas.drawRect(
        Rect.fromLTWH(x + stripeWidth, 0, stripeWidth, size.height),
        stripe,
      );
    }
    final line = Paint()..strokeWidth = 1;
    for (var step = 1; step <= 19; step++) {
      line.color = step.isEven
          ? const Color(0xCCFFFFFF)
          : const Color(0x4DFFFFFF);
      final x = size.width * step * 0.05;
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), line);
    }
    line.color = const Color(0x80FFFFFF);
    canvas.drawLine(
      Offset(0, size.height * 0.28),
      Offset(size.width, size.height * 0.28),
      line,
    );
    canvas.drawLine(
      Offset(0, size.height * 0.72),
      Offset(size.width, size.height * 0.72),
      line,
    );
    final text = TextPainter(textDirection: TextDirection.ltr);
    for (var i = 0; i < numbers.length; i++) {
      text.text = TextSpan(
        text: '${numbers[i]}',
        style: const TextStyle(
          color: Color(0xE6FFFFFF),
          fontSize: 12,
          fontWeight: FontWeight.w800,
        ),
      );
      text.layout();
      final x = size.width * (i + 1) * 0.1 - text.width / 2;
      text.paint(canvas, Offset(x, size.height / 2 - text.height / 2));
    }
    void marker(double yard, Color color, {bool dashed = false}) {
      final x = size.width * yard / 100;
      if (!dashed) {
        canvas.drawRect(
          Rect.fromLTWH(x - 1, 0, 2, size.height),
          Paint()..color = color,
        );
        return;
      }
      final paint = Paint()
        ..color = color
        ..strokeWidth = 2;
      for (var y = 0.0; y < size.height; y += 8) {
        canvas.drawLine(Offset(x, y), Offset(x, y + 4), paint);
      }
    }

    marker(series, PlayColors.series);
    marker(firstDown, PlayColors.firstDown);
    if (kick != null) marker(kick!, Colors.white, dashed: true);
    _football(canvas, Offset(size.width * ball / 100, size.height / 2));
  }

  void _football(Canvas canvas, Offset center) {
    canvas.save();
    canvas.translate(center.dx - 16, center.dy - 10);
    final body = Paint()..color = const Color(0xFF6B3410);
    canvas.drawOval(const Rect.fromLTWH(0, 2, 32, 16), body);
    canvas.drawOval(
      const Rect.fromLTWH(0, 2, 32, 16),
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1
        ..color = const Color(0xFF3A1C08),
    );
    final lace = Paint()
      ..color = Colors.white
      ..strokeWidth = 1.2;
    canvas.drawLine(const Offset(16, 4), const Offset(16, 16), lace);
    canvas.drawLine(const Offset(12, 7), const Offset(20, 7), lace);
    canvas.drawLine(const Offset(12, 10), const Offset(20, 10), lace);
    canvas.drawLine(const Offset(12, 13), const Offset(20, 13), lace);
    canvas.restore();
  }

  @override
  bool shouldRepaint(_FieldPainter oldDelegate) {
    return oldDelegate.ball != ball ||
        oldDelegate.series != series ||
        oldDelegate.firstDown != firstDown ||
        oldDelegate.kick != kick;
  }
}
