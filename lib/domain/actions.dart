import 'dart:math' as math;

import 'ids.dart';
import 'models.dart';
import 'plays.dart';
import 'rosters.dart';

GameRecord activeGame(Season season) {
  for (final game in season.games) {
    if (game.id == season.activeId) return game;
  }
  return season.games.first;
}

String defenseId(Book book, String offenseId) {
  for (final team in book.teams) {
    if (team.id != offenseId) return team.id;
  }
  return offenseId;
}

String teamName(Book book, String id) {
  for (final team in book.teams) {
    if (team.id == id) return team.name;
  }
  return '';
}

String distanceFor(Draft draft, [String? offenseId]) {
  final offense = offenseId ?? draft.offenseId;
  if (draft.lineManual) {
    final ball = progressFromGoal(offense, draft.ballTeamId, draft.ballYard);
    final line = progressFromGoal(offense, draft.lineTeamId, draft.lineYard);
    if (ball != null && line != null) {
      return '${math.max(0, (line - ball).round())}';
    }
  }
  return toGoFromSeries(
        offense,
        draft.seriesTeamId,
        draft.seriesYard,
        draft.ballTeamId,
        draft.ballYard,
      ) ??
      draft.distance;
}

Draft placeBall(Draft draft, String teamId, String yard) {
  final next = draft.copyWith(ballTeamId: teamId, ballYard: yard);
  return next.copyWith(distance: distanceFor(next));
}

Draft setSeries(Draft draft, String teamId, String yard) {
  final next = draft.copyWith(
    seriesTeamId: teamId,
    seriesYard: yard,
    lineManual: false,
  );
  return next.copyWith(distance: distanceFor(next));
}

Draft setFirstDown(Draft draft, String teamId, String yard) {
  final next = draft.copyWith(
    lineTeamId: teamId,
    lineYard: yard,
    lineManual: true,
  );
  return next.copyWith(distance: distanceFor(next));
}

Draft setDown(Draft draft, String down) {
  if (down != '1') {
    final next = draft.copyWith(down: down);
    return next.copyWith(distance: distanceFor(next));
  }
  return draft.copyWith(
    down: down,
    distance: '10',
    lineManual: false,
    seriesTeamId: draft.ballTeamId,
    seriesYard: draft.ballYard,
    snapTeamId: draft.ballTeamId,
    snapYard: draft.ballYard,
  );
}

String sentenceFrom(Book book, Draft draft) {
  final offense = draft.offenseId;
  final defense = defenseId(book, offense);
  final punt = draft.type == PlayType.punt;
  final ballMoved =
      draft.ballTeamId != draft.snapTeamId ||
      normNum(draft.ballYard) != normNum(draft.snapYard);
  final showEnd = draft.type == PlayType.kickoff || ballMoved;
  final targetNumbers = punt ? [draft.target1] : [draft.target1, draft.target2];
  final tacklerNumbers = punt
      ? [draft.tackler1]
      : [draft.tackler1, draft.tackler2, draft.tackler3];
  return buildSentence(
    SentenceInput(
      ballTeam: teamName(book, draft.snapTeamId),
      ballYard: draft.snapYard,
      endTeam: showEnd ? teamName(book, draft.ballTeamId) : '',
      endYard: showEnd ? draft.ballYard : '',
      type: draft.type.label,
      result: draft.result,
      scoreTime: draft.scoreTime,
      starter: labelFor(draft.starter, book.players, offense, true),
      targets: targetNumbers
          .map(
            (number) =>
                labelFor(number, book.players, punt ? defense : offense, true),
          )
          .where((label) => label.isNotEmpty)
          .toList(),
      tacklers: tacklerNumbers
          .map(
            (number) =>
                labelFor(number, book.players, punt ? offense : defense, true),
          )
          .where((label) => label.isNotEmpty)
          .toList(),
      tryPoints: draft.tryPoints,
    ),
  );
}

PlaySnapshot snapshotFrom(Draft draft, String scoreTime) {
  return PlaySnapshot(
    quarter: draft.quarter,
    down: draft.down,
    distance: draft.distance,
    offenseId: draft.offenseId,
    ballTeamId: draft.ballTeamId,
    ballYard: draft.ballYard,
    snapTeamId: draft.snapTeamId,
    snapYard: draft.snapYard,
    type: draft.type,
    result: draft.result,
    scoreTime: scoreTime,
    possession: draft.possession,
    starter: draft.starter,
    target1: draft.target1,
    target2: draft.target2,
    tackler1: draft.tackler1,
    tackler2: draft.tackler2,
    tackler3: draft.tackler3,
    tryPoints: draft.tryPoints,
  );
}

