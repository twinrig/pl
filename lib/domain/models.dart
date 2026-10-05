import 'ids.dart';

enum PlayType {
  pass('Pass'),
  run('Run'),
  sack('Sack'),
  interception('Interception'),
  fumble('Fumble'),
  punt('Punt'),
  kickoff('Kickoff'),
  fieldGoal('Field goal'),
  extraPoint('Extra point'),
  safety('Safety'),
  penalty('Penalty'),
  kneel('Kneel');

  const PlayType(this.label);
  final String label;

  static PlayType parse(Object? value) {
    final text = value?.toString() ?? '';
    for (final type in PlayType.values) {
      if (type.label == text) return type;
    }
    return PlayType.pass;
  }
}

enum ResultKind {
  tackled('tackled', 'Tackled'),
  incomplete('incomplete', 'Incomplete'),
  touchdown('touchdown', 'Touchdown'),
  downed('downed', 'Downed'),
  outOfBounds('out-of-bounds', 'Out of bounds'),
  sack('sack', 'Sack'),
  interception('interception', 'Interception'),
  fumble('fumble', 'Fumble'),
  safety('safety', 'Safety'),
  kneel('kneel', 'Kneel'),
  touchback('touchback', 'Touchback'),
  fairCatch('fair-catch', 'Fair catch'),
  fumbleKept('fumble-kept', 'Fumble kept');

  const ResultKind(this.id, this.label);
  final String id;
  final String label;

  static ResultKind parse(Object? value) {
    final text = value?.toString() ?? '';
    for (final kind in ResultKind.values) {
      if (kind.id == text) return kind;
    }
    return ResultKind.tackled;
  }
}

class Team {
  const Team({required this.id, required this.name});

  final String id;
  final String name;

  Team copyWith({String? id, String? name}) =>
      Team(id: id ?? this.id, name: name ?? this.name);

  Map<String, dynamic> toJson() => {'id': id, 'name': name};

  factory Team.fromJson(Map<String, dynamic> json) => Team(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
      );
}

class Player {
  const Player({
    required this.id,
    required this.teamId,
    required this.number,
    required this.name,
    this.position,
  });

  final String id;
  final String teamId;
  final String number;
  final String name;
  final String? position;

  Player copyWith({
    String? id,
    String? teamId,
    String? number,
    String? name,
    String? position,
  }) {
    return Player(
      id: id ?? this.id,
      teamId: teamId ?? this.teamId,
      number: number ?? this.number,
      name: name ?? this.name,
      position: position ?? this.position,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'teamId': teamId,
        'number': number,
        'name': name,
        if (position != null) 'position': position,
      };

  factory Player.fromJson(Map<String, dynamic> json) => Player(
        id: json['id']?.toString() ?? '',
        teamId: json['teamId']?.toString() ?? '',
        number: json['number']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        position: json['position']?.toString(),
      );
}

class PlaySnapshot {
  const PlaySnapshot({
    required this.quarter,
    required this.down,
    required this.distance,
    required this.offenseId,
    required this.ballTeamId,
    required this.ballYard,
    required this.snapTeamId,
    required this.snapYard,
    required this.type,
    required this.result,
    required this.scoreTime,
    required this.possession,
    required this.starter,
    required this.target1,
    required this.target2,
    required this.tackler1,
    required this.tackler2,
    required this.tackler3,
    this.tryPoints,
  });

  final String quarter;
  final String down;
  final String distance;
  final String offenseId;
  final String ballTeamId;
  final String ballYard;
  final String snapTeamId;
  final String snapYard;
  final PlayType type;
  final ResultKind result;
  final String scoreTime;
  final bool possession;
  final String starter;
  final String target1;
  final String target2;
  final String tackler1;
  final String tackler2;
  final String tackler3;
  final int? tryPoints;

  Map<String, dynamic> toJson() => {
        'quarter': quarter,
        'down': down,
        'distance': distance,
        'offenseId': offenseId,
        'ballTeamId': ballTeamId,
        'ballYard': ballYard,
        'snapTeamId': snapTeamId,
        'snapYard': snapYard,
        'type': type.label,
        'result': result.id,
        'scoreTime': scoreTime,
        'possession': possession,
        'starter': starter,
        'target1': target1,
        'target2': target2,
        'tackler1': tackler1,
        'tackler2': tackler2,
        'tackler3': tackler3,
        if (tryPoints != null) 'tryPoints': tryPoints,
      };

