import {
  labelFor,
  yardsGained,
  type Player,
  type PlayType,
  type ResultKind,
  type Team,
} from "@/lib/plays";

export type PlaySnapshot = {
  quarter: string;
  down: string;
  distance: string;
  offenseId: string;
  ballTeamId: string;
  ballYard: string;
  snapTeamId: string;
  snapYard: string;
  type: PlayType;
  result: ResultKind;
  scoreTime: string;
  possession: boolean;
  starter: string;
  target1: string;
  target2: string;
  tackler1: string;
  tackler2: string;
  tackler3: string;
  tryPoints?: 1 | 2;
};

export type LoggedPlay = {
  id: string;
  quarter: string;
  clock?: string;
  down: string;
  distance: string;
  sentence: string;
  snapshot?: PlaySnapshot;
};

export type StatsBook = {
  teams: Team[];
  players: Player[];
  plays: LoggedPlay[];
};

export type StatLine = {
  label: string;
  cmp: number;
  att: number;
  passYds: number;
  rush: number;
  rushYds: number;
  rec: number;
  recYds: number;
  td: number;
  tackles: number;
  sacks: number;
  int: number;
  punts: number;
  kickoffs: number;
  fg: number;
  fgAtt: number;
  xp: number;
  xpAtt: number;
};

export type TeamStats = {
  id: string;
  name: string;
  score: number;
  passYds: number;
  rushYds: number;
  players: StatLine[];
};

function kickingPlay(type: string): boolean {
  return type === "Kickoff" || type === "Punt";
}

function defenseOf(book: StatsBook, offenseId: string): string {
  return book.teams.find((team) => team.id !== offenseId)?.id ?? offenseId;
}

function isPlayerLabel(label: string): boolean {
  const name = label.trim();
  return /^\d+$/.test(name) || /^.+ \(\d+\)$/.test(name);
}

export function pointsOf(
  play: PlaySnapshot,
): { side: "offense" | "defense"; points: number } | null {
  if (play.type === "Safety" || play.result === "safety") return { side: "defense", points: 2 };
  if (play.type === "Extra point") {
    if (play.result === "incomplete") return null;
    return { side: "offense", points: play.tryPoints === 2 ? 2 : 1 };
  }
  if (play.type === "Field goal") {
    return play.result === "incomplete" ? null : { side: "offense", points: 3 };
  }
  if (play.result === "touchdown") {
    const returnScore =
      play.possession ||
      play.type === "Kickoff" ||
      play.type === "Punt" ||
      play.type === "Interception";
    return { side: returnScore ? "defense" : "offense", points: 6 };
  }
  return null;
}

export function teamScores(book: StatsBook): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const team of book.teams) totals[team.id] = 0;
  for (const play of book.plays) {
    const snap = play.snapshot;
    if (!snap) continue;
    const scored = pointsOf(snap);
    if (!scored) continue;
    const defense = defenseOf(book, snap.offenseId);
    const id = scored.side === "defense" ? defense : snap.offenseId;
    totals[id] = (totals[id] ?? 0) + scored.points;
  }
  return totals;
}

function emptyLine(label: string): StatLine {
  return {
    label,
    cmp: 0,
    att: 0,
    passYds: 0,
    rush: 0,
    rushYds: 0,
    rec: 0,
    recYds: 0,
    td: 0,
    tackles: 0,
    sacks: 0,
    int: 0,
    punts: 0,
    kickoffs: 0,
    fg: 0,
    fgAtt: 0,
    xp: 0,
    xpAtt: 0,
  };
}

function playYards(snap: PlaySnapshot): number {
  return (
    yardsGained({
      offenseId: snap.offenseId,
      ballTeamId: snap.snapTeamId,
      ballYard: snap.snapYard,
      endTeamId: snap.ballTeamId,
      endYard: snap.ballYard,
    }) ?? 0
  );
}

