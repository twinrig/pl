import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:file_selector/file_selector.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import '../domain/actions.dart';
import '../domain/ids.dart';
import '../domain/models.dart';
import '../domain/plays.dart';
import '../persistence/season_repository.dart';

enum SpecialPrompt { kickoff, extraPoint }

enum ConfirmKind { gameFinal, stopSeason, startSeason }

enum PlaceMode { ball, start, line, kick }

class PlayLogController extends ChangeNotifier {
  PlayLogController(this._repository) : season = emptySeason();

  final SeasonRepository _repository;
  Season season;
  bool hydrated = false;
  bool _disposed = false;
  Timer? _saveTimer;

  final rosterNum = <String, String>{};
  final rosterName = <String, String>{};
  final rosterPos = <String, String>{};

  bool teamsOpen = false;
  bool statsOpen = false;
  bool seasonOpen = false;
  bool exportOpen = false;
  bool askTime = false;
  bool confirmingNew = false;
  bool endsFlipped = false;
  bool penaltyReplay = true;
  bool penaltyDead = false;
  bool copied = false;

  String penaltyNumber = '';
  String penaltyId = penalties.first.id;
  String penaltySide = 'offense';
  String promptTime = '';
  String backupNote = '';
  PlaceMode placeMode = PlaceMode.ball;
  PlayType resumeType = PlayType.pass;
  SpecialPrompt? special;
  ConfirmKind? confirming;
  LoggedPlay? editing;
  Season? pendingBackup;

  GameRecord get active => activeGame(season);
  Book get book => active.book;
  Draft get draft => active.draft;

  Future<void> load() async {
    final saved = await _repository.load();
    if (_disposed) return;
    if (saved != null) season = saved;
    hydrated = true;
    notifyListeners();
    await _repository.save(season);
  }

  void _set(Season next) {
    season = next;
    notifyListeners();
    _scheduleSave();
  }

  void _scheduleSave() {
    if (!hydrated || _disposed) return;
    _saveTimer?.cancel();
    _saveTimer = Timer(const Duration(milliseconds: 250), () {
      _saveTimer = null;
      if (_disposed) return;
      _repository.save(season);
    });
  }

  void toggleFlag({bool? teams, bool? stats, bool? seasonOpen, bool? export}) {
    if (teams != null) teamsOpen = teams;
    if (stats != null) statsOpen = stats;
    if (seasonOpen != null) this.seasonOpen = seasonOpen;
    if (export != null) {
      exportOpen = export;
      if (export) copied = false;
    }
    notifyListeners();
  }

  void setRosterField(
    String teamId, {
    String? number,
    String? name,
    String? position,
  }) {
    if (number != null) rosterNum[teamId] = number;
    if (name != null) rosterName[teamId] = name;
    if (position != null) rosterPos[teamId] = position;
    notifyListeners();
  }

  void askConfirm(ConfirmKind kind) {
    confirming = kind;
    notifyListeners();
  }

  void cancelConfirm() {
    confirming = null;
    notifyListeners();
  }

  void askNewGame() {
    confirmingNew = true;
    notifyListeners();
  }

  void cancelNewGame() {
    confirmingNew = false;
    notifyListeners();
  }

  void dismissBackup() {
    pendingBackup = null;
    notifyListeners();
  }

  void beginEdit(LoggedPlay play) {
    editing = play;
    notifyListeners();
  }

  void cancelEdit() {
    editing = null;
    notifyListeners();
  }

  void setPromptTime(String value) {
    promptTime = value;
    notifyListeners();
  }

  void cancelTime() {
    askTime = false;
    notifyListeners();
  }

  void patchDraft(Draft next) => _set(updateActiveDraft(season, next));

  void patch(Draft Function(Draft draft) update) => patchDraft(update(draft));

  void placeBallAt(String teamId, String yard) {
    if (draft.ballTeamId == teamId && draft.ballYard == yard) return;
    patchDraft(placeBall(draft, teamId, yard));
  }

