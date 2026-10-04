import { normNum, type Player, type Team } from "@/lib/plays";

export const WASHINGTON_NAME = "Washington";

export const WASHINGTON_ROSTER: { number: string; name: string }[] = [
  { number: "0", name: "Justin Rodriguez" },
  { number: "1", name: "Samuel Bowen" },
  { number: "3", name: "Kobe Gully" },
  { number: "4", name: "Kaden Carroll" },
  { number: "5", name: "Darius Harrison" },
  { number: "6", name: "Bronson Schramm" },
  { number: "7", name: "Luis Vazquez" },
  { number: "8", name: "Godwin Zephania" },
  { number: "9", name: "Chase Comp" },
  { number: "10", name: "Miles Smith" },
  { number: "11", name: "Dezman Wilka" },
  { number: "12", name: "Ryder Dobberpuhl" },
  { number: "13", name: "Graham Frederiksen" },
  { number: "14", name: "Kacyn Larson" },
  { number: "15", name: "Caden Sporrer" },
  { number: "16", name: "Rylan Kvistero" },
  { number: "17", name: "Broxsen McVay" },
  { number: "18", name: "Isayah Everette" },
  { number: "19", name: "Carter Wentzel" },
  { number: "21", name: "Brett Pankonin" },
  { number: "22", name: "Caeden Consoer" },
  { number: "23", name: "Cole Hauser" },
  { number: "24", name: "Biniam Mekuria" },
  { number: "25", name: "Elijah McMahan" },
  { number: "26", name: "Ojeir Agwa" },
  { number: "27", name: "Masen Jennings" },
  { number: "28", name: "Jordan Patterson" },
  { number: "29", name: "Erdi Maliqi" },
  { number: "30", name: "Kaden Hill" },
  { number: "31", name: "Gavin Knopf" },
  { number: "32", name: "Solomon Gayflor" },
  { number: "33", name: "Prince Gayetaye" },
  { number: "34", name: "Kingston Fabian" },
  { number: "35", name: "Charles McCloskey" },
  { number: "37", name: "Devin Walker" },
  { number: "40", name: "Carter Jongejeugd" },
  { number: "41", name: "Thomas Richardson" },
  { number: "42", name: "Eddie Morataya Lopez" },
  { number: "43", name: "Jacob Richardson" },
  { number: "44", name: "Kayavanh Khao-on" },
  { number: "45", name: "Collin Arens" },
  { number: "46", name: "Richard Ryken" },
  { number: "47", name: "Gavin Young" },
  { number: "48", name: "Elija Van Vooren" },
  { number: "50", name: "Zayden Lee" },
  { number: "51", name: "Matthew Melton" },
  { number: "52", name: "Stephen Tran" },
  { number: "53", name: "Madden Burkhardt" },
  { number: "54", name: "Lincoln Damm" },
  { number: "55", name: "Eli Boyd" },
  { number: "57", name: "Blake Knoff" },
  { number: "58", name: "Hayes Petersen" },
  { number: "59", name: "Michael Hoefert" },
  { number: "61", name: "Cole Malchow" },
  { number: "63", name: "Kenan Alberts" },
  { number: "64", name: "Kellby Haverhals" },
  { number: "65", name: "Chance Lauck" },
  { number: "67", name: "Mark Jauregui" },
  { number: "70", name: "Kevin Knoff" },
  { number: "71", name: "Parker Muth" },
  { number: "72", name: "Edward Petka" },
  { number: "74", name: "Noah Miller" },
  { number: "75", name: "Hudson Tirevold" },
  { number: "77", name: "Dhieu Gak" },
  { number: "78", name: "Kiir Mach" },
  { number: "79", name: "Cale Farmer" },
  { number: "80", name: "Machar Ijong" },
  { number: "82", name: "Aden Sambido" },
  { number: "84", name: "Zaki Dillard" },
  { number: "85", name: "Kalen Kvistero" },
  { number: "87", name: "Marcus Melton" },
  { number: "88", name: "Joshua Battle" },
];

function isWashington(name: string): boolean {
  return /wash?ington/i.test(name);
}

export function withWashington<T extends { teams: Team[]; players: Player[] }>(book: T): T {
  const teams = book.teams.map((team) => ({ ...team }));
  const ogorman = teams.find((team) => /o['’]?gorman/i.test(team.name));
  let team =
    teams.find((item) => isWashington(item.name)) ??
    teams.find((item) => item !== ogorman && item.name === "Away") ??
    teams.find((item) => item !== ogorman) ??
    teams[1];
  if (!team) return book;
  team.name = WASHINGTON_NAME;

  const players = book.players.map((player) => ({ ...player }));
  for (const row of WASHINGTON_ROSTER) {
    const existing = players.find(
      (player) => player.teamId === team.id && normNum(player.number) === row.number,
    );
    if (existing) {
      existing.name = row.name;
      existing.number = row.number;
    } else {
      players.push({
        id: `washington-${row.number}`,
        teamId: team.id,
        number: row.number,
        name: row.name,
      });
    }
  }

  return { ...book, teams, players };
}
