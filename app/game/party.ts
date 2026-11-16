export type PartyGameId =
  | "qui-de-nous" | "undercover" | "pas-de-bol" | "cerveau-en-fete"
  | "petit-bac" | "dessine-devine" | "loup-garou" | "bombe-a-mots"
  | "menteur" | "bowling" | "tu-preferes" | "qui-suis-je"
  | "plus-proche" | "action-verite" | "devine-equipe" | "puissance-4"
  | "morpion" | "bataille-navale" | "tour-des-potes";

export const PARTY_GAMES: { id: PartyGameId; title: string; description: string; min: number; max: number; emoji: string }[] = [
  { id: "qui-de-nous", title: "Qui de nous ?", description: "Votez pour la personne qui correspond le mieux à la question.", min: 3, max: 9, emoji: "🗳️" },
  { id: "undercover", title: "Undercover", description: "Donnez des indices, puis démasquez l’infiltré.", min: 3, max: 9, emoji: "🕵️" },
  { id: "pas-de-bol", title: "Pas de bol !", description: "Jouez vos cartes et videz votre main avant les autres.", min: 2, max: 9, emoji: "🃏" },
  { id: "cerveau-en-fete", title: "Cerveau en fête", description: "Répondez au quiz avant vos amis.", min: 2, max: 9, emoji: "🧠" },
  { id: "petit-bac", title: "Petit bac", description: "Trouvez des mots dans chaque catégorie avant la fin du chrono.", min: 2, max: 9, emoji: "✏️" },
  { id: "dessine-devine", title: "Dessine & devine", description: "Dessinez le mot secret et faites-le deviner.", min: 3, max: 9, emoji: "🎨" },
  { id: "loup-garou", title: "Loup-garou", description: "La nuit choisit une victime, le village débat et vote.", min: 5, max: 9, emoji: "🐺" },
  { id: "bombe-a-mots", title: "Bombe à mots", description: "Trouvez un mot avec la syllabe avant que la bombe explose.", min: 2, max: 9, emoji: "💣" },
  { id: "menteur", title: "Menteur", description: "Enchérissez sur les dés cachés ou accusez un bluff.", min: 2, max: 9, emoji: "🎲" },
  { id: "bowling", title: "Bowling", description: "Dix manches, deux lancers : faites tomber un maximum de quilles.", min: 2, max: 9, emoji: "🎳" },
  { id: "tu-preferes", title: "Tu préfères ?", description: "Choisissez entre deux situations et découvrez la majorité.", min: 2, max: 9, emoji: "🤔" },
  { id: "qui-suis-je", title: "Qui suis-je ?", description: "Devinez le personnage que les autres ont reçu pour vous.", min: 2, max: 9, emoji: "🧑‍🎤" },
  { id: "plus-proche", title: "Le plus proche", description: "Faites une estimation : la réponse la plus proche gagne.", min: 2, max: 9, emoji: "🎯" },
  { id: "action-verite", title: "Action ou vérité", description: "Choisissez votre défi et relevez-le devant la bande.", min: 3, max: 9, emoji: "🎡" },
  { id: "devine-equipe", title: "Devine en équipe", description: "Faites deviner le mot à votre équipe avec un indice.", min: 4, max: 9, emoji: "🔴" },
  { id: "puissance-4", title: "4 à la suite", description: "Alignez quatre jetons avant l’autre équipe.", min: 2, max: 9, emoji: "🔴" },
  { id: "morpion", title: "Morpion", description: "Alignez trois symboles pour gagner la manche.", min: 2, max: 9, emoji: "❌" },
  { id: "bataille-navale", title: "Bataille navale", description: "Repérez les navires adverses et coulez toute leur flotte.", min: 2, max: 9, emoji: "🚢" },
  { id: "tour-des-potes", title: "Le Tour des Potes", description: "Parcourez les villes, achetez des lieux et encaissez les loyers.", min: 2, max: 9, emoji: "🏘️" },
];

