import 'package:flutter/material.dart';

import '../domain/actions.dart';
import '../domain/models.dart';
import '../domain/stats.dart';
import '../state/play_log_controller.dart';
import '../theme.dart';
import 'bits.dart';

class TeamsSheet extends StatelessWidget {
  const TeamsSheet({super.key, required this.controller});

  final PlayLogController controller;

  @override
  Widget build(BuildContext context) {
    final book = controller.book;
    return OverlayCard(
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Teams',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                ),
              ),
              AppButton(
                label: 'Done',
                filled: true,
                onPressed: () => controller.toggleFlag(teams: false),
              ),
            ],
          ),
          const SizedBox(height: 12),
          LayoutBuilder(
            builder: (context, constraints) {
              final sideBySide = constraints.maxWidth > 700;
              final columns = [
                for (final team in book.teams)
                  _TeamEditor(controller: controller, team: team),
              ];
              if (!sideBySide) {
                return Column(
                  children: [
                    for (final column in columns) ...[
                      column,
                      const SizedBox(height: 12),
                    ],
                  ],
                );
              }
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  for (final column in columns)
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.all(6),
                        child: column,
                      ),
                    ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _TeamEditor extends StatelessWidget {
  const _TeamEditor({required this.controller, required this.team});

  final PlayLogController controller;
  final Team team;

  @override
  Widget build(BuildContext context) {
    final players = controller.book.players.where(
      (player) => player.teamId == team.id,
    );
    return DecoratedBox(
      decoration: BoxDecoration(
        color: PlayColors.bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: PlayColors.line),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SectionLabel('Team'),
            BoundField(
              value: team.name,
              onChanged: (value) => controller.rename(team.id, value),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                BoundField(
                  width: 56,
                  center: true,
                  numeric: true,
                  hint: '#',
                  value: controller.rosterNum[team.id] ?? '',
                  onChanged: (value) =>
                      controller.setRosterField(team.id, number: value),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: BoundField(
                    hint: 'Name',
                    value: controller.rosterName[team.id] ?? '',
                    onChanged: (value) =>
                        controller.setRosterField(team.id, name: value),
                  ),
                ),
                const SizedBox(width: 8),
                BoundField(
                  width: 64,
                  center: true,
                  hint: 'Pos',
                  value: controller.rosterPos[team.id] ?? '',
                  onChanged: (value) =>
                      controller.setRosterField(team.id, position: value),
                ),
                const SizedBox(width: 8),
                AppButton(
                  label: 'Add',
                  filled: true,
                  onPressed: () => controller.submitPlayer(team.id),
                ),
              ],
            ),
            const SizedBox(height: 8),
            AppButton(
              label: 'Load CSV',
              expand: true,
              onPressed: () => controller.pickRoster(team.id),
            ),
            const SizedBox(height: 6),
            const Text(
              'Number, name, position. Replaces this roster.',
              style: TextStyle(color: PlayColors.muted, fontSize: 12),
            ),
            const SizedBox(height: 8),
            if (players.isEmpty)
              const Text(
                'No players yet.',
                style: TextStyle(color: PlayColors.muted),
              )
            else
              for (final player in players)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 3),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 36,
                        child: Text(
                          player.number,
                          style: const TextStyle(
                            color: PlayColors.accent,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          player.position == null || player.position!.isEmpty
                              ? player.name
                              : '${player.name} · ${player.position}',
                        ),
                      ),
                      TextButton(
                        onPressed: () => controller.deletePlayer(player.id),
                        child: const Text(
                          'Remove',
                          style: TextStyle(color: PlayColors.muted),
                        ),
                      ),
                    ],
                  ),
                ),
          ],
        ),
      ),
    );
  }
}

class StatsSheet extends StatelessWidget {
  const StatsSheet({super.key, required this.book, required this.onClose});

