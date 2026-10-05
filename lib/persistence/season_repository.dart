import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';

import '../domain/actions.dart';
import '../domain/models.dart';

abstract class SeasonRepository {
  Future<Season?> load();
  Future<void> save(Season season);
}

class MemorySeasonRepository implements SeasonRepository {
  Season? value;

  @override
  Future<Season?> load() async => value;

  @override
  Future<void> save(Season season) async {
    value = season;
  }
}

class FileSeasonRepository implements SeasonRepository {
  File? _file;

  Future<File> _resolve() async {
    final existing = _file;
    if (existing != null) return existing;
    final dir = await getApplicationSupportDirectory();
    await dir.create(recursive: true);
    return _file = File('${dir.path}/play-log-season-v1.json');
  }

  @override
  Future<Season?> load() async {
    try {
      final file = await _resolve();
      if (!await file.exists()) return null;
      final decoded = jsonDecode(await file.readAsString());
      return seasonFromParsed(decoded) ?? seasonFromLegacyBook(decoded);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<void> save(Season season) async {
    final file = await _resolve();
    final tmp = File('${file.path}.tmp');
    await tmp.writeAsString(jsonEncode(season.toJson()));
    await tmp.rename(file.path);
  }
}
