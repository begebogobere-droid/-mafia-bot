import { DurableObject } from "cloudflare:workers";


const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  telegram_id INTEGER PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  started_bot INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  chat_id INTEGER NOT NULL,
  chat_title TEXT,
  host_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  phase TEXT,
  day_number INTEGER NOT NULL DEFAULT 0,
  night_number INTEGER NOT NULL DEFAULT 0,
  winner TEXT,
  player_count INTEGER,
  config_json TEXT,
  saved_default_permissions TEXT,
  phase_ends_at INTEGER,
  started_at INTEGER,
  finished_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_games_chat_status ON games(chat_id, status);
CREATE TABLE IF NOT EXISTS game_players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  username TEXT,
  first_name TEXT,
  display_name TEXT NOT NULL,
  role TEXT,
  team TEXT,
  independent_role TEXT,
  status TEXT NOT NULL DEFAULT 'alive',
  death_reason TEXT,
  death_phase TEXT,
  death_round INTEGER,
  original_member_json TEXT,
  joined_at INTEGER NOT NULL,
  UNIQUE(game_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_players_user_game ON game_players(user_id, game_id);
CREATE TABLE IF NOT EXISTS night_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  night_number INTEGER NOT NULL,
  actor_id INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  target_id INTEGER,
  target_role TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(game_id, night_number, actor_id, action_type)
);
CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  day_number INTEGER NOT NULL,
  voter_id INTEGER NOT NULL,
  target_id INTEGER,
  weight INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  UNIQUE(game_id, day_number, voter_id)
);
CREATE TABLE IF NOT EXISTS verdict_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  day_number INTEGER NOT NULL,
  voter_id INTEGER NOT NULL,
  guilty INTEGER NOT NULL DEFAULT 0,
  weight INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  UNIQUE(game_id, day_number, voter_id)
);
CREATE TABLE IF NOT EXISTS game_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT,
  created_at INTEGER NOT NULL
);
`;

async function ensureSchema(db: D1Database): Promise<void> {
  const statements = SCHEMA_SQL.split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => db.prepare(s));
  await db.batch(statements);
}


// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type Team = "mafia" | "town" | "independent";

export type RoleId =
  | "godfather"
  | "lecter"
  | "nato"
  | "detective"
  | "doctor"
  | "sniper"
  | "mayor"
  | "gunner"
  | "invincible"
  | "escort"
  | "paranoid";

export type IndependentRoleId = "johnny" | "joker" | "bomber" | "lonewolf";

export type GunType = "war" | "black";

export type PlayerStatus = "alive" | "dead" | "left";

export type GameStatus =
  | "idle"
  | "lobby"
  | "starting"
  | "night"
  | "day"
  | "nomination"
  | "defense"
  | "verdict"
  | "resolving"
  | "finished"
  | "cancelled";

export type Phase =
  | "lobby"
  | "night"
  | "day"
  | "nomination"
  | "defense"
  | "verdict"
  | "resolving"
  | "finished";

export type DeathReason =
  | "mafia"
  | "nato"
  | "johnny"
  | "bomber"
  | "sniper"
  | "sniper_penalty"
  | "gunner"
  | "paranoid_alert"
  | "lynch"
  | "left"
  | "host"
  | "joker";

export type NightActionType =
  | "mafia_kill"
  | "heal"
  | "investigate"
  | "snipe"
  | "escort_block"
  | "nato_guess"
  | "paranoid_alert"
  | "bomber_mark"
  | "bomber_explode"
  | "johnny_kill";

export type AlarmKind = "phase_end" | "reminder" | "countdown" | "none";

export interface ChatPermissions {
  can_send_messages?: boolean;
  can_send_audios?: boolean;
  can_send_documents?: boolean;
  can_send_photos?: boolean;
  can_send_videos?: boolean;
  can_send_video_notes?: boolean;
  can_send_voice_notes?: boolean;
  can_send_polls?: boolean;
  can_send_other_messages?: boolean;
  can_add_web_page_previews?: boolean;
  can_change_info?: boolean;
  can_invite_users?: boolean;
  can_pin_messages?: boolean;
  can_manage_topics?: boolean;
}

export interface SavedMember {
  status: string;
  isAdmin: boolean;
  isOwner: boolean;
  permissions: ChatPermissions | null;
  customTitle?: string;
}

export interface GameConfig {
  minPlayers: number;
  maxPlayers: number;
  nightSeconds: number;
  daySecondsBase: number;
  daySecondsPerPlayer: number;
  daySecondsMax: number;
  voteSeconds: number;
  lobbySeconds: number;
  reminderLeadSeconds: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  minPlayers: 6,
  maxPlayers: 12,
  nightSeconds: 75,
  daySecondsBase: 90,
  daySecondsPerPlayer: 20,
  daySecondsMax: 300,
  voteSeconds: 55,
  lobbySeconds: 15 * 60,
  reminderLeadSeconds: 20,
};

export interface Player {
  userId: number;
  username: string | null;
  firstName: string;
  displayName: string;
  role: RoleId | null;
  team: Team | null;
  independentRole: IndependentRoleId | null;
  status: PlayerStatus;
  deathReason?: DeathReason;
  deathPhase?: Phase;
  deathRound?: number;
  originalMember: SavedMember | null;
  joinedAt: number;
}

export interface NightAction {
  actorId: number;
  type: NightActionType;
  targetId: number | null;
  targetRole?: RoleId | null;
  nightNumber: number;
  at: number;
}

export interface Vote {
  voterId: number;
  targetId: number | null;
  weight: number;
  dayNumber: number;
  at: number;
}

export interface VerdictVote {
  voterId: number;
  guilty: boolean;
  weight: number;
  dayNumber: number;
  at: number;
}

export interface DeathRecord {
  userId: number;
  reason: DeathReason;
  revealedRole: RoleId;
  revealedIndependentRole?: IndependentRoleId;
}

export interface GameState {
  id: string;
  chatId: number;
  chatTitle: string;
  hostId: number;
  status: GameStatus;
  phase: Phase;
  dayNumber: number;
  nightNumber: number;
  phaseEndsAt: number | null;
  dayPhaseMaxEndsAt: number | null;
  reminderAt: number | null;
  nextTickAt: number | null;
  alarmKind: AlarmKind;
  players: Player[];
  nightActions: NightAction[];
  votes: Vote[];
  verdictVotes: VerdictVote[];
  accusedUserId: number | null;
  temporaryCourtAdminUserId: number | null;
  silencedUserIds: number[];
  blockedUserIds: number[];
  escortBlockedUserIds: number[];
  doctorSelfHealUsedBy: number[];
  sniperShotsLeft: Record<string, number>;
  detectiveChecked: Record<string, number[]>;
  natoChancesLeft: number;
  paranoidAlertLeft: number;
  bomberMarkedTargets: number[];
  invincibleShieldHits: Record<string, number>;
  gunnerGuns: Record<string, GunType[]>;
  independentRoleType: IndependentRoleId | null;
  savedDefaultPermissions: ChatPermissions | null;
  lastGroupMessageId: number | null;
  pinnedMessageId: number | null;
  winner: Team | null;
  botUsername: string | null;
  botId: number | null;
  config: GameConfig;
  createdAt: number;
  updatedAt: number;
  startedAt: number | null;
  finishedAt: number | null;
}

export interface RoleDef {
  id: RoleId;
  team: Team;
  name: string;
  emoji: string;
  title: string;
  description: string;
  nightAction: NightActionType | null;
  nightOptional: boolean;
}

export interface IndependentRoleDef {
  id: IndependentRoleId;
  name: string;
  emoji: string;
  description: string;
  winCondition: string;
  nightAction: NightActionType | null;
  nightOptional: boolean;
}

export interface NightResolution {
  deaths: DeathRecord[];
  silenced: number[];
  investigations: Array<{ actorId: number; targetId: number; result: string }>;
  protectedIds: number[];
  mafiaTarget: number | null;
  natoTarget: number | null;
  natoGuessCorrect: boolean | null;
  sniperTarget: number | null;
  bomberMarked: number[];
  bomberExploded: boolean;
  lonewolfResult: string | null;
  shieldAbsorbed: number[];
  notes: string[];
}

export interface VerdictResolution {
  guilty: number;
  innocent: number;
  result: "guilty" | "innocent";
}

export interface VoteResolution {
  tallies: Array<{ userId: number | null; votes: number; names: string[] }>;
  eliminated: Player | null;
  tied: boolean;
}

export function isActiveStatus(status: GameStatus): boolean {
  return (
    status === "lobby" ||
    status === "starting" ||
    status === "night" ||
    status === "day" ||
    status === "nomination" ||
    status === "defense" ||
    status === "verdict" ||
    status === "resolving"
  );
}

export function isPlayingStatus(status: GameStatus): boolean {
  return (
    status === "starting" ||
    status === "night" ||
    status === "day" ||
    status === "nomination" ||
    status === "defense" ||
    status === "verdict" ||
    status === "resolving"
  );
}

export interface Env {
  DB: D1Database;
  GAME_ROOM: DurableObjectNamespace;
  BOT_TOKEN: string;
  WEBHOOK_SECRET: string;
}


// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function esc(text: string | null | undefined): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function mention(userId: number, name: string): string {
  return `<a href="tg://user?id=${userId}">${esc(name)}</a>`;
}

export function displayOf(user: {
  first_name?: string;
  last_name?: string;
  username?: string;
  id?: number;
}): string {
  const full = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (user.username) return user.username;
  return user.id ? `بازیکن ${user.id}` : "بازیکن";
}

export function formatRemain(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m <= 0) return `${s} ثانیه`;
  if (s === 0) return `${m} دقیقه`;
  return `${m} دقیقه و ${s} ثانیه`;
}

export function shuffle<T>(items: T[]): T[] {
  const arr = items.slice();
  const buf = new Uint32Array(arr.length);
  crypto.getRandomValues(buf);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = buf[i]! % (i + 1);
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

export function randomId(prefix = "g"): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${hex}`;
}

export function now(): number {
  return Date.now();
}

export function parseCommand(
  text: string,
): { cmd: string; args: string } | null {
  if (!text.startsWith("/")) return null;
  const [raw, ...rest] = text.trim().split(/\s+/);
  if (!raw) return null;
  const cmd = raw.split("@")[0]!.slice(1).toLowerCase();
  return { cmd, args: rest.join(" ").trim() };
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


// =============================================================================
// TELEGRAM TYPES & CLASS
// =============================================================================

export interface TgUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TgChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  permissions?: Record<string, boolean>;
}

export interface TgMessageEntity {
  type: string;
  offset: number;
  length: number;
}

export interface TgMessage {
  message_id: number;
  from?: TgUser;
  chat: TgChat;
  date: number;
  text?: string;
  entities?: TgMessageEntity[];
  new_chat_members?: TgUser[];
  left_chat_member?: TgUser;
  reply_markup?: unknown;
}

export interface TgCallbackQuery {
  id: string;
  from: TgUser;
  message?: TgMessage;
  inline_message_id?: string;
  chat_instance: string;
  data?: string;
}

export interface TgChatMember {
  status:
    | "creator"
    | "administrator"
    | "member"
    | "restricted"
    | "left"
    | "kicked";
  user: TgUser;
  is_anonymous?: boolean;
  custom_title?: string;
  can_be_edited?: boolean;
  can_manage_chat?: boolean;
  can_delete_messages?: boolean;
  can_restrict_members?: boolean;
  can_promote_members?: boolean;
  can_change_info?: boolean;
  can_invite_users?: boolean;
  can_pin_messages?: boolean;
  can_manage_video_chats?: boolean;
  can_post_messages?: boolean;
  can_send_messages?: boolean;
  can_send_audios?: boolean;
  can_send_documents?: boolean;
  can_send_photos?: boolean;
  can_send_videos?: boolean;
  can_send_video_notes?: boolean;
  can_send_voice_notes?: boolean;
  can_send_polls?: boolean;
  can_send_other_messages?: boolean;
  can_add_web_page_previews?: boolean;
  can_manage_topics?: boolean;
  until_date?: number;
}

export interface TgChatMemberUpdated {
  chat: TgChat;
  from: TgUser;
  date: number;
  old_chat_member: TgChatMember;
  new_chat_member: TgChatMember;
}

export interface TgUpdate {
  update_id: number;
  message?: TgMessage;
  edited_message?: TgMessage;
  callback_query?: TgCallbackQuery;
  my_chat_member?: TgChatMemberUpdated;
  chat_member?: TgChatMemberUpdated;
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export type InlineKeyboard = InlineKeyboardButton[][];

export interface SendMessageExtra {
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
  reply_markup?: {
    inline_keyboard: InlineKeyboard;
  };
  disable_notification?: boolean;
  disable_web_page_preview?: boolean;
  reply_to_message_id?: number;
  message_thread_id?: number;
}

export interface TgApiResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
  parameters?: { retry_after?: number };
}

export class TelegramError extends Error {
  constructor(
    public method: string,
    public description: string,
    public errorCode?: number,
    public retryAfter?: number,
  ) {
    super(`${method}: ${description}`);
    this.name = "TelegramError";
  }
}

export class Telegram {
  constructor(private token: string) {}

  async call<T>(method: string, body?: Record<string, unknown>, attempt = 0): Promise<T> {
    const res = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await res.json()) as TgApiResponse<T>;
    if (!data.ok || data.result === undefined) {
      const retryAfter = data.parameters?.retry_after;
      if (res.status === 429 && retryAfter && attempt < 3) {
        await sleep(Math.min(retryAfter, 10) * 1000 + 250);
        return this.call<T>(method, body, attempt + 1);
      }
      throw new TelegramError(
        method,
        data.description || `HTTP ${res.status}`,
        data.error_code,
        retryAfter,
      );
    }
    return data.result;
  }

  async callSafe<T>(
    method: string,
    body?: Record<string, unknown>,
  ): Promise<{ ok: true; result: T } | { ok: false; error: TelegramError }> {
    try {
      const result = await this.call<T>(method, body);
      return { ok: true, result };
    } catch (err) {
      const error =
        err instanceof TelegramError
          ? err
          : new TelegramError(method, err instanceof Error ? err.message : "unknown");
      return { ok: false, error };
    }
  }

  getMe() {
    return this.call<TgUser>("getMe");
  }

  sendMessage(chatId: number, text: string, extra: SendMessageExtra = {}) {
    return this.call<TgMessage>("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: extra.parse_mode ?? "HTML",
      disable_web_page_preview: extra.disable_web_page_preview ?? true,
      disable_notification: extra.disable_notification,
      reply_markup: extra.reply_markup,
      reply_to_message_id: extra.reply_to_message_id,
      message_thread_id: extra.message_thread_id,
    });
  }

  editMessageText(
    chatId: number,
    messageId: number,
    text: string,
    extra: SendMessageExtra = {},
  ) {
    return this.call("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: extra.parse_mode ?? "HTML",
      disable_web_page_preview: extra.disable_web_page_preview ?? true,
      reply_markup: extra.reply_markup,
    });
  }

  answerCallbackQuery(
    id: string,
    text?: string,
    showAlert = false,
  ) {
    return this.call("answerCallbackQuery", {
      callback_query_id: id,
      text,
      show_alert: showAlert,
    });
  }

  getChat(chatId: number) {
    return this.call<TgChat>("getChat", { chat_id: chatId });
  }

  getChatMember(chatId: number, userId: number) {
    return this.call<TgChatMember>("getChatMember", {
      chat_id: chatId,
      user_id: userId,
    });
  }

  setChatPermissions(chatId: number, permissions: ChatPermissions) {
    return this.call("setChatPermissions", {
      chat_id: chatId,
      permissions,
      use_independent_chat_permissions: true,
    });
  }

  restrictChatMember(
    chatId: number,
    userId: number,
    permissions: ChatPermissions,
  ) {
    return this.call("restrictChatMember", {
      chat_id: chatId,
      user_id: userId,
      permissions,
      use_independent_chat_permissions: true,
    });
  }

  pinChatMessage(chatId: number, messageId: number) {
    return this.call("pinChatMessage", {
      chat_id: chatId,
      message_id: messageId,
      disable_notification: true,
    });
  }

  unpinChatMessage(chatId: number, messageId?: number) {
    return this.call("unpinChatMessage", {
      chat_id: chatId,
      message_id: messageId,
    });
  }

  setMyCommands(
    commands: Array<{ command: string; description: string }>,
    scope?: { type: string },
  ) {
    return this.call("setMyCommands", {
      commands,
      scope,
      language_code: "fa",
    });
  }

  setWebhook(url: string, secretToken: string) {
    return this.call("setWebhook", {
      url,
      secret_token: secretToken,
      allowed_updates: [
        "message",
        "callback_query",
        "my_chat_member",
        "chat_member",
      ],
      drop_pending_updates: false,
    });
  }

  deleteWebhook() {
    return this.call("deleteWebhook", { drop_pending_updates: false });
  }

  getWebhookInfo() {
    return this.call("getWebhookInfo");
  }
}


// =============================================================================
// PERMISSIONS
// =============================================================================

export const LOCKED_PERMISSIONS: ChatPermissions = {
  can_send_messages: false,
  can_send_audios: false,
  can_send_documents: false,
  can_send_photos: false,
  can_send_videos: false,
  can_send_video_notes: false,
  can_send_voice_notes: false,
  can_send_polls: false,
  can_send_other_messages: false,
  can_add_web_page_previews: false,
  can_change_info: false,
  can_invite_users: true,
  can_pin_messages: false,
  can_manage_topics: false,
};

export const DAY_PERMISSIONS: ChatPermissions = {
  can_send_messages: true,
  can_send_audios: true,
  can_send_documents: true,
  can_send_photos: true,
  can_send_videos: true,
  can_send_video_notes: true,
  can_send_voice_notes: true,
  can_send_polls: false,
  can_send_other_messages: true,
  can_add_web_page_previews: true,
  can_change_info: false,
  can_invite_users: true,
  can_pin_messages: false,
  can_manage_topics: false,
};

export const OPEN_PERMISSIONS: ChatPermissions = {
  can_send_messages: true,
  can_send_audios: true,
  can_send_documents: true,
  can_send_photos: true,
  can_send_videos: true,
  can_send_video_notes: true,
  can_send_voice_notes: true,
  can_send_polls: true,
  can_send_other_messages: true,
  can_add_web_page_previews: true,
  can_change_info: false,
  can_invite_users: true,
  can_pin_messages: false,
  can_manage_topics: false,
};

export function memberToSaved(
  member: TgChatMember,
): SavedMember {
  const isAdmin = member.status === "administrator" || member.status === "creator";
  const permissions: ChatPermissions | null =
    member.status === "restricted"
      ? {
          can_send_messages: member.can_send_messages,
          can_send_audios: member.can_send_audios,
          can_send_documents: member.can_send_documents,
          can_send_photos: member.can_send_photos,
          can_send_videos: member.can_send_videos,
          can_send_video_notes: member.can_send_video_notes,
          can_send_voice_notes: member.can_send_voice_notes,
          can_send_polls: member.can_send_polls,
          can_send_other_messages: member.can_send_other_messages,
          can_add_web_page_previews: member.can_add_web_page_previews,
          can_change_info: member.can_change_info,
          can_invite_users: member.can_invite_users,
          can_pin_messages: member.can_pin_messages,
          can_manage_topics: member.can_manage_topics,
        }
      : member.status === "member"
        ? { ...OPEN_PERMISSIONS }
        : null;
  return {
    status: member.status,
    isAdmin,
    isOwner: member.status === "creator",
    permissions,
    customTitle: member.custom_title,
  };
}


// =============================================================================
// KEYBOARDS
// =============================================================================

export function playerButtons(
  players: Player[],
  prefix: string,
  extra?: { text: string; data: string }[],
): InlineKeyboard {
  const alive = players.filter((p) => p.status === "alive");
  const buttons = alive.map((p) => ({
    text: p.displayName.slice(0, 28),
    callback_data: `${prefix}${p.userId}`,
  }));
  const rows = chunk(buttons, 2);
  if (extra?.length) {
    rows.push(extra.map((e) => ({ text: e.text, callback_data: e.data })));
  }
  return rows;
}

export function lobbyKeyboard(botUsername: string | null, chatId: number): InlineKeyboard {
  const rows: InlineKeyboard = [];
  if (botUsername) {
    rows.push([
      {
        text: "🎮 ورود به بازی (پیوی بات)",
        url: `https://t.me/${botUsername}?start=join_${chatId}`,
      },
    ]);
  }
  rows.push([
    { text: "▶️ شروع بازی", callback_data: "L:s" },
    { text: "🚪 خروج", callback_data: "L:l" },
  ]);
  rows.push([{ text: "✖ لغو لابی", callback_data: "L:c" }]);
  return rows;
}

export function dayHostKeyboard(): InlineKeyboard {
  return [
    [
      { text: "⏱ تمدید بحث", callback_data: "L:x" },
      { text: "⏭ پایان مرحله", callback_data: "L:k" },
    ],
  ];
}

export function nominationKeyboard(players: Player[], voterId: number, dayNumber: number): InlineKeyboard {
  const candidates = players.filter((p) => p.status === "alive" && p.userId !== voterId);
  return playerButtons(candidates, `T${dayNumber}:`, [
    { text: "⏭ رأی ممتنع", data: `T${dayNumber}:0` },
  ]);
}

export function verdictKeyboard(dayNumber: number): InlineKeyboard {
  return [
    [
      { text: "⚖️ گناهکار", callback_data: `J${dayNumber}:1` },
      { text: "🕊 بی‌گناه", callback_data: `J${dayNumber}:0` },
    ],
  ];
}