  final Book book;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final report = gameStats(book);
    final teams = report.teams;
    final kicking = teams.any(
      (team) => team.players.any(
        (player) =>
            player.punts > 0 ||
            player.kickoffs > 0 ||
            player.fgAtt > 0 ||
            player.xpAtt > 0,
      ),
    );
    return OverlayCard(
      maxWidth: 1100,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Stats',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                ),
              ),
              AppButton(label: 'Done', filled: true, onPressed: onClose),
            ],
          ),
          const SizedBox(height: 12),
          for (final period in report.periods) ...[
            _PeriodSection(period: period),
            const SizedBox(height: 12),
          ],
          for (final team in teams) ...[
            DecoratedBox(
              decoration: BoxDecoration(
                color: PlayColors.bg,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: PlayColors.line),
              ),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      team.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      '${team.score} points · ${team.passYds} pass yds · ${team.rushYds} rush yds · ${team.sacks} sacks for ${team.sackYds} yds',
                      style: const TextStyle(color: PlayColors.muted),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Players',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (team.players.isEmpty)
                      const Text(
                        'No stats yet.',
                        style: TextStyle(color: PlayColors.muted),
                      )
                    else
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: DataTable(
                          headingTextStyle: const TextStyle(
                            color: PlayColors.muted,
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                          dataTextStyle: const TextStyle(
                            color: PlayColors.fg,
                            fontSize: 13,
                          ),
                          columns: [
                            const DataColumn(label: Text('Player')),
                            const DataColumn(label: Text('C-A')),
                            const DataColumn(label: Text('Pass')),
                            const DataColumn(label: Text('Car')),
                            const DataColumn(label: Text('Rush')),
                            const DataColumn(label: Text('Rec')),
                            const DataColumn(label: Text('Yds')),
                            const DataColumn(label: Text('TD')),
                            const DataColumn(label: Text('Tkl')),
                            const DataColumn(label: Text('Sack')),
                            const DataColumn(label: Text('Loss')),
                            const DataColumn(label: Text('INT')),
                            if (kicking) const DataColumn(label: Text('Punt')),
                            if (kicking) const DataColumn(label: Text('KO')),
                            if (kicking) const DataColumn(label: Text('FG')),
                            if (kicking) const DataColumn(label: Text('XP')),
                          ],
                          rows: [
                            for (final player in team.players)
                              DataRow(
                                cells: [
                                  DataCell(Text(player.label)),
                                  DataCell(
                                    Text(
                                      player.att == 0
                                          ? '—'
                                          : '${player.cmp}-${player.att}',
                                    ),
                                  ),
                                  DataCell(
                                    Text(
                                      player.att == 0
                                          ? '—'
                                          : '${player.passYds}',
                                    ),
                                  ),
                                  DataCell(
                                    Text(
                                      player.rush == 0 ? '—' : '${player.rush}',
                                    ),
                                  ),
                                  DataCell(
                                    Text(
                                      player.rush == 0
                                          ? '—'
                                          : '${player.rushYds}',
                                    ),
                                  ),
                                  DataCell(
                                    Text(
                                      player.rec == 0 ? '—' : '${player.rec}',
                                    ),
                                  ),
                                  DataCell(
                                    Text(
                                      player.rec == 0
                                          ? '—'
                                          : '${player.recYds}',
                                    ),
                                  ),
                                  DataCell(
                                    Text(player.td == 0 ? '—' : '${player.td}'),
                                  ),
                                  DataCell(
                                    Text(
                                      player.tackles == 0
                                          ? '—'
                                          : '${player.tackles}',
                                    ),
                                  ),
                                  DataCell(
                                    Text(
                                      player.sacks == 0
                                          ? '—'
                                          : '${player.sacks}',
                                    ),
                                  ),
                                  DataCell(
                                    Text(
                                      player.sacks == 0
                                          ? '—'
                                          : '${player.sackYds}',
                                    ),
                                  ),
                                  DataCell(
                                    Text(
                                      player.interceptions == 0
                                          ? '—'
                                          : '${player.interceptions}',
                                    ),
                                  ),
                                  if (kicking)
                                    DataCell(
                                      Text(
                                        player.punts == 0
                                            ? '—'
                                            : '${player.punts}',
                                      ),
                                    ),
                                  if (kicking)
                                    DataCell(
                                      Text(
                                        player.kickoffs == 0
                                            ? '—'
                                            : '${player.kickoffs}',
                                      ),
                                    ),
                                  if (kicking)
                                    DataCell(
                                      Text(
                                        player.fgAtt == 0
                                            ? '—'
                                            : '${player.fg}-${player.fgAtt}',
                                      ),
                                    ),
                                  if (kicking)
                                    DataCell(
                                      Text(
                                        player.xpAtt == 0
                                            ? '—'
                                            : '${player.xp}-${player.xpAtt}',
                                      ),
                                    ),
                                ],
                              ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }
}

class _PeriodSection extends StatelessWidget {
  const _PeriodSection({required this.period});

  final PeriodStats period;

  String get _title {
    if (period.label == 'Game') return 'Game';
    if (period.label == 'OT') return 'Overtime';
    if (period.label == '—') return 'Quarter';
    return 'Q${period.label}';
  }

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: PlayColors.bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: PlayColors.line),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              _title,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (var i = 0; i < period.teams.length; i++) ...[
                  if (i > 0) const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          period.teams[i].name,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 6),
                        _TypeTable(types: period.teams[i].types),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _TypeTable extends StatelessWidget {
  const _TypeTable({required this.types});

  final List<TypeTotal> types;

  static const _head = TextStyle(
    color: PlayColors.muted,
    fontSize: 12,
    fontWeight: FontWeight.w700,
  );
  static const _cell = TextStyle(fontSize: 13);

  @override
  Widget build(BuildContext context) {
    if (types.isEmpty) {
      return const Text('No plays.', style: TextStyle(color: PlayColors.muted));
    }
    final count = types.fold<int>(0, (sum, line) => sum + line.count);
    final yards = types.fold<int>(0, (sum, line) => sum + line.yards);
    return Table(
      columnWidths: const {
        0: FlexColumnWidth(2.2),
        1: FlexColumnWidth(),
        2: FlexColumnWidth(),
      },
      defaultVerticalAlignment: TableCellVerticalAlignment.middle,
      children: [
        const TableRow(
          children: [
            Padding(
              padding: EdgeInsets.only(bottom: 4),
              child: Text('Type', style: _head),
            ),
            Text('Count', style: _head),
            Text('Yards', style: _head),
          ],
        ),
        for (final line in types)
          TableRow(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Text(line.type.label, style: _cell),
              ),
              Text('${line.count}', style: _cell),
              Text('${line.yards}', style: _cell),
            ],
          ),
        TableRow(
          children: [
            const Padding(
              padding: EdgeInsets.only(top: 4),
              child: Text(
                'Total',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                '$count',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                '$yards',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class SeasonSheet extends StatelessWidget {
  const SeasonSheet({super.key, required this.controller});

  final PlayLogController controller;

  @override
  Widget build(BuildContext context) {
    final season = controller.season;
    final games = [...season.games]
      ..sort(
        (a, b) => b.date.compareTo(a.date) != 0
            ? b.date.compareTo(a.date)
            : b.id.compareTo(a.id),
      );
    return OverlayCard(
      maxWidth: 640,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Season',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          const Text(
            'This copy lives on this computer. Save a backup file to keep every season. Load that file on this or another computer.',
            style: TextStyle(color: PlayColors.muted),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              AppButton(
                label: 'Save backup',
                filled: true,
                onPressed: controller.saveBackup,
              ),
              AppButton(label: 'Load backup', onPressed: controller.pickBackup),
            ],
          ),
          if (controller.backupNote.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              controller.backupNote,
              style: const TextStyle(color: PlayColors.muted),
            ),
          ],
          const SizedBox(height: 8),
          Text(
            '${season.closed ? 'Stopped.' : 'Open.'} ${season.games.length} game${season.games.length == 1 ? '' : 's'}.'
            '${season.past.isEmpty ? '' : ' ${season.past.length} saved season${season.past.length == 1 ? '' : 's'}.'}',
            style: const TextStyle(color: PlayColors.muted),
          ),
          const SizedBox(height: 8),
          for (final game in games)
            _GameRow(controller: controller, game: game),
          if (season.past.isNotEmpty) ...[
            const SizedBox(height: 12),
            const SectionLabel('Saved seasons'),
            for (final item in season.past)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: AppButton(
                  label:
                      'Stopped ${item.stopped} · ${item.label ?? seasonLabel(item.games, item.stopped)} · ${item.games.length} game${item.games.length == 1 ? '' : 's'}',
                  expand: true,
                  onPressed: () => controller.openPast(item.id),
                ),
              ),
          ],
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            alignment: WrapAlignment.end,
            children: [
              AppButton(
                label: 'Start season',
                filled: true,
                onPressed: () => controller.askConfirm(ConfirmKind.startSeason),
              ),
              AppButton(
                label: 'Stop season',
                onPressed: season.closed
                    ? null
                    : () => controller.askConfirm(ConfirmKind.stopSeason),
              ),
              AppButton(
                label: 'Close',
                onPressed: () => controller.toggleFlag(seasonOpen: false),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _GameRow extends StatelessWidget {
  const _GameRow({required this.controller, required this.game});

  final PlayLogController controller;
  final GameRecord game;

  @override
  Widget build(BuildContext context) {
    final scores = teamScores(game.book);
    final home = game.book.teams.isEmpty ? null : game.book.teams.first;
    final away = game.book.teams.length < 2 ? null : game.book.teams[1];
    final selected = game.id == controller.season.activeId;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: selected ? PlayColors.raised : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: selected ? PlayColors.accent : PlayColors.line,
        ),
      ),
      child: Row(
        children: [
          TextButton(
            onPressed: () async {
              final initial = DateTime.tryParse(game.date) ?? DateTime.now();
              final picked = await showDatePicker(
                context: context,
                initialDate: initial,
                firstDate: DateTime(2000),
                lastDate: DateTime(2100),
              );
              if (picked == null) return;
              final month = picked.month.toString().padLeft(2, '0');
              final day = picked.day.toString().padLeft(2, '0');
              controller.setGameDate(game.id, '${picked.year}-$month-$day');
            },
            child: Text(
              game.date,
              style: const TextStyle(color: PlayColors.fg),
            ),
          ),
          Expanded(
            child: InkWell(
              onTap: () => controller.openGame(game.id),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${home?.name.isNotEmpty == true ? home!.name : 'Home'} vs ${away?.name.isNotEmpty == true ? away!.name : 'Away'}',
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  Text(
                    '${scores[home?.id ?? ''] ?? 0}–${scores[away?.id ?? ''] ?? 0}${game.isFinal ? ' · Final' : ' · In progress'}',
                    style: const TextStyle(
                      color: PlayColors.muted,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),
          AppButton(
            label: 'Delete',
            compact: true,
            onPressed: controller.season.games.length < 2
                ? null
                : () => controller.removeGame(game.id),
          ),
        ],
      ),
    );
  }
}

class ConfirmDialog extends StatelessWidget {
  const ConfirmDialog({super.key, required this.controller});

  final PlayLogController controller;

  @override
  Widget build(BuildContext context) {
    final kind = controller.confirming;
    if (kind == null) return const SizedBox.shrink();
    final title = switch (kind) {
      ConfirmKind.gameFinal => 'Complete game',
      ConfirmKind.stopSeason => 'Stop season',
      ConfirmKind.startSeason => 'Start season',
    };
    final body = switch (kind) {
      ConfirmKind.gameFinal => 'Mark this game final. The score and log stay. You will not be able to add plays.',
      ConfirmKind.stopSeason => 'Stop this season. The current game is marked final, and no new games can be added until you start another season.',
      ConfirmKind.startSeason => 'Start a new season. This season is saved and can be opened later. The home roster is copied. The opponent roster starts empty.',
    };
    final action = switch (kind) {
      ConfirmKind.gameFinal => 'Complete',
      ConfirmKind.stopSeason => 'Stop',
      ConfirmKind.startSeason => 'Start',
    };
    return OverlayCard(
      maxWidth: 420,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          Text(body, style: const TextStyle(color: PlayColors.muted)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              AppButton(label: 'Cancel', onPressed: controller.cancelConfirm),
              const SizedBox(width: 8),
              AppButton(
                label: action,
                filled: true,
                onPressed: switch (kind) {
                  ConfirmKind.gameFinal => controller.completeGame,
                  ConfirmKind.stopSeason => controller.stopSeason,
                  ConfirmKind.startSeason => controller.startSeason,
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class MessageDialog extends StatelessWidget {
  const MessageDialog({
    super.key,
    required this.title,
    required this.body,
    required this.confirm,
    required this.onConfirm,
    required this.onCancel,
  });

  final String title;
  final String body;
  final String confirm;
  final VoidCallback onConfirm;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    return OverlayCard(
      maxWidth: 420,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          Text(body, style: const TextStyle(color: PlayColors.muted)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              AppButton(label: 'Cancel', onPressed: onCancel),
              const SizedBox(width: 8),
              AppButton(label: confirm, filled: true, onPressed: onConfirm),
            ],
          ),
        ],
      ),
    );
  }
}

class ExportSheet extends StatelessWidget {
  const ExportSheet({super.key, required this.controller});

  final PlayLogController controller;

  @override
  Widget build(BuildContext context) {
    final text = csvText(controller.book);
    final count = controller.book.plays.length;
    return OverlayCard(
      maxWidth: 720,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Export CSV',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          Text(
            count == 0
                ? 'The log is empty. Copy or download the header, or log a play first.'
                : '$count play${count == 1 ? '' : 's'}, oldest first.',
            style: const TextStyle(color: PlayColors.muted),
          ),
          const SizedBox(height: 12),
          DecoratedBox(
            decoration: BoxDecoration(
              color: PlayColors.raised,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: PlayColors.line),
            ),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: SelectableText(
                text,
                style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              AppButton(
                label: 'Close',
                onPressed: () => controller.toggleFlag(export: false),
              ),
              const SizedBox(width: 8),
              AppButton(
                label: controller.copied ? 'Copied' : 'Copy',
                onPressed: controller.copyCsv,
              ),
              const SizedBox(width: 8),
              AppButton(
                label: 'Download',
                filled: true,
                onPressed: controller.downloadCsv,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
