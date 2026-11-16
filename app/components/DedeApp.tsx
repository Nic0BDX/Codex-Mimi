"use client";
import { useEffect, useState, useCallback, type FormEvent } from "react";
import {
  Home,
  Backpack,
  Trophy,
  Users,
  Settings,
  LogOut,
  Plus,
  LogIn,
  ArrowLeft,
  Copy,
  Check,
  Gamepad2,
  Send,
  Sun,
  Moon,
  Volume2,
  Heart,
  Play,
  Dice5,
} from "lucide-react";
import { siteConfig } from "../config";
import { MeganopolyGame } from "./MeganopolyGame";
import { PartyGame } from "./PartyGame";
import type { EngineView } from "../game/engine/types";
import { PARTY_GAMES, type PartyState } from "../game/party";
import "../soiree.css";
import "../meganopoly.css";
type Profile = {
  id: string;
  name: string;
  avatar: string;
  expression: string;
  has_pin?: number;
};
type Player = { id: string; ready: boolean; bot: boolean };
type Room = {
  id: string;
  code: string;
  host: string;
  status: string;
  players: Player[];
  version: number;
  capacity: number;
  round_limit: number;
  game_id: string;
  view: (EngineView | (PartyState & { turn: string | null; legalActions: unknown[] })) | null;
};
type Stats = {
  id: string;
  name: string;
  avatar: string;
  expression: string;
  played: number;
  wins: number;
};
type HomeData = {
  rooms: { id: string; code: string; status: string; game_id: string }[];
  stats: Stats[];
  profiles: Profile[];
  invitations: { id: string; room: string; code: string; name: string }[];
};
let csrf = "";
class ApiFailure extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
async function api<T = unknown>(
  path: string,
  body?: unknown,
  method = body === undefined ? "GET" : "POST",
  retry = true,
): Promise<T> {
  const response = await fetch("/api/" + path, {
    method,
    credentials: "same-origin",
    signal: AbortSignal.timeout(15000),
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = (await response.json()) as {
    error?: string;
    csrf?: string;
    [key: string]: unknown;
  };
  if (!response.ok) {
    if (data.error === "CSRF_INVALID" && retry && path !== "session") {
      const s = await api<{ csrf: string }>("session");
      csrf = s.csrf;
      return api(path, body, method, false);
    }
    throw new ApiFailure(
      data.error || "Une erreur est survenue.",
      response.status,
    );
  }
  if (data.csrf) csrf = data.csrf;
  return data as T;
}
function Avatar({
  profile,
  expression,
  size = 72,
}: {
  profile: Pick<Profile, "avatar" | "name">;
  expression?: string;
  size?: number;
}) {
  return (
    <img
      className="dede-avatar"
      src={`/chibis/${profile.avatar}/default/${expression || "joie"}.webp`}
      width={size}
      height={size}
      alt={profile.name}
      onError={(e) => {
        const fallback = `/chibis/${profile.avatar}/default/joie.webp`;
        if (!e.currentTarget.src.endsWith(fallback))
          e.currentTarget.src = fallback;
      }}
    />
  );
}
function routeNow() {
  return typeof location === "undefined" ? "/" : location.pathname;
}
export default function DedeApp() {
  const [path, setPath] = useState("/"),
    [profile, setProfile] = useState<Profile | null>(null),
    [profiles, setProfiles] = useState<Profile[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [home, setHome] = useState<HomeData | null>(null),
    [room, setRoom] = useState<Room | null>(null),
    [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<Profile | null>(null),
    [pin, setPin] = useState(""),
    [confirmPin, setConfirmPin] = useState<string | null>(null),
    [theme, setTheme] = useState("system"),
    [sound, setSound] = useState(true),
    [modal, setModal] = useState<"create" | "join" | null>(null),
    [selectedGame, setSelectedGame] = useState("meganopoly"),
    [rules, setRules] = useState(false);
  const [messages, setMessages] = useState<
    { id: string; name: string; body: string }[]
  >([]);
  const navigate = useCallback((next: string) => {
    history.pushState(null, "", next);
    setPath(next);
    setRoom(null);
    setError("");
    setNotice("");
    scrollTo({ top: 0, behavior: "instant" });
  }, []);
  const loadSession = useCallback(async () => {
    try {
      const s = await api<{
        csrf: string;
        profile: Profile | null;
        profiles: Profile[];
      }>("session");
      setProfile(s.profile);
      setProfiles(s.profiles);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion indisponible.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    setPath(routeNow());
    void loadSession();
    const pop = () => {
      setPath(routeNow());
      setRoom(null);
    };
    addEventListener("popstate", pop);
    const t = localStorage.getItem("mimi-nini-theme") || "system";
    setTheme(t);
    setSound(localStorage.getItem("mimi-nini-sound") !== "false");
    return () => removeEventListener("popstate", pop);
  }, [loadSession]);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)"),
      apply = () =>
        document.documentElement.classList.toggle(
          "dark",
          theme === "dark" || (theme === "system" && media.matches),
        );
    apply();
    media.addEventListener("change", apply);
    localStorage.setItem("mimi-nini-theme", theme);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  useEffect(() => {
    if (!profile) return;
    let alive = true;
    const refresh = async () => {
      try {
        const h = await api<HomeData>("home");
        if (alive) {
          setHome(h);
          setProfiles(h.profiles);
        }
      } catch (e) {
        if (e instanceof ApiFailure && e.status === 401) {
          setProfile(null);
          setRoom(null);
        }
      }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 5000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [profile?.id]);
  const roomId = path.startsWith("/soiree/") ? path.split("/")[2] : null;
  useEffect(() => {
    if (!profile || !roomId) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      try {
        const r = await api<Room>(`rooms/${roomId}`);
        if (alive) setRoom(r);
        const m = await api<typeof messages>(`rooms/${roomId}/messages`);
        if (alive) setMessages(m);
      } catch (e) {
        if (alive)
          setError(e instanceof Error ? e.message : "Connexion interrompue.");
      }
      if (alive) timer = setTimeout(() => void refresh(), 1200);
    };
    void refresh();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [profile?.id, roomId]);
  function playSound() {
    if (!sound) return;
    try {
      const a = new AudioContext(),
        o = a.createOscillator(),
        g = a.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(660, a.currentTime);
      g.gain.setValueAtTime(0.035, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.12);
      o.connect(g);
      g.connect(a.destination);
      o.start();
      o.stop(a.currentTime + 0.12);
      o.onended = () => void a.close();
    } catch {}
  }
  async function task(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      playSound();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Le serveur ne répond pas.");
    } finally {
      setBusy(false);
    }
  }
  async function login(e: FormEvent) {
    e.preventDefault();
    if (!picked) return;
    if (!picked.has_pin && confirmPin === null) {
      setConfirmPin(pin);
      setPin("");
      return;
    }
    if (confirmPin !== null && pin !== confirmPin) {
      setError("Les deux codes sont différents, recommence.");
      setConfirmPin(null);
      setPin("");
      return;
    }
    await task(async () => {
      await api("login", { profileId: picked.id, pin });
      setPin("");
      setConfirmPin(null);
      setPicked(null);
      await loadSession();
      navigate("/");
    });
  }
  async function roomAction(action: string, body: unknown = {}) {
    await task(async () => {
      const r = await api<Room>(`rooms/${roomId}/${action}`, body);
      setRoom(r);
    });
  }
  function partyAction(action: Record<string, unknown>) {
    if (!room) return;
    void task(async () => {
      try { setRoom(await api<Room>(`rooms/${room.id}/action`, { version: room.version, action })); }
      catch (e) { setRoom(await api<Room>(`rooms/${room.id}`)); throw e; }
    });
  }
  const selectedGameInfo = selectedGame === "meganopoly"
    ? { title: "MÉGANOPOLY", min: 2, max: 6, description: "Les mariés, les chiens et un empire à construire." }
    : PARTY_GAMES.find((g) => g.id === selectedGame)!;
  const me = home?.stats.find((s) => s.id === profile?.id),
    xp = (me?.played ?? 0) * 10 + (me?.wins ?? 0) * 25;
  const name = (id: string) =>
    profiles.find((p) => p.id === id)?.name ?? `Robot ${id.split(":").at(-1)}`;
  const button = (text: string, onClick: () => void, secondary = false) => (
    <button
      className={`dede-button ${secondary ? "secondary" : ""}`}
      disabled={busy}
      onClick={onClick}
    >
      {text}
    </button>
  );
  const feedback = (
    <>
      {error && (
        <div className="dede-feedback error" role="alert">
          {error}
          <button onClick={() => setError("")} aria-label="Fermer l’erreur">
            ×
          </button>
        </div>
      )}
      {notice && (
        <div className="dede-feedback" role="status">
          {notice}
        </div>
      )}
    </>
  );
  if (loading)
    return (
      <main className="dede-loading">
        <Dice5 size={52} />
        <p>La soirée se prépare…</p>
      </main>
    );
  if (!profile)
    return (
      <main className="dede-onboarding">
        {feedback}
        {picked ? (
          <>
            <button
              className="dede-back"
              onClick={() => {
                setPicked(null);
                setConfirmPin(null);
                setPin("");
                setError("");
              }}
            >
              <ArrowLeft size={18} />
              Changer de personnage
            </button>
            <Avatar
              profile={picked}
              expression={confirmPin !== null ? "reflexion" : "joie"}
              size={140}
            />
            <h1>
              {confirmPin !== null
                ? "Confirme ton code"
                : picked.has_pin
                  ? "Ton code"
                  : "Choisis ton code secret"}
            </h1>
            <p className="muted">
              {picked.name},{" "}
              {confirmPin !== null
                ? "saisis-le une deuxième fois."
                : picked.has_pin
                  ? "entre ton code à 4 chiffres."
                  : "4 chiffres à retenir : il te servira à te reconnecter."}
            </p>
            <form onSubmit={login} className="pin-form">
              <label htmlFor="secret-pin" className="visually-hidden">
                Code secret à quatre chiffres
              </label>
              <input
                id="secret-pin"
                className="pin-input"
                type="password"
                inputMode="numeric"
                autoComplete={
                  picked.has_pin ? "current-password" : "new-password"
                }
                pattern="[0-9]{4}"
                maxLength={4}
                minLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
              />
              <button
                className="dede-button"
                disabled={busy || pin.length !== 4}
              >
                {busy
                  ? "Un instant…"
                  : confirmPin !== null
                    ? "Confirmer et entrer"
                    : picked.has_pin
                      ? "Entrer dans la soirée"
                      : "Continuer"}
              </button>
            </form>
          </>
        ) : (
          <>
            <header>
              <div className="welcome-emoji" aria-hidden="true">
                🥳
              </div>
              <h1>{siteConfig.title}</h1>
              <p className="muted">Choisis ton personnage</p>
            </header>
            <div className="character-grid">
              {profiles.map((p) => (
                <button
                  className="sticker character-card"
                  key={p.id}
                  style={
                    {
                      "--accent": siteConfig.profiles.find((c) => c.id === p.id)
                        ?.color,
                    } as React.CSSProperties
                  }
                  onClick={() => {
                    setPicked(p);
                    setError("");
                  }}
                >
                  <Avatar profile={p} size={140} />
                  <strong>{p.name}</strong>
                  <span>
                    {p.has_pin ? "🔒 Code secret" : "✨ Première connexion"}
                  </span>
                </button>
              ))}
            </div>
            <p className="onboarding-foot">Les mini-jeux de la bande 💛</p>
          </>
        )}
      </main>
    );
  return (
    <div className="dede-app">
      <header className="dede-top">
        <button className="brand" onClick={() => navigate("/")}>
          <span>🥳</span>
          <span>{siteConfig.title}</span>
        </button>
        <button
          className="icon-button"
          aria-label="Paramètres"
          onClick={() => navigate("/parametres")}
        >
          <Settings size={21} />
        </button>
      </header>
      <main className="dede-content">
        {feedback}
        {path === "/" && (
          <>
            <section className="sticker hello-card">
              <Avatar profile={profile} expression={profile.expression} />
              <div>
                <p className="muted small">Salut,</p>
                <h1>{profile.name} !</h1>
                <div className="badges">
                  <span>Niveau {Math.floor(xp / 100) + 1}</span>
                  <span>
                    🏆 {me?.wins ?? 0} victoire{me?.wins === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
              <div className="xp-track">
                <span style={{ width: `${xp % 100}%` }} />
              </div>
              <small className="xp-caption">{xp % 100} / 100 xp</small>
            </section>
            {!!home?.rooms.length && (
              <>
                <h2>Ma soirée en cours</h2>
                {home.rooms.map((r) => (
                  <button
                    key={r.id}
                    className="sticker active-room"
                    onClick={() => navigate("/soiree/" + r.id)}
                  >
                    <span>🎲</span>
                    <div>
                      <strong>Soirée {r.game_id === "meganopoly" ? "MÉGANOPOLY" : PARTY_GAMES.find((g) => g.id === r.game_id)?.title ?? "jeu"}</strong>
                      <small>
                        {r.status === "playing"
                          ? "La partie est lancée"
                          : "On attend les joueurs"}{" "}
                        · {r.code}
                      </small>
                    </div>
                    <Play size={19} />
                  </button>
                ))}
              </>
            )}
            <div className="home-actions">
              <button
                className="dede-button"
                onClick={() => { setSelectedGame("meganopoly"); setModal("create"); }}
              >
                <Plus />
                Créer une soirée
              </button>
              <button
                className="dede-button secondary"
                onClick={() => setModal("join")}
              >
                <LogIn />
                Rejoindre une soirée
              </button>
            </div>
            {!!home?.invitations.length && (
              <section className="sticker">
                <h2>💌 Les invitations</h2>
                {home.invitations.map((inv) => (
                  <div className="invite" key={inv.id}>
                    <p>{inv.name} t’invite à sa soirée.</p>
                    {button(
                      "Rejoindre",
                      () =>
                        void task(async () => {
                          const r = await api<{ id: string }>("join", {
                            code: inv.code,
                          });
                          navigate("/soiree/" + r.id);
                        }),
                    )}
                  </div>
                ))}
              </section>
            )}
            <h2>Les jeux</h2>
            <article className="sticker game-card">
              <div className="game-title">
                <span className="game-emoji">🎩</span>
                <div>
                  <h2>MÉGANOPOLY</h2>
                  <p>Les mariés, les chiens et un empire à construire.</p>
                </div>
              </div>
              <img
                className="game-preview"
                src="/art/meganopoly-reference.png"
                alt="MÉGANOPOLY : les mariés et leurs chiens"
              />
              <div className="game-meta">
                <span>👥 2 à 6 joueurs</span>
                <span>🤖 Solo avec robots</span>
              </div>
              <button
                className="dede-button"
                onClick={() => { setSelectedGame("meganopoly"); setModal("create"); }}
              >
                <Play size={19} />
                Jouer
              </button>
            </article>
            <div className="party-game-grid">
              {PARTY_GAMES.map((game) => (
                <article className="sticker game-card" key={game.id}>
                  <div className="game-title"><span className="game-emoji">{game.emoji}</span><div><h2>{game.title}</h2><p>{game.description}</p></div></div>
                  <div className="game-meta"><span>{game.min}–{game.max} joueurs</span><span>Partage le code de la soirée</span></div>
                  <button className="dede-button" onClick={() => { setSelectedGame(game.id); setModal("create"); }}><Play size={19}/>Jouer</button>
                </article>
              ))}
            </div>
          </>
        )}
        {path === "/inventaire" && (
          <>
            <h1>Inventaire</h1>
            <p className="muted">Ton personnage, tes humeurs, ta soirée.</p>
            <section className="sticker inventory-hero">
              <Avatar
                profile={profile}
                expression={profile.expression}
                size={160}
              />
              <h2>{profile.name}</h2>
              <span className="badge">
                Niveau {Math.floor(xp / 100) + 1} · {xp} xp
              </span>
            </section>
            <h2>Expressions</h2>
            <div className="expression-grid">
              {siteConfig.profiles
                .find((p) => p.id === profile.id)!
                .expressions.map((expression) => (
                  <button
                    key={expression}
                    className={`sticker expression-card ${profile.expression === expression ? "equipped" : ""}`}
                    onClick={() =>
                      void task(async () => {
                        await api("profile", { expression }, "PATCH");
                        await loadSession();
                        setNotice("Expression équipée !");
                      })
                    }
                    disabled={busy}
                  >
                    <Avatar
                      profile={profile}
                      expression={expression}
                      size={88}
                    />
                    <span>{expression.replace("_", " ")}</span>
                    {profile.expression === expression && <Check size={16} />}
                  </button>
                ))}
            </div>
          </>
        )}
        {path === "/classement" && (
          <>
            <h1>Classement</h1>
            <p className="muted">Le tableau des champions 🏆</p>
            <section className="sticker ranking">
              {home?.stats
                .slice()
                .sort((a, b) => b.wins - a.wins)
                .map((s, i) => (
                  <div className="rank-row" key={s.id}>
                    <b className="rank-medal">{["🥇", "🥈"][i]}</b>
                    <Avatar profile={s} expression={s.expression} size={58} />
                    <div>
                      <strong>{s.name}</strong>
                      <small>
                        {s.played} partie{s.played === 1 ? "" : "s"} jouée
                        {s.played === 1 ? "" : "s"}
                      </small>
                    </div>
                    <strong>{s.wins} 🏆</strong>
                  </div>
                ))}
            </section>
            <p className="muted centered">
              Les résultats viennent de vos vraies parties.
            </p>
          </>
        )}
        {path === "/amis" && (
          <>
            <h1>Les amis</h1>
            <p className="muted">La meilleure soirée, c’est ensemble 💛</p>
            {profiles
              .filter((p) => p.id !== profile.id)
              .map((p) => (
                <section className="sticker friend-card" key={p.id}>
                  <Avatar profile={p} expression={p.expression} size={100} />
                  <h2>{p.name}</h2>
                  <p>Prêts pour une soirée MÉGANOPOLY ?</p>
                  <button
                    className="dede-button"
                    onClick={() => setModal("create")}
                  >
                    <Heart size={18} />
                    Créer votre soirée
                  </button>
                  <p className="muted small">
                    Envoie-lui ensuite une invitation depuis le salon.
                  </p>
                </section>
              ))}
          </>
        )}
        {path === "/parametres" && (
          <>
            <h1>Paramètres</h1>
            <section className="sticker">
              <h2>Ton profil</h2>
              <form
                className="settings-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  void task(async () => {
                    await api("profile", { name: data.get("name") }, "PATCH");
                    await loadSession();
                    setNotice("Ton surnom a été enregistré.");
                  });
                }}
              >
                <label>
                  Ton surnom
                  <input
                    name="name"
                    defaultValue={profile.name}
                    maxLength={24}
                    required
                  />
                </label>
                <button className="dede-button" disabled={busy}>
                  Enregistrer
                </button>
              </form>
            </section>
            <section className="sticker">
              <h2>À ton goût</h2>
              <label className="setting-row">
                <span>
                  <Sun size={20} />
                  Thème
                </span>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="system">Automatique</option>
                  <option value="light">Clair</option>
                  <option value="dark">Sombre</option>
                </select>
              </label>
              <label className="setting-row">
                <span>
                  <Volume2 size={20} />
                  Effets sonores
                </span>
                <input
                  type="checkbox"
                  checked={sound}
                  onChange={(e) => {
                    setSound(e.target.checked);
                    localStorage.setItem(
                      "mimi-nini-sound",
                      String(e.target.checked),
                    );
                  }}
                />
              </label>
            </section>
            <button
              className="dede-button danger"
              disabled={busy}
              onClick={() =>
                void task(async () => {
                  await api("logout", {});
                  setProfile(null);
                  setHome(null);
                  setPicked(null);
                  navigate("/");
                  await loadSession();
                })
              }
            >
              <LogOut size={18} />
              Changer de personnage
            </button>
          </>
        )}
        {roomId &&
          (!room ? (
            <div className="centered">
              <Dice5 className="spin" />
              <p>On prépare le plateau…</p>
            </div>
          ) : (
            <>
              <button className="dede-back" onClick={() => navigate("/")}>
                <ArrowLeft size={18} />
                Retour à l’accueil
              </button>
              <h1>La soirée {room.game_id === "meganopoly" ? "MÉGANOPOLY" : PARTY_GAMES.find((g) => g.id === room.game_id)?.title}</h1>
              <section className="sticker lobby-info">
                <span className="muted small">LE CODE DE LA SOIRÉE</span>
                <button
                  className="room-code"
                  onClick={() =>
                    void task(async () => {
                      await navigator.clipboard.writeText(room.code);
                      setNotice("Code copié !");
                    })
                  }
                >
                  {room.code}
                  <Copy size={18} />
                </button>
                <p className="muted">
                  {room.players.length} / {room.capacity} joueurs ·{" "}
                  {room.game_id === "meganopoly" ? `${room.round_limit} tours maximum` : "Partie en ligne"}
                </p>
                <div className="lobby-players">
                  {room.players.map((p) => {
                    const found = profiles.find((x) => x.id === p.id);
                    return (
                      <div className="lobby-player" key={p.id}>
                        {found ? (
                          <Avatar
                            profile={found}
                            expression={found.expression}
                            size={70}
                          />
                        ) : (
                          <span className="robot">🤖</span>
                        )}
                        <strong>{name(p.id)}</strong>
                        <span className={`badge ${p.ready ? "ready" : ""}`}>
                          {p.ready ? "Prêt !" : "Pas encore prêt"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {room.status === "lobby" && (
                  <>
                    <button
                      className="dede-button secondary"
                      disabled={busy}
                      onClick={() =>
                        void task(async () => {
                          await api(`rooms/${room.id}/invite`, {});
                          setNotice("Invitation envoyée !");
                        })
                      }
                    >
                      💌 Inviter{" "}
                      {profiles.find((p) => p.id !== profile.id)?.name}
                    </button>
                    <button
                      className="dede-button"
                      disabled={busy}
                      onClick={() => void roomAction("ready")}
                    >
                      {room.players.find((p) => p.id === profile.id)?.ready
                        ? "Finalement, attends…"
                        : "Je suis prêt !"}
                    </button>
                    {room.host === profile.id && (
                      <button
                        className="dede-button grape"
                        disabled={
                          busy ||
                          room.players.length < (room.game_id === "meganopoly" ? 2 : PARTY_GAMES.find((g) => g.id === room.game_id)?.min ?? 2) ||
                          !room.players.every((p) => p.ready)
                        }
                        onClick={() => void roomAction("start")}
                      >
                        <Play size={20} />
                        Lancer la partie
                      </button>
                    )}
                  </>
                )}
              </section>
              {room.status === "playing" && room.view && (
                <>
                  <div className="turn-banner">
                    {room.view.turn === profile.id
                      ? "À toi de jouer !"
                      : `Au tour de ${name(room.view.turn ?? "")}`}
                  </div>
                  {room.game_id === "meganopoly" && <button
                    className="dede-button secondary"
                    onClick={() => setRules(!rules)}
                  >
                    📖 {rules ? "Fermer les règles" : "Les règles"}
                  </button>}
                  {room.game_id === "meganopoly" && rules && (
                    <section className="sticker rules">
                      <h2>Les règles de MÉGANOPOLY</h2>
                      <p>
                        1 500 € au départ. Lance les dés, achète les cases
                        libres ou mets-les aux enchères. Réunis les groupes de
                        couleur pour construire. Hypothèque ou vends tes
                        bâtiments pour régler tes dettes. Les échanges exigent
                        l’accord de l’autre joueur.
                      </p>
                      <p>
                        Un double permet de rejouer, trois doubles envoient en
                        prison. Pour sortir : un double, une carte ou 50 €. Le
                        dernier joueur solvable gagne ; à la limite de tours, le
                        plus grand patrimoine l’emporte.
                      </p>
                    </section>
                  )}
                  {room.game_id === "meganopoly" ? <MeganopolyGame
                    view={room.view as EngineView}
                    name={name}
                    disabled={busy}
                    onAction={(action) =>
                      void task(async () => {
                        try {
                          const updated = await api<Room>(
                            `rooms/${room.id}/action`,
                            { version: room.version, action },
                          );
                          setRoom(updated);
                        } catch (e) {
                          setRoom(await api<Room>(`rooms/${room.id}`));
                          throw e;
                        }
                      })
                    }
                  /> : <PartyGame state={room.view as PartyState & { turn: string | null; legalActions: unknown[] }} me={profile.id} name={name} disabled={busy} onAction={partyAction} />}
                </>
              )}
              {room.status === "finished" && (
                <section className="sticker results">
                  <div className="welcome-emoji">🏆</div>
                  <h2>Quelle soirée !</h2>
                  {room.game_id !== "meganopoly" && <p>{(room.view as PartyState | null)?.prompt}</p>}
                  {room.game_id === "undercover" && <p>Mot : {(room.view as PartyState).data.reveal?.word} · infiltré : {name((room.view as PartyState).data.reveal?.undercover ?? "")}</p>}
                  {room.game_id === "dessine-devine" && <p>Mot : {(room.view as PartyState).data.revealWord}</p>}
                  {room.view?.ranking.map((id, i) => (
                    <div className="result-line" key={id}>
                      <b>{i + 1}.</b>
                      <strong>{name(id)}</strong>
                    </div>
                  ))}
                  <button
                    className="dede-button"
                    onClick={() => setModal("create")}
                  >
                    Une autre partie ?
                  </button>
                </section>
              )}
              <section className="sticker chat">
                <h2>La discussion</h2>
                <div role="log" aria-label="Messages de la soirée">
                  {messages.map((m) => (
                    <p key={m.id}>
                      <strong>{m.name}</strong>
                      <span>{m.body}</span>
                    </p>
                  ))}
                  {messages.length === 0 && (
                    <p className="muted">Un petit mot avant de jouer ? 💬</p>
                  )}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget,
                      text = String(new FormData(form).get("text") ?? "");
                    void task(async () => {
                      await api(`rooms/${room.id}/messages`, { text });
                      form.reset();
                      setMessages(await api(`rooms/${room.id}/messages`));
                    });
                  }}
                >
                  <label className="visually-hidden" htmlFor="chat-text">
                    Ton message
                  </label>
                  <input
                    id="chat-text"
                    name="text"
                    placeholder="Ton message…"
                    maxLength={300}
                    required
                  />
                  <button
                    className="icon-button"
                    aria-label="Envoyer le message"
                    disabled={busy}
                  >
                    <Send size={21} />
                  </button>
                </form>
              </section>
              {room.status !== "finished" && (
                <button
                  className="dede-button danger"
                  disabled={busy}
                  onClick={() => {
                    if (
                      confirm(
                        room.status === "playing"
                          ? "Quitter la partie et déclarer forfait ?"
                          : "Quitter cette soirée ?",
                      )
                    )
                      void task(async () => {
                        await api(`rooms/${room.id}/leave`, {});
                        navigate("/");
                        setHome(await api("home"));
                      });
                  }}
                >
                  Quitter la soirée
                </button>
              )}
            </>
          ))}
      </main>
      <nav className="dede-nav" aria-label="Navigation principale">
        {[
          { to: "/", title: "Accueil", Icon: Home },
          { to: "/inventaire", title: "Inventaire", Icon: Backpack },
          { to: "/classement", title: "Classement", Icon: Trophy },
          { to: "/amis", title: "Amis", Icon: Users },
        ].map(({ to, title, Icon }) => (
          <button
            key={to}
            className={path === to ? "active" : ""}
            onClick={() => navigate(to)}
            aria-current={path === to ? "page" : undefined}
          >
            <Icon size={22} />
            <span>{title}</span>
          </button>
        ))}
      </nav>
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            className="sticker dede-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Fermer"
              onClick={() => setModal(null)}
            >
              ×
            </button>
            <h2 id="modal-title">
              {modal === "create" ? "Créer une soirée" : "Rejoindre une soirée"}
            </h2>
            <p className="muted">
              {modal === "create"
                ? selectedGameInfo.description
                : "Demande le code à l’autre joueur."}
            </p>
            <form
              className="settings-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void task(async () => {
                  const r =
                    modal === "create"
                      ? await api<{ id: string }>("rooms", {
                          gameId: selectedGame,
                          capacity: Number(f.get("capacity")),
                          bots: Number(f.get("bots")),
                          roundLimit: Number(f.get("rounds")),
                        })
                      : await api<{ id: string }>("join", {
                          code: f.get("code"),
                        });
                  setModal(null);
                  navigate("/soiree/" + r.id);
                  setHome(await api("home"));
                });
              }}
            >
              {modal === "create" ? (
                <>
                  <label>
                    Nombre de places
                    <select name="capacity" defaultValue={String(selectedGameInfo.max)}>
                      {Array.from({ length: selectedGameInfo.max - selectedGameInfo.min + 1 }, (_, i) => selectedGameInfo.min + i).map((n) => (
                        <option key={n} value={n}>
                          {n} joueurs
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Nombre de robots
                    <input
                      name="bots"
                      type="number"
                      min="0"
                      max={String(selectedGameInfo.max - 1)}
                      defaultValue={String(selectedGameInfo.min - 1)}
                      required
                    />
                  </label>
                  <label>
                    Nombre maximal de tours
                    <input
                      name="rounds"
                      type="number"
                      min="10"
                      max="100"
                      defaultValue="40"
                      required
                    />
                  </label>
                </>
              ) : (
                <label>
                  Code de la soirée
                  <input
                    name="code"
                    autoFocus
                    maxLength={6}
                    minLength={6}
                    placeholder="ABC123"
                    autoCapitalize="characters"
                    required
                  />
                </label>
              )}
              <button className="dede-button" disabled={busy}>
                {busy
                  ? "Un instant…"
                  : modal === "create"
                    ? "Créer la soirée"
                    : "Rejoindre"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
