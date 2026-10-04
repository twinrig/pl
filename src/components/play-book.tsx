import { useEffect, useMemo, useState, type ReactNode } from "react";
import { withOgorman } from "@/lib/ogorman";
import { gameStats, teamScores } from "@/lib/stats";
import { withWashington } from "@/lib/washington";
import {
  PENALTIES,
  PLAY_TYPES,
  buildSentence,
  enforceSpot,
  labelFor,
  lookupName,
  normNum,
  ordinalDown,
  penaltyGroups,
  progressFromGoal,
  spotAtProgress,
  toGoFromSeries,
  yardsGained,
  type Player,
  type PlayType,
  type ResultKind,
  type Team,
} from "@/lib/plays";

function withRosters<T extends Parameters<typeof withOgorman>[0]>(book: T): T {
  return withWashington(withOgorman(book));
}

const STORAGE_KEY = "play-log-season-v1";
const LEGACY_KEY = "play-log-v2";

const PLAY_BUTTONS = PLAY_TYPES.filter(
  (type) =>
    type !== "Sack" &&
    type !== "Interception" &&
    type !== "Fumble" &&
    type !== "Safety" &&
    type !== "Kneel" &&
    type !== "Penalty",
);

const SCRIMMAGE_TYPES = PLAY_BUTTONS.filter(
  (type) => type !== "Kickoff" && type !== "Extra point",
);

const RESULTS: { id: ResultKind; label: string }[] = [
  { id: "tackled", label: "Tackled" },
  { id: "incomplete", label: "Incomplete" },
  { id: "touchdown", label: "Touchdown" },
  { id: "downed", label: "Downed" },
  { id: "out-of-bounds", label: "Out of bounds" },
  { id: "sack", label: "Sack" },
  { id: "interception", label: "Interception" },
  { id: "fumble", label: "Fumble" },
  { id: "safety", label: "Safety" },
  { id: "kneel", label: "Kneel" },
  { id: "touchback", label: "Touchback" },
  { id: "fair-catch", label: "Fair catch" },
  { id: "fumble-kept", label: "Fumble kept" },
];

const RESULT_MAIN = new Set<ResultKind>([
  "tackled",
  "incomplete",
  "downed",
  "out-of-bounds",
  "interception",
  "fumble",
]);

const RESULT_MORE = RESULTS.filter((item) => !RESULT_MAIN.has(item.id) && item.id !== "touchdown");

const TURNOVER_RESULTS = new Set<ResultKind>(["interception", "fumble", "safety"]);

function sideForNumber(
  number: string,
  players: Player[],
  offenseId: string,
  defenseId: string,
): "offense" | "defense" | null {
  const jersey = normNum(number);
  if (!jersey) return null;
  const onOffense = players.some(
    (player) => player.teamId === offenseId && normNum(player.number) === jersey,
  );
  const onDefense = players.some(
    (player) => player.teamId === defenseId && normNum(player.number) === jersey,
  );
  if (onOffense && !onDefense) return "offense";
  if (onDefense && !onOffense) return "defense";
  return null;
}

function playNeedsTime(draft: { result: ResultKind }): boolean {
  return draft.result === "touchdown";
}

const POSSESSION_PLAYS = new Set<PlayType>([
  "Interception",
  "Fumble",
  "Punt",
  "Kickoff",
  "Safety",
]);

type PlaySnapshot = {
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

type LoggedPlay = {
  id: string;
  quarter: string;
  clock?: string;
  down: string;
  distance: string;
  sentence: string;
  snapshot?: PlaySnapshot;
};

type Book = {
  teams: Team[];
  players: Player[];
  plays: LoggedPlay[];
};

type Draft = {
  quarter: string;
  down: string;
  distance: string;
  offenseId: string;
  ballTeamId: string;
  ballYard: string;
  seriesTeamId: string;
  seriesYard: string;
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
  tryPoints: 1 | 2;
  lineTeamId: string;
  lineYard: string;
  lineManual: boolean;
};

function emptyBook(): Book {
  return withRosters({
    teams: [
      { id: "home", name: "Home" },
      { id: "away", name: "Away" },
    ],
    players: [],
    plays: [],
  });
}

function emptyDraft(book: Book): Draft {
  return {
    quarter: "1",
    down: "1",
    distance: "10",
    offenseId: book.teams[0]?.id ?? "home",
    ballTeamId: book.teams[0]?.id ?? "home",
    ballYard: "25",
    seriesTeamId: book.teams[0]?.id ?? "home",
    seriesYard: "25",
    snapTeamId: book.teams[0]?.id ?? "home",
    snapYard: "25",
    type: "Pass",
    result: "tackled",
    scoreTime: "",
    possession: false,
    starter: "",
    target1: "",
    target2: "",
    tackler1: "",
    tackler2: "",
    tackler3: "",
    tryPoints: 1,
    lineTeamId: book.teams[0]?.id ?? "home",
    lineYard: "35",
    lineManual: false,
  };
}

function snapshotFrom(draft: Draft, scoreTime: string): PlaySnapshot {
  return {
    quarter: draft.quarter,
    down: draft.down,
    distance: draft.distance,
    offenseId: draft.offenseId,
    ballTeamId: draft.ballTeamId,
    ballYard: draft.ballYard,
    snapTeamId: draft.snapTeamId,
    snapYard: draft.snapYard,
    type: draft.type,
    result: draft.result,
    scoreTime,
    possession: draft.possession,
    starter: draft.starter,
    target1: draft.target1,
    target2: draft.target2,
    tackler1: draft.tackler1,
    tackler2: draft.tackler2,
    tackler3: draft.tackler3,
    tryPoints: draft.tryPoints,
  };
}

function teamName(book: Book, id: string): string {
  return book.teams.find((t) => t.id === id)?.name ?? "";
}

function defenseId(book: Book, offenseId: string): string {
  return book.teams.find((t) => t.id !== offenseId)?.id ?? offenseId;
}

function kickingPlay(type: string): boolean {
  return type === "Kickoff" || type === "Punt";
}

function startLabel(type: string): string {
  if (type === "Kickoff") return "Kicker";
  if (type === "Punt") return "Punter";
  return "Offense start";
}

function sentenceFrom(book: Book, draft: Draft): string {
  const offense = draft.offenseId;
  const defense = defenseId(book, offense);
  const ballMoved =
    draft.ballTeamId !== draft.snapTeamId ||
    normNum(draft.ballYard) !== normNum(draft.snapYard);
  const returnPlay = kickingPlay(draft.type);
  const skillTeam = returnPlay ? defense : offense;
  const tackleTeam = returnPlay ? offense : defense;
  return buildSentence({
    ballTeam: teamName(book, draft.snapTeamId),
    ballYard: draft.snapYard,
    endTeam:
      draft.type === "Kickoff" || ballMoved ? teamName(book, draft.ballTeamId) : "",
    endYard: draft.type === "Kickoff" || ballMoved ? draft.ballYard : "",
    type: draft.type,
    result: draft.result,
    scoreTime: draft.scoreTime,
    starter: labelFor(draft.starter, book.players, offense),
    targets: [draft.target1, draft.target2]
      .map((n) => labelFor(n, book.players, skillTeam))
      .filter(Boolean),
    tacklers: [draft.tackler1, draft.tackler2, draft.tackler3]
      .map((n) => labelFor(n, book.players, tackleTeam, returnPlay))
      .filter(Boolean),
    tryPoints: draft.tryPoints,
  });
}

type GameRecord = {
  id: string;
  date: string;
  final: boolean;
  book: Book;
  draft: Draft;
};

type PastSeason = {
  id: string;
  stopped: string;
  label?: string;
  games: GameRecord[];
  activeId: string;
};

type Season = {
  id: string;
  closed: boolean;
  games: GameRecord[];
  activeId: string;
  past: PastSeason[];
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function freshGame(book: Book, draft?: Draft): GameRecord {
  return {
    id: crypto.randomUUID(),
    date: today(),
    final: false,
    book,
    draft: draft ?? emptyDraft(book),
  };
}

function emptySeason(): Season {
  const game = freshGame(emptyBook());
  return { id: crypto.randomUUID(), closed: false, games: [game], activeId: game.id, past: [] };
}

function normalizeBook(raw: Partial<Book> | undefined): Book {
  const teams = Array.isArray(raw?.teams) ? raw.teams.slice(0, 2) : [];
  if (teams.length < 2) return emptyBook();
  const book: Book = {
    teams,
    players: Array.isArray(raw?.players) ? raw.players : [],
    plays: Array.isArray(raw?.plays) ? raw.plays : [],
  };
  return book.players.length === 0 ? withRosters(book) : book;
}

function readGame(game: Partial<GameRecord> | undefined): GameRecord | null {
  if (!game) return null;
  const book = normalizeBook(game.book);
  return {
    id: game.id || crypto.randomUUID(),
    date: game.date || today(),
    final: Boolean(game.final),
    book,
    draft: { ...emptyDraft(book), ...(game.draft ?? {}) },
  };
}

function seasonLabel(games: GameRecord[], stopped: string): string {
  const dates = games.map((game) => game.date).filter(Boolean).sort();
  const year = (dates[0] || stopped).slice(0, 4);
  const home = games[0]?.book.teams[0]?.name?.trim() || "Season";
  return `${year} ${home}`;
}

function seasonFromParsed(parsed: Partial<Season> & { season?: Partial<Season> }): Season | null {
  const body = parsed.season && Array.isArray(parsed.season.games) ? parsed.season : parsed;
  if (!Array.isArray(body.games) || body.games.length === 0) return null;
  const games = body.games.map((game) => readGame(game)).filter((game) => game !== null);
  if (games.length === 0) return null;
  const activeId = games.some((game) => game.id === body.activeId) ? body.activeId! : games[0].id;
  const past = Array.isArray(body.past)
    ? body.past
        .map((item) => {
          const itemGames = (item.games ?? [])
            .map((game) => readGame(game))
            .filter((game) => game !== null);
          if (itemGames.length === 0) return null;
          const stopped = item.stopped || today();
          return {
            id: item.id || crypto.randomUUID(),
            stopped,
            label: item.label || seasonLabel(itemGames, stopped),
            games: itemGames,
            activeId: itemGames.some((game) => game.id === item.activeId)
              ? item.activeId
              : itemGames[0].id,
          };
        })
        .filter((item) => item !== null)
    : [];
  return {
    id: body.id || crypto.randomUUID(),
    closed: Boolean(body.closed),
    games,
    activeId,
    past,
  };
}

function loadSeason(): Season | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = seasonFromParsed(JSON.parse(raw) as Season);
      if (saved) return saved;
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return null;
    const parsed = JSON.parse(legacy) as Book;
    if (!Array.isArray(parsed.teams) || parsed.teams.length < 2) return null;
    const game = freshGame(normalizeBook(parsed));
    return { id: crypto.randomUUID(), closed: false, games: [game], activeId: game.id, past: [] };
  } catch {
    return null;
  }
}