export function gameStats(book: StatsBook): TeamStats[] {
  const scores = teamScores(book);
  const maps = new Map<string, Map<string, StatLine>>();
  const teamPass = new Map<string, number>();
  const teamRush = new Map<string, number>();
  for (const team of book.teams) {
    maps.set(team.id, new Map());
    teamPass.set(team.id, 0);
    teamRush.set(team.id, 0);
  }

  const row = (teamId: string, label: string) => {
    const name = label.trim();
    if (!isPlayerLabel(name) || !maps.has(teamId)) return null;
    const map = maps.get(teamId)!;
    const existing = map.get(name);
    if (existing) return existing;
    const created = emptyLine(name);
    map.set(name, created);
    return created;
  };

  for (const play of book.plays) {
    const snap = play.snapshot;
    if (!snap) continue;
    const defense = defenseOf(book, snap.offenseId);
    const yards = playYards(snap);
    const kicking = kickingPlay(snap.type);
    const skillTeam = kicking ? defense : snap.offenseId;
    const tackleTeam = kicking ? snap.offenseId : defense;
    const starter = labelFor(snap.starter, book.players, snap.offenseId);
    const catcher = [snap.target1, snap.target2]
      .map((number) => labelFor(number, book.players, skillTeam))
      .find(Boolean);
    const tacklers = [snap.tackler1, snap.tackler2, snap.tackler3]
      .map((number) => labelFor(number, book.players, tackleTeam, kicking))
      .filter(Boolean);
    const scored = snap.result === "touchdown";
    const sack = snap.type === "Sack" || snap.result === "sack";
    const intercepted = snap.type === "Interception" || snap.result === "interception";
    const kneel = snap.type === "Kneel" || snap.result === "kneel";

    if (sack) {
      const quarterback = row(snap.offenseId, starter);
      if (quarterback) {
        quarterback.rush += 1;
        quarterback.rushYds += yards;
        teamRush.set(snap.offenseId, (teamRush.get(snap.offenseId) ?? 0) + yards);
      }
      for (const name of tacklers) {
        const tackler = row(tackleTeam, name);
        if (!tackler) continue;
        tackler.sacks += 1;
        tackler.tackles += 1;
      }
    } else if (intercepted) {
      const passer = row(snap.offenseId, starter);
      if (passer) {
        passer.att += 1;
        passer.int += 1;
      }
      for (const name of tacklers) {
        const tackler = row(tackleTeam, name);
        if (!tackler) continue;
        tackler.int += 1;
        if (scored) tackler.td += 1;
      }
    } else if (kneel || snap.type === "Run") {
      const runner = row(snap.offenseId, starter);
      if (runner && snap.result !== "fumble" && snap.result !== "fumble-kept" && snap.result !== "safety") {
        runner.rush += 1;
        runner.rushYds += yards;
        teamRush.set(snap.offenseId, (teamRush.get(snap.offenseId) ?? 0) + yards);
        if (scored && !snap.possession) runner.td += 1;
      }
    } else if (snap.type === "Pass") {
      const passer = row(snap.offenseId, starter);
      if (passer && snap.result !== "fumble" && snap.result !== "fumble-kept" && snap.result !== "safety") {
        passer.att += 1;
        if (snap.result !== "incomplete") {
          passer.cmp += 1;
          passer.passYds += yards;
          teamPass.set(snap.offenseId, (teamPass.get(snap.offenseId) ?? 0) + yards);
          if (scored && !snap.possession) passer.td += 1;
        }
      }
      if (
        snap.result !== "incomplete" &&
        snap.result !== "fumble" &&
        snap.result !== "fumble-kept" &&
        snap.result !== "safety" &&
        catcher
      ) {
        const receiver = row(skillTeam, catcher);
        if (receiver) {
          receiver.rec += 1;
          receiver.recYds += yards;
          if (scored && !snap.possession) receiver.td += 1;
        }
      }
    } else if (snap.type === "Punt") {
      const punter = row(snap.offenseId, starter);
      if (punter) punter.punts += 1;
      if (scored && catcher) {
        const returner = row(skillTeam, catcher);
        if (returner) returner.td += 1;
      }
    } else if (snap.type === "Kickoff") {
      const kicker = row(snap.offenseId, starter);
      if (kicker) kicker.kickoffs += 1;
      if (scored && catcher) {
        const returner = row(skillTeam, catcher);
        if (returner) returner.td += 1;
      }
    } else if (snap.type === "Field goal") {
      const kicker = row(snap.offenseId, starter);
      if (kicker) {
        kicker.fgAtt += 1;
        if (snap.result !== "incomplete") kicker.fg += 1;
      }
    } else if (snap.type === "Extra point") {
      if (snap.tryPoints !== 2) {
        const kicker = row(snap.offenseId, starter);
        if (kicker) {
          kicker.xpAtt += 1;
          if (snap.result !== "incomplete") kicker.xp += 1;
        }
      }
    }

    if (!sack && !intercepted && snap.result !== "fumble" && snap.result !== "fumble-kept" && snap.result === "tackled") {
      for (const name of tacklers) {
        const tackler = row(tackleTeam, name);
        if (tackler) tackler.tackles += 1;
      }
    }
  }

  return book.teams.map((team) => ({
    id: team.id,
    name: team.name,
    score: scores[team.id] ?? 0,
    passYds: teamPass.get(team.id) ?? 0,
    rushYds: teamRush.get(team.id) ?? 0,
    players: [...(maps.get(team.id)?.values() ?? [])].sort((a, b) =>
      a.label.localeCompare(b.label),
    ),
  }));
}
