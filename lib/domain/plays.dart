import 'models.dart';

class Penalty {
  const Penalty({
    required this.id,
    required this.label,
    required this.yards,
    required this.replay,
    this.autoFirst = false,
  });

  final String id;
  final String label;
  final int yards;
  final bool replay;
  final bool autoFirst;
}

const penalties = <Penalty>[
  Penalty(id: 'false-start', label: 'False start', yards: 5, replay: true),
  Penalty(id: 'offside', label: 'Offside', yards: 5, replay: true),
  Penalty(id: 'encroachment', label: 'Encroachment', yards: 5, replay: true),
  Penalty(id: 'delay', label: 'Delay of game', yards: 5, replay: true),
  Penalty(
    id: 'illegal-procedure',
    label: 'Illegal procedure',
    yards: 5,
    replay: true,
  ),
  Penalty(
    id: 'illegal-formation',
    label: 'Illegal formation',
    yards: 5,
    replay: true,
  ),
  Penalty(id: 'illegal-motion', label: 'Illegal motion', yards: 5, replay: true),
  Penalty(id: 'illegal-shift', label: 'Illegal shift', yards: 5, replay: true),
  Penalty(
    id: 'ineligible',
    label: 'Ineligible downfield',
    yards: 5,
    replay: true,
  ),
  Penalty(id: 'too-many', label: 'Too many players', yards: 5, replay: true),
  Penalty(id: 'holding', label: 'Holding', yards: 10, replay: true),
  Penalty(
    id: 'defensive-holding',
    label: 'Defensive holding',
    yards: 10,
    replay: false,
    autoFirst: true,
  ),
  Penalty(id: 'block-back', label: 'Block in the back', yards: 10, replay: true),
  Penalty(id: 'illegal-block', label: 'Illegal block', yards: 10, replay: true),
  Penalty(
    id: 'pass-interference',
    label: 'Pass interference',
    yards: 15,
    replay: false,
    autoFirst: true,
  ),
  Penalty(
    id: 'face-mask',
    label: 'Face mask',
    yards: 15,
    replay: false,
    autoFirst: true,
  ),
  Penalty(
    id: 'roughing-passer',
    label: 'Roughing the passer',
    yards: 15,
    replay: false,
    autoFirst: true,
  ),
  Penalty(
    id: 'roughing-kicker',
    label: 'Roughing the kicker',
    yards: 15,
    replay: false,
    autoFirst: true,
  ),
  Penalty(
    id: 'kick-catch',
    label: 'Kick catch interference',
    yards: 15,
    replay: false,
    autoFirst: true,
  ),
  Penalty(
    id: 'roughness',
    label: 'Unnecessary roughness',
    yards: 15,
    replay: false,
    autoFirst: true,
  ),
  Penalty(
    id: 'personal',
    label: 'Personal foul',
    yards: 15,
    replay: false,
    autoFirst: true,
  ),
  Penalty(
    id: 'unsportsmanlike',
    label: 'Unsportsmanlike conduct',
    yards: 15,
    replay: true,
  ),
  Penalty(
    id: 'targeting',
    label: 'Targeting',
    yards: 15,
    replay: false,
    autoFirst: true,
  ),
];

const _commonPenaltyIds = [
  'false-start',
  'holding',
  'offside',
  'encroachment',
  'defensive-holding',
  'pass-interference',
  'face-mask',
  'delay',
  'personal',
  'roughness',
];

Penalty penaltyById(String id) {
  for (final penalty in penalties) {
    if (penalty.id == id) return penalty;
  }
  return penalties.first;
}

({List<Penalty> common, List<Penalty> rest}) penaltyGroups() {
  final byId = {for (final penalty in penalties) penalty.id: penalty};
  final common = <Penalty>[
    for (final id in _commonPenaltyIds)
      if (byId[id] != null) byId[id]!,
  ];
  final commonIds = _commonPenaltyIds.toSet();
  final rest = penalties.where((penalty) => !commonIds.contains(penalty.id)).toList()
    ..sort((a, b) => a.label.compareTo(b.label));
  return (common: common, rest: rest);
}

const scrimmageTypes = <PlayType>[
  PlayType.pass,
  PlayType.run,
  PlayType.punt,
  PlayType.fieldGoal,
];

