import 'models.dart';
import 'plays.dart';

const washingtonName = 'Washington';
const ogormanName = "O'Gorman";

const washingtonRoster = <({String number, String name})>[
  (number: '0', name: 'Justin Rodriguez'),
  (number: '1', name: 'Samuel Bowen'),
  (number: '3', name: 'Kobe Gully'),
  (number: '4', name: 'Kaden Carroll'),
  (number: '5', name: 'Darius Harrison'),
  (number: '6', name: 'Bronson Schramm'),
  (number: '7', name: 'Luis Vazquez'),
  (number: '8', name: 'Godwin Zephania'),
  (number: '9', name: 'Chase Comp'),
  (number: '10', name: 'Miles Smith'),
  (number: '11', name: 'Dezman Wilka'),
  (number: '12', name: 'Ryder Dobberpuhl'),
  (number: '13', name: 'Graham Frederiksen'),
  (number: '14', name: 'Kacyn Larson'),
  (number: '15', name: 'Caden Sporrer'),
  (number: '16', name: 'Rylan Kvistero'),
  (number: '17', name: 'Broxsen McVay'),
  (number: '18', name: 'Isayah Everette'),
  (number: '19', name: 'Carter Wentzel'),
  (number: '21', name: 'Brett Pankonin'),
  (number: '22', name: 'Caeden Consoer'),
  (number: '23', name: 'Cole Hauser'),
  (number: '24', name: 'Biniam Mekuria'),
  (number: '25', name: 'Elijah McMahan'),
  (number: '26', name: 'Ojeir Agwa'),
  (number: '27', name: 'Masen Jennings'),
  (number: '28', name: 'Jordan Patterson'),
  (number: '29', name: 'Erdi Maliqi'),
  (number: '30', name: 'Kaden Hill'),
  (number: '31', name: 'Gavin Knopf'),
  (number: '32', name: 'Solomon Gayflor'),
  (number: '33', name: 'Prince Gayetaye'),
  (number: '34', name: 'Kingston Fabian'),
  (number: '35', name: 'Charles McCloskey'),
  (number: '37', name: 'Devin Walker'),
  (number: '40', name: 'Carter Jongejeugd'),
  (number: '41', name: 'Thomas Richardson'),
  (number: '42', name: 'Eddie Morataya Lopez'),
  (number: '43', name: 'Jacob Richardson'),
  (number: '44', name: 'Kayavanh Khao-on'),
  (number: '45', name: 'Collin Arens'),
  (number: '46', name: 'Richard Ryken'),
  (number: '47', name: 'Gavin Young'),
  (number: '48', name: 'Elija Van Vooren'),
  (number: '50', name: 'Zayden Lee'),
  (number: '51', name: 'Matthew Melton'),
  (number: '52', name: 'Stephen Tran'),
  (number: '53', name: 'Madden Burkhardt'),
  (number: '54', name: 'Lincoln Damm'),
  (number: '55', name: 'Eli Boyd'),
  (number: '57', name: 'Blake Knoff'),
  (number: '58', name: 'Hayes Petersen'),
  (number: '59', name: 'Michael Hoefert'),
  (number: '61', name: 'Cole Malchow'),
  (number: '63', name: 'Kenan Alberts'),
  (number: '64', name: 'Kellby Haverhals'),
  (number: '65', name: 'Chance Lauck'),
  (number: '67', name: 'Mark Jauregui'),
  (number: '70', name: 'Kevin Knoff'),
  (number: '71', name: 'Parker Muth'),
  (number: '72', name: 'Edward Petka'),
  (number: '74', name: 'Noah Miller'),
  (number: '75', name: 'Hudson Tirevold'),
  (number: '77', name: 'Dhieu Gak'),
  (number: '78', name: 'Kiir Mach'),
  (number: '79', name: 'Cale Farmer'),
  (number: '80', name: 'Machar Ijong'),
  (number: '82', name: 'Aden Sambido'),
  (number: '84', name: 'Zaki Dillard'),
  (number: '85', name: 'Kalen Kvistero'),
  (number: '87', name: 'Marcus Melton'),
  (number: '88', name: 'Joshua Battle'),
];

