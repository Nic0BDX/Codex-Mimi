import { database } from "../../../db/vercel";
import { siteConfig } from "../../config";
import { meganopoly, estateStateSchema } from "../../game/meganopoly/engine";
import type { CoreState } from "../../game/engine/types";
import { partyGames, PARTY_GAMES, type PartyState } from "../../game/party";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Profile = {
  id: string;
  name: string;
  avatar: string;
  expression: string;
  pin_hash: string | null;
  salt: string | null;
  failures: number;
  locked_until: number;
};
type Player = { id: string; ready: boolean; bot: boolean };
type Room = {
  id: string;
  code: string;
  host: string;
  status: string;
  players: string;
  state: string | null;
  version: number;
  capacity: number;
  round_limit: number;
  game_id: string;
  updated: number;
  created: number;
  winner: string | null;
};
const db = database;
const token = () =>
  [...crypto.getRandomValues(new Uint8Array(32))]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
const hash = async (value: string) =>
  [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
  ]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
const rng = {
  int(max: number) {
    if (max <= 0) throw Error("Random range");
    const limit = 2 ** 32 - (2 ** 32 % max);
    let value: number;
    do {
      value = crypto.getRandomValues(new Uint32Array(1))[0]!;
    } while (value >= limit);
    return value % max;
  },
};
const cookie = (req: Request, name: string) =>
  req.headers
    .get("cookie")
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(name + "="))
    ?.slice(name.length + 1) || "";
const secureRequest = (req: Request) =>
  new URL(req.url).protocol === "https:" ||
  req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
const names = (req: Request) =>
  secureRequest(req)
    ? { session: "__Host-nini-session", csrf: "__Host-nini-csrf" }
    : { session: "nini-session", csrf: "nini-csrf" };
const setCookie = (
  req: Request,
  name: string,
  value: string,
  httpOnly = false,
  maxAge = 2592000,
) =>
  `${name}=${value}; Path=/; SameSite=Lax; Max-Age=${maxAge}${secureRequest(req) ? "; Secure" : ""}${httpOnly ? "; HttpOnly" : ""}`;