  factory PlaySnapshot.fromJson(Map<String, dynamic> json) {
    final rawTry = json['tryPoints'];
    int? tryPoints;
    if (rawTry == 2 || rawTry == '2') tryPoints = 2;
    if (rawTry == 1 || rawTry == '1') tryPoints = 1;
    return PlaySnapshot(
      quarter: json['quarter']?.toString() ?? '',
      down: json['down']?.toString() ?? '',
      distance: json['distance']?.toString() ?? '',
      offenseId: json['offenseId']?.toString() ?? '',
      ballTeamId: json['ballTeamId']?.toString() ?? '',
      ballYard: json['ballYard']?.toString() ?? '',
      snapTeamId: json['snapTeamId']?.toString() ?? '',
      snapYard: json['snapYard']?.toString() ?? '',
      type: PlayType.parse(json['type']),
      result: ResultKind.parse(json['result']),
      scoreTime: json['scoreTime']?.toString() ?? '',
      possession: json['possession'] == true,
      starter: json['starter']?.toString() ?? '',
      target1: json['target1']?.toString() ?? '',
      target2: json['target2']?.toString() ?? '',
      tackler1: json['tackler1']?.toString() ?? '',
      tackler2: json['tackler2']?.toString() ?? '',
      tackler3: json['tackler3']?.toString() ?? '',
      tryPoints: tryPoints,
    );
  }
}

class LoggedPlay {
  const LoggedPlay({
    required this.id,
    required this.quarter,
    required this.down,
    required this.distance,
    required this.sentence,
    this.clock,
    this.snapshot,
  });

  final String id;
  final String quarter;
  final String? clock;
  final String down;
  final String distance;
  final String sentence;
  final PlaySnapshot? snapshot;

  LoggedPlay copyWith({
    String? id,
    String? quarter,
    String? clock,
    String? down,
    String? distance,
    String? sentence,
    PlaySnapshot? snapshot,
  }) {
    return LoggedPlay(
      id: id ?? this.id,
      quarter: quarter ?? this.quarter,
      clock: clock ?? this.clock,
      down: down ?? this.down,
      distance: distance ?? this.distance,
      sentence: sentence ?? this.sentence,
      snapshot: snapshot ?? this.snapshot,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'quarter': quarter,
        if (clock != null) 'clock': clock,
        'down': down,
        'distance': distance,
        'sentence': sentence,
        if (snapshot != null) 'snapshot': snapshot!.toJson(),
      };

  factory LoggedPlay.fromJson(Map<String, dynamic> json) {
    final raw = json['snapshot'];
    return LoggedPlay(
      id: json['id']?.toString() ?? '',
      quarter: json['quarter']?.toString() ?? '',
      clock: json['clock']?.toString(),
      down: json['down']?.toString() ?? '',
      distance: json['distance']?.toString() ?? '',
      sentence: json['sentence']?.toString() ?? '',
      snapshot: raw is Map
          ? PlaySnapshot.fromJson(Map<String, dynamic>.from(raw))
          : null,
    );
  }
}

class Book {
  const Book({
    required this.teams,
    required this.players,
    required this.plays,
  });

  final List<Team> teams;
  final List<Player> players;
  final List<LoggedPlay> plays;

  Book copyWith({
    List<Team>? teams,
    List<Player>? players,
    List<LoggedPlay>? plays,
  }) {
    return Book(
      teams: teams ?? this.teams,
      players: players ?? this.players,
      plays: plays ?? this.plays,
    );
  }

  Map<String, dynamic> toJson() => {
        'teams': teams.map((team) => team.toJson()).toList(),
        'players': players.map((player) => player.toJson()).toList(),
        'plays': plays.map((play) => play.toJson()).toList(),
      };
}

class Draft {
  const Draft({
    required this.quarter,
    required this.down,
    required this.distance,
    required this.offenseId,
    required this.ballTeamId,
    required this.ballYard,
    required this.seriesTeamId,
    required this.seriesYard,
    required this.snapTeamId,
    required this.snapYard,
    required this.type,
    required this.result,
    required this.scoreTime,
    required this.possession,
    required this.starter,
    required this.target1,
    required this.target2,
    required this.tackler1,
    required this.tackler2,
    required this.tackler3,
    required this.tryPoints,
    required this.lineTeamId,
    required this.lineYard,
    required this.lineManual,
  });

