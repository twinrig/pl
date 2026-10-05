import 'models.dart';
import 'plays.dart';

class StatLine {
  StatLine(this.label);

  final String label;
  int cmp = 0;
  int att = 0;
  int passYds = 0;
  int rush = 0;
  int rushYds = 0;
  int rec = 0;
  int recYds = 0;
  int td = 0;
  int tackles = 0;
  int sacks = 0;
  int sackYds = 0;
  int interceptions = 0;
  int punts = 0;
  int kickoffs = 0;
  int fg = 0;
  int fgAtt = 0;
  int xp = 0;
  int xpAtt = 0;
}

class TeamStats {
  const TeamStats({
    required this.id,
    required this.name,
    required this.score,
    required this.passYds,
    required this.rushYds,
    required this.sacks,
    required this.sackYds,
    required this.players,
  });

  final String id;
  final String name;
  final int score;
  final int passYds;
  final int rushYds;
  final int sacks;
  final int sackYds;
  final List<StatLine> players;
}

class TypeTotal {
  const TypeTotal({
    required this.type,
    required this.count,
    required this.yards,
  });

  final PlayType type;
  final int count;
  final int yards;
}

class TeamSlice {
  const TeamSlice({required this.id, required this.name, required this.types});

  final String id;
  final String name;
  final List<TypeTotal> types;
}

class PeriodStats {
  const PeriodStats({required this.label, required this.teams});

  final String label;
  final List<TeamSlice> teams;
}

class GameStats {
  const GameStats({required this.teams, required this.periods});

  final List<TeamStats> teams;
  final List<PeriodStats> periods;
}

class _TypeBucket {
  final _counts = <PlayType, int>{};
  final _yards = <PlayType, int>{};

  void add(PlayType type, int yards) {
    _counts[type] = (_counts[type] ?? 0) + 1;
    _yards[type] = (_yards[type] ?? 0) + yards;
  }

  List<TypeTotal> lines() => [
    for (final type in PlayType.values)
      if ((_counts[type] ?? 0) > 0)
        TypeTotal(type: type, count: _counts[type]!, yards: _yards[type] ?? 0),
  ];
}

int _quarterRank(String label) {
  const order = ['1', '2', '3', '4', 'OT'];
  final index = order.indexOf(label);
  return index < 0 ? order.length : index;
}

bool _isPlayerLabel(String label) {
  final name = label.trim();
  return RegExp(r'^\d+$').hasMatch(name) ||
      RegExp(r'^.+ \(\d+\)$').hasMatch(name);
}

String _defenseOf(Book book, String offenseId) {
  for (final team in book.teams) {
    if (team.id != offenseId) return team.id;
  }
  return offenseId;
}

({String side, int points})? pointsOf(PlaySnapshot play) {
  if (play.type == PlayType.safety || play.result == ResultKind.safety) {
    return (side: 'defense', points: 2);
  }
  if (play.type == PlayType.extraPoint) {
    if (play.result == ResultKind.incomplete) return null;
    return (side: 'offense', points: play.tryPoints == 2 ? 2 : 1);
  }
  if (play.type == PlayType.fieldGoal) {
    return play.result == ResultKind.incomplete
        ? null
        : (side: 'offense', points: 3);
  }
  if (play.result == ResultKind.touchdown) {
    final returnScore =
        play.possession ||
        play.type == PlayType.kickoff ||
        play.type == PlayType.punt ||
        play.type == PlayType.interception;
    return (side: returnScore ? 'defense' : 'offense', points: 6);
  }
  return null;
}

Map<String, int> teamScores(Book book) {
  final totals = <String, int>{for (final team in book.teams) team.id: 0};
  for (final play in book.plays) {
    final snap = play.snapshot;
    if (snap == null) continue;
    final scored = pointsOf(snap);
    if (scored == null) continue;
    final defense = _defenseOf(book, snap.offenseId);
    final id = scored.side == 'defense' ? defense : snap.offenseId;
    totals[id] = (totals[id] ?? 0) + scored.points;
  }
  return totals;
}

