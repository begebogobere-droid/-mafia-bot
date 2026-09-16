// =============================================================================
// CARD SHOP SYSTEM ("حرکت آخر") — separate module, wire into index.ts
// =============================================================================
//
// Integration points (in index.ts):
//   1. D1 migration: run CARD_SCHEMA_SQL alongside SCHEMA_SQL / SCHEMA_ADDITIONS
//   2. Player interface: add `activeCards?: CardId[]` (max 2, chosen pre-lobby)
//   3. joinFromPrivate / addPlayer: before adding to lobby, if user has no
//      chosen cards for this session, show shop keyboard first (see
//      openShopKeyboard). Selection is written to `pending_card_selection`
//      and copied onto Player.activeCards at addPlayer time. Once
//      game.players contains them (i.e. inside the lobby), block further
//      shop callbacks — check `isPlayerInAnyLobby` before answering shop CBs.
//   4. resolveVerdictPhase (line ~6205-6222 in index.ts): call
//      triggerLastMoveCard(game, accused, tally-info) BEFORE applyDeaths
//      mutates status, since some cards (طلسم انتقال) redirect who dies.
//      See INTEGRATION SNIPPET at bottom of this file.

export type CardSide = "town" | "mafia" | "independent";

export type CardId =
  | "voter_reveal" // town: افشاگر رأی‌دهندگان
  | "vote_from_grave" // town: رأی از گور
  | "revenge_on_voter" // mafia: انتقام از رأی‌دهنده
  | "fake_death_reveal" // mafia: فریب پسا-مرگ
  | "forced_silence" // mafia: سکوت اجباری
  | "vote_inversion" // independent: وارونگی رأی
  | "execution_transfer" // independent: طلسم انتقال
  | "hostage_taking"; // independent: گروگان‌گیری

export interface CardDef {
  id: CardId;
  side: CardSide;
  name: string;
  description: string;
  price: number; // in coins, ~1:10 ratio per user's spec
}

export const CARD_CATALOG: CardDef[] = [
  {
    id: "voter_reveal",
    side: "town",
    name: "افشاگر رأی‌دهندگان",
    description: "بعد از اعدام شدنت، هویت (نه نقش) کسایی که بهت رأی گناه دادن فاش می‌شه.",
    price: 10,
  },
  {
    id: "vote_from_grave",
    side: "town",
    name: "رأی از گور",
    description: "بعد از اعدام شدنت، یک بار دیگه (فردا) می‌تونی رأی بدی.",
    price: 15,
  },
  {
    id: "revenge_on_voter",
    side: "mafia",
    name: "انتقام از رأی‌دهنده",
    description: "بعد از اعدامت، یکی از کسایی که بهت رأی گناه داد هم می‌میره.",
    price: 20,
  },
  {
    id: "fake_death_reveal",
    side: "mafia",
    name: "فریب پسا-مرگ",
    description: "بعد از اعدامت، به‌جای نقش واقعیت، یه نقش قلابی نشون داده می‌شه.",
    price: 15,
  },
  {
    id: "forced_silence",
    side: "mafia",
    name: "سکوت اجباری",
    description: "بعد از اعدامت، یکی از رأی‌دهنده‌ها فردا نمی‌تونه رأی بده یا پیام بده.",
    price: 15,
  },
  {
    id: "vote_inversion",
    side: "independent",
    name: "وارونگی رأی",
    description: "نتیجه‌ی رأی‌گیری همون دور برعکس می‌شه؛ نفر دوم پرأی‌ترین به‌جات اعدام می‌شه.",
    price: 25,
  },
  {
    id: "execution_transfer",
    side: "independent",
    name: "طلسم انتقال",
    description: "اعدام به یکی از کسایی که بهت رأی گناه داد منتقل می‌شه؛ خودت زنده می‌مونی.",
    price: 25,
  },
  {
    id: "hostage_taking",
    side: "independent",
    name: "گروگان‌گیری",
    description: "یکی از رأی‌دهنده‌ها رو با خودت به یک روز غیبت می‌بری (نمی‌میره، فقط فردا از بازی خارجه).",
    price: 20,
  },
];

export function cardById(id: CardId): CardDef | undefined {
  return CARD_CATALOG.find((c) => c.id === id);
}

export function cardsForSide(side: CardSide): CardDef[] {
  return CARD_CATALOG.filter((c) => c.side === side);
}

// -----------------------------------------------------------------------------
// D1 SCHEMA ADDITIONS
// -----------------------------------------------------------------------------

export const CARD_SCHEMA_SQL = `
ALTER TABLE users ADD COLUMN coins INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS pending_card_selection (
  user_id INTEGER PRIMARY KEY,
  card_ids TEXT NOT NULL,
  selected_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS card_purchase_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  card_id TEXT NOT NULL,
  price INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
`;
// NOTE: ALTER TABLE ADD COLUMN fails if the column already exists — wrap in
// the same PRAGMA table_info() auto-migration pattern already used for
// recoverFromD1, don't just run this blind on an existing DB.

// -----------------------------------------------------------------------------
// COIN AWARDS (call at game finish, alongside existing games_won/games_lost bump)
// -----------------------------------------------------------------------------