const playButtons = <PlayType>[
  PlayType.pass,
  PlayType.run,
  PlayType.punt,
  PlayType.kickoff,
  PlayType.fieldGoal,
  PlayType.extraPoint,
];

const resultMain = <ResultKind>{
  ResultKind.tackled,
  ResultKind.incomplete,
  ResultKind.downed,
  ResultKind.outOfBounds,
  ResultKind.interception,
  ResultKind.fumble,
};

const resultMore = <ResultKind>[
  ResultKind.sack,
  ResultKind.safety,
  ResultKind.kneel,
  ResultKind.touchback,
  ResultKind.fairCatch,
  ResultKind.fumbleKept,
];

const turnoverResults = <ResultKind>{
  ResultKind.interception,
  ResultKind.fumble,
  ResultKind.safety,
};

const possessionPlays = <PlayType>{
  PlayType.interception,
  PlayType.fumble,
  PlayType.punt,
  PlayType.kickoff,
  PlayType.safety,
};

bool kickingPlay(PlayType type) =>
    type == PlayType.kickoff || type == PlayType.punt;

String startLabel(PlayType type) {
  if (type == PlayType.kickoff) return 'Kicker';
  if (type == PlayType.punt) return 'Punter';
  return 'Offense start';
}

String normNum(String value) {
  final trimmed = value.trim();
  if (RegExp(r'^\d+$').hasMatch(trimmed)) return int.parse(trimmed).toString();
  return trimmed;
}

String formatAthlete(String number, String? name) {
  final n = normNum(number);
  if (n.isEmpty) return '';
  final label = name?.trim();
  if (label != null && label.isNotEmpty) return '$label ($n)';
  return n;
}

String? lookupName(
  String number,
  List<Player> players,
  String? preferTeamId, [
  bool strict = false,
]) {
  final n = normNum(number);
  if (n.isEmpty) return null;
  final hits = players.where((player) => normNum(player.number) == n);
  Player? hit;
  for (final player in hits) {
    if (player.teamId == preferTeamId) {
      hit = player;
      break;
    }
  }
  if (!strict && hit == null) {
    for (final player in hits) {
      hit = player;
      break;
    }
  }
  final name = hit?.name.trim();
  if (name == null || name.isEmpty) return null;
  return name;
}

String labelFor(
  String number,
  List<Player> players,
  String? preferTeamId, [
  bool strict = false,
]) {
  if (number.trim().isEmpty) return '';
  return formatAthlete(number, lookupName(number, players, preferTeamId, strict));
}

String spot(String team, String yard) {
  final side = team.trim();
  final line = yard.trim();
  if (side.isNotEmpty && line.isNotEmpty) return '$side $line';
  return side.isNotEmpty ? side : line;
}

String joinAnd(List<String> parts) {
  final list = parts.where((part) => part.isNotEmpty).toList();
  if (list.length <= 1) return list.isEmpty ? '' : list.first;
  if (list.length == 2) return '${list[0]} and ${list[1]}';
  return '${list.sublist(0, list.length - 1).join(', ')} and ${list.last}';
}

String joinComma(List<String> parts) =>
    parts.where((part) => part.isNotEmpty).join(',');

class SentenceInput {
  const SentenceInput({
    required this.ballTeam,
    required this.ballYard,
    required this.endTeam,
    required this.endYard,
    required this.type,
    required this.result,
    required this.starter,
    required this.targets,
    required this.tacklers,
    this.scoreTime,
    this.tryPoints,
  });

  final String ballTeam;
  final String ballYard;
  final String endTeam;
  final String endYard;
  final String type;
  final ResultKind result;
  final String starter;
  final List<String> targets;
  final List<String> tacklers;
  final String? scoreTime;
  final int? tryPoints;
}

