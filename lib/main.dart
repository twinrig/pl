import 'package:flutter/material.dart';

import 'persistence/season_repository.dart';
import 'state/play_log_controller.dart';
import 'theme.dart';
import 'ui/play_book_page.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(PlayLogApp(repository: FileSeasonRepository()));
}

class PlayLogApp extends StatefulWidget {
  const PlayLogApp({super.key, required this.repository});

  final SeasonRepository repository;

  @override
  State<PlayLogApp> createState() => _PlayLogAppState();
}

class PlayScrollBehavior extends MaterialScrollBehavior {
  const PlayScrollBehavior();

  @override
  Widget buildScrollbar(
    BuildContext context,
    Widget child,
    ScrollableDetails details,
  ) {
    return child;
  }
}

class _PlayLogAppState extends State<PlayLogApp> {
  late final PlayLogController controller;

  @override
  void initState() {
    super.initState();
    controller = PlayLogController(widget.repository);
    controller.load();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Play Log',
      debugShowCheckedModeBanner: false,
      theme: playLogTheme(),
      scrollBehavior: const PlayScrollBehavior(),
      home: PlayBookPage(controller: controller),
    );
  }
}