export function nightTargetsFor(
  players: Player[],
  actorId: number,
  action: string | NightActionType,
  opts?: { includeSelf?: boolean },
): Player[] {
  const actor = findPlayer(players, actorId);
  const type = mapAction(action);
  return players.filter((p) => {
    if (p.status !== "alive") return false;
    if (!opts?.includeSelf && p.userId === actorId) return false;
    if (type === "mafia_kill") return p.team === "town";
    if (type === "heal" && actor?.role === "lecter") return p.team === "mafia";
    if (type === "nato_guess") return p.team === "town";
    if (type === "johnny_kill") return p.team === "town";
    return true;
  });
}

export function nightTargetKeyboard(
  players: Player[],
  actorId: number,
  nightNumber: number,
  action: string,
  opts?: { includeSelf?: boolean; skipLabel?: string },
): InlineKeyboard {
  const targets = nightTargetsFor(players, actorId, action, opts);
  return playerButtons(targets, `N${nightNumber}:${action}:`, [
    { text: opts?.skipLabel ?? "⏭ رد کردن این شب", data: `N${nightNumber}:${action}:0` },
  ]);
}

// NATO's player-selection step is a two-stage flow (player -> role), handled by the
// dedicated NG/NR callback routes, so it needs its own callback_data prefix instead of
// the generic "N{night}:{action}:{target}" used by nightTargetKeyboard (which is routed
// to applyNightAction and never reaches applyNatoGuess/applyNatoRoleGuess).
export function natoTargetKeyboard(
  players: Player[],
  actorId: number,
  nightNumber: number,
): InlineKeyboard {
  const targets = nightTargetsFor(players, actorId, "nato_guess");
  return playerButtons(targets, `NG${nightNumber}:`, [
    { text: "⏭ رد کردن این شب", data: `N${nightNumber}:nato_guess:0` },
  ]);
}


// =============================================================================
// ROLE DEFINITIONS
// =============================================================================

export const ROLES: Record<RoleId, RoleDef> = {
  godfather: {
    id: "godfather",
    team: "mafia",
    name: "پدرخوانده",
    emoji: "🎩",
    title: "پدرخوانده",
    description: "رهبر مافیا هستید. هر شب هدف قتل را انتخاب می‌کنید.",
    nightAction: "mafia_kill",
    nightOptional: false,
  },
  lecter: {
    id: "lecter",
    team: "mafia",
    name: "دکتر لکتر",
    emoji: "🩺",
    title: "دکتر لکتر",
    description: "پزشک تیم مافیا هستید. هر شب یکی از اعضای زندهٔ تیم مافیا را برای محافظت انتخاب می‌کنید.",
    nightAction: "heal",
    nightOptional: false,
  },
  nato: {
    id: "nato",
    team: "mafia",
    name: "ناتو",
    emoji: "💣",
    title: "ناتو",
    description: "عضو مافیا هستید. هر شب می‌توانید نقش یک بازیکن شهروند را حدس بزنید. اگر درست حدس بزنید، آن بازیکن کشته می‌شود. ۳ شانس دارید.",
    nightAction: "nato_guess",
    nightOptional: true,
  },
  detective: {
    id: "detective",
    team: "town",
    name: "کارآگاه",
    emoji: "🔍",
    title: "کارآگاه",
    description: "هر شب هویت یک بازیکن را استعلام می‌کنید. نتیجه فقط نقش دقیق اوست. یک نفر را دو بار استعلام نکنید.",
    nightAction: "investigate",
    nightOptional: false,
  },
  doctor: {
    id: "doctor",
    team: "town",
    name: "دکتر",
    emoji: "💉",
    title: "دکتر",
    description: "هر شب یک نفر را از قتل نجات می‌دهید. نجات خودتان فقط یک‌بار در کل بازی مجاز است.",
    nightAction: "heal",
    nightOptional: false,
  },
  sniper: {
    id: "sniper",
    team: "town",
    name: "اسنایپر",
    emoji: "🎯",
    title: "اسنایپر",
    description: "تیر محدود دارید. اگر به مافیا شلیک کنید حذف می‌شود. اگر به شهروند شلیک کنید، هم او و هم شما حذف می‌شوید.",
    nightAction: "snipe",
    nightOptional: true,
  },
  mayor: {
    id: "mayor",
    team: "town",
    name: "شهردار",
    emoji: "🏛",
    title: "شهردار",
    description: "رأی روزانه شما دو برابر محاسبه می‌شود. شب‌ها اقدامی ندارید.",
    nightAction: null,
    nightOptional: true,
  },
  gunner: {
    id: "gunner",
    team: "town",
    name: "تفنگدار",
    emoji: "🔫",
    title: "تفنگدار",
    description: "هر شب دو تفنگ (یک تفنگ جنگی و یک تفنگ مشکی) به‌طور پنهانی دریافت می‌کنید. در طول روز از پنل پیوی بات روی یک بازیکن شلیک می‌کنید؛ اگر تفنگ جنگی باشد هدف همان لحظه حذف می‌شود، اگر تفنگ مشکی باشد اتفاقی نمی‌افتد. نوع تفنگ از قبل مشخص نیست.",
    nightAction: null,
    nightOptional: true,
  },
  invincible: {
    id: "invincible",
    team: "town",
    name: "رویین‌تن",
    emoji: "🛡",
    title: "رویین‌تن",
    description: "مثل یک شهروند ساده هستید و اقدام شبانه‌ای ندارید. اما جان سخت هستید: باید در طول شب ۳ بار هدف شلیک قرار بگیرید تا بمیرید. دو ضربهٔ اول را سپرتان دفع می‌کند و با ضربهٔ سوم کشته می‌شوید. در رأی‌گیری روز مثل بقیه حذف می‌شوید.",
    nightAction: null,
    nightOptional: true,
  },
  escort: {
    id: "escort",
    team: "town",
    name: "اسکورت",
    emoji: "💋",
    title: "اسکورت",
    description: "هر شب می‌توانید یک بازیکن را انتخاب کنید؛ آن بازیکن نمی‌تواند نقش خود را در آن شب اجرا کند (مثلاً دکتر نمی‌تواند نجات دهد یا مافیا نمی‌تواند شلیک کند).",
    nightAction: "escort_block",
    nightOptional: true,
  },
  paranoid: {
    id: "paranoid",
    team: "town",
    name: "پارانوئید",
    emoji: "🧠",
    title: "پارانوئید",
    description: "اگر شب هوشیار شوید و کسی شما را هدف قرار دهد، آن فرد کشته می‌شود. ۲ بار می‌توانید هوشیار شوید.",
    nightAction: "paranoid_alert",
    nightOptional: true,
  },
};

export const INDEPENDENT_ROLES: Record<IndependentRoleId, IndependentRoleDef> = {
  johnny: {
    id: "johnny",
    name: "جانی",
    emoji: "🔪",
    description: "شب می‌توانید یک بازیکن را بکشید. دکتر می‌تواند شما را نجات دهد. هوارد می‌تواند شما را مسدود کند. اگر پارانوئید هوشیار باشد و شما او را هدف بگیرید، کشته می‌شوید.",
    winCondition: "زنده بمانید تا شهروندان برنده شوند",
    nightAction: "johnny_kill",
    nightOptional: true,
  },
  joker: {
    id: "joker",
    name: "جوکر",
    emoji: "🤡",
    description: "هدف شما این است که بازیکنان را متقاعد کنید مافیا هستید. اگر با رأی روزانه حذف شوید، برنده می‌شوید!",
    winCondition: "با رأی روزانه حذف شوید",
    nightAction: null,
    nightOptional: true,
  },
  bomber: {
    id: "bomber",
    name: "بمب‌گذار",
    emoji: "🧨",
    description: "هر شب می‌توانید بازیکنان را علامت‌گذاری کنید. هر زمان که بخواهید می‌توانید بمب‌ها را منفجر کنید تا همه علامت‌زده‌ها کشته شوند.",
    winCondition: "زنده بمانید تا شهروندان یا مافیا برنده شوند",
    nightAction: "bomber_mark",
    nightOptional: true,
  },
  lonewolf: {
    id: "lonewolf",
    name: "گرگ تنها",
    emoji: "🕵️",
    description: "شب می‌توانید نقش یک بازیکن را استعلام کنید. به تنهایی برنده می‌شوید اگر شما آخرین زنده باشید.",
    winCondition: "آخرین زنده باشید",
    nightAction: "investigate",
    nightOptional: true,
  },
};

// =============================================================================
// ROLE DISTRIBUTION
// =============================================================================

export function mafiaCountFor(playerCount: number): number {
  // Must stay in lockstep with buildRoleListNew's mafia thresholds (lecter >= 8, nato >= 11).
  if (playerCount >= 11) return 3;
  if (playerCount >= 8) return 2;
  return 1;
}

export function sniperShotsFor(playerCount: number): number {
  return playerCount >= 10 ? 2 : 1;
}

export function buildRoleListNew(playerCount: number): RoleId[] {
  if (playerCount < 6 || playerCount > 12) {
    throw new Error(`unsupported player count: ${playerCount}`);
  }

  const roles: RoleId[] = [];

  // Mafia team
  roles.push("godfather");
  if (playerCount >= 8) roles.push("lecter");
  if (playerCount >= 11) roles.push("nato");

  // Town roles - always present
  roles.push("detective", "doctor", "sniper");

  // Conditional town roles
  if (playerCount >= 7) roles.push("mayor");
  if (playerCount >= 8) roles.push("gunner");
  if (playerCount >= 9) roles.push("escort");
  if (playerCount >= 10) roles.push("invincible");
  if (playerCount >= 12) roles.push("paranoid");

  // Paranoid for smaller games (6-7 players)
  if (playerCount <= 7 && !roles.includes("paranoid")) {
    roles.push("paranoid");
  }

  return roles;
}

export function assignRoles(players: Player[]): Player[] {
  const playerCount = players.length;
  const roleList = buildRoleListNew(playerCount); // exactly playerCount - 1 entries by design

  // Select independent role
  const indieRoles: IndependentRoleId[] = ["johnny", "joker", "bomber", "lonewolf"];
  const indieIndex = Math.floor(Math.random() * indieRoles.length);
  const indieRole = indieRoles[indieIndex];

  // The independent player still needs *some* RoleId on their Player object (lots of the
  // game logic, e.g. markDead/nightActionTypesFor, assumes role is non-null for anyone
  // alive), but it must not silently duplicate a role that's already "live" for someone
  // else in a way that affects composition — so we duplicate a random entry already in
  // the pool purely as flavor, and separately force team below so it never counts toward
  // mafia/town for win checks, teammate lists, etc.
  const flavorRole = roleList[Math.floor(Math.random() * roleList.length)];
  const fullRoleList = [...roleList, flavorRole];

  // Shuffle players and roles
  const shuffledPlayers = shuffle([...players]);
  const shuffledRoles = shuffle(fullRoleList);

  // Assign roles
  const assigned = shuffledPlayers.map((p, i) => {
    const role = shuffledRoles[i];
    const def = ROLES[role];

    // Last player gets the independent role
    const isIndie = i === players.length - 1;
    const actualIndieRole = isIndie ? indieRole : null;

    return {
      ...p,
      role,
      team: isIndie ? "independent" : def.team,
      independentRole: actualIndieRole,
    };
  });

  return assigned;
}

export function roleLabel(role: RoleId | null): string {
  if (!role) return "نامشخص";
  const def = ROLES[role];
  return `${def.emoji} ${def.name}`;
}

export function independentRoleLabel(role: IndependentRoleId | null): string {
  if (!role) return "";
  const def = INDEPENDENT_ROLES[role];
  return `${def.emoji} ${def.name}`;
}

export function teamLabel(team: Team | null | undefined): string {
  if (team === "mafia") return "🔪 مافیا";
  if (team === "town") return "❤️ شهروندان";
  if (team === "independent") return "⚖️ مستقل";
  return "نامشخص";
}


// =============================================================================
// GAME LOGIC HELPERS
// =============================================================================

export function living(players: Player[]): Player[] {
  return players.filter((p) => p.status === "alive");
}

export function livingMafia(players: Player[]): Player[] {
  return living(players).filter((p) => p.team === "mafia");
}

export function livingTown(players: Player[]): Player[] {
  return living(players).filter((p) => p.team === "town");
}

export function livingIndependent(players: Player[]): Player[] {
  return living(players).filter((p) => p.team === "independent");
}

export function findPlayer(players: Player[], userId: number): Player | undefined {
  return players.find((p) => p.userId === userId);
}

export function checkWinner(players: Player[]): Team | null {
  const mafia = livingMafia(players).length;
  const town = livingTown(players).length;
  const indie = livingIndependent(players).length;
  
  if (mafia <= 0 && indie <= 0) return "town";
  if (mafia > 0 && mafia >= town) return "mafia";
  
  // Prevent deadlock: if mafia is gone and only non-lethal independents
  // (lonewolf, joker) remain against town, town wins because these roles
  // cannot eliminate town members on their own.
  if (mafia <= 0 && town > 0) {
    const aliveIndie = livingIndependent(players);
    const allNonLethal = aliveIndie.length > 0 && aliveIndie.every(p =>
      p.independentRole === "lonewolf" || p.independentRole === "joker"
    );
    if (allNonLethal) return "town";
  }
  
  return null;
}

export function checkIndependentWinner(players: Player[], game: GameState): Team | null {
  const alive = living(players);
  const indie = alive.filter(p => p.independentRole);
  
  for (const p of indie) {
    if (p.independentRole === "joker") {
      // Joker wins by being lynched - this is checked in the verdict phase
      continue;
    }
    if (p.independentRole === "lonewolf" || p.independentRole === "bomber") {
      // Lonewolf and bomber win outright if they're the only one left alive
      if (alive.length === 1 && p.userId === alive[0]?.userId) {
        return "independent";
      }
    }
  }
  
  return null;
}

export function dayDurationSeconds(game: GameState): number {
  const n = living(game.players).length;
  const raw = game.config.daySecondsBase + game.config.daySecondsPerPlayer * n;
  return Math.min(game.config.daySecondsMax, Math.max(90, raw));
}

export function getTownRoles(): RoleId[] {
  return Object.entries(ROLES)
    .filter(([_, def]) => def.team === "town")
    .map(([id, _]) => id as RoleId);
}

export function nightActionTypesFor(role: RoleId | null, indieRole: IndependentRoleId | null): NightActionType[] {
  if (!role) return [];
  
  // Check independent role first
  if (indieRole) {
    const indieDef = INDEPENDENT_ROLES[indieRole];
    if (indieDef.nightAction) {
      return [indieDef.nightAction];
    }
    return [];
  }
  
  switch (role) {
    case "godfather":
      return ["mafia_kill"];
    case "lecter":
      return ["heal"];
    case "nato":
      return ["nato_guess"];
    case "detective":
      return ["investigate"];
    case "doctor":
      return ["heal"];
    case "sniper":
      return ["snipe"];
    case "escort":
      return ["escort_block"];
    case "paranoid":
      return ["paranoid_alert"];
    default:
      return [];
  }
}

export function hasFinishedAllNightActions(game: GameState): boolean {
  return living(game.players).every((p) => {
    const types = nightActionTypesFor(p.role, p.independentRole);
    if (types.length === 0) return true;
    
    // For bomber, either having submitted bomber_mark OR bomber_explode is sufficient
    if (p.independentRole === "bomber") {
      return ["bomber_mark", "bomber_explode"].some((type) =>
        game.nightActions.some(
          (a) =>
            a.actorId === p.userId &&
            a.type === type &&
            a.nightNumber === game.nightNumber,
        ),
      );
    }
    
    return types.every((type) =>
      game.nightActions.some(
        (a) =>
          a.actorId === p.userId &&
          a.type === type &&
          a.nightNumber === game.nightNumber,
      ),
    );
  });
}

export function livingVoters(game: GameState): Player[] {
  const silenced = new Set(game.silencedUserIds);
  return living(game.players).filter((p) => !silenced.has(p.userId));
}

export function hasFinishedVotes(game: GameState): boolean {
  const voters = livingVoters(game);
  return voters.every((p) =>
    game.votes.some((v) => v.voterId === p.userId && v.dayNumber === game.dayNumber),
  );
}

export function verdictVoters(game: GameState): Player[] {
  return livingVoters(game).filter((p) => p.userId !== game.accusedUserId);
}

export function hasFinishedVerdict(game: GameState): boolean {
  const voters = verdictVoters(game);
  if (voters.length === 0) return true;
  return voters.every((p) =>
    game.verdictVotes.some((v) => v.voterId === p.userId && v.dayNumber === game.dayNumber),
  );
}

export function voteWeight(player: Player): number {
  return player.role === "mayor" && player.team === "town" ? 2 : 1;
}


// =============================================================================
// NIGHT RESOLUTION
// =============================================================================

function lastAction(
  actions: NightAction[],
  type: NightAction["type"],
  actorId?: number,
): NightAction | undefined {
  const filtered = actions.filter(
    (a) => a.type === type && (actorId === undefined || a.actorId === actorId),
  );
  return filtered[filtered.length - 1];
}

export function resolveMafiaTarget(game: GameState, nightActions: NightAction[]): number | null {
  const mafia = livingMafia(game.players);
  const gf = mafia.find((p) => p.role === "godfather");
  const kills = nightActions.filter(
    (a) =>
      a.type === "mafia_kill" &&
      a.targetId &&
      a.targetId > 0 &&
      mafia.some((m) => m.userId === a.actorId),
  );
  if (gf) {
    const gfKill = lastAction(kills, "mafia_kill", gf.userId);
    if (gfKill?.targetId) return gfKill.targetId;
  }
  const counts = new Map<number, number>();
  for (const k of kills) {
    if (!k.targetId) continue;
    counts.set(k.targetId, (counts.get(k.targetId) || 0) + 1);
  }
  let best: number | null = null;
  let bestN = 0;
  let tie = false;
  for (const [id, n] of counts) {
    if (n > bestN) {
      best = id;
      bestN = n;
      tie = false;
    } else if (n === bestN) {
      tie = true;
    }
  }
  if (tie || bestN === 0) return null;
  return best;
}