String buildSentence(SentenceInput input) {
  final ball = spot(input.ballTeam, input.ballYard);
  final end = spot(input.endTeam, input.endYard);
  final lead = input.type == 'Kickoff'
      ? ''
      : (ball.isNotEmpty ? 'Ball on the $ball.' : 'Ball snapped.');
  final starter = input.starter.trim();
  final toClause = joinAnd(input.targets);
  final tacklers = joinComma(input.tacklers);
  final from = starter.isNotEmpty ? ' from $starter' : '';
  final to = toClause.isNotEmpty ? ' to $toClause' : '';
  final by = tacklers.isNotEmpty ? ' by $tacklers' : '';

  var action = '';
  final sack = input.result == ResultKind.sack || input.type == 'Sack';
  final interception =
      input.result == ResultKind.interception || input.type == 'Interception';
  final fumble = input.result == ResultKind.fumble ||
      input.result == ResultKind.fumbleKept ||
      input.type == 'Fumble';
  final safety = input.result == ResultKind.safety || input.type == 'Safety';
  final kneel = input.result == ResultKind.kneel || input.type == 'Kneel';

  if (sack) {
    action = starter.isNotEmpty ? 'Sack of $starter' : 'Sack';
    action += by;
    if (end.isNotEmpty) action += ' on the $end';
  } else if (interception) {
    action = 'Pass$from$to intercepted$by';
    if (end.isNotEmpty) action += ' on the $end';
  } else if (fumble) {
    action = starter.isNotEmpty ? 'Fumble by $starter' : 'Fumble';
    if (end.isNotEmpty) action += ' on the $end';
    if (tacklers.isNotEmpty) {
      action += ' recovered by $tacklers';
    } else if (input.result == ResultKind.fumbleKept) {
      action += ' recovered';
    }
  } else if (safety) {
    action = starter.isNotEmpty ? 'Safety by $starter' : 'Safety';
    if (end.isNotEmpty) action += ' on the $end';
  } else if (kneel) {
    action = starter.isNotEmpty ? 'Kneel by $starter' : 'Kneel';
    if (end.isNotEmpty) action += ' on the $end';
  } else if (input.type == 'Pass' && input.result == ResultKind.incomplete) {
    action = 'Incomplete pass$from$to';
  } else if (input.type == 'Pass') {
    action = 'Pass$from$to';
    if (input.result == ResultKind.touchdown) {
      action += ' for a touchdown';
    } else if (input.result == ResultKind.outOfBounds) {
      action += end.isNotEmpty ? ' out of bounds on the $end' : ' out of bounds';
      action += by;
    } else if (input.result == ResultKind.downed) {
      action += end.isNotEmpty ? ' downed on the $end' : ' downed';
      action += by;
    } else {
      action += end.isNotEmpty ? ' tackled on the $end' : ' tackled';
      action += by;
    }
  } else if (input.type == 'Run') {
    action = starter.isNotEmpty ? 'Run by $starter' : 'Run';
    if (to.isNotEmpty) action += to;
    if (input.result == ResultKind.touchdown) {
      action += ' for a touchdown';
    } else if (input.result == ResultKind.outOfBounds) {
      action += end.isNotEmpty ? ' out of bounds on the $end' : ' out of bounds';
      action += by;
    } else if (input.result == ResultKind.incomplete) {
      action += ' stopped';
    } else if (input.result == ResultKind.downed) {
      action += end.isNotEmpty ? ' downed on the $end' : '';
      action += by;
    } else {
      action += end.isNotEmpty ? ' tackled on the $end' : ' tackled';
      action += by;
    }
  } else if (input.type == 'Punt') {
    action = _kickAction(
      lead: starter.isNotEmpty ? 'Punt from punter $starter' : 'Punt',
      input: input,
      end: end,
      by: by,
    );
  } else if (input.type == 'Kickoff') {
    final fromSpot = spot(input.ballTeam, input.ballYard);
    var leadAction = fromSpot.isNotEmpty ? 'Kick from the $fromSpot' : 'Kick';
    if (starter.isNotEmpty) leadAction += ' by kicker $starter';
    action = _kickAction(lead: leadAction, input: input, end: end, by: by);
  } else if (input.type == 'Field goal') {
    action = starter.isNotEmpty ? 'Field goal by $starter' : 'Field goal';
    if (end.isNotEmpty) action += ' from the $end';
    if (input.result == ResultKind.incomplete) action += ' no good';
  } else if (input.type == 'Extra point') {
    final two = input.tryPoints == 2;
    action = two
        ? 'Two-point try${starter.isNotEmpty ? ' by $starter' : ''}$to from the 2'
        : (starter.isNotEmpty ? 'Extra point by $starter' : 'Extra point');
    action += input.result == ResultKind.incomplete ? ' no good' : ' good';
  } else if (input.type == 'Penalty') {
    action = starter.isNotEmpty ? 'Penalty on $starter' : 'Penalty';
    if (end.isNotEmpty) action += ' enforced to the $end';
  } else {
    action = '${input.type}${starter.isNotEmpty ? ' by $starter' : ''}$to';
    if (end.isNotEmpty) action += ' on the $end';
    action += by;
  }

  if (input.result == ResultKind.outOfBounds &&
      !action.contains('out of bounds')) {
    action += ' out of bounds';
  }
  if (input.result == ResultKind.touchdown && !action.contains('touchdown')) {
    action += ' for a touchdown';
  }
  final time = input.scoreTime?.trim() ?? '';
  if (time.isNotEmpty) action += ' at $time';
  return '$lead $action.'.replaceAll(RegExp(r'\s+'), ' ').trim();
}