  void moveSeries(String teamId, String yard) {
    if (!draft.lineManual && draft.seriesTeamId == teamId && draft.seriesYard == yard) {
      return;
    }
    patchDraft(setSeries(draft, teamId, yard));
  }

  void moveFirstDown(String teamId, String yard) {
    if (draft.lineManual && draft.lineTeamId == teamId && draft.lineYard == yard) {
      return;
    }
    patchDraft(setFirstDown(draft, teamId, yard));
  }

  void chooseDown(String down) => patchDraft(setDown(draft, down));

  void chooseResult(ResultKind id) {
    var next = draft.copyWith(
      result: id,
      possession: turnoverResults.contains(id),
    );
    if (id == ResultKind.touchback && kickingPlay(next.type)) {
      next = placeBall(next, defenseId(book, next.offenseId), '20');
    }
    patchDraft(next);
  }

  void setQuarter(String quarter) {
    if (quarter == draft.quarter) return;
    if (quarter == '1' || quarter == '3') {
      if (draft.type != PlayType.kickoff && draft.type != PlayType.extraPoint) {
        resumeType = draft.type;
      }
      endsFlipped = false;
      special = SpecialPrompt.kickoff;
      patchDraft(
        draft.copyWith(
          quarter: quarter,
          type: PlayType.kickoff,
          possession: true,
          result: ResultKind.tackled,
          down: '1',
          distance: '10',
          ballTeamId: draft.offenseId,
          ballYard: '40',
          snapTeamId: draft.offenseId,
          snapYard: '40',
          seriesTeamId: draft.offenseId,
          seriesYard: '40',
          lineManual: false,
          starter: '',
          target1: '',
          target2: '',
          tackler1: '',
          tackler2: '',
          tackler3: '',
          scoreTime: '',
        ),
      );
      return;
    }
    final next = draft.copyWith(quarter: quarter);
    if (quarter == '2' || quarter == '4') endsFlipped = true;
    patchDraft(next);
  }

  void flipEnds() {
    endsFlipped = !endsFlipped;
    notifyListeners();
  }

  void setPlaceMode(PlaceMode mode) {
    placeMode = mode;
    notifyListeners();
  }

  void placeAt(num progress) {
    final defense = defenseId(book, draft.offenseId);
    final spot = spotAtProgress(draft.offenseId, defense, progress);
    var mode = placeMode;
    if (mode == PlaceMode.kick && draft.type != PlayType.kickoff) {
      mode = PlaceMode.ball;
    }
    switch (mode) {
      case PlaceMode.kick:
        if (draft.snapTeamId == spot.teamId && draft.snapYard == spot.yard) return;
        patchDraft(draft.copyWith(snapTeamId: spot.teamId, snapYard: spot.yard));
      case PlaceMode.start:
        moveSeries(spot.teamId, spot.yard);
      case PlaceMode.line:
        moveFirstDown(spot.teamId, spot.yard);
      case PlaceMode.ball:
        placeBallAt(spot.teamId, spot.yard);
    }
  }

  void logPlay([String? time]) {
    if (active.isFinal || season.closed) return;
    if (draft.starter.trim().isEmpty) return;
    final scoreTime = (time ?? draft.scoreTime).trim();
    if (playNeedsTime(draft) && scoreTime.isEmpty) {
      promptTime = '';
      askTime = true;
      notifyListeners();
      return;
    }
    final loggedType = draft.type;
    final next = applyLogPlay(season, scoreTime);
    if (next == null) return;
    if (loggedType == PlayType.extraPoint) {
      special = SpecialPrompt.kickoff;
    } else if (loggedType == PlayType.kickoff) {
      special = null;
    }
    askTime = false;
    promptTime = '';
    _set(next);
  }

  void addPenalty() {
    final next = applyPenalty(
      season: season,
      penaltyNumber: penaltyNumber,
      penaltyId: penaltyId,
      penaltySide: penaltySide,
      penaltyReplay: penaltyReplay,
      penaltyDead: penaltyDead,
    );
    if (next == null) return;
    penaltyNumber = '';
    _set(next);
  }