export function coinsForResult(team: "mafia" | "town" | "independent", won: boolean): number {
  if (team === "independent") return won ? 2 : 0.5;
  return won ? 1 : 0;
}

// -----------------------------------------------------------------------------
// TRIGGER: called from resolveVerdictPhase, BEFORE applyDeaths, only for
// lynch (day-vote) eliminations — never on night deaths.
// -----------------------------------------------------------------------------

export interface LastMoveContext {
  accusedId: number;
  guiltyVoterIds: number[]; // userIds who voted guilty this trial
  dayNumber: number;
}

export type LastMoveOutcome =
  | { kind: "none" }
  | { kind: "redirect_execution"; newTargetId: number } // execution_transfer
  | { kind: "reveal_voters"; voterIds: number[] } // voter_reveal
  | { kind: "extra_vote_next_round"; userId: number } // vote_from_grave
  | { kind: "kill_extra"; targetId: number } // revenge_on_voter
  | { kind: "fake_role_reveal" } // fake_death_reveal
  | { kind: "silence_next_day"; targetId: number } // forced_silence
  | { kind: "invert_vote_result" } // vote_inversion — flips guilty/innocent tally; if that flips the result to innocent, accused survives
  | { kind: "hostage"; targetId: number }; // hostage_taking

// Caller passes in the accused player's activeCards + ctx; picks ONE
// outcome (only 1 card can be "used" per death per current spec — if a
// player holds 2 cards, decide separately whether both fire or player
// chooses at time of death; not yet decided by user, default here: first
// matching card in activeCards fires).
export function resolveLastMoveCard(
  activeCards: CardId[] | undefined,
  ctx: LastMoveContext,
): LastMoveOutcome {
  if (!activeCards || activeCards.length === 0) return { kind: "none" };

  for (const cardId of activeCards) {
    switch (cardId) {
      case "voter_reveal":
        return { kind: "reveal_voters", voterIds: ctx.guiltyVoterIds };
      case "vote_from_grave":
        return { kind: "extra_vote_next_round", userId: ctx.accusedId };
      case "revenge_on_voter": {
        const target = pickRandom(ctx.guiltyVoterIds);
        if (target) return { kind: "kill_extra", targetId: target };
        break;
      }
      case "fake_death_reveal":
        return { kind: "fake_role_reveal" };
      case "forced_silence": {
        const target = pickRandom(ctx.guiltyVoterIds);
        if (target) return { kind: "silence_next_day", targetId: target };
        break;
      }
      case "vote_inversion":
        return { kind: "invert_vote_result" };
      case "execution_transfer": {
        const target = pickRandom(ctx.guiltyVoterIds);
        if (target) return { kind: "redirect_execution", newTargetId: target };
        break;
      }
      case "hostage_taking": {
        const target = pickRandom(ctx.guiltyVoterIds);
        if (target) return { kind: "hostage", targetId: target };
        break;
      }
    }
  }
  return { kind: "none" };
}

function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

// =============================================================================
// INTEGRATION SNIPPET — paste into index.ts resolveVerdictPhase, replacing
// the block starting at `if (accused && stillAlive && res.result === "guilty")`
// =============================================================================
//
// if (accused && stillAlive && res.result === "guilty") {
//   const guiltyVoterIds = game.verdictVotes
//     .filter((v) => v.dayNumber === game.dayNumber && v.guilty)
//     .map((v) => v.voterId);
//   const outcome = resolveLastMoveCard(accused.activeCards, {
//     accusedId: accusedId, guiltyVoterIds, dayNumber: game.dayNumber,
//   });
//
//   let finalAccusedId = accusedId;
//   if (outcome.kind === "redirect_execution") {
//     finalAccusedId = outcome.newTargetId; // execution moves to this player
//   }
//   // ...joker-win check and applyDeaths continue using finalAccusedId
//   // instead of accusedId. Then, after applyDeaths, branch on outcome.kind
//   // for the remaining effects (reveal_voters -> announce voter names,
//   // extra_vote_next_round -> flag on GameState for next round's vote
//   // eligibility, kill_extra -> second applyDeaths call with reason
//   // "card_revenge", silence_next_day -> push to game.silencedUserIds,
//   // hostage -> new "sat_out" player status for 1 round, fake_role_reveal
//   // -> pass a decoy role into fa.verdictResult instead of accused.role,
//   // invert_vote_result -> flips tally.guilty/tally.innocent BEFORE the
//   // guilty-check runs, since it decides whether execution happens at
//   // all (not an after-the-fact effect like the others above). If the
//   // flipped result is "innocent", skip applyDeaths entirely — accused
//   // survives and returns to play — and announce the flipped tally.
//   //
//   //   let effectiveRes = res;
//   //   if (outcome.kind === "invert_vote_result") {
//   //     effectiveRes = { guilty: res.innocent, innocent: res.guilty,
//   //       result: res.innocent > res.guilty ? "guilty" : "innocent" };
//   //   }
//   //   if (accused && stillAlive && effectiveRes.result === "guilty") { ... }
// }