  final String quarter;
  final String down;
  final String distance;
  final String offenseId;
  final String ballTeamId;
  final String ballYard;
  final String seriesTeamId;
  final String seriesYard;
  final String snapTeamId;
  final String snapYard;
  final PlayType type;
  final ResultKind result;
  final String scoreTime;
  final bool possession;
  final String starter;
  final String target1;
  final String target2;
  final String tackler1;
  final String tackler2;
  final String tackler3;
  final int tryPoints;
  final String lineTeamId;
  final String lineYard;
  final bool lineManual;

  factory Draft.initial(Book book) {
    final team = book.teams.isEmpty ? 'home' : book.teams.first.id;
    return Draft(
      quarter: '1',
      down: '1',
      distance: '10',
      offenseId: team,
      ballTeamId: team,
      ballYard: '25',
      seriesTeamId: team,
      seriesYard: '25',
      snapTeamId: team,
      snapYard: '25',
      type: PlayType.pass,
      result: ResultKind.tackled,
      scoreTime: '',
      possession: false,
      starter: '',
      target1: '',
      target2: '',
      tackler1: '',
      tackler2: '',
      tackler3: '',
      tryPoints: 1,
      lineTeamId: team,
      lineYard: '35',
      lineManual: false,
    );
  }

  factory Draft.fromSaved(Book book, Map<String, dynamic>? json) {
    final base = Draft.initial(book);
    if (json == null) return base;
    String text(String key, String fallback) {
      if (!json.containsKey(key) || json[key] == null) return fallback;
      return json[key].toString();
    }

    bool flag(String key, bool fallback) {
      final value = json[key];
      return value is bool ? value : fallback;
    }

    var tryPoints = base.tryPoints;
    final rawTry = json['tryPoints'];
    if (rawTry == 2 || rawTry == '2') tryPoints = 2;
    if (rawTry == 1 || rawTry == '1') tryPoints = 1;
    return Draft(
      quarter: text('quarter', base.quarter),
      down: text('down', base.down),
      distance: text('distance', base.distance),
      offenseId: text('offenseId', base.offenseId),
      ballTeamId: text('ballTeamId', base.ballTeamId),
      ballYard: text('ballYard', base.ballYard),
      seriesTeamId: text('seriesTeamId', base.seriesTeamId),
      seriesYard: text('seriesYard', base.seriesYard),
      snapTeamId: text('snapTeamId', base.snapTeamId),
      snapYard: text('snapYard', base.snapYard),
      type: json.containsKey('type') ? PlayType.parse(json['type']) : base.type,
      result: json.containsKey('result')
          ? ResultKind.parse(json['result'])
          : base.result,
      scoreTime: text('scoreTime', base.scoreTime),
      possession: flag('possession', base.possession),
      starter: text('starter', base.starter),
      target1: text('target1', base.target1),
      target2: text('target2', base.target2),
      tackler1: text('tackler1', base.tackler1),
      tackler2: text('tackler2', base.tackler2),
      tackler3: text('tackler3', base.tackler3),
      tryPoints: tryPoints,
      lineTeamId: text('lineTeamId', base.lineTeamId),
      lineYard: text('lineYard', base.lineYard),
      lineManual: flag('lineManual', base.lineManual),
    );
  }

  Draft copyWith({
    String? quarter,
    String? down,
    String? distance,
    String? offenseId,
    String? ballTeamId,
    String? ballYard,
    String? seriesTeamId,
    String? seriesYard,
    String? snapTeamId,
    String? snapYard,
    PlayType? type,
    ResultKind? result,
    String? scoreTime,
    bool? possession,
    String? starter,
    String? target1,
    String? target2,
    String? tackler1,
    String? tackler2,
    String? tackler3,
    int? tryPoints,
    String? lineTeamId,
    String? lineYard,
    bool? lineManual,
  }) {
    return Draft(
      quarter: quarter ?? this.quarter,
      down: down ?? this.down,
      distance: distance ?? this.distance,
      offenseId: offenseId ?? this.offenseId,
      ballTeamId: ballTeamId ?? this.ballTeamId,
      ballYard: ballYard ?? this.ballYard,
      seriesTeamId: seriesTeamId ?? this.seriesTeamId,
      seriesYard: seriesYard ?? this.seriesYard,
      snapTeamId: snapTeamId ?? this.snapTeamId,
      snapYard: snapYard ?? this.snapYard,
      type: type ?? this.type,
      result: result ?? this.result,
      scoreTime: scoreTime ?? this.scoreTime,
      possession: possession ?? this.possession,
      starter: starter ?? this.starter,
      target1: target1 ?? this.target1,
      target2: target2 ?? this.target2,
      tackler1: tackler1 ?? this.tackler1,
      tackler2: tackler2 ?? this.tackler2,
      tackler3: tackler3 ?? this.tackler3,
      tryPoints: tryPoints ?? this.tryPoints,
      lineTeamId: lineTeamId ?? this.lineTeamId,
      lineYard: lineYard ?? this.lineYard,
      lineManual: lineManual ?? this.lineManual,
    );
  }

