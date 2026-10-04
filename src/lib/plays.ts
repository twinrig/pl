export type ResultKind =
  | "tackled"
  | "incomplete"
  | "touchdown"
  | "downed"
  | "out-of-bounds"
  | "sack"
  | "interception"
  | "fumble"
  | "safety"
  | "kneel"
  | "touchback"
  | "fair-catch"
  | "fumble-kept";

export type Player = {
  id: string;
  teamId: string;
  number: string;
  name: string;
  position?: string;
};

export type Team = { id: string; name: string };

export const PLAY_TYPES = [
  "Pass",
  "Run",
  "Sack",
  "Interception",
  "Fumble",
  "Punt",
  "Kickoff",
  "Field goal",
  "Extra point",
  "Safety",
  "Penalty",
  "Kneel",
] as const;

export type PlayType = (typeof PLAY_TYPES)[number];

export function normNum(value: string): string {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return String(Number(trimmed));
  return trimmed;
}

export function formatAthlete(number: string, name?: string | null): string {
  const n = normNum(number);
  if (!n) return "";
  const label = name?.trim();
  if (label) return `${label} (${n})`;
  return n;
}

export function lookupName(
  number: string,
  players: Player[],
  preferTeamId?: string,
  strict = false,
): string | null {
  const n = normNum(number);
  if (!n) return null;
  const hits = players.filter((p) => normNum(p.number) === n);
  const hit = strict
    ? hits.find((p) => p.teamId === preferTeamId)
    : (hits.find((p) => p.teamId === preferTeamId) ?? hits[0]);
  return hit?.name?.trim() || null;
}

export function labelFor(
  number: string,
  players: Player[],
  preferTeamId?: string,
  strict = false,
): string {
  const n = number.trim();
  if (!n) return "";
  return formatAthlete(n, lookupName(n, players, preferTeamId, strict));
}

export function spot(team: string, yard: string): string {
  const side = team.trim();
  const line = yard.trim();
  if (side && line) return `${side} ${line}`;
  return side || line;
}

function joinAnd(parts: string[]): string {
  const list = parts.filter(Boolean);
  if (list.length <= 1) return list[0] ?? "";
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}

function joinComma(parts: string[]): string {
  return parts.filter(Boolean).join(",");
}

export type SentenceInput = {
  ballTeam: string;
  ballYard: string;
  endTeam: string;
  endYard: string;
  type: string;
  result: ResultKind;
  starter: string;
  targets: string[];
  tacklers: string[];
  scoreTime?: string;
  tryPoints?: 1 | 2;
};