const ogormanRoster = <({String number, String name})>[
  (number: '1', name: 'Braylon Treasure'),
  (number: '2', name: 'Carter Majeres'),
  (number: '3', name: 'Chace Hermanson'),
  (number: '4', name: 'Alex Christian'),
  (number: '5', name: 'Brady Majeres'),
  (number: '6', name: 'Tanner Charron'),
  (number: '7', name: 'Rylan Cody'),
  (number: '8', name: 'Zach Erickson'),
  (number: '9', name: 'Drake Severson'),
  (number: '10', name: 'Aaron Stoll'),
  (number: '11', name: 'Benny Willers'),
  (number: '12', name: 'Remington Jones'),
  (number: '13', name: 'Oliver Klinkhammer'),
  (number: '14', name: 'Isaac Myers'),
  (number: '15', name: 'Abe Struck'),
  (number: '16', name: 'Slaton Jones'),
  (number: '17', name: 'Kelemente Pio'),
  (number: '18', name: 'Javen Aalberg'),
  (number: '20', name: 'Max Mebius'),
  (number: '23', name: 'Easton Scheidt'),
  (number: '24', name: 'Talec Schlimgen'),
  (number: '25', name: 'Jack Fredrickson'),
  (number: '26', name: 'Ian Farah'),
  (number: '27', name: 'Corbin Hage'),
  (number: '28', name: 'Teige Hilsenroth'),
  (number: '29', name: 'Keanu Lee'),
  (number: '30', name: 'Beau Bailey'),
  (number: '31', name: 'Nolan Dexter'),
  (number: '32', name: 'Cole Houser'),
  (number: '34', name: 'Bennett Kerr'),
  (number: '35', name: 'Christopher Roose'),
  (number: '40', name: 'Jakob Pitzl'),
  (number: '42', name: 'Thomas Theobald'),
  (number: '44', name: 'Zack Schuler'),
  (number: '45', name: 'Liam Fitzpatrick'),
  (number: '50', name: 'Jason Trooien'),
  (number: '51', name: 'Sam Paasch'),
  (number: '52', name: 'Sam Donohoe'),
  (number: '54', name: 'Kayen Hammer'),
  (number: '55', name: 'Dawson Buller'),
  (number: '56', name: 'Gavin Boyle'),
  (number: '57', name: 'Hudson Muller'),
  (number: '58', name: 'Ben Astrup'),
  (number: '59', name: 'Bryson Wittry'),
  (number: '60', name: 'Dillon Fitzgerald'),
  (number: '65', name: 'Max Vortherms'),
  (number: '66', name: 'Chase Haffeman'),
  (number: '67', name: 'Emmett Flitz'),
  (number: '75', name: 'David Malonga'),
  (number: '77', name: 'Cooper Dowling'),
  (number: '84', name: 'Weston Satter'),
];

bool isWashingtonName(String name) =>
    RegExp(r'wash?ington', caseSensitive: false).hasMatch(name);

bool isOgormanName(String name) =>
    RegExp(r"o['’]?gorman", caseSensitive: false).hasMatch(name);

Book withOgorman(Book book) {
  final teams = [for (final team in book.teams) team.copyWith()];
  var index = teams.indexWhere((team) => isOgormanName(team.name));
  if (index < 0) index = teams.indexWhere((team) => team.name == 'Home');
  if (index < 0) index = teams.isEmpty ? -1 : 0;
  if (index < 0) return book;
  final team = teams[index].copyWith(name: ogormanName);
  teams[index] = team;
  return book.copyWith(
    teams: teams,
    players: _mergeRoster(book.players, team.id, ogormanRoster, 'ogorman'),
  );
}

Book withWashington(Book book) {
  final teams = [for (final team in book.teams) team.copyWith()];
  var index = teams.indexWhere((team) => isWashingtonName(team.name));
  if (index < 0) {
    index = teams.indexWhere(
      (team) => !isOgormanName(team.name) && team.name == 'Away',
    );
  }
  if (index < 0) {
    index = teams.indexWhere((team) => !isOgormanName(team.name));
  }
  if (index < 0 && teams.length > 1) index = 1;
  if (index < 0) return book;
  final team = teams[index].copyWith(name: washingtonName);
  teams[index] = team;
  return book.copyWith(
    teams: teams,
    players: _mergeRoster(book.players, team.id, washingtonRoster, 'washington'),
  );
}

Book withRosters(Book book) => withWashington(withOgorman(book));

Book emptyBook() => withRosters(
      const Book(
        teams: [
          Team(id: 'home', name: 'Home'),
          Team(id: 'away', name: 'Away'),
        ],
        players: [],
        plays: [],
      ),
    );

List<Player> _mergeRoster(
  List<Player> players,
  String teamId,
  List<({String number, String name})> roster,
  String prefix,
) {
  final next = [for (final player in players) player.copyWith()];
  for (final row in roster) {
    final existing = next.indexWhere(
      (player) =>
          player.teamId == teamId && normNum(player.number) == row.number,
    );
    if (existing >= 0) {
      next[existing] = next[existing].copyWith(
        name: row.name,
        number: row.number,
      );
    } else {
      next.add(
        Player(
          id: '$prefix-${row.number}',
          teamId: teamId,
          number: row.number,
          name: row.name,
        ),
      );
    }
  }
  return next;
}