class Failure extends Error {
  constructor(
    public code: number,
    message: string,
  ) {
    super(message);
  }
}
const requireRule = (
  value: unknown,
  message = "Action impossible.",
  code = 400,
) => {
  if (!value) throw new Failure(code, message);
};
async function pinHash(pin: string, salt: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bytes = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return [...new Uint8Array(bytes)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}
async function seed() {
  await db().batch(
    siteConfig.profiles.map((p) =>
      db()
        .prepare(
          "INSERT INTO profiles (id,name,avatar) VALUES (?,?,?) ON CONFLICT (id) DO NOTHING",
        )
        .bind(p.id, p.name, p.avatar),
    ),
  );
}
async function profiles() {
  const result = await db()
    .prepare(
      "SELECT id,name,avatar,expression,pin_hash IS NOT NULL AS has_pin FROM profiles ORDER BY CASE id WHEN 'nini' THEN 0 ELSE 1 END",
    )
    .all();
  return result.results;
}
async function user(req: Request) {
  const raw = cookie(req, names(req).session);
  if (!raw) return null;
  return db()
    .prepare(
      "SELECT p.* FROM sessions s JOIN profiles p ON p.id=s.profile_id WHERE s.token=? AND s.expires>?",
    )
    .bind(await hash(raw), Date.now())
    .first<Profile>();
}
async function mustUser(req: Request) {
  const p = await user(req);
  requireRule(p, "Choisis ton profil pour continuer.", 401);
  return p!;
}
async function getRoom(id: string, p: Profile) {
  const r = await db()
    .prepare("SELECT * FROM rooms WHERE id=?")
    .bind(id)
    .first<Room>();
  requireRule(r, "Soirée introuvable.", 404);
  requireRule(
    (JSON.parse(r!.players) as Player[]).some((a) => a.id === p.id),
    "Cette soirée est privée.",
    403,
  );
  return r!;
}
async function save(
  r: Room,
  state: CoreState | PartyState | null,
  players: Player[] = JSON.parse(r.players),
  status?: string,
) {
  const now = Date.now(),
    nextStatus =
      status ?? (state?.finished ? "finished" : state ? "playing" : r.status);
  const result = await db()
    .prepare(
      "UPDATE rooms SET state=?,players=?,status=?,version=version+1,updated=?,winner=? WHERE id=? AND version=?",
    )
    .bind(
      state ? JSON.stringify(state) : null,
      JSON.stringify(players),
      nextStatus,
      now,
      state?.finished ? (state.ranking[0] ?? null) : null,
      r.id,
      r.version,
    )
    .run();
  requireRule(
    result.meta.changes === 1,
    "La partie a évolué : réessaie ton action.",
    409,
  );
  return {
    ...r,
    state: state ? JSON.stringify(state) : null,
    players: JSON.stringify(players),
    status: nextStatus,
    version: r.version + 1,
    updated: now,
    winner: state?.finished ? (state.ranking[0] ?? null) : null,
  };
}
async function tick(r: Room) {
  if (r.status !== "playing" || !r.state) return r;
  if (r.game_id !== "meganopoly") {
    const state = JSON.parse(r.state) as PartyState;
    const id = state.players[state.turnIndex]!;
    if (state.gameId === "dessine-devine" && state.phase === "guess" && id.startsWith("bot:") && Date.now() - r.updated < 30000) return r;
    const action = id.startsWith("bot:") && Date.now() - r.updated >= 700
      ? partyGames.botAction(state, id, rng)
      : Date.now() - r.updated >= 60000
        ? partyGames.botAction(state, id, rng)
        : null;
    if (!action) return r;
    const result = partyGames.applyAction(state, id, action, rng);
    if (!result.ok) return r;
    try { return await save(r, result.state); }
    catch (e) {
      if (e instanceof Failure && e.code === 409)
        return (await db().prepare("SELECT * FROM rooms WHERE id=?").bind(r.id).first<Room>())!;
      throw e;
    }
  }
  const state = estateStateSchema.parse(JSON.parse(r.state)),
    id = state.players[state.turn]!;
  const action =
    id.startsWith("bot:") && Date.now() - r.updated >= 700
      ? meganopoly.bot(state, id, rng)
      : Date.now() - r.updated >= 60000
        ? meganopoly.onTimeout(state, id)
        : null;
  if (!action) return r;
  const result = meganopoly.applyAction(state, id, action, rng);
  if (!result.ok) return r;
  try {
    return await save(r, result.state);
  } catch (e) {
    if (e instanceof Failure && e.code === 409)
      return (await db()
        .prepare("SELECT * FROM rooms WHERE id=?")
        .bind(r.id)
        .first<Room>())!;
    throw e;
  }
}
function view(r: Room, p: Profile) {
  return {
    ...r,
    players: JSON.parse(r.players),
    state: undefined,
    view: r.state ? r.game_id === "meganopoly"
      ? meganopoly.getPlayerView(JSON.parse(r.state), p.id)
      : partyGames.getPlayerView(JSON.parse(r.state) as PartyState, p.id) : null,
  };
}
async function stats() {
  return db()
    .prepare(
      "SELECT p.id,p.name,p.avatar,p.expression,(SELECT COUNT(*) FROM rooms r WHERE r.status='finished' AND r.state IS NOT NULL AND EXISTS(SELECT 1 FROM jsonb_array_elements(r.players::jsonb) a WHERE a->>'id'=p.id)) AS played,(SELECT COUNT(*) FROM rooms r WHERE r.winner=p.id AND r.status='finished') AS wins FROM profiles p",
    )
    .all();
}
async function dispatch(req: Request, headers: Headers) {
  await seed();
  const path = new URL(req.url).pathname.slice(5).split("/").filter(Boolean),
    method = req.method;
  const json = async () => {
    try {
      return (await req.json()) as Record<string, unknown>;
    } catch {
      throw new Failure(400, "Données invalides.");
    }
  };
  const n = names(req);
  if (method !== "GET" && method !== "HEAD") {
    const origin = req.headers.get("origin");
    let originAllowed = !origin;
    if (origin) {
      try {
        const parsed = new URL(origin);
        const host = (
          process.env.VERCEL === "1"
            ? req.headers.get("x-forwarded-host") || req.headers.get("host")
            : req.headers.get("host")
        )
          ?.split(",")[0]
          ?.trim();
        originAllowed =
          ["http:", "https:"].includes(parsed.protocol) &&
          (parsed.host === host || origin === new URL(req.url).origin);
      } catch {
        originAllowed = false;
      }
    }
    requireRule(originAllowed, "Origine invalide.", 403);
    const csrf = cookie(req, n.csrf);
    requireRule(
      /^[a-f0-9]{64}$/.test(csrf) && csrf === req.headers.get("x-csrf-token"),
      "CSRF_INVALID",
      403,
    );
  }
  if (path[0] === "session") {
    let csrf = cookie(req, n.csrf);
    if (!/^[a-f0-9]{64}$/.test(csrf)) {
      csrf = token();
      headers.append("Set-Cookie", setCookie(req, n.csrf, csrf));
    }
    const p = await user(req);
    return {
      csrf,
      profile: p
        ? { id: p.id, name: p.name, avatar: p.avatar, expression: p.expression }
        : null,
      profiles: await profiles(),
    };
  }
  if (path[0] === "login" && method === "POST") {
    const body = await json();
    requireRule(
      typeof body.pin === "string" && /^\d{4}$/.test(body.pin),
      "Le code doit faire exactement 4 chiffres.",
    );
    requireRule(
      siteConfig.profiles.some((p) => p.id === body.profileId),
      "Profil inconnu.",
    );
    const p = (await db()
      .prepare("SELECT * FROM profiles WHERE id=?")
      .bind(body.profileId)
      .first<Profile>())!;
    requireRule(
      p.locked_until <= Date.now(),
      "Trop d’essais. Réessaie dans 15 minutes.",
      429,
    );
    if (!p.pin_hash) {
      const salt = token(),
        value = await pinHash(body.pin as string, salt);
      const created = await db()
        .prepare(
          "UPDATE profiles SET salt=?,pin_hash=?,failures=0 WHERE id=? AND pin_hash IS NULL",
        )
        .bind(salt, value, p.id)
        .run();
      requireRule(
        created.meta.changes === 1,
        "Ce profil vient d’être configuré. Connecte-toi avec son code.",
        409,
      );
    } else {
      const supplied = await pinHash(body.pin as string, p.salt!);
      let diff = 0;
      for (let i = 0; i < supplied.length; i++)
        diff |= supplied.charCodeAt(i) ^ p.pin_hash.charCodeAt(i);
      if (diff !== 0) {
        await db()
          .prepare(
            "UPDATE profiles SET failures=CASE WHEN locked_until>0 AND locked_until<? THEN 1 ELSE failures+1 END,locked_until=CASE WHEN failures>=4 AND (locked_until=0 OR locked_until>?) THEN ? ELSE 0 END WHERE id=?",
          )
          .bind(Date.now(), Date.now(), Date.now() + 900000, p.id)
          .run();
        throw new Failure(401, "Code incorrect.");
      }
    }
    await db()
      .prepare("UPDATE profiles SET failures=0,locked_until=0 WHERE id=?")
      .bind(p.id)
      .run();
    const raw = token();
    await db()
      .prepare("INSERT INTO sessions(token,profile_id,expires) VALUES(?,?,?)")
      .bind(await hash(raw), p.id, Date.now() + 2592000000)
      .run();
    headers.append("Set-Cookie", setCookie(req, n.session, raw, true));
    return { ok: true };
  }
  const p = await mustUser(req);
  if (path[0] === "logout" && method === "POST") {
    await db()
      .prepare("DELETE FROM sessions WHERE token=?")
      .bind(await hash(cookie(req, n.session)))
      .run();
    headers.append("Set-Cookie", setCookie(req, n.session, "", true, 0));
    return { ok: true };
  }
  if (path[0] === "home") {
    const rooms = await db()
      .prepare(
        "SELECT id,code,host,status,players,created,game_id FROM rooms r WHERE status IN ('lobby','playing') AND EXISTS(SELECT 1 FROM jsonb_array_elements(r.players::jsonb) a WHERE a->>'id'=?) ORDER BY created DESC LIMIT 10",
      )
      .bind(p.id)
      .all();
    const invitations = await db()
      .prepare(
        "SELECT i.id,r.id AS room,r.code,p.name FROM invitations i JOIN rooms r ON r.id=i.room JOIN profiles p ON p.id=r.host WHERE i.recipient=? AND r.status='lobby' ORDER BY i.created DESC LIMIT 10",
      )
      .bind(p.id)
      .all();
    return {
      rooms: rooms.results,
      stats: (await stats()).results,
      profiles: await profiles(),
      invitations: invitations.results,
    };
  }
  if (path[0] === "profile" && method === "PATCH") {
    const b = await json(),
      name = typeof b.name === "string" ? b.name.trim() : p.name,
      expression =
        typeof b.expression === "string" ? b.expression : p.expression;
    requireRule(
      name.length > 0 && name.length <= 24,
      "Choisis un surnom entre 1 et 24 caractères.",
    );
    const expressions = siteConfig.profiles.find(
      (x) => x.id === p.id,
    )!.expressions;
    requireRule(expressions.includes(expression), "Expression inconnue.");
    await db()
      .prepare("UPDATE profiles SET name=?,expression=? WHERE id=?")
      .bind(name, expression, p.id)
      .run();
    return { ok: true };
  }
  if (path[0] === "rooms" && !path[1] && method === "POST") {
    const b = await json(),
      bots = Number(b.bots ?? 0),
      capacity = Number(b.capacity ?? 2),
      rounds = Number(b.roundLimit ?? 40),
      gameId = String(b.gameId ?? "meganopoly"),
      game = gameId === "meganopoly" ? { min: 2, max: 6 } : PARTY_GAMES.find((x) => x.id === gameId);
    if (!game) throw new Failure(400, "Jeu inconnu.");
    requireRule(
      Number.isInteger(capacity) &&
        capacity >= game.min &&
        capacity <= game.max &&
        Number.isInteger(bots) &&
        bots >= 0 &&
        bots < capacity &&
        bots <= capacity - 1 &&
        Number.isInteger(rounds) &&
        rounds >= 10 &&
        rounds <= 100,
      "Paramètres de soirée invalides.",
    );
    const active = await db()
      .prepare(
        "SELECT COUNT(*) AS n FROM rooms WHERE host=? AND status IN ('lobby','playing')",
      )
      .bind(p.id)
      .first<{ n: number }>();
    requireRule(active!.n < 5, "Tu as déjà cinq soirées en cours.", 429);
    const id = crypto.randomUUID(),
      alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
      code = Array.from(
        { length: 6 },
        () => alphabet[rng.int(alphabet.length)],
      ).join("");
    const players: Player[] = [
      { id: p.id, ready: false, bot: false },
      ...Array.from({ length: bots }, (_, i) => ({
        id: `bot:${id}:${i + 1}`,
        ready: true,
        bot: true,
      })),
    ];
    await db()
      .prepare(
        "INSERT INTO rooms(id,code,host,players,capacity,round_limit,updated,created,game_id) VALUES(?,?,?,?,?,?,?,?,?)",
      )
      .bind(
        id,
        code,
        p.id,
        JSON.stringify(players),
        capacity,
        rounds,
        Date.now(),
        Date.now(),
        gameId,
      )
      .run();
    return { id };
  }
  if (path[0] === "join" && method === "POST") {
    const b = await json(),
      code = String(b.code ?? "")
        .trim()
        .toUpperCase();
    const r = await db()
      .prepare("SELECT * FROM rooms WHERE code=?")
      .bind(code)
      .first<Room>();
    requireRule(r, "Ce code de soirée est introuvable.", 404);
    const players = JSON.parse(r!.players) as Player[];
    if (players.some((x) => x.id === p.id)) return { id: r!.id };
    requireRule(
      r!.status === "lobby" && players.length < r!.capacity,
      "Cette soirée n’a plus de place.",
    );
    players.push({ id: p.id, ready: false, bot: false });
    await save(r!, null, players);
    return { id: r!.id };
  }
  if (path[0] === "rooms" && path[1]) {
    let r = await getRoom(path[1], p);
    const players = JSON.parse(r.players) as Player[],
      action = path[2];
    if (method === "GET" && !action) {
      r = await tick(r);
      return view(r, p);
    }
    if (action === "messages") {
      if (method === "POST") {
        const b = await json(),
          text = String(b.text ?? "").trim();
        requireRule(
          text.length > 0 && text.length <= 300,
          "Message limité à 300 caractères.",
        );
        await db()
          .prepare(
            "INSERT INTO messages(id,room,profile,body,created) VALUES(?,?,?,?,?)",
          )
          .bind(crypto.randomUUID(), r.id, p.id, text, Date.now())
          .run();
        return { ok: true };
      }
      return (
        await db()
          .prepare(
            "SELECT m.id,m.body,m.created,p.name FROM messages m JOIN profiles p ON p.id=m.profile WHERE m.room=? ORDER BY m.created DESC LIMIT 50",
          )
          .bind(r.id)
          .all()
      ).results.reverse();
    }
    if (action === "invite" && method === "POST") {
      requireRule(r.status === "lobby", "Cette partie a déjà commencé.");
      const target = siteConfig.profiles.find((x) => x.id !== p.id)!;
      await db()
        .prepare(
          "INSERT INTO invitations(id,recipient,room,created) VALUES(?,?,?,?)",
        )
        .bind(crypto.randomUUID(), target.id, r.id, Date.now())
        .run();
      return { ok: true };
    }
    if (action === "ready" && method === "POST") {
      for (let attempt = 0; attempt < 3; attempt++) {
        r = await getRoom(r.id, p);
        requireRule(r.status === "lobby", "La partie a déjà commencé.");
        const fresh = JSON.parse(r.players) as Player[];
        const own = fresh.find((x) => x.id === p.id)!;
        own.ready = !own.ready;
        try {
          return view(await save(r, null, fresh), p);
        } catch (e) {
          if (!(e instanceof Failure && e.code === 409 && attempt < 2)) throw e;
        }
      }
    }
    if (action === "start" && method === "POST") {
      const gameInfo = PARTY_GAMES.find((x) => x.id === r.game_id),
        minPlayers = r.game_id === "meganopoly" ? 2 : gameInfo?.min ?? 2;
      requireRule(
        r.host === p.id &&
          r.status === "lobby" &&
          players.length >= minPlayers &&
          players.every((x) => x.ready),
        "Tous les joueurs doivent être prêts ; seul l’hôte peut lancer.",
      );
      const state = r.game_id === "meganopoly"
        ? meganopoly.createInitialState(players.map((x) => x.id), { roundLimit: r.round_limit }, rng)
        : partyGames.createInitialState(r.game_id as PartyState["gameId"], players.map((x) => x.id), rng);
      return view(await save(r, state), p);
    }
    if (action === "action" && method === "POST") {
      const b = await json();
      requireRule(
        r.status === "playing" && r.state,
        "La partie n’est pas en cours.",
      );
      requireRule(
        b.version === r.version,
        "La partie a évolué : réessaie ton action.",
        409,
      );
      const result = r.game_id === "meganopoly"
        ? meganopoly.applyAction(JSON.parse(r.state!), p.id, b.action, rng)
        : partyGames.applyAction(JSON.parse(r.state!) as PartyState, p.id, b.action as Record<string, any>, rng);
      requireRule(result.ok, "Ce coup n’est pas autorisé.");
      return view(await save(r, result.ok ? result.state : null), p);
    }
    if (action === "leave" && method === "POST") {
      if (r.status === "playing" && r.state) {
        if (r.game_id === "meganopoly") {
          const s = estateStateSchema.parse(JSON.parse(r.state));
          if (!s.eliminated.includes(s.players.indexOf(p.id)))
            await save(r, meganopoly.forfeit(s, p.id, rng));
        } else {
          const s = JSON.parse(r.state) as PartyState;
          s.finished = true; s.phase = "finished"; s.ranking = s.players.filter((id) => id !== p.id);
          await save(r, s);
        }
      } else if (r.status === "lobby") {
        if (r.host === p.id) await save(r, null, players, "cancelled");
        else
          await save(
            r,
            null,
            players.filter((x) => x.id !== p.id),
          );
      }
      return { ok: true };
    }
  }
  throw new Failure(404, "Page introuvable.");
}
async function handle(req: Request) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  try {
    return new Response(JSON.stringify(await dispatch(req, headers)), {
      headers,
    });
  } catch (error) {
    const known = error instanceof Failure;
    if (!known)
      console.error(
        "API_REQUEST_FAILED",
        error instanceof Error ? error.message : "Unknown",
      );
    return new Response(
      JSON.stringify({
        error: known
          ? error.message
          : "Le serveur est momentanément indisponible.",
      }),
      { status: known ? error.code : 503, headers },
    );
  }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