  Map<String, dynamic> toJson() => {
        'quarter': quarter,
        'down': down,
        'distance': distance,
        'offenseId': offenseId,
        'ballTeamId': ballTeamId,
        'ballYard': ballYard,
        'seriesTeamId': seriesTeamId,
        'seriesYard': seriesYard,
        'snapTeamId': snapTeamId,
        'snapYard': snapYard,
        'type': type.label,
        'result': result.id,
        'scoreTime': scoreTime,
        'possession': possession,
        'starter': starter,
        'target1': target1,
        'target2': target2,
        'tackler1': tackler1,
        'tackler2': tackler2,
        'tackler3': tackler3,
        'tryPoints': tryPoints,
        'lineTeamId': lineTeamId,
        'lineYard': lineYard,
        'lineManual': lineManual,
      };
}

class GameRecord {
  const GameRecord({
    required this.id,
    required this.date,
    required this.isFinal,
    required this.book,
    required this.draft,
  });

  final String id;
  final String date;
  final bool isFinal;
  final Book book;
  final Draft draft;

  GameRecord copyWith({
    String? id,
    String? date,
    bool? isFinal,
    Book? book,
    Draft? draft,
  }) {
    return GameRecord(
      id: id ?? this.id,
      date: date ?? this.date,
      isFinal: isFinal ?? this.isFinal,
      book: book ?? this.book,
      draft: draft ?? this.draft,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'date': date,
        'final': isFinal,
        'book': book.toJson(),
        'draft': draft.toJson(),
      };
}

class PastSeason {
  const PastSeason({
    required this.id,
    required this.stopped,
    required this.games,
    required this.activeId,
    this.label,
  });

  final String id;
  final String stopped;
  final String? label;
  final List<GameRecord> games;
  final String activeId;

  Map<String, dynamic> toJson() => {
        'id': id,
        'stopped': stopped,
        if (label != null) 'label': label,
        'games': games.map((game) => game.toJson()).toList(),
        'activeId': activeId,
      };
}

class Season {
  const Season({
    required this.id,
    required this.closed,
    required this.games,
    required this.activeId,
    required this.past,
  });

  final String id;
  final bool closed;
  final List<GameRecord> games;
  final String activeId;
  final List<PastSeason> past;

  Season copyWith({
    String? id,
    bool? closed,
    List<GameRecord>? games,
    String? activeId,
    List<PastSeason>? past,
  }) {
    return Season(
      id: id ?? this.id,
      closed: closed ?? this.closed,
      games: games ?? this.games,
      activeId: activeId ?? this.activeId,
      past: past ?? this.past,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'closed': closed,
        'games': games.map((game) => game.toJson()).toList(),
        'activeId': activeId,
        'past': past.map((item) => item.toJson()).toList(),
      };
}

String _filled(Object? value) {
  final text = value?.toString() ?? '';
  return text;
}

GameRecord? readGame(dynamic raw, Book Function(dynamic book) normalize) {
  if (raw is! Map) return null;
  final map = Map<String, dynamic>.from(raw);
  final book = normalize(map['book']);
  final draftRaw = map['draft'];
  final id = _filled(map['id']);
  final date = _filled(map['date']);
  return GameRecord(
    id: id.isEmpty ? newId() : id,
    date: date.isEmpty ? today() : date,
    isFinal: map['final'] == true,
    book: book,
    draft: Draft.fromSaved(
      book,
      draftRaw is Map ? Map<String, dynamic>.from(draftRaw) : null,
    ),
  );
}