export function PlayBook() {
  const [season, setSeason] = useState<Season>(emptySeason);
  const active = season.games.find((game) => game.id === season.activeId) ?? season.games[0];
  const book = active.book;
  const draft = active.draft;
  const [hydrated, setHydrated] = useState(false);
  const [rosterNum, setRosterNum] = useState<Record<string, string>>({});
  const [rosterName, setRosterName] = useState<Record<string, string>>({});
  const [rosterPos, setRosterPos] = useState<Record<string, string>>({});
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [penaltyNumber, setPenaltyNumber] = useState("");
  const [penaltyId, setPenaltyId] = useState<string>(PENALTIES[0].id);
  const [penaltySide, setPenaltySide] = useState<"offense" | "defense">("offense");
  const [penaltyReplay, setPenaltyReplay] = useState(true);
  const [penaltyDead, setPenaltyDead] = useState(false);
  const [endsFlipped, setEndsFlipped] = useState(false);
  const [placeMode, setPlaceMode] = useState<"ball" | "start" | "line" | "kick">("ball");
  const [askTime, setAskTime] = useState(false);
  const [promptTime, setPromptTime] = useState("");
  const [special, setSpecial] = useState<null | "kickoff" | "extra">(null);
  const [resumeType, setResumeType] = useState<PlayType>("Pass");
  const [editing, setEditing] = useState<LoggedPlay | null>(null);
  const [confirmingNew, setConfirmingNew] = useState(false);
  const [confirming, setConfirming] = useState<null | "final" | "stop" | "start">(null);
  const [seasonOpen, setSeasonOpen] = useState(false);
  const [backupNote, setBackupNote] = useState("");
  const [pendingBackup, setPendingBackup] = useState<Season | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function setBook(update: Book | ((book: Book) => Book)) {
    setSeason((current) => ({
      ...current,
      games: current.games.map((game) =>
        game.id === current.activeId
          ? { ...game, book: typeof update === "function" ? update(game.book) : update }
          : game,
      ),
    }));
  }

  function setDraft(update: Draft | ((draft: Draft) => Draft)) {
    setSeason((current) => ({
      ...current,
      games: current.games.map((game) =>
        game.id === current.activeId
          ? { ...game, draft: typeof update === "function" ? update(game.draft) : update }
          : game,
      ),
    }));
  }

  useEffect(() => {
    const saved = loadSeason();
    if (saved) setSeason(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(season));
  }, [season, hydrated]);

  const preview = useMemo(() => sentenceFrom(book, draft), [book, draft]);

  function distanceFor(d: Draft, offenseId = d.offenseId): string {
    if (d.lineManual) {
      const ball = progressFromGoal(offenseId, d.ballTeamId, d.ballYard);
      const line = progressFromGoal(offenseId, d.lineTeamId, d.lineYard);
      if (ball !== null && line !== null) return String(Math.max(0, Math.round(line - ball)));
    }
    return (
      toGoFromSeries(offenseId, d.seriesTeamId, d.seriesYard, d.ballTeamId, d.ballYard) ??
      d.distance
    );
  }

  function placeBall(teamId: string, yard: string) {
    setDraft((d) => {
      const next = { ...d, ballTeamId: teamId, ballYard: yard };
      return { ...next, distance: distanceFor(next) };
    });
  }

  function setSeries(teamId: string, yard: string) {
    setDraft((d) => {
      const next = { ...d, seriesTeamId: teamId, seriesYard: yard, lineManual: false };
      return { ...next, distance: distanceFor(next) };
    });
  }

  function setFirstDown(teamId: string, yard: string) {
    setDraft((d) => {
      const next = { ...d, lineTeamId: teamId, lineYard: yard, lineManual: true };
      return { ...next, distance: distanceFor(next) };
    });
  }

  function setDown(down: string) {
    setDraft((d) => {
      if (down !== "1") return { ...d, down, distance: distanceFor({ ...d, down }) };
      return {
        ...d,
        down,
        distance: "10",
        lineManual: false,
        seriesTeamId: d.ballTeamId,
        seriesYard: d.ballYard,
        snapTeamId: d.ballTeamId,
        snapYard: d.ballYard,
      };
    });
  }

  function patch(partial: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...partial }));
  }

  function chooseResult(id: ResultKind) {
    patch({ result: id, possession: TURNOVER_RESULTS.has(id) });
    if (id === "touchback" && kickingPlay(draft.type)) placeBall(defenseId(book, draft.offenseId), "20");
  }

  function renameTeam(id: string, name: string) {
    setBook((b) => ({
      ...b,
      teams: b.teams.map((t) => (t.id === id ? { ...t, name } : t)),
    }));
  }

  function addPlayer(teamId: string) {
    const number = normNum(rosterNum[teamId] ?? "");
    const name = (rosterName[teamId] ?? "").trim();
    const position = (rosterPos[teamId] ?? "").trim();
    if (!number || !name) return;
    setBook((b) => {
      const existing = b.players.find(
        (p) => p.teamId === teamId && normNum(p.number) === number,
      );
      const players = existing
        ? b.players.map((p) => (p.id === existing.id ? { ...p, name, number, position } : p))
        : [...b.players, { id: crypto.randomUUID(), teamId, number, name, position }];
      return { ...b, players };
    });
    setRosterNum((m) => ({ ...m, [teamId]: "" }));
    setRosterName((m) => ({ ...m, [teamId]: "" }));
    setRosterPos((m) => ({ ...m, [teamId]: "" }));
  }

  function loadRoster(teamId: string, text: string) {
    const rows: { number: string; name: string; position: string }[] = [];
    for (const line of text.split(/\r?\n/)) {
      const parts = line
        .split(",")
        .map((part) => part.trim().replace(/^"|"$/g, ""));
      if (parts.length < 2) continue;
      const number = normNum(parts[0].replace(/^#/, ""));
      const name = parts[1];
      if (!number || !name) continue;
      rows.push({ number, name, position: parts[2] ?? "" });
    }
    if (rows.length === 0) return;
    setBook((b) => ({
      ...b,
      players: [
        ...b.players.filter((player) => player.teamId !== teamId),
        ...rows.map((row) => ({
          id: crypto.randomUUID(),
          teamId,
          number: row.number,
          name: row.name,
          position: row.position,
        })),
      ],
    }));
  }

  function removePlayer(id: string) {
    setBook((b) => ({ ...b, players: b.players.filter((p) => p.id !== id) }));
  }

  function logPlay(time?: string) {
    if (active.final || season.closed) return;
    if (!draft.starter.trim()) return;
    const scoreTime = (time ?? draft.scoreTime).trim();
    if (playNeedsTime(draft) && !scoreTime) {
      setPromptTime("");
      setAskTime(true);
      return;
    }
    const logged = { ...draft, scoreTime };
    const play: LoggedPlay = {
      id: crypto.randomUUID(),
      quarter: draft.quarter,
      down: draft.down,
      distance: draft.distance,
      sentence: sentenceFrom(book, logged),
      snapshot: snapshotFrom(logged, scoreTime),
    };
    setBook((b) => ({ ...b, plays: [play, ...b.plays] }));
    if (logged.type === "Extra point") setSpecial("kickoff");
    else if (logged.type === "Kickoff") setSpecial(null);
    setDraft((d) => {
      const gained = yardsGained({
        offenseId: d.offenseId,
        ballTeamId: d.seriesTeamId,
        ballYard: d.seriesYard,
        endTeamId: d.ballTeamId,
        endYard: d.ballYard,
      });
      const madeLine = d.result === "touchdown" || (gained !== null && gained >= 10);
      const turnover =
        d.type === "Punt" ||
        d.type === "Kickoff" ||
        d.type === "Interception" ||
        d.type === "Fumble" ||
        d.type === "Safety" ||
        TURNOVER_RESULTS.has(d.result) ||
        d.possession;
      const next = {
        ...d,
        snapTeamId: d.ballTeamId,
        snapYard: d.ballYard,
        scoreTime: "",
        possession: false,
        type: "Run" as const,
        result: "tackled" as const,
        starter: "",
        target1: "",
        target2: "",
        tackler1: "",
        tackler2: "",
        tackler3: "",
      };
      if (d.type === "Extra point") {
        return {
          ...next,
          type: "Kickoff" as const,
          possession: true,
          result: "tackled" as const,
          offenseId: d.offenseId,
          down: "1",
          distance: "10",
          ballTeamId: d.offenseId,
          ballYard: "40",
          snapTeamId: d.offenseId,
          snapYard: "40",
          seriesTeamId: d.offenseId,
          seriesYard: "40",
          lineManual: false,
        };
      }
      if (turnover || madeLine || d.down === "4") {
        return {
          ...next,
          offenseId: turnover ? defenseId(book, d.offenseId) : d.offenseId,
          down: "1",
          distance: "10",
          lineManual: false,
          seriesTeamId: d.ballTeamId,
          seriesYard: d.ballYard,
        };
      }
      return { ...next, down: String(Number(d.down) + 1) };
    });
    window.setTimeout(() => {
      document.getElementById(logged.type === "Extra point" ? "kicker" : "starter")?.focus();
    }, 0);
  }

  function addPenalty() {
    if (active.final || season.closed) return;
    const number = penaltyNumber.trim();
    if (!number) return;
    const penalty = PENALTIES.find((item) => item.id === penaltyId) ?? PENALTIES[0];
    const againstOffense = penaltySide === "offense";
    const guiltyId = againstOffense ? draft.offenseId : defenseId(book, draft.offenseId);
    const who = labelFor(number, book.players, guiltyId);
    const progress = progressFromGoal(draft.offenseId, draft.ballTeamId, draft.ballYard);
    if (progress === null) return;
    const nextProgress = enforceSpot(progress, penalty.yards, againstOffense);
    const spot = spotAtProgress(draft.offenseId, defenseId(book, draft.offenseId), nextProgress);
    const moved = Math.abs(nextProgress - Math.round(progress));
    const half = moved < penalty.yards;
    const autoFirst =
      !penaltyDead &&
      !penaltyReplay &&
      !againstOffense &&
      "autoFirst" in penalty &&
      penalty.autoFirst;
    const seriesProgress =
      progressFromGoal(draft.offenseId, draft.seriesTeamId, draft.seriesYard) ?? 0;
    const lineProgress = draft.lineManual
      ? (progressFromGoal(draft.offenseId, draft.lineTeamId, draft.lineYard) ??
        Math.min(100, seriesProgress + 10))
      : Math.min(100, seriesProgress + 10);
    const crossed = penaltyDead && progress < lineProgress && nextProgress >= lineProgress;
    const awardFirst = autoFirst || crossed;
    const distance = awardFirst
      ? "10"
      : (toGoFromSeries(
          draft.offenseId,
          draft.seriesTeamId,
          draft.seriesYard,
          spot.teamId,
          spot.yard,
        ) ?? draft.distance);
    const down = awardFirst ? "1" : draft.down;
    const yardsText = half ? "half the distance" : `${penalty.yards} yards`;
    const downText = crossed || autoFirst
      ? " First down."
      : penaltyReplay
        ? " Down replayed."
        : "";
    const kind = penaltyDead ? "Dead ball foul" : "Penalty";
    const sentence = `${kind} on ${who}, ${penalty.label.toLowerCase()}, ${yardsText}. Ball on the ${teamName(book, spot.teamId)} ${spot.yard}.${downText}`;
    const play: LoggedPlay = {
      id: crypto.randomUUID(),
      quarter: draft.quarter,
      down,
      distance,
      sentence,
    };
    setBook((b) => ({ ...b, plays: [play, ...b.plays] }));
    setDraft((d) => ({
      ...d,
      down,
      distance,
      ballTeamId: spot.teamId,
      ballYard: spot.yard,
      snapTeamId: spot.teamId,
      snapYard: spot.yard,
      seriesTeamId: awardFirst ? spot.teamId : d.seriesTeamId,
      seriesYard: awardFirst ? spot.yard : d.seriesYard,
      lineManual: awardFirst ? false : d.lineManual,
    }));
    setPenaltyNumber("");
  }

  function undo(id: string) {
    setBook((b) => ({ ...b, plays: b.plays.filter((p) => p.id !== id) }));
  }

  function newGame() {
    if (season.closed) return;
    setSeason((current) => {
      if (current.closed) return current;
      const playing = current.games.find((game) => game.id === current.activeId) ?? current.games[0];
      const home = playing.book.teams[0];
      const away = playing.book.teams[1];
      const homeId = home?.id ?? "home";
      const book: Book = {
        teams: playing.book.teams.map((team) => ({ ...team })),
        players: playing.book.players.map((player) => ({ ...player })),
        plays: [
          {
            id: crypto.randomUUID(),
            quarter: "",
            down: "",
            distance: "",
            sentence: `New Game - ${home?.name ?? "Home"} vs ${away?.name ?? "Away"}.`,
          },
        ],
      };
      const game = freshGame(book, {
        ...emptyDraft(book),
        offenseId: homeId,
        ballTeamId: homeId,
        ballYard: "40",
        seriesTeamId: homeId,
        seriesYard: "40",
        snapTeamId: homeId,
        snapYard: "40",
        type: "Kickoff",
        possession: true,
      });
      return {
        ...current,
        games: [
          ...current.games.map((item) =>
            item.id === current.activeId ? { ...item, final: true } : item,
          ),
          game,
        ],
        activeId: game.id,
      };
    });
    setEndsFlipped(false);
    setResumeType("Run");
    setSpecial("kickoff");
    setConfirmingNew(false);
    setSeasonOpen(false);
  }

  function completeGame() {
    setSeason((current) => ({
      ...current,
      games: current.games.map((game) =>
        game.id === current.activeId ? { ...game, final: true } : game,
      ),
    }));
    setConfirming(null);
  }

  function stopSeason() {
    setSeason((current) => ({
      ...current,
      closed: true,
      games: current.games.map((game) =>
        game.id === current.activeId ? { ...game, final: true } : game,
      ),
    }));
    setConfirming(null);
    setSpecial(null);
  }

  function startSeason() {
    setSeason((current) => {
      const home = current.games.find((game) => game.id === current.activeId)?.book.teams[0]
        ?? current.games[0]?.book.teams[0];
      const source = current.games.find((game) => game.id === current.activeId)?.book
        ?? current.games[0]?.book;
      const homeId = home?.id ?? "home";
      const book: Book = {
        teams: [
          { id: homeId, name: home?.name || "Home" },
          { id: "away", name: "Away" },
        ],
        players: (source?.players ?? []).filter((player) => player.teamId === homeId).map((player) => ({ ...player })),
        plays: [],
      };
      const game = freshGame(book, {
        ...emptyDraft(book),
        offenseId: homeId,
        ballTeamId: homeId,
        ballYard: "40",
        type: "Kickoff",
        possession: true,
        snapTeamId: homeId,
        snapYard: "40",
        seriesTeamId: homeId,
        seriesYard: "40",
      });
      const stopped = today();
      const games = current.games.map((item) => ({ ...item, final: true }));
      const past = [
        ...current.past,
        {
          id: current.id,
          stopped,
          label: seasonLabel(games, stopped),
          games,
          activeId: current.activeId,
        },
      ];
      return { id: crypto.randomUUID(), closed: false, games: [game], activeId: game.id, past };
    });
    setEndsFlipped(false);
    setResumeType("Run");
    setSpecial("kickoff");
    setConfirming(null);
  }

  function openPast(id: string) {
    setSeason((current) => {
      const found = current.past.find((item) => item.id === id);
      if (!found) return current;
      const stopped = today();
      const games = current.games.map((game) => ({ ...game, final: true }));
      return {
        id: found.id,
        closed: true,
        games: found.games,
        activeId: found.activeId,
        past: [
          ...current.past.filter((item) => item.id !== id),
          {
            id: current.id,
            stopped,
            label: seasonLabel(games, stopped),
            games,
            activeId: current.activeId,
          },
        ],
      };
    });
    setEditing(null);
    setSpecial(null);
  }

  function openGame(id: string) {
    setSeason((current) => ({ ...current, activeId: id }));
    setEditing(null);
    setSpecial(null);
    setSeasonOpen(false);
  }

  function removeGame(id: string) {
    setSeason((current) => {
      if (current.games.length < 2) return current;
      const games = current.games.filter((game) => game.id !== id);
      const activeId = current.activeId === id ? games[games.length - 1].id : current.activeId;
      return { ...current, games, activeId };
    });
    if (id === season.activeId) setEditing(null);
  }

  function csvText() {
    const header = [
      "Quarter",
      "Down",
      "Distance",
      "Play",
      "Result",
      "Start",
      "Targets",
      "Tacklers",
      "Log",
    ];
    const cell = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const rows = [...book.plays].reverse().map((play) => {
      const snap = play.snapshot;
      const defense = snap ? defenseId(book, snap.offenseId) : "";
      const kicking = snap ? kickingPlay(snap.type) : false;
      const skillTeam = snap ? (kicking ? defense : snap.offenseId) : "";
      const tackleTeam = snap ? (kicking ? snap.offenseId : defense) : "";
      const names = (numbers: string[], teamId: string, strict = false) =>
        numbers
          .map((number) => labelFor(number, book.players, teamId, strict))
          .filter(Boolean)
          .join(", ");
      const result = snap
        ? (RESULTS.find((item) => item.id === snap.result)?.label ?? snap.result)
        : "";
      return [
        play.quarter,
        play.down,
        play.distance,
        snap?.type ?? "",
        result,
        snap ? labelFor(snap.starter, book.players, snap.offenseId) : "",
        snap ? names([snap.target1, snap.target2], skillTeam) : "",
        snap ? names([snap.tackler1, snap.tackler2, snap.tackler3], tackleTeam, kicking) : "",
        play.sentence,
      ]
        .map((value) => cell(String(value)))
        .join(",");
    });
    return [header.join(","), ...rows].join("\n");
  }

  function downloadBackup() {
    const file = {
      version: 1,
      savedAt: new Date().toISOString(),
      season,
    };
    const blob = new Blob([JSON.stringify(file)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `play-log-backup-${today()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
    const years = new Set([
      ...season.games.map((game) => game.date.slice(0, 4)),
      ...season.past.flatMap((item) => item.games.map((game) => game.date.slice(0, 4))),
    ]);
    setBackupNote(
      `Saved ${season.past.length + 1} season${season.past.length === 0 ? "" : "s"} (${[...years].filter(Boolean).join(", ")}). Keep this file.`,
    );
  }

  function chooseBackup(text: string) {
    try {
      const saved = seasonFromParsed(JSON.parse(text) as Season);
      if (!saved) {
        setBackupNote("That file is not a play log backup.");
        return;
      }
      setPendingBackup(saved);
      setBackupNote("");
    } catch {
      setBackupNote("That file is not a play log backup.");
    }
  }
  function downloadCsv() {
    const blob = new Blob([csvText()], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "play-log.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  const offenseId = draft.offenseId;
  const defense = defenseId(book, offenseId);
  const leftTeamId = endsFlipped
    ? (book.teams[1]?.id ?? defense)
    : (book.teams[0]?.id ?? offenseId);
  const fieldFlipped = offenseId !== leftTeamId;
  const seriesProgress =
    progressFromGoal(draft.offenseId, draft.seriesTeamId, draft.seriesYard) ?? 25;
  const firstProgress = draft.lineManual
    ? (progressFromGoal(offenseId, draft.lineTeamId, draft.lineYard) ??
      Math.min(100, seriesProgress + 10))
    : Math.min(100, Math.max(0, seriesProgress + 10));
  const kickProgress =
    draft.type === "Kickoff"
      ? progressFromGoal(offenseId, draft.snapTeamId, draft.snapYard)
      : null;
  const chosenPenalty = PENALTIES.find((item) => item.id === penaltyId) ?? PENALTIES[0];
  const penaltyNote = `${chosenPenalty.yards} yards on the ${penaltySide}. ${
    penaltyDead
      ? "Dead ball. The down stays unless the new spot reaches the 1st down line."
      : penaltyReplay
        ? "The down is replayed."
        : penaltySide === "defense" && "autoFirst" in chosenPenalty && chosenPenalty.autoFirst
          ? "First down."
          : "The down stands."
  }`;

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-6">
        <div>
          <h1 className="text-xl font-semibold tracking-wide">Play Log</h1>
          <p className="text-sm text-muted">
            Type jersey numbers. A known number becomes Name (number).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSeasonOpen(true)}
            className="h-11 rounded-lg border border-line bg-raised px-4 text-sm font-semibold"
          >
            Season
          </button>
          <button
            type="button"
            onClick={() => setTeamsOpen(true)}
            className="h-11 rounded-lg border border-line bg-raised px-4 text-sm font-semibold"
          >
            Teams
          </button>
          <button
            type="button"
            onClick={() => setStatsOpen(true)}
            className="h-11 rounded-lg border border-line bg-raised px-4 text-sm font-semibold"
          >
            Stats
          </button>
          <button
            type="button"
            onClick={() => {
              setCopied(false);
              setExportOpen(true);
            }}
            className="h-11 rounded-lg border border-line bg-raised px-4 text-sm font-semibold"
          >
            Export CSV
          </button>
          {window.location.protocol !== "file:" && (
            <a
              href="/Play-Log.html"
              download="Play-Log.html"
              className="inline-flex h-11 items-center rounded-lg border border-line bg-raised px-4 text-sm font-semibold"
            >
              Download app
            </a>
          )}
          <button
            type="button"
            onClick={() => setConfirming("final")}
            disabled={active.final || season.closed}
            className="h-11 rounded-lg border border-line bg-raised px-4 text-sm font-semibold disabled:opacity-40"
          >
            {active.final ? "Game final" : "Complete game"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmingNew(true)}
            disabled={season.closed}
            className="h-11 rounded-lg border border-line bg-raised px-4 text-sm font-semibold disabled:opacity-40"
          >
            New game
          </button>
        </div>
      </header>

      {statsOpen && <StatsSheet book={book} onClose={() => setStatsOpen(false)} />}
      {teamsOpen && (
        <div className="fixed inset-0 z-20 overflow-auto bg-bg/90 p-4 sm:p-6">
          <div
            role="dialog"
            aria-label="Teams"
            className="mx-auto w-full max-w-3xl rounded-2xl border border-line bg-surface p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Teams</h2>
              <button
                type="button"
                onClick={() => setTeamsOpen(false)}
                className="h-11 rounded-lg bg-accent px-4 text-sm font-bold text-ink"
              >
                Done
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {book.teams.map((team) => (
                <section key={team.id} className="rounded-xl border border-line bg-bg p-4">
                  <label className="mb-1 block text-xs font-semibold tracking-wider text-muted uppercase">
                    Team
                  </label>
                  <input
                    aria-label={`${team.id} team name`}
                    value={team.name}
                    onChange={(e) => renameTeam(team.id, e.target.value)}
                    className="mb-3 h-11 w-full rounded-lg border border-line bg-raised px-3 font-semibold"
                  />
                  <div className="mb-3 flex gap-2">
                    <input
                      aria-label={`${team.name} jersey`}
                      inputMode="numeric"
                      placeholder="#"
                      value={rosterNum[team.id] ?? ""}
                      onChange={(e) =>
                        setRosterNum((m) => ({ ...m, [team.id]: e.target.value }))
                      }
                      className="h-11 w-16 rounded-lg border border-line bg-raised px-2 text-center"
                    />
                    <input
                      aria-label={`${team.name} player name`}
                      placeholder="Name"
                      value={rosterName[team.id] ?? ""}
                      onChange={(e) =>
                        setRosterName((m) => ({ ...m, [team.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addPlayer(team.id);
                      }}
                      className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-raised px-3"
                    />
                    <input
                      aria-label={`${team.name} position`}
                      placeholder="Pos"
                      value={rosterPos[team.id] ?? ""}
                      onChange={(e) =>
                        setRosterPos((m) => ({ ...m, [team.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addPlayer(team.id);
                      }}
                      className="h-11 w-16 rounded-lg border border-line bg-raised px-2 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => addPlayer(team.id)}
                      className="h-11 rounded-lg bg-accent px-3 text-sm font-bold text-ink"
                    >
                      Add
                    </button>
                  </div>
                  <label className="mb-3 flex h-10 cursor-pointer items-center justify-center rounded-lg border border-line text-sm font-semibold">
                    Load CSV
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (!file) return;
                        void file.text().then((text) => loadRoster(team.id, text));
                      }}
                    />
                  </label>
                  <p className="mb-3 text-xs text-muted">Number, name, position. Replaces this roster.</p>
                  <ul className="flex flex-col gap-1">
                    {book.players
                      .filter((p) => p.teamId === team.id)
                      .map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between gap-2 rounded-lg px-1 py-1 text-sm"
                        >
                          <span>
                            <span className="mr-2 font-semibold text-accent">{p.number}</span>
                            {p.name}
                            {p.position ? <span className="text-muted"> · {p.position}</span> : null}
                          </span>
                          <button
                            type="button"
                            aria-label={`Remove ${p.name}`}
                            onClick={() => removePlayer(p.id)}
                            className="h-8 px-2 text-muted"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    {book.players.every((p) => p.teamId !== team.id) && (
                      <li className="text-sm text-muted">No players yet.</li>
                    )}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto flex max-w-6xl flex-col gap-4 p-4 sm:p-6">
          <FieldBoard
            offenseName={teamName(book, draft.offenseId)}
            defenseName={teamName(book, defenseId(book, draft.offenseId))}
            offenseScore={teamScores(book)[draft.offenseId] ?? 0}
            defenseScore={
              teamScores(book)[defenseId(book, draft.offenseId)] ?? 0
            }
            flipped={fieldFlipped}
            quarter={draft.quarter}
            onQuarter={(q) => {
              if (q === draft.quarter) return;
              if (q === "1" || q === "3") {
                if (draft.type !== "Kickoff" && draft.type !== "Extra point") {
                  setResumeType(draft.type);
                }
                setEndsFlipped(false);
                setSpecial("kickoff");
                patch({
                  quarter: q,
                  type: "Kickoff",
                  possession: true,
                  result: "tackled",
                  down: "1",
                  distance: "10",
                  ballTeamId: draft.offenseId,
                  ballYard: "40",
                  snapTeamId: draft.offenseId,
                  snapYard: "40",
                  seriesTeamId: draft.offenseId,
                  seriesYard: "40",
                  lineManual: false,
                  starter: "",
                  target1: "",
                  target2: "",
                  tackler1: "",
                  tackler2: "",
                  tackler3: "",
                  scoreTime: "",
                });
                return;
              }
              patch({ quarter: q });
              if (q === "2" || q === "4") setEndsFlipped(true);
            }}
            onFlip={() => setEndsFlipped((value) => !value)}
            placeMode={placeMode}
            onPlaceMode={setPlaceMode}
            ball={
              progressFromGoal(draft.offenseId, draft.ballTeamId, draft.ballYard) ?? 25
            }
            series={seriesProgress}
            firstDown={firstProgress}
            kick={kickProgress}
            onPlace={(progress) => {
              const spot = spotAtProgress(draft.offenseId, defense, progress);
              const mode = placeMode === "kick" && draft.type !== "Kickoff" ? "ball" : placeMode;
              if (mode === "kick") patch({ snapTeamId: spot.teamId, snapYard: spot.yard });
              else if (mode === "start") setSeries(spot.teamId, spot.yard);
              else if (mode === "line") setFirstDown(spot.teamId, spot.yard);
              else placeBall(spot.teamId, spot.yard);
            }}
          />
          <form
            className="rounded-2xl border border-line bg-surface p-4"
            onSubmit={(e) => {
              e.preventDefault();
              logPlay();
            }}
          >
            <div className="mb-4 flex flex-nowrap items-end gap-3 overflow-x-auto">
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
                  Down
                </p>
                <div className="flex gap-1">
                  {["1", "2", "3", "4"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDown(d)}
                      className={
                        "h-8 min-w-8 rounded-md border px-2 text-xs font-semibold " +
                        (draft.down === d
                          ? "border-transparent bg-accent text-ink"
                          : "border-line bg-raised text-fg")
                      }
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-16">
                <Field label="To go">
                  <input
                    inputMode="numeric"
                    value={draft.distance}
                    onChange={(e) => patch({ distance: e.target.value })}
                    className="h-8 w-full rounded-md border border-line bg-raised px-2 text-center text-sm"
                  />
                </Field>
              </div>
              <span aria-hidden="true" className="mb-1 h-8 w-px shrink-0 bg-line" />
              <Field label="Offense">
                <TeamSelect
                  compact
                  teams={book.teams}
                  value={draft.offenseId}
                  onChange={(nextOffense) =>
                    setDraft((current) => ({
                      ...current,
                      offenseId: nextOffense,
                      distance: distanceFor(current, nextOffense),
                    }))
                  }
                />
              </Field>
            </div>

            <div className="mb-4 flex flex-wrap items-end gap-2">
              <JerseyField
                id="starter"
                label={startLabel(draft.type)}
                value={draft.starter}
                hint={hint(draft.starter, book.players, offenseId)}
                onChange={(starter) => patch({ starter })}
              />
              <JerseyField
                id="target-1"
                label="Target"
                value={draft.target1}
                hint={hint(draft.target1, book.players, offenseId)}
                onChange={(target1) => patch({ target1 })}
              />
              <JerseyField
                id="target-2"
                label="Target 2"
                value={draft.target2}
                hint={hint(draft.target2, book.players, offenseId)}
                onChange={(target2) => patch({ target2 })}
              />
              <span aria-hidden="true" className="mb-1 h-8 w-px shrink-0 bg-line" />
              <JerseyField
                id="tackler-1"
                label="Tackler"
                value={draft.tackler1}
                hint={hint(draft.tackler1, book.players, defense)}
                onChange={(tackler1) => patch({ tackler1 })}
              />
              <JerseyField
                id="tackler-2"
                label="Tackler 2"
                value={draft.tackler2}
                hint={hint(draft.tackler2, book.players, defense)}
                onChange={(tackler2) => patch({ tackler2 })}
              />
              <JerseyField
                id="tackler-3"
                label="Tackler 3"
                value={draft.tackler3}
                hint={hint(draft.tackler3, book.players, defense)}
                onChange={(tackler3) => patch({ tackler3 })}
              />
            </div>

            <p className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
              Play
            </p>
            <div className="mb-4 flex flex-nowrap items-center gap-2 overflow-x-auto">
              {SCRIMMAGE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    patch({
                      type,
                      possession: POSSESSION_PLAYS.has(type) ? true : false,
                    })
                  }
                  className={
                    "h-10 shrink-0 rounded-lg border px-2.5 text-sm font-semibold whitespace-nowrap " +
                    (draft.type === type
                      ? "border-transparent bg-accent text-ink"
                      : "border-line bg-raised text-fg")
                  }
                >
                  {type}
                </button>
              ))}
              <span aria-hidden="true" className="h-8 w-px shrink-0 bg-line" />
              <button
                type="button"
                onClick={() => {
                  if (draft.type !== "Kickoff" && draft.type !== "Extra point") {
                    setResumeType(draft.type);
                  }
                  setSpecial("kickoff");
                  patch({
                    type: "Kickoff",
                    possession: true,
                    result: "tackled",
                    snapTeamId: draft.offenseId,
                    snapYard: draft.snapYard || "40",
                    starter: "",
                    target1: "",
                    target2: "",
                    tackler1: "",
                    tackler2: "",
                    tackler3: "",
                    scoreTime: "",
                  });
                }}
                className="h-10 shrink-0 rounded-lg border border-line bg-raised px-2.5 text-sm font-semibold whitespace-nowrap"
              >
                Kickoff
              </button>
              <span aria-hidden="true" className="h-8 w-px shrink-0 bg-line" />
              <button
                type="button"
                onClick={() => {
                  if (draft.type !== "Kickoff" && draft.type !== "Extra point") {
                    setResumeType(draft.type);
                  }
                  setSpecial("extra");
                  patch({
                    type: "Extra point",
                    possession: false,
                    result: "downed",
                    tryPoints: 1,
                    starter: "",
                    target1: "",
                    target2: "",
                    tackler1: "",
                    tackler2: "",
                    tackler3: "",
                    scoreTime: "",
                  });
                }}
                className="h-10 shrink-0 rounded-lg border border-line bg-raised px-2.5 text-sm font-semibold whitespace-nowrap"
              >
                Extra point
              </button>
            </div>
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
                Result
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {RESULTS.filter((item) => RESULT_MAIN.has(item.id)).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => chooseResult(r.id)}
                    className={
                      "h-10 rounded-lg border px-3 text-sm font-semibold " +
                      (draft.result === r.id
                        ? "border-transparent bg-accent text-ink"
                        : "border-line bg-raised text-fg")
                    }
                  >
                    {r.label}
                  </button>
                ))}
                <select
                  aria-label="More results"
                  value={RESULT_MORE.some((item) => item.id === draft.result) ? draft.result : ""}
                  onChange={(event) => {
                    const id = event.target.value as ResultKind;
                    if (id) chooseResult(id);
                  }}
                  className="h-10 rounded-lg border border-line bg-raised px-2 text-sm font-semibold"
                >
                  <option value="">More</option>
                  {RESULT_MORE.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <span aria-hidden="true" className="mx-1 h-8 w-px shrink-0 bg-line" />
                <button
                  type="button"
                  onClick={() => patch({ possession: !draft.possession })}
                  className={
                    "h-10 rounded-lg border px-3 text-sm font-semibold " +
                    (draft.possession
                      ? "border-transparent bg-accent text-ink"
                      : "border-line bg-raised text-fg")
                  }
                >
                  Possession
                </button>
                <span aria-hidden="true" className="mx-1 h-8 w-px shrink-0 bg-line" />
                <button
                  type="button"
                  onClick={() => chooseResult("touchdown")}
                  className={
                    "h-10 rounded-lg border px-3 text-sm font-semibold " +
                    (draft.result === "touchdown"
                      ? "border-transparent bg-accent text-ink"
                      : "border-line bg-raised text-fg")
                  }
                >
                  Touchdown
                </button>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-end gap-2">
              <Field label="Ball on">
                <TeamSelect
                  compact
                  teams={book.teams}
                  value={draft.ballTeamId}
                  onChange={(ballTeamId) => placeBall(ballTeamId, draft.ballYard)}
                />
              </Field>
              <Field label="Yard">
                <input
                  id="ball-yard"
                  inputMode="numeric"
                  value={draft.ballYard}
                  onChange={(e) => placeBall(draft.ballTeamId, e.target.value)}
                  className="h-8 w-16 rounded-md border border-line bg-raised px-2 text-center text-sm"
                />
              </Field>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
                Penalty
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <label className="block w-16">
                  <span className="sr-only">Number</span>
                  <input
                    id="penalty-number"
                    inputMode="numeric"
                    placeholder="#"
                    aria-label="Penalty number"
                    value={penaltyNumber}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPenaltyNumber(value);
                      const side = sideForNumber(value, book.players, offenseId, defense);
                      if (side) setPenaltySide(side);
                    }}
                    className="h-10 w-full rounded-lg border border-line bg-raised px-2 text-center font-semibold"
                  />
                </label>
                <label className="block min-w-40 flex-1">
                  <span className="sr-only">Penalty</span>
                  <select
                    id="penalty-type"
                    aria-label="Penalty"
                    value={penaltyId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setPenaltyId(id);
                      const item = PENALTIES.find((penalty) => penalty.id === id);
                      if (item) {
                        setPenaltyDead(false);
                        setPenaltyReplay(item.replay);
                      }
                    }}
                    className="h-10 w-full rounded-lg border border-line bg-raised px-2 text-sm"
                  >
                    <optgroup label="Common">
                      {penaltyGroups().common.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label} ({item.yards})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Other">
                      {penaltyGroups().rest.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label} ({item.yards})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => setPenaltySide("offense")}
                  className={
                    "h-10 rounded-lg border px-3 text-sm font-semibold " +
                    (penaltySide === "offense"
                      ? "border-transparent bg-accent text-ink"
                      : "border-line bg-raised text-fg")
                  }
                >
                  Offense
                </button>
                <button
                  type="button"
                  onClick={() => setPenaltySide("defense")}
                  className={
                    "h-10 rounded-lg border px-3 text-sm font-semibold " +
                    (penaltySide === "defense"
                      ? "border-transparent bg-accent text-ink"
                      : "border-line bg-raised text-fg")
                  }
                >
                  Defense
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPenaltyReplay((value) => !value);
                    setPenaltyDead(false);
                  }}
                  className={
                    "h-10 rounded-lg border px-3 text-sm font-semibold " +
                    (penaltyReplay
                      ? "border-transparent bg-accent text-ink"
                      : "border-line bg-raised text-fg")
                  }
                >
                  Replay down
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPenaltyDead((value) => {
                      const next = !value;
                      if (next) setPenaltyReplay(false);
                      else setPenaltyReplay(chosenPenalty.replay);
                      return next;
                    })
                  }
                  className={
                    "h-10 rounded-lg border px-3 text-sm font-semibold " +
                    (penaltyDead
                      ? "border-transparent bg-accent text-ink"
                      : "border-line bg-raised text-fg")
                  }
                >
                  Dead ball
                </button>
                <button
                  type="button"
                  onClick={addPenalty}
                  disabled={!penaltyNumber.trim()}
                  className="h-10 rounded-lg bg-accent px-3 text-sm font-bold text-ink disabled:opacity-40"
                >
                  Add
                </button>
              </div>
              <p className="mt-2 text-xs text-muted">{penaltyNote}</p>
            </div>

            <p className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
              This play
            </p>
            <p className="mb-4 font-serif text-lg leading-relaxed">
              {draft.starter.trim()
                ? preview
                : "Type the offense jersey. The sentence shows up here."}
            </p>
            {(active.final || season.closed) && (
              <p className="mb-3 text-sm font-semibold text-accent">
                {season.closed ? "Season stopped." : "Game final."} The log is closed.
              </p>
            )}
            <button
              type="submit"
              disabled={!draft.starter.trim() || active.final || season.closed}
              className="h-12 w-full rounded-xl bg-accent text-base font-bold text-ink disabled:opacity-40"
            >
              Log play
            </button>
          </form>

          <section className="rounded-2xl border border-line bg-surface p-4">
            <h2 className="mb-3 text-xs font-semibold tracking-wider text-muted uppercase">
              Game log
            </h2>
            {book.plays.length === 0 ? (
              <p className="font-serif text-base leading-relaxed text-muted">
                Ball on the O'gorman 45. Pass from Cade Hermansom (3) to Rylan
                Cody (4) tackled on the Washington 37 by 18,74.
              </p>
            ) : (
              <ol className="flex flex-col gap-4">
                {book.plays.map((play, index) => (
                  <li key={play.id} className="border-b border-line pb-4 last:border-0">
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted">
                      <span>
                        {play.down
                          ? `Q${play.quarter} · ${ordinalDown(play.down)} & ${play.distance}${play.clock ? ` · ${play.clock}` : ""}`
                          : "Start"}
                        {index === 0 ? " · latest" : ""}
                      </span>
                      <span className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setEditing(play)}
                          className="h-8 text-muted"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => undo(play.id)}
                          className="h-8 text-muted"
                        >
                          Undo
                        </button>
                      </span>
                    </div>
                    <p className="font-serif text-lg leading-relaxed">{play.sentence}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
      </main>
      {special === "kickoff" && (
        <div className="fixed inset-0 z-30 overflow-auto bg-bg/80 p-4">
          <form
            role="dialog"
            aria-label="Kickoff"
            className="mx-auto w-full max-w-3xl rounded-2xl border border-line bg-surface p-4"
            onSubmit={(event) => {
              event.preventDefault();
              logPlay();
            }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Kickoff</h2>
              <button
                type="button"
                onClick={() => {
                  setSpecial(null);
                  patch({
                    type: resumeType,
                    possession: POSSESSION_PLAYS.has(resumeType),
                  });
                }}
                className="h-10 rounded-lg border border-line px-3 text-sm font-semibold"
              >
                Close
              </button>
            </div>
            <div className="mb-3 grid gap-2 sm:grid-cols-2">
              <Field label="Kicking team">
                <TeamSelect
                  teams={book.teams}
                  value={draft.offenseId}
                  onChange={(nextOffense) =>
                    setDraft((current) => ({ ...current, offenseId: nextOffense }))
                  }
                />
              </Field>
              <div className="grid grid-cols-[minmax(0,1fr)_9rem] gap-2">
                <Field label="Kick from">
                  <TeamSelect
                    teams={book.teams}
                    value={draft.snapTeamId}
                    onChange={(snapTeamId) => patch({ snapTeamId })}
                  />
                </Field>
                <Field label="Yard">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        patch({
                          snapYard: String(Math.max(1, Number(draft.snapYard || "40") - 1)),
                        })
                      }
                      className="h-11 w-9 rounded-lg border border-line text-sm font-bold"
                    >
                      −
                    </button>
                    <input
                      inputMode="numeric"
                      value={draft.snapYard}
                      onChange={(event) => patch({ snapYard: event.target.value })}
                      className="h-11 w-full rounded-lg border border-line bg-raised px-2 text-center"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        patch({
                          snapYard: String(Math.min(99, Number(draft.snapYard || "40") + 1)),
                        })
                      }
                      className="h-11 w-9 rounded-lg border border-line text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                </Field>
              </div>
            </div>
            <div className="mb-3 grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2">
              <Field label="Tackle">
                <TeamSelect
                  teams={book.teams}
                  value={draft.ballTeamId}
                  onChange={(ballTeamId) => placeBall(ballTeamId, draft.ballYard)}
                />
              </Field>
              <Field label="Yard">
                <input
                  inputMode="numeric"
                  value={draft.ballYard}
                  onChange={(event) => placeBall(draft.ballTeamId, event.target.value)}
                  className="h-11 w-full rounded-lg border border-line bg-raised px-2 text-center"
                />
              </Field>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <JerseyField
                id="kicker"
                label="Kicker"
                value={draft.starter}
                hint={hint(draft.starter, book.players, offenseId)}
                onChange={(starter) => patch({ starter })}
              />
              <JerseyField
                id="returner"
                label="Returner"
                value={draft.target1}
                hint={hint(draft.target1, book.players, defense)}
                onChange={(target1) => patch({ target1 })}
              />
            </div>
            <div className="mb-3 grid grid-cols-3 gap-2">
              <JerseyField
                id="cover-1"
                label="Tackle"
                value={draft.tackler1}
                hint={hint(draft.tackler1, book.players, offenseId, true)}
                onChange={(tackler1) => patch({ tackler1 })}
              />
              <JerseyField
                id="cover-2"
                label="Tackle 2"
                value={draft.tackler2}
                hint={hint(draft.tackler2, book.players, offenseId, true)}
                onChange={(tackler2) => patch({ tackler2 })}
              />
              <JerseyField
                id="cover-3"
                label="Tackle 3"
                value={draft.tackler3}
                hint={hint(draft.tackler3, book.players, offenseId, true)}
                onChange={(tackler3) => patch({ tackler3 })}
              />
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {(
                [
                  ["tackled", "Tackled"],
                  ["downed", "Downed"],
                  ["fair-catch", "Fair catch"],
                  ["touchback", "Touchback"],
                  ["out-of-bounds", "Out of bounds"],
                  ["touchdown", "Touchdown"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => chooseResult(id)}
                  className={
                    "h-10 rounded-lg border px-3 text-sm font-semibold " +
                    (draft.result === id
                      ? "border-transparent bg-accent text-ink"
                      : "border-line bg-raised text-fg")
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mb-4 font-serif text-lg leading-relaxed">
              {draft.starter.trim() ? preview : "Type the kicker."}
            </p>
            <button
              type="submit"
              disabled={!draft.starter.trim()}
              className="h-12 w-full rounded-xl bg-accent text-base font-bold text-ink disabled:opacity-40"
            >
              Log kickoff
            </button>
          </form>
        </div>
      )}
      {special === "extra" && (
        <div className="fixed inset-0 z-30 overflow-auto bg-bg/80 p-4">
          <form
            role="dialog"
            aria-label="Extra point"
            className="mx-auto w-full max-w-xl rounded-2xl border border-line bg-surface p-4"
            onSubmit={(event) => {
              event.preventDefault();
              logPlay();
            }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Extra point</h2>
              <button
                type="button"
                onClick={() => {
                  setSpecial(null);
                  patch({
                    type: resumeType,
                    possession: POSSESSION_PLAYS.has(resumeType),
                    tryPoints: 1,
                  });
                }}
                className="h-10 rounded-lg border border-line px-3 text-sm font-semibold"
              >
                Close
              </button>
            </div>
            <div className="mb-3">
              <Field label="Kicking team">
                <TeamSelect
                  teams={book.teams}
                  value={draft.offenseId}
                  onChange={(nextOffense) =>
                    setDraft((current) => ({ ...current, offenseId: nextOffense }))
                  }
                />
              </Field>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => patch({ tryPoints: 1 })}
                className={
                  "h-10 rounded-lg border px-3 text-sm font-semibold " +
                  (draft.tryPoints !== 2
                    ? "border-transparent bg-accent text-ink"
                    : "border-line bg-raised text-fg")
                }
              >
                1 point
              </button>
              <button
                type="button"
                onClick={() =>
                  patch({
                    tryPoints: 2,
                    ballTeamId: defense,
                    ballYard: "2",
                    snapTeamId: defense,
                    snapYard: "2",
                    seriesTeamId: defense,
                    seriesYard: "2",
                    lineManual: true,
                    lineTeamId: defense,
                    lineYard: "0",
                    distance: "2",
                  })
                }
                className={
                  "h-10 rounded-lg border px-3 text-sm font-semibold " +
                  (draft.tryPoints === 2
                    ? "border-transparent bg-accent text-ink"
                    : "border-line bg-raised text-fg")
                }
              >
                2 points from the 2
              </button>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <JerseyField
                id="try-player"
                label={draft.tryPoints === 2 ? "Ball carrier" : "Kicker"}
                value={draft.starter}
                hint={hint(draft.starter, book.players, offenseId)}
                onChange={(starter) => patch({ starter })}
              />
              {draft.tryPoints === 2 && (
                <JerseyField
                  id="try-target"
                  label="Target"
                  value={draft.target1}
                  hint={hint(draft.target1, book.players, offenseId)}
                  onChange={(target1) => patch({ target1 })}
                />
              )}
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => patch({ result: "downed" })}
                className={
                  "h-10 rounded-lg border px-3 text-sm font-semibold " +
                  (draft.result !== "incomplete"
                    ? "border-transparent bg-accent text-ink"
                    : "border-line bg-raised text-fg")
                }
              >
                Good
              </button>
              <button
                type="button"
                onClick={() => patch({ result: "incomplete" })}
                className={
                  "h-10 rounded-lg border px-3 text-sm font-semibold " +
                  (draft.result === "incomplete"
                    ? "border-transparent bg-accent text-ink"
                    : "border-line bg-raised text-fg")
                }
              >
                No good
              </button>
            </div>
            <p className="mb-4 font-serif text-lg leading-relaxed">
              {draft.starter.trim() ? preview : "Type the kicker."}
            </p>
            <button
              type="submit"
              disabled={!draft.starter.trim()}
              className="h-12 w-full rounded-xl bg-accent text-base font-bold text-ink disabled:opacity-40"
            >
              Log extra point
            </button>
          </form>
        </div>
      )}
      {askTime && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg/80 p-4">
          <form
            role="dialog"
            aria-label="Time"
            className="w-full max-w-sm rounded-2xl border border-line bg-surface p-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!promptTime.trim()) return;
              setAskTime(false);
              logPlay(promptTime);
              setPromptTime("");
            }}
          >
            <h2 className="mb-3 text-lg font-semibold">Time</h2>
            <input
              id="score-time"
              autoFocus
              value={promptTime}
              placeholder="8:42"
              onChange={(event) => setPromptTime(event.target.value)}
              className="mb-4 h-11 w-full rounded-lg border border-line bg-raised px-3"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAskTime(false)}
                className="h-11 rounded-lg border border-line px-4 text-sm font-semibold text-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!promptTime.trim()}
                className="h-11 rounded-lg bg-accent px-4 text-sm font-bold text-ink disabled:opacity-40"
              >
                Log
              </button>
            </div>
          </form>
        </div>
      )}
      {seasonOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-bg/80 p-4">
          <div
            role="dialog"
            aria-label="Season"
            className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-line bg-surface p-4"
          >
            <h2 className="mb-1 text-lg font-semibold">Season</h2>
            <p className="mb-3 text-sm text-muted">
              The browser copy can be wiped. Save a backup file to keep every season. Load that file on this or another computer.
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadBackup}
                className="h-11 rounded-lg bg-accent px-4 text-sm font-bold text-ink"
              >
                Save backup
              </button>
              <label className="flex h-11 cursor-pointer items-center rounded-lg border border-line px-4 text-sm font-semibold">
                Load backup
                <input
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    void file.text().then(chooseBackup);
                  }}
                />
              </label>
            </div>
            {backupNote && <p className="mb-3 text-sm text-muted">{backupNote}</p>}
            <p className="mb-3 text-sm text-muted">
              {season.closed ? "Stopped." : "Open."} {season.games.length} game
              {season.games.length === 1 ? "" : "s"}.
              {season.past.length > 0 ? ` ${season.past.length} saved season${season.past.length === 1 ? "" : "s"}.` : ""}
            </p>
            <div className="flex flex-col gap-2 overflow-auto">
              {[...season.games]
                .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
                .map((game) => {
                  const scores = teamScores(game.book);
                  const home = game.book.teams[0];
                  const away = game.book.teams[1];
                  const selected = game.id === season.activeId;
                  return (
                    <div
                      key={game.id}
                      className={
                        "flex items-center gap-2 rounded-xl border px-3 py-2 " +
                        (selected ? "border-accent bg-raised" : "border-line")
                      }
                    >
                      <input
                        type="date"
                        aria-label="Game date"
                        value={game.date}
                        onChange={(event) => {
                          const date = event.target.value;
                          setSeason((current) => ({
                            ...current,
                            games: current.games.map((item) =>
                              item.id === game.id ? { ...item, date } : item,
                            ),
                          }));
                        }}
                        className="h-9 rounded-md border border-line bg-bg px-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => openGame(game.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-sm font-semibold">
                          {home?.name || "Home"} vs {away?.name || "Away"}
                        </span>
                        <span className="text-xs text-muted">
                          {scores[home?.id ?? ""] ?? 0}–{scores[away?.id ?? ""] ?? 0}
                          {game.final ? " · Final" : " · In progress"}
                        </span>
                      </button>
                      <button
                        type="button"
                        disabled={season.games.length < 2}
                        onClick={() => removeGame(game.id)}
                        className="h-9 rounded-md border border-line px-2 text-xs font-semibold text-muted disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
            </div>
            {season.past.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
                  Saved seasons
                </p>
                <div className="flex flex-col gap-2">
                  {season.past.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openPast(item.id)}
                      className="rounded-xl border border-line px-3 py-2 text-left text-sm"
                    >
                      Stopped {item.stopped} · {item.label || seasonLabel(item.games, item.stopped)} · {item.games.length} game
                      {item.games.length === 1 ? "" : "s"}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming("start")}
                className="h-11 rounded-lg bg-accent px-4 text-sm font-bold text-ink"
              >
                Start season
              </button>
              <button
                type="button"
                onClick={() => setConfirming("stop")}
                disabled={season.closed}
                className="h-11 rounded-lg border border-line px-4 text-sm font-semibold disabled:opacity-40"
              >
                Stop season
              </button>
              <button
                type="button"
                onClick={() => setSeasonOpen(false)}
                className="h-11 rounded-lg border border-line px-4 text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {pendingBackup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg/80 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-4">
            <h2 className="mb-2 text-lg font-semibold">Load backup</h2>
            <p className="mb-4 text-sm text-muted">
              Replace what is in this browser with the file. It has {pendingBackup.past.length + 1} season
              {pendingBackup.past.length === 0 ? "" : "s"} and {pendingBackup.games.length} game
              {pendingBackup.games.length === 1 ? "" : "s"} in the open season.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingBackup(null)}
                className="h-11 rounded-lg border border-line px-4 text-sm font-semibold text-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setSeason(pendingBackup);
                  setPendingBackup(null);
                  setBackupNote("Backup loaded.");
                  setEditing(null);
                  setSpecial(null);
                }}
                className="h-11 rounded-lg bg-accent px-4 text-sm font-bold text-ink"
              >
                Load
              </button>
            </div>
          </div>
        </div>
      )}
      {confirming && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg/80 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-4">
            <h2 className="mb-2 text-lg font-semibold">
              {confirming === "final"
                ? "Complete game"
                : confirming === "stop"
                  ? "Stop season"
                  : "Start season"}
            </h2>
            <p className="mb-4 text-sm text-muted">
              {confirming === "final"
                ? "Mark this game final. The score and log stay. You will not be able to add plays."
                : confirming === "stop"
                  ? "Stop this season. The current game is marked final, and no new games can be added until you start another season."
                  : "Start a new season. This season is saved and can be opened later. The home roster is copied. The opponent roster starts empty."}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="h-11 rounded-lg border border-line px-4 text-sm font-semibold text-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirming === "final" ? completeGame : confirming === "stop" ? stopSeason : startSeason}
                className="h-11 rounded-lg bg-accent px-4 text-sm font-bold text-ink"
              >
                {confirming === "final" ? "Complete" : confirming === "stop" ? "Stop" : "Start"}
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmingNew && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-bg/80 p-4">
          <div
            role="dialog"
            aria-label="New game"
            className="w-full max-w-sm rounded-2xl border border-line bg-surface p-4"
          >
            <h2 className="mb-2 text-lg font-semibold">New game</h2>
            <p className="mb-4 text-sm text-muted">
              This adds the next game and marks this one final. The roster is copied, the ball goes on the 40, and the play is a kickoff.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmingNew(false)}
                className="h-11 rounded-lg border border-line px-4 text-sm font-semibold text-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={newGame}
                className="h-11 rounded-lg bg-accent px-4 text-sm font-bold text-ink"
              >
                Start game
              </button>
            </div>
          </div>
        </div>
      )}
      {exportOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-bg/80 p-4">
          <div
            role="dialog"
            aria-label="Export CSV"
            className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-line bg-surface p-4"
          >
            <h2 className="mb-2 text-lg font-semibold">Export CSV</h2>
            <p className="mb-3 text-sm text-muted">
              {book.plays.length === 0
                ? "The log is empty. Copy or download the header, or log a play first."
                : `${book.plays.length} play${book.plays.length === 1 ? "" : "s"}, oldest first.`}
            </p>
            <textarea
              readOnly
              value={csvText()}
              className="mb-4 min-h-40 w-full flex-1 rounded-lg border border-line bg-raised p-3 font-mono text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setExportOpen(false)}
                className="h-11 rounded-lg border border-line px-4 text-sm font-semibold text-muted"
              >
                Close
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(csvText());
                    setCopied(true);
                  } catch {
                    setCopied(false);
                  }
                }}
                className="h-11 rounded-lg border border-line px-4 text-sm font-semibold"
              >
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={downloadCsv}
                className="h-11 rounded-lg bg-accent px-4 text-sm font-bold text-ink"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
      {editing && (
        <PlayEditor
          play={editing}
          book={book}
          onCancel={() => setEditing(null)}
          onSave={(next) => {
            setBook((current) => ({
              ...current,
              plays: current.plays.map((item) => (item.id === next.id ? next : item)),
            }));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function hint(
  number: string,
  players: Player[],
  preferTeamId: string,
  strict = false,
): string {
  if (!number.trim()) return "";
  const name = lookupName(number, players, preferTeamId, strict);
  return name ? `${name} (${normNum(number)})` : normNum(number);
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-semibold tracking-wider text-muted uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function TeamSelect({
  teams,
  value,
  onChange,
  compact = false,
}: {
  teams: Team[];
  value: string;
  onChange: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "inline-flex" : "flex gap-2"}>
      {teams.map((team, index) => (
        <button
          key={team.id}
          type="button"
          onClick={() => onChange(team.id)}
          className={
            (compact
              ? "h-8 border px-2.5 text-xs " +
                (index === 0 ? "rounded-l-md " : "-ml-px ") +
                (index === teams.length - 1 ? "rounded-r-md " : "")
              : "h-11 min-w-0 flex-1 truncate rounded-lg border px-2 text-sm ") +
            "font-semibold " +
            (value === team.id
              ? "relative z-10 border-accent bg-accent text-ink"
              : "border-line bg-raised text-fg")
          }
        >
          {team.name || "Team"}
        </button>
      ))}
    </div>
  );
}

function JerseyField({
  id,
  label,
  value,
  hint: hintText,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  hint: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block w-16 shrink-0">
      <span className="mb-1 block truncate text-[10px] font-semibold tracking-wider text-muted uppercase">
        {label}
      </span>
      <input
        id={id}
        inputMode="numeric"
        value={value}
        placeholder="#"
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full rounded-md border border-line bg-raised px-1 text-center text-sm font-semibold"
      />
      {hintText ? (
        <span className="mt-1 block truncate text-xs text-muted">{hintText}</span>
      ) : null}
    </label>
  );
}

function placeFromPointer(
  event: { clientX: number; currentTarget: HTMLDivElement },
  flipped: boolean,
  onPlace: (progress: number) => void,
) {
  const rect = event.currentTarget.getBoundingClientRect();
  const ratio = (event.clientX - rect.left) / rect.width;
  const visual = Math.min(99, Math.max(1, Math.round(ratio * 100)));
  onPlace(flipped ? 100 - visual : visual);
}

function StatsSheet({ book, onClose }: { book: Book; onClose: () => void }) {
  const teams = gameStats(book);
  const kicking = teams.some((team) =>
    team.players.some(
      (player) => player.punts || player.kickoffs || player.fgAtt || player.xpAtt,
    ),
  );

  return (
    <div className="fixed inset-0 z-20 overflow-auto bg-bg/90 p-4 sm:p-6">
      <div
        role="dialog"
        aria-label="Stats"
        className="mx-auto w-full max-w-6xl rounded-2xl border border-line bg-surface p-4"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Stats</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg bg-accent px-4 text-sm font-bold text-ink"
          >
            Done
          </button>
        </div>
        <div className="grid gap-4">
          {teams.map((team) => (
            <section key={team.id} className="rounded-xl border border-line bg-bg p-4">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-semibold">{team.name}</h3>
                <p className="text-sm text-muted">
                  {team.score} points · {team.passYds} pass yds · {team.rushYds} rush yds
                </p>
              </div>
              {team.players.length === 0 ? (
                <p className="text-sm text-muted">No stats yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
                    <thead>
                      <tr className="text-xs tracking-wider text-muted uppercase">
                        <th className="py-2 pr-3 font-semibold">Player</th>
                        <th className="px-2 py-2 font-semibold">C-A</th>
                        <th className="px-2 py-2 font-semibold">Pass</th>
                        <th className="px-2 py-2 font-semibold">Car</th>
                        <th className="px-2 py-2 font-semibold">Rush</th>
                        <th className="px-2 py-2 font-semibold">Rec</th>
                        <th className="px-2 py-2 font-semibold">Yds</th>
                        <th className="px-2 py-2 font-semibold">TD</th>
                        <th className="px-2 py-2 font-semibold">Tkl</th>
                        <th className="px-2 py-2 font-semibold">Sack</th>
                        <th className="px-2 py-2 font-semibold">INT</th>
                        {kicking && <th className="px-2 py-2 font-semibold">Punt</th>}
                        {kicking && <th className="px-2 py-2 font-semibold">KO</th>}
                        {kicking && <th className="px-2 py-2 font-semibold">FG</th>}
                        {kicking && <th className="px-2 py-2 font-semibold">XP</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {team.players.map((player) => (
                        <tr key={player.label} className="border-t border-line">
                          <td className="py-2 pr-3 font-medium">{player.label}</td>
                          <td className="px-2 py-2 tabular-nums">
                            {player.att ? `${player.cmp}-${player.att}` : "—"}
                          </td>
                          <td className="px-2 py-2 tabular-nums">{player.att ? player.passYds : "—"}</td>
                          <td className="px-2 py-2 tabular-nums">{player.rush || "—"}</td>
                          <td className="px-2 py-2 tabular-nums">{player.rush ? player.rushYds : "—"}</td>
                          <td className="px-2 py-2 tabular-nums">{player.rec || "—"}</td>
                          <td className="px-2 py-2 tabular-nums">{player.rec ? player.recYds : "—"}</td>
                          <td className="px-2 py-2 tabular-nums">{player.td || "—"}</td>
                          <td className="px-2 py-2 tabular-nums">{player.tackles || "—"}</td>
                          <td className="px-2 py-2 tabular-nums">{player.sacks || "—"}</td>
                          <td className="px-2 py-2 tabular-nums">{player.int || "—"}</td>
                          {kicking && (
                            <td className="px-2 py-2 tabular-nums">{player.punts || "—"}</td>
                          )}
                          {kicking && (
                            <td className="px-2 py-2 tabular-nums">{player.kickoffs || "—"}</td>
                          )}
                          {kicking && (
                            <td className="px-2 py-2 tabular-nums">
                              {player.fgAtt ? `${player.fg}-${player.fgAtt}` : "—"}
                            </td>
                          )}
                          {kicking && (
                            <td className="px-2 py-2 tabular-nums">
                              {player.xpAtt ? `${player.xp}-${player.xpAtt}` : "—"}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function EndZone({ name, score }: { name: string; score: number }) {
  return (
    <div className="flex w-[4.75rem] shrink-0 flex-col items-center justify-center gap-1 bg-[#0e2a4a] px-1 text-white">
      <span className="text-3xl font-bold leading-none tabular-nums">{score}</span>
      <span className="max-w-full truncate text-center text-[10px] font-bold tracking-wide uppercase">
        {name || "Team"}
      </span>
    </div>
  );
}

function FieldBoard({
  offenseName,
  defenseName,
  offenseScore,
  defenseScore,
  ball,
  series,
  firstDown,
  kick,
  flipped,
  quarter,
  onQuarter,
  placeMode,
  onPlaceMode,
  onFlip,
  onPlace,
}: {
  offenseName: string;
  defenseName: string;
  offenseScore: number;
  defenseScore: number;
  ball: number;
  series: number;
  firstDown: number;
  kick: number | null;
  flipped: boolean;
  quarter: string;
  onQuarter: (quarter: string) => void;
  placeMode: "ball" | "start" | "line" | "kick";
  onPlaceMode: (mode: "ball" | "start" | "line" | "kick") => void;
  onFlip: () => void;
  onPlace: (progress: number) => void;
}) {
  const view = (yard: number) => (flipped ? 100 - yard : yard);
  const numbers = [10, 20, 30, 40, 50, 40, 30, 20, 10];
  const leftName = flipped ? defenseName : offenseName;
  const rightName = flipped ? offenseName : defenseName;
  const leftScore = flipped ? defenseScore : offenseScore;
  const rightScore = flipped ? offenseScore : defenseScore;

  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <div className="flex h-36 sm:h-40">
        <EndZone name={leftName} score={leftScore} />
        <div
          role="slider"
          aria-label="Ball spot"
          aria-valuemin={1}
          aria-valuemax={99}
          aria-valuenow={Math.round(view(ball))}
          tabIndex={0}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            placeFromPointer(event, flipped, onPlace);
          }}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            placeFromPointer(event, flipped, onPlace);
          }}
          onKeyDown={(event) => {
            const step = flipped ? -1 : 1;
            if (event.key === "ArrowRight") onPlace(Math.min(99, Math.max(1, Math.round(ball) + step)));
            if (event.key === "ArrowLeft") onPlace(Math.min(99, Math.max(1, Math.round(ball) - step)));
          }}
          className="relative min-w-0 flex-1 cursor-crosshair"
          style={{
            background:
              "repeating-linear-gradient(90deg, #1b6b38 0px, #1b6b38 8px, #166233 8px, #166233 16px)",
          }}
        >
          {Array.from({ length: 19 }, (_, index) => index + 1).map((step) => (
            <span
              key={step}
              className={
                "pointer-events-none absolute inset-y-0 w-px " +
                (step % 2 === 0 ? "bg-white/80" : "bg-white/30")
              }
              style={{ left: `${step * 5}%` }}
            />
          ))}
          <span className="pointer-events-none absolute top-[28%] right-0 left-0 h-px bg-white/50" />
          <span className="pointer-events-none absolute bottom-[28%] right-0 left-0 h-px bg-white/50" />
          {numbers.map((label, index) => (
            <span
              key={`${label}-${index}`}
              className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-bold text-white/90"
              style={{ left: `${(index + 1) * 10}%` }}
            >
              {label}
            </span>
          ))}
          <span
            className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-[#f5c518]"
            style={{ left: `${view(series)}%` }}
          />
          <span
            className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-[#e10600]"
            style={{ left: `${view(firstDown)}%` }}
          />
          {kick !== null && (
            <span
              className="pointer-events-none absolute inset-y-0 z-10 w-0.5 border-l-2 border-dashed border-white"
              style={{ left: `${view(kick)}%` }}
            />
          )}
          <svg
            viewBox="0 0 36 22"
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 z-20 h-5 w-8 -translate-x-1/2 -translate-y-1/2 drop-shadow"
            style={{ left: `${view(ball)}%` }}
          >
            <ellipse cx="18" cy="11" rx="16" ry="8" fill="#6b3410" stroke="#3a1c08" strokeWidth="1" />
            <path d="M18 5.5v11" stroke="white" strokeWidth="1.2" />
            <path d="M14.5 8h7M14.5 11h7M14.5 14h7" stroke="white" strokeWidth="1.1" />
          </svg>
        </div>
        <EndZone name={rightName} score={rightScore} />
      </div>
      <div className="flex items-center justify-between gap-2 bg-surface px-3 py-2">
        <div className="flex items-center gap-1">
          {["1", "2", "3", "4", "OT"].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onQuarter(q)}
              className={
                "h-7 min-w-7 rounded-md border px-1.5 text-xs font-semibold " +
                (quarter === q
                  ? "border-transparent bg-accent text-ink"
                  : "border-line bg-raised text-fg")
              }
            >
              {q}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {(
            [
              ["ball", "Ball"],
              ["start", "Start"],
              ["line", "1st down"],
              ...(kick !== null ? [["kick", "Kick line"] as const] : []),
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onPlaceMode(id)}
              className={
                "h-7 rounded-md border px-2 text-xs font-semibold " +
                (placeMode === id
                  ? "border-transparent bg-accent text-ink"
                  : "border-line bg-raised text-fg")
              }
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onFlip}
          className="h-7 shrink-0 rounded-md border border-line px-2 text-xs font-semibold"
        >
          Flip ends
        </button>
      </div>
    </div>
  );
}

function PlayEditor({
  play,
  book,
  onSave,
  onCancel,
}: {
  play: LoggedPlay;
  book: Book;
  onSave: (play: LoggedPlay) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Draft>(() => draftFromPlay(play, book));
  const [text, setText] = useState(play.sentence);
  const [custom, setCustom] = useState(false);
  const offense = form.offenseId;
  const defense = defenseId(book, offense);

  function update(partial: Partial<Draft>) {
    setForm((current) => {
      const next = { ...current, ...partial };
      if (!custom) {
        setText(next.starter.trim() ? sentenceFrom(book, next) : play.sentence);
      }
      return next;
    });
  }

  function save() {
    if (playNeedsTime(form) && !form.scoreTime.trim()) return;
    const sentence = custom || !form.starter.trim() ? text : sentenceFrom(book, form);
    onSave({
      ...play,
      quarter: form.quarter,
      down: form.down,
      distance: form.distance,
      sentence,
      snapshot: snapshotFrom(form, form.scoreTime.trim()),
    });
  }

  const chip = (on: boolean) =>
    "h-10 shrink-0 rounded-lg border px-2.5 text-sm font-semibold whitespace-nowrap " +
    (on ? "border-transparent bg-accent text-ink" : "border-line bg-raised text-fg");

  return (
    <div className="fixed inset-0 z-40 overflow-auto bg-bg/80 p-4 sm:p-6">
      <form
        role="dialog"
        aria-label="Edit play"
        className="mx-auto w-full max-w-6xl rounded-2xl border border-line bg-surface p-4"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Edit play</h2>
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-lg border border-line px-4 text-sm font-semibold text-muted"
          >
            Cancel
          </button>
        </div>
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
              Quarter
            </p>
            <div className="flex flex-wrap gap-2">
              {["1", "2", "3", "4", "OT"].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => update({ quarter: q })}
                  className={chip(form.quarter === q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">Down</p>
            <div className="flex flex-wrap gap-2">
              {["1", "2", "3", "4"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => update({ down: d })}
                  className={chip(form.down === d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="w-24">
            <Field label="To go">
              <input
                inputMode="numeric"
                value={form.distance}
                onChange={(event) => update({ distance: event.target.value })}
                className="h-10 w-full rounded-lg border border-line bg-raised px-2"
              />
            </Field>
          </div>
        </div>
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <Field label={kickingPlay(form.type) ? "Kicking team" : "Offense"}>
            <TeamSelect
              teams={book.teams}
              value={form.offenseId}
              onChange={(offenseId) => update({ offenseId })}
            />
          </Field>
          <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2">
            <Field label={form.type === "Kickoff" ? "Kick from" : "Ball on"}>
              <TeamSelect
                teams={book.teams}
                value={form.snapTeamId}
                onChange={(snapTeamId) => update({ snapTeamId })}
              />
            </Field>
            <Field label="Yard">
              <input
                inputMode="numeric"
                value={form.snapYard}
                onChange={(event) => update({ snapYard: event.target.value })}
                className="h-11 w-full rounded-lg border border-line bg-raised px-2 text-center"
              />
            </Field>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2">
            <Field label={form.type === "Kickoff" ? "Tackle" : "Spot"}>
              <TeamSelect
                teams={book.teams}
                value={form.ballTeamId}
                onChange={(ballTeamId) => update({ ballTeamId })}
              />
            </Field>
            <Field label="Yard">
              <input
                inputMode="numeric"
                value={form.ballYard}
                onChange={(event) => update({ ballYard: event.target.value })}
                className="h-11 w-full rounded-lg border border-line bg-raised px-2 text-center"
              />
            </Field>
          </div>
        </div>
        <p className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">Play</p>
        <div className="mb-4 flex flex-nowrap gap-2 overflow-x-auto">
          {PLAY_BUTTONS.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() =>
                update({
                  type,
                  possession: POSSESSION_PLAYS.has(type) ? true : form.possession,
                })
              }
              className={chip(form.type === type)}
            >
              {type}
            </button>
          ))}
        </div>
        <p className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">Result</p>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {RESULTS.filter((item) => RESULT_MAIN.has(item.id)).map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() =>
                update({
                  result: result.id,
                  possession: TURNOVER_RESULTS.has(result.id),
                })
              }
              className={chip(form.result === result.id)}
            >
              {result.label}
            </button>
          ))}
          <select
            aria-label="More results"
            value={RESULT_MORE.some((item) => item.id === form.result) ? form.result : ""}
            onChange={(event) => {
              const id = event.target.value as ResultKind;
              if (!id) return;
              update({
                result: id,
                possession: TURNOVER_RESULTS.has(id),
                ...(id === "touchback" && kickingPlay(form.type)
                  ? { ballTeamId: defenseId(book, form.offenseId), ballYard: "20" }
                  : {}),
              });
            }}
            className="h-10 rounded-lg border border-line bg-raised px-2 text-sm font-semibold"
          >
            <option value="">More</option>
            {RESULT_MORE.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <span aria-hidden="true" className="mx-1 h-8 w-px shrink-0 bg-line" />
          <button
            type="button"
            onClick={() => update({ possession: !form.possession })}
            className={chip(form.possession)}
          >
            Possession
          </button>
          <span aria-hidden="true" className="mx-1 h-8 w-px shrink-0 bg-line" />
          <button
            type="button"
            onClick={() => update({ result: "touchdown", possession: false })}
            className={chip(form.result === "touchdown")}
          >
            Touchdown
          </button>
        </div>
        {playNeedsTime(form) && (
          <div className="mb-4 max-w-40">
            <Field label="Time">
              <input
                value={form.scoreTime}
                placeholder="8:42"
                onChange={(event) => update({ scoreTime: event.target.value })}
                className="h-11 w-full rounded-lg border border-line bg-raised px-3"
              />
            </Field>
          </div>
        )}
        <div className="mb-3 grid grid-cols-3 gap-2">
          <JerseyField
            id="edit-starter"
            label={startLabel(form.type)}
            value={form.starter}
            hint={hint(form.starter, book.players, offense)}
            onChange={(starter) => update({ starter })}
          />
          <JerseyField
            id="edit-target-1"
            label={kickingPlay(form.type) ? "Receiver" : "Target"}
            value={form.target1}
            hint={hint(form.target1, book.players, kickingPlay(form.type) ? defense : offense)}
            onChange={(target1) => update({ target1 })}
          />
          <JerseyField
            id="edit-target-2"
            label={kickingPlay(form.type) ? "Receiver 2" : "Target 2"}
            value={form.target2}
            hint={hint(form.target2, book.players, kickingPlay(form.type) ? defense : offense)}
            onChange={(target2) => update({ target2 })}
          />
        </div>
        <div className="mb-4 grid grid-cols-3 gap-2">
          <JerseyField
            id="edit-tackler-1"
            label="Tackler"
            value={form.tackler1}
            hint={hint(
              form.tackler1,
              book.players,
              kickingPlay(form.type) ? offense : defense,
              kickingPlay(form.type),
            )}
            onChange={(tackler1) => update({ tackler1 })}
          />
          <JerseyField
            id="edit-tackler-2"
            label="Tackler 2"
            value={form.tackler2}
            hint={hint(
              form.tackler2,
              book.players,
              kickingPlay(form.type) ? offense : defense,
              kickingPlay(form.type),
            )}
            onChange={(tackler2) => update({ tackler2 })}
          />
          <JerseyField
            id="edit-tackler-3"
            label="Tackler 3"
            value={form.tackler3}
            hint={hint(
              form.tackler3,
              book.players,
              kickingPlay(form.type) ? offense : defense,
              kickingPlay(form.type),
            )}
            onChange={(tackler3) => update({ tackler3 })}
          />
        </div>
        <label className="mb-4 block">
          <span className="mb-2 block text-xs font-semibold tracking-wider text-muted uppercase">
            This play
          </span>
          <textarea
            value={text}
            rows={3}
            onChange={(event) => {
              setCustom(true);
              setText(event.target.value);
            }}
            className="w-full rounded-lg border border-line bg-raised px-3 py-2 font-serif text-lg leading-relaxed"
          />
        </label>
        <button
          type="submit"
          disabled={playNeedsTime(form) && !form.scoreTime.trim()}
          className="h-12 w-full rounded-xl bg-accent text-base font-bold text-ink disabled:opacity-40"
        >
          Save play
        </button>
      </form>
    </div>
  );
}

function draftFromPlay(play: LoggedPlay, book: Book): Draft {
  const base = emptyDraft(book);
  if (!play.snapshot) {
    return {
      ...base,
      quarter: play.quarter,
      down: play.down,
      distance: play.distance,
    };
  }
  return {
    ...base,
    ...play.snapshot,
    seriesTeamId: play.snapshot.snapTeamId,
    seriesYard: play.snapshot.snapYard,
  };
}
