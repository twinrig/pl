import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CuqGju-J.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PLAY_TYPES = [
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
	"Kneel"
];
function normNum(value) {
	const trimmed = value.trim();
	if (/^\d+$/.test(trimmed)) return String(Number(trimmed));
	return trimmed;
}
function formatAthlete(number, name) {
	const n = normNum(number);
	if (!n) return "";
	const label = name?.trim();
	if (label) return `${label} (${n})`;
	return n;
}
function lookupName(number, players, preferTeamId, strict = false) {
	const n = normNum(number);
	if (!n) return null;
	const hits = players.filter((p) => normNum(p.number) === n);
	return (strict ? hits.find((p) => p.teamId === preferTeamId) : hits.find((p) => p.teamId === preferTeamId) ?? hits[0])?.name?.trim() || null;
}
function labelFor(number, players, preferTeamId, strict = false) {
	const n = number.trim();
	if (!n) return "";
	return formatAthlete(n, lookupName(n, players, preferTeamId, strict));
}
function spot(team, yard) {
	const side = team.trim();
	const line = yard.trim();
	if (side && line) return `${side} ${line}`;
	return side || line;
}
function joinAnd(parts) {
	const list = parts.filter(Boolean);
	if (list.length <= 1) return list[0] ?? "";
	if (list.length === 2) return `${list[0]} and ${list[1]}`;
	return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}