String _kickAction({
  required String lead,
  required SentenceInput input,
  required String end,
  required String by,
}) {
  final receivers = joinAnd(input.targets);
  final count = input.targets.where((target) => target.isNotEmpty).length;
  final receiverWord = count > 1 ? 'receivers' : 'receiver';
  var action = lead;
  if (receivers.isNotEmpty) action += ' to $receiverWord $receivers';
  if (input.result == ResultKind.touchdown) {
    action += ' for a touchdown';
  } else if (input.result == ResultKind.touchback) {
    action += ' for a touchback';
  } else if (input.result == ResultKind.fairCatch) {
    action += end.isNotEmpty ? ' fair catch on the $end' : ' fair catch';
  } else if (input.result == ResultKind.outOfBounds) {
    action += end.isNotEmpty ? ' out of bounds on the $end' : ' out of bounds';
  } else if (input.result == ResultKind.downed) {
    action += end.isNotEmpty ? ' downed on the $end' : ' downed';
    action += by;
  } else {
    action += end.isNotEmpty ? ' tackled on the $end' : (by.isNotEmpty ? ' tackled' : '');
    action += by;
  }
  return action;
}

String ordinalDown(String down) {
  if (down == '1') return '1st';
  if (down == '2') return '2nd';
  if (down == '3') return '3rd';
  if (down == '4') return '4th';
  return down;
}

num enforceSpot(num progress, int yards, bool againstOffense) {
  if (againstOffense) {
    if (yards >= progress) return _max(1, (progress / 2).round());
    return _max(1, progress - yards);
  }
  final room = 100 - progress;
  if (yards >= room) return _min(99, (progress + room / 2).round());
  return _min(99, progress + yards);
}

int? yardsGained({
  required String offenseId,
  required String ballTeamId,
  required String ballYard,
  required String endTeamId,
  required String endYard,
}) {
  if (endYard.trim().isEmpty || ballYard.trim().isEmpty) return null;
  final start = double.tryParse(ballYard.trim());
  final end = double.tryParse(endYard.trim());
  if (start == null || end == null || !start.isFinite || !end.isFinite) {
    return null;
  }
  double fromOwnGoal(String sideId, double yard) =>
      sideId == offenseId ? yard : 100 - yard;
  return (fromOwnGoal(endTeamId, end) - fromOwnGoal(ballTeamId, start)).round();
}

double? progressFromGoal(String offenseId, String teamId, String yard) {
  if (yard.trim().isEmpty) return null;
  final n = double.tryParse(yard.trim());
  if (n == null || !n.isFinite) return null;
  return teamId == offenseId ? n : 100 - n;
}

({String teamId, String yard}) spotAtProgress(
  String offenseId,
  String defenseId,
  num progress,
) {
  final yard = progress.round().clamp(1, 99);
  if (yard <= 50) return (teamId: offenseId, yard: '$yard');
  return (teamId: defenseId, yard: '${100 - yard}');
}

String? toGoFromSeries(
  String offenseId,
  String seriesTeamId,
  String seriesYard,
  String ballTeamId,
  String ballYard,
) {
  final gained = yardsGained(
    offenseId: offenseId,
    ballTeamId: seriesTeamId,
    ballYard: seriesYard,
    endTeamId: ballTeamId,
    endYard: ballYard,
  );
  if (gained == null) return null;
  final remaining = 10 - gained;
  return '${remaining < 0 ? 0 : remaining}';
}

num _max(num a, num b) => a >= b ? a : b;
num _min(num a, num b) => a <= b ? a : b;
