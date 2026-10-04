import { normNum, type Player, type Team } from "@/lib/plays";

export const OGORMAN_NAME = "O'Gorman";

export const OGORMAN_ROSTER: { number: string; name: string }[] = [
  { number: "1", name: "Braylon Treasure" },
  { number: "2", name: "Carter Majeres" },
  { number: "3", name: "Chace Hermanson" },
  { number: "4", name: "Alex Christian" },
  { number: "5", name: "Brady Majeres" },
  { number: "6", name: "Tanner Charron" },
  { number: "7", name: "Rylan Cody" },
  { number: "8", name: "Zach Erickson" },
  { number: "9", name: "Drake Severson" },
  { number: "10", name: "Aaron Stoll" },
  { number: "11", name: "Benny Willers" },
  { number: "12", name: "Remington Jones" },
  { number: "13", name: "Oliver Klinkhammer" },
  { number: "14", name: "Isaac Myers" },
  { number: "15", name: "Abe Struck" },
  { number: "16", name: "Slaton Jones" },
  { number: "17", name: "Kelemente Pio" },
  { number: "18", name: "Javen Aalberg" },
  { number: "20", name: "Max Mebius" },
  { number: "23", name: "Easton Scheidt" },
  { number: "24", name: "Talec Schlimgen" },
  { number: "25", name: "Jack Fredrickson" },
  { number: "26", name: "Ian Farah" },
  { number: "27", name: "Corbin Hage" },
  { number: "28", name: "Teige Hilsenroth" },
  { number: "29", name: "Keanu Lee" },
  { number: "30", name: "Beau Bailey" },
  { number: "31", name: "Nolan Dexter" },
  { number: "32", name: "Cole Houser" },
  { number: "34", name: "Bennett Kerr" },
  { number: "35", name: "Christopher Roose" },
  { number: "40", name: "Jakob Pitzl" },
  { number: "42", name: "Thomas Theobald" },
  { number: "44", name: "Zack Schuler" },
  { number: "45", name: "Liam Fitzpatrick" },
  { number: "50", name: "Jason Trooien" },
  { number: "51", name: "Sam Paasch" },
  { number: "52", name: "Sam Donohoe" },
  { number: "54", name: "Kayen Hammer" },
  { number: "55", name: "Dawson Buller" },
  { number: "56", name: "Gavin Boyle" },
  { number: "57", name: "Hudson Muller" },
  { number: "58", name: "Ben Astrup" },
  { number: "59", name: "Bryson Wittry" },
  { number: "60", name: "Dillon Fitzgerald" },
  { number: "65", name: "Max Vortherms" },
  { number: "66", name: "Chase Haffeman" },
  { number: "67", name: "Emmett Flitz" },
  { number: "75", name: "David Malonga" },
  { number: "77", name: "Cooper Dowling" },
  { number: "84", name: "Weston Satter" },
];

function isOgorman(name: string): boolean {
  return /o['’]?gorman/i.test(name);
}

export function withOgorman<T extends { teams: Team[]; players: Player[] }>(book: T): T {
  const teams = book.teams.map((team) => ({ ...team }));
  let team =
    teams.find((item) => isOgorman(item.name)) ??
    teams.find((item) => item.name === "Home") ??
    teams[0];
  if (!team) return book;
  team.name = OGORMAN_NAME;

  const players = book.players.map((player) => ({ ...player }));
  for (const row of OGORMAN_ROSTER) {
    const existing = players.find(
      (player) => player.teamId === team.id && normNum(player.number) === row.number,
    );
    if (existing) {
      existing.name = row.name;
      existing.number = row.number;
    } else {
      players.push({
        id: `ogorman-${row.number}`,
        teamId: team.id,
        number: row.number,
        name: row.name,
      });
    }
  }

  return { ...book, teams, players };
}