Draft draftFromPlay(LoggedPlay play, Book book) {
  final base = Draft.initial(book);
  final snap = play.snapshot;
  if (snap == null) {
    return base.copyWith(
      quarter: play.quarter,
      down: play.down,
      distance: play.distance,
    );
  }
  return base.copyWith(
    quarter: snap.quarter,
    down: snap.down,
    distance: snap.distance,
    offenseId: snap.offenseId,
    ballTeamId: snap.ballTeamId,
    ballYard: snap.ballYard,
    snapTeamId: snap.snapTeamId,
    snapYard: snap.snapYard,
    type: snap.type,
    result: snap.result,
    scoreTime: snap.scoreTime,
    possession: snap.possession,
    starter: snap.starter,
    target1: snap.target1,
    target2: snap.target2,
    tackler1: snap.tackler1,
    tackler2: snap.tackler2,
    tackler3: snap.tackler3,
    tryPoints: snap.tryPoints ?? 1,
    seriesTeamId: snap.snapTeamId,
    seriesYard: snap.snapYard,
  );
}

bool playNeedsTime(Draft draft) => draft.result == ResultKind.touchdown;

Draft nextDraftAfter(Book book, Draft draft) {
  final gained = yardsGained(
    offenseId: draft.offenseId,
    ballTeamId: draft.seriesTeamId,
    ballYard: draft.seriesYard,
    endTeamId: draft.ballTeamId,
    endYard: draft.ballYard,
  );
  final madeLine =
      draft.result == ResultKind.touchdown || (gained != null && gained >= 10);
  final turnover =
      draft.type == PlayType.punt ||
      draft.type == PlayType.kickoff ||
      draft.type == PlayType.interception ||
      draft.type == PlayType.fumble ||
      draft.type == PlayType.safety ||
      turnoverResults.contains(draft.result) ||
      draft.possession;
  final cleared = draft.copyWith(
    snapTeamId: draft.ballTeamId,
    snapYard: draft.ballYard,
    scoreTime: '',
    possession: false,
    type: PlayType.run,
    result: ResultKind.tackled,
    starter: '',
    target1: '',
    target2: '',
    tackler1: '',
    tackler2: '',
    tackler3: '',
  );
  if (draft.type == PlayType.extraPoint) {
    return cleared.copyWith(
      type: PlayType.kickoff,
      possession: true,
      result: ResultKind.tackled,
      offenseId: draft.offenseId,
      down: '1',
      distance: '10',
      ballTeamId: draft.offenseId,
      ballYard: '40',
      snapTeamId: draft.offenseId,
      snapYard: '40',
      seriesTeamId: draft.offenseId,
      seriesYard: '40',
      lineManual: false,
    );
  }
  if (turnover || madeLine || draft.down == '4') {
    return cleared.copyWith(
      offenseId: turnover ? defenseId(book, draft.offenseId) : draft.offenseId,
      down: '1',
      distance: '10',
      lineManual: false,
      seriesTeamId: draft.ballTeamId,
      seriesYard: draft.ballYard,
    );
  }
  final downNumber = int.tryParse(draft.down) ?? 0;
  return cleared.copyWith(down: '${downNumber + 1}');
}

Season _replaceActive(Season season, GameRecord game) {
  return season.copyWith(
    games: [
      for (final item in season.games)
        if (item.id == season.activeId) game else item,
    ],
  );
}

/// Logs the active draft. Returns null when the play cannot be logged yet.
Season? applyLogPlay(Season season, String scoreTime) {
  final active = activeGame(season);
  if (active.isFinal || season.closed) return null;
  final draft = active.draft;
  if (draft.starter.trim().isEmpty) return null;
  if (playNeedsTime(draft) && scoreTime.trim().isEmpty) return null;
  final logged = draft.copyWith(scoreTime: scoreTime.trim());
  final play = LoggedPlay(
    id: newId(),
    quarter: draft.quarter,
    down: draft.down,
    distance: draft.distance,
    sentence: sentenceFrom(active.book, logged),
    snapshot: snapshotFrom(logged, scoreTime.trim()),
  );
  return _replaceActive(
    season,
    active.copyWith(
      book: active.book.copyWith(plays: [play, ...active.book.plays]),
      draft: nextDraftAfter(active.book, draft),
    ),
  );
}