export function resolveNight(game: GameState): NightResolution {
  const actions = game.nightActions.filter((a) => a.nightNumber === game.nightNumber);
  const night = game.nightNumber;
  
  // Track escort blocks
  const escortBlocks = new Set<number>();
  for (const a of actions) {
    if (a.type === "escort_block" && a.targetId && a.targetId > 0) {
      const blocker = findPlayer(game.players, a.actorId);
      if (blocker?.status === "alive" && blocker.role === "escort") {
        escortBlocks.add(a.targetId);
      }
    }
  }

  // Process escort blocks - mark blocked users
  const blocked = new Set<number>();
  for (const targetId of escortBlocks) {
    blocked.add(targetId);
    game.escortBlockedUserIds.push(targetId);
  }

  // Filter out blocked actions
  const active = actions.filter((a) => !blocked.has(a.actorId));

  // Process paranoid alerts
  const paranoidAlerts = new Set<number>();
  for (const a of active) {
    if (a.type === "paranoid_alert" && a.actorId && a.targetId && a.targetId > 0) {
      const paranoid = findPlayer(game.players, a.actorId);
      if (paranoid?.status === "alive" && paranoid.role === "paranoid" && game.paranoidAlertLeft > 0) {
        paranoidAlerts.add(a.actorId);
        // Consume one use when actually alerting (not skipping)
        game.paranoidAlertLeft = Math.max(0, game.paranoidAlertLeft - 1);
      }
    }
  }

  // Process bomber marks (not blocked)
  const bomberMarks = new Set<number>();
  for (const a of active) {
    if (a.type === "bomber_mark" && a.targetId && a.targetId > 0) {
      const bomber = findPlayer(game.players, a.actorId);
      if (bomber?.status === "alive" && bomber.independentRole === "bomber") {
        bomberMarks.add(a.targetId);
      }
    }
  }

  // Protected IDs from doctor/healer
  const protectedIds = new Set<number>();
  for (const a of active) {
    if (a.type === "heal" && a.targetId && a.targetId > 0) {
      const actor = findPlayer(game.players, a.actorId);
      if (actor?.status === "alive" && (actor.role === "doctor" || actor.role === "lecter")) {
        protectedIds.add(a.targetId);
      }
    }
  }

  // Dead set to prevent double-killing
  const dead = new Set<number>();
  const deaths: DeathRecord[] = [];
  const shieldAbsorbed: number[] = [];
  const markDead = (userId: number, reason: DeathRecord["reason"], indieRole?: IndependentRoleId) => {
    if (dead.has(userId)) return;
    const p = findPlayer(game.players, userId);
    if (!p || p.status !== "alive" || !p.role) return;
    if (p.role === "invincible" && p.team === "town") {
      const key = String(userId);
      const hits = (game.invincibleShieldHits[key] ?? 0) + 1;
      game.invincibleShieldHits[key] = hits;
      if (hits < 3) {
        shieldAbsorbed.push(userId);
        return;
      }
    }
    dead.add(userId);
    deaths.push({ userId, reason, revealedRole: p.role, revealedIndependentRole: indieRole });
  };

  // 1. Process mafia kill
  const mafiaTarget = resolveMafiaTarget(game, active);
  if (mafiaTarget && !protectedIds.has(mafiaTarget) && !paranoidAlerts.has(mafiaTarget)) {
    markDead(mafiaTarget, "mafia");
  }

  // 2. Process NATO guess
  let natoTarget: number | null = null;
  let natoGuessCorrect: boolean | null = null;
  
  for (const a of active) {
    if (a.type === "nato_guess" && a.targetId && a.targetId > 0 && a.targetRole) {
      const nato = findPlayer(game.players, a.actorId);
      if (nato?.status === "alive" && nato.role === "nato" && game.natoChancesLeft > 0) {
        const target = findPlayer(game.players, a.targetId);
        if (target?.status === "alive" && target.role === a.targetRole && target.team === "town") {
          natoTarget = a.targetId;
          natoGuessCorrect = true;
          if (!protectedIds.has(a.targetId) && !paranoidAlerts.has(a.targetId)) {
            markDead(a.targetId, "nato");
          }
        } else {
          natoTarget = a.targetId;
          natoGuessCorrect = false;
        }
      }
    }
  }

  // 3. Process sniper/gunner shots
  let sniperTarget: number | null = null;
  for (const a of active) {
    if (a.type !== "snipe" || !a.targetId || a.targetId <= 0) continue;
    const actor = findPlayer(game.players, a.actorId);
    if (!actor || actor.status !== "alive") continue;
    if (actor.role === "sniper") {
      const left = game.sniperShotsLeft[String(actor.userId)] ?? 0;
      if (left <= 0) continue;
    }
    sniperTarget = a.targetId;
    const target = findPlayer(game.players, a.targetId);
    if (!target || target.status !== "alive") continue;
    if (protectedIds.has(target.userId)) continue;
    if (paranoidAlerts.has(actor.userId)) {
      // Attacking paranoid - attacker dies
      markDead(actor.userId, "paranoid_alert");
      continue;
    }
    if (target.team === "mafia") {
      markDead(target.userId, "sniper");
    } else {
      // Wrong target - both die
      markDead(target.userId, "sniper");
      markDead(actor.userId, "sniper_penalty");
    }
  }

  // 4. Process Johnny kills
  for (const a of active) {
    if (a.type !== "johnny_kill" || !a.targetId || a.targetId <= 0) continue;
    const johnny = findPlayer(game.players, a.actorId);
    if (!johnny || johnny.status !== "alive" || johnny.independentRole !== "johnny") continue;
    if (protectedIds.has(a.targetId)) continue;
    if (paranoidAlerts.has(a.actorId)) {
      markDead(a.actorId, "paranoid_alert");
      continue;
    }
    markDead(a.targetId, "johnny");
  }

  // 5. Process paranoid alert kills.
  // Only genuine attacks retaliate (heal/investigate/escort_block/bomber_mark are harmless
  // and must never trigger this), and only the action that was actually the *resolved*
  // attack counts — e.g. a losing mafia vote for the paranoid should not get punished just
  // because the godfather ended up choosing someone else.
  for (const targetId of paranoidAlerts) {
    const targetingActions = active.filter((a) => {
      if (a.targetId !== targetId || a.actorId === targetId) return false;
      if (a.type === "mafia_kill") return targetId === mafiaTarget;
      if (a.type === "nato_guess") return targetId === natoTarget;
      if (a.type === "snipe") return targetId === sniperTarget;
      if (a.type === "johnny_kill") return true;
      return false;
    });

    for (const a of targetingActions) {
      if (dead.has(a.actorId)) continue;
      const attacker = findPlayer(game.players, a.actorId);
      if (attacker?.status === "alive") {
        markDead(a.actorId, "paranoid_alert");
      }
    }
  }

  // 6. Process bomber explode (only if the bomber actually pressed "explode" this night)
  const bomberExploded = active.some((a) => {
    if (a.type !== "bomber_explode") return false;
    const bomber = findPlayer(game.players, a.actorId);
    return bomber?.status === "alive" && bomber.independentRole === "bomber";
  });
  if (bomberExploded) {
    for (const targetId of game.bomberMarkedTargets) {
      if (dead.has(targetId)) continue;
      const target = findPlayer(game.players, targetId);
      if (!target || target.status !== "alive") continue;
      markDead(targetId, "bomber");
    }
  }

  // 7. Add new bomber marks
  const bomberMarked: number[] = [];
  for (const targetId of bomberMarks) {
    if (!game.bomberMarkedTargets.includes(targetId)) {
      bomberMarked.push(targetId);
    }
  }

  // Process silent (not used in new version, but kept for compatibility)
  const silenced: number[] = [];

  // Investigations
  const investigations: NightResolution["investigations"] = [];
  for (const a of active) {
    if (a.type === "investigate" && a.targetId && a.targetId > 0) {
      const actor = findPlayer(game.players, a.actorId);
      const target = findPlayer(game.players, a.targetId);
      if (!actor || !target) continue;
      
      if (actor.independentRole === "lonewolf" && actor.status === "alive") {
        // Lonewolf gets actual role
        const result = target.role ? roleLabel(target.role) : "نامشخص";
        investigations.push({ actorId: actor.userId, targetId: target.userId, result });
      } else if (actor.role === "detective" && actor.status === "alive") {
        // Detective gets town/mafia
        const result = target.team === "town" ? "شهروند" : "مافیا";
        investigations.push({ actorId: actor.userId, targetId: target.userId, result });
      }
    }
  }

  // Lonewolf result
  let lonewolfResult: string | null = null;
  const lonewolfInvestigation = investigations.find(i => {
    const actor = findPlayer(game.players, i.actorId);
    return actor?.independentRole === "lonewolf";
  });
  if (lonewolfInvestigation) {
    lonewolfResult = lonewolfInvestigation.result;
  }

  return {
    deaths,
    silenced,
    investigations,
    protectedIds: [...protectedIds],
    mafiaTarget,
    natoTarget,
    natoGuessCorrect,
    sniperTarget,
    bomberMarked,
    bomberExploded,
    lonewolfResult,
    shieldAbsorbed,
    notes: [],
  };
}

export function applyDeaths(
  players: Player[],
  deaths: DeathRecord[],
  phase: GameState["phase"],
  round: number,
): Player[] {
  return players.map((p) => {
    const hit = deaths.find((d) => d.userId === p.userId);
    if (!hit) return p;
    return {
      ...p,
      status: "dead" as const,
      deathReason: hit.reason,
      deathPhase: phase,
      deathRound: round,
    };
  });
}

export function consumeSniperShots(game: GameState, actions: NightAction[]): Record<string, number> {
  const next = { ...game.sniperShotsLeft };
  for (const a of actions) {
    if (a.type !== "snipe" || !a.targetId || a.targetId <= 0) continue;
    const actor = findPlayer(game.players, a.actorId);
    if (actor?.role === "sniper") {
      const key = String(a.actorId);
      if ((next[key] ?? 0) > 0) next[key] = (next[key] ?? 0) - 1;
    }
  }
  return next;
}

export function resolveVotes(
  players: Player[],
  votes: Vote[],
  dayNumber: number,
  silencedUserIds: number[],
): VoteResolution {
  const silenced = new Set(silencedUserIds);
  const dayVotes = votes.filter((v) => v.dayNumber === dayNumber);
  const tallies = new Map<number | null, { votes: number; names: string[] }>();

  const bump = (key: number | null, weight: number, name: string) => {
    const cur = tallies.get(key) ?? { votes: 0, names: [] };
    cur.votes += weight;
    cur.names.push(name);
    tallies.set(key, cur);
  };

  for (const v of dayVotes) {
    const voter = findPlayer(players, v.voterId);
    if (!voter || voter.status !== "alive") continue;
    if (silenced.has(voter.userId)) continue;
    const weight = v.weight || voteWeight(voter);
    if (v.targetId && v.targetId > 0) {
      const target = findPlayer(players, v.targetId);
      if (!target || target.status !== "alive") continue;
      bump(v.targetId, weight, voter.displayName);
    } else {
      bump(null, weight, voter.displayName);
    }
  }

  const list = [...tallies.entries()]
    .map(([userId, v]) => ({ userId, votes: v.votes, names: v.names }))
    .sort((a, b) => b.votes - a.votes);

  const candidates = list.filter((t) => t.userId !== null);
  if (candidates.length === 0) {
    return { tallies: list, eliminated: null, tied: false };
  }
  const top = candidates[0]!;
  const tied = candidates.length > 1 && candidates[1]!.votes === top.votes;
  if (tied || top.votes <= 0) {
    return { tallies: list, eliminated: null, tied: true };
  }
  const eliminated = findPlayer(players, top.userId as number) ?? null;
  return { tallies: list, eliminated, tied: false };
}

export function resolveVerdict(votes: VerdictVote[], dayNumber: number): VerdictResolution {
  const dayVotes = votes.filter((v) => v.dayNumber === dayNumber);
  let guilty = 0;
  let innocent = 0;
  for (const v of dayVotes) {
    const weight = v.weight || 1;
    if (v.guilty) guilty += weight;
    else innocent += weight;
  }
  return { guilty, innocent, result: guilty > innocent ? "guilty" : "innocent" };
}


// =============================================================================
// MESSAGES
// =============================================================================

export const fa = {
  botAdded(botName: string): string {
    return [
      `🎭 <b>${esc(botName)}</b> به گروه اضافه شد.`,
      "",
      "برای اجرای مافیا باید <b>ادمین کامل</b> باشم و این دسترسی‌ها را داشته باشم:",
      "• محدود کردن اعضا",
      "• پین کردن پیام",
      "• حذف پیام",
      "",
      "گروه را به <b>سوپرگروه</b> تبدیل کنید (در تنظیمات گروه).",
      "سپس /new را بزنید تا لابی باز شود.",
      "",
      "گروه محل بحث است. نقش‌ها، اقدام شبانه و رأی فقط در پیوی بات انجام می‌شود.",
    ].join("\n");
  },

  needSupergroup: "این قابلیت فقط در <b>سوپرگروه</b> کار می‌کند. گروه را از تنظیمات به سوپرگروه تبدیل کنید و دوباره تلاش کنید.",
  needAdmin: "برای مدیریت بازی باید ادمین باشم و دسترسی «محدود کردن اعضا» را داشته باشم. مرا ادمین کامل کنید و دوباره /new بزنید.",

  privateStart: [
    "🎭 به بات مافیا خوش آمدید.",
    "",
    "اینجا فقط نقش، اقدام شبانه و رأی شما نمایش داده می‌شود.",
    "بحث اصلی همیشه داخل گروه انجام می‌شود.",
    "",
    "برای شروع، در گروه مورد نظر /new بزنید و از دکمهٔ ورود استفاده کنید.",
  ].join("\n"),

  alreadyInGame(title: string): string {
    return `شما همین حالا در بازی «${esc(title)}» هستید. تا پایان یا لغو آن بازی نمی‌توانید وارد بازی دیگری شوید.`;
  },

  notInGroup: "اول باید عضو گروه بازی باشید، بعد وارد لابی شوید.",

  joinOk(name: string, count: number, max: number): string {
    return `✅ ${esc(name)}\nشما وارد لابی شدید. (${count}/${max})`;
  },

  lobbyCreated(host: string): string {
    return [
      "🎭 <b>لابی مافیا باز شد</b>",
      "",
      `میزبان: ${host}`,
      "بازیکنان ۶ تا ۱۲ نفر.",
      "",
      "برای عضویت حتماً یک‌بار پیوی بات را استارت کنید، سپس دکمهٔ ورود را بزنید یا در گروه /join بفرستید.",
      "",
      "گروه محل گفت‌وگو است. بات وارد بحث شما نمی‌شود.",
    ].join("\n");
  },

  lobbyBody(game: GameState): string {
    const lines = game.players.map((p, i) => {
      const crown = p.userId === game.hostId ? " 👑" : "";
      return `${i + 1}. ${mention(p.userId, p.displayName)}${crown}`;
    });
    const remain = game.phaseEndsAt ? `\n⏱ اعتبار لابی: ${formatRemain(game.phaseEndsAt - Date.now())}` : "";
    return [
      "🎭 <b>لابی مافیا</b>",
      "",
      `بازیکنان: <b>${game.players.length}</b> / ${game.config.maxPlayers}`,
      `حداقل شروع: ${game.config.minPlayers} نفر`,
      "",
      lines.join("\n") || "هنوز کسی وارد نشده.",
      remain,
      "",
      "نقش و رأی فقط در پیوی بات است.",
    ].join("\n");
  },

  gameAlreadyRunning: "در این گروه الان یک بازی فعال است.",
  lobbyOnlyHere: "این دستور را در گروه بزنید.",
  hostOnly: "فقط میزبان یا ادمین گروه می‌تواند این کار را انجام دهد.",
  notEnough: "برای شروع حداقل ۶ بازیکن لازم است.",
  tooMany: "حداکثر ۱۲ بازیکن می‌توانند بازی کنند.",
  alreadyJoined: "شما از قبل در لابی هستید.",
  notInLobby: "شما در این لابی نیستید.",
  leftLobby: "از لابی خارج شدید.",
  noGame: "بازی فعالی در این گروه نیست. با /new یک لابی بسازید.",
  cancelled: "بازی لغو شد و محدودیت‌های اعمال‌شده برداشته شد.",
  playersMustStartBot: "بعضی بازیکنان هنوز پیوی بات را استارت نکرده‌اند. همه باید یک‌بار بات را در پیوی باز کنند.",

  roleCard(player: Player, teammates: Player[]): string {
    if (!player.role || !player.team) return "نقش شما هنوز مشخص نشده.";
    const def = ROLES[player.role];
    const teamLines = player.team === "mafia" && teammates.length
      ? ["", "<b>هم‌تیمی‌های مافیا:</b>", ...teammates.map((t) => `• ${esc(t.displayName)} — ${roleLabel(t.role)}`)]
      : [];
    
    let indieInfo: string[] = [];
    if (player.independentRole) {
      const indieDef = INDEPENDENT_ROLES[player.independentRole];
      indieInfo = ["", `🎯 <b>نقش مستقل:</b> ${indieDef.emoji} ${indieDef.name}`, indieDef.description, `هدف: ${indieDef.winCondition}`];
    }
    
    return [
      `🎭 نقش شما: <b>${def.emoji} ${def.name}</b>`,
      `تیم: <b>${teamLabel(player.team)}</b>`,
      "",
      def.description,
      ...indieInfo,
      ...teamLines,
      "",
      "این پیام محرمانه است. نقش خود را فاش نکنید مگر طبق قوانین بازی.",
    ].join("\n");
  },

  gameStarted(n: number, mafiaN: number, indieRole: IndependentRoleId | null): string {
    const indieLine = indieRole ? `\n🎭 نقش مستقل فعال: ${INDEPENDENT_ROLES[indieRole].emoji} ${INDEPENDENT_ROLES[indieRole].name}` : "";
    return [
      "🎬 <b>بازی شروع شد</b>",
      "",
      `تعداد بازیکنان: ${n}`,
      `تعداد مافیا: ${mafiaN}`,
      indieLine,
      "",
      "نقش‌ها به پیوی شما ارسال شد.",
      "گروه در شب قفل می‌شود و در روز فقط بازیکنان زنده می‌توانند حرف بزنند.",
      "حذف‌شده‌ها میوت می‌شوند و فقط تماشاگر خواهند بود.",
    ].join("\n");
  },

  nightStart(night: number, seconds: number): string {
    return [
      `🌙 <b>شب ${night} آغاز شد</b>`,
      "",
      "گروه قفل شد.",
      "بازیکنان زنده اقدام شبانه را فقط در پیوی بات انجام دهند.",
      "",
      `⏱ ${seconds} ثانیه`,
    ].join("\n");
  },

  nightPvPrompt(role: RoleId, seconds: number): string {
    const def = ROLES[role];
    return [
      `🌙 نوبت اقدام شبانه — <b>${def.emoji} ${def.name}</b>`,
      "",
      def.description,
      "",
      `⏱ ${seconds} ثانیه فرصت دارید.`,
      "تا پایان شب می‌توانید انتخاب را عوض کنید.",
    ].join("\n");
  },

  nightCitizenWait: "🌙 شب شده است. شما اقدام شبانه‌ای ندارید. تا صبح صبر کنید و نقش خود را فاش نکنید.",

  lecterPrompt(seconds: number): string {
    return [
      "🩺 یکی از اعضای تیم مافیا را برای محافظت انتخاب کنید:",
      `⏱ ${seconds} ثانیه فرصت دارید.`,
      "تا پایان شب می‌توانید انتخاب را عوض کنید.",
    ].join("\n");
  },

  natoPrompt(seconds: number, chancesLeft: number): string {
    return [
      "💣 <b>نوبت اقدام شبانه — 💣 ناتو</b>",
      "",
      "یک بازیکن شهروند را انتخاب کنید و نقش او را حدس بزنید.",
      `اگر درست حدس بزنید، آن بازیکن کشته می‌شود!`,
      `شانس‌های باقی‌مانده: ${chancesLeft}`,
      "",
      `⏱ ${seconds} ثانیه`,
    ].join("\n");
  },

  natoSelectRole(targetName: string): string {
    return `🎭 نقش <b>${esc(targetName)}</b> را انتخاب کنید:`;
  },

  natoGuessMade(targetName: string, roleName: string): string {
    return `🎯 حدس شما ثبت شد: <b>${esc(targetName)}</b> = <b>${esc(roleName)}</b>`;
  },

  natoGuessCorrect(chancesLeft: number): string {
    return `✅ <b>حدس درست بود!</b> بازیکن کشته شد.\nشانس‌های باقی‌مانده: ${chancesLeft}`;
  },

  natoGuessWrong(chancesLeft: number): string {
    return `❌ <b>حدس اشتباه بود.</b> یک شانس از دست رفت.\nشانس‌های باقی‌مانده: ${chancesLeft}`;
  },

  paranoidPrompt(seconds: number, alertsLeft: number): string {
    const status = alertsLeft > 0 ? `✅ امکان فعال‌سازی هوشیاری (${alertsLeft} بار باقی‌مانده)` : "❌ هوشیاری استفاده شده";
    return [
      "🧠 <b>نوبت اقدام شبانه — 🧠 پارانوئید</b>",
      "",
      "اگر هوشیار شوید و کسی شما را هدف قرار دهد، آن فرد کشته می‌شود!",
      "",
      status,
      "",
      `⏱ ${seconds} ثانیه`,
    ].join("\n");
  },

  actionSaved(label: string): string {
    return `✅ اقدام ثبت شد: <b>${esc(label)}</b>\nتا پایان مرحله می‌توانید عوضش کنید.`;
  },

  actionForbidden: "الان اجازهٔ این اقدام را ندارید.",
  cannotKillTeammate: "این بازیکن هم‌تیمی شماست و امکان شلیک به او وجود ندارد.",
  lecterTownTarget: "این بازیکن شهروند است؛ دکتر لکتر فقط می‌تواند از اعضای تیم مافیا محافظت کند.",
  lecterCannotSelf: "نمی‌توانید خودتان را برای محافظت انتخاب کنید.",
  invalidTarget: "هدف انتخابی معتبر نیست.",
  targetNotInGame: "هدف انتخابی عضو این بازی نیست.",
  deadCannotAct: "شما از بازی حذف شده‌اید. می‌توانید تماشا کنید، اما هیچ اقدامی در بازی ندارید.",
  silencedCannotVote: "شما امشب ساکت شده‌اید و امروز حق رأی ندارید.",
  staleAction: "این مرحله تمام شده و این دکمه دیگر معتبر نیست.",

  nightRemind: "⏱ فقط چند ثانیه تا پایان شب مانده. اگر هنوز اقدام نکرده‌اید الان انتخاب کنید.",

  nightQuiet: "🌤 افق روشن شد. این شب کسی کشته نشد.",

  nightReport(lines: string[]): string {
    return ["🌤 <b>صبح شد</b>", "", ...lines].join("\n");
  },

  playerDied(name: string, userId: number, role: RoleId, indieRole: IndependentRoleId | null | undefined, reason: string): string {
    const roleStr = indieRole ? `${INDEPENDENT_ROLES[indieRole].emoji} ${INDEPENDENT_ROLES[indieRole].name}` : roleLabel(role);
    return `💀 ${mention(userId, name)} از بازی حذف شد.\nعلت: ${reason}\nنقش: <b>${roleStr}</b>`;
  },

  reasonMafia: "حملهٔ مافیا",
  reasonNato: "حدس ناتو",
  reasonJohnny: "حملهٔ جانی",
  reasonBomber: "انفجار بمب",
  reasonSniper: "شلیک اسنایپر",
  reasonSniperPenalty: "شلیک اشتباه به شهروند",
  reasonGunner: "شلیک تفنگدار",
  reasonParanoidAlert: "حمله به پارانوئید هوشیار",
  reasonLynch: "رأی‌گیری روز",
  reasonLeft: "ترک گروه",
  reasonJoker: "حذف جوکر (برد)",

  gunnerReceivedGun: "🔫 شما یک تفنگ دریافت کردید.",

  gunnerPanelPrompt: "🔫 می‌توانید با تفنگتان روی یکی از بازیکنان زنده شلیک کنید:",

  gunnerFired(name: string, targetName: string): string {
    return `🔫 کاربر ${esc(name)} یک تفنگ داشت.\nتفنگش را روی ${esc(targetName)} گذاشت و شلیک کرد.`;
  },

  gunnerBlackMiss: "تیر مشکی بود و اتفاقی نیفتاد.",

  invincibleShieldHit(shotsLeft: number): string {
    return `🛡 امشب هدف شلیک قرار گرفتید اما سپرتان ضربه را دفع کرد.\nتحمل ${shotsLeft} ضربهٔ دیگر را دارید.`;
  },

  dayStart(day: number, seconds: number, silenced: string | null): string {
    const extra = silenced ? `\n🔇 امروز ساکت است و حق حرف زدن و رأی ندارد: ${silenced}` : "";
    return [
      `☀️ <b>روز ${day}</b>`,
      "",
      "گروه برای بازیکنان زنده باز شد.",
      "حالا در خود گروه بحث کنید. بات وارد بحث نمی‌شود.",
      extra,
      "",
      `⏱ زمان بحث: ${formatRemain(seconds * 1000)}`,
    ].join("\n");
  },

  countdownRemain(minutes: number): string {
    return `⏱ زمان باقی‌مانده بحث: <b>${minutes}</b> دقیقه`;
  },

  nominationStart(day: number, seconds: number): string {
    return [
      `⚖️ <b>معرفی متهم — روز ${day}</b>`,
      "",
      "بحث تمام شد و گروه قفل شد.",
      "برای احضار یک نفر به دادگاه، به پیوی بات بروید و رأی بدهید.",
      "بازیکن حذف‌شده یا ساکت در لیست نیست.",
      "",
      `⏱ ${seconds} ثانیه`,
    ].join("\n");
  },

  nominationPv(seconds: number): string {
    return ["⚖️ کسی را که فکر می‌کنید باید محاکمه شود انتخاب کنید یا ممتنع بزنید.", `⏱ ${seconds} ثانیه`].join("\n");
  },

  nominationSaved(label: string): string {
    return `⚖️ رأی شما ثبت شد: <b>${esc(label)}</b>`;
  },

  duplicateNominationVote: "شما قبلاً به این بازیکن رأی داده‌اید و نمی‌توانید دوباره همان رأی را ثبت کنید.",

  nominationResult(res: VoteResolution, players: Player[]): string {
    const lines = res.tallies
      .filter((t) => t.votes > 0)
      .map((t) => {
        const name = t.userId === null ? "ممتنع" : esc(players.find((p) => p.userId === t.userId)?.displayName || "؟");
        return `• ${name}: ${t.votes} رأی`;
      });
    return ["⚖️ <b>نتیجه معرفی متهم</b>", "", ...lines].join("\n");
  },

  noOneOnTrial: "⚖️ رأی‌ها مساوی شد یا کسی رأی نیاورد؛ امروز کسی به دادگاه احضار نمی‌شود.",

  summonedToTrial(name: string, userId: number, seconds: number): string {
    return [
      `⚖️ ${mention(userId, name)} به دادگاه احضار شد!`,
      "",
      `فقط ایشان اجازهٔ پیام دادن در گروه را دارد تا از خودش دفاع کند.`,
      `⏱ ${seconds} ثانیه فرصت دفاع`,
    ].join("\n");
  },

  defenseOver: "⚖️ زمان دفاع تمام شد. گروه دوباره برای همه قفل شد.",

  goToFinalVote(seconds: number): string {
    return ["🗳 جهت رأی‌گیری نهایی به پیوی بات بروید.", `⏱ ${seconds} ثانیه`].join("\n");
  },

  verdictPrompt(name: string, seconds: number): string {
    return [`🗳 کاربر <b>${esc(name)}</b> در دادگاه بود.`, "رأی خود را نهایی کنید:", `⏱ ${seconds} ثانیه`].join("\n");
  },

  verdictSaved(guilty: boolean): string {
    return guilty ? "🗳 رأی شما ثبت شد: <b>گناهکار</b>" : "🗳 رأی شما ثبت شد: <b>بی‌گناه</b>";
  },

  verdictResult(name: string, userId: number, res: VerdictResolution, role: RoleId): string {
    const lines = [
      `⚖️ <b>نتیجهٔ دادگاه</b>`,
      "",
      `گناهکار: ${res.guilty} | بی‌گناه: ${res.innocent}`,
      "",
    ];
    if (res.result === "guilty") {
      lines.push(`💀 ${mention(userId, name)} گناهکار شناخته شد و اعدام شد.`);
      lines.push(`نقش: <b>${roleLabel(role)}</b>`);
    } else {
      lines.push(`🕊 ${mention(userId, name)} تبرئه شد و به بازی برمی‌گردد.`);
    }
    return lines.join("\n");
  },

  gameOver(winner: Team, players: Player[], indieRole: IndependentRoleId | null): string {
    let title: string;
    if (winner === "town") title = "🏆 <b>شهروندان برنده شدند</b>";
    else if (winner === "mafia") title = "🏆 <b>مافیا برنده شد</b>";
    else title = "🏆 <b>نقش مستقل برنده شد</b>";
    
    const indieLine = indieRole ? `\n🎭 نقش مستقل: ${INDEPENDENT_ROLES[indieRole].emoji} ${INDEPENDENT_ROLES[indieRole].name}` : "";
    
    const list = players
      .map((p) => {
        const mark = p.status === "alive" ? "●" : "○";
        const roleStr = p.independentRole 
          ? `${INDEPENDENT_ROLES[p.independentRole].emoji} ${INDEPENDENT_ROLES[p.independentRole].name}`
          : roleLabel(p.role);
        return `${mark} ${esc(p.displayName)} — ${roleStr}`;
      })
      .join("\n");
      
    return [
      "🏁 <b>پایان بازی</b>",
      title,
      indieLine,
      "",
      "<b>نقش همه بازیکنان:</b>",
      list,
      "",
      "محدودیت‌های بازی برداشته شد و گروه به وضعیت قبلی برگشت.",
      "برای بازی جدید /new بزنید.",
    ].join("\n");
  },

  jokerWins(name: string): string {
    return [
      "🏆 <b>🤡 جوکر برنده شد!</b>",
      "",
      `${esc(name)} با رأی روزانه حذف شد و شرط برد خود را محقق کرد.`,
    ].join("\n");
  },

  status(game: GameState): string {
    const alive = game.players.filter((p) => p.status === "alive");
    const dead = game.players.filter((p) => p.status !== "alive");
    const remain = game.phaseEndsAt ? formatRemain(game.phaseEndsAt - Date.now()) : "—";
    return [
      "📊 <b>وضعیت بازی</b>",
      `مرحله: ${phaseFa(game.phase)}`,
      `شب ${game.nightNumber} / روز ${game.dayNumber}`,
      `زنده: ${alive.length} | حذف‌شده: ${dead.length}`,
      `زمان باقی‌مانده: ${remain}`,
    ].join("\n");
  },

  helpGroup: [
    "🎭 <b>دستورهای گروه</b>",
    "/new — ساخت لابی",
    "/join — ورود به لابی",
    "/leave — خروج از لابی",
    "/startgame — شروع (میزبان)",
    "/cancel — لغو (میزبان/ادمین)",
    "/status — وضعیت بازی",
    "/players — لیست بازیکنان",
    "/extend — تمدید بحث (میزبان)",
    "/skip — پایان زودتر مرحله (میزبان)",
    "/help — راهنما",
    "",
    "بحث فقط در گروه. نقش، شب و رأی فقط در پیوی.",
  ].join("\n"),

  helpPrivate: [
    "🎭 <b>پیوی بات</b>",
    "/start — فعال‌سازی",
    "/myrole — مشاهده دوباره نقش",
    "/help — راهنما",
    "",
    "اقدام‌ها با دکمه‌های همین چت انجام می‌شود.",
    "در طول شب، مافیاهای زنده می‌توانند پیام متنی معمولی بفرستند تا فقط هم‌تیمی‌های زندهٔ همان بازی آن را ببینند.",
  ].join("\n"),

  myRoleDead(role: RoleId, indieRole: IndependentRoleId | null | undefined): string {
    const roleStr = indieRole ? `${INDEPENDENT_ROLES[indieRole].emoji} ${INDEPENDENT_ROLES[indieRole].name}` : roleLabel(role);
    return `شما حذف شده‌اید و تماشاگر هستید.\nنقش شما: <b>${roleStr}</b>`;
  },

  notPlaying: "الان در هیچ بازی فعالی نیستید.",
  mafiaChatNotInGame: "برای استفاده از چت شب باید در یک بازی فعال حضور داشته باشید.",
  mafiaChatClosed: "🔒 چت خصوصی مافیا فقط در طول شب فعال است.",
  mafiaChatForbidden: "⛔ این چت فقط برای اعضای زندهٔ تیم مافیا فعال است.",
  mafiaChatDead: "💀 بازیکن حذف‌شده اجازهٔ استفاده از چت شب مافیا را ندارد.",
  mafiaChatEmpty: "پیام متنی خالی قابل ارسال نیست.",
  mafiaChatCommandsIgnored: "دستورهای بات به چت مافیا ارسال نمی‌شوند. برای گفتگو، یک پیام متنی معمولی بفرستید.",
  mafiaChatNoRecipients: "در حال حاضر مافیای زندهٔ دیگری برای دریافت پیام وجود ندارد.",
  mafiaChatDelivered(count: number): string {
    return `✅ پیام برای ${count} هم‌تیمی مافیا ارسال شد.`;
  },
  mafiaChatMessage(sender: string, text: string): string {
    return [`👤 <b>${esc(sender)}</b>`, "", esc(text)].join("\n");
  },
  investigation(target: string, result: string): string {
    return `🔍 استعلام ${esc(target)}: <b>${result}</b>`;
  },
  mafiaSawKill(actor: string, target: string): string {
    return `🔪 ${esc(actor)} هدف قتل را ${esc(target)} گذاشت.`;
  },
  extended(seconds: number): string {
    return `⏱ زمان بحث ${seconds} ثانیه تمدید شد.`;
  },
  skipped: "میزبان این مرحله را زودتر تمام کرد.",
  lobbyExpired: "لابی به‌خاطر تمام شدن زمان منقضی شد.",
  restored: "وضعیت گروه بازیابی شد.",
  cannotMuteAdmin(name: string): string {
    return `⚠️ ${esc(name)} ادمین گروه است و بات نمی‌تواند او را میوت کند. بهتر است ادمین‌ها موقتاً دسترسی ادمین را کنار بگذارند.`;
  },

  // Independent role prompts
  johnnyPrompt(seconds: number): string {
    return [
      "🔪 <b>نوبت اقدام شبانه — 🔪 جانی</b>",
      "",
      "یک بازیکن شهروند را برای کشتن انتخاب کنید.",
      "دکتر می‌تواند شما را نجات دهد. هوارد می‌تواند شما را مسدود کند.",
      "",
      `⏱ ${seconds} ثانیه`,
    ].join("\n");
  },

  jokerPrompt(): string {
    return [
      "🤡 <b>🤡 جوکر</b>",
      "",
      "هدف شما این است که بازیکنان را متقاعد کنید مافیا هستید.",
      "اگر با رأی روزانه حذف شوید، برنده می‌شوید!",
      "",
      "شب اقدامی ندارید. در طول روز سعی کنید خودتان را به عنوان مافیا معرفی کنید.",
    ].join("\n");
  },

  bomberPrompt(seconds: number, markedTargets: number[]): string {
    const count = markedTargets.length;
    return [
      "🧨 <b>نوبت اقدام شبانه — 🧨 بمب‌گذار</b>",
      "",
      count > 0 ? `بازیکنان علامت‌گذاری‌شده: ${count}` : "هنوز بازیکنی علامت‌گذاری نشده.",
      "می‌توانید بازیکنان را علامت‌گذاری یا بمب‌ها را منفجر کنید.",
      "",
      `⏱ ${seconds} ثانیه`,
    ].join("\n");
  },

  bomberMarked(targetName: string): string {
    return `💣 <b>${esc(targetName)}</b> علامت‌گذاری شد.`;
  },

  bomberExplode(targets: number): string {
    return `💥 بمب‌ها منفجر شد! ${targets} بازیکن کشته شد.`;
  },

  lonewolfPrompt(seconds: number): string {
    return [
      "🕵️ <b>نوبت اقدام شبانه — 🕵️ گرگ تنها</b>",
      "",
      "می‌توانید نقش یک بازیکن را استعلام کنید.",
      "",
      `⏱ ${seconds} ثانیه`,
    ].join("\n");
  },

  lonewolfResult(result: string): string {
    return `🔎 نتیجه استعلام:\n<b>${result}</b>`;
  },
};