export type PartyState = {
  kind: "party"; gameId: PartyGameId; players: string[]; turnIndex: number;
  round: number; finished: boolean; ranking: string[]; scores: Record<string, number>;
  phase: string; prompt: string; options: string[]; data: Record<string, any>;
};
type Rng = { int(max: number): number };
const questions = [
  "Qui de nous finirait les restes du frigo à 3 h du mat’ ?",
  "Qui de nous oublierait pourquoi il est entré dans une pièce ?",
  "Qui de nous survivrait le mieux sur une île déserte ?",
  "Qui de nous ferait rire tout le monde à un mariage ?",
  "Qui de nous partirait en voyage sans vérifier la météo ?",
  "Qui de nous adopterait le plus d’animaux ?",
  "Qui de nous répond le plus vite dans le groupe ?",
];
const either = [
  ["Ne plus jamais écouter de musique", "Ne plus jamais regarder de films"],
  ["Pouvoir voler", "Pouvoir devenir invisible"],
  ["Spaghettis à la place des mains", "Saucisses à la place des pieds"],
  ["Vivre à la mer", "Vivre à la montagne"],
  ["Toujours arriver en avance", "Toujours arriver en retard"],
];
const quiz = [
  ["Quelle est la capitale du Portugal ?", ["Lisbonne", "Porto", "Madrid"], 0],
  ["Combien de côtés a un hexagone ?", ["5", "6", "8"], 1],
  ["Quelle planète est surnommée la planète rouge ?", ["Vénus", "Mars", "Jupiter"], 1],
  ["Quel animal est le plus rapide sur terre ?", ["Guépard", "Lion", "Antilope"], 0],
  ["Combien font 7 × 8 ?", ["54", "56", "64"], 1],
  ["Dans quel pays se trouve Bordeaux ?", ["Belgique", "France", "Suisse"], 1],
  ["Quelle est la plus grande planète ?", ["Saturne", "Jupiter", "Neptune"], 1],
  ["Quel océan borde la côte ouest de la France ?", ["Pacifique", "Indien", "Atlantique"], 2],
];
const bacCategories = ["Prénom", "Pays ou ville", "Animal", "Objet", "Métier"];
const words = ["girafe", "chocolat", "parapluie", "astronaute", "moustache", "arc-en-ciel", "dauphin", "baguette", "montagne", "coccinelle", "piano", "ananas"];
const syllables = ["AN", "OU", "RA", "MI", "TO", "LA", "CH", "ON", "AR", "EL"];
const celebrities = ["Astérix", "Cendrillon", "Harry Potter", "Mickey", "Shrek", "Cléopâtre", "Spider-Man", "Marie Curie", "Zorro", "Kirikou", "Napoléon", "Buzz l’Éclair"];
const truths = ["Quelle est ta plus grande honte ?", "Quel est ton talent le plus inutile ?", "Quelle est ta dernière recherche internet ?", "Quelle habitude bizarre as-tu ?", "Quel est ton meilleur souvenir avec la bande ?"];
const dares = ["Imite un animal pendant dix secondes.", "Fais une déclaration d’amour à un objet.", "Chante le refrain d’une chanson.", "Parle avec un accent jusqu’au prochain tour.", "Fais une danse de victoire."];
const towns = ["Bayonne", "Biarritz", "Pau", "Dax", "Arcachon", "Bordeaux", "Libourne", "Angoulême", "La Rochelle", "Toulouse", "Lyon", "Paris", "Nantes", "Lille", "Marseille", "Le marché"];
const pick = <T,>(items: T[], rng: Rng) => items[rng.int(items.length)]!;
const shuffle = <T,>(items: T[], rng: Rng) => items.map((x) => [rng.int(1_000_000), x] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
const current = (s: PartyState) => s.players[s.turnIndex % s.players.length]!;
const ranked = (s: PartyState) => [...s.players].sort((a, b) => (s.scores[b] ?? 0) - (s.scores[a] ?? 0));
const finish = (s: PartyState) => { s.finished = true; s.ranking = ranked(s); s.phase = "finished"; };
const nextTurn = (s: PartyState) => { s.turnIndex = (s.turnIndex + 1) % s.players.length; };
const voteReady = (s: PartyState) => Object.keys(s.data.votes ?? {}).length >= s.players.length;
const tally = (votes: Record<string, string>) => Object.values(votes).reduce<Record<string, number>>((a, id) => ((a[id] = (a[id] ?? 0) + 1), a), {});
const fresh = (id: PartyGameId, players: string[], rng: Rng, round = 1, scores?: Record<string, number>): PartyState => {
  const s: PartyState = { kind: "party", gameId: id, players, turnIndex: 0, round, finished: false, ranking: [], scores: scores ?? Object.fromEntries(players.map((p) => [p, 0])), phase: "play", prompt: "", options: [], data: {} };
  switch (id) {
    case "qui-de-nous": s.phase = "vote"; s.prompt = pick(questions, rng); s.data = { votes: {} }; break;
    case "tu-preferes": { const p = pick(either, rng); s.phase = "vote"; s.prompt = "Tu préfères…"; s.options = p; s.data = { votes: {} }; break; }
    case "undercover": { const pairs = [["plage", "piscine"], ["chat", "tigre"], ["pizza", "quiche"], ["cinéma", "théâtre"], ["café", "thé"]]; const pair = pick(pairs, rng); const undercover = players[rng.int(players.length)]!; s.phase = "clues"; s.prompt = "Donnez chacun un indice sans révéler votre mot."; s.data = { undercover, secrets: Object.fromEntries(players.map((p) => [p, p === undercover ? pair[1] : pair[0]])), clues: {}, votes: {} }; break; }
    case "pas-de-bol": { const deck = shuffle(Array.from({ length: 4 }, (_, c) => Array.from({ length: 10 }, (_, n) => ({ id: `${c}-${n}`, color: ["rouge", "bleu", "vert", "jaune"][c]!, value: String(n) }))).flat(), rng); const hands = Object.fromEntries(players.map((p) => [p, deck.splice(0, 5)])); s.phase = "cards"; s.data = { hands, deck, top: deck.shift(), color: "", direction: 1 }; s.data.color = s.data.top?.color; break; }
    case "cerveau-en-fete": { const q = pick(quiz, rng); s.phase = "answer"; s.prompt = q[0] as string; s.options = q[1] as string[]; s.data = { correct: q[2], answers: {} }; break; }
    case "petit-bac": s.phase = "write"; s.prompt = "Écrivez un mot par catégorie."; s.data = { letter: String.fromCharCode(65 + rng.int(26)), categories: bacCategories, answers: {} }; break;
    case "dessine-devine": s.turnIndex = (round - 1) % players.length; s.phase = "draw"; s.prompt = "À l’artiste de dessiner !"; s.data = { artistIndex: s.turnIndex, word: pick(words, rng), strokes: [], guesses: {} }; break;
    case "loup-garou": { const wolfCount = players.length >= 8 ? 2 : 1; const wolves = shuffle(players, rng).slice(0, wolfCount); s.turnIndex = players.indexOf(wolves[0]!); s.phase = "night"; s.prompt = "La nuit tombe : le ou les loups choisissent une victime."; s.data = { roles: Object.fromEntries(players.map((p) => [p, wolves.includes(p) ? "loup" : "villageois"])), wolves, alive: [...players], nightVotes: {}, votes: {}, victim: null }; break; }
    case "bombe-a-mots": s.phase = "word"; s.prompt = "À toi : trouve un mot qui contient la syllabe."; s.data = { syllable: pick(syllables, rng), used: [], turns: 0, maxTurns: players.length * 3 }; break;
    case "menteur": s.phase = "bid"; s.prompt = "Enchéris sur les dés cachés ou accuse le bluff."; s.data = { dice: Object.fromEntries(players.map((p) => [p, Array.from({ length: 5 }, () => 1 + rng.int(6))])), active: [...players], bid: null }; break;
    case "bowling": s.phase = "roll"; s.prompt = "À toi de lancer la boule."; s.data = { frames: Object.fromEntries(players.map((p) => [p, Array.from({ length: 10 }, () => [] as number[])])), frame: 0, roll: 0 }; break;
    case "qui-suis-je": s.phase = "guess"; s.prompt = "Devine ton personnage. Les autres le voient sur leur écran."; s.data = { secrets: Object.fromEntries(players.map((p) => [p, pick(celebrities, rng)])), guessed: {} }; break;
    case "plus-proche": { const fact = pick([["Combien de marches dans la tour Eiffel ?", 1665], ["En quelle année a eu lieu le premier pas sur la Lune ?", 1969], ["Combien de kilomètres entre Paris et Bordeaux ?", 584], ["Combien de dents a un adulte ?", 32]] as [string, number][], rng); s.phase = "number"; s.prompt = fact[0]; s.data = { target: fact[1], answers: {} }; break; }
    case "action-verite": s.phase = "choice"; s.prompt = `${current(s)}, choisis ton défi !`; s.data = { choices: {}, challenge: "", completed: {} }; break;
    case "devine-equipe": s.phase = "clue"; s.prompt = "Fais deviner le mot à ton équipe."; s.data = { teams: Object.fromEntries(players.map((p, i) => [p, i % 2 ? "bleue" : "rouge"])), actorIndex: 0, word: pick(words, rng), clue: "", turns: 0 }; break;
    case "puissance-4": s.phase = "board"; s.prompt = "Aligne quatre jetons."; s.data = { board: Array(42).fill(null) }; break;
    case "morpion": s.phase = "board"; s.prompt = "Aligne trois symboles."; s.data = { board: Array(9).fill(null) }; break;
    case "bataille-navale": { const ships = Object.fromEntries(players.map((p) => [p, shuffle(Array.from({ length: 64 }, (_, i) => i), rng).slice(0, 5)])); s.phase = "fire"; s.prompt = "Choisis la case où tirer."; s.data = { ships, shots: Object.fromEntries(players.map((p) => [p, {}])), alive: [...players] }; break; }
    case "tour-des-potes": s.phase = "roll"; s.prompt = "Lance les dés et découvre ta prochaine ville."; s.data = { positions: Object.fromEntries(players.map((p) => [p, 0])), money: Object.fromEntries(players.map((p) => [p, 1200])), owners: {}, turns: 0 }; break;
  }
  s.options = s.options ?? [];
  return s;
};

const allSubmitted = (s: PartyState, k: string) => Object.keys(s.data[k] ?? {}).length >= s.players.length;
const pendingTurn = (s: PartyState, key: string) => { const values = s.data[key] ?? {}, eligible: string[] = s.gameId === "loup-garou" && key === "votes" ? s.data.alive : s.players; for (let n = 1; n <= s.players.length; n++) { const i = (s.turnIndex + n) % s.players.length, id=s.players[i]!; if (eligible.includes(id) && values[id] === undefined) { s.turnIndex = i; return; } } };
const recordVote = (s: PartyState, actor: string, target: string) => { if (!s.players.includes(target) || s.data.votes[actor] !== undefined) return false; s.data.votes[actor] = target; if (voteReady(s)) { s.data.result = tally(s.data.votes); const top = Math.max(...Object.values(s.data.result) as number[]); for (const [voter, voted] of Object.entries(s.data.votes) as [string, string][]) if (s.data.result[voted] === top) s.scores[voter] = (s.scores[voter] ?? 0) + 1; s.phase = "result"; } else pendingTurn(s, "votes"); return true; };
const fourInRow = (board: (string | null)[], index: number, need: number, cols: number, rows: number) => {
  const id = board[index]; if (!id) return false;
  const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
  return dirs.some(([dx, dy]) => { let count = 1; for (const sign of [-1, 1]) for (let x = dx * sign, y = dy * sign; ; x += dx * sign, y += dy * sign) { const cx = index % cols + x, cy = Math.floor(index / cols) + y; if (cx < 0 || cx >= cols || cy < 0 || cy >= rows || board[cy * cols + cx] !== id) break; count++; } return count >= need; });
};
const shuffleDeck = (rng: Rng) => shuffle(Array.from({ length: 4 }, (_, c) => Array.from({ length: 10 }, (_, n) => ({ id: `${c}-${n}`, color: ["rouge", "bleu", "vert", "jaune"][c]!, value: String(n) }))).flat(), rng);

export const partyGames = {
  createInitialState: fresh,
  getPlayerView(state: PartyState, player: string) {
    const v = structuredClone(state);
    if (v.gameId === "undercover") v.data.myWord = v.data.secrets[player];
    if (v.gameId === "loup-garou") v.data.myRole = v.data.roles[player];
    if (v.gameId === "qui-suis-je") v.data.otherSecrets = Object.fromEntries(v.players.filter((p) => p !== player).map((p) => [p, v.data.secrets[p]]));
    if (v.gameId === "pas-de-bol") v.data.myHand = v.data.hands[player] ?? [];
    if (v.gameId === "menteur") v.data.myDice = v.data.dice[player] ?? [];
    if (v.gameId === "bataille-navale") v.data.myShips = v.data.ships[player] ?? [];
    if (v.gameId === "dessine-devine") { const artist=v.players[v.data.artistIndex]; if (artist !== player) delete v.data.word; if (artist?.startsWith("bot:")) v.data.hint=`Indice : ${v.data.word?.slice(0,1) ?? "?"} · ${v.data.word?.length ?? 0} lettres`; }
    delete v.data.secrets; delete v.data.roles; delete v.data.wolves; delete v.data.hands; delete v.data.ships; delete v.data.dice;
    return { ...v, turn: current(v), legalActions: [] };
  },
  botAction(s: PartyState, actor: string, rng: Rng): Record<string, any> {
    const d = s.data;
    switch (s.gameId) {
      case "qui-de-nous": return { type: "vote", target: pick(s.players, rng) };
      case "tu-preferes": return { type: "choose", option: rng.int(2) };
      case "undercover": return s.phase === "clues" ? { type: "clue", text: pick(["Un lieu de vacances", "On y va le week-end", "J’aime bien", "C’est souvent grand"], rng) } : { type: "vote", target: pick(s.players.filter((p) => p !== actor), rng) };
      case "pas-de-bol": { const h = d.hands[actor] as { id: string; color: string; value: string }[], card = h.find((c) => c.color === d.color || c.value === d.top.value); return card ? { type: "play", cardId: card.id } : { type: "draw" }; }
      case "cerveau-en-fete": return { type: "answer", option: rng.int(s.options.length) };
      case "petit-bac": return { type: "submit", answers: d.categories.map((_: string, i: number) => `${d.letter}${["lice", "ondres", "ion", "ampe", "ivreur"][i]}`) };
      case "dessine-devine": return s.phase === "draw" ? { type: "draw", strokes: [] } : { type: "guess", text: d.word };
      case "loup-garou": return s.phase === "night" ? { type: "kill", target: pick(d.alive.filter((p: string) => !d.wolves.includes(p)), rng) } : { type: "vote", target: pick(d.alive.filter((p: string) => p !== actor), rng) };
      case "bombe-a-mots": { const options = ["ananas", "orange", "chanson", "montagne", "parapluie", "mimosa", "tomate", "arbre"].filter((w) => w.toUpperCase().includes(d.syllable) && !d.used.includes(w)); return { type: "word", text: options.length ? pick(options, rng) : `${d.syllable.toLowerCase()}mot${d.turns}` }; }
      case "menteur": return d.bid ? (d.bid.count >= d.active.length * 5 || rng.int(3) === 0 ? { type: "challenge" } : { type: "bid", count: d.bid.count + 1, face: 1 + rng.int(6) }) : { type: "bid", count: 1, face: 1 + rng.int(6) };
      case "bowling": return { type: "roll" };
      case "qui-suis-je": return { type: "guess", text: d.secrets[actor] };
      case "plus-proche": return { type: "number", value: Math.max(0, d.target + rng.int(101) - 50) };
      case "action-verite": return s.phase === "choice" ? { type: "choose", value: rng.int(2) ? "action" : "vérité" } : { type: "complete" };
      case "devine-equipe": return s.phase === "clue" ? { type: "clue", text: d.word } : { type: "guess", text: d.word };
      case "puissance-4": return { type: "drop", col: rng.int(7) };
      case "morpion": return { type: "place", cell: d.board.findIndex((x: string | null) => !x) };
      case "bataille-navale": { const target = pick<string>(d.alive.filter((p: string) => p !== actor), rng), available = Array.from({ length: 64 }, (_, i) => i).filter((i) => d.shots[target]?.[i] === undefined); return { type: "fire", target, cell: pick(available, rng) }; }
      case "tour-des-potes": return s.phase === "buy" ? { type: "buy" } : { type: "roll" };
    }
  },
  applyAction(input: PartyState, actor: string, action: Record<string, any>, rng: Rng) {
    const s = structuredClone(input), d = s.data, id = s.gameId;
    const fail = () => ({ ok: false as const, state: s });
    if (s.finished || !s.players.includes(actor)) return fail();
    if (action.type === "advance" && s.phase === "result") {
      if (id === "bombe-a-mots" || id === "bowling" || id === "tour-des-potes" || id === "devine-equipe") { finish(s); return { ok: true as const, state: s }; }
      const limit = id === "cerveau-en-fete" ? 8 : id === "petit-bac" ? 5 : id === "dessine-devine" ? s.players.length * 2 : 8;
      if (s.round >= limit) finish(s);
      else { const n = fresh(id, s.players, rng, s.round + 1, s.scores); return { ok: true as const, state: n }; }
      return { ok: true as const, state: s };
    }
    if (id === "qui-de-nous" && action.type === "vote" && s.phase === "vote") return recordVote(s, actor, String(action.target)) ? { ok: true as const, state: s } : fail();
    if (id === "tu-preferes" && action.type === "choose" && s.phase === "vote") { const n = Number(action.option); if (n < 0 || n > 1 || d.votes[actor] !== undefined) return fail(); d.votes[actor] = n; if (Object.keys(d.votes).length === s.players.length) { d.result = [0, 0]; for (const x of Object.values(d.votes) as number[]) d.result[x]++; const win = d.result[0] === d.result[1] ? -1 : d.result[0] > d.result[1] ? 0 : 1; if (win >= 0) for (const p of s.players) if (d.votes[p] === win) s.scores[p]++; s.phase = "result"; } else pendingTurn(s, "votes"); return { ok: true as const, state: s }; }
    if (id === "undercover") { if (action.type === "clue" && s.phase === "clues" && !d.clues[actor]) { const text = String(action.text ?? "").trim().slice(0, 80); if (!text) return fail(); d.clues[actor] = text; if (Object.keys(d.clues).length === s.players.length) { s.phase = "vote"; s.turnIndex = 0; } else pendingTurn(s, "clues"); return { ok: true as const, state: s }; } if (action.type === "vote" && s.phase === "vote" && actor !== action.target && !d.votes[actor]) { d.votes[actor] = action.target; if (Object.keys(d.votes).length === s.players.length) { d.result = tally(d.votes); const max = Math.max(...Object.values(d.result) as number[]); d.caught = Object.keys(d.result).filter((p) => d.result[p] === max); const won = d.caught.includes(d.undercover); for (const p of s.players) s.scores[p] += p === d.undercover ? (won ? 0 : 2) : (won ? 1 : 0); d.reveal = { undercover: d.undercover, word: d.secrets[d.undercover] }; s.phase = "result"; s.prompt = won ? "L’infiltré a été démasqué !" : "L’infiltré a gagné la manche !"; finish(s); } else pendingTurn(s, "votes"); return { ok: true as const, state: s }; } return fail(); }
    if (id === "pas-de-bol" && current(s) === actor) { const hand = d.hands[actor] as any[]; if (action.type === "draw") { if (!d.deck.length) d.deck = shuffleDeck(rng); hand.push(d.deck.shift()); nextTurn(s); } else if (action.type === "play") { const i = hand.findIndex((c) => c.id === action.cardId); if (i < 0) return fail(); const c = hand[i]; if (c.color !== d.color && c.value !== d.top.value) return fail(); hand.splice(i, 1); d.top = c; d.color = c.color; if (!hand.length) { s.scores[actor] = 1000; finish(s); } else { if (Number(c.value) === 7) s.scores[actor]++; nextTurn(s); } } else return fail(); return { ok: true as const, state: s }; }
    if (id === "cerveau-en-fete" && action.type === "answer" && s.phase === "answer" && d.answers[actor] === undefined) { const n = Number(action.option); if (n < 0 || n >= s.options.length) return fail(); d.answers[actor] = n; if (n === d.correct) s.scores[actor]++; if (allSubmitted(s, "answers")) { s.phase = "result"; s.prompt = `Bonne réponse : ${s.options[d.correct]}`; } else pendingTurn(s, "answers"); return { ok: true as const, state: s }; }
    if (id === "petit-bac" && action.type === "submit" && s.phase === "write" && d.answers[actor] === undefined) { const list = Array.isArray(action.answers) ? action.answers : []; d.answers[actor] = d.categories.map((_: string, i: number) => String(list[i] ?? "").trim().slice(0, 30)); if (allSubmitted(s, "answers")) { const counts: Record<string, number> = {}; for (const a of Object.values(d.answers) as string[][]) for (const x of a) if (x) counts[x.toLowerCase()] = (counts[x.toLowerCase()] ?? 0) + 1; for (const [p, a] of Object.entries(d.answers) as [string, string[]][]) for (const x of a) if (x && x.toUpperCase().startsWith(d.letter)) s.scores[p] += counts[x.toLowerCase()] === 1 ? 2 : 1; s.phase = "result"; s.prompt = `La lettre était ${d.letter}.`; } else pendingTurn(s, "answers"); return { ok: true as const, state: s }; }
    if (id === "loup-garou") {
      if (s.phase === "night" && action.type === "kill" && d.wolves.includes(actor) && d.alive.includes(action.target) && !d.wolves.includes(action.target)) {
        d.victim = action.target; d.alive = d.alive.filter((p: string) => p !== d.victim); d.votes = {}; s.phase = "day"; s.prompt = `${d.victim} a été dévoré. Le village vote !`;
        if (!d.alive.some((p: string) => d.wolves.includes(p))) { for (const p of s.players) s.scores[p] += d.wolves.includes(p) ? 0 : 1; finish(s); }
        else s.turnIndex = s.players.indexOf(d.alive[0]);
        return { ok: true as const, state: s };
      }
      if (s.phase === "day" && action.type === "vote" && d.alive.includes(actor) && d.alive.includes(action.target) && !d.votes[actor]) {
        d.votes[actor] = action.target;
        if (Object.keys(d.votes).length >= d.alive.length) {
          const votes = tally(d.votes), caught = Object.keys(votes).sort((a, b) => votes[b]! - votes[a]!)[0]; d.alive = d.alive.filter((p: string) => p !== caught);
          if (d.wolves.every((p: string) => !d.alive.includes(p))) { s.prompt = "Le village a démasqué le loup !"; for (const p of s.players) s.scores[p] += d.wolves.includes(p) ? 0 : 1; finish(s); }
          else if (d.alive.length <= 2) { s.prompt = "Les loups ont pris le dessus."; for (const p of s.players) s.scores[p] += d.wolves.includes(p) ? 1 : 0; finish(s); }
          else { d.nightVotes = {}; d.votes = {}; d.victim = null; s.phase = "night"; s.prompt = "La nuit tombe à nouveau…"; s.turnIndex = s.players.indexOf(d.wolves[0]); }
        } else pendingTurn(s, "votes");
        return { ok: true as const, state: s };
      }
      return fail();
    }
    if (id === "dessine-devine") { if (action.type === "draw" && s.phase === "draw" && s.players[s.turnIndex] === actor) { d.strokes = Array.isArray(action.strokes) ? action.strokes.slice(-200) : []; s.phase = "guess"; s.turnIndex=(s.turnIndex+1)%s.players.length; s.prompt = "À vous de deviner le dessin !"; return { ok: true as const, state: s }; } if (action.type === "guess" && s.phase === "guess" && actor !== s.players[s.data.artistIndex]) { const guess = String(action.text ?? "").trim().toLocaleLowerCase("fr"); if (!guess) return fail(); d.guesses[actor] = guess; if (guess === d.word.toLocaleLowerCase("fr")) { s.scores[actor] += 2; s.scores[s.players[s.data.artistIndex]!] += 1; d.revealWord=d.word; s.phase = "result"; s.prompt = `${guess} : trouvé !`; } else if (Object.keys(d.guesses).length >= s.players.length - 1) { s.phase = "result"; d.revealWord=d.word; s.prompt = `Le mot était : ${d.word}`; } else pendingTurn(s, "guesses"); return { ok: true as const, state: s }; } return fail(); }
    if (id === "bombe-a-mots" && action.type === "word" && current(s) === actor) { const word = String(action.text ?? "").trim().toLocaleLowerCase("fr"); if (word.length < 3 || !word.toLocaleUpperCase("fr").includes(d.syllable) || d.used.includes(word)) return fail(); d.used.push(word); s.scores[actor]++; d.turns++; nextTurn(s); if (d.turns >= d.maxTurns) { s.phase = "result"; s.prompt = "La bombe a explosé !"; } else d.syllable = pick(syllables, rng); return { ok: true as const, state: s }; }
    if (id === "bombe-a-mots" && action.type === "timeout" && current(s) === actor) { s.scores[actor]--; d.turns++; nextTurn(s); if (d.turns >= d.maxTurns) { s.phase = "result"; s.prompt = `${actor} a laissé exploser la bombe !`; } else { d.syllable = pick(syllables, rng); s.prompt = "Vite, trouve un mot avant le boum !"; } return { ok: true as const, state: s }; }
    if (id === "menteur") { const alive = d.active as string[]; if (action.type === "bid" && current(s) === actor && alive.includes(actor)) { const count = Number(action.count), face = Number(action.face); if (!Number.isInteger(count) || count < 1 || count > alive.length * 5 || face < 1 || face > 6 || (d.bid && (count < d.bid.count || (count === d.bid.count && face <= d.bid.face)))) return fail(); d.bid = { player: actor, count, face }; nextTurn(s); return { ok: true as const, state: s }; } if (action.type === "challenge" && current(s) === actor && d.bid && alive.includes(actor)) { const dice = Object.fromEntries(alive.map((p: string) => [p, [...d.dice[p]]])), actual = alive.flatMap((p: string) => d.dice[p] as number[]).filter((n: number) => n === d.bid.face).length, loser = actual >= d.bid.count ? actor : d.bid.player; d.reveal = { dice, actual, bid: d.bid, loser }; d.prompt = `${loser} perd un dé : ${actual} trouvé(s), ${d.bid.count} annoncé(s).`; d.dice[loser].pop(); d.active = alive.filter((p: string) => d.dice[p].length); s.scores[loser] = (s.scores[loser] ?? 0) - 1; for (const p of alive) if (p !== loser) s.scores[p] = (s.scores[p] ?? 0) + 1; if (d.active.length <= 1) finish(s); else { d.bid = null; for (const p of d.active) d.dice[p] = Array.from({ length: d.dice[p].length }, () => 1 + rng.int(6)); const next = d.active.includes(loser) ? loser : d.active[0]; s.turnIndex=s.players.indexOf(next); s.round++; } return { ok: true as const, state: s }; } return fail(); }
    if (id === "bowling" && action.type === "roll" && current(s) === actor) { const frame = d.frames[actor] as number[][], rolls = frame[d.frame] as number[], fallen = rolls.length && rolls[0] === 10 ? 0 : rng.int(11 - rolls.reduce((a, b) => a + b, 0)); rolls.push(fallen); s.scores[actor] += fallen; if (rolls.length >= 2 || rolls[0] === 10) { nextTurn(s); if (s.turnIndex === 0) d.frame++; } if (d.frame >= 10) finish(s); return { ok: true as const, state: s }; }
    if (id === "qui-suis-je" && action.type === "guess" && !d.guessed[actor]) { const guess = String(action.text ?? "").trim().toLocaleLowerCase("fr"); if (!guess) return fail(); d.guessed[actor] = guess === String(d.secrets[actor]).toLocaleLowerCase("fr"); if (d.guessed[actor]) s.scores[actor] += 2; if (Object.keys(d.guessed).length >= s.players.length || Object.values(d.guessed).some(Boolean)) { s.prompt = Object.values(d.guessed).some(Boolean) ? "Quelqu’un a trouvé !" : "Manche terminée."; s.phase = "result"; } else pendingTurn(s,"guessed"); return { ok: true as const, state: s }; }
    if (id === "plus-proche" && action.type === "number" && !d.answers[actor]) { const value = Number(action.value); if (!Number.isFinite(value) || value < 0 || value > 1_000_000) return fail(); d.answers[actor] = value; if (allSubmitted(s, "answers")) { const winner = [...s.players].sort((a, b) => Math.abs(Number(d.answers[a]) - d.target) - Math.abs(Number(d.answers[b]) - d.target))[0]!; s.scores[winner] += 2; s.phase = "result"; s.prompt = `La réponse était ${d.target.toLocaleString("fr-FR")} !`; } else pendingTurn(s, "answers"); return { ok: true as const, state: s }; }
    if (id === "action-verite") { if (action.type === "choose" && s.phase === "choice" && actor === current(s)) { const value = action.value === "action" ? "action" : "vérité"; d.challenge = pick(value === "action" ? dares : truths, rng); d.choice = value; s.phase = "challenge"; s.prompt = `${actor} a choisi ${value} : ${d.challenge}`; return { ok: true as const, state: s }; } if (action.type === "complete" && s.phase === "challenge" && actor === current(s)) { s.scores[actor]++; s.round++; if (s.round > 8) finish(s); else { nextTurn(s); s.phase = "choice"; s.prompt = `${current(s)}, à ton tour !`; d.completed = {}; } return { ok: true as const, state: s }; } return fail(); }
    if (id === "devine-equipe") { const actorTeam = d.teams[actor]; const actorNow = s.players[d.actorIndex % s.players.length]; if (action.type === "clue" && s.phase === "clue" && actor === actorNow) { d.clue = String(action.text ?? "").slice(0, 80); if (!d.clue) return fail(); s.phase = "guess"; const partner=s.players.find((p)=>p!==actor&&d.teams[p]===actorTeam); if(partner)s.turnIndex=s.players.indexOf(partner); s.prompt = `Indice : ${d.clue}. L’équipe ${actorTeam} devine !`; return { ok: true as const, state: s }; } if (action.type === "guess" && s.phase === "guess" && d.teams[actor] === actorTeam && actor !== actorNow) { if (String(action.text ?? "").trim().toLocaleLowerCase("fr") === d.word.toLocaleLowerCase("fr")) s.scores[actorTeam] = (s.scores[actorTeam] ?? 0) + 1; d.turns++; if (d.turns >= 12) { s.prompt = "Fin des manches !"; finish(s); } else { d.actorIndex = (d.actorIndex + 1) % s.players.length; d.word = pick(words, rng); d.clue = ""; s.turnIndex=d.actorIndex; s.phase = "clue"; s.prompt = "À l’équipe suivante : donne un indice."; } return { ok: true as const, state: s }; } return fail(); }
    if (id === "puissance-4" && action.type === "drop" && current(s) === actor) { const col = Number(action.col); if (col < 0 || col > 6) return fail(); const board = d.board as (string | null)[], row = [5, 4, 3, 2, 1, 0].find((r) => !board[r * 7 + col]); if (row === undefined) return fail(); const cell = row * 7 + col; board[cell] = actor; if (fourInRow(board, cell, 4, 7, 6)) { s.scores[actor]++; finish(s); } else if (board.every(Boolean)) finish(s); else nextTurn(s); return { ok: true as const, state: s }; }
    if (id === "morpion" && action.type === "place" && current(s) === actor) { const cell = Number(action.cell), board = d.board as (string | null)[]; if (cell < 0 || cell > 8 || board[cell]) return fail(); board[cell] = actor; if (fourInRow(board, cell, 3, 3, 3)) { s.scores[actor]++; finish(s); } else if (board.every(Boolean)) finish(s); else nextTurn(s); return { ok: true as const, state: s }; }
    if (id === "bataille-navale" && action.type === "fire" && current(s) === actor) { const target = String(action.target), cell = Number(action.cell); if (!d.alive.includes(target) || target === actor || cell < 0 || cell > 63 || d.shots[target][cell] !== undefined) return fail(); const hit = (d.ships[target] as number[]).includes(cell); d.shots[target][cell] = hit; if (hit) s.scores[actor]++; if ((d.ships[target] as number[]).every((x: number) => d.shots[target][x])) { d.alive = d.alive.filter((p: string) => p !== target); if (d.alive.length <= 1) finish(s); } if (!hit) nextTurn(s); return { ok: true as const, state: s }; }
    if (id === "tour-des-potes" && action.type === "roll" && current(s) === actor && s.phase === "roll") { const old = d.positions[actor] as number, pos = (old + 2 + rng.int(11)) % towns.length; if (pos < old) d.money[actor] += 200; d.positions[actor] = pos; const owner = d.owners[pos]; if (owner && owner !== actor) d.money[actor] -= 50; s.prompt = `Tu arrives à ${towns[pos]}${owner && owner !== actor ? ` : 50 € de loyer pour ${owner}.` : " !"}`; if (!owner && pos !== 15) s.phase = "buy"; else { nextTurn(s); d.turns++; } if (d.turns >= s.players.length * 12) { for (const p of s.players) s.scores[p] = d.money[p]; finish(s); } return { ok: true as const, state: s }; } if (id === "tour-des-potes" && action.type === "buy" && s.phase === "buy" && current(s) === actor) { const pos = d.positions[actor], cost = 100 + (pos % 5) * 40; if (d.money[actor] >= cost) { d.money[actor] -= cost; d.owners[pos] = actor; } s.phase = "roll"; nextTurn(s); d.turns++; if (d.turns >= s.players.length * 12) { for (const p of s.players) s.scores[p] = d.money[p]; finish(s); } return { ok: true as const, state: s }; }
    return fail();
  },
};