String? sideForNumber(
  String number,
  List<Player> players,
  String offenseId,
  String defense,
) {
  final jersey = normNum(number);
  if (jersey.isEmpty) return null;
  final onOffense = players.any(
    (player) => player.teamId == offenseId && normNum(player.number) == jersey,
  );
  final onDefense = players.any(
    (player) => player.teamId == defense && normNum(player.number) == jersey,
  );
  if (onOffense && !onDefense) return 'offense';
  if (onDefense && !onOffense) return 'defense';
  return null;
}

Season? applyPenalty({
  required Season season,
  required String penaltyNumber,
  required String penaltyId,
  required String penaltySide,
  required bool penaltyReplay,
  required bool penaltyDead,
}) {
  final active = activeGame(season);
  if (active.isFinal || season.closed) return null;
  final draft = active.draft;
  final book = active.book;
  final number = penaltyNumber.trim();
  if (number.isEmpty) return null;
  final penalty = penaltyById(penaltyId);
  final againstOffense = penaltySide == 'offense';
  final guiltyId = againstOffense
      ? draft.offenseId
      : defenseId(book, draft.offenseId);
  final who = labelFor(number, book.players, guiltyId);
  final progress = progressFromGoal(
    draft.offenseId,
    draft.ballTeamId,
    draft.ballYard,
  );
  if (progress == null) return null;
  final nextProgress = enforceSpot(progress, penalty.yards, againstOffense);
  final spot = spotAtProgress(
    draft.offenseId,
    defenseId(book, draft.offenseId),
    nextProgress,
  );
  final moved = (nextProgress - progress.round()).abs();
  final half = moved < penalty.yards;
  final autoFirst =
      !penaltyDead && !penaltyReplay && !againstOffense && penalty.autoFirst;
  final seriesProgress =
      progressFromGoal(draft.offenseId, draft.seriesTeamId, draft.seriesYard) ??
      0;
  final manualLine = progressFromGoal(
    draft.offenseId,
    draft.lineTeamId,
    draft.lineYard,
  );
  final lineProgress = draft.lineManual
      ? (manualLine ?? math.min(100, seriesProgress + 10))
      : math.min(100, seriesProgress + 10);
  final crossed =
      penaltyDead && progress < lineProgress && nextProgress >= lineProgress;
  final awardFirst = autoFirst || crossed;
  final distance = awardFirst
      ? '10'
      : (toGoFromSeries(
              draft.offenseId,
              draft.seriesTeamId,
              draft.seriesYard,
              spot.teamId,
              spot.yard,
            ) ??
            draft.distance);
  final down = awardFirst ? '1' : draft.down;
  final yardsText = half ? 'half the distance' : '${penalty.yards} yards';
  final downText = crossed || autoFirst
      ? ' First down.'
      : penaltyReplay
      ? ' Down replayed.'
      : '';
  final kind = penaltyDead ? 'Dead ball foul' : 'Penalty';
  final sentence =
      '$kind on $who, ${penalty.label.toLowerCase()}, $yardsText. Ball on the ${teamName(book, spot.teamId)} ${spot.yard}.$downText';
  final play = LoggedPlay(
    id: newId(),
    quarter: draft.quarter,
    down: down,
    distance: distance,
    sentence: sentence,
  );
  return _replaceActive(
    season,
    active.copyWith(
      book: book.copyWith(plays: [play, ...book.plays]),
      draft: draft.copyWith(
        down: down,
        distance: distance,
        ballTeamId: spot.teamId,
        ballYard: spot.yard,
        snapTeamId: spot.teamId,
        snapYard: spot.yard,
        seriesTeamId: awardFirst ? spot.teamId : draft.seriesTeamId,
        seriesYard: awardFirst ? spot.yard : draft.seriesYard,
        lineManual: awardFirst ? false : draft.lineManual,
      ),
    ),
  );
}

GameRecord freshGame(Book book, {Draft? draft}) {
  return GameRecord(
    id: newId(),
    date: today(),
    isFinal: false,
    book: book,
    draft: draft ?? Draft.initial(book),
  );
}

Season emptySeason() {
  final game = freshGame(emptyBook());
  return Season(
    id: newId(),
    closed: false,
    games: [game],
    activeId: game.id,
    past: const [],
  );
}