export function buildSentence(input: SentenceInput): string {
  const ball = spot(input.ballTeam, input.ballYard);
  const end = spot(input.endTeam, input.endYard);
  const lead =
    input.type === "Kickoff" ? "" : ball ? `Ball on the ${ball}.` : "Ball snapped.";
  const starter = input.starter.trim();
  const toClause = joinAnd(input.targets);
  const tacklers = joinComma(input.tacklers);
  const from = starter ? ` from ${starter}` : "";
  const to = toClause ? ` to ${toClause}` : "";
  const by = tacklers ? ` by ${tacklers}` : "";

  let action = "";
  const sack = input.result === "sack" || input.type === "Sack";
  const interception = input.result === "interception" || input.type === "Interception";
  const fumble =
    input.result === "fumble" || input.result === "fumble-kept" || input.type === "Fumble";
  const safety = input.result === "safety" || input.type === "Safety";
  const kneel = input.result === "kneel" || input.type === "Kneel";

  if (sack) {
    action = starter ? `Sack of ${starter}` : "Sack";
    action += by;
    if (end) action += ` on the ${end}`;
  } else if (interception) {
    action = `Pass${from}${to} intercepted${by}`;
    if (end) action += ` on the ${end}`;
  } else if (fumble) {
    action = starter ? `Fumble by ${starter}` : "Fumble";
    if (end) action += ` on the ${end}`;
    if (tacklers) action += ` recovered by ${tacklers}`;
    else if (input.result === "fumble-kept") action += " recovered";
  } else if (safety) {
    action = starter ? `Safety by ${starter}` : "Safety";
    if (end) action += ` on the ${end}`;
  } else if (kneel) {
    action = starter ? `Kneel by ${starter}` : "Kneel";
    if (end) action += ` on the ${end}`;
  } else if (input.type === "Pass" && input.result === "incomplete") {
    action = `Incomplete pass${from}${to}`;
  } else if (input.type === "Pass") {
    action = `Pass${from}${to}`;
    if (input.result === "touchdown") action += " for a touchdown";
    else if (input.result === "out-of-bounds") {
      action += end ? ` out of bounds on the ${end}` : " out of bounds";
      action += by;
    } else if (input.result === "downed") {
      action += end ? ` downed on the ${end}` : " downed";
      action += by;
    } else {
      action += end ? ` tackled on the ${end}` : " tackled";
      action += by;
    }
  } else if (input.type === "Run") {
    action = starter ? `Run by ${starter}` : "Run";
    if (to) action += to;
    if (input.result === "touchdown") action += " for a touchdown";
    else if (input.result === "out-of-bounds") {
      action += end ? ` out of bounds on the ${end}` : " out of bounds";
      action += by;
    } else if (input.result === "incomplete") action += " stopped";
    else if (input.result === "downed") {
      action += end ? ` downed on the ${end}` : "";
      action += by;
    } else {
      action += end ? ` tackled on the ${end}` : " tackled";
      action += by;
    }
  } else if (input.type === "Punt") {
    const receivers = joinAnd(input.targets);
    const receiverWord = input.targets.filter(Boolean).length > 1 ? "receivers" : "receiver";
    action = starter ? `Punt from punter ${starter}` : "Punt";
    if (receivers) action += ` to ${receiverWord} ${receivers}`;
    if (input.result === "touchdown") action += " for a touchdown";
    else if (input.result === "touchback") action += " for a touchback";
    else if (input.result === "fair-catch") {
      action += end ? ` fair catch on the ${end}` : " fair catch";
    } else if (input.result === "out-of-bounds") {
      action += end ? ` out of bounds on the ${end}` : " out of bounds";
    } else if (input.result === "downed") {
      action += end ? ` downed on the ${end}` : " downed";
      action += by;
    } else {
      action += end ? ` tackled on the ${end}` : tacklers ? " tackled" : "";
      action += by;
    }
  } else if (input.type === "Kickoff") {
    const receivers = joinAnd(input.targets);
    const receiverWord = input.targets.filter(Boolean).length > 1 ? "receivers" : "receiver";
    const fromSpot = spot(input.ballTeam, input.ballYard);
    action = fromSpot ? `Kick from the ${fromSpot}` : "Kick";
    if (starter) action += ` by kicker ${starter}`;
    if (receivers) action += ` to ${receiverWord} ${receivers}`;
    if (input.result === "touchdown") action += " for a touchdown";
    else if (input.result === "touchback") action += " for a touchback";
    else if (input.result === "fair-catch") {
      action += end ? ` fair catch on the ${end}` : " fair catch";
    } else if (input.result === "out-of-bounds") {
      action += end ? ` out of bounds on the ${end}` : " out of bounds";
    } else if (input.result === "downed") {
      action += end ? ` downed on the ${end}` : " downed";
      action += by;
    } else {
      action += end ? ` tackled on the ${end}` : tacklers ? " tackled" : "";
      action += by;
    }
  } else if (input.type === "Field goal") {
    action = starter ? `Field goal by ${starter}` : "Field goal";
    if (end) action += ` from the ${end}`;
    if (input.result === "incomplete") action += " no good";
  } else if (input.type === "Extra point") {
    const two = input.tryPoints === 2;
    action = two
      ? `Two-point try${starter ? ` by ${starter}` : ""}${to} from the 2`
      : starter
        ? `Extra point by ${starter}`
        : "Extra point";
    action += input.result === "incomplete" ? " no good" : " good";
  } else if (input.type === "Penalty") {
    action = starter ? `Penalty on ${starter}` : "Penalty";
    if (end) action += ` enforced to the ${end}`;
  } else {
    action = `${input.type}${starter ? ` by ${starter}` : ""}${to}`;
    if (end) action += ` on the ${end}`;
    action += by;
  }

  if (input.result === "out-of-bounds" && !/out of bounds/.test(action)) {
    action += " out of bounds";
  }

  if (input.result === "touchdown") {
    if (!/touchdown/.test(action)) action += " for a touchdown";
  }

  const time = input.scoreTime?.trim();
  if (time) action += ` at ${time}`;

  return `${lead} ${action}.`.replace(/\s+/g, " ").trim();
}

export function ordinalDown(down: string): string {
  if (down === "1") return "1st";
  if (down === "2") return "2nd";
  if (down === "3") return "3rd";
  if (down === "4") return "4th";
  return down;
}

