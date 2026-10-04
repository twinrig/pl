import { readFileSync } from "node:fs";
import { OGORMAN_ROSTER } from "../src/lib/ogorman";
import { gameStats, type LoggedPlay, type PlaySnapshot, type StatsBook } from "../src/lib/stats";
import { WASHINGTON_ROSTER } from "../src/lib/washington";
import type { PlayType, ResultKind } from "../src/lib/plays";

const RESULT: Record<string, ResultKind> = {
  Tackled: "tackled",
  Incomplete: "incomplete",
  Touchdown: "touchdown",
  "Out of bounds": "out-of-bounds",
  Downed: "downed",
};

const RETURN_SCORE = new Set<PlayType>(["Kickoff", "Punt", "Interception", "Fumble", "Safety"]);

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") cell += char;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((item) => item.some((value) => value.trim()));
}

function jersey(label: string): string {
  const match = label.trim().match(/\((\d+)\)$/);
  if (match) return String(Number(match[1]));
  return /^\d+$/.test(label.trim()) ? String(Number(label.trim())) : "";
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

const home = "home";
const away = "away";
const players = [
  ...OGORMAN_ROSTER.map((player) => ({
    id: `ogorman-${player.number}`,
    teamId: home,
    number: player.number,
    name: player.name,
  })),
  ...WASHINGTON_ROSTER.map((player) => ({
    id: `washington-${player.number}`,
    teamId: away,
    number: player.number,
    name: player.name,
  })),
];

const byName = new Map<string, string>();
for (const player of players) {
  byName.set(`${player.name.toLowerCase()}|${player.number}`, player.teamId);
}

function teamOf(label: string): string {
  const number = jersey(label);
  const name = label.replace(/\s*\(\d+\)$/, "").trim().toLowerCase();
  return byName.get(`${name}|${number}`) ?? "";
}

function spot(log: string, pattern: RegExp): { teamId: string; yard: string } | null {
  const match = log.match(pattern);
  if (!match) return null;
  const teamId = match[1] === "Washington" ? away : home;
  return { teamId, yard: match[2] };
}

const text = readFileSync(new URL("../attachments/OG_Wahsington.csv", import.meta.url), "utf8");
const [header, ...records] = parseCsv(text);
if (!header || header[0] !== "Quarter") throw new Error("Unexpected CSV header");

const plays: LoggedPlay[] = [];
const skipped: string[] = [];
for (const record of records) {
  const [quarter, down, distance, play, result, start, targets, tacklers, log] = record;
  if (!log || log.startsWith("New Game") || log.startsWith("Penalty") || !play) {
    skipped.push(log);
    continue;
  }
  const type = play as PlayType;
  const kind = RESULT[result] ?? "tackled";
  const offenseId = teamOf(start) || home;
  const startSpot =
    spot(log, /(?:Ball on|Kick from) the (O'Gorman|Washington) (\d+)/) ?? {
      teamId: offenseId,
      yard: "",
    };
  const endSpot = spot(
    log,
    /(?:tackled|downed|out of bounds|intercepted by .+|recovered by .+) on the (O'Gorman|Washington) (\d+)/,
  );
  const listed = splitList(targets);
  const tagged = splitList(tacklers);
  const snapshot: PlaySnapshot = {
    quarter,
    down,
    distance,
    offenseId,
    ballTeamId: endSpot?.teamId || startSpot.teamId,
    ballYard: endSpot?.yard || "",
    snapTeamId: startSpot.teamId,
    snapYard: startSpot.yard,
    type,
    result: kind,
    scoreTime: log.match(/at (\d{0,2}:?\d{2})/)?.[1] ?? "",
    possession: RETURN_SCORE.has(type),
    starter: jersey(start),
    target1: jersey(listed[0] ?? ""),
    target2: jersey(listed[1] ?? ""),
    tackler1: jersey(tagged[0] ?? ""),
    tackler2: jersey(tagged[1] ?? ""),
    tackler3: jersey(tagged[2] ?? ""),
  };
  plays.push({
    id: String(plays.length + 1),
    quarter,
    down,
    distance,
    sentence: log,
    snapshot,
  });
}

const book: StatsBook = {
  teams: [
    { id: home, name: "O'Gorman" },
    { id: away, name: "Washington" },
  ],
  players,
  plays,
};

const stats = gameStats(book);
console.log(`plays ${plays.length}, skipped ${skipped.length}`);
for (const team of stats) {
  console.log(`\n${team.name} ${team.score}  pass ${team.passYds}  rush ${team.rushYds}`);
  for (const player of team.players) {
    const bits = [
      player.att ? `${player.cmp}-${player.att} ${player.passYds} pass` : "",
      player.rush ? `${player.rush} car ${player.rushYds} rush` : "",
      player.rec ? `${player.rec} rec ${player.recYds}` : "",
      player.td ? `${player.td} TD` : "",
      player.tackles ? `${player.tackles} tkl` : "",
      player.sacks ? `${player.sacks} sack` : "",
      player.int ? `${player.int} INT` : "",
      player.kickoffs ? `${player.kickoffs} KO` : "",
      player.punts ? `${player.punts} punt` : "",
      player.xpAtt ? `XP ${player.xp}-${player.xpAtt}` : "",
      player.fgAtt ? `FG ${player.fg}-${player.fgAtt}` : "",
    ].filter(Boolean);
    if (bits.length) console.log(`  ${player.label}: ${bits.join(", ")}`);
  }
}

const scores = plays
  .filter((play) => play.snapshot && (play.snapshot.result === "touchdown" || play.snapshot.type === "Extra point"))
  .map((play) => play.sentence);
console.log("\nScores:");
for (const line of scores) console.log(`  ${line}`);
