import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../domain/actions.dart';
import '../domain/models.dart';
import '../domain/plays.dart';
import '../domain/stats.dart';
import '../state/play_log_controller.dart';
import '../theme.dart';
import 'bits.dart';
import 'field_board.dart';
import 'overlays.dart';
import 'play_forms.dart';

class PlayBookPage extends StatelessWidget {
  const PlayBookPage({super.key, required this.controller});

  final PlayLogController controller;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: controller,
      builder: (context, _) {
        final book = controller.book;
        final draft = controller.draft;
        final season = controller.season;
        final active = controller.active;
        final offenseId = draft.offenseId;
        final defense = defenseId(book, offenseId);
        final punt = draft.type == PlayType.punt;
        final scores = teamScores(book);
        final seriesProgress =
            progressFromGoal(offenseId, draft.seriesTeamId, draft.seriesYard) ??
            25.0;
        final manualLine = progressFromGoal(
          offenseId,
          draft.lineTeamId,
          draft.lineYard,
        );
        final firstProgress = draft.lineManual
            ? (manualLine ?? math.min(100.0, seriesProgress + 10))
            : math.min(100.0, math.max(0.0, seriesProgress + 10));
        final kickProgress = draft.type == PlayType.kickoff
            ? progressFromGoal(offenseId, draft.snapTeamId, draft.snapYard)
            : null;
        final leftId = controller.endsFlipped
            ? (book.teams.length > 1 ? book.teams[1].id : defense)
            : (book.teams.isEmpty ? offenseId : book.teams.first.id);
        final closed = active.isFinal || season.closed;
        final preview = draft.starter.trim().isEmpty
            ? 'Type the offense jersey. The sentence shows up here.'
            : sentenceFrom(book, draft);
        final groups = penaltyGroups();
        final chosen = penaltyById(controller.penaltyId);
        if (!controller.hydrated) {
          return const ColoredBox(
            color: PlayColors.bg,
            child: SizedBox.expand(),
          );
        }
        return Scaffold(
          body: Stack(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
                child: Align(
                  alignment: Alignment.topCenter,
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      // Header, gaps, and the quarter bar. The entry row keeps
                      // entryFloor before any extra height grows the field.
                      const nonGrass = 109.0;
                      const entryFloor = 620.0;
                      const rowGap = 16.0;
                      final grass =
                          (constraints.maxHeight - nonGrass - entryFloor).clamp(
                            68.0,
                            156.0,
                          );
                      // One column, wide enough that the button rows stay put.
                      // The log takes the rest of the window, past this cap.
                      final entryWidth = math.min(
                        800.0,
                        (constraints.maxWidth - rowGap) * 0.6,
                      );
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _Header(
                            controller: controller,
                            active: active,
                            seasonClosed: season.closed,
                          ),
                          const SizedBox(height: 8),
                          FieldBoard(
                            offenseName: teamName(book, offenseId),
                            defenseName: teamName(book, defense),
                            offenseScore: scores[offenseId] ?? 0,
                            defenseScore: scores[defense] ?? 0,
                            ball:
                                progressFromGoal(
                                  offenseId,
                                  draft.ballTeamId,
                                  draft.ballYard,
                                ) ??
                                25.0,
                            series: seriesProgress,
                            firstDown: firstProgress,
                            kick: kickProgress,
                            flipped: offenseId != leftId,
                            quarter: draft.quarter,
                            placeMode: controller.placeMode,
                            onQuarter: controller.setQuarter,
                            onFlip: controller.flipEnds,
                            onPlaceMode: controller.setPlaceMode,
                            onPlace: controller.placeAt,
                            grassHeight: grass,
                          ),
                          const SizedBox(height: 8),
                          Expanded(
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                SizedBox(
                                  width: entryWidth,
                                  child: Panel(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Wrap(
                                          spacing: 12,
                                          runSpacing: 12,
                                          crossAxisAlignment:
                                              WrapCrossAlignment.end,
                                          children: [
                                            Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                const SectionLabel('Down'),
                                                Row(
                                                  mainAxisSize:
                                                      MainAxisSize.min,
                                                  children: [
                                                    for (final down in const [
                                                      '1',
                                                      '2',
                                                      '3',
                                                      '4',
                                                    ])
                                                      Padding(
                                                        padding:
                                                            const EdgeInsets.only(
                                                              right: 4,
                                                            ),
                                                        child: AppButton(
                                                          label: down,
                                                          compact: true,
                                                          selected:
                                                              draft.down ==
                                                              down,
                                                          onPressed: () =>
                                                              controller
                                                                  .chooseDown(
                                                                    down,
                                                                  ),
                                                        ),
                                                      ),
                                                  ],
                                                ),
                                              ],
                                            ),
                                            Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                const SectionLabel('To go'),
                                                BoundField(
                                                  width: 64,
                                                  center: true,
                                                  numeric: true,
                                                  value: draft.distance,
                                                  onChanged: (value) =>
                                                      controller.patch(
                                                        (current) =>
                                                            current.copyWith(
                                                              distance: value,
                                                            ),
                                                      ),
                                                ),
                                              ],
                                            ),
                                            Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                const SectionLabel('Offense'),
                                                TeamSelect(
                                                  compact: true,
                                                  teams: book.teams,
                                                  value: draft.offenseId,
                                                  onChanged: (id) =>
                                                      controller.patch(
                                                        (current) =>
                                                            current.copyWith(
                                                              offenseId: id,
                                                              distance:
                                                                  distanceFor(
                                                                    current,
                                                                    id,
                                                                  ),
                                                            ),
                                                      ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        Wrap(
                                          spacing: 8,
                                          runSpacing: 8,
                                          children: [
                                            if (punt) ...[
                                              JerseyField(
                                                fieldKey: const Key('starter'),
                                                label: 'Punter',
                                                value: draft.starter,
                                                hint: hintFor(
                                                  draft.starter,
                                                  book.players,
                                                  offenseId,
                                                  true,
                                                ),
                                                onChanged: (value) =>
                                                    controller.patch(
                                                      (current) =>
                                                          current.copyWith(
                                                            starter: value,
                                                          ),
                                                    ),
                                              ),
                                              JerseyField(
                                                fieldKey: const Key('receiver'),
                                                label: 'Receiver',
                                                value: draft.target1,
                                                hint: hintFor(
                                                  draft.target1,
                                                  book.players,
                                                  defense,
                                                  true,
                                                ),
                                                onChanged: (value) =>
                                                    controller.patch(
                                                      (current) =>
                                                          current.copyWith(
                                                            target1: value,
                                                          ),
                                                    ),
                                              ),
                                              JerseyField(
                                                fieldKey: const Key(
                                                  'punt-tackler',
                                                ),
                                                label: 'Tackler',
                                                value: draft.tackler1,
                                                hint: hintFor(
                                                  draft.tackler1,
                                                  book.players,
                                                  offenseId,
                                                  true,
                                                ),
                                                onChanged: (value) =>
                                                    controller.patch(
                                                      (current) =>
                                                          current.copyWith(
                                                            tackler1: value,
                                                          ),
                                                    ),
                                              ),
                                            ] else ...[
                                              JerseyField(
                                                fieldKey: const Key('starter'),
                                                label: startLabel(draft.type),
                                                value: draft.starter,
                                                hint: hintFor(
                                                  draft.starter,
                                                  book.players,
                                                  offenseId,
                                                  true,
                                                ),
                                                onChanged: (value) =>
                                                    controller.patch(
                                                      (current) =>
                                                          current.copyWith(
                                                            starter: value,
                                                          ),
                                                    ),
                                              ),
                                              JerseyField(
                                                label: 'Target',
                                                value: draft.target1,
                                                hint: hintFor(
                                                  draft.target1,
                                                  book.players,
                                                  offenseId,
                                                  true,
                                                ),
                                                onChanged: (value) =>
                                                    controller.patch(
                                                      (current) =>
                                                          current.copyWith(
                                                            target1: value,
                                                          ),
                                                    ),
                                              ),
                                              JerseyField(
                                                label: 'Target 2',
                                                value: draft.target2,
                                                hint: hintFor(
                                                  draft.target2,
                                                  book.players,
                                                  offenseId,
                                                  true,
                                                ),
                                                onChanged: (value) =>
                                                    controller.patch(
                                                      (current) =>
                                                          current.copyWith(
                                                            target2: value,
                                                          ),
                                                    ),
                                              ),
                                              JerseyField(
                                                label: 'Tackler',
                                                value: draft.tackler1,
                                                hint: hintFor(
                                                  draft.tackler1,
                                                  book.players,
                                                  defense,
                                                  true,
                                                ),
                                                onChanged: (value) =>
                                                    controller.patch(
                                                      (current) =>
                                                          current.copyWith(
                                                            tackler1: value,
                                                          ),
                                                    ),
                                              ),
                                              JerseyField(
                                                label: 'Tackler 2',
                                                value: draft.tackler2,
                                                hint: hintFor(
                                                  draft.tackler2,
                                                  book.players,
                                                  defense,
                                                  true,
                                                ),
                                                onChanged: (value) =>
                                                    controller.patch(
                                                      (current) =>
                                                          current.copyWith(
                                                            tackler2: value,
                                                          ),
                                                    ),
                                              ),
                                              JerseyField(
                                                label: 'Tackler 3',
                                                value: draft.tackler3,
                                                hint: hintFor(
                                                  draft.tackler3,
                                                  book.players,
                                                  defense,
                                                  true,
                                                ),
                                                onChanged: (value) =>
                                                    controller.patch(
                                                      (current) =>
                                                          current.copyWith(
                                                            tackler3: value,
                                                          ),
                                                    ),
                                              ),
                                            ],
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        const SectionLabel('Play'),
                                        Wrap(
                                          spacing: 6,
                                          runSpacing: 6,
                                          children: [
                                            for (final type in scrimmageTypes)
                                              AppButton(
                                                label: type.label,
                                                compact: true,
                                                selected: draft.type == type,
                                                onPressed: () =>
                                                    controller.patch(
                                                      (current) =>
                                                          current.copyWith(
                                                            type: type,
                                                            possession:
                                                                possessionPlays
                                                                    .contains(
                                                                      type,
                                                                    ),
                                                          ),
                                                    ),
                                              ),
                                            AppButton(
                                              label: 'Kickoff',
                                              compact: true,
                                              onPressed: controller.openKickoff,
                                            ),
                                            AppButton(
                                              label: 'Extra point',
                                              compact: true,
                                              onPressed:
                                                  controller.openExtraPoint,
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        const SectionLabel('Result'),
                                        Wrap(
                                          spacing: 6,
                                          runSpacing: 6,
                                          crossAxisAlignment:
                                              WrapCrossAlignment.center,
                                          children: [
                                            for (final result
                                                in ResultKind.values.where(
                                                  resultMain.contains,
                                                ))
                                              AppButton(
                                                label: result.label,
                                                compact: true,
                                                selected:
                                                    draft.result == result,
                                                onPressed: () => controller
                                                    .chooseResult(result),
                                              ),
                                            DropdownButton<ResultKind>(
                                              isDense: true,
                                              style: const TextStyle(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w600,
                                                color: PlayColors.fg,
                                              ),
                                              value:
                                                  resultMore.contains(
                                                    draft.result,
                                                  )
                                                  ? draft.result
                                                  : null,
                                              hint: const Text(
                                                'More',
                                                style: TextStyle(
                                                  fontSize: 13,
                                                  color: PlayColors.muted,
                                                ),
                                              ),
                                              dropdownColor: PlayColors.surface,
                                              items: [
                                                for (final result in resultMore)
                                                  DropdownMenuItem(
                                                    value: result,
                                                    child: Text(result.label),
                                                  ),
                                              ],
                                              onChanged: (result) {
                                                if (result != null) {
                                                  controller.chooseResult(
                                                    result,
                                                  );
                                                }
                                              },
                                            ),
                                            AppButton(
                                              label: 'Possession',
                                              compact: true,
                                              selected: draft.possession,
                                              onPressed: () => controller.patch(
                                                (current) => current.copyWith(
                                                  possession:
                                                      !current.possession,
                                                ),
                                              ),
                                            ),
                                            AppButton(
                                              label: 'Touchdown',
                                              compact: true,
                                              selected:
                                                  draft.result ==
                                                  ResultKind.touchdown,
                                              onPressed: () =>
                                                  controller.chooseResult(
                                                    ResultKind.touchdown,
                                                  ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        Wrap(
                                          spacing: 8,
                                          runSpacing: 8,
                                          crossAxisAlignment:
                                              WrapCrossAlignment.end,
                                          children: [
                                            Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                const SectionLabel('Ball on'),
                                                TeamSelect(
                                                  compact: true,
                                                  teams: book.teams,
                                                  value: draft.ballTeamId,
                                                  onChanged: (id) =>
                                                      controller.placeBallAt(
                                                        id,
                                                        draft.ballYard,
                                                      ),
                                                ),
                                              ],
                                            ),
                                            Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                const SectionLabel('Yard'),
                                                BoundField(
                                                  fieldKey: const Key(
                                                    'ball-yard',
                                                  ),
                                                  width: 72,
                                                  center: true,
                                                  numeric: true,
                                                  value: draft.ballYard,
                                                  onChanged: (value) =>
                                                      controller.placeBallAt(
                                                        draft.ballTeamId,
                                                        value,
                                                      ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        const SectionLabel('Penalty'),
                                        Wrap(
                                          spacing: 8,
                                          runSpacing: 8,
                                          crossAxisAlignment:
                                              WrapCrossAlignment.center,
                                          children: [
                                            BoundField(
                                              fieldKey: const Key(
                                                'penalty-number',
                                              ),
                                              width: 64,
                                              center: true,
                                              numeric: true,
                                              hint: '#',
                                              value: controller.penaltyNumber,
                                              onChanged:
                                                  controller.setPenaltyNumber,
                                            ),
                                            SizedBox(
                                              width: 230,
                                              child: DropdownButton<String>(
                                                isExpanded: true,
                                                isDense: true,
                                                style: const TextStyle(
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.w600,
                                                  color: PlayColors.fg,
                                                ),
                                                value: controller.penaltyId,
                                                dropdownColor:
                                                    PlayColors.surface,
                                                items: [
                                                  const DropdownMenuItem(
                                                    enabled: false,
                                                    value: '',
                                                    child: Text('Common'),
                                                  ),
                                                  for (final penalty
                                                      in groups.common)
                                                    DropdownMenuItem(
                                                      value: penalty.id,
                                                      child: Text(
                                                        '${penalty.label} (${penalty.yards})',
                                                      ),
                                                    ),
                                                  const DropdownMenuItem(
                                                    enabled: false,
                                                    value: 'other',
                                                    child: Text('Other'),
                                                  ),
                                                  for (final penalty
                                                      in groups.rest)
                                                    DropdownMenuItem(
                                                      value: penalty.id,
                                                      child: Text(
                                                        '${penalty.label} (${penalty.yards})',
                                                      ),
                                                    ),
                                                ],
                                                onChanged: (id) {
                                                  if (id != null &&
                                                      id.isNotEmpty &&
                                                      id != 'other') {
                                                    controller.setPenaltyId(id);
                                                  }
                                                },
                                              ),
                                            ),
                                            AppButton(
                                              label: 'Offense',
                                              compact: true,
                                              selected:
                                                  controller.penaltySide ==
                                                  'offense',
                                              onPressed: () => controller
                                                  .setPenaltySide('offense'),
                                            ),
                                            AppButton(
                                              label: 'Defense',
                                              compact: true,
                                              selected:
                                                  controller.penaltySide ==
                                                  'defense',
                                              onPressed: () => controller
                                                  .setPenaltySide('defense'),
                                            ),
                                            AppButton(
                                              label: 'Replay down',
                                              compact: true,
                                              selected:
                                                  controller.penaltyReplay,
                                              onPressed: controller
                                                  .togglePenaltyReplay,
                                            ),
                                            AppButton(
                                              label: 'Dead ball',
                                              compact: true,
                                              selected: controller.penaltyDead,
                                              onPressed:
                                                  controller.togglePenaltyDead,
                                            ),
                                            AppButton(
                                              label: 'Add',
                                              compact: true,
                                              filled: true,
                                              onPressed:
                                                  controller.penaltyNumber
                                                      .trim()
                                                      .isEmpty
                                                  ? null
                                                  : controller.addPenalty,
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          penaltyNote(
                                            penalty: chosen,
                                            penaltySide: controller.penaltySide,
                                            penaltyReplay:
                                                controller.penaltyReplay,
                                            penaltyDead: controller.penaltyDead,
                                          ),
                                          style: const TextStyle(
                                            color: PlayColors.muted,
                                            fontSize: 12,
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        const SectionLabel('This play'),
                                        Expanded(
                                          child: Align(
                                            alignment: Alignment.topLeft,
                                            child: Text(
                                              preview,
                                              style: const TextStyle(
                                                fontSize: 18,
                                                height: 1.45,
                                              ),
                                            ),
                                          ),
                                        ),
                                        if (closed) ...[
                                          const SizedBox(height: 8),
                                          Text(
                                            season.closed
                                                ? 'Season stopped. The log is closed.'
                                                : 'Game final. The log is closed.',
                                            style: const TextStyle(
                                              color: PlayColors.accent,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ],
                                        const SizedBox(height: 8),
                                        AppButton(
                                          label: 'Log play',
                                          filled: true,
                                          expand: true,
                                          onPressed:
                                              closed ||
                                                  draft.starter.trim().isEmpty
                                              ? null
                                              : controller.logPlay,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(width: rowGap),
                                Expanded(
                                  child: _GameLog(
                                    children: [
                                      if (book.plays.isEmpty)
                                        const Text(
                                          "Ball on the O'gorman 45. Pass from Cade Hermansom (3) to Rylan Cody (4) tackled on the Washington 37 by 18,74.",
                                          style: TextStyle(
                                            color: PlayColors.muted,
                                            fontSize: 14,
                                            height: 1.35,
                                          ),
                                        )
                                      else
                                        for (
                                          var i = 0;
                                          i < book.plays.length;
                                          i++
                                        )
                                          _LogRow(
                                            play: book.plays[i],
                                            latest: i == 0,
                                            onEdit: () => controller.beginEdit(
                                              book.plays[i],
                                            ),
                                            onUndo: () => controller.undo(
                                              book.plays[i].id,
                                            ),
                                          ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
              ),
              if (controller.statsOpen)
                StatsSheet(
                  book: book,
                  onClose: () => controller.toggleFlag(stats: false),
                ),
              if (controller.teamsOpen) TeamsSheet(controller: controller),
              if (controller.seasonOpen) SeasonSheet(controller: controller),
              if (controller.exportOpen) ExportSheet(controller: controller),
              if (controller.special == SpecialPrompt.kickoff)
                KickoffDialog(controller: controller),
              if (controller.special == SpecialPrompt.extraPoint)
                ExtraPointDialog(controller: controller),
              if (controller.askTime) TimeDialog(controller: controller),
              if (controller.confirming != null)
                ConfirmDialog(controller: controller),
              if (controller.confirmingNew)
                MessageDialog(
                  title: 'New game',
                  body: 'This adds the next game and marks this one final. The roster is copied, the ball goes on the 40, and the play is a kickoff.',
                  confirm: 'Start game',
                  onCancel: controller.cancelNewGame,
                  onConfirm: controller.newGame,
                ),
              if (controller.pendingBackup != null)
                MessageDialog(
                  title: 'Load backup',
                  body:
                      'Replace what is on this computer with the file. It has ${controller.pendingBackup!.past.length + 1} season${controller.pendingBackup!.past.isEmpty ? '' : 's'} and ${controller.pendingBackup!.games.length} game${controller.pendingBackup!.games.length == 1 ? '' : 's'} in the open season.',
                  confirm: 'Load',
                  onCancel: controller.dismissBackup,
                  onConfirm: controller.loadPendingBackup,
                ),
              if (controller.editing != null)
                EditPlayDialog(
                  controller: controller,
                  play: controller.editing!,
                ),
            ],
          ),
        );
      },
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({
    required this.controller,
    required this.active,
    required this.seasonClosed,
  });

  final PlayLogController controller;
  final GameRecord active;
  final bool seasonClosed;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Play Log',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
              ),
              SizedBox(height: 2),
              Text(
                'Type jersey numbers. A known number becomes Name (number).',
                style: TextStyle(color: PlayColors.muted),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        _HeaderMenu(
          controller: controller,
          active: active,
          seasonClosed: seasonClosed,
        ),
      ],
    );
  }
}

class _HeaderMenu extends StatefulWidget {
  const _HeaderMenu({
    required this.controller,
    required this.active,
    required this.seasonClosed,
  });

  final PlayLogController controller;
  final GameRecord active;
  final bool seasonClosed;

  @override
  State<_HeaderMenu> createState() => _HeaderMenuState();
}

class _HeaderMenuState extends State<_HeaderMenu> {
  final _buttonKey = GlobalKey();

  Future<void> _open() async {
    final box = _buttonKey.currentContext!.findRenderObject()! as RenderBox;
    final overlay =
        Navigator.of(context).overlay!.context.findRenderObject()! as RenderBox;
    final topLeft = box.localToGlobal(Offset.zero, ancestor: overlay);
    final bottomRight = box.localToGlobal(
      box.size.bottomRight(Offset.zero),
      ancestor: overlay,
    );
    final gameOpen = !widget.active.isFinal && !widget.seasonClosed;
    final selected = await showMenu<String>(
      context: context,
      position: RelativeRect.fromRect(
        Rect.fromPoints(topLeft, bottomRight),
        Offset.zero & overlay.size,
      ),
      items: [
        const PopupMenuItem(value: 'season', child: Text('Season')),
        const PopupMenuItem(value: 'teams', child: Text('Teams')),
        const PopupMenuItem(value: 'stats', child: Text('Stats')),
        const PopupMenuItem(value: 'export', child: Text('Export CSV')),
        PopupMenuItem(
          value: 'complete',
          enabled: gameOpen,
          child: Text(widget.active.isFinal ? 'Game final' : 'Complete game'),
        ),
        PopupMenuItem(
          value: 'new',
          enabled: !widget.seasonClosed,
          child: const Text('New game'),
        ),
      ],
    );
    if (!mounted || selected == null) return;
    final controller = widget.controller;
    switch (selected) {
      case 'season':
        controller.toggleFlag(seasonOpen: true);
      case 'teams':
        controller.toggleFlag(teams: true);
      case 'stats':
        controller.toggleFlag(stats: true);
      case 'export':
        controller.toggleFlag(export: true);
      case 'complete':
        controller.askConfirm(ConfirmKind.gameFinal);
      case 'new':
        controller.askNewGame();
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppButton(key: _buttonKey, label: 'Menu', onPressed: _open);
  }
}

class _GameLog extends StatefulWidget {
  const _GameLog({required this.children});

  final List<Widget> children;

  @override
  State<_GameLog> createState() => _GameLogState();
}

class _GameLogState extends State<_GameLog> {
  final _scroll = ScrollController();

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SectionLabel('Game log'),
          Expanded(
            child: Scrollbar(
              controller: _scroll,
              thumbVisibility: true,
              trackVisibility: true,
              interactive: true,
              child: ListView(
                controller: _scroll,
                primary: false,
                physics: const ClampingScrollPhysics(),
                padding: const EdgeInsets.only(right: 14),
                children: widget.children,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LogRow extends StatelessWidget {
  const _LogRow({
    required this.play,
    required this.latest,
    required this.onEdit,
    required this.onUndo,
  });

  final LoggedPlay play;
  final bool latest;
  final VoidCallback onEdit;
  final VoidCallback onUndo;

  @override
  Widget build(BuildContext context) {
    final meta = play.down.isEmpty
        ? 'Start'
        : 'Q${play.quarter} · ${ordinalDown(play.down)} & ${play.distance}${play.clock == null || play.clock!.isEmpty ? '' : ' · ${play.clock}'}';
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  latest ? '$meta · latest' : meta,
                  style: const TextStyle(color: PlayColors.muted, fontSize: 12),
                ),
              ),
              TextButton(
                onPressed: onEdit,
                child: const Text(
                  'Edit',
                  style: TextStyle(color: PlayColors.muted),
                ),
              ),
              TextButton(
                onPressed: onUndo,
                child: const Text(
                  'Undo',
                  style: TextStyle(color: PlayColors.muted),
                ),
              ),
            ],
          ),
          Text(
            play.sentence,
            style: const TextStyle(fontSize: 14, height: 1.35),
          ),
          const Divider(color: PlayColors.line),
        ],
      ),
    );
  }
}