export function phaseFa(phase: string): string {
  switch (phase) {
    case "lobby": return "لابی";
    case "night": return "شب";
    case "day": return "روز / بحث";
    case "nomination": return "معرفی متهم";
    case "defense": return "دفاعیه دادگاه";
    case "verdict": return "رأی‌گیری نهایی دادگاه";
    case "resolving": return "پردازش نتیجه";
    case "finished": return "پایان";
    default: return phase;
  }
}

export function joinAnnounce(userId: number, name: string, count: number, max: number): string {
  return `➕ ${mention(userId, name)} وارد لابی شد. (${count}/${max})`;
}

export function leaveAnnounce(userId: number, name: string, count: number, max: number): string {
  return `➖ ${mention(userId, name)} از لابی خارج شد. (${count}/${max})`;
}


// =============================================================================
// DATABASE FUNCTIONS
// =============================================================================

export async function upsertUser(
  db: D1Database,
  user: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  },
  startedBot = false,
): Promise<void> {
  const ts = Date.now();
  await db
    .prepare(
      `INSERT INTO users (telegram_id, username, first_name, last_name, started_bot, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(telegram_id) DO UPDATE SET
         username = excluded.username,
         first_name = excluded.first_name,
         last_name = excluded.last_name,
         started_bot = MAX(users.started_bot, excluded.started_bot),
         updated_at = excluded.updated_at`,
    )
    .bind(user.id, user.username ?? null, user.first_name ?? null, user.last_name ?? null, startedBot ? 1 : 0, ts, ts)
    .run();
}

export async function markStarted(db: D1Database, userId: number): Promise<void> {
  const ts = Date.now();
  await db
    .prepare(
      `INSERT INTO users (telegram_id, started_bot, created_at, updated_at)
       VALUES (?, 1, ?, ?)
       ON CONFLICT(telegram_id) DO UPDATE SET started_bot = 1, updated_at = excluded.updated_at`,
    )
    .bind(userId, ts, ts)
    .run();
}

export async function hasStartedBot(db: D1Database, userId: number): Promise<boolean> {
  const row = await db.prepare(`SELECT started_bot FROM users WHERE telegram_id = ?`).bind(userId).first<{ started_bot: number }>();
  return !!row?.started_bot;
}

export async function findActiveGameForUser(db: D1Database, userId: number): Promise<{ game_id: string; chat_id: number; status: string } | null> {
  return (await db.prepare(
    `SELECT g.id as game_id, g.chat_id, g.status
     FROM game_players p
     JOIN games g ON g.id = p.game_id
     WHERE p.user_id = ?
       AND g.status NOT IN ('finished', 'cancelled', 'idle')
     ORDER BY g.updated_at DESC
     LIMIT 1`,
  ).bind(userId).first()) ?? null;
}

export async function findActiveGameForChat(db: D1Database, chatId: number): Promise<{ id: string; status: string } | null> {
  return (await db.prepare(
    `SELECT id, status FROM games
     WHERE chat_id = ? AND status NOT IN ('finished', 'cancelled', 'idle')
     ORDER BY updated_at DESC LIMIT 1`,
  ).bind(chatId).first()) ?? null;
}

export async function persistGame(db: D1Database, game: GameState): Promise<void> {
  await db.prepare(
    `INSERT INTO games (
       id, chat_id, chat_title, host_id, status, phase, day_number, night_number,
       winner, player_count, config_json, saved_default_permissions, phase_ends_at,
       started_at, finished_at, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       chat_title = excluded.chat_title,
       host_id = excluded.host_id,
       status = excluded.status,
       phase = excluded.phase,
       day_number = excluded.day_number,
       night_number = excluded.night_number,
       winner = excluded.winner,
       player_count = excluded.player_count,
       config_json = excluded.config_json,
       saved_default_permissions = excluded.saved_default_permissions,
       phase_ends_at = excluded.phase_ends_at,
       started_at = excluded.started_at,
       finished_at = excluded.finished_at,
       updated_at = excluded.updated_at`,
  ).bind(
    game.id, game.chatId, game.chatTitle, game.hostId, game.status, game.phase, game.dayNumber, game.nightNumber,
    game.winner, game.players.length, JSON.stringify(game.config),
    game.savedDefaultPermissions ? JSON.stringify(game.savedDefaultPermissions) : null,
    game.phaseEndsAt, game.startedAt, game.finishedAt, game.createdAt, game.updatedAt,
  ).run();
}

export async function persistPlayers(db: D1Database, gameId: string, players: Player[]): Promise<void> {
  for (const p of players) {
    await db.prepare(
      `INSERT INTO game_players (
         game_id, user_id, username, first_name, display_name, role, team, independent_role, status,
         death_reason, death_phase, death_round, original_member_json, joined_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(game_id, user_id) DO UPDATE SET
         username = excluded.username,
         first_name = excluded.first_name,
         display_name = excluded.display_name,
         role = excluded.role,
         team = excluded.team,
         independent_role = excluded.independent_role,
         status = excluded.status,
         death_reason = excluded.death_reason,
         death_phase = excluded.death_phase,
         death_round = excluded.death_round,
         original_member_json = excluded.original_member_json`,
    ).bind(
      gameId, p.userId, p.username, p.firstName, p.displayName, p.role, p.team, p.independentRole,
      p.status, p.deathReason ?? null, p.deathPhase ?? null, p.deathRound ?? null,
      p.originalMember ? JSON.stringify(p.originalMember) : null, p.joinedAt,
    ).run();
  }
}

export async function persistNightAction(
  db: D1Database, gameId: string, nightNumber: number, actorId: number,
  actionType: string, targetId: number | null, targetRole?: RoleId | null,
): Promise<void> {
  await db.prepare(
    `INSERT INTO night_actions (game_id, night_number, actor_id, action_type, target_id, target_role, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(game_id, night_number, actor_id, action_type) DO UPDATE SET
       target_id = excluded.target_id,
       target_role = excluded.target_role,
       created_at = excluded.created_at`,
  ).bind(gameId, nightNumber, actorId, actionType, targetId, targetRole ?? null, Date.now()).run();
}

export async function persistVote(
  db: D1Database, gameId: string, dayNumber: number,
  voterId: number, targetId: number | null, weight: number,
): Promise<void> {
  await db.prepare(
    `INSERT INTO votes (game_id, day_number, voter_id, target_id, weight, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(game_id, day_number, voter_id) DO UPDATE SET
       target_id = excluded.target_id,
       weight = excluded.weight,
       created_at = excluded.created_at`,
  ).bind(gameId, dayNumber, voterId, targetId, weight, Date.now()).run();
}

export async function persistVerdictVote(
  db: D1Database, gameId: string, dayNumber: number,
  voterId: number, guilty: boolean, weight: number,
): Promise<void> {
  await db.prepare(
    `INSERT INTO verdict_votes (game_id, day_number, voter_id, guilty, weight, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(game_id, day_number, voter_id) DO UPDATE SET
       guilty = excluded.guilty,
       weight = excluded.weight,
       created_at = excluded.created_at`,
  ).bind(gameId, dayNumber, voterId, guilty ? 1 : 0, weight, Date.now()).run();
}

export async function addEvent(db: D1Database, gameId: string, eventType: string, payload: unknown): Promise<void> {
  await db.prepare(
    `INSERT INTO game_events (game_id, event_type, payload, created_at)
     VALUES (?, ?, ?, ?)`,
  ).bind(gameId, eventType, JSON.stringify(payload), Date.now()).run();
}

export async function recordFinishStats(db: D1Database, players: Player[], winner: Team | null): Promise<void> {
  for (const p of players) {
    const won = winner && p.team === winner ? 1 : 0;
    await db.prepare(
      `UPDATE users SET games_played = games_played + 1, games_won = games_won + ?, updated_at = ? WHERE telegram_id = ?`,
    ).bind(won, Date.now(), p.userId).run();
  }
}

export async function deleteLobbyPlayersNotIn(db: D1Database, gameId: string, userIds: number[]): Promise<void> {
  if (userIds.length === 0) {
    await db.prepare(`DELETE FROM game_players WHERE game_id = ?`).bind(gameId).run();
    return;
  }
  const placeholders = userIds.map(() => "?").join(",");
  await db.prepare(`DELETE FROM game_players WHERE game_id = ? AND user_id NOT IN (${placeholders})`).bind(gameId, ...userIds).run();
}


// =============================================================================
// CONSTANTS
// =============================================================================

const EXTEND_SECONDS = 60;
const DEFENSE_SECONDS = 30;

const COURT_ADMIN_MINIMAL_RIGHTS: Record<string, boolean> = {
  is_anonymous: false,
  can_manage_chat: true,
  can_delete_messages: false,
  can_manage_video_chats: false,
  can_restrict_members: false,
  can_promote_members: false,
  can_change_info: false,
  can_invite_users: false,
  can_post_messages: false,
  can_edit_messages: false,
  can_pin_messages: false,
  can_post_stories: false,
  can_edit_stories: false,
  can_delete_stories: false,
  can_manage_topics: false,
  can_manage_direct_messages: false,
  can_manage_tags: false,
};

const COURT_ADMIN_NO_RIGHTS: Record<string, boolean> = {
  ...COURT_ADMIN_MINIMAL_RIGHTS,
  can_manage_chat: false,
};


// =============================================================================
// GAME ROOM CLASS
// =============================================================================