function joinComma(parts) {
	return parts.filter(Boolean).join(",");
}
function buildSentence(input) {
	const ball = spot(input.ballTeam, input.ballYard);
	const end = spot(input.endTeam, input.endYard);
	const lead = input.type === "Kickoff" ? "" : ball ? `Ball on the ${ball}.` : "Ball snapped.";
	const starter = input.starter.trim();
	const toClause = joinAnd(input.targets);
	const tacklers = joinComma(input.tacklers);
	const from = starter ? ` from ${starter}` : "";
	const to = toClause ? ` to ${toClause}` : "";
	const by = tacklers ? ` by ${tacklers}` : "";
	let action = "";
	if (input.type === "Pass" && input.result === "incomplete") action = `Incomplete pass${from}${to}`;
	else if (input.type === "Pass") {
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
	} else if (input.type === "Sack") {
		action = starter ? `Sack of ${starter}` : "Sack";
		action += by;
		if (end) action += ` on the ${end}`;
	} else if (input.type === "Interception") {
		action = `Pass${from}${to} intercepted${by}`;
		if (end) action += ` on the ${end}`;
		if (input.result === "touchdown") action += " for a touchdown";
	} else if (input.type === "Fumble") {
		action = starter ? `Fumble by ${starter}` : "Fumble";
		if (end) action += ` on the ${end}`;
		if (tacklers) action += ` recovered by ${tacklers}`;
	} else if (input.type === "Punt") {
		const receivers = joinAnd(input.targets);
		const receiverWord = input.targets.filter(Boolean).length > 1 ? "receivers" : "receiver";
		action = starter ? `Punt from punter ${starter}` : "Punt";
		if (receivers) action += ` to ${receiverWord} ${receivers}`;
		if (input.result === "touchdown") action += " for a touchdown";
		else if (input.result === "out-of-bounds") action += end ? ` out of bounds on the ${end}` : " out of bounds";
		else if (input.result === "downed") {
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
		else if (input.result === "out-of-bounds") action += end ? ` out of bounds on the ${end}` : " out of bounds";
		else if (input.result === "downed") {
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
		action = starter ? `Extra point by ${starter}` : "Extra point";
		if (input.result === "incomplete") action += " no good";
	} else if (input.type === "Safety") {
		action = starter ? `Safety by ${starter}` : "Safety";
		if (end) action += ` on the ${end}`;
	} else if (input.type === "Penalty") {
		action = starter ? `Penalty on ${starter}` : "Penalty";
		if (end) action += ` enforced to the ${end}`;
	} else if (input.type === "Kneel") {
		action = starter ? `Kneel by ${starter}` : "Kneel";
		if (end) action += ` on the ${end}`;
	} else {
		action = `${input.type}${starter ? ` by ${starter}` : ""}${to}`;
		if (end) action += ` on the ${end}`;
		action += by;
	}
	if (input.result === "out-of-bounds" && !/out of bounds/.test(action)) action += " out of bounds";
	if (input.result === "touchdown") {
		if (!/touchdown/.test(action)) action += " for a touchdown";
	}
	const time = input.scoreTime?.trim();
	if (time) action += ` at ${time}`;
	return `${lead} ${action}.`.replace(/\s+/g, " ").trim();
}
function ordinalDown(down) {
	if (down === "1") return "1st";
	if (down === "2") return "2nd";
	if (down === "3") return "3rd";
	if (down === "4") return "4th";
	return down;
}
var PENALTIES = [
	{
		id: "false-start",
		label: "False start",
		yards: 5
	},
	{
		id: "offside",
		label: "Offside",
		yards: 5
	},
	{
		id: "encroachment",
		label: "Encroachment",
		yards: 5
	},
	{
		id: "delay",
		label: "Delay of game",
		yards: 5
	},
	{
		id: "illegal-procedure",
		label: "Illegal procedure",
		yards: 5
	},
	{
		id: "illegal-formation",
		label: "Illegal formation",
		yards: 5
	},
	{
		id: "illegal-motion",
		label: "Illegal motion",
		yards: 5
	},
	{
		id: "too-many",
		label: "Too many players",
		yards: 5
	},
	{
		id: "holding",
		label: "Holding",
		yards: 10
	},
	{
		id: "block-back",
		label: "Block in the back",
		yards: 10
	},
	{
		id: "illegal-block",
		label: "Illegal block",
		yards: 10
	},
	{
		id: "pass-interference",
		label: "Pass interference",
		yards: 15
	},
	{
		id: "face-mask",
		label: "Face mask",
		yards: 15
	},
	{
		id: "roughing-passer",
		label: "Roughing the passer",
		yards: 15
	},
	{
		id: "roughness",
		label: "Unnecessary roughness",
		yards: 15
	},
	{
		id: "personal",
		label: "Personal foul",
		yards: 15
	},
	{
		id: "unsportsmanlike",
		label: "Unsportsmanlike conduct",
		yards: 15
	},
	{
		id: "targeting",
		label: "Targeting",
		yards: 15
	}
];
function yardsGained(input) {
	if (!input.endYard.trim() || !input.ballYard.trim()) return null;
	const start = Number(input.ballYard);
	const end = Number(input.endYard);
	if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
	const fromOwnGoal = (sideId, yard) => sideId === input.offenseId ? yard : 100 - yard;
	return fromOwnGoal(input.endTeamId, end) - fromOwnGoal(input.ballTeamId, start);
}
function progressFromGoal(offenseId, teamId, yard) {
	if (!yard.trim()) return null;
	const n = Number(yard);
	if (!Number.isFinite(n)) return null;
	return teamId === offenseId ? n : 100 - n;
}
function spotAtProgress(offenseId, defenseId, progress) {
	const yard = Math.max(1, Math.min(99, Math.round(progress)));
	if (yard <= 50) return {
		teamId: offenseId,
		yard: String(yard)
	};
	return {
		teamId: defenseId,
		yard: String(100 - yard)
	};
}
function toGoFromSeries(offenseId, seriesTeamId, seriesYard, ballTeamId, ballYard) {
	const gained = yardsGained({
		offenseId,
		ballTeamId: seriesTeamId,
		ballYard: seriesYard,
		endTeamId: ballTeamId,
		endYard: ballYard
	});
	if (gained === null) return null;
	return String(Math.max(0, 10 - gained));
}
var OGORMAN_NAME = "O'Gorman";
var OGORMAN_ROSTER = [
	{
		number: "1",
		name: "Braylon Treasure"
	},
	{
		number: "2",
		name: "Carter Majeres"
	},
	{
		number: "3",
		name: "Chace Hermanson"
	},
	{
		number: "4",
		name: "Alex Christian"
	},
	{
		number: "5",
		name: "Brady Majeres"
	},
	{
		number: "6",
		name: "Tanner Charron"
	},
	{
		number: "7",
		name: "Rylan Cody"
	},
	{
		number: "8",
		name: "Zach Erickson"
	},
	{
		number: "9",
		name: "Drake Severson"
	},
	{
		number: "10",
		name: "Aaron Stoll"
	},
	{
		number: "11",
		name: "Benny Willers"
	},
	{
		number: "12",
		name: "Remington Jones"
	},
	{
		number: "13",
		name: "Oliver Klinkhammer"
	},
	{
		number: "14",
		name: "Isaac Myers"
	},
	{
		number: "15",
		name: "Abe Struck"
	},
	{
		number: "16",
		name: "Slaton Jones"
	},
	{
		number: "17",
		name: "Kelemente Pio"
	},
	{
		number: "18",
		name: "Javen Aalberg"
	},
	{
		number: "20",
		name: "Max Mebius"
	},
	{
		number: "23",
		name: "Easton Scheidt"
	},
	{
		number: "24",
		name: "Talec Schlimgen"
	},
	{
		number: "25",
		name: "Jack Fredrickson"
	},
	{
		number: "26",
		name: "Ian Farah"
	},
	{
		number: "27",
		name: "Corbin Hage"
	},
	{
		number: "28",
		name: "Teige Hilsenroth"
	},
	{
		number: "29",
		name: "Keanu Lee"
	},
	{
		number: "30",
		name: "Beau Bailey"
	},
	{
		number: "31",
		name: "Nolan Dexter"
	},
	{
		number: "32",
		name: "Cole Houser"
	},
	{
		number: "34",
		name: "Bennett Kerr"
	},
	{
		number: "35",
		name: "Christopher Roose"
	},
	{
		number: "40",
		name: "Jakob Pitzl"
	},
	{
		number: "42",
		name: "Thomas Theobald"
	},
	{
		number: "44",
		name: "Zack Schuler"
	},
	{
		number: "45",
		name: "Liam Fitzpatrick"
	},
	{
		number: "50",
		name: "Jason Trooien"
	},
	{
		number: "51",
		name: "Sam Paasch"
	},
	{
		number: "52",
		name: "Sam Donohoe"
	},
	{
		number: "54",
		name: "Kayen Hammer"
	},
	{
		number: "55",
		name: "Dawson Buller"
	},
	{
		number: "56",
		name: "Gavin Boyle"
	},
	{
		number: "57",
		name: "Hudson Muller"
	},
	{
		number: "58",
		name: "Ben Astrup"
	},
	{
		number: "59",
		name: "Bryson Wittry"
	},
	{
		number: "60",
		name: "Dillon Fitzgerald"
	},
	{
		number: "65",
		name: "Max Vortherms"
	},
	{
		number: "66",
		name: "Chase Haffeman"
	},
	{
		number: "67",
		name: "Emmett Flitz"
	},
	{
		number: "75",
		name: "David Malonga"
	},
	{
		number: "77",
		name: "Cooper Dowling"
	},
	{
		number: "84",
		name: "Weston Satter"
	}
];
function isOgorman(name) {
	return /o['’]?gorman/i.test(name);
}
function withOgorman(book) {
	const teams = book.teams.map((team) => ({ ...team }));
	let team = teams.find((item) => isOgorman(item.name)) ?? teams.find((item) => item.name === "Home") ?? teams[0];
	if (!team) return book;
	team.name = OGORMAN_NAME;
	const players = book.players.map((player) => ({ ...player }));
	for (const row of OGORMAN_ROSTER) {
		const existing = players.find((player) => player.teamId === team.id && normNum(player.number) === row.number);
		if (existing) {
			existing.name = row.name;
			existing.number = row.number;
		} else players.push({
			id: `ogorman-${row.number}`,
			teamId: team.id,
			number: row.number,
			name: row.name
		});
	}
	return {
		...book,
		teams,
		players
	};
}
var WASHINGTON_NAME = "Washington";
var WASHINGTON_ROSTER = [
	{
		number: "0",
		name: "Justin Rodriguez"
	},
	{
		number: "1",
		name: "Samuel Bowen"
	},
	{
		number: "3",
		name: "Kobe Gully"
	},
	{
		number: "4",
		name: "Kaden Carroll"
	},
	{
		number: "5",
		name: "Darius Harrison"
	},
	{
		number: "6",
		name: "Bronson Schramm"
	},
	{
		number: "7",
		name: "Luis Vazquez"
	},
	{
		number: "8",
		name: "Godwin Zephania"
	},
	{
		number: "9",
		name: "Chase Comp"
	},
	{
		number: "10",
		name: "Miles Smith"
	},
	{
		number: "11",
		name: "Dezman Wilka"
	},
	{
		number: "12",
		name: "Ryder Dobberpuhl"
	},
	{
		number: "13",
		name: "Graham Frederiksen"
	},
	{
		number: "14",
		name: "Kacyn Larson"
	},
	{
		number: "15",
		name: "Caden Sporrer"
	},
	{
		number: "16",
		name: "Rylan Kvistero"
	},
	{
		number: "17",
		name: "Broxsen McVay"
	},
	{
		number: "18",
		name: "Isayah Everette"
	},
	{
		number: "19",
		name: "Carter Wentzel"
	},
	{
		number: "21",
		name: "Brett Pankonin"
	},
	{
		number: "22",
		name: "Caeden Consoer"
	},
	{
		number: "23",
		name: "Cole Hauser"
	},
	{
		number: "24",
		name: "Biniam Mekuria"
	},
	{
		number: "25",
		name: "Elijah McMahan"
	},
	{
		number: "26",
		name: "Ojeir Agwa"
	},
	{
		number: "27",
		name: "Masen Jennings"
	},
	{
		number: "28",
		name: "Jordan Patterson"
	},
	{
		number: "29",
		name: "Erdi Maliqi"
	},
	{
		number: "30",
		name: "Kaden Hill"
	},
	{
		number: "31",
		name: "Gavin Knopf"
	},
	{
		number: "32",
		name: "Solomon Gayflor"
	},
	{
		number: "33",
		name: "Prince Gayetaye"
	},
	{
		number: "34",
		name: "Kingston Fabian"
	},
	{
		number: "35",
		name: "Charles McCloskey"
	},
	{
		number: "37",
		name: "Devin Walker"
	},
	{
		number: "40",
		name: "Carter Jongejeugd"
	},
	{
		number: "41",
		name: "Thomas Richardson"
	},
	{
		number: "42",
		name: "Eddie Morataya Lopez"
	},
	{
		number: "43",
		name: "Jacob Richardson"
	},
	{
		number: "44",
		name: "Kayavanh Khao-on"
	},
	{
		number: "45",
		name: "Collin Arens"
	},
	{
		number: "46",
		name: "Richard Ryken"
	},
	{
		number: "47",
		name: "Gavin Young"
	},
	{
		number: "48",
		name: "Elija Van Vooren"
	},
	{
		number: "50",
		name: "Zayden Lee"
	},
	{
		number: "51",
		name: "Matthew Melton"
	},
	{
		number: "52",
		name: "Stephen Tran"
	},
	{
		number: "53",
		name: "Madden Burkhardt"
	},
	{
		number: "54",
		name: "Lincoln Damm"
	},
	{
		number: "55",
		name: "Eli Boyd"
	},
	{
		number: "57",
		name: "Blake Knoff"
	},
	{
		number: "58",
		name: "Hayes Petersen"
	},
	{
		number: "59",
		name: "Michael Hoefert"
	},
	{
		number: "61",
		name: "Cole Malchow"
	},
	{
		number: "63",
		name: "Kenan Alberts"
	},
	{
		number: "64",
		name: "Kellby Haverhals"
	},
	{
		number: "65",
		name: "Chance Lauck"
	},
	{
		number: "67",
		name: "Mark Jauregui"
	},
	{
		number: "70",
		name: "Kevin Knoff"
	},
	{
		number: "71",
		name: "Parker Muth"
	},
	{
		number: "72",
		name: "Edward Petka"
	},
	{
		number: "74",
		name: "Noah Miller"
	},
	{
		number: "75",
		name: "Hudson Tirevold"
	},
	{
		number: "77",
		name: "Dhieu Gak"
	},
	{
		number: "78",
		name: "Kiir Mach"
	},
	{
		number: "79",
		name: "Cale Farmer"
	},
	{
		number: "80",
		name: "Machar Ijong"
	},
	{
		number: "82",
		name: "Aden Sambido"
	},
	{
		number: "84",
		name: "Zaki Dillard"
	},
	{
		number: "85",
		name: "Kalen Kvistero"
	},
	{
		number: "87",
		name: "Marcus Melton"
	},
	{
		number: "88",
		name: "Joshua Battle"
	}
];
function isWashington(name) {
	return /wash?ington/i.test(name);
}
function withWashington(book) {
	const teams = book.teams.map((team) => ({ ...team }));
	const ogorman = teams.find((team) => /o['’]?gorman/i.test(team.name));
	let team = teams.find((item) => isWashington(item.name)) ?? teams.find((item) => item !== ogorman && item.name === "Away") ?? teams.find((item) => item !== ogorman) ?? teams[1];
	if (!team) return book;
	team.name = WASHINGTON_NAME;
	const players = book.players.map((player) => ({ ...player }));
	for (const row of WASHINGTON_ROSTER) {
		const existing = players.find((player) => player.teamId === team.id && normNum(player.number) === row.number);
		if (existing) {
			existing.name = row.name;
			existing.number = row.number;
		} else players.push({
			id: `washington-${row.number}`,
			teamId: team.id,
			number: row.number,
			name: row.name
		});
	}
	return {
		...book,
		teams,
		players
	};
}
function withRosters(book) {
	return withWashington(withOgorman(book));
}
var STORAGE_KEY = "play-log-v2";
var RESULTS = [
	{
		id: "tackled",
		label: "Tackled"
	},
	{
		id: "incomplete",
		label: "Incomplete"
	},
	{
		id: "touchdown",
		label: "Touchdown"
	},
	{
		id: "downed",
		label: "Downed"
	},
	{
		id: "out-of-bounds",
		label: "Out of bounds"
	}
];
function fieldFlippedForQuarter(quarter) {
	return quarter === "2" || quarter === "4";
}
function playNeedsTime(draft) {
	if (draft.result === "touchdown") return true;
	if (draft.type === "Field goal" && draft.result !== "incomplete") return true;
	if (draft.type === "Safety") return true;
	if (draft.possession) return true;
	if (draft.type === "Interception" || draft.type === "Fumble" || draft.type === "Punt" || draft.type === "Kickoff") return true;
	return false;
}
var POSSESSION_PLAYS = /* @__PURE__ */ new Set([
	"Interception",
	"Fumble",
	"Punt",
	"Kickoff",
	"Safety"
]);
function emptyBook() {
	return withRosters({
		teams: [{
			id: "home",
			name: "Home"
		}, {
			id: "away",
			name: "Away"
		}],
		players: [],
		plays: []
	});
}
function emptyDraft(book) {
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
		tackler3: ""
	};
}
function snapshotFrom(draft, scoreTime) {
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
		tackler3: draft.tackler3
	};
}
function teamName(book, id) {
	return book.teams.find((t) => t.id === id)?.name ?? "";
}
function defenseId(book, offenseId) {
	return book.teams.find((t) => t.id !== offenseId)?.id ?? offenseId;
}
function kickingPlay(type) {
	return type === "Kickoff" || type === "Punt";
}
function startLabel(type) {
	if (type === "Kickoff") return "Kicker";
	if (type === "Punt") return "Punter";
	return "Offense start";
}
function sentenceFrom(book, draft) {
	const offense = draft.offenseId;
	const defense = defenseId(book, offense);
	const ballMoved = draft.ballTeamId !== draft.snapTeamId || normNum(draft.ballYard) !== normNum(draft.snapYard);
	const returnPlay = kickingPlay(draft.type);
	const skillTeam = returnPlay ? defense : offense;
	const tackleTeam = returnPlay ? offense : defense;
	return buildSentence({
		ballTeam: teamName(book, draft.snapTeamId),
		ballYard: draft.snapYard,
		endTeam: draft.type === "Kickoff" || ballMoved ? teamName(book, draft.ballTeamId) : "",
		endYard: draft.type === "Kickoff" || ballMoved ? draft.ballYard : "",
		type: draft.type,
		result: draft.result,
		scoreTime: draft.scoreTime,
		starter: labelFor(draft.starter, book.players, offense),
		targets: [draft.target1, draft.target2].map((n) => labelFor(n, book.players, skillTeam)).filter(Boolean),
		tacklers: [
			draft.tackler1,
			draft.tackler2,
			draft.tackler3
		].map((n) => labelFor(n, book.players, tackleTeam, returnPlay)).filter(Boolean)
	});
}
function loadBook() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed.teams) || parsed.teams.length < 2) return null;
		return withRosters({
			teams: parsed.teams.slice(0, 2),
			players: Array.isArray(parsed.players) ? parsed.players : [],
			plays: Array.isArray(parsed.plays) ? parsed.plays : []
		});
	} catch {
		return null;
	}
}
function PlayBook() {
	const [book, setBook] = (0, import_react.useState)(emptyBook);
	const [draft, setDraft] = (0, import_react.useState)(() => emptyDraft(emptyBook()));
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const [rosterNum, setRosterNum] = (0, import_react.useState)({});
	const [rosterName, setRosterName] = (0, import_react.useState)({});
	const [teamsOpen, setTeamsOpen] = (0, import_react.useState)(false);
	const [penaltyNumber, setPenaltyNumber] = (0, import_react.useState)("");
	const [penaltyId, setPenaltyId] = (0, import_react.useState)(PENALTIES[0].id);
	const [endsFlipped, setEndsFlipped] = (0, import_react.useState)(false);
	const [askTime, setAskTime] = (0, import_react.useState)(false);
	const [promptTime, setPromptTime] = (0, import_react.useState)("");
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [confirmingNew, setConfirmingNew] = (0, import_react.useState)(false);
	const [exportOpen, setExportOpen] = (0, import_react.useState)(false);
	const [copied, setCopied] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const saved = loadBook();
		if (saved) {
			setBook(saved);
			setDraft((d) => ({
				...d,
				offenseId: saved.teams[0]?.id ?? d.offenseId,
				ballTeamId: saved.teams[0]?.id ?? d.ballTeamId,
				seriesTeamId: saved.teams[0]?.id ?? d.seriesTeamId,
				snapTeamId: saved.teams[0]?.id ?? d.snapTeamId
			}));
		}
		setHydrated(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(book));
	}, [book, hydrated]);
	const preview = (0, import_react.useMemo)(() => sentenceFrom(book, draft), [book, draft]);
	function distanceFor(d, offenseId = d.offenseId) {
		return toGoFromSeries(offenseId, d.seriesTeamId, d.seriesYard, d.ballTeamId, d.ballYard) ?? d.distance;
	}
	function placeBall(teamId, yard) {
		setDraft((d) => {
			const next = {
				...d,
				ballTeamId: teamId,
				ballYard: yard
			};
			return {
				...next,
				distance: distanceFor(next)
			};
		});
	}
	function setDown(down) {
		setDraft((d) => {
			if (down !== "1") return {
				...d,
				down,
				distance: distanceFor({
					...d,
					down
				})
			};
			return {
				...d,
				down,
				distance: "10",
				seriesTeamId: d.ballTeamId,
				seriesYard: d.ballYard,
				snapTeamId: d.ballTeamId,
				snapYard: d.ballYard
			};
		});
	}
	function patch(partial) {
		setDraft((d) => ({
			...d,
			...partial
		}));
	}
	function renameTeam(id, name) {
		setBook((b) => ({
			...b,
			teams: b.teams.map((t) => t.id === id ? {
				...t,
				name
			} : t)
		}));
	}
	function addPlayer(teamId) {
		const number = normNum(rosterNum[teamId] ?? "");
		const name = (rosterName[teamId] ?? "").trim();
		if (!number || !name) return;
		setBook((b) => {
			const existing = b.players.find((p) => p.teamId === teamId && normNum(p.number) === number);
			const players = existing ? b.players.map((p) => p.id === existing.id ? {
				...p,
				name,
				number
			} : p) : [...b.players, {
				id: crypto.randomUUID(),
				teamId,
				number,
				name
			}];
			return {
				...b,
				players
			};
		});
		setRosterNum((m) => ({
			...m,
			[teamId]: ""
		}));
		setRosterName((m) => ({
			...m,
			[teamId]: ""
		}));
	}
	function removePlayer(id) {
		setBook((b) => ({
			...b,
			players: b.players.filter((p) => p.id !== id)
		}));
	}
	function logPlay(time) {
		if (!draft.starter.trim()) return;
		const scoreTime = (time ?? draft.scoreTime).trim();
		if (playNeedsTime(draft) && !scoreTime) {
			setPromptTime("");
			setAskTime(true);
			return;
		}
		const logged = {
			...draft,
			scoreTime
		};
		const play = {
			id: crypto.randomUUID(),
			quarter: draft.quarter,
			down: draft.down,
			distance: draft.distance,
			sentence: sentenceFrom(book, logged),
			snapshot: snapshotFrom(logged, scoreTime)
		};
		setBook((b) => ({
			...b,
			plays: [play, ...b.plays]
		}));
		setDraft((d) => {
			const gained = yardsGained({
				offenseId: d.offenseId,
				ballTeamId: d.seriesTeamId,
				ballYard: d.seriesYard,
				endTeamId: d.ballTeamId,
				endYard: d.ballYard
			});
			const madeLine = d.result === "touchdown" || gained !== null && gained >= 10;
			const turnover = d.type === "Punt" || d.type === "Kickoff" || d.possession && d.type !== "Safety";
			const next = {
				...d,
				snapTeamId: d.ballTeamId,
				snapYard: d.ballYard,
				scoreTime: "",
				possession: false,
				starter: "",
				target1: "",
				target2: "",
				tackler1: "",
				tackler2: "",
				tackler3: ""
			};
			if (turnover || madeLine || d.down === "4") return {
				...next,
				offenseId: turnover ? defenseId(book, d.offenseId) : d.offenseId,
				down: "1",
				distance: "10",
				seriesTeamId: d.ballTeamId,
				seriesYard: d.ballYard
			};
			return {
				...next,
				down: String(Number(d.down) + 1)
			};
		});
	}
	function addPenalty() {
		const number = penaltyNumber.trim();
		if (!number) return;
		const penalty = PENALTIES.find((item) => item.id === penaltyId) ?? PENALTIES[0];
		const sentence = `Penalty on ${labelFor(number, book.players)}, ${penalty.label.toLowerCase()}.`;
		const play = {
			id: crypto.randomUUID(),
			quarter: draft.quarter,
			down: draft.down,
			distance: draft.distance,
			sentence
		};
		setBook((b) => ({
			...b,
			plays: [play, ...b.plays]
		}));
		setPenaltyNumber("");
	}
	function undo(id) {
		setBook((b) => ({
			...b,
			plays: b.plays.filter((p) => p.id !== id)
		}));
	}
	function newGame() {
		const home = book.teams[0];
		const away = book.teams[1];
		const homeId = home?.id ?? "home";
		const marker = {
			id: crypto.randomUUID(),
			quarter: "",
			down: "",
			distance: "",
			sentence: `New Game - ${home?.name ?? "Home"} vs ${away?.name ?? "Away"}.`
		};
		setBook((b) => ({
			...b,
			plays: [marker]
		}));
		setDraft({
			...emptyDraft(book),
			offenseId: homeId,
			ballTeamId: homeId,
			ballYard: "40",
			seriesTeamId: homeId,
			seriesYard: "40",
			snapTeamId: homeId,
			snapYard: "40",
			type: "Kickoff",
			possession: true
		});
		setEndsFlipped(false);
		setConfirmingNew(false);
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
			"Log"
		];
		const cell = (value) => `"${value.replaceAll("\"", "\"\"")}"`;
		const rows = [...book.plays].reverse().map((play) => {
			const snap = play.snapshot;
			const defense = snap ? defenseId(book, snap.offenseId) : "";
			const kicking = snap ? kickingPlay(snap.type) : false;
			const skillTeam = snap ? kicking ? defense : snap.offenseId : "";
			const tackleTeam = snap ? kicking ? snap.offenseId : defense : "";
			const names = (numbers, teamId, strict = false) => numbers.map((number) => labelFor(number, book.players, teamId, strict)).filter(Boolean).join(", ");
			const result = snap ? RESULTS.find((item) => item.id === snap.result)?.label ?? snap.result : "";
			return [
				play.quarter,
				play.down,
				play.distance,
				snap?.type ?? "",
				result,
				snap ? labelFor(snap.starter, book.players, snap.offenseId) : "",
				snap ? names([snap.target1, snap.target2], skillTeam) : "",
				snap ? names([
					snap.tackler1,
					snap.tackler2,
					snap.tackler3
				], tackleTeam, kicking) : "",
				play.sentence
			].map((value) => cell(String(value))).join(",");
		});
		return [header.join(","), ...rows].join("\n");
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-wide",
					children: "Play Log"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Type jersey numbers. A known number becomes Name (number)."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setTeamsOpen(true),
							className: "h-11 rounded-lg border border-line bg-raised px-4 text-sm font-semibold",
							children: "Teams"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								setCopied(false);
								setExportOpen(true);
							},
							className: "h-11 rounded-lg border border-line bg-raised px-4 text-sm font-semibold",
							children: "Export CSV"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setConfirmingNew(true),
							className: "h-11 rounded-lg border border-line bg-raised px-4 text-sm font-semibold",
							children: "New game"
						})
					]
				})]
			}),
			teamsOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-20 overflow-auto bg-bg/90 p-4 sm:p-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "dialog",
					"aria-label": "Teams",
					className: "mx-auto w-full max-w-3xl rounded-2xl border border-line bg-surface p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-4 flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-semibold",
							children: "Teams"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setTeamsOpen(false),
							className: "h-11 rounded-lg bg-accent px-4 text-sm font-bold text-ink",
							children: "Done"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-4 md:grid-cols-2",
						children: book.teams.map((team) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-xl border border-line bg-bg p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "mb-1 block text-xs font-semibold tracking-wider text-muted uppercase",
									children: "Team"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									"aria-label": `${team.id} team name`,
									value: team.name,
									onChange: (e) => renameTeam(team.id, e.target.value),
									className: "mb-3 h-11 w-full rounded-lg border border-line bg-raised px-3 font-semibold"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-3 flex gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											"aria-label": `${team.name} jersey`,
											inputMode: "numeric",
											placeholder: "#",
											value: rosterNum[team.id] ?? "",
											onChange: (e) => setRosterNum((m) => ({
												...m,
												[team.id]: e.target.value
											})),
											className: "h-11 w-16 rounded-lg border border-line bg-raised px-2 text-center"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											"aria-label": `${team.name} player name`,
											placeholder: "Name",
											value: rosterName[team.id] ?? "",
											onChange: (e) => setRosterName((m) => ({
												...m,
												[team.id]: e.target.value
											})),
											onKeyDown: (e) => {
												if (e.key === "Enter") addPlayer(team.id);
											},
											className: "h-11 min-w-0 flex-1 rounded-lg border border-line bg-raised px-3"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => addPlayer(team.id),
											className: "h-11 rounded-lg bg-accent px-3 text-sm font-bold text-ink",
											children: "Add"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
									className: "flex flex-col gap-1",
									children: [book.players.filter((p) => p.teamId === team.id).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center justify-between gap-2 rounded-lg px-1 py-1 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "mr-2 font-semibold text-accent",
											children: p.number
										}), p.name] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-label": `Remove ${p.name}`,
											onClick: () => removePlayer(p.id),
											className: "h-8 px-2 text-muted",
											children: "Remove"
										})]
									}, p.id)), book.players.every((p) => p.teamId !== team.id) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
										className: "text-sm text-muted",
										children: "No players yet."
									})]
								})
							]
						}, team.id))
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto flex max-w-6xl flex-col gap-4 p-4 sm:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldBoard, {
						offenseName: teamName(book, draft.offenseId),
						defenseName: teamName(book, defenseId(book, draft.offenseId)),
						flipped: endsFlipped,
						onFlip: () => setEndsFlipped((value) => !value),
						ball: progressFromGoal(draft.offenseId, draft.ballTeamId, draft.ballYard) ?? 25,
						series: progressFromGoal(draft.offenseId, draft.seriesTeamId, draft.seriesYard) ?? 25,
						onPlace: (progress) => {
							const spot = spotAtProgress(draft.offenseId, defenseId(book, draft.offenseId), progress);
							placeBall(spot.teamId, spot.yard);
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "rounded-2xl border border-line bg-surface p-4",
						onSubmit: (e) => {
							e.preventDefault();
							logPlay();
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-4 flex flex-wrap items-end gap-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mb-2 text-xs font-semibold tracking-wider text-muted uppercase",
										children: "Quarter"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex flex-wrap gap-2",
										children: [
											"1",
											"2",
											"3",
											"4",
											"OT"
										].map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => {
												patch({ quarter: q });
												if (q !== draft.quarter) setEndsFlipped(fieldFlippedForQuarter(q));
											},
											className: "h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold " + (draft.quarter === q ? "border-transparent bg-accent text-ink" : "border-line bg-raised text-fg"),
											children: q
										}, q))
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mb-2 text-xs font-semibold tracking-wider text-muted uppercase",
										children: "Down"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex flex-wrap gap-2",
										children: [
											"1",
											"2",
											"3",
											"4"
										].map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setDown(d),
											className: "h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold " + (draft.down === d ? "border-transparent bg-accent text-ink" : "border-line bg-raised text-fg"),
											children: d
										}, d))
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-24",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: "To go",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												inputMode: "numeric",
												value: draft.distance,
												onChange: (e) => patch({ distance: e.target.value }),
												className: "h-10 w-full rounded-lg border border-line bg-raised px-2"
											})
										})
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-4 grid gap-2 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: kickingPlay(draft.type) ? "Kicking team" : "Offense",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamSelect, {
										teams: book.teams,
										value: draft.offenseId,
										onChange: (offenseId) => setDraft((current) => ({
											...current,
											offenseId,
											distance: distanceFor(current, offenseId)
										}))
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-2",
									children: [draft.type === "Kickoff" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: "Kick from",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamSelect, {
												teams: book.teams,
												value: draft.snapTeamId,
												onChange: (snapTeamId) => patch({ snapTeamId })
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: "Yard",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												inputMode: "numeric",
												value: draft.snapYard,
												onChange: (e) => patch({ snapYard: e.target.value }),
												className: "h-11 w-full rounded-lg border border-line bg-raised px-2 text-center"
											})
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: draft.type === "Kickoff" ? "Tackle" : "Ball on",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamSelect, {
												teams: book.teams,
												value: draft.ballTeamId,
												onChange: (ballTeamId) => placeBall(ballTeamId, draft.ballYard)
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: "Yard",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												id: "ball-yard",
												inputMode: "numeric",
												value: draft.ballYard,
												onChange: (e) => placeBall(draft.ballTeamId, e.target.value),
												className: "h-11 w-full rounded-lg border border-line bg-raised px-2 text-center"
											})
										})]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-2 text-xs font-semibold tracking-wider text-muted uppercase",
								children: "Play"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mb-4 flex flex-nowrap gap-2",
								children: PLAY_TYPES.map((type) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => patch({
										type,
										possession: POSSESSION_PLAYS.has(type) ? true : draft.possession
									}),
									className: "h-10 shrink-0 rounded-lg border px-2.5 text-sm font-semibold whitespace-nowrap " + (draft.type === type ? "border-transparent bg-accent text-ink" : "border-line bg-raised text-fg"),
									children: type
								}, type))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-4 grid items-start gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mb-2 text-xs font-semibold tracking-wider text-muted uppercase",
									children: "Result"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-2",
									children: [RESULTS.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => patch({ result: r.id }),
										className: "h-10 rounded-lg border px-3 text-sm font-semibold " + (draft.result === r.id ? "border-transparent bg-accent text-ink" : "border-line bg-raised text-fg"),
										children: r.label
									}, r.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => patch({ possession: !draft.possession }),
										className: "h-10 rounded-lg border px-3 text-sm font-semibold " + (draft.possession ? "border-transparent bg-accent text-ink" : "border-line bg-raised text-fg"),
										children: "Possession"
									})]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mb-2 text-xs font-semibold tracking-wider text-muted uppercase",
									children: "Penalty"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-end gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "block w-16",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "sr-only",
												children: "Number"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												id: "penalty-number",
												inputMode: "numeric",
												placeholder: "#",
												"aria-label": "Penalty number",
												value: penaltyNumber,
												onChange: (e) => setPenaltyNumber(e.target.value),
												className: "h-10 w-full rounded-lg border border-line bg-raised px-2 text-center font-semibold"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "block min-w-36 flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "sr-only",
												children: "Penalty"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
												id: "penalty-type",
												"aria-label": "Penalty",
												value: penaltyId,
												onChange: (e) => setPenaltyId(e.target.value),
												className: "h-10 w-full rounded-lg border border-line bg-raised px-2 text-sm",
												children: PENALTIES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: item.id,
													children: item.label
												}, item.id))
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: addPenalty,
											disabled: !penaltyNumber.trim(),
											className: "h-10 rounded-lg bg-accent px-3 text-sm font-bold text-ink disabled:opacity-40",
											children: "Add"
										})
									]
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-3 grid grid-cols-3 gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JerseyField, {
										id: "starter",
										label: startLabel(draft.type),
										value: draft.starter,
										hint: hint(draft.starter, book.players, offenseId),
										onChange: (starter) => patch({ starter })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JerseyField, {
										id: "target-1",
										label: kickingPlay(draft.type) ? "Receiver" : "Target",
										value: draft.target1,
										hint: hint(draft.target1, book.players, kickingPlay(draft.type) ? defense : offenseId),
										onChange: (target1) => patch({ target1 })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JerseyField, {
										id: "target-2",
										label: kickingPlay(draft.type) ? "Receiver 2" : "Target 2",
										value: draft.target2,
										hint: hint(draft.target2, book.players, kickingPlay(draft.type) ? defense : offenseId),
										onChange: (target2) => patch({ target2 })
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-4 grid grid-cols-3 gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JerseyField, {
										id: "tackler-1",
										label: "Tackler",
										value: draft.tackler1,
										hint: hint(draft.tackler1, book.players, kickingPlay(draft.type) ? offenseId : defense, kickingPlay(draft.type)),
										onChange: (tackler1) => patch({ tackler1 })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JerseyField, {
										id: "tackler-2",
										label: "Tackler 2",
										value: draft.tackler2,
										hint: hint(draft.tackler2, book.players, kickingPlay(draft.type) ? offenseId : defense, kickingPlay(draft.type)),
										onChange: (tackler2) => patch({ tackler2 })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JerseyField, {
										id: "tackler-3",
										label: "Tackler 3",
										value: draft.tackler3,
										hint: hint(draft.tackler3, book.players, kickingPlay(draft.type) ? offenseId : defense, kickingPlay(draft.type)),
										onChange: (tackler3) => patch({ tackler3 })
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-2 text-xs font-semibold tracking-wider text-muted uppercase",
								children: "This play"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-4 font-serif text-lg leading-relaxed",
								children: draft.starter.trim() ? preview : "Type the offense jersey. The sentence shows up here."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								disabled: !draft.starter.trim(),
								className: "h-12 w-full rounded-xl bg-accent text-base font-bold text-ink disabled:opacity-40",
								children: "Log play"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-2xl border border-line bg-surface p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mb-3 text-xs font-semibold tracking-wider text-muted uppercase",
							children: "Game log"
						}), book.plays.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-serif text-base leading-relaxed text-muted",
							children: "Ball on the O'gorman 45. Pass from Cade Hermansom (3) to Rylan Cody (4) tackled on the Washington 37 by 18,74."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
							className: "flex flex-col gap-4",
							children: book.plays.map((play, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "border-b border-line pb-4 last:border-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-1 flex items-center justify-between gap-3 text-xs text-muted",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [play.down ? `Q${play.quarter} · ${ordinalDown(play.down)} & ${play.distance}${play.clock ? ` · ${play.clock}` : ""}` : "Start", index === 0 ? " · latest" : ""] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setEditing(play),
											className: "h-8 text-muted",
											children: "Edit"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => undo(play.id),
											className: "h-8 text-muted",
											children: "Undo"
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-serif text-lg leading-relaxed",
									children: play.sentence
								})]
							}, play.id))
						})]
					})
				]
			}),
			askTime && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-30 flex items-center justify-center bg-bg/80 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					role: "dialog",
					"aria-label": "Time",
					className: "w-full max-w-sm rounded-2xl border border-line bg-surface p-4",
					onSubmit: (event) => {
						event.preventDefault();
						if (!promptTime.trim()) return;
						setAskTime(false);
						logPlay(promptTime);
						setPromptTime("");
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mb-3 text-lg font-semibold",
							children: "Time"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							id: "score-time",
							autoFocus: true,
							value: promptTime,
							placeholder: "8:42",
							onChange: (event) => setPromptTime(event.target.value),
							className: "mb-4 h-11 w-full rounded-lg border border-line bg-raised px-3"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-end gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setAskTime(false),
								className: "h-11 rounded-lg border border-line px-4 text-sm font-semibold text-muted",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								disabled: !promptTime.trim(),
								className: "h-11 rounded-lg bg-accent px-4 text-sm font-bold text-ink disabled:opacity-40",
								children: "Log"
							})]
						})
					]
				})
			}),
			confirmingNew && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-30 flex items-center justify-center bg-bg/80 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "dialog",
					"aria-label": "New game",
					className: "w-full max-w-sm rounded-2xl border border-line bg-surface p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mb-2 text-lg font-semibold",
							children: "New game"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-4 text-sm text-muted",
							children: "This starts a new log, puts the ball on the 40, and sets the play to Kickoff. The roster stays."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-end gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setConfirmingNew(false),
								className: "h-11 rounded-lg border border-line px-4 text-sm font-semibold text-muted",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: newGame,
								className: "h-11 rounded-lg bg-accent px-4 text-sm font-bold text-ink",
								children: "Clear log"
							})]
						})
					]
				})
			}),
			exportOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-30 flex items-center justify-center bg-bg/80 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "dialog",
					"aria-label": "Export CSV",
					className: "flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-line bg-surface p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mb-2 text-lg font-semibold",
							children: "Export CSV"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-3 text-sm text-muted",
							children: book.plays.length === 0 ? "The log is empty. Copy or download the header, or log a play first." : `${book.plays.length} play${book.plays.length === 1 ? "" : "s"}, oldest first.`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							readOnly: true,
							value: csvText(),
							className: "mb-4 min-h-40 w-full flex-1 rounded-lg border border-line bg-raised p-3 font-mono text-xs"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-end gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setExportOpen(false),
									className: "h-11 rounded-lg border border-line px-4 text-sm font-semibold text-muted",
									children: "Close"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: async () => {
										try {
											await navigator.clipboard.writeText(csvText());
											setCopied(true);
										} catch {
											setCopied(false);
										}
									},
									className: "h-11 rounded-lg border border-line px-4 text-sm font-semibold",
									children: copied ? "Copied" : "Copy"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: downloadCsv,
									className: "h-11 rounded-lg bg-accent px-4 text-sm font-bold text-ink",
									children: "Download"
								})
							]
						})
					]
				})
			}),
			editing && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayEditor, {
				play: editing,
				book,
				onCancel: () => setEditing(null),
				onSave: (next) => {
					setBook((current) => ({
						...current,
						plays: current.plays.map((item) => item.id === next.id ? next : item)
					}));
					setEditing(null);
				}
			})
		]
	});
}
function hint(number, players, preferTeamId, strict = false) {
	if (!number.trim()) return "";
	const name = lookupName(number, players, preferTeamId, strict);
	return name ? `${name} (${normNum(number)})` : normNum(number);
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block min-w-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-1 block text-xs font-semibold tracking-wider text-muted uppercase",
			children: label
		}), children]
	});
}
function TeamSelect({ teams, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
		value,
		onChange: (e) => onChange(e.target.value),
		className: "h-11 w-full rounded-lg border border-line bg-raised px-2",
		children: teams.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
			value: t.id,
			children: t.name || "Team"
		}, t.id))
	});
}
function JerseyField({ id, label, value, hint: hintText, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block min-w-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mb-1 block truncate text-xs font-semibold tracking-wider text-muted uppercase",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				id,
				inputMode: "numeric",
				value,
				placeholder: "#",
				onChange: (e) => onChange(e.target.value),
				className: "h-11 w-full rounded-lg border border-line bg-raised px-2 text-center text-lg font-semibold"
			}),
			hintText ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-1 block truncate text-xs text-muted",
				children: hintText
			}) : null
		]
	});
}
function placeFromPointer(event, flipped, onPlace) {
	const rect = event.currentTarget.getBoundingClientRect();
	const ratio = (event.clientX - rect.left) / rect.width;
	const visual = Math.min(99, Math.max(1, Math.round(ratio * 100)));
	onPlace(flipped ? 100 - visual : visual);
}
function FieldBoard({ offenseName, defenseName, ball, series, flipped, onFlip, onPlace }) {
	const view = (yard) => flipped ? 100 - yard : yard;
	const gain = Math.min(100, Math.max(0, series + 10));
	const numbers = [
		10,
		20,
		30,
		40,
		50,
		40,
		30,
		20,
		10
	];
	const leftName = flipped ? defenseName : offenseName;
	const rightName = flipped ? offenseName : defenseName;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "overflow-hidden rounded-2xl border border-line",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex h-36 sm:h-40",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex w-9 shrink-0 items-center justify-center bg-[#0c3a22] px-1 text-[10px] font-bold tracking-wider text-white uppercase sm:w-11",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "max-h-32 [writing-mode:vertical-rl] rotate-180 truncate",
						children: leftName || "Offense"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "slider",
					"aria-label": "Ball spot",
					"aria-valuemin": 1,
					"aria-valuemax": 99,
					"aria-valuenow": Math.round(view(ball)),
					tabIndex: 0,
					onPointerDown: (event) => {
						event.currentTarget.setPointerCapture(event.pointerId);
						placeFromPointer(event, flipped, onPlace);
					},
					onPointerMove: (event) => {
						if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
						placeFromPointer(event, flipped, onPlace);
					},
					onKeyDown: (event) => {
						const step = flipped ? -1 : 1;
						if (event.key === "ArrowRight") onPlace(Math.min(99, Math.max(1, Math.round(ball) + step)));
						if (event.key === "ArrowLeft") onPlace(Math.min(99, Math.max(1, Math.round(ball) - step)));
					},
					className: "relative min-w-0 flex-1 cursor-crosshair",
					style: { background: "repeating-linear-gradient(90deg, #1b6b38 0px, #1b6b38 8px, #166233 8px, #166233 16px)" },
					children: [
						Array.from({ length: 19 }, (_, index) => index + 1).map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "pointer-events-none absolute inset-y-0 w-px " + (step % 2 === 0 ? "bg-white/80" : "bg-white/30"),
							style: { left: `${step * 5}%` }
						}, step)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pointer-events-none absolute top-[28%] right-0 left-0 h-px bg-white/50" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pointer-events-none absolute bottom-[28%] right-0 left-0 h-px bg-white/50" }),
						numbers.map((label, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-bold text-white/90",
							style: { left: `${(index + 1) * 10}%` },
							children: label
						}, `${label}-${index}`)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-[#f5c518]",
							style: { left: `${view(series)}%` }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-[#e10600]",
							style: { left: `${view(gain)}%` }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
							viewBox: "0 0 36 22",
							"aria-hidden": "true",
							className: "pointer-events-none absolute top-1/2 z-20 h-5 w-8 -translate-x-1/2 -translate-y-1/2 drop-shadow",
							style: { left: `${view(ball)}%` },
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
									cx: "18",
									cy: "11",
									rx: "16",
									ry: "8",
									fill: "#6b3410",
									stroke: "#3a1c08",
									strokeWidth: "1"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: "M18 5.5v11",
									stroke: "white",
									strokeWidth: "1.2"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: "M14.5 8h7M14.5 11h7M14.5 14h7",
									stroke: "white",
									strokeWidth: "1.1"
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex w-9 shrink-0 items-center justify-center bg-[#0c3a22] px-1 text-[10px] font-bold tracking-wider text-white uppercase sm:w-11",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "max-h-32 truncate [writing-mode:vertical-rl]",
						children: rightName || "Defense"
					})
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-3 bg-surface px-3 py-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: "Yellow is the series start. Red is the 1st-down marker."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onFlip,
				className: "h-8 shrink-0 rounded-lg border border-line px-3 text-xs font-semibold",
				children: "Flip ends"
			})]
		})]
	});
}
function PlayEditor({ play, book, onSave, onCancel }) {
	const [form, setForm] = (0, import_react.useState)(() => draftFromPlay(play, book));
	const [text, setText] = (0, import_react.useState)(play.sentence);
	const [custom, setCustom] = (0, import_react.useState)(false);
	const offense = form.offenseId;
	const defense = defenseId(book, offense);
	function update(partial) {
		setForm((current) => {
			const next = {
				...current,
				...partial
			};
			if (!custom) setText(next.starter.trim() ? sentenceFrom(book, next) : play.sentence);
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
			snapshot: snapshotFrom(form, form.scoreTime.trim())
		});
	}
	const chip = (on) => "h-10 shrink-0 rounded-lg border px-2.5 text-sm font-semibold whitespace-nowrap " + (on ? "border-transparent bg-accent text-ink" : "border-line bg-raised text-fg");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-40 overflow-auto bg-bg/80 p-4 sm:p-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			role: "dialog",
			"aria-label": "Edit play",
			className: "mx-auto w-full max-w-6xl rounded-2xl border border-line bg-surface p-4",
			onSubmit: (event) => {
				event.preventDefault();
				save();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-semibold",
						children: "Edit play"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onCancel,
						className: "h-10 rounded-lg border border-line px-4 text-sm font-semibold text-muted",
						children: "Cancel"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 flex flex-wrap items-end gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-2 text-xs font-semibold tracking-wider text-muted uppercase",
							children: "Quarter"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-2",
							children: [
								"1",
								"2",
								"3",
								"4",
								"OT"
							].map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => update({ quarter: q }),
								className: chip(form.quarter === q),
								children: q
							}, q))
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-2 text-xs font-semibold tracking-wider text-muted uppercase",
							children: "Down"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-2",
							children: [
								"1",
								"2",
								"3",
								"4"
							].map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => update({ down: d }),
								className: chip(form.down === d),
								children: d
							}, d))
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-24",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "To go",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									inputMode: "numeric",
									value: form.distance,
									onChange: (event) => update({ distance: event.target.value }),
									className: "h-10 w-full rounded-lg border border-line bg-raised px-2"
								})
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 grid gap-2 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: kickingPlay(form.type) ? "Kicking team" : "Offense",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamSelect, {
								teams: book.teams,
								value: form.offenseId,
								onChange: (offenseId) => update({ offenseId })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: form.type === "Kickoff" ? "Kick from" : "Ball on",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamSelect, {
									teams: book.teams,
									value: form.snapTeamId,
									onChange: (snapTeamId) => update({ snapTeamId })
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Yard",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									inputMode: "numeric",
									value: form.snapYard,
									onChange: (event) => update({ snapYard: event.target.value }),
									className: "h-11 w-full rounded-lg border border-line bg-raised px-2 text-center"
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: form.type === "Kickoff" ? "Tackle" : "Spot",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamSelect, {
									teams: book.teams,
									value: form.ballTeamId,
									onChange: (ballTeamId) => update({ ballTeamId })
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Yard",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									inputMode: "numeric",
									value: form.ballYard,
									onChange: (event) => update({ ballYard: event.target.value }),
									className: "h-11 w-full rounded-lg border border-line bg-raised px-2 text-center"
								})
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 text-xs font-semibold tracking-wider text-muted uppercase",
					children: "Play"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-4 flex flex-nowrap gap-2 overflow-x-auto",
					children: PLAY_TYPES.map((type) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => update({
							type,
							possession: POSSESSION_PLAYS.has(type) ? true : form.possession
						}),
						className: chip(form.type === type),
						children: type
					}, type))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 text-xs font-semibold tracking-wider text-muted uppercase",
					children: "Result"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 flex flex-wrap gap-2",
					children: [RESULTS.map((result) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => update({ result: result.id }),
						className: chip(form.result === result.id),
						children: result.label
					}, result.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => update({ possession: !form.possession }),
						className: chip(form.possession),
						children: "Possession"
					})]
				}),
				playNeedsTime(form) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-4 max-w-40",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Time",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: form.scoreTime,
							placeholder: "8:42",
							onChange: (event) => update({ scoreTime: event.target.value }),
							className: "h-11 w-full rounded-lg border border-line bg-raised px-3"
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 grid grid-cols-3 gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JerseyField, {
							id: "edit-starter",
							label: startLabel(form.type),
							value: form.starter,
							hint: hint(form.starter, book.players, offense),
							onChange: (starter) => update({ starter })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JerseyField, {
							id: "edit-target-1",
							label: kickingPlay(form.type) ? "Receiver" : "Target",
							value: form.target1,
							hint: hint(form.target1, book.players, kickingPlay(form.type) ? defense : offense),
							onChange: (target1) => update({ target1 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JerseyField, {
							id: "edit-target-2",
							label: kickingPlay(form.type) ? "Receiver 2" : "Target 2",
							value: form.target2,
							hint: hint(form.target2, book.players, kickingPlay(form.type) ? defense : offense),
							onChange: (target2) => update({ target2 })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 grid grid-cols-3 gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JerseyField, {
							id: "edit-tackler-1",
							label: "Tackler",
							value: form.tackler1,
							hint: hint(form.tackler1, book.players, kickingPlay(form.type) ? offense : defense, kickingPlay(form.type)),
							onChange: (tackler1) => update({ tackler1 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JerseyField, {
							id: "edit-tackler-2",
							label: "Tackler 2",
							value: form.tackler2,
							hint: hint(form.tackler2, book.players, kickingPlay(form.type) ? offense : defense, kickingPlay(form.type)),
							onChange: (tackler2) => update({ tackler2 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JerseyField, {
							id: "edit-tackler-3",
							label: "Tackler 3",
							value: form.tackler3,
							hint: hint(form.tackler3, book.players, kickingPlay(form.type) ? offense : defense, kickingPlay(form.type)),
							onChange: (tackler3) => update({ tackler3 })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mb-4 block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-2 block text-xs font-semibold tracking-wider text-muted uppercase",
						children: "This play"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: text,
						rows: 3,
						onChange: (event) => {
							setCustom(true);
							setText(event.target.value);
						},
						className: "w-full rounded-lg border border-line bg-raised px-3 py-2 font-serif text-lg leading-relaxed"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					disabled: playNeedsTime(form) && !form.scoreTime.trim(),
					className: "h-12 w-full rounded-xl bg-accent text-base font-bold text-ink disabled:opacity-40",
					children: "Save play"
				})
			]
		})
	});
}
function draftFromPlay(play, book) {
	const base = emptyDraft(book);
	if (!play.snapshot) return {
		...base,
		quarter: play.quarter,
		down: play.down,
		distance: play.distance
	};
	return {
		...base,
		...play.snapshot,
		seriesTeamId: play.snapshot.snapTeamId,
		seriesYard: play.snapshot.snapYard
	};
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayBook, {});
}
//#endregion
export { Home as component };
