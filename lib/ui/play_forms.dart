import 'package:flutter/material.dart';

import '../domain/actions.dart';
import '../domain/models.dart';
import '../domain/plays.dart';
import '../state/play_log_controller.dart';
import '../theme.dart';
import 'bits.dart';

class KickoffDialog extends StatelessWidget {
  const KickoffDialog({super.key, required this.controller});

  final PlayLogController controller;

  @override
  Widget build(BuildContext context) {
    final draft = controller.draft;
    final book = controller.book;
    final offense = draft.offenseId;
    final defense = defenseId(book, offense);
    final preview = draft.starter.trim().isEmpty
        ? 'Type the kicker.'
        : sentenceFrom(book, draft);
    return OverlayCard(
      maxWidth: 860,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Kickoff',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                ),
              ),
              AppButton(label: 'Close', onPressed: controller.closeSpecial),
            ],
          ),
          const SizedBox(height: 12),
          const SectionLabel('Kicking team'),
          TeamSelect(
            teams: book.teams,
            value: draft.offenseId,
            onChanged: (id) =>
                controller.patchDraft(draft.copyWith(offenseId: id)),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SectionLabel('Kick from'),
                    TeamSelect(
                      teams: book.teams,
                      value: draft.snapTeamId,
                      onChanged: (id) => controller.patch(
                        (current) => current.copyWith(snapTeamId: id),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionLabel('Yard'),
                  Row(
                    children: [
                      AppButton(
                        label: '−',
                        compact: true,
                        onPressed: () => controller.patch((current) {
                          final yard =
                              ((int.tryParse(current.snapYard) ?? 40) - 1)
                                  .clamp(1, 99);
                          return current.copyWith(snapYard: '$yard');
                        }),
                      ),
                      const SizedBox(width: 4),
                      BoundField(
                        width: 64,
                        center: true,
                        numeric: true,
                        value: draft.snapYard,
                        onChanged: (value) => controller.patch(
                          (current) => current.copyWith(snapYard: value),
                        ),
                      ),
                      const SizedBox(width: 4),
                      AppButton(
                        label: '+',
                        compact: true,
                        onPressed: () => controller.patch(
                          (current) => current.copyWith(
                            snapYard:
                                '${((int.tryParse(current.snapYard) ?? 40) + 1).clamp(1, 99)}',
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SectionLabel('Tackle'),
                    TeamSelect(
                      teams: book.teams,
                      value: draft.ballTeamId,
                      onChanged: (id) =>
                          controller.placeBallAt(id, draft.ballYard),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                children: [
                  const SectionLabel('Yard'),
                  BoundField(
                    width: 72,
                    center: true,
                    numeric: true,
                    value: draft.ballYard,
                    onChanged: (value) =>
                        controller.placeBallAt(draft.ballTeamId, value),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              JerseyField(
                fieldKey: const Key('kicker'),
                label: 'Kicker',
                value: draft.starter,
                hint: hintFor(draft.starter, book.players, offense, true),
                onChanged: (value) => controller.patch(
                  (current) => current.copyWith(starter: value),
                ),
              ),
              JerseyField(
                label: 'Returner',
                value: draft.target1,
                hint: hintFor(draft.target1, book.players, offense, true),
                onChanged: (value) => controller.patch(
                  (current) => current.copyWith(target1: value),
                ),
              ),
              JerseyField(
                label: 'Tackle',
                value: draft.tackler1,
                hint: hintFor(draft.tackler1, book.players, defense, true),
                onChanged: (value) => controller.patch(
                  (current) => current.copyWith(tackler1: value),
                ),
              ),
              JerseyField(
                label: 'Tackle 2',
                value: draft.tackler2,
                hint: hintFor(draft.tackler2, book.players, defense, true),
                onChanged: (value) => controller.patch(
                  (current) => current.copyWith(tackler2: value),
                ),
              ),
              JerseyField(
                label: 'Tackle 3',
                value: draft.tackler3,
                hint: hintFor(draft.tackler3, book.players, defense, true),
                onChanged: (value) => controller.patch(
                  (current) => current.copyWith(tackler3: value),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final result in const [
                ResultKind.tackled,
                ResultKind.downed,
                ResultKind.fairCatch,
                ResultKind.touchback,
                ResultKind.outOfBounds,
                ResultKind.touchdown,
              ])
                AppButton(
                  label: result.label,
                  selected: draft.result == result,
                  onPressed: () => controller.chooseResult(result),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Text(preview, style: const TextStyle(fontSize: 18, height: 1.4)),
          const SizedBox(height: 12),
          AppButton(
            label: 'Log kickoff',
            filled: true,
            expand: true,
            onPressed: draft.starter.trim().isEmpty ? null : controller.logPlay,
          ),
        ],
      ),
    );
  }
}

class ExtraPointDialog extends StatelessWidget {
  const ExtraPointDialog({super.key, required this.controller});

  final PlayLogController controller;

  @override
  Widget build(BuildContext context) {
    final draft = controller.draft;
    final book = controller.book;
    final preview = draft.starter.trim().isEmpty
        ? 'Type the kicker.'
        : sentenceFrom(book, draft);
    return OverlayCard(
      maxWidth: 560,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Extra point',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                ),
              ),
              AppButton(label: 'Close', onPressed: controller.closeSpecial),
            ],
          ),
          const SizedBox(height: 12),
          const SectionLabel('Kicking team'),
          TeamSelect(
            teams: book.teams,
            value: draft.offenseId,
            onChanged: (id) =>
                controller.patchDraft(draft.copyWith(offenseId: id)),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: [
              AppButton(
                label: '1 point',
                selected: draft.tryPoints != 2,
                onPressed: () => controller.patch(
                  (current) => current.copyWith(tryPoints: 1),
                ),
              ),
              AppButton(
                label: '2 points from the 2',
                selected: draft.tryPoints == 2,
                onPressed: controller.chooseTwoPoint,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: [
              JerseyField(
                label: draft.tryPoints == 2 ? 'Ball carrier' : 'Kicker',
                value: draft.starter,
                hint: hintFor(
                  draft.starter,
                  book.players,
                  draft.offenseId,
                  true,
                ),
                onChanged: (value) => controller.patch(
                  (current) => current.copyWith(starter: value),
                ),
              ),
              if (draft.tryPoints == 2)
                JerseyField(
                  label: 'Target',
                  value: draft.target1,
                  hint: hintFor(
                    draft.target1,
                    book.players,
                    draft.offenseId,
                    true,
                  ),
                  onChanged: (value) => controller.patch(
                    (current) => current.copyWith(target1: value),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: [
              AppButton(
                label: 'Good',
                selected: draft.result != ResultKind.incomplete,
                onPressed: () => controller.patch(
                  (current) => current.copyWith(result: ResultKind.downed),
                ),
              ),
              AppButton(
                label: 'No good',
                selected: draft.result == ResultKind.incomplete,
                onPressed: () => controller.patch(
                  (current) => current.copyWith(result: ResultKind.incomplete),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(preview, style: const TextStyle(fontSize: 18, height: 1.4)),
          const SizedBox(height: 12),
          AppButton(
            label: 'Log extra point',
            filled: true,
            expand: true,
            onPressed: draft.starter.trim().isEmpty ? null : controller.logPlay,
          ),
        ],
      ),
    );
  }
}

class TimeDialog extends StatelessWidget {
  const TimeDialog({super.key, required this.controller});

  final PlayLogController controller;

  @override
  Widget build(BuildContext context) {
    return OverlayCard(
      maxWidth: 360,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Time',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          BoundField(
            fieldKey: const Key('score-time'),
            value: controller.promptTime,
            hint: '8:42',
            onChanged: controller.setPromptTime,
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              AppButton(label: 'Cancel', onPressed: controller.cancelTime),
              const SizedBox(width: 8),
              AppButton(
                label: 'Log',
                filled: true,
                onPressed: controller.promptTime.trim().isEmpty
                    ? null
                    : () => controller.logPlay(controller.promptTime),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SpotEdit extends StatelessWidget {
  const _SpotEdit({
    required this.teamLabel,
    required this.teams,
    required this.teamId,
    required this.yard,
    required this.yardKey,
    required this.onTeam,
    required this.onYard,
  });

  final String teamLabel;
  final List<Team> teams;
  final String teamId;
  final String yard;
  final Key yardKey;
  final ValueChanged<String> onTeam;
  final ValueChanged<String> onYard;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SectionLabel(teamLabel),
              TeamSelect(teams: teams, value: teamId, onChanged: onTeam),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SectionLabel('Yard'),
            BoundField(
              fieldKey: yardKey,
              width: 72,
              center: true,
              numeric: true,
              value: yard,
              onChanged: onYard,
            ),
          ],
        ),
      ],
    );
  }
}

class EditPlayDialog extends StatefulWidget {
  const EditPlayDialog({
    super.key,
    required this.controller,
    required this.play,
  });

  final PlayLogController controller;
  final LoggedPlay play;

  @override
  State<EditPlayDialog> createState() => _EditPlayDialogState();
}

class _EditPlayDialogState extends State<EditPlayDialog> {
  late Draft form;
  late String text;
  bool custom = false;

  @override
  void initState() {
    super.initState();
    form = draftFromPlay(widget.play, widget.controller.book);
    text = widget.play.sentence;
  }

  void update(Draft next) {
    setState(() {
      form = next;
      if (!custom) {
        text = next.starter.trim().isEmpty
            ? widget.play.sentence
            : sentenceFrom(widget.controller.book, next);
      }
    });
  }

  void save() {
    if (playNeedsTime(form) && form.scoreTime.trim().isEmpty) return;
    final book = widget.controller.book;
    final sentence = custom || form.starter.trim().isEmpty
        ? text
        : sentenceFrom(book, form);
    widget.controller.saveEdited(
      widget.play.copyWith(
        quarter: form.quarter,
        down: form.down,
        distance: form.distance,
        sentence: sentence,
        snapshot: snapshotFrom(form, form.scoreTime.trim()),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final book = widget.controller.book;
    final defense = defenseId(book, form.offenseId);
    final kicking = kickingPlay(form.type);
    return OverlayCard(
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Edit play',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                ),
              ),
              AppButton(
                label: 'Cancel',
                onPressed: widget.controller.cancelEdit,
              ),
            ],
          ),
          const SizedBox(height: 12),
          const SectionLabel('Quarter'),
          Wrap(
            spacing: 6,
            children: [
              for (final quarter in const ['1', '2', '3', '4', 'OT'])
                AppButton(
                  label: quarter,
                  selected: form.quarter == quarter,
                  onPressed: () => update(form.copyWith(quarter: quarter)),
                ),
            ],
          ),
          const SizedBox(height: 12),
          const SectionLabel('Down'),
          Wrap(
            spacing: 6,
            children: [
              for (final down in const ['1', '2', '3', '4'])
                AppButton(
                  label: down,
                  selected: form.down == down,
                  onPressed: () => update(form.copyWith(down: down)),
                ),
              const SizedBox(width: 8),
              BoundField(
                width: 72,
                center: true,
                numeric: true,
                value: form.distance,
                onChanged: (value) => update(form.copyWith(distance: value)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SectionLabel(kicking ? 'Kicking team' : 'Offense'),
          TeamSelect(
            teams: book.teams,
            value: form.offenseId,
            onChanged: (id) => update(form.copyWith(offenseId: id)),
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: _SpotEdit(
                  teamLabel: form.type == PlayType.kickoff
                      ? 'Kick from'
                      : 'Ball on',
                  teams: book.teams,
                  teamId: form.snapTeamId,
                  yard: form.snapYard,
                  yardKey: const Key('edit-snap-yard'),
                  onTeam: (id) => update(form.copyWith(snapTeamId: id)),
                  onYard: (value) => update(form.copyWith(snapYard: value)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _SpotEdit(
                  teamLabel: form.type == PlayType.kickoff ? 'Tackle' : 'Spot',
                  teams: book.teams,
                  teamId: form.ballTeamId,
                  yard: form.ballYard,
                  yardKey: const Key('edit-ball-yard'),
                  onTeam: (id) => update(form.copyWith(ballTeamId: id)),
                  onYard: (value) => update(form.copyWith(ballYard: value)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const SectionLabel('Play'),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              for (final type in playButtons)
                AppButton(
                  label: type.label,
                  selected: form.type == type,
                  onPressed: () => update(
                    form.copyWith(
                      type: type,
                      possession: possessionPlays.contains(type)
                          ? true
                          : form.possession,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          const SectionLabel('Result'),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              for (final result in ResultKind.values.where(resultMain.contains))
                AppButton(
                  label: result.label,
                  selected: form.result == result,
                  onPressed: () => update(
                    form.copyWith(
                      result: result,
                      possession: turnoverResults.contains(result),
                    ),
                  ),
                ),
              DropdownButton<ResultKind>(
                value: resultMore.contains(form.result) ? form.result : null,
                hint: const Text('More'),
                dropdownColor: PlayColors.surface,
                items: [
                  for (final result in resultMore)
                    DropdownMenuItem(value: result, child: Text(result.label)),
                ],
                onChanged: (result) {
                  if (result == null) return;
                  var next = form.copyWith(
                    result: result,
                    possession: turnoverResults.contains(result),
                  );
                  if (result == ResultKind.touchback &&
                      kickingPlay(form.type)) {
                    next = next.copyWith(ballTeamId: defense, ballYard: '20');
                  }
                  update(next);
                },
              ),
              AppButton(
                label: 'Possession',
                selected: form.possession,
                onPressed: () =>
                    update(form.copyWith(possession: !form.possession)),
              ),
              AppButton(
                label: 'Touchdown',
                selected: form.result == ResultKind.touchdown,
                onPressed: () => update(
                  form.copyWith(
                    result: ResultKind.touchdown,
                    possession: false,
                  ),
                ),
              ),
            ],
          ),
          if (playNeedsTime(form)) ...[
            const SizedBox(height: 12),
            const SectionLabel('Time'),
            BoundField(
              width: 120,
              value: form.scoreTime,
              hint: '8:42',
              onChanged: (value) => update(form.copyWith(scoreTime: value)),
            ),
          ],
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (form.type == PlayType.punt) ...[
                JerseyField(
                  label: 'Punter',
                  value: form.starter,
                  hint: hintFor(
                    form.starter,
                    book.players,
                    form.offenseId,
                    true,
                  ),
                  onChanged: (value) => update(form.copyWith(starter: value)),
                ),
                JerseyField(
                  label: 'Receiver',
                  value: form.target1,
                  hint: hintFor(form.target1, book.players, defense, true),
                  onChanged: (value) => update(form.copyWith(target1: value)),
                ),
                JerseyField(
                  label: 'Tackler',
                  value: form.tackler1,
                  hint: hintFor(
                    form.tackler1,
                    book.players,
                    form.offenseId,
                    true,
                  ),
                  onChanged: (value) => update(form.copyWith(tackler1: value)),
                ),
              ] else ...[
                JerseyField(
                  label: startLabel(form.type),
                  value: form.starter,
                  hint: hintFor(
                    form.starter,
                    book.players,
                    form.offenseId,
                    true,
                  ),
                  onChanged: (value) => update(form.copyWith(starter: value)),
                ),
                JerseyField(
                  label: kicking ? 'Receiver' : 'Target',
                  value: form.target1,
                  hint: hintFor(
                    form.target1,
                    book.players,
                    form.offenseId,
                    true,
                  ),
                  onChanged: (value) => update(form.copyWith(target1: value)),
                ),
                JerseyField(
                  label: kicking ? 'Receiver 2' : 'Target 2',
                  value: form.target2,
                  hint: hintFor(
                    form.target2,
                    book.players,
                    form.offenseId,
                    true,
                  ),
                  onChanged: (value) => update(form.copyWith(target2: value)),
                ),
                JerseyField(
                  label: 'Tackler',
                  value: form.tackler1,
                  hint: hintFor(form.tackler1, book.players, defense, true),
                  onChanged: (value) => update(form.copyWith(tackler1: value)),
                ),
                JerseyField(
                  label: 'Tackler 2',
                  value: form.tackler2,
                  hint: hintFor(form.tackler2, book.players, defense, true),
                  onChanged: (value) => update(form.copyWith(tackler2: value)),
                ),
                JerseyField(
                  label: 'Tackler 3',
                  value: form.tackler3,
                  hint: hintFor(form.tackler3, book.players, defense, true),
                  onChanged: (value) => update(form.copyWith(tackler3: value)),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          const SectionLabel('This play'),
          BoundField(
            value: text,
            maxLines: 3,
            onChanged: (value) => setState(() {
              custom = true;
              text = value;
            }),
          ),
          const SizedBox(height: 12),
          AppButton(
            label: 'Save play',
            filled: true,
            expand: true,
            onPressed: playNeedsTime(form) && form.scoreTime.trim().isEmpty
                ? null
                : save,
          ),
        ],
      ),
    );
  }
}