Season applyNewGame(Season season) {
  if (season.closed) return season;
  final playing = activeGame(season);
  final home = playing.book.teams.isEmpty ? null : playing.book.teams.first;
  final away = playing.book.teams.length < 2 ? null : playing.book.teams[1];
  final homeId = home?.id ?? 'home';
  final book = Book(
    teams: [for (final team in playing.book.teams) team.copyWith()],
    players: [for (final player in playing.book.players) player.copyWith()],
    plays: [
      LoggedPlay(
        id: newId(),
        quarter: '',
        down: '',
        distance: '',
        sentence:
            'New Game - ${home?.name ?? 'Home'} vs ${away?.name ?? 'Away'}.',
      ),
    ],
  );
  final game = freshGame(
    book,
    draft: Draft.initial(book).copyWith(
      offenseId: homeId,
      ballTeamId: homeId,
      ballYard: '40',
      seriesTeamId: homeId,
      seriesYard: '40',
      snapTeamId: homeId,
      snapYard: '40',
      type: PlayType.kickoff,
      possession: true,
    ),
  );
  return season.copyWith(
    games: [
      for (final item in season.games)
        if (item.id == season.activeId) item.copyWith(isFinal: true) else item,
      game,
    ],
    activeId: game.id,
  );
}

Season applyCompleteGame(Season season) {
  return season.copyWith(
    games: [
      for (final game in season.games)
        if (game.id == season.activeId) game.copyWith(isFinal: true) else game,
    ],
  );
}

Season applyStopSeason(Season season) {
  return applyCompleteGame(season).copyWith(closed: true);
}

String seasonLabel(List<GameRecord> games, String stopped) {
  final dates =
      games.map((game) => game.date).where((date) => date.isNotEmpty).toList()
        ..sort();
  final source = dates.isEmpty ? stopped : dates.first;
  final year = source.length >= 4 ? source.substring(0, 4) : source;
  final homeName = games.isEmpty || games.first.book.teams.isEmpty
      ? ''
      : games.first.book.teams.first.name.trim();
  final home = homeName.isEmpty ? 'Season' : homeName;
  return '$year $home';
}

Season applyStartSeason(Season season) {
  final current = activeGame(season);
  final home = current.book.teams.isEmpty ? null : current.book.teams.first;
  final homeId = home?.id ?? 'home';
  final homeName = home == null || home.name.trim().isEmpty
      ? 'Home'
      : home.name;
  final book = Book(
    teams: [
      Team(id: homeId, name: homeName),
      const Team(id: 'away', name: 'Away'),
    ],
    players: [
      for (final player in current.book.players)
        if (player.teamId == homeId) player.copyWith(),
    ],
    plays: const [],
  );
  final game = freshGame(
    book,
    draft: Draft.initial(book).copyWith(
      offenseId: homeId,
      ballTeamId: homeId,
      ballYard: '40',
      type: PlayType.kickoff,
      possession: true,
      snapTeamId: homeId,
      snapYard: '40',
      seriesTeamId: homeId,
      seriesYard: '40',
    ),
  );
  final stopped = today();
  final games = [for (final item in season.games) item.copyWith(isFinal: true)];
  return Season(
    id: newId(),
    closed: false,
    games: [game],
    activeId: game.id,
    past: [
      ...season.past,
      PastSeason(
        id: season.id,
        stopped: stopped,
        label: seasonLabel(games, stopped),
        games: games,
        activeId: season.activeId,
      ),
    ],
  );
}

Season applyOpenPast(Season season, String id) {
  PastSeason? found;
  for (final item in season.past) {
    if (item.id == id) found = item;
  }
  if (found == null) return season;
  final stopped = today();
  final games = [for (final game in season.games) game.copyWith(isFinal: true)];
  return Season(
    id: found.id,
    closed: true,
    games: found.games,
    activeId: found.activeId,
    past: [
      for (final item in season.past)
        if (item.id != id) item,
      PastSeason(
        id: season.id,
        stopped: stopped,
        label: seasonLabel(games, stopped),
        games: games,
        activeId: season.activeId,
      ),
    ],
  );
}

Season applyOpenGame(Season season, String id) => season.copyWith(activeId: id);

Season applyRemoveGame(Season season, String id) {
  if (season.games.length < 2) return season;
  final games = season.games.where((game) => game.id != id).toList();
  final activeId = season.activeId == id ? games.last.id : season.activeId;
  return season.copyWith(games: games, activeId: activeId);
}

Season applyGameDate(Season season, String id, String date) {
  return season.copyWith(
    games: [
      for (final game in season.games)
        if (game.id == id) game.copyWith(date: date) else game,
    ],
  );
}

