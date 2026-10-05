import 'package:flutter_test/flutter_test.dart';
import 'package:play_log/domain/actions.dart';
import 'package:play_log/domain/models.dart';
import 'package:play_log/domain/plays.dart';
import 'package:play_log/domain/rosters.dart';
import 'package:play_log/domain/stats.dart';

void main() {
  test('pass sentence names the passer, target, and tacklers', () {
    final sentence = buildSentence(
      const SentenceInput(
        ballTeam: "O'Gorman",
        ballYard: '45',
        endTeam: 'Washington',
        endYard: '37',
        type: 'Pass',
        result: ResultKind.tackled,
        starter: 'Chace Hermanson (3)',
        targets: ['Rylan Cody (7)'],
        tacklers: ['18', '74'],
      ),
    );
    expect(
      sentence,
      "Ball on the O'Gorman 45. Pass from Chace Hermanson (3) to Rylan Cody (7) tackled on the Washington 37 by 18,74.",
    );
  });

  test('start and targets stay on offense, tacklers stay on defense', () {
    final book = emptyBook();
    final offense = book.teams.first.id;
    final defense = defenseId(book, offense);
    final draft = Draft.initial(book).copyWith(
      offenseId: offense,
      starter: '3',
      target1: '5',
      target2: '74',
      tackler1: '2',
      tackler2: '5',
      tackler3: '3',
    );
    final sentence = sentenceFrom(book, draft);
    expect(sentence, contains('Chace Hermanson (3)'));
    expect(sentence, contains('to Brady Majeres (5) and 74'));
    expect(sentence, contains('by 2,Darius Harrison (5),Kobe Gully (3)'));
    expect(sentence, isNot(contains('Carter Majeres')));
    expect(sentence, isNot(contains('Noah Miller')));
    expect(sentence, isNot(contains('Kobe Gully (3) to')));
    expect(
      hintFor(draft.starter, book.players, offense, true),
      'Chace Hermanson (3)',
    );
    expect(
      hintFor(draft.target1, book.players, offense, true),
      'Brady Majeres (5)',
    );
    expect(hintFor(draft.target2, book.players, offense, true), '74');
    expect(hintFor(draft.tackler1, book.players, defense, true), '2');
    expect(
      hintFor(draft.tackler2, book.players, defense, true),
      'Darius Harrison (5)',
    );
    expect(
      hintFor(draft.tackler3, book.players, defense, true),
      'Kobe Gully (3)',
    );

    final kick = sentenceFrom(book, draft.copyWith(type: PlayType.kickoff));
    expect(kick, contains('kicker Chace Hermanson (3)'));
    expect(kick, contains('Brady Majeres (5)'));
    expect(kick, contains('Kobe Gully (3)'));
    expect(kick, isNot(contains('Carter Majeres')));
    expect(kick, isNot(contains('Noah Miller')));
  });

  test('a punt names the punter and tackler on offense and the receiver on defense', () {
    final book = emptyBook();
    final home = book.teams.first.id;
    final defense = defenseId(book, home);
    final draft = Draft.initial(book).copyWith(
      offenseId: home,
      type: PlayType.punt,
      starter: '3',
      target1: '5',
      target2: '7',
      tackler1: '2',
      tackler2: '54',
    );
    final sentence = sentenceFrom(book, draft);
    expect(sentence, contains('punter Chace Hermanson (3)'));
    expect(sentence, contains('receiver Darius Harrison (5)'));
    expect(sentence, contains('Carter Majeres (2)'));
    expect(sentence, isNot(contains('Brady Majeres')));
    expect(sentence, isNot(contains('Luis Vazquez')));
    expect(sentence, isNot(contains('Kayen Hammer')));
    expect(sentence, isNot(contains('Lincoln Damm')));

    final logged = book.copyWith(
      plays: [
        LoggedPlay(
          id: 'punt',
          quarter: draft.quarter,
          down: draft.down,
          distance: draft.distance,
          sentence: sentence,
          snapshot: snapshotFrom(draft, ''),
        ),
      ],
    );
    final csv = csvText(logged);
    expect(csv, contains('Chace Hermanson (3)'));
    expect(csv, contains('Darius Harrison (5)'));
    expect(csv, contains('Carter Majeres (2)'));
    expect(csv, isNot(contains('Brady Majeres')));
    expect(csv, isNot(contains('Luis Vazquez')));
    expect(csv, isNot(contains('Kayen Hammer')));
    expect(csv, isNot(contains('Lincoln Damm')));

    final stats = gameStats(logged);
    final offense = stats.teams.firstWhere((team) => team.id == home);
    final covering = stats.teams.firstWhere((team) => team.id == defense);
    expect(
      offense.players
          .singleWhere((line) => line.label.contains('Hermanson'))
          .punts,
      1,
    );
    expect(
      offense.players
          .singleWhere((line) => line.label.contains('Carter'))
          .tackles,
      1,
    );
    expect(covering.players.every((line) => line.tackles == 0), isTrue);
  });

  test('yards and first-down spot follow the offense goal line', () {
    expect(
      yardsGained(
        offenseId: 'home',
        ballTeamId: 'home',
        ballYard: '25',
        endTeamId: 'home',
        endYard: '40',
      ),
      15,
    );
    expect(
      yardsGained(
        offenseId: 'home',
        ballTeamId: 'home',
        ballYard: '40',
        endTeamId: 'away',
        endYard: '40',
      ),
      20,
    );
    final spot = spotAtProgress('home', 'away', 63);
    expect(spot.teamId, 'away');
    expect(spot.yard, '37');
  });

  test('false start walks the ball back and replays the down', () {
    final season = emptySeason();
    final next = applyPenalty(
      season: season,
      penaltyNumber: '55',
      penaltyId: 'false-start',
      penaltySide: 'offense',
      penaltyReplay: true,
      penaltyDead: false,
    );
    expect(next, isNotNull);
    final draft = activeGame(next!).draft;
    expect(draft.down, '1');
    expect(draft.ballYard, '20');
    expect(draft.ballTeamId, 'home');
    expect(next.games.first.book.plays.first.sentence, contains('false start'));
    expect(
      next.games.first.book.plays.first.sentence,
      contains('Down replayed'),
    );
  });

  test('a gain of the line to gain resets to first and ten', () {
    final season = emptySeason();
    final moved = updateActiveDraft(
      season,
      placeBall(activeGame(season).draft, 'home', '40'),
    );
    final withStarter = updateActiveDraft(
      moved,
      activeGame(moved).draft.copyWith(starter: '3', type: PlayType.pass),
    );
    final logged = applyLogPlay(withStarter, '');
    final draft = activeGame(logged!).draft;
    expect(draft.down, '1');
    expect(draft.distance, '10');
    expect(
      activeGame(logged).book.plays.single.sentence,
      contains('Chace Hermanson (3)'),
    );
  });

  test('a short gain advances the down and keeps the remaining distance', () {
    var season = emptySeason();
    season = updateActiveDraft(
      season,
      placeBall(activeGame(season).draft, 'home', '28'),
    );
    season = updateActiveDraft(
      season,
      activeGame(season).draft.copyWith(starter: '2', type: PlayType.run),
    );
    final logged = applyLogPlay(season, '')!;
    final draft = activeGame(logged).draft;
    expect(draft.down, '2');
    expect(draft.distance, '7');
    expect(
      activeGame(logged).book.plays.single.snapshot!.result,
      ResultKind.tackled,
    );
  });

  test('touchdown and extra point score seven for the offense', () {
    final book = emptyBook();
    final home = book.teams.first.id;
    PlaySnapshot snap({
      required PlayType type,
      required ResultKind result,
      int? tryPoints,
    }) {
      return PlaySnapshot(
        quarter: '1',
        down: '1',
        distance: '10',
        offenseId: home,
        ballTeamId: home,
        ballYard: '10',
        snapTeamId: home,
        snapYard: '20',
        type: type,
        result: result,
        scoreTime: '8:42',
        possession: false,
        starter: '3',
        target1: '',
        target2: '',
        tackler1: '',
        tackler2: '',
        tackler3: '',
        tryPoints: tryPoints,
      );
    }

    final scored = book.copyWith(
      plays: [
        LoggedPlay(
          id: 'td',
          quarter: '1',
          down: '1',
          distance: '10',
          sentence: 'touchdown',
          snapshot: snap(type: PlayType.run, result: ResultKind.touchdown),
        ),
        LoggedPlay(
          id: 'xp',
          quarter: '1',
          down: '1',
          distance: '10',
          sentence: 'extra',
          snapshot: snap(
            type: PlayType.extraPoint,
            result: ResultKind.downed,
            tryPoints: 1,
          ),
        ),
      ],
    );
    expect(teamScores(scored)[home], 7);
    final stats = gameStats(scored).teams.first;
    final runner = stats.players.singleWhere(
      (line) => line.label.contains('Hermanson'),
    );
    expect(runner.td, 1);
    expect(runner.rush, 1);
  });

  test('a sack records the yards lost', () {
    final book = emptyBook();
    final home = book.teams.first.id;
    final away = book.teams[1].id;
    final stats = gameStats(
      book.copyWith(
        plays: [
          LoggedPlay(
            id: 'sack',
            quarter: '1',
            down: '2',
            distance: '7',
            sentence: 'sack',
            snapshot: PlaySnapshot(
              quarter: '1',
              down: '2',
              distance: '7',
              offenseId: home,
              ballTeamId: home,
              ballYard: '33',
              snapTeamId: home,
              snapYard: '40',
              type: PlayType.pass,
              result: ResultKind.sack,
              scoreTime: '',
              possession: false,
              starter: '3',
              target1: '',
              target2: '',
              tackler1: '5',
              tackler2: '7',
              tackler3: '',
            ),
          ),
        ],
      ),
    );
    final offense = stats.teams.firstWhere((team) => team.id == home);
    final defense = stats.teams.firstWhere((team) => team.id == away);
    final quarterback = offense.players.singleWhere(
      (line) => line.label.contains('Hermanson'),
    );
    final first = defense.players.singleWhere(
      (line) => line.label.contains('Harrison'),
    );
    final second = defense.players.singleWhere(
      (line) => line.label.contains('Vazquez'),
    );
    expect(quarterback.rushYds, -7);
    expect(offense.rushYds, -7);
    expect(first.sacks, 1);
    expect(first.sackYds, -7);
    expect(second.sacks, 1);
    expect(second.sackYds, -7);
    expect(defense.sacks, 1);
    expect(defense.sackYds, -7);
  });

  test(
    'team totals count plays and yards by type for the game and each quarter',
    () {
      final book = emptyBook();
      final home = book.teams.first.id;
      LoggedPlay play({
        required String id,
        required String quarter,
        required PlayType type,
        required ResultKind result,
        required String start,
        required String end,
      }) {
        return LoggedPlay(
          id: id,
          quarter: quarter,
          down: '1',
          distance: '10',
          sentence: id,
          snapshot: PlaySnapshot(
            quarter: quarter,
            down: '1',
            distance: '10',
            offenseId: home,
            ballTeamId: home,
            ballYard: end,
            snapTeamId: home,
            snapYard: start,
            type: type,
            result: result,
            scoreTime: '',
            possession: false,
            starter: '3',
            target1: '',
            target2: '',
            tackler1: '',
            tackler2: '',
            tackler3: '',
          ),
        );
      }

      final report = gameStats(
        book.copyWith(
          plays: [
            play(
              id: 'pass',
              quarter: '1',
              type: PlayType.pass,
              result: ResultKind.tackled,
              start: '20',
              end: '32',
            ),
            play(
              id: 'miss',
              quarter: '1',
              type: PlayType.pass,
              result: ResultKind.incomplete,
              start: '32',
              end: '32',
            ),
            play(
              id: 'run',
              quarter: '1',
              type: PlayType.run,
              result: ResultKind.tackled,
              start: '32',
              end: '36',
            ),
            play(
              id: 'punt',
              quarter: '2',
              type: PlayType.punt,
              result: ResultKind.downed,
              start: '36',
              end: '60',
            ),
          ],
        ),
      );

      final game = report.periods.first;
      expect(game.label, 'Game');
      final homeGame = game.teams.firstWhere((team) => team.id == home);
      expect(homeGame.types.map((line) => line.type), [
        PlayType.pass,
        PlayType.run,
        PlayType.punt,
      ]);
      expect(homeGame.types[0].count, 2);
      expect(homeGame.types[0].yards, 12);
      expect(homeGame.types[1].count, 1);
      expect(homeGame.types[1].yards, 4);
      expect(homeGame.types[2].count, 1);
      expect(homeGame.types[2].yards, 24);
      expect(game.teams.last.types, isEmpty);

      final first = report.periods[1];
      expect(first.label, '1');
      final homeFirst = first.teams.first.types;
      expect(homeFirst.map((line) => line.type), [PlayType.pass, PlayType.run]);
      expect(homeFirst.first.count, 2);
      expect(homeFirst.first.yards, 12);

      final second = report.periods[2];
      expect(second.label, '2');
      expect(second.teams.first.types.single.type, PlayType.punt);
      expect(second.teams.first.types.single.yards, 24);
      expect(report.periods.where((period) => period.label == '3'), isEmpty);
    },
  );

  test('empty book seeds both rosters', () {
    final book = emptyBook();
    expect(book.teams.map((team) => team.name), ["O'Gorman", 'Washington']);
    expect(
      book.players.any((player) => player.name == 'Chace Hermanson'),
      isTrue,
    );
    expect(
      book.players.any((player) => player.name == 'Justin Rodriguez'),
      isTrue,
    );
  });

  test('season json round-trips a logged game', () {
    final season = applyLogPlay(
      updateActiveDraft(
        emptySeason(),
        activeGame(emptySeason()).draft.copyWith(starter: '3'),
      ),
      '',
    )!;
    final restored = seasonFromParsed(backupEnvelope(season));
    expect(restored, isNotNull);
    expect(
      restored!.games.single.book.plays.single.sentence,
      contains('Hermanson'),
    );
    expect(restored.games.single.draft.starter, isEmpty);
  });
}