  void setPenaltyNumber(String value) {
    penaltyNumber = value;
    final side = sideForNumber(
      value,
      book.players,
      draft.offenseId,
      defenseId(book, draft.offenseId),
    );
    if (side != null) penaltySide = side;
    notifyListeners();
  }

  void setPenaltyId(String id) {
    penaltyId = id;
    penaltyDead = false;
    penaltyReplay = penaltyById(id).replay;
    notifyListeners();
  }

  void setPenaltySide(String side) {
    penaltySide = side;
    notifyListeners();
  }

  void togglePenaltyReplay() {
    penaltyReplay = !penaltyReplay;
    penaltyDead = false;
    notifyListeners();
  }

  void togglePenaltyDead() {
    penaltyDead = !penaltyDead;
    if (penaltyDead) {
      penaltyReplay = false;
    } else {
      penaltyReplay = penaltyById(penaltyId).replay;
    }
    notifyListeners();
  }

  void undo(String id) => _set(updateActiveBook(season, undoPlay(book, id)));

  void saveEdited(LoggedPlay play) {
    editing = null;
    _set(updateActiveBook(season, replacePlay(book, play)));
  }

  void rename(String id, String name) =>
      _set(updateActiveBook(season, renameTeam(book, id, name)));

  void submitPlayer(String teamId) {
    final next = addPlayer(
      book,
      teamId,
      rosterNum[teamId] ?? '',
      rosterName[teamId] ?? '',
      rosterPos[teamId] ?? '',
    );
    if (identical(next, book)) return;
    rosterNum[teamId] = '';
    rosterName[teamId] = '';
    rosterPos[teamId] = '';
    _set(updateActiveBook(season, next));
  }

  void importRoster(String teamId, String text) {
    final next = loadRoster(book, teamId, text);
    if (identical(next, book)) return;
    _set(updateActiveBook(season, next));
  }

  void deletePlayer(String id) =>
      _set(updateActiveBook(season, removePlayer(book, id)));

  void newGame() {
    if (season.closed) return;
    endsFlipped = false;
    resumeType = PlayType.run;
    special = SpecialPrompt.kickoff;
    confirmingNew = false;
    seasonOpen = false;
    editing = null;
    _set(applyNewGame(season));
  }

  void completeGame() {
    confirming = null;
    _set(applyCompleteGame(season));
  }

  void stopSeason() {
    confirming = null;
    special = null;
    _set(applyStopSeason(season));
  }

  void startSeason() {
    endsFlipped = false;
    resumeType = PlayType.run;
    special = SpecialPrompt.kickoff;
    confirming = null;
    _set(applyStartSeason(season));
  }

  void openPast(String id) {
    editing = null;
    special = null;
    _set(applyOpenPast(season, id));
  }

  void openGame(String id) {
    editing = null;
    special = null;
    seasonOpen = false;
    _set(applyOpenGame(season, id));
  }

  void removeGame(String id) {
    if (id == season.activeId) editing = null;
    _set(applyRemoveGame(season, id));
  }

  void setGameDate(String id, String date) => _set(applyGameDate(season, id, date));

  void openKickoff() {
    if (draft.type != PlayType.kickoff && draft.type != PlayType.extraPoint) {
      resumeType = draft.type;
    }
    special = SpecialPrompt.kickoff;
    patchDraft(
      draft.copyWith(
        type: PlayType.kickoff,
        possession: true,
        result: ResultKind.tackled,
        snapTeamId: draft.offenseId,
        snapYard: draft.snapYard.isEmpty ? '40' : draft.snapYard,
        starter: '',
        target1: '',
        target2: '',
        tackler1: '',
        tackler2: '',
        tackler3: '',
        scoreTime: '',
      ),
    );
  }