Season updateActiveDraft(Season season, Draft draft) {
  final active = activeGame(season);
  if (active.id != season.activeId) return season;
  return _replaceActive(season, active.copyWith(draft: draft));
}

Season updateActiveBook(Season season, Book book) {
  final active = activeGame(season);
  if (active.id != season.activeId) return season;
  return _replaceActive(season, active.copyWith(book: book));
}

Book renameTeam(Book book, String id, String name) {
  return book.copyWith(
    teams: [
      for (final team in book.teams)
        if (team.id == id) team.copyWith(name: name) else team,
    ],
  );
}

Book addPlayer(
  Book book,
  String teamId,
  String number,
  String name,
  String position,
) {
  final jersey = normNum(number);
  final trimmed = name.trim();
  final pos = position.trim();
  if (jersey.isEmpty || trimmed.isEmpty) return book;
  Player? existing;
  for (final player in book.players) {
    if (player.teamId == teamId && normNum(player.number) == jersey) {
      existing = player;
      break;
    }
  }
  if (existing != null) {
    return book.copyWith(
      players: [
        for (final player in book.players)
          if (player.id == existing.id)
            player.copyWith(name: trimmed, number: jersey, position: pos)
          else
            player,
      ],
    );
  }
  return book.copyWith(
    players: [
      ...book.players,
      Player(
        id: newId(),
        teamId: teamId,
        number: jersey,
        name: trimmed,
        position: pos,
      ),
    ],
  );
}

Book loadRoster(Book book, String teamId, String text) {
  final rows = <Player>[];
  for (final line in text.split(RegExp(r'\r?\n'))) {
    final parts = line
        .split(',')
        .map((part) => part.trim().replaceAll(RegExp(r'^"|"$'), ''))
        .toList();
    if (parts.length < 2) continue;
    final number = normNum(parts[0].replaceFirst(RegExp(r'^#'), ''));
    final name = parts[1];
    if (number.isEmpty || name.isEmpty) continue;
    rows.add(
      Player(
        id: newId(),
        teamId: teamId,
        number: number,
        name: name,
        position: parts.length > 2 ? parts[2] : '',
      ),
    );
  }
  if (rows.isEmpty) return book;
  return book.copyWith(
    players: [
      ...book.players.where((player) => player.teamId != teamId),
      ...rows,
    ],
  );
}

Book removePlayer(Book book, String id) {
  return book.copyWith(
    players: book.players.where((player) => player.id != id).toList(),
  );
}

Book undoPlay(Book book, String id) {
  return book.copyWith(
    plays: book.plays.where((play) => play.id != id).toList(),
  );
}

Book replacePlay(Book book, LoggedPlay play) {
  return book.copyWith(
    plays: [
      for (final item in book.plays)
        if (item.id == play.id) play else item,
    ],
  );
}

String csvText(Book book) {
  const header = [
    'Quarter',
    'Down',
    'Distance',
    'Play',
    'Result',
    'Start',
    'Targets',
    'Tacklers',
    'Log',
  ];
  String cell(String value) => '"${value.replaceAll('"', '""')}"';
  final rows = book.plays.reversed.map((play) {
    final snap = play.snapshot;
    final defense = snap == null ? '' : defenseId(book, snap.offenseId);
    final punt = snap?.type == PlayType.punt;
    String names(List<String> numbers, String teamId) {
      return numbers
          .map((number) => labelFor(number, book.players, teamId, true))
          .where((label) => label.isNotEmpty)
          .join(', ');
    }

    final result = snap == null ? '' : snap.result.label;
    return [
      play.quarter,
      play.down,
      play.distance,
      snap?.type.label ?? '',
      result,
      snap == null
          ? ''
          : labelFor(snap.starter, book.players, snap.offenseId, true),
      snap == null
          ? ''
          : names(
              punt ? [snap.target1] : [snap.target1, snap.target2],
              punt ? defense : snap.offenseId,
            ),
      snap == null
          ? ''
          : names(
              punt
                  ? [snap.tackler1]
                  : [snap.tackler1, snap.tackler2, snap.tackler3],
              punt ? snap.offenseId : defense,
            ),
      play.sentence,
    ].map(cell).join(',');
  });
  return [header.join(','), ...rows].join('\n');
}