export const PENALTIES = [
  { id: "false-start", label: "False start", yards: 5, replay: true },
  { id: "offside", label: "Offside", yards: 5, replay: true },
  { id: "encroachment", label: "Encroachment", yards: 5, replay: true },
  { id: "delay", label: "Delay of game", yards: 5, replay: true },
  { id: "illegal-procedure", label: "Illegal procedure", yards: 5, replay: true },
  { id: "illegal-formation", label: "Illegal formation", yards: 5, replay: true },
  { id: "illegal-motion", label: "Illegal motion", yards: 5, replay: true },
  { id: "illegal-shift", label: "Illegal shift", yards: 5, replay: true },
  { id: "ineligible", label: "Ineligible downfield", yards: 5, replay: true },
  { id: "too-many", label: "Too many players", yards: 5, replay: true },
  { id: "holding", label: "Holding", yards: 10, replay: true },
  { id: "defensive-holding", label: "Defensive holding", yards: 10, replay: false, autoFirst: true },
  { id: "block-back", label: "Block in the back", yards: 10, replay: true },
  { id: "illegal-block", label: "Illegal block", yards: 10, replay: true },
  { id: "pass-interference", label: "Pass interference", yards: 15, replay: false, autoFirst: true },
  { id: "face-mask", label: "Face mask", yards: 15, replay: false, autoFirst: true },
  { id: "roughing-passer", label: "Roughing the passer", yards: 15, replay: false, autoFirst: true },
  { id: "roughing-kicker", label: "Roughing the kicker", yards: 15, replay: false, autoFirst: true },
  { id: "kick-catch", label: "Kick catch interference", yards: 15, replay: false, autoFirst: true },
  { id: "roughness", label: "Unnecessary roughness", yards: 15, replay: false, autoFirst: true },
  { id: "personal", label: "Personal foul", yards: 15, replay: false, autoFirst: true },
  { id: "unsportsmanlike", label: "Unsportsmanlike conduct", yards: 15, replay: true },
  { id: "targeting", label: "Targeting", yards: 15, replay: false, autoFirst: true },
] as const;

const COMMON_PENALTY_IDS = [
  "false-start",
  "holding",
  "offside",
  "encroachment",
  "defensive-holding",
  "pass-interference",
  "face-mask",
  "delay",
  "personal",
  "roughness",
] as const;

export function penaltyGroups(): {
  common: (typeof PENALTIES)[number][];
  rest: (typeof PENALTIES)[number][];
} {
  const byId = new Map(PENALTIES.map((penalty) => [penalty.id, penalty]));
  const common = COMMON_PENALTY_IDS.map((id) => byId.get(id)).filter(
    (penalty): penalty is (typeof PENALTIES)[number] => Boolean(penalty),
  );
  const commonIds = new Set<string>(COMMON_PENALTY_IDS);
  const rest = PENALTIES.filter((penalty) => !commonIds.has(penalty.id))
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label));
  return { common, rest };
}

export function enforceSpot(progress: number, yards: number, againstOffense: boolean): number {
  if (againstOffense) {
    if (yards >= progress) return Math.max(1, Math.round(progress / 2));
    return Math.max(1, progress - yards);
  }
  const room = 100 - progress;
  if (yards >= room) return Math.min(99, Math.round(progress + room / 2));
  return Math.min(99, progress + yards);
}

export function yardsGained(input: {
  offenseId: string;
  ballTeamId: string;
  ballYard: string;
  endTeamId: string;
  endYard: string;
}): number | null {
  if (!input.endYard.trim() || !input.ballYard.trim()) return null;
  const start = Number(input.ballYard);
  const end = Number(input.endYard);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  const fromOwnGoal = (sideId: string, yard: number) =>
    sideId === input.offenseId ? yard : 100 - yard;
  return fromOwnGoal(input.endTeamId, end) - fromOwnGoal(input.ballTeamId, start);
}

export function progressFromGoal(offenseId: string, teamId: string, yard: string): number | null {
  if (!yard.trim()) return null;
  const n = Number(yard);
  if (!Number.isFinite(n)) return null;
  return teamId === offenseId ? n : 100 - n;
}

export function spotAtProgress(
  offenseId: string,
  defenseId: string,
  progress: number,
): { teamId: string; yard: string } {
  const yard = Math.max(1, Math.min(99, Math.round(progress)));
  if (yard <= 50) return { teamId: offenseId, yard: String(yard) };
  return { teamId: defenseId, yard: String(100 - yard) };
}

export function toGoFromSeries(
  offenseId: string,
  seriesTeamId: string,
  seriesYard: string,
  ballTeamId: string,
  ballYard: string,
): string | null {
  const gained = yardsGained({
    offenseId,
    ballTeamId: seriesTeamId,
    ballYard: seriesYard,
    endTeamId: ballTeamId,
    endYard: ballYard,
  });
  if (gained === null) return null;
  return String(Math.max(0, 10 - gained));
}
