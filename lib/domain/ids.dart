import 'dart:math';

final _random = Random();
var _sequence = 0;

String newId() {
  _sequence += 1;
  final micros = DateTime.now().microsecondsSinceEpoch;
  final salt = _random.nextInt(1 << 30);
  return '$micros-$salt-$_sequence';
}

/// UTC calendar day, matching `Date.toISOString().slice(0, 10)`.
String today() => DateTime.now().toUtc().toIso8601String().substring(0, 10);