String hintFor(
  String number,
  List<Player> players,
  String preferTeamId, [
  bool strict = false,
]) {
  if (number.trim().isEmpty) return '';
  final name = lookupName(number, players, preferTeamId, strict);
  return name == null ? normNum(number) : '$name (${normNum(number)})';
}

Book normalizeBook(dynamic raw) {
  if (raw is! Map) return emptyBook();
  final map = Map<String, dynamic>.from(raw);
  final teams = <Team>[];
  final teamsRaw = map['teams'];
  if (teamsRaw is List) {
    for (final item in teamsRaw.take(2)) {
      if (item is Map) {
        teams.add(Team.fromJson(Map<String, dynamic>.from(item)));
      }
    }
  }
  if (teams.length < 2) return emptyBook();
  final players = <Player>[];
  final playersRaw = map['players'];
  if (playersRaw is List) {
    for (final item in playersRaw) {
      if (item is Map) {
        players.add(Player.fromJson(Map<String, dynamic>.from(item)));
      }
    }
  }
  final plays = <LoggedPlay>[];
  final playsRaw = map['plays'];
  if (playsRaw is List) {
    for (final item in playsRaw) {
      if (item is Map) {
        plays.add(LoggedPlay.fromJson(Map<String, dynamic>.from(item)));
      }
    }
  }
  final book = Book(teams: teams, players: players, plays: plays);
  return book.players.isEmpty ? withRosters(book) : book;
}

PastSeason? _readPast(dynamic raw) {
  if (raw is! Map) return null;
  final map = Map<String, dynamic>.from(raw);
  final games = <GameRecord>[];
  final rawGames = map['games'];
  if (rawGames is List) {
    for (final item in rawGames) {
      final game = readGame(item, normalizeBook);
      if (game != null) games.add(game);
    }
  }
  if (games.isEmpty) return null;
  final stoppedRaw = map['stopped']?.toString() ?? '';
  final stopped = stoppedRaw.isEmpty ? today() : stoppedRaw;
  final active = map['activeId']?.toString() ?? '';
  final id = map['id']?.toString() ?? '';
  final label = map['label']?.toString() ?? '';
  return PastSeason(
    id: id.isEmpty ? newId() : id,
    stopped: stopped,
    label: label.isEmpty ? seasonLabel(games, stopped) : label,
    games: games,
    activeId: games.any((game) => game.id == active) ? active : games.first.id,
  );
}

Season? seasonFromParsed(dynamic parsed) {
  if (parsed is! Map) return null;
  final map = Map<String, dynamic>.from(parsed);
  var body = map;
  final nested = map['season'];
  if (nested is Map && nested['games'] is List) {
    body = Map<String, dynamic>.from(nested);
  }
  final rawGames = body['games'];
  if (rawGames is! List || rawGames.isEmpty) return null;
  final games = <GameRecord>[];
  for (final item in rawGames) {
    final game = readGame(item, normalizeBook);
    if (game != null) games.add(game);
  }
  if (games.isEmpty) return null;
  final active = body['activeId']?.toString() ?? '';
  final past = <PastSeason>[];
  final rawPast = body['past'];
  if (rawPast is List) {
    for (final item in rawPast) {
      final read = _readPast(item);
      if (read != null) past.add(read);
    }
  }
  final id = body['id']?.toString() ?? '';
  return Season(
    id: id.isEmpty ? newId() : id,
    closed: body['closed'] == true,
    games: games,
    activeId: games.any((game) => game.id == active) ? active : games.first.id,
    past: past,
  );
}

Season? seasonFromLegacyBook(dynamic parsed) {
  if (parsed is! Map) return null;
  final teams = parsed['teams'];
  if (teams is! List || teams.length < 2) return null;
  final game = freshGame(normalizeBook(parsed));
  return Season(
    id: newId(),
    closed: false,
    games: [game],
    activeId: game.id,
    past: const [],
  );
}

Map<String, dynamic> backupEnvelope(Season season) => {
  'version': 1,
  'savedAt': DateTime.now().toUtc().toIso8601String(),
  'season': season.toJson(),
};

String penaltyNote({
  required Penalty penalty,
  required String penaltySide,
  required bool penaltyReplay,
  required bool penaltyDead,
}) {
  final effect = penaltyDead
      ? 'Dead ball. The down stays unless the new spot reaches the 1st down line.'
      : penaltyReplay
      ? 'The down is replayed.'
      : penaltySide == 'defense' && penalty.autoFirst
      ? 'First down.'
      : 'The down stands.';
  return '${penalty.yards} yards on the $penaltySide. $effect';
}