export class GameRoom extends DurableObject<Env> {
  private game: GameState | null = null;
  private tg: Telegram;
  private nominationVoteQueue: Promise<void> = Promise.resolve();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.tg = new Telegram(env.BOT_TOKEN);
    ctx.blockConcurrencyWhile(async () => {
      this.game = (await ctx.storage.get<GameState>("state")) ?? null;
      if (this.game && this.game.temporaryCourtAdminUserId === undefined) {
        this.game.temporaryCourtAdminUserId = null;
      }
      if (this.game?.temporaryCourtAdminUserId && this.game.status !== "defense") {
        await this.removeTemporaryCourtAdmin(this.game.temporaryCourtAdminUserId);
      }
      if (this.game && isActiveStatus(this.game.status)) {
        await this.ensureAlarm();
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") return new Response("ok");
    const update = (await request.json()) as TgUpdate;
    const result = await this.handleUpdate(update);
    return Response.json(result);
  }

  async handleUpdate(update: TgUpdate): Promise<{ ok: boolean }> {
    try {
      if (!this.game) {
        const chatId = inferChatId(update);
        if (chatId) await this.recoverFromD1(chatId);
      }
      if (update.callback_query) {
        await this.onCallback(update.callback_query);
      } else if (update.message) {
        await this.onMessage(update.message);
      } else if (update.my_chat_member) {
        await this.onMyChatMember(update.my_chat_member);
      } else if (update.chat_member) {
        await this.onChatMember(update.chat_member);
      }
      return { ok: true };
    } catch (err) {
      console.error("handleUpdate", err);
      return { ok: false };
    }
  }

  async alarm(): Promise<void> {
    const game = this.game;
    if (!game || !isActiveStatus(game.status)) return;
    const t = now();
    if (game.alarmKind === "countdown" && game.status === "day" && game.phaseEndsAt && t < game.phaseEndsAt) {
      await this.sendCountdown();
      const nextTick = t + 60000;
      game.nextTickAt = game.phaseEndsAt - nextTick > 15000 ? nextTick : null;
      await this.persist();
      await this.schedulePhaseTimers();
      return;
    }
    if (game.alarmKind === "reminder" && game.phaseEndsAt && t < game.phaseEndsAt) {
      await this.sendReminders();
      game.reminderAt = null;
      await this.persist();
      await this.schedulePhaseTimers();
      return;
    }
    await this.advancePhase("timer");
  }

  private async onMessage(msg: TgMessage): Promise<void> {
    const text = msg.text ?? "";
    const from = msg.from;
    if (!from || from.is_bot) return;

    if (msg.chat.type === "private") {
      await upsertUser(this.env.DB, from, true);
      const parsed = parseCommand(text);
      if (parsed?.cmd === "start") { await this.onPrivateStart(msg, parsed.args); return; }
      if (parsed?.cmd === "help") { await this.tg.sendMessage(from.id, fa.helpPrivate); return; }
      if (parsed?.cmd === "myrole") { await this.sendMyRole(from.id); return; }
      if (parsed) { await this.tg.sendMessage(from.id, fa.mafiaChatCommandsIgnored); return; }
      await this.handleMafiaNightChat(msg);
      return;
    }

    if (msg.chat.type !== "supergroup" && msg.chat.type !== "group") return;
    const parsed = parseCommand(text);
    if (!parsed) return;

    switch (parsed.cmd) {
      case "new": case "mafia": case "newgame": await this.cmdNew(msg); break;
      case "join": await this.cmdJoin(msg); break;
      case "leave": await this.cmdLeave(msg); break;
      case "startgame": case "begin": await this.cmdStartGame(msg.from!.id, msg.chat.id); break;
      case "cancel": await this.cmdCancel(msg.from!.id, msg.chat.id, false); break;
      case "status": await this.cmdStatus(msg.chat.id); break;
      case "players": await this.cmdPlayers(msg.chat.id); break;
      case "help": await this.tg.sendMessage(msg.chat.id, fa.helpGroup); break;
      case "extend": await this.cmdExtend(msg.from!.id); break;
      case "skip": await this.cmdSkip(msg.from!.id); break;
      default: break;
    }
  }

  private async handleMafiaNightChat(msg: TgMessage): Promise<void> {
    const from = msg.from;
    if (!from || msg.chat.type !== "private") return;
    const game = this.game;
    if (!game || !isActiveStatus(game.status)) { await this.tg.sendMessage(from.id, fa.mafiaChatNotInGame); return; }
    const sender = findPlayer(game.players, from.id);
    if (!sender) { await this.tg.sendMessage(from.id, fa.mafiaChatNotInGame); return; }
    if (game.status !== "night" || game.phase !== "night") { await this.tg.sendMessage(from.id, fa.mafiaChatClosed); return; }
    if (sender.status !== "alive") { await this.tg.sendMessage(from.id, fa.mafiaChatDead); return; }
    if (sender.team !== "mafia") { await this.tg.sendMessage(from.id, fa.mafiaChatForbidden); return; }
    const body = (msg.text ?? "").trim();
    if (!body) { await this.tg.sendMessage(from.id, fa.mafiaChatEmpty); return; }

    const relayText = fa.mafiaChatMessage(sender.displayName, body.slice(0, 3800));
    let delivered = 0;
    for (const m of livingMafia(game.players)) {
      if (m.userId === sender.userId) continue;
      const result = await this.tg.callSafe("sendMessage", {
        chat_id: m.userId, text: relayText, parse_mode: "HTML", disable_web_page_preview: true,
      });
      if (result.ok) delivered += 1;
    }
    await this.tg.sendMessage(from.id, delivered > 0 ? fa.mafiaChatDelivered(delivered) : fa.mafiaChatNoRecipients);
  }

  private async onPrivateStart(msg: TgMessage, args: string): Promise<void> {
    const from = msg.from!;
    if (args.startsWith("join_")) {
      const chatId = Number(args.slice(5));
      if (!Number.isFinite(chatId)) { await this.tg.sendMessage(from.id, fa.privateStart); return; }
      await this.joinFromPrivate(from, chatId);
      return;
    }
    const game = this.game;
    if (game && isActiveStatus(game.status) && findPlayer(game.players, from.id)) { await this.sendMyRole(from.id); return; }
    await this.tg.sendMessage(from.id, fa.privateStart);
  }

  private async onCallback(cq: TgCallbackQuery): Promise<void> {
    const data = cq.data ?? "";
    const user = cq.from;
    try {
      // Lobby callbacks
      if (data === "L:s") { await this.cmdStartGame(user.id, cq.message?.chat.id ?? this.game?.chatId ?? 0); await this.tg.answerCallbackQuery(cq.id); return; }
      if (data === "L:c") { await this.cmdCancel(user.id, cq.message?.chat.id ?? this.game?.chatId ?? 0, false); await this.tg.answerCallbackQuery(cq.id); return; }
      if (data === "L:l") { await this.leavePlayer(user.id, true); await this.tg.answerCallbackQuery(cq.id, "از لابی خارج شدید"); return; }
      if (data === "L:x") { const ok = await this.cmdExtend(user.id); await this.tg.answerCallbackQuery(cq.id, ok ? "تمدید شد" : "امکان تمدید نیست", !ok); return; }
      if (data === "L:k") { const ok = await this.cmdSkip(user.id); await this.tg.answerCallbackQuery(cq.id, ok ? "مرحله تمام شد" : "اجازه ندارید", !ok); return; }

      // NATO guess callbacks - Player selection
      const natoGuess = /^NG(\d+):(-?\d+)$/.exec(data);
      if (natoGuess) {
        const nightNumber = Number(natoGuess[1]);
        const targetId = Number(natoGuess[2]);
        const result = await this.applyNatoGuess(user.id, nightNumber, targetId);
        await this.tg.answerCallbackQuery(cq.id, result.alert ? result.text : undefined, result.alert);
        return;
      }

      // NATO role selection callback
      const natoRole = /^NR(\d+):(-?\d+):(.+)$/.exec(data);
      if (natoRole) {
        const nightNumber = Number(natoRole[1]);
        const targetId = Number(natoRole[2]);
        const roleId = natoRole[3] as RoleId;
        const result = await this.applyNatoRoleGuess(user.id, nightNumber, targetId, roleId);
        await this.tg.answerCallbackQuery(cq.id, result.alert ? result.text : undefined, result.alert);
        return;
      }

      // Bomber callbacks
      const bomberMark = /^N(\d+):bm:(-?\d+)$/.exec(data);
      if (bomberMark) {
        const nightNumber = Number(bomberMark[1]);
        const targetId = Number(bomberMark[2]);
        const result = await this.applyNightAction(user.id, nightNumber, "bomber_mark", targetId);
        await this.tg.answerCallbackQuery(cq.id, result.alert ? result.text : undefined, result.alert);
        return;
      }

      const bomberExplode = /^N(\d+):be:(-?\d+)$/.exec(data);
      if (bomberExplode) {
        const nightNumber = Number(bomberExplode[1]);
        const result = await this.applyBomberExplode(user.id, nightNumber);
        await this.tg.answerCallbackQuery(cq.id, result.alert ? result.text : undefined, result.alert);
        return;
      }

      // Night action callbacks
      const night = /^N(\d+):([a-z_]+):(-?\d+)$/.exec(data);
      if (night) {
        const nightNumber = Number(night[1]);
        const action = night[2] as NightActionType;
        const targetId = Number(night[3]);
        const result = await this.applyNightAction(user.id, nightNumber, action, targetId);
        await this.tg.answerCallbackQuery(cq.id, result.alert ? result.text : undefined, result.alert);
        return;
      }

      // Gunner shot callbacks
      const gunnerShot = /^GU(\d+):(-?\d+)$/.exec(data);
      if (gunnerShot) {
        const dayNumber = Number(gunnerShot[1]);
        const targetId = Number(gunnerShot[2]);
        const result = await this.applyGunnerShot(user.id, dayNumber, targetId);
        await this.tg.answerCallbackQuery(cq.id, result.alert ? result.text : undefined, result.alert);
        return;
      }

      // Nomination callbacks
      const nomination = /^T(\d+):(-?\d+)$/.exec(data);
      if (nomination) {
        const dayNumber = Number(nomination[1]);
        const targetId = Number(nomination[2]);
        const result = await this.applyNomination(user.id, dayNumber, targetId);
        await this.tg.answerCallbackQuery(cq.id, result.alert ? result.text : undefined, result.alert);
        return;
      }

      // Verdict callbacks
      const verdict = /^J(\d+):([01])$/.exec(data);
      if (verdict) {
        const dayNumber = Number(verdict[1]);
        const guilty = verdict[2] === "1";
        const result = await this.applyVerdict(user.id, dayNumber, guilty);
        await this.tg.answerCallbackQuery(cq.id, result.alert ? result.text : undefined, result.alert);
        return;
      }

      await this.tg.answerCallbackQuery(cq.id);
    } catch (err) {
      console.error("callback", err);
      await this.tg.callSafe("answerCallbackQuery", {
        callback_query_id: cq.id,
        text: "خطا رخ داد. دوباره تلاش کنید.",
        show_alert: true,
      });
    }
  }

  private async onMyChatMember(upd: TgChatMemberUpdated): Promise<void> {
    const next = upd.new_chat_member;
    if (!next.user.is_bot) return;
    if ((upd.chat.type === "group" || upd.chat.type === "supergroup") &&
        (next.status === "member" || next.status === "administrator") &&
        (upd.old_chat_member.status === "left" || upd.old_chat_member.status === "kicked")) {
      const me = await this.ensureBotIdentity();
      await this.tg.sendMessage(upd.chat.id, fa.botAdded(me?.username || "Mafia Bot"));
    }
    if (this.game && isPlayingStatus(this.game.status) && next.user.id === this.game.botId &&
        (next.status === "left" || next.status === "kicked" || next.status === "member")) {
      await this.group("⚠️ دسترسی ادمین بات برداشته شد. مدیریت گروه متوقف می‌شود تا دوباره ادمین شوم.");
    }
  }

  private async onChatMember(upd: TgChatMemberUpdated): Promise<void> {
    const game = this.game;
    if (!game || !isPlayingStatus(game.status)) return;
    if (upd.chat.id !== game.chatId) return;
    const next = upd.new_chat_member;
    if (next.user.is_bot) return;
    const player = findPlayer(game.players, next.user.id);
    if (!player || player.status !== "alive") return;
    if (next.status === "left" || next.status === "kicked") {
      await this.eliminate(player.userId, "left");
    }
  }

  private async cmdNew(msg: TgMessage): Promise<void> {
    if (msg.chat.type === "group") { await this.tg.sendMessage(msg.chat.id, fa.needSupergroup); return; }
    if (msg.chat.type !== "supergroup") { await this.tg.sendMessage(msg.chat.id, fa.lobbyOnlyHere); return; }
    if (this.game && isActiveStatus(this.game.status)) { await this.tg.sendMessage(msg.chat.id, fa.gameAlreadyRunning); return; }
    if (this.game?.temporaryCourtAdminUserId) {
      const cleared = await this.removeTemporaryCourtAdmin(this.game.temporaryCourtAdminUserId);
      if (!cleared) { await this.tg.sendMessage(msg.chat.id, "⚠️ پاک‌سازی دسترسی موقت دادگاه قبلی انجام نشد."); return; }
    }
    const admin = await this.assertBotAdmin(msg.chat.id);
    if (!admin.ok) { await this.tg.sendMessage(msg.chat.id, admin.message); return; }

    const me = await this.ensureBotIdentity();
    const from = msg.from!;
    const ts = now();
    const host: Player = {
      userId: from.id, username: from.username ?? null, firstName: from.first_name,
      displayName: displayOf(from), role: null, team: null, independentRole: null,
      status: "alive", originalMember: null, joinedAt: ts,
    };

    this.game = {
      id: randomId("g"), chatId: msg.chat.id, chatTitle: msg.chat.title || "گروه",
      hostId: from.id, status: "lobby", phase: "lobby", dayNumber: 0, nightNumber: 0,
      phaseEndsAt: ts + DEFAULT_CONFIG.lobbySeconds * 1000, dayPhaseMaxEndsAt: null, reminderAt: null, nextTickAt: null,
      alarmKind: "phase_end", players: [host], nightActions: [], votes: [], verdictVotes: [],
      accusedUserId: null, temporaryCourtAdminUserId: null, silencedUserIds: [], blockedUserIds: [],
      escortBlockedUserIds: [], doctorSelfHealUsedBy: [], sniperShotsLeft: {}, detectiveChecked: {},
      natoChancesLeft: 3, paranoidAlertLeft: 2, bomberMarkedTargets: [], independentRoleType: null,
      invincibleShieldHits: {}, gunnerGuns: {},
      savedDefaultPermissions: null, lastGroupMessageId: null, pinnedMessageId: null, winner: null,
      botUsername: me?.username ?? null, botId: me?.id ?? null, config: { ...DEFAULT_CONFIG },
      createdAt: ts, updatedAt: ts, startedAt: null, finishedAt: null,
    };

    await upsertUser(this.env.DB, from, false);
    await this.persist(true);
    await this.scheduleAlarm(this.game.phaseEndsAt ?? ts + DEFAULT_CONFIG.lobbySeconds * 1000);

    const sent = await this.tg.sendMessage(msg.chat.id, fa.lobbyCreated(mention(from.id, host.displayName)), {
      reply_markup: { inline_keyboard: lobbyKeyboard(this.game.botUsername, msg.chat.id) },
    });
    this.game.lastGroupMessageId = sent.message_id;
    await this.pin(sent.message_id);
    await this.refreshLobbyMessage();
    await this.persist(true);
  }

  private async cmdJoin(msg: TgMessage): Promise<void> {
    if (!msg.from) return;
    await this.addPlayer(msg.from, msg.chat.id, msg.chat.id);
  }

  private async joinFromPrivate(from: { id: number; username?: string; first_name: string; last_name?: string }, chatId: number): Promise<void> {
    const member = await this.tg.callSafe<TgChatMember>("getChatMember", { chat_id: chatId, user_id: from.id });
    if (!member.ok || member.result.status === "left" || member.result.status === "kicked") {
      await this.tg.sendMessage(from.id, fa.notInGroup); return;
    }
    const result = await this.addPlayer(from, chatId, from.id);
    if (result === "ok") await this.tg.sendMessage(from.id, "✅ وارد لابی شدید.\nبعد از شروع بازی، نقش و اقدام‌ها همین‌جا می‌آید.");
    else if (result === "already") await this.tg.sendMessage(from.id, fa.alreadyJoined);
    else if (result === "full") await this.tg.sendMessage(from.id, fa.tooMany);
    else if (result === "busy") await this.tg.sendMessage(from.id, fa.alreadyInGame(this.game?.chatTitle || "گروه دیگر"));
    else if (result === "nogame") await this.tg.sendMessage(from.id, fa.noGame);
  }

  private async addPlayer(from: { id: number; username?: string; first_name: string; last_name?: string }, chatId: number, notifyChatId: number): Promise<"ok" | "already" | "full" | "nogame" | "busy" | "notlobby"> {
    const game = this.game;
    if (!game || game.chatId !== chatId || game.status !== "lobby") {
      if (notifyChatId === chatId) await this.tg.sendMessage(chatId, fa.noGame);
      return game && game.status !== "lobby" && findPlayer(game.players, from.id) ? "busy" : "nogame";
    }
    if (findPlayer(game.players, from.id)) { await this.tg.sendMessage(chatId, fa.alreadyJoined); return "already"; }
    const already = await findActiveGameForUser(this.env.DB, from.id);
    if (already && already.chat_id !== chatId) { await this.tg.sendMessage(chatId, fa.alreadyInGame(this.game?.chatTitle || "گروه دیگر")); return "busy"; }
    if (game.players.length >= game.config.maxPlayers) { await this.tg.sendMessage(chatId, fa.tooMany); return "full"; }
    game.players.push({
      userId: from.id, username: from.username ?? null, firstName: from.first_name,
      displayName: displayOf(from), role: null, team: null, independentRole: null,
      status: "alive", originalMember: null, joinedAt: now(),
    });
    await upsertUser(this.env.DB, from, notifyChatId === from.id);
    await this.persist(true);
    await this.group(joinAnnounce(from.id, displayOf(from), game.players.length, game.config.maxPlayers));
    await this.refreshLobbyMessage();
    return "ok";
  }

  private async cmdLeave(msg: TgMessage): Promise<void> {
    if (!msg.from) return;
    await this.leavePlayer(msg.from.id, false);
  }

  private async leavePlayer(userId: number, fromCallback: boolean): Promise<void> {
    const game = this.game;
    if (!game || game.status !== "lobby") { if (!fromCallback && game) await this.tg.sendMessage(game.chatId, fa.notInLobby); return; }
    const idx = game.players.findIndex((p) => p.userId === userId);
    if (idx < 0) { await this.tg.sendMessage(game.chatId, fa.notInLobby); return; }
    const leaving = game.players[idx]!;
    game.players.splice(idx, 1);
    if (game.players.length === 0 || userId === game.hostId) { await this.cancelInternal("میزبان لابی را ترک کرد."); return; }
    await this.persist(true);
    await deleteLobbyPlayersNotIn(this.env.DB, game.id, game.players.map((p) => p.userId));
    await this.group(leaveAnnounce(leaving.userId, leaving.displayName, game.players.length, game.config.maxPlayers));
    await this.refreshLobbyMessage();
  }

  private async cmdStartGame(userId: number, chatId: number): Promise<void> {
    const game = this.game;
    if (!game || game.chatId !== chatId) { if (chatId) await this.tg.sendMessage(chatId, fa.noGame); return; }
    if (game.status !== "lobby") { await this.tg.sendMessage(game.chatId, fa.gameAlreadyRunning); return; }
    if (!(await this.isHostOrAdmin(userId))) { await this.tg.sendMessage(game.chatId, fa.hostOnly); return; }
    if (game.players.length < game.config.minPlayers) { await this.tg.sendMessage(game.chatId, fa.notEnough); return; }
    if (game.players.length > game.config.maxPlayers) { await this.tg.sendMessage(game.chatId, fa.tooMany); return; }
    const admin = await this.assertBotAdmin(game.chatId);
    if (!admin.ok) { await this.tg.sendMessage(game.chatId, admin.message); return; }

    const probes = await Promise.all(game.players.map(async (p) => {
      const started = await hasStartedBot(this.env.DB, p.userId);
      const probe = await this.tg.callSafe("sendMessage", {
        chat_id: p.userId, text: "🎭 بازی در حال بررسی آمادگی بازیکنان است...", parse_mode: "HTML",
      });
      return { player: p, ok: probe.ok, started };
    }));
    const blocked = probes.filter((r) => !r.ok && !r.started).map((r) => mention(r.player.userId, r.player.displayName));
    if (blocked.length) { await this.tg.sendMessage(game.chatId, `${fa.playersMustStartBot}\n${blocked.join("\n")}`); return; }

    game.status = "starting";
    game.phase = "night";
    await this.persist();

    await this.snapshotPermissions();
    game.players = assignRoles(game.players);
    game.startedAt = now();
    game.nightNumber = 0;
    game.dayNumber = 0;
    game.sniperShotsLeft = {};
    game.natoChancesLeft = 3;
    game.paranoidAlertLeft = 2;
    game.bomberMarkedTargets = [];
    game.invincibleShieldHits = {};
    game.gunnerGuns = {};

    // Store independent role type
    const indie = game.players.find(p => p.independentRole);
    game.independentRoleType = indie?.independentRole ?? null;

    for (const p of game.players) {
      if (p.role === "sniper") {
        game.sniperShotsLeft[String(p.userId)] = sniperShotsFor(game.players.length);
      }
    }

    await this.persist(true);
    await addEvent(this.env.DB, game.id, "game_started", {
      players: game.players.length,
      mafia: mafiaCountFor(game.players.length),
      independentRole: game.independentRoleType,
    });

    await this.lockGroup();
    await this.group(fa.gameStarted(game.players.length, mafiaCountFor(game.players.length), game.independentRoleType));
    await this.sendRoleCards();
    await this.enterNight();
  }

  private async cmdCancel(userId: number, chatId: number, force: boolean): Promise<void> {
    const game = this.game;
    if (!game || (chatId && game.chatId !== chatId)) { if (chatId) await this.tg.sendMessage(chatId, fa.noGame); return; }
    if (!force && !(await this.isHostOrAdmin(userId))) { await this.tg.sendMessage(game.chatId, fa.hostOnly); return; }
    await this.cancelInternal("بازی توسط میزبان یا ادمین لغو شد.");
  }

  private async cancelInternal(reason: string): Promise<void> {
    const game = this.game;
    if (!game) return;
    if (game.temporaryCourtAdminUserId) await this.removeTemporaryCourtAdmin(game.temporaryCourtAdminUserId);
    const wasPlaying = isPlayingStatus(game.status);
    game.status = "cancelled";
    game.phase = "finished";
    game.finishedAt = now();
    game.phaseEndsAt = null;
    game.alarmKind = "none";
    await this.ctx.storage.deleteAlarm();
    if (wasPlaying) await this.restoreAllPermissions();
    await this.persist(true);
    await addEvent(this.env.DB, game.id, "cancelled", { reason });
    await this.group(`🚪 <b>بازی لغو شد</b>\n${esc(reason)}\n\n${fa.restored}`);
    await this.unpin();
  }

  private async cmdStatus(chatId: number): Promise<void> {
    if (!this.game || !isActiveStatus(this.game.status)) { await this.tg.sendMessage(chatId, fa.noGame); return; }
    await this.tg.sendMessage(chatId, fa.status(this.game));
  }

  private async cmdPlayers(chatId: number): Promise<void> {
    const game = this.game;
    if (!game || !isActiveStatus(this.game.status)) { await this.tg.sendMessage(chatId, fa.noGame); return; }
    const lines = game.players.map((p, i) => {
      const mark = p.status === "alive" ? "●" : "○";
      const extra = game.status === "lobby" ? "" : p.status === "alive" ? "" : " — حذف‌شده";
      return `${i + 1}. ${mark} ${mention(p.userId, p.displayName)}${extra}`;
    });
    await this.tg.sendMessage(chatId, `👥 <b>بازیکنان</b>\n${lines.join("\n")}`);
  }

  private async cmdExtend(userId: number): Promise<boolean> {
    const game = this.game;
    if (!game || game.status !== "day") return false;
    if (!(await this.isHostOrAdmin(userId))) return false;
    const current = game.phaseEndsAt ?? now();
    if (game.dayPhaseMaxEndsAt && current >= game.dayPhaseMaxEndsAt) return false;
    const proposed = current + EXTEND_SECONDS * 1000;
    game.phaseEndsAt = game.dayPhaseMaxEndsAt ? Math.min(proposed, game.dayPhaseMaxEndsAt) : proposed;
    await this.schedulePhaseTimers();
    await this.persist();
    await this.group(fa.extended(EXTEND_SECONDS));
    return true;
  }

  private async cmdSkip(userId: number): Promise<boolean> {
    const game = this.game;
    if (!game || !isPlayingStatus(game.status)) return false;
    if (!(await this.isHostOrAdmin(userId))) return false;
    await this.group(fa.skipped);
    await this.advancePhase("skip");
    return true;
  }

  private async enterNight(): Promise<void> {
    const game = this.game;
    if (!game) return;
    if (game.temporaryCourtAdminUserId) await this.removeTemporaryCourtAdmin(game.temporaryCourtAdminUserId);
    const winner = checkWinner(game.players);
    if (winner) { await this.finish(winner); return; }
    const indieWinner = checkIndependentWinner(game.players, game);
    if (indieWinner) { await this.finish(indieWinner); return; }

    game.nightNumber += 1;
    game.dayNumber = game.nightNumber;
    game.status = "night";
    game.phase = "night";
    game.nightActions = game.nightActions.filter((a) => a.nightNumber !== game.nightNumber);
    game.silencedUserIds = [];
    game.blockedUserIds = [];
    game.escortBlockedUserIds = [];
    const ms = game.config.nightSeconds * 1000;
    game.phaseEndsAt = now() + ms;
    game.reminderAt = game.phaseEndsAt - game.config.reminderLeadSeconds * 1000;
    await this.lockGroup();
    await this.relockAllPlayers();
    await this.persist(true);
    await this.schedulePhaseTimers();
    const sent = await this.group(fa.nightStart(game.nightNumber, game.config.nightSeconds));
    if (sent) await this.pin(sent.message_id);
    await this.sendNightPrompts();
  }

  private async enterDay(resolutionText: string): Promise<void> {
    const game = this.game;
    if (!game) return;
    let winner = checkWinner(game.players);
    if (winner) { await this.group(resolutionText); await this.finish(winner); return; }
    const indieWinner = checkIndependentWinner(game.players, game);
    if (indieWinner) { await this.group(resolutionText); await this.finish(indieWinner); return; }

    game.status = "day";
    game.phase = "day";
    game.accusedUserId = null;
    const secs = dayDurationSeconds(game);
    game.phaseEndsAt = now() + secs * 1000;
    game.dayPhaseMaxEndsAt = now() + game.config.daySecondsMax * 1000;
    game.reminderAt = null;
    game.nextTickAt = secs > 90 ? now() + 60000 : null;
    await this.unlockForDay();
    await this.persist(true);
    await this.schedulePhaseTimers();
    const silenced = game.silencedUserIds.map((id) => {
      const p = findPlayer(game.players, id);
      return p ? mention(p.userId, p.displayName) : null;
    }).filter(Boolean).join("، ");
    const sent = await this.group(`${resolutionText}\n\n${fa.dayStart(game.dayNumber, secs, silenced || null)}`, { reply_markup: { inline_keyboard: dayHostKeyboard() } });
    if (sent) await this.pin(sent.message_id);
    await this.sendGunnerPanels();
  }

  private async sendGunnerPanels(): Promise<void> {
    const game = this.game;
    if (!game) return;
    for (const p of living(game.players)) {
      if (p.role !== "gunner") continue;
      const guns = game.gunnerGuns[String(p.userId)] ?? [];
      if (guns.length === 0) continue;
      await this.pm(p.userId, fa.gunnerPanelPrompt, this.gunnerKeyboard(game, p));
    }
  }

  private gunnerKeyboard(game: GameState, player: Player): InlineKeyboard {
    const targets = game.players.filter((p) => p.status === "alive" && p.userId !== player.userId);
    return playerButtons(targets, `GU${game.dayNumber}:`);
  }

  private async enterNomination(): Promise<void> {
    const game = this.game;
    if (!game) return;
    game.gunnerGuns = {};
    game.status = "nomination";
    game.phase = "nomination";
    game.nextTickAt = null;
    game.votes = game.votes.filter((v) => v.dayNumber !== game.dayNumber);
    game.phaseEndsAt = now() + game.config.voteSeconds * 1000;
    game.reminderAt = game.phaseEndsAt - game.config.reminderLeadSeconds * 1000;
    await this.lockGroup();
    await this.relockAllPlayers();
    await this.persist(true);
    await this.schedulePhaseTimers();
    const sent = await this.group(fa.nominationStart(game.dayNumber, game.config.voteSeconds));
    if (sent) await this.pin(sent.message_id);
    await this.sendNominationPrompts();
  }

  private async enterDefense(accusedUserId: number): Promise<void> {
    const game = this.game;
    if (!game) return;
    const previousCourtAdminId = game.temporaryCourtAdminUserId;
    const previousAdminCleared = previousCourtAdminId ? await this.removeTemporaryCourtAdmin(previousCourtAdminId) : true;
    const accused = findPlayer(game.players, accusedUserId);
    if (!accused || accused.status !== "alive") { await this.enterNight(); return; }
    game.accusedUserId = accusedUserId;
    game.status = "defense";
    game.phase = "defense";
    game.phaseEndsAt = now() + DEFENSE_SECONDS * 1000;
    game.reminderAt = null;
    await this.persist(true);
    await this.schedulePhaseTimers();
    const adminReady = previousAdminCleared && (await this.promoteCourtAccused(accusedUserId));
    const sent = await this.group(fa.summonedToTrial(accused.displayName, accused.userId, DEFENSE_SECONDS));
    if (sent) await this.pin(sent.message_id);
    if (!adminReady) await this.group("⚠️ دسترسی موقت متهم برای صحبت در دادگاه فعال نشد.");
  }

  private async enterVerdict(): Promise<void> {
    const game = this.game;
    if (!game || !game.accusedUserId) { await this.enterNight(); return; }
    game.status = "verdict";
    game.phase = "verdict";
    game.verdictVotes = game.verdictVotes.filter((v) => v.dayNumber !== game.dayNumber);
    game.phaseEndsAt = now() + game.config.voteSeconds * 1000;
    game.reminderAt = game.phaseEndsAt - game.config.reminderLeadSeconds * 1000;
    await this.persist(true);
    await this.schedulePhaseTimers();
    const sent = await this.group(fa.goToFinalVote(game.config.voteSeconds));
    if (sent) await this.pin(sent.message_id);
    await this.sendVerdictPrompts();
  }

  private async advancePhase(reason: "timer" | "skip" | "early"): Promise<void> {
    const game = this.game;
    if (!game) return;
    if (game.status === "lobby") { await this.cancelInternal(fa.lobbyExpired); return; }
    if (game.status === "night") { await this.resolveNightPhase(); return; }
    if (game.status === "day") { await this.enterNomination(); return; }
    if (game.status === "nomination") { await this.resolveNominationPhase(); return; }
    if (game.status === "defense") { await this.resolveDefensePhase(); return; }
    if (game.status === "verdict") { await this.resolveVerdictPhase(); return; }
    console.log("advance ignored", game.status, reason);
  }

  private async resolveNightPhase(): Promise<void> {
    const game = this.game;
    if (!game || game.status !== "night") return;
    game.status = "resolving";
    game.phase = "resolving";
    await this.persist();

    const res = resolveNight(game);
    game.sniperShotsLeft = consumeSniperShots(game, game.nightActions.filter((a) => a.nightNumber === game.nightNumber && a.type === "snipe"));
    game.players = applyDeaths(game.players, res.deaths, "night", game.nightNumber);

    for (const a of game.nightActions) {
      if (a.nightNumber === game.nightNumber && a.type === "heal" && a.targetId === a.actorId && !game.doctorSelfHealUsedBy.includes(a.actorId)) {
        game.doctorSelfHealUsedBy.push(a.actorId);
      }
    }

    // NATO chances
    if (res.natoGuessCorrect === false && res.natoTarget) {
      game.natoChancesLeft = Math.max(0, game.natoChancesLeft - 1);
    }

    // Invincible shield hits
    for (const userId of res.shieldAbsorbed) {
      const hits = game.invincibleShieldHits[String(userId)] ?? 0;
      await this.pm(userId, fa.invincibleShieldHit(Math.max(0, 3 - hits)));
    }


    // Bomber marks: clear exploded marks, then add any newly-placed ones
    if (res.bomberExploded) {
      game.bomberMarkedTargets = [];
    }
    for (const targetId of res.bomberMarked) {
      if (!game.bomberMarkedTargets.includes(targetId)) game.bomberMarkedTargets.push(targetId);
    }

    game.silencedUserIds = res.silenced;
    game.blockedUserIds = res.protectedIds;

    for (const inv of res.investigations) {
      const checked = game.detectiveChecked[String(inv.actorId)] ?? [];
      if (!checked.includes(inv.targetId)) checked.push(inv.targetId);
      game.detectiveChecked[String(inv.actorId)] = checked;
      const target = findPlayer(game.players, inv.targetId);
      if (!target) continue;
      // Skip lonewolf here — they get their own message below (lonewolfResult)
      const investigator = findPlayer(game.players, inv.actorId);
      if (investigator?.independentRole === "lonewolf") continue;
      await this.pm(inv.actorId, fa.investigation(target.displayName, inv.result));
    }

    // NATO result
    if (res.natoTarget && res.natoGuessCorrect !== null) {
      const natoPlayer = game.players.find(p => p.role === "nato" && p.status === "alive");
      if (natoPlayer) {
        await this.pm(natoPlayer.userId, res.natoGuessCorrect ? fa.natoGuessCorrect(game.natoChancesLeft) : fa.natoGuessWrong(game.natoChancesLeft));
      }
    }

    // Lonewolf result
    if (res.lonewolfResult) {
      const lonewolf = game.players.find(p => p.independentRole === "lonewolf" && p.status === "alive");
      if (lonewolf) await this.pm(lonewolf.userId, fa.lonewolfResult(res.lonewolfResult));
    }

    for (const d of res.deaths) await this.mutePlayer(d.userId);

    // Notify players who were blocked by escort that their action failed
    for (const userId of game.escortBlockedUserIds) {
      const p = findPlayer(game.players, userId);
      if (p && p.status === "alive") {
        await this.pm(userId, "💋 شما توسط اسکورت مسدود شدید و نتوانستید اقدام شبانه انجام دهید.");
      }
    }

    await this.persist(true);
    await addEvent(this.env.DB, game.id, "night_resolved", res);

    const lines: string[] = [];
    if (res.deaths.length === 0) lines.push(fa.nightQuiet);
    else {
      for (const d of res.deaths) {
        const p = findPlayer(game.players, d.userId);
        if (!p) continue;
        const reason = this.getDeathReasonText(d.reason);
        lines.push(fa.playerDied(p.displayName, p.userId, d.revealedRole, d.revealedIndependentRole, reason));
      }
    }
    await this.enterDay(fa.nightReport(lines));
  }

  private getDeathReasonText(reason: DeathReason): string {
    switch (reason) {
      case "mafia": return fa.reasonMafia;
      case "nato": return fa.reasonNato;
      case "johnny": return fa.reasonJohnny;
      case "bomber": return fa.reasonBomber;
      case "sniper": return fa.reasonSniper;
      case "sniper_penalty": return fa.reasonSniperPenalty;
      case "gunner": return fa.reasonGunner;
      case "paranoid_alert": return fa.reasonParanoidAlert;
      case "lynch": return fa.reasonLynch;
      case "left": return fa.reasonLeft;
      case "joker": return fa.reasonJoker;
      case "host": return "حذف توسط میزبان";
      default: return reason;
    }
  }

  private async resolveNominationPhase(): Promise<void> {
    const game = this.game;
    if (!game || game.status !== "nomination") return;
    game.status = "resolving";
    game.phase = "resolving";
    await this.persist();

    const res = resolveVotes(game.players, game.votes, game.dayNumber, game.silencedUserIds);
    await this.persist(true);
    await addEvent(this.env.DB, game.id, "nomination_resolved", res);
    await this.group(fa.nominationResult(res, game.players));

    if (res.tied || !res.eliminated) { await this.group(fa.noOneOnTrial); await this.enterNight(); return; }

    // Check Joker win
    if (res.eliminated.independentRole === "joker") {
      game.players = applyDeaths(game.players, [{ userId: res.eliminated.userId, reason: "joker", revealedRole: res.eliminated.role!, revealedIndependentRole: "joker" }], "nomination", game.dayNumber);
      await this.mutePlayer(res.eliminated.userId);
      await this.persist(true);
      await this.group(fa.jokerWins(res.eliminated.displayName));
      await this.finish("independent");
      return;
    }

    await this.enterDefense(res.eliminated.userId);
  }

  private async resolveDefensePhase(): Promise<void> {
    const game = this.game;
    if (!game || game.status !== "defense") { await this.enterNight(); return; }
    if (game.accusedUserId) await this.removeTemporaryCourtAdmin(game.accusedUserId);
    await this.group(fa.defenseOver);
    await this.enterVerdict();
  }

  private async resolveVerdictPhase(): Promise<void> {
    const game = this.game;
    if (!game || game.status !== "verdict" || !game.accusedUserId) return;
    game.status = "resolving";
    game.phase = "resolving";
    await this.persist();

    const accusedId = game.accusedUserId;
    await this.removeTemporaryCourtAdmin(accusedId);
    const accused = findPlayer(game.players, accusedId);
    const res = resolveVerdict(game.verdictVotes, game.dayNumber);
    const stillAlive = accused?.status === "alive";

    if (accused && stillAlive && res.result === "guilty") {
      // Check Joker win
      if (accused.independentRole === "joker") {
        game.players = applyDeaths(game.players, [{ userId: accusedId, reason: "joker", revealedRole: accused.role!, revealedIndependentRole: "joker" }], "verdict", game.dayNumber);
        await this.mutePlayer(accusedId);
        await this.persist(true);
        await this.group(fa.jokerWins(accused.displayName));
        await this.finish("independent");
        return;
      }

      game.players = applyDeaths(game.players, [{ userId: accusedId, reason: "lynch", revealedRole: accused.role! }], "verdict", game.dayNumber);
      await this.mutePlayer(accusedId);
    }

    game.accusedUserId = null;
    game.silencedUserIds = [];
    await this.persist(true);
    await addEvent(this.env.DB, game.id, "verdict_resolved", res);
    if (accused && stillAlive) await this.group(fa.verdictResult(accused.displayName, accused.userId, res, accused.role!));

    let winner = checkWinner(game.players);
    if (winner) { await this.finish(winner); return; }
    const indieWinner = checkIndependentWinner(game.players, game);
    if (indieWinner) { await this.finish(indieWinner); return; }
    await this.enterNight();
  }

  private async finish(winner: Team): Promise<void> {
    const game = this.game;
    if (!game) return;
    if (game.temporaryCourtAdminUserId) await this.removeTemporaryCourtAdmin(game.temporaryCourtAdminUserId);
    game.status = "finished";
    game.phase = "finished";
    game.winner = winner;
    game.finishedAt = now();
    game.phaseEndsAt = null;
    game.alarmKind = "none";
    await this.ctx.storage.deleteAlarm();
    await this.restoreAllPermissions();
    await this.persist(true);
    await recordFinishStats(this.env.DB, game.players, winner);
    await addEvent(this.env.DB, game.id, "finished", { winner });
    const sent = await this.group(fa.gameOver(winner, game.players, game.independentRoleType));
    if (sent) await this.pin(sent.message_id);
  }

  private async applyNightAction(userId: number, nightNumber: number, action: NightActionType, targetId: number): Promise<{ text: string; alert: boolean }> {
    const game = this.game;
    if (!game || game.status !== "night" || game.nightNumber !== nightNumber) return { text: fa.staleAction, alert: true };
    const player = findPlayer(game.players, userId);
    if (!player) return { text: fa.actionForbidden, alert: true };
    if (player.status !== "alive") return { text: fa.deadCannotAct, alert: true };

    const allowed = nightActionTypesFor(player.role, player.independentRole);
    if (!allowed.includes(action)) return { text: fa.actionForbidden, alert: true };

    if (targetId > 0) {
      const target = findPlayer(game.players, targetId);
      if (!target) return { text: fa.targetNotInGame, alert: true };
      if (target.status !== "alive") return { text: "این بازیکن زنده نیست.", alert: true };

      if (action === "mafia_kill") {
        if (target.team === "mafia") return { text: fa.cannotKillTeammate, alert: true };
        if (target.team !== "town") return { text: fa.invalidTarget, alert: true };
      }
      if (action === "heal" && player.role === "lecter") {
        if (targetId === userId) return { text: fa.lecterCannotSelf, alert: true };
        if (target.team === "town") return { text: fa.lecterTownTarget, alert: true };
        if (target.team !== "mafia") return { text: fa.invalidTarget, alert: true };
      }
      if (action === "heal" && player.role === "doctor" && targetId === userId) {
        if (game.doctorSelfHealUsedBy.includes(userId)) return { text: "نجات خودتان را قبلاً استفاده کرده‌اید.", alert: true };
      }
      if (action === "investigate") {
        const prev = game.detectiveChecked[String(userId)] ?? [];
        if (prev.includes(targetId)) return { text: "این نفر را قبلاً استعلام کرده‌اید.", alert: true };
      }
      if (action === "snipe") {
        const left = game.sniperShotsLeft[String(userId)] ?? 0;
        if (left <= 0 && player.role === "sniper") return { text: "تیری برایتان نمانده.", alert: true };
      }
      if (action === "paranoid_alert") {
        if (game.paranoidAlertLeft <= 0) return { text: "دیگر امکان فعال کردن هوشیاری ندارید.", alert: true };
      }
      if (action === "escort_block") {
        if (targetId === userId) return { text: "نمی‌توانید خودتان را انتخاب کنید.", alert: true };
      }
    }

    game.nightActions = game.nightActions.filter((a) => !(a.actorId === userId && a.type === action && a.nightNumber === nightNumber));
    game.nightActions.push({ actorId: userId, type: action, targetId: targetId > 0 ? targetId : null, nightNumber, at: now() });
    await this.persist();
    await persistNightAction(this.env.DB, game.id, nightNumber, userId, action, targetId > 0 ? targetId : null);

    const label = targetId > 0 ? this.targetLabel(game, targetId, action, player) : "رد کردن";
    await this.pm(userId, fa.actionSaved(label));

    if (action === "mafia_kill" && targetId > 0) {
      const target = findPlayer(game.players, targetId);
      for (const m of livingMafia(game.players)) {
        if (m.userId === userId) continue;
        await this.pm(m.userId, fa.mafiaSawKill(player.displayName, target?.displayName || "؟"));
      }
    }

    if (hasFinishedAllNightActions(game)) {
      game.phaseEndsAt = Math.min(game.phaseEndsAt ?? now() + 3000, now() + 3000);
      await this.schedulePhaseTimers();
      await this.persist();
    }
    return { text: "ثبت شد", alert: false };
  }

  private async applyNatoGuess(userId: number, nightNumber: number, targetId: number): Promise<{ text: string; alert: boolean }> {
    const game = this.game;
    if (!game || game.status !== "night" || game.nightNumber !== nightNumber) return { text: fa.staleAction, alert: true };
    const player = findPlayer(game.players, userId);
    if (!player || player.status !== "alive" || player.role !== "nato") return { text: fa.actionForbidden, alert: true };
    if (game.natoChancesLeft <= 0) return { text: "تمام شانس‌های ناتو استفاده شده است.", alert: true };
    if (targetId <= 0) return { text: "یک بازیکن انتخاب کنید.", alert: true };
    const target = findPlayer(game.players, targetId);
    if (!target || target.status !== "alive") return { text: fa.targetNotInGame, alert: true };

    // Send role selection panel
    const townRoles = getTownRoles();
    const keyboard: InlineKeyboard = townRoles.map((roleId) => {
      const roleDef = ROLES[roleId];
      return [{ text: `${roleDef.emoji} ${roleDef.name}`, callback_data: `NR${nightNumber}:${targetId}:${roleId}` }];
    });

    await this.pm(userId, fa.natoSelectRole(target.displayName), chunk(keyboard, 2) as InlineKeyboard);
    return { text: `بازیکن <b>${target.displayName}</b> انتخاب شد. حالا نقش او را حدس بزنید.`, alert: false };
  }

  private async applyNatoRoleGuess(userId: number, nightNumber: number, targetId: number, roleId: RoleId): Promise<{ text: string; alert: boolean }> {
    const game = this.game;
    if (!game || game.status !== "night" || game.nightNumber !== nightNumber) return { text: fa.staleAction, alert: true };
    const player = findPlayer(game.players, userId);
    if (!player || player.status !== "alive" || player.role !== "nato") return { text: fa.actionForbidden, alert: true };

    // Update existing NATO guess action
    const existingAction = game.nightActions.find((a) => a.actorId === userId && a.type === "nato_guess" && a.nightNumber === nightNumber);
    if (existingAction) {
      existingAction.targetRole = roleId;
    } else {
      game.nightActions.push({ actorId: userId, type: "nato_guess", targetId, targetRole: roleId, nightNumber, at: now() });
    }

    await this.persist();
    await persistNightAction(this.env.DB, game.id, nightNumber, userId, "nato_guess", targetId, roleId);

    const target = findPlayer(game.players, targetId);
    const roleDef = ROLES[roleId];
    await this.pm(userId, fa.natoGuessMade(target?.displayName || "بازیکن", roleDef.name));
    return { text: "حدس شما ثبت شد", alert: false };
  }

  private async applyBomberExplode(userId: number, nightNumber: number): Promise<{ text: string; alert: boolean }> {
    const game = this.game;
    if (!game || game.status !== "night" || game.nightNumber !== nightNumber) return { text: fa.staleAction, alert: true };
    const player = findPlayer(game.players, userId);
    if (!player || player.status !== "alive" || player.independentRole !== "bomber") return { text: fa.actionForbidden, alert: true };

    if (game.bomberMarkedTargets.length === 0) return { text: "هنوز بازیکنی علامت‌گذاری نشده.", alert: true };

    game.nightActions = game.nightActions.filter((a) => !(a.actorId === userId && a.type === "bomber_explode" && a.nightNumber === nightNumber));
    game.nightActions.push({ actorId: userId, type: "bomber_explode", targetId: null, nightNumber, at: now() });
    await this.persist();
    await this.pm(userId, fa.bomberExplode(game.bomberMarkedTargets.length));
    
    // Check if all night actions are done and end night early if so
    if (hasFinishedAllNightActions(game)) {
      game.phaseEndsAt = Math.min(game.phaseEndsAt ?? now() + 3000, now() + 3000);
      await this.schedulePhaseTimers();
      await this.persist();
    }
    
    return { text: "ثبت شد", alert: false };
  }

  private async applyGunnerShot(userId: number, dayNumber: number, targetId: number): Promise<{ text: string; alert: boolean }> {
    const game = this.game;
    if (!game || game.status !== "day" || game.dayNumber !== dayNumber) return { text: fa.staleAction, alert: true };
    const player = findPlayer(game.players, userId);
    if (!player || player.status !== "alive" || player.role !== "gunner") return { text: fa.actionForbidden, alert: true };
    const guns = game.gunnerGuns[String(userId)] ?? [];
    if (guns.length === 0) return { text: "تفنگی برایتان نمانده.", alert: true };
    if (targetId <= 0) return { text: "یک بازیکن انتخاب کنید.", alert: true };
    if (targetId === userId) return { text: "نمی‌توانید خودتان را هدف بگیرید.", alert: true };
    const target = findPlayer(game.players, targetId);
    if (!target || target.status !== "alive") return { text: fa.targetNotInGame, alert: true };

    const gun = guns[0]!;
    game.gunnerGuns[String(userId)] = guns.slice(1);
    await this.persist();

    await this.group(fa.gunnerFired(player.displayName, target.displayName));

    if (gun === "black") {
      await this.group(fa.gunnerBlackMiss);
      await this.persist(true);
      return { text: "شلیک انجام شد", alert: false };
    }

    game.players = applyDeaths(game.players, [{ userId: target.userId, reason: "gunner", revealedRole: target.role!, revealedIndependentRole: target.independentRole ?? undefined }], "day", game.dayNumber);
    await this.mutePlayer(target.userId);
    await this.persist(true);
    await this.group(fa.playerDied(target.displayName, target.userId, target.role!, target.independentRole, fa.reasonGunner));

    let winner = checkWinner(game.players);
    if (winner) { await this.finish(winner); return { text: "شلیک انجام شد", alert: false }; }
    const indieWinner = checkIndependentWinner(game.players, game);
    if (indieWinner) { await this.finish(indieWinner); return { text: "شلیک انجام شد", alert: false }; }
    return { text: "شلیک انجام شد", alert: false };
  }

  private async applyNomination(userId: number, dayNumber: number, targetId: number): Promise<{ text: string; alert: boolean }> {
    const operation = this.nominationVoteQueue.then(() => this.applyNominationSerialized(userId, dayNumber, targetId));
    this.nominationVoteQueue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  private async applyNominationSerialized(userId: number, dayNumber: number, targetId: number): Promise<{ text: string; alert: boolean }> {
    const game = this.game;
    if (!game || game.status !== "nomination" || game.dayNumber !== dayNumber) return { text: fa.staleAction, alert: true };
    const player = findPlayer(game.players, userId);
    if (!player) return { text: fa.actionForbidden, alert: true };
    if (player.status !== "alive") return { text: fa.deadCannotAct, alert: true };
    if (game.silencedUserIds.includes(userId)) return { text: fa.silencedCannotVote, alert: true };
    if (targetId > 0) {
      const target = findPlayer(game.players, targetId);
      if (!target || target.status !== "alive" || target.userId === userId) return { text: "هدف رأی معتبر نیست.", alert: true };
    }

    const normalizedTargetId = targetId > 0 ? targetId : null;
    const currentVote = game.votes.find((v) => v.voterId === userId && v.dayNumber === dayNumber);
    if (currentVote && currentVote.targetId === normalizedTargetId) {
      return { text: normalizedTargetId === null ? "شما قبلاً رأی ممتنع ثبت کرده‌اید." : fa.duplicateNominationVote, alert: true };
    }

    const weight = voteWeight(player);
    game.votes = game.votes.filter((v) => !(v.voterId === userId && v.dayNumber === dayNumber));
    game.votes.push({ voterId: userId, targetId: normalizedTargetId, weight, dayNumber, at: now() });
    await this.persist();
    await persistVote(this.env.DB, game.id, dayNumber, userId, normalizedTargetId, weight);
    const label = targetId > 0 ? findPlayer(game.players, targetId)?.displayName || "بازیکن" : "ممتنع";
    await this.pm(userId, fa.nominationSaved(label));
    if (hasFinishedVotes(game)) {
      game.phaseEndsAt = Math.min(game.phaseEndsAt ?? now() + 2000, now() + 2000);
      await this.schedulePhaseTimers();
      await this.persist();
    }
    return { text: "رأی ثبت شد", alert: false };
  }

  private async applyVerdict(userId: number, dayNumber: number, guilty: boolean): Promise<{ text: string; alert: boolean }> {
    const game = this.game;
    if (!game || game.status !== "verdict" || game.dayNumber !== dayNumber || !game.accusedUserId) return { text: fa.staleAction, alert: true };
    const player = findPlayer(game.players, userId);
    if (!player) return { text: fa.actionForbidden, alert: true };
    if (player.status !== "alive") return { text: fa.deadCannotAct, alert: true };
    if (userId === game.accusedUserId) return { text: fa.actionForbidden, alert: true };
    if (game.silencedUserIds.includes(userId)) return { text: fa.silencedCannotVote, alert: true };
    const weight = voteWeight(player);
    game.verdictVotes = game.verdictVotes.filter((v) => !(v.voterId === userId && v.dayNumber === dayNumber));
    game.verdictVotes.push({ voterId: userId, guilty, weight, dayNumber, at: now() });
    await this.persist();
    await this.pm(userId, fa.verdictSaved(guilty));
    if (hasFinishedVerdict(game)) {
      game.phaseEndsAt = Math.min(game.phaseEndsAt ?? now() + 2000, now() + 2000);
      await this.schedulePhaseTimers();
      await this.persist();
    }
    return { text: "رأی ثبت شد", alert: false };
  }

  private async sendRoleCards(): Promise<void> {
    const game = this.game;
    if (!game) return;
    for (const p of game.players) {
      const mates = p.team === "mafia" ? game.players.filter((x) => x.team === "mafia") : [];
      await this.pm(p.userId, fa.roleCard(p, mates));
    }
  }

  private async sendNightPrompts(): Promise<void> {
    const game = this.game;
    if (!game) return;
    const secs = game.config.nightSeconds;

    for (const p of living(game.players)) {
      if (!p.role) continue;

      // Independent role prompts
      if (p.independentRole) {
        await this.sendIndependentRolePrompt(p, secs);
        continue;
      }

      // Town role prompts
      if (p.role === "paranoid") {
        await this.pm(p.userId, fa.paranoidPrompt(secs, game.paranoidAlertLeft), nightTargetKeyboard(game.players, p.userId, game.nightNumber, "paranoid_alert", { skipLabel: "⏭ رد کردن این شب" }));
        continue;
      }

      if (p.role === "mayor" || p.role === "invincible") {
        await this.pm(p.userId, fa.nightCitizenWait);
        continue;
      }

      if (p.role === "gunner") {
        const guns = shuffle<GunType>(["war", "black"]);
        game.gunnerGuns[String(p.userId)] = guns;
        await this.pm(p.userId, fa.gunnerReceivedGun);
        continue;
      }

      if (p.role === "lecter") {
        await this.pm(p.userId, fa.lecterPrompt(secs), nightTargetKeyboard(game.players, p.userId, game.nightNumber, "heal", { skipLabel: "⏭ امشب محافظت نمی‌کنم" }));
        continue;
      }

      if (p.role === "nato") {
        await this.pm(p.userId, fa.natoPrompt(secs, game.natoChancesLeft), natoTargetKeyboard(game.players, p.userId, game.nightNumber));
        continue;
      }

      const def = ROLES[p.role];
      if (def.nightAction) {
        await this.pm(p.userId, fa.nightPvPrompt(p.role, secs), nightKeyboardFor(game, p));
      } else {
        await this.pm(p.userId, fa.nightCitizenWait);
      }
    }
  }

  private async sendIndependentRolePrompt(p: Player, secs: number): Promise<void> {
    const game = this.game;
    if (!game) return;

    switch (p.independentRole) {
      case "johnny":
        await this.pm(p.userId, fa.johnnyPrompt(secs), nightTargetKeyboard(game.players, p.userId, game.nightNumber, "johnny_kill", { skipLabel: "⏭ امشب قتل نمی‌کنم" }));
        break;
      case "bomber":
        await this.pm(p.userId, fa.bomberPrompt(secs, game.bomberMarkedTargets), this.bomberKeyboard(game, p));
        break;
      case "lonewolf":
        await this.pm(p.userId, fa.lonewolfPrompt(secs), nightTargetKeyboard(game.players, p.userId, game.nightNumber, "investigate", { skipLabel: "⏭ رد کردن این شب" }));
        break;
      case "joker":
        await this.pm(p.userId, fa.jokerPrompt());
        break;
    }
  }

  private bomberKeyboard(game: GameState, player: Player): InlineKeyboard {
    const rows: InlineKeyboard = [];
    const markTargets = nightTargetsFor(game.players, player.userId, "bomber_mark");
    if (markTargets.length > 0) {
      rows.push(...chunk(markTargets.map(p => ({ text: `💣 علامت‌گذاری: ${p.displayName}`, callback_data: `N${game.nightNumber}:bm:${p.userId}` })), 2));
    }
    if (game.bomberMarkedTargets.length > 0) {
      rows.push([{ text: "💥 منفجر کردن بمب‌ها", callback_data: `N${game.nightNumber}:be:${player.userId}` }]);
    }
    rows.push([{ text: "⏭ رد کردن این شب", callback_data: `N${game.nightNumber}:bm:0` }]);
    return rows;
  }

  private async sendNominationPrompts(): Promise<void> {
    const game = this.game;
    if (!game) return;
    for (const p of living(game.players)) {
      if (game.silencedUserIds.includes(p.userId)) { await this.pm(p.userId, fa.silencedCannotVote); continue; }
      await this.pm(p.userId, fa.nominationPv(game.config.voteSeconds), nominationKeyboard(game.players, p.userId, game.dayNumber));
    }
  }

  private async sendVerdictPrompts(): Promise<void> {
    const game = this.game;
    if (!game || !game.accusedUserId) return;
    const accused = findPlayer(game.players, game.accusedUserId);
    const name = accused?.displayName || "متهم";
    for (const p of verdictVoters(game)) {
      await this.pm(p.userId, fa.verdictPrompt(name, game.config.voteSeconds), verdictKeyboard(game.dayNumber));
    }
  }

  private async sendReminders(): Promise<void> {
    const game = this.game;
    if (!game) return;
    if (game.status === "night") {
      for (const p of living(game.players)) {
        const needs = nightActionTypesFor(p.role, p.independentRole).filter((a) => a !== "snipe" && a !== "escort_block" && a !== "paranoid_alert" && a !== "nato_guess");
        const missing = needs.some((a) => !game.nightActions.some((x) => x.actorId === p.userId && x.type === a && x.nightNumber === game.nightNumber));
        if (missing && needs.length) await this.pm(p.userId, fa.nightRemind);
      }
    }
    if (game.status === "nomination") {
      for (const p of living(game.players)) {
        if (game.silencedUserIds.includes(p.userId)) continue;
        const voted = game.votes.some((v) => v.voterId === p.userId && v.dayNumber === game.dayNumber);
        if (!voted) await this.pm(p.userId, "⏱ چند ثانیه تا پایان معرفی متهم مانده.");
      }
    }
    if (game.status === "verdict") {
      for (const p of verdictVoters(game)) {
        const voted = game.verdictVotes.some((v) => v.voterId === p.userId && v.dayNumber === game.dayNumber);
        if (!voted) await this.pm(p.userId, "⏱ چند ثانیه تا پایان رأی‌گیری نهایی مانده.");
      }
    }
  }

  private async sendCountdown(): Promise<void> {
    const game = this.game;
    if (!game || game.status !== "day" || !game.phaseEndsAt) return;
    const remainMs = game.phaseEndsAt - now();
    const minutes = Math.round(remainMs / 60000);
    if (minutes >= 1) await this.group(fa.countdownRemain(minutes));
  }

  private async sendMyRole(userId: number): Promise<void> {
    const game = this.game;
    if (!game || !isActiveStatus(game.status)) { await this.tg.sendMessage(userId, fa.notPlaying); return; }
    const p = findPlayer(game.players, userId);
    if (!p) { await this.tg.sendMessage(userId, fa.notPlaying); return; }
    if (p.status !== "alive" && p.role) { await this.tg.sendMessage(userId, fa.myRoleDead(p.role, p.independentRole)); return; }
    const mates = p.team === "mafia" ? game.players.filter((x) => x.team === "mafia") : [];
    await this.tg.sendMessage(userId, fa.roleCard(p, mates));
  }

  private async eliminate(userId: number, reason: "left" | "host"): Promise<void> {
    const game = this.game;
    if (!game) return;
    const p = findPlayer(game.players, userId);
    if (!p || p.status !== "alive" || !p.role) return;
    game.players = applyDeaths(game.players, [{ userId, reason, revealedRole: p.role, revealedIndependentRole: p.independentRole }], game.phase, game.phase === "night" ? game.nightNumber : game.dayNumber);
    await this.mutePlayer(userId);
    await this.persist(true);
    await this.group(fa.playerDied(p.displayName, p.userId, p.role, p.independentRole, reason === "left" ? fa.reasonLeft : fa.reasonLynch));
    let winner = checkWinner(game.players);
    if (winner) await this.finish(winner);
  }

  private async promoteCourtAccused(userId: number): Promise<boolean> {
    const game = this.game;
    if (!game || !isActiveStatus(game.status) || game.status !== "defense" || game.phase !== "defense" || game.accusedUserId !== userId) return false;
    const accused = findPlayer(game.players, userId);
    if (!accused || accused.status !== "alive") return false;
    if (game.temporaryCourtAdminUserId !== null && game.temporaryCourtAdminUserId !== userId) return false;

    const membership = await this.tg.callSafe<TgChatMember>("getChatMember", { chat_id: game.chatId, user_id: userId });
    if (!membership.ok || membership.result.user.id !== userId || membership.result.status === "left" || membership.result.status === "kicked") return false;
    if (membership.result.status === "administrator" || membership.result.status === "creator") return true;

    game.temporaryCourtAdminUserId = userId;
    try { await this.persist(); } catch (err) { game.temporaryCourtAdminUserId = null; console.error("court admin marker persist failed", game.id, userId, err); return false; }

    let promoted = await this.tg.callSafe("promoteChatMember", { chat_id: game.chatId, user_id: userId, ...COURT_ADMIN_MINIMAL_RIGHTS });
    if (!promoted.ok) { await sleep(200); promoted = await this.tg.callSafe("promoteChatMember", { chat_id: game.chatId, user_id: userId, ...COURT_ADMIN_MINIMAL_RIGHTS }); }
    if (!promoted.ok) {
      if (game.temporaryCourtAdminUserId === userId) { game.temporaryCourtAdminUserId = null; try { await this.persist(); } catch (err) { console.error("court admin marker rollback failed", game.id, userId, err); } }
      console.error("court temporary promotion failed", game.id, userId, promoted.error.description);
      return false;
    }
    return true;
  }

  private async removeTemporaryCourtAdmin(expectedAccusedId: number): Promise<boolean> {
    const game = this.game;
    if (!game) return true;
    const temporaryId = game.temporaryCourtAdminUserId;
    if (temporaryId === null || temporaryId === undefined) return true;
    if (temporaryId !== expectedAccusedId) return false;
    if (game.accusedUserId !== null && game.accusedUserId !== temporaryId) return false;

    const membership = await this.tg.callSafe<TgChatMember>("getChatMember", { chat_id: game.chatId, user_id: temporaryId });
    if (membership.ok && (membership.result.status === "left" || membership.result.status === "kicked" || membership.result.status === "member" || membership.result.status === "restricted")) {
      game.temporaryCourtAdminUserId = null;
      try { await this.persist(); } catch (err) { console.error("court cleared-marker persist failed", game.id, temporaryId, err); }
      return true;
    }
    if (membership.ok && membership.result.status === "creator") { console.error("court demotion refused for chat creator", game.id, temporaryId); return false; }

    let demoted = await this.tg.callSafe("promoteChatMember", { chat_id: game.chatId, user_id: temporaryId, ...COURT_ADMIN_NO_RIGHTS });
    if (!demoted.ok) { await sleep(200); demoted = await this.tg.callSafe("promoteChatMember", { chat_id: game.chatId, user_id: temporaryId, ...COURT_ADMIN_NO_RIGHTS }); }
    if (!demoted.ok) { console.error("court temporary demotion failed", game.id, temporaryId, demoted.error.description); return false; }

    game.temporaryCourtAdminUserId = null;
    try { await this.persist(); } catch (err) { console.error("court demotion marker persist failed", game.id, temporaryId, err); }
    return true;
  }

  private async snapshotPermissions(): Promise<void> {
    const game = this.game;
    if (!game) return;
    const chat = await this.tg.callSafe<TgChat>("getChat", { chat_id: game.chatId });
    if (chat.ok && chat.result.permissions) game.savedDefaultPermissions = chat.result.permissions as ChatPermissions;
    else game.savedDefaultPermissions = { ...OPEN_PERMISSIONS };
    for (const p of game.players) {
      const member = await this.tg.callSafe<TgChatMember>("getChatMember", { chat_id: game.chatId, user_id: p.userId });
      if (member.ok) p.originalMember = memberToSaved(member.result);
    }
  }

  private async lockGroup(): Promise<void> {
    const game = this.game;
    if (!game) return;
    await this.tg.callSafe("setChatPermissions", { chat_id: game.chatId, permissions: LOCKED_PERMISSIONS, use_independent_chat_permissions: true });
  }

  private async unlockForDay(): Promise<void> {
    const game = this.game;
    if (!game) return;
    await this.tg.callSafe("setChatPermissions", { chat_id: game.chatId, permissions: DAY_PERMISSIONS, use_independent_chat_permissions: true });
    for (const p of game.players) {
      if (p.originalMember?.isAdmin) continue;
      if (p.status === "alive" && !game.silencedUserIds.includes(p.userId)) {
        await this.tg.callSafe("restrictChatMember", { chat_id: game.chatId, user_id: p.userId, permissions: DAY_PERMISSIONS, use_independent_chat_permissions: true });
      } else {
        await this.mutePlayer(p.userId);
      }
    }
  }

  private async relockAllPlayers(): Promise<void> {
    const game = this.game;
    if (!game) return;
    for (const p of game.players) {
      if (p.originalMember?.isAdmin) continue;
      await this.tg.callSafe("restrictChatMember", { chat_id: game.chatId, user_id: p.userId, permissions: LOCKED_PERMISSIONS, use_independent_chat_permissions: true });
    }
  }

  private async mutePlayer(userId: number): Promise<void> {
    const game = this.game;
    if (!game) return;
    const p = findPlayer(game.players, userId);
    if (p?.originalMember?.isAdmin) { await this.group(fa.cannotMuteAdmin(p.displayName)); return; }
    const res = await this.tg.callSafe("restrictChatMember", { chat_id: game.chatId, user_id: userId, permissions: LOCKED_PERMISSIONS, use_independent_chat_permissions: true });
    if (!res.ok && res.error.description.toLowerCase().includes("admin")) await this.group(fa.cannotMuteAdmin(p?.displayName || String(userId)));
  }

  private async restoreAllPermissions(): Promise<void> {
    const game = this.game;
    if (!game) return;
    const defaults = game.savedDefaultPermissions ?? OPEN_PERMISSIONS;
    await this.tg.callSafe("setChatPermissions", { chat_id: game.chatId, permissions: defaults, use_independent_chat_permissions: true });
    for (const p of game.players) {
      if (p.originalMember?.isAdmin) continue;
      // Restore each player's own pre-game permissions (e.g. if they were individually
      // restricted before the game started) instead of always falling back to the chat's
      // default permissions for everyone.
      const perPlayerPermissions = p.originalMember?.permissions ?? defaults;
      await this.tg.callSafe("restrictChatMember", { chat_id: game.chatId, user_id: p.userId, permissions: { ...OPEN_PERMISSIONS, ...perPlayerPermissions }, use_independent_chat_permissions: true });
    }
  }

  private async refreshLobbyMessage(): Promise<void> {
    const game = this.game;
    if (!game || game.status !== "lobby" || !game.lastGroupMessageId) return;
    const extra = fa.lobbyCreated(mention(game.hostId, findPlayer(game.players, game.hostId)?.displayName || "میزبان"));
    const text = `${extra}\n\n${fa.lobbyBody(game)}`;
    await this.tg.callSafe("editMessageText", {
      chat_id: game.chatId, message_id: game.lastGroupMessageId, text, parse_mode: "HTML",
      disable_web_page_preview: true, reply_markup: { inline_keyboard: lobbyKeyboard(game.botUsername, game.chatId) },
    });
  }

  private async group(text: string, extra?: { reply_markup?: { inline_keyboard: InlineKeyboard } }) {
    const game = this.game;
    if (!game) return null;
    const res = await this.tg.callSafe<TgMessage>("sendMessage", {
      chat_id: game.chatId, text, parse_mode: "HTML", disable_web_page_preview: true, reply_markup: extra?.reply_markup,
    });
    if (!res.ok) { console.error("group send failed", res.error); return null; }
    game.lastGroupMessageId = res.result.message_id;
    return res.result;
  }

  private async pm(userId: number, text: string, keyboard?: InlineKeyboard): Promise<void> {
    const res = await this.tg.callSafe("sendMessage", {
      chat_id: userId, text, parse_mode: "HTML", disable_web_page_preview: true,
      reply_markup: keyboard ? { inline_keyboard: keyboard } : undefined,
    });
    if (!res.ok) console.error("pm failed", userId, res.error.description);
  }

  private async pin(messageId: number): Promise<void> {
    const game = this.game;
    if (!game) return;
    await this.tg.callSafe("pinChatMessage", { chat_id: game.chatId, message_id: messageId, disable_notification: true });
    game.pinnedMessageId = messageId;
  }

  private async unpin(): Promise<void> {
    const game = this.game;
    if (!game?.pinnedMessageId) return;
    await this.tg.callSafe("unpinChatMessage", { chat_id: game.chatId, message_id: game.pinnedMessageId });
  }

  private async persist(syncDb = false): Promise<void> {
    if (!this.game) return;
    this.game.updatedAt = now();
    await this.ctx.storage.put("state", this.game);
    if (syncDb) { await persistGame(this.env.DB, this.game); await persistPlayers(this.env.DB, this.game.id, this.game.players); }
  }

  private async scheduleAlarm(at: number): Promise<void> {
    await this.ctx.storage.setAlarm(at);
  }

  private async schedulePhaseTimers(): Promise<void> {
    const game = this.game;
    if (!game?.phaseEndsAt) { await this.ctx.storage.deleteAlarm(); return; }
    const t = now();
    const candidates: { at: number; kind: AlarmKind }[] = [{ at: game.phaseEndsAt, kind: "phase_end" }];
    if (game.reminderAt) candidates.push({ at: game.reminderAt, kind: "reminder" });
    if (game.status === "day" && game.nextTickAt) candidates.push({ at: game.nextTickAt, kind: "countdown" });
    const future = candidates.filter((c) => c.at > t + 500).sort((a, b) => a.at - b.at);
    const next = future[0] ?? { at: game.phaseEndsAt, kind: "phase_end" as AlarmKind };
    game.alarmKind = next.kind;
    await this.scheduleAlarm(Math.max(t + 200, next.at));
  }

  private async ensureAlarm(): Promise<void> {
    const game = this.game;
    if (!game || !isActiveStatus(game.status)) return;
    const existing = await this.ctx.storage.getAlarm();
    if (existing) return;
    if (game.phaseEndsAt && game.phaseEndsAt <= now()) { game.alarmKind = "phase_end"; await this.ctx.storage.setAlarm(now() + 250); return; }
    await this.schedulePhaseTimers();
  }

  private async ensureBotIdentity(): Promise<{ id: number; username: string } | null> {
    if (this.game?.botUsername && this.game.botId) return { id: this.game.botId, username: this.game.botUsername };
    const me = await this.tg.callSafe<TgUser>("getMe");
    if (!me.ok || !me.result.username) return null;
    if (this.game) { this.game.botUsername = me.result.username; this.game.botId = me.result.id; }
    return { id: me.result.id, username: me.result.username };
  }

  private async assertBotAdmin(chatId: number): Promise<{ ok: true } | { ok: false; message: string }> {
    const me = await this.ensureBotIdentity();
    if (!me) return { ok: false, message: fa.needAdmin };
    const member = await this.tg.callSafe<TgChatMember>("getChatMember", { chat_id: chatId, user_id: me.id });
    if (!member.ok || member.result.status !== "administrator" || !member.result.can_restrict_members) return { ok: false, message: fa.needAdmin };
    return { ok: true };
  }

  private async isHostOrAdmin(userId: number): Promise<boolean> {
    const game = this.game;
    if (!game) return false;
    if (userId === game.hostId) return true;
    const member = await this.tg.callSafe<TgChatMember>("getChatMember", { chat_id: game.chatId, user_id: userId });
    if (!member.ok) return false;
    return member.result.status === "administrator" || member.result.status === "creator";
  }

  // Rebuilds in-memory GameState from D1 after the Durable Object's own storage was lost
  // (e.g. DO storage reset/eviction). D1 doesn't persist every ephemeral counter (verdict
  // votes, ammo counts, shield hits, gun inventories, etc. are never written there), so
  // this is necessarily best-effort: it restores identity, players, roles/teams, phase
  // timing, night actions and nomination votes exactly, and falls back to safe defaults
  // for the handful of fields D1 has no record of, rather than silently doing nothing and
  // leaving the group's game unrecoverable.
  private async recoverFromD1(chatId: number): Promise<void> {
    const db = this.env.DB;
    const active = await findActiveGameForChat(db, chatId);
    if (!active) return;

    const gameRow = await db.prepare(
      `SELECT * FROM games WHERE id = ?`,
    ).bind(active.id).first<{
      id: string; chat_id: number; chat_title: string | null; host_id: number; status: string;
      phase: string | null; day_number: number; night_number: number; winner: string | null;
      config_json: string | null; saved_default_permissions: string | null;
      phase_ends_at: number | null; started_at: number | null; finished_at: number | null;
      created_at: number; updated_at: number;
    }>();
    if (!gameRow) return;

    type PlayerRow = {
      user_id: number; username: string | null; first_name: string; display_name: string;
      role: string | null; team: string | null; independent_role: string | null; status: string;
      death_reason: string | null; death_phase: string | null; death_round: number | null;
      original_member_json: string | null; joined_at: number;
    };
    const playerRows = (await db.prepare(
      `SELECT * FROM game_players WHERE game_id = ? ORDER BY joined_at ASC`,
    ).bind(active.id).all<PlayerRow>()).results ?? [];

    const players: Player[] = playerRows.map((r: PlayerRow) => ({
      userId: r.user_id,
      username: r.username,
      firstName: r.first_name,
      displayName: r.display_name,
      role: (r.role as RoleId | null) ?? null,
      team: (r.team as Team | null) ?? null,
      independentRole: (r.independent_role as IndependentRoleId | null) ?? null,
      status: r.status as PlayerStatus,
      deathReason: (r.death_reason as DeathReason | null) ?? undefined,
      deathPhase: (r.death_phase as Phase | null) ?? undefined,
      deathRound: r.death_round ?? undefined,
      originalMember: r.original_member_json ? (JSON.parse(r.original_member_json) as SavedMember) : null,
      joinedAt: r.joined_at,
    }));

    type NightActionRow = {
      night_number: number; actor_id: number; action_type: string; target_id: number | null;
      target_role: string | null; created_at: number;
    };
    const nightActionRows = (await db.prepare(
      `SELECT night_number, actor_id, action_type, target_id, target_role, created_at FROM night_actions WHERE game_id = ? ORDER BY created_at ASC`,
    ).bind(active.id).all<NightActionRow>()).results ?? [];

    const nightActions: NightAction[] = nightActionRows.map((r: NightActionRow) => ({
      actorId: r.actor_id,
      type: r.action_type as NightActionType,
      targetId: r.target_id,
      targetRole: (r.target_role as RoleId | null) ?? null,
      nightNumber: r.night_number,
      at: r.created_at,
    }));

    type VoteRow = { day_number: number; voter_id: number; target_id: number | null; weight: number; created_at: number };
    const voteRows = (await db.prepare(
      `SELECT day_number, voter_id, target_id, weight, created_at FROM votes WHERE game_id = ? ORDER BY created_at ASC`,
    ).bind(active.id).all<VoteRow>()).results ?? [];

    const votes: Vote[] = voteRows.map((r: VoteRow) => ({
      voterId: r.voter_id,
      targetId: r.target_id,
      weight: r.weight,
      dayNumber: r.day_number,
      at: r.created_at,
    }));

    // Best-effort replay of bomber marks/explosions so a mid-game recovery doesn't lose
    // track of who is currently wired to blow up.
    const bomberMarkedTargets: number[] = [];
    for (const a of nightActions) {
      if (a.type === "bomber_mark" && a.targetId && a.targetId > 0) {
        const bomber = players.find((p) => p.userId === a.actorId);
        if (bomber?.independentRole === "bomber" && !bomberMarkedTargets.includes(a.targetId)) {
          bomberMarkedTargets.push(a.targetId);
        }
      } else if (a.type === "bomber_explode") {
        const bomber = players.find((p) => p.userId === a.actorId);
        if (bomber?.independentRole === "bomber") bomberMarkedTargets.length = 0;
      }
    }

    // Best-effort replay of who the detective/lonewolf has already investigated.
    const detectiveChecked: Record<string, number[]> = {};
    for (const a of nightActions) {
      if (a.type === "investigate" && a.targetId && a.targetId > 0) {
        const list = detectiveChecked[String(a.actorId)] ?? [];
        if (!list.includes(a.targetId)) list.push(a.targetId);
        detectiveChecked[String(a.actorId)] = list;
      }
    }

    const config: GameConfig = gameRow.config_json ? { ...DEFAULT_CONFIG, ...JSON.parse(gameRow.config_json) } : { ...DEFAULT_CONFIG };
    const savedDefaultPermissions = gameRow.saved_default_permissions ? (JSON.parse(gameRow.saved_default_permissions) as ChatPermissions) : null;
    const independentRoleType = players.find((p) => p.independentRole)?.independentRole ?? null;

    this.game = {
      id: gameRow.id,
      chatId: gameRow.chat_id,
      chatTitle: gameRow.chat_title || "گروه",
      hostId: gameRow.host_id,
      status: gameRow.status as GameStatus,
      phase: (gameRow.phase as Phase) ?? "lobby",
      dayNumber: gameRow.day_number,
      nightNumber: gameRow.night_number,
      phaseEndsAt: gameRow.phase_ends_at,
      dayPhaseMaxEndsAt: gameRow.phase === "day" && gameRow.phase_ends_at
        ? gameRow.phase_ends_at + config.daySecondsMax * 1000
        : null,
      reminderAt: null,
      nextTickAt: null,
      alarmKind: "phase_end",
      players,
      nightActions,
      votes,
      verdictVotes: [], // not persisted to D1; unavoidable gap on cold recovery
      accusedUserId: null,
      temporaryCourtAdminUserId: null,
      silencedUserIds: [],
      blockedUserIds: [],
      escortBlockedUserIds: [],
      doctorSelfHealUsedBy: [],
      sniperShotsLeft: {},
      detectiveChecked,
      natoChancesLeft: 3,
      paranoidAlertLeft: 2,
      bomberMarkedTargets,
      invincibleShieldHits: {},
      gunnerGuns: {},
      independentRoleType,
      savedDefaultPermissions,
      lastGroupMessageId: null,
      pinnedMessageId: null,
      winner: (gameRow.winner as Team | null) ?? null,
      botUsername: null,
      botId: null,
      config,
      createdAt: gameRow.created_at,
      updatedAt: gameRow.updated_at,
      startedAt: gameRow.started_at,
      finishedAt: gameRow.finished_at,
    };

    await this.persist();
    if (isActiveStatus(this.game.status)) await this.ensureAlarm();
  }

  private targetLabel(game: GameState, targetId: number, action: NightActionType, actor?: Player | null): string {
    const name = findPlayer(game.players, targetId)?.displayName || "بازیکن";
    switch (action) {
      case "mafia_kill": return `قتل ${name}`;
      case "heal": return actor?.role === "lecter" ? `محافظت از ${name}` : `نجات ${name}`;
      case "investigate": return `استعلام ${name}`;
      case "snipe": return `شلیک به ${name}`;
      case "escort_block": return `مسدود کردن ${name}`;
      case "nato_guess": return `حدس نقش ${name}`;
      case "paranoid_alert": return `هوشیاری`;
      case "johnny_kill": return `قتل ${name}`;
      case "bomber_mark": return `علامت‌گذاری ${name}`;
      default: return name;
    }
  }
}


// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function mapAction(raw: string): NightActionType {
  switch (raw) {
    case "k": case "mafia_kill": return "mafia_kill";
    case "h": case "heal": return "heal";
    case "i": case "investigate": return "investigate";
    case "p": case "snipe": return "snipe";
    case "e": case "escort_block": return "escort_block";
    case "n": case "nato_guess": return "nato_guess";
    case "pa": case "paranoid_alert": return "paranoid_alert";
    case "j": case "johnny_kill": return "johnny_kill";
    case "bm": case "bomber_mark": return "bomber_mark";
    case "be": case "bomber_explode": return "bomber_explode";
    default: return raw as NightActionType;
  }
}

function nightKeyboardFor(game: GameState, player: Player): InlineKeyboard | undefined {
  if (!player.role) return undefined;
  const n = game.nightNumber;
  switch (player.role) {
    case "godfather": return nightTargetKeyboard(game.players, player.userId, n, "mafia_kill");
    case "detective": {
      const checked = new Set(game.detectiveChecked[String(player.userId)] ?? []);
      // Remove already-investigated players from the target list entirely
      const candidates = game.players.filter((p) => !checked.has(p.userId));
      return nightTargetKeyboard(candidates, player.userId, n, "investigate");
    }
    case "doctor": return nightTargetKeyboard(game.players, player.userId, n, "heal", { includeSelf: true, skipLabel: "⏭ امشب نجات نمی‌دهم" });
    case "sniper": return nightTargetKeyboard(game.players, player.userId, n, "snipe", { skipLabel: "⏭ امشب شلیک نمی‌کنم" });
    case "escort": return nightTargetKeyboard(game.players, player.userId, n, "escort_block", { skipLabel: "⏭ امشب مسدود نمی‌کنم" });
    default: return undefined;
  }
}

function inferChatId(update: TgUpdate): number | null {
  if (update.message && update.message.chat.type !== "private") return update.message.chat.id;
  if (update.callback_query?.message && update.callback_query.message.chat.type !== "private") return update.callback_query.message.chat.id;
  if (update.my_chat_member) return update.my_chat_member.chat.id;
  if (update.chat_member) return update.chat_member.chat.id;
  return null;
}


// =============================================================================
// EXPORTS
// =============================================================================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return json({ ok: true, service: "telegram-mafia-bot", ts: Date.now() });
    }
    if (request.method === "GET" && url.pathname === "/setup") return setup(url, env);
    if (request.method === "POST" && url.pathname === "/webhook") {
      const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
      if (!env.WEBHOOK_SECRET || secret !== env.WEBHOOK_SECRET) return new Response("unauthorized", { status: 401 });
      let update: TgUpdate;
      try { update = (await request.json()) as TgUpdate; } catch { return new Response("bad json", { status: 400 }); }
      ctx.waitUntil((async () => { await ensureSchema(env.DB); await dispatch(update, env); })());
      return json({ ok: true });
    }
    return new Response("not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

async function dispatch(update: TgUpdate, env: Env): Promise<void> {
  try {
    const groupId = resolveGroupChatId(update);
    if (groupId !== null) { await callRoom(env, groupId, update); return; }
    await routePrivate(update, env);
  } catch (err) { console.error("dispatch", err); }
}

function resolveGroupChatId(update: TgUpdate): number | null {
  const msg = update.message;
  if (msg && (msg.chat.type === "group" || msg.chat.type === "supergroup")) return msg.chat.id;
  if (update.callback_query?.message) { const chat = update.callback_query.message.chat; if (chat.type === "group" || chat.type === "supergroup") return chat.id; }
  if (update.my_chat_member && update.my_chat_member.chat.type !== "private") return update.my_chat_member.chat.id;
  if (update.chat_member) return update.chat_member.chat.id;
  return null;
}

async function callRoom(env: Env, chatId: number, update: TgUpdate): Promise<void> {
  const stub = env.GAME_ROOM.get(env.GAME_ROOM.idFromName(`chat:${chatId}`));
  await (stub as DurableObjectStub<GameRoom>).handleUpdate(update);
}

async function routePrivate(update: TgUpdate, env: Env): Promise<void> {
  const msg = update.message;
  const cq = update.callback_query;
  const from = msg?.from ?? cq?.from;
  if (!from) return;
  const tg = new Telegram(env.BOT_TOKEN);
  await upsertUser(env.DB, from, true);
  await markStarted(env.DB, from.id);
  const text = msg?.text ?? "";
  const parsed = text ? parseCommand(text) : null;
  let targetChat: number | null = null;
  if (parsed?.cmd === "start" && parsed.args.startsWith("join_")) { const n = Number(parsed.args.slice(5)); if (Number.isFinite(n)) targetChat = n; }
  if (targetChat === null) { const active = await findActiveGameForUser(env.DB, from.id); if (active) targetChat = active.chat_id; }
  if (targetChat !== null) { await callRoom(env, targetChat, update); return; }
  if (cq) { await tg.answerCallbackQuery(cq.id, "بازی فعالی پیدا نشد.", true); return; }
  if (parsed?.cmd === "help") { await tg.sendMessage(from.id, fa.helpPrivate); return; }
  if (parsed?.cmd === "myrole") { await tg.sendMessage(from.id, fa.notPlaying); return; }
  await tg.sendMessage(from.id, fa.privateStart);
}

async function setup(url: URL, env: Env): Promise<Response> {
  const key = url.searchParams.get("key");
  if (!env.WEBHOOK_SECRET || key !== env.WEBHOOK_SECRET) return new Response("unauthorized", { status: 401 });
  await ensureSchema(env.DB);
  const tg = new Telegram(env.BOT_TOKEN);
  const webhook = `${url.origin}/webhook`;
  await tg.setWebhook(webhook, env.WEBHOOK_SECRET);
  await tg.setMyCommands([
    { command: "new", description: "ساخت لابی مافیا" }, { command: "join", description: "ورود به لابی" },
    { command: "startgame", description: "شروع بازی" }, { command: "cancel", description: "لغو بازی" },
    { command: "status", description: "وضعیت بازی" }, { command: "help", description: "راهنما" },
  ], { type: "all_group_chats" });
  await tg.setMyCommands([{ command: "start", description: "فعال‌سازی بات" }, { command: "myrole", description: "مشاهده نقش" }, { command: "help", description: "راهنما" }], { type: "all_private_chats" });
  const me = await tg.getMe();
  const info = await tg.getWebhookInfo();
  return json({ ok: true, webhook, bot: me, webhookInfo: info });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}