  void openExtraPoint() {
    if (draft.type != PlayType.kickoff && draft.type != PlayType.extraPoint) {
      resumeType = draft.type;
    }
    special = SpecialPrompt.extraPoint;
    patchDraft(
      draft.copyWith(
        type: PlayType.extraPoint,
        possession: false,
        result: ResultKind.downed,
        tryPoints: 1,
        starter: '',
        target1: '',
        target2: '',
        tackler1: '',
        tackler2: '',
        tackler3: '',
        scoreTime: '',
      ),
    );
  }

  void closeSpecial() {
    final closing = special;
    final resume = resumeType;
    special = null;
    patchDraft(
      draft.copyWith(
        type: resume,
        possession: possessionPlays.contains(resume),
        tryPoints: closing == SpecialPrompt.extraPoint ? 1 : draft.tryPoints,
      ),
    );
  }

  void chooseTwoPoint() {
    final defense = defenseId(book, draft.offenseId);
    patchDraft(
      draft.copyWith(
        tryPoints: 2,
        ballTeamId: defense,
        ballYard: '2',
        snapTeamId: defense,
        snapYard: '2',
        seriesTeamId: defense,
        seriesYard: '2',
        lineManual: true,
        lineTeamId: defense,
        lineYard: '0',
        distance: '2',
      ),
    );
  }

  Future<void> saveBackup() async {
    final location = await getSaveLocation(
      suggestedName: 'play-log-backup-${today()}.json',
      acceptedTypeGroups: const [
        XTypeGroup(label: 'JSON', extensions: ['json']),
      ],
    );
    if (location == null) return;
    await File(location.path).writeAsString(
      const JsonEncoder.withIndent('  ').convert(backupEnvelope(season)),
    );
    final years = <String>{
      for (final game in season.games)
        if (game.date.length >= 4) game.date.substring(0, 4),
      for (final item in season.past)
        for (final game in item.games)
          if (game.date.length >= 4) game.date.substring(0, 4),
    };
    final count = season.past.length + 1;
    backupNote =
        'Saved $count season${count == 1 ? '' : 's'} (${years.join(', ')}). Keep this file.';
    notifyListeners();
  }

  Future<void> pickBackup() async {
    final file = await openFile(
      acceptedTypeGroups: const [
        XTypeGroup(label: 'JSON', extensions: ['json']),
      ],
    );
    if (file == null) return;
    chooseBackup(await file.readAsString());
  }

  void chooseBackup(String text) {
    try {
      final saved = seasonFromParsed(jsonDecode(text));
      if (saved == null) {
        backupNote = 'That file is not a play log backup.';
        notifyListeners();
        return;
      }
      pendingBackup = saved;
      backupNote = '';
      notifyListeners();
    } catch (_) {
      backupNote = 'That file is not a play log backup.';
      notifyListeners();
    }
  }

  void loadPendingBackup() {
    final saved = pendingBackup;
    if (saved == null) return;
    pendingBackup = null;
    editing = null;
    special = null;
    backupNote = 'Backup loaded.';
    _set(saved);
  }

  Future<void> downloadCsv() async {
    final location = await getSaveLocation(
      suggestedName: 'play-log.csv',
      acceptedTypeGroups: const [
        XTypeGroup(label: 'CSV', extensions: ['csv']),
      ],
    );
    if (location == null) return;
    await File(location.path).writeAsString(csvText(book));
  }

  Future<void> copyCsv() async {
    try {
      await Clipboard.setData(ClipboardData(text: csvText(book)));
      copied = true;
    } catch (_) {
      copied = false;
    }
    notifyListeners();
  }

  Future<void> pickRoster(String teamId) async {
    final file = await openFile(
      acceptedTypeGroups: const [
        XTypeGroup(label: 'CSV', extensions: ['csv', 'txt']),
      ],
    );
    if (file == null) return;
    importRoster(teamId, await file.readAsString());
  }

  @override
  void dispose() {
    final pending = _saveTimer != null;
    _saveTimer?.cancel();
    _disposed = true;
    if (pending && hydrated) {
      _repository.save(season);
    }
    super.dispose();
  }
}
