import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:play_log/main.dart';
import 'package:play_log/persistence/season_repository.dart';
import 'package:play_log/ui/bits.dart';

void main() {
  testWidgets('logging a known jersey writes the play sentence', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1400, 2200);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(PlayLogApp(repository: MemorySeasonRepository()));
    await tester.pumpAndSettle();

    expect(find.text('Play Log'), findsOneWidget);
    expect(find.text("O'Gorman"), findsWidgets);

    expect(find.text('Season'), findsNothing);
    expect(find.byType(Scrollbar), findsOneWidget);
    final menu = tester.getRect(
      find
          .ancestor(
            of: find.text('Menu'),
            matching: find.byType(GestureDetector),
          )
          .first,
    );
    expect(menu.width, lessThan(180));
    final title = tester.getTopLeft(find.text('Play Log'));
    expect((menu.top - title.dy).abs(), lessThan(24));
    final down = tester.getTopLeft(find.text('DOWN'));
    expect(down.dy - title.dy, lessThan(520));
    final gameLog = tester.getTopLeft(find.text('GAME LOG'));
    expect(gameLog.dx, greaterThan(down.dx + 200));
    expect((gameLog.dy - down.dy).abs(), lessThan(48));

    await tester.tap(find.text('Menu'));
    await tester.pumpAndSettle();
    expect(find.text('Season'), findsOneWidget);
    expect(find.text('Teams'), findsOneWidget);
    expect(find.text('Complete game'), findsOneWidget);
    await tester.tap(find.byType(ModalBarrier).last);
    await tester.pumpAndSettle();
    expect(find.text('Season'), findsNothing);

    await tester.enterText(find.byKey(const Key('starter')), '3');
    await tester.pump();
    expect(find.text('Chace Hermanson (3)'), findsWidgets);

    final logPlay = find.text('Log play');
    await tester.ensureVisible(logPlay);
    await tester.pump();
    await tester.tap(logPlay);
    await tester.pump();

    expect(
      find.textContaining('Pass from Chace Hermanson (3)'),
      findsOneWidget,
    );
    expect(find.textContaining('1st & 10'), findsOneWidget);

    await tester.tap(find.text('Edit'));
    await tester.pumpAndSettle();
    expect(find.text('Edit play'), findsOneWidget);
    await tester.enterText(find.byKey(const Key('edit-snap-yard')), '45');
    await tester.pump();
    await tester.enterText(find.byKey(const Key('edit-ball-yard')), '37');
    await tester.pump();
    final save = find.text('Save play');
    await tester.ensureVisible(save);
    await tester.pump();
    await tester.tap(save);
    await tester.pumpAndSettle();

    expect(find.text('Edit play'), findsNothing);
    expect(find.textContaining("Ball on the O'Gorman 45"), findsOneWidget);
    expect(find.textContaining("tackled on the O'Gorman 37"), findsOneWidget);

    await tester.tap(find.text('Menu'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Stats'));
    await tester.pumpAndSettle();
    expect(find.text('Game'), findsOneWidget);
    expect(find.text('Q1'), findsOneWidget);
    expect(find.text('Count'), findsWidgets);
    expect(find.text('Yards'), findsWidgets);
    expect(find.text('Pass'), findsWidgets);
    expect(find.text('Players'), findsWidgets);
  });

  testWidgets('field and entry stay on screen beside the game log', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1280, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(PlayLogApp(repository: MemorySeasonRepository()));
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    final play = tester.getRect(find.text('Log play'));
    expect(play.top, greaterThan(0));
    expect(play.bottom, lessThan(800));
    final down = tester.getTopLeft(find.text('DOWN'));
    final result = tester.getTopLeft(find.text('RESULT'));
    expect((result.dx - down.dx).abs(), lessThan(32));
    final gameLog = tester.getTopLeft(find.text('GAME LOG'));
    expect(gameLog.dx, greaterThan(play.right - 8));
    final field = tester.getRect(find.text('Flip ends'));
    expect(field.right - gameLog.dx, greaterThan(play.width));
    expect(field.right, greaterThan(1200));
    expect(find.byType(Scrollbar), findsOneWidget);
    expect(field.bottom, lessThan(play.top));
  });

  testWidgets('a punt uses punter, receiver, and tackler', (tester) async {
    tester.view.physicalSize = const Size(1400, 2200);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(PlayLogApp(repository: MemorySeasonRepository()));
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('Punt'));
    await tester.tap(find.text('Punt'));
    await tester.pump();

    expect(find.text('PUNTER'), findsOneWidget);
    expect(find.text('RECEIVER'), findsOneWidget);
    expect(find.text('TACKLER'), findsOneWidget);
    expect(find.text('TARGET'), findsNothing);
    expect(find.text('TARGET 2'), findsNothing);
    expect(find.text('TACKLER 2'), findsNothing);
    expect(find.text('TACKLER 3'), findsNothing);

    await tester.enterText(find.byKey(const Key('starter')), '3');
    await tester.enterText(find.byKey(const Key('receiver')), '5');
    await tester.enterText(find.byKey(const Key('punt-tackler')), '2');
    await tester.pump();

    expect(find.text('Chace Hermanson (3)'), findsWidgets);
    expect(find.text('Darius Harrison (5)'), findsWidgets);
    expect(find.text('Carter Majeres (2)'), findsWidgets);
    expect(find.textContaining('punter Chace Hermanson (3)'), findsOneWidget);
    expect(find.textContaining('receiver Darius Harrison (5)'), findsOneWidget);
    expect(find.textContaining('by Carter Majeres (2)'), findsOneWidget);
    expect(find.textContaining('Brady Majeres'), findsNothing);
    expect(find.textContaining('Luis Vazquez'), findsNothing);

    final logPlay = find.text('Log play');
    await tester.ensureVisible(logPlay);
    await tester.tap(logPlay);
    await tester.pump();
    await tester.tap(find.text('Edit'));
    await tester.pumpAndSettle();

    final edit = find.ancestor(
      of: find.text('Edit play'),
      matching: find.byType(OverlayCard),
    );
    expect(
      find.descendant(of: edit, matching: find.text('PUNTER')),
      findsOneWidget,
    );
    expect(
      find.descendant(of: edit, matching: find.text('RECEIVER')),
      findsOneWidget,
    );
    expect(
      find.descendant(of: edit, matching: find.text('TACKLER')),
      findsOneWidget,
    );
    expect(
      find.descendant(of: edit, matching: find.text('TARGET 2')),
      findsNothing,
    );
    expect(
      find.descendant(of: edit, matching: find.text('TACKLER 2')),
      findsNothing,
    );
    expect(
      find.descendant(of: edit, matching: find.text('Darius Harrison (5)')),
      findsOneWidget,
    );
    expect(
      find.descendant(of: edit, matching: find.text('Carter Majeres (2)')),
      findsOneWidget,
    );
    expect(
      find.descendant(of: edit, matching: find.textContaining('Brady Majeres')),
      findsNothing,
    );
  });
}