int _playYards(PlaySnapshot snap) {
  return yardsGained(
        offenseId: snap.offenseId,
        ballTeamId: snap.snapTeamId,
        ballYard: snap.snapYard,
        endTeamId: snap.ballTeamId,
        endYard: snap.ballYard,
      ) ??
      0;
}

GameStats gameStats(Book book) {
  final scores = teamScores(book);
  final maps = <String, Map<String, StatLine>>{};
  final teamPass = <String, int>{};
  final teamRush = <String, int>{};
  final teamSacks = <String, int>{};
  final teamSackYds = <String, int>{};
  final gameBuckets = <String, _TypeBucket>{};
  final quarterBuckets = <String, Map<String, _TypeBucket>>{};
  for (final team in book.teams) {
    maps[team.id] = {};
    teamPass[team.id] = 0;
    teamRush[team.id] = 0;
    teamSacks[team.id] = 0;
    teamSackYds[team.id] = 0;
    gameBuckets[team.id] = _TypeBucket();
    quarterBuckets[team.id] = {};
  }

  StatLine? row(String teamId, String label) {
    final name = label.trim();
    final map = maps[teamId];
    if (!_isPlayerLabel(name) || map == null) return null;
    final existing = map[name];
    if (existing != null) return existing;
    final created = StatLine(name);
    map[name] = created;
    return created;
  }

  for (final play in book.plays) {
    final snap = play.snapshot;
    if (snap == null) continue;
    final defense = _defenseOf(book, snap.offenseId);
    final yards = _playYards(snap);
    final quarter = snap.quarter.trim().isEmpty ? '—' : snap.quarter.trim();
    gameBuckets[snap.offenseId]?.add(snap.type, yards);
    quarterBuckets[snap.offenseId]
        ?.putIfAbsent(quarter, _TypeBucket.new)
        .add(snap.type, yards);
    final punt = snap.type == PlayType.punt;
    final starter = labelFor(snap.starter, book.players, snap.offenseId, true);
    String catcher = '';
    for (final number in punt ? [snap.target1] : [snap.target1, snap.target2]) {
      final name = labelFor(
        number,
        book.players,
        punt ? defense : snap.offenseId,
        true,
      );
      if (name.isNotEmpty) {
        catcher = name;
        break;
      }
    }
    final tacklers =
        (punt ? [snap.tackler1] : [snap.tackler1, snap.tackler2, snap.tackler3])
            .map(
              (number) => labelFor(
                number,
                book.players,
                punt ? snap.offenseId : defense,
                true,
              ),
            )
            .where((name) => name.isNotEmpty)
            .toList();
    final tackleTeam = punt ? snap.offenseId : defense;
    final scored = snap.result == ResultKind.touchdown;
    final sack = snap.type == PlayType.sack || snap.result == ResultKind.sack;
    final intercepted =
        snap.type == PlayType.interception ||
        snap.result == ResultKind.interception;
    final kneel =
        snap.type == PlayType.kneel || snap.result == ResultKind.kneel;
    final lostBall =
        snap.result == ResultKind.fumble ||
        snap.result == ResultKind.fumbleKept ||
        snap.result == ResultKind.safety;

    if (sack) {
      final quarterback = row(snap.offenseId, starter);
      if (quarterback != null) {
        quarterback.rush += 1;
        quarterback.rushYds += yards;
        teamRush[snap.offenseId] = (teamRush[snap.offenseId] ?? 0) + yards;
      }
      teamSacks[defense] = (teamSacks[defense] ?? 0) + 1;
      teamSackYds[defense] = (teamSackYds[defense] ?? 0) + yards;
      for (final name in tacklers) {
        final tackler = row(tackleTeam, name);
        if (tackler == null) continue;
        tackler.sacks += 1;
        tackler.sackYds += yards;
        tackler.tackles += 1;
      }
    } else if (intercepted) {
      final passer = row(snap.offenseId, starter);
      if (passer != null) {
        passer.att += 1;
        passer.interceptions += 1;
      }
      for (final name in tacklers) {
        final tackler = row(tackleTeam, name);
        if (tackler == null) continue;
        tackler.interceptions += 1;
        if (scored) tackler.td += 1;
      }
    } else if (kneel || snap.type == PlayType.run) {
      final runner = row(snap.offenseId, starter);
      if (runner != null && !lostBall) {
        runner.rush += 1;
        runner.rushYds += yards;
        teamRush[snap.offenseId] = (teamRush[snap.offenseId] ?? 0) + yards;
        if (scored && !snap.possession) runner.td += 1;
      }
    } else if (snap.type == PlayType.pass) {
      final passer = row(snap.offenseId, starter);
      if (passer != null && !lostBall) {
        passer.att += 1;
        if (snap.result != ResultKind.incomplete) {
          passer.cmp += 1;
          passer.passYds += yards;
          teamPass[snap.offenseId] = (teamPass[snap.offenseId] ?? 0) + yards;
          if (scored && !snap.possession) passer.td += 1;
        }
      }
      if (snap.result != ResultKind.incomplete &&
          !lostBall &&
          catcher.isNotEmpty) {
        final receiver = row(snap.offenseId, catcher);
        if (receiver != null) {
          receiver.rec += 1;
          receiver.recYds += yards;
          if (scored && !snap.possession) receiver.td += 1;
        }
      }
    } else if (snap.type == PlayType.punt) {
      final punter = row(snap.offenseId, starter);
      if (punter != null) punter.punts += 1;
      if (scored && catcher.isNotEmpty) {
        final returner = row(defense, catcher);
        if (returner != null) returner.td += 1;
      }
    } else if (snap.type == PlayType.kickoff) {
      final kicker = row(snap.offenseId, starter);
      if (kicker != null) kicker.kickoffs += 1;
      if (scored && catcher.isNotEmpty) {
        final returner = row(snap.offenseId, catcher);
        if (returner != null) returner.td += 1;
      }
    } else if (snap.type == PlayType.fieldGoal) {
      final kicker = row(snap.offenseId, starter);
      if (kicker != null) {
        kicker.fgAtt += 1;
        if (snap.result != ResultKind.incomplete) kicker.fg += 1;
      }
    } else if (snap.type == PlayType.extraPoint) {
      if (snap.tryPoints != 2) {
        final kicker = row(snap.offenseId, starter);
        if (kicker != null) {
          kicker.xpAtt += 1;
          if (snap.result != ResultKind.incomplete) kicker.xp += 1;
        }
      }
    }

    if (!sack &&
        !intercepted &&
        snap.result != ResultKind.fumble &&
        snap.result != ResultKind.fumbleKept &&
        snap.result == ResultKind.tackled) {
      for (final name in tacklers) {
        final tackler = row(tackleTeam, name);
        if (tackler != null) tackler.tackles += 1;
      }
    }
  }

  final quarterLabels =
      <String>{for (final buckets in quarterBuckets.values) ...buckets.keys}
          .toList()
        ..sort((a, b) {
          final rank = _quarterRank(a).compareTo(_quarterRank(b));
          return rank != 0 ? rank : a.compareTo(b);
        });

  List<TeamSlice> slices(String? quarter) => [
    for (final team in book.teams)
      TeamSlice(
        id: team.id,
        name: team.name,
        types: quarter == null
            ? gameBuckets[team.id]!.lines()
            : (quarterBuckets[team.id]?[quarter]?.lines() ?? const []),
      ),
  ];

  return GameStats(
    teams: [
      for (final team in book.teams)
        TeamStats(
          id: team.id,
          name: team.name,
          score: scores[team.id] ?? 0,
          passYds: teamPass[team.id] ?? 0,
          rushYds: teamRush[team.id] ?? 0,
          sacks: teamSacks[team.id] ?? 0,
          sackYds: teamSackYds[team.id] ?? 0,
          players: (maps[team.id]?.values.toList() ?? [])
            ..sort((a, b) => a.label.compareTo(b.label)),
        ),
    ],
    periods: [
      PeriodStats(label: 'Game', teams: slices(null)),
      for (final label in quarterLabels)
        PeriodStats(label: label, teams: slices(label)),
    ],
  );
}
