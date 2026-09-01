import { DurableObject } from "cloudflare:workers";


const MINIAPP_HTML = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<title>𝑴𝑨𝑭𝑰𝑨</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<style>
/* =====================================================================
   MAFIA MINI APP — Design Tokens & Styling
   ===================================================================== */
@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

:root{
  --bg:#0a0b0d; --bg-2:#0d0f12;
  --panel:rgba(255,255,255,0.045); --panel-strong:rgba(255,255,255,0.075);
  --panel-border:rgba(255,255,255,0.09); --panel-border-strong:rgba(255,255,255,0.16);
  --ink:#eef0f3; --ink-dim:#98a0ac; --ink-faint:#5b6270;
  --blood:#7d2430; --blood-bright:#b23a44; --blood-glow:rgba(178,58,68,0.35);
  --gold:#b8934c; --gold-dim:#8a713d; --good:#3f8f6f;
  --radius-lg:20px; --radius-md:14px; --radius-sm:10px;
  --font-display:'Vazirmatn',sans-serif; --font-mono:'JetBrains Mono',monospace;
}

*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html,body{height:100%;}
body{ margin:0; background:var(--bg); color:var(--ink); font-family:var(--font-display); font-size:15px; line-height:1.6; overflow-x:hidden; -webkit-font-smoothing:antialiased; }
button, input {font-family:inherit;}
::selection{background:var(--blood);color:#fff;}

/* ---------- Atmosphere (Background Glow) ---------- */
#atmosphere{ position:fixed; inset:0; z-index:0; pointer-events:none; background:var(--bg); transition:background 1.4s ease; }
#atmosphere.is-night{ background:radial-gradient(120% 90% at 50% -10%, rgba(30,52,90,0.35), transparent 60%), var(--bg); }
#atmosphere.is-day{ background:radial-gradient(120% 90% at 50% -10%, rgba(120,86,32,0.28), transparent 60%), var(--bg); }
#atmosphere::before{ content:""; position:absolute; left:50%; top:-140px; transform:translateX(-50%); width:420px; height:420px; border-radius:50%; background:radial-gradient(circle, var(--halo-color,rgba(120,140,200,0.28)) 0%, transparent 70%); animation:haloPulse 6s ease-in-out infinite; }
@keyframes haloPulse{ 0%,100%{opacity:.55; transform:translateX(-50%) scale(1);} 50%{opacity:.9; transform:translateX(-50%) scale(1.08);} }
#atmosphere.is-night::before{ --halo-color:rgba(90,130,210,0.3); }
#atmosphere.is-day::before{ --halo-color:rgba(220,160,80,0.28); }

.fog{ position:absolute; inset:auto 0 0 0; height:38vh; opacity:0; transition:opacity 1.2s ease; pointer-events:none; background:radial-gradient(60% 40% at 20% 100%, rgba(255,255,255,0.035), transparent 70%), radial-gradient(50% 35% at 80% 100%, rgba(255,255,255,0.03), transparent 70%); animation:fogDrift 18s ease-in-out infinite alternate; }
#atmosphere.is-night .fog{ opacity:1; }
@keyframes fogDrift{ from{ transform:translateX(-2%);} to{ transform:translateX(2%);} }

/* ---------- Layout Shell & Header ---------- */
#app{ position:relative; z-index:1; min-height:100vh; display:flex; flex-direction:column; padding-bottom:74px; }
header.hdr{ position:sticky; top:0; z-index:20; padding:14px 16px 12px; background:linear-gradient(to bottom, rgba(10,11,13,0.92), rgba(10,11,13,0.75) 70%, transparent); backdrop-filter:blur(10px); }
.hdr-row{ display:flex; align-items:center; gap:12px; }
.hdr-disc{ width:46px; height:46px; border-radius:50%; flex:none; display:flex; align-items:center; justify-content:center; font-size:21px; background:var(--panel-strong); border:1px solid var(--panel-border-strong); box-shadow:0 0 0 1px rgba(0,0,0,0.3), 0 6px 18px -6px var(--halo-color,rgba(90,130,210,0.4)); }
.hdr-mid{ flex:1; min-width:0; }
.hdr-title{ font-weight:800; font-size:16px; letter-spacing:.2px; }
.hdr-sub{ color:var(--ink-dim); font-size:12.5px; margin-top:1px; }
.hdr-timer{ font-family:var(--font-mono); font-weight:600; font-size:20px; min-width:64px; text-align:center; padding:6px 10px; border-radius:var(--radius-sm); background:var(--panel); border:1px solid var(--panel-border); font-variant-numeric:tabular-nums; }
.hdr-timer.low{ color:var(--blood-bright); border-color:rgba(178,58,68,0.5); animation:tick 1s steps(1) infinite; }
@keyframes tick{ 50%{opacity:.55;} }
.hdr-meta{ display:flex; gap:10px; margin-top:10px; font-size:12.5px; color:var(--ink-dim); }
.hdr-chip{ display:flex; align-items:center; gap:5px; background:var(--panel); border:1px solid var(--panel-border); padding:5px 10px; border-radius:999px; }

/* ---------- Views & Components ---------- */
main{ flex:1; padding:4px 16px 24px; }
.view{ display:none; animation:viewIn .35s ease; }
.view.active{ display:block; }
@keyframes viewIn{ from{ opacity:0; transform:translateY(6px);} to{ opacity:1; transform:none;} }
.section-title{ font-size:12.5px; color:var(--ink-dim); font-weight:600; margin:18px 2px 10px; display:flex; align-items:center; gap:6px; }
.section-title:first-child{ margin-top:6px; }
.panel{ background:var(--panel); border:1px solid var(--panel-border); border-radius:var(--radius-lg); padding:16px; position:relative; overflow:hidden; }
.panel + .panel{ margin-top:10px; }

/* ---------- Buttons ---------- */
.btn{ display:block; width:100%; text-align:center; border:none; cursor:pointer; padding:14px 16px; border-radius:999px; font-weight:700; font-size:14.5px; background:var(--panel-strong); color:var(--ink); border:1px solid var(--panel-border-strong); transition:transform .1s ease, opacity .15s ease; }
.btn:active{ transform:scale(.97); }
.btn:disabled{ opacity:0.35; cursor:not-allowed; }
.btn.primary{ background:linear-gradient(180deg, var(--blood-bright), var(--blood)); border-color:transparent; color:#fff; box-shadow:0 8px 20px -8px var(--blood-glow); }
.btn.ghost{ background:transparent; border-color:var(--panel-border); color:var(--ink-dim); }
.btn.gold{ background:linear-gradient(180deg,#c9a765,var(--gold-dim)); color:#1a1408; border-color:transparent; }
.btn-row{ display:flex; gap:8px; margin-top:12px; }
.btn-row .btn{ flex:1; }

.empty-note{ text-align:center; color:var(--ink-faint); font-size:13px; padding:26px 10px; }
.empty-note .big{ font-size:30px; display:block; margin-bottom:8px; }

/* ---------- Lobby ---------- */
.lobby-box { text-align: center; padding: 40px 10px; }
.lobby-code-display { font-size: 48px; font-family: var(--font-mono); letter-spacing: 12px; color: var(--gold); margin: 20px 0; font-weight: bold; text-shadow: 0 0 20px rgba(184, 147, 76, 0.4); }
.input-code { width: 100%; padding: 16px; text-align: center; font-size: 28px; letter-spacing: 8px; border-radius: 16px; background: rgba(0,0,0,0.3); border: 2px solid var(--panel-border-strong); color: #fff; margin-bottom: 20px; font-family: var(--font-mono); font-weight: bold; outline: none; transition: border-color 0.3s; }
.input-code:focus { border-color: var(--gold); }
.lobby-players { margin: 30px 0; text-align: right; }
.player-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; background: var(--panel-strong); padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 8px; border: 1px solid var(--panel-border); font-weight: 600; }

/* ---------- Player Grid ---------- */
.players-grid{ display:grid; grid-template-columns:repeat(2, 1fr); gap:10px; }
.pcard{ background:var(--panel); border:1px solid var(--panel-border); border-radius:var(--radius-md); padding:12px 12px 11px; display:flex; flex-direction:column; gap:6px; transition:transform .15s ease, border-color .15s ease, background .15s ease; }
.pcard[data-selectable="1"]{ cursor:pointer; }
.pcard[data-selectable="1"]:active{ transform:scale(.97); }
.pcard.dead{ opacity:.5; }
.pcard.selected{ border-color:var(--blood-bright); background:rgba(178,58,68,0.12); box-shadow:0 0 0 1px var(--blood-bright) inset; }
.pcard.is-you{ border-color:var(--gold-dim); }
.pcard-top{ display:flex; align-items:center; justify-content:space-between; }
.pcard-avatar{ width:34px; height:34px; border-radius:50%; background:var(--panel-strong); display:flex; align-items:center; justify-content:center; font-size:15px; border:1px solid var(--panel-border); }
.pcard-name{ font-weight:600; font-size:13.5px; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.pcard-status{ font-size:11.5px; color:var(--ink-dim); display:flex; align-items:center; gap:4px; }
.pcard-status.alive{ color:var(--good); }
.pcard-status.dead{ color:var(--ink-faint); }
.pcard-role-tag{ font-size:11px; color:var(--gold); }
.you-badge{ font-size:10px; background:var(--gold-dim); color:#fff; padding:1px 7px; border-radius:999px; }

/* ---------- Role Panel ---------- */
.role-hero{ display:flex; align-items:center; gap:14px; }
.role-hero-emoji{ font-size:34px; width:60px; height:60px; border-radius:16px; display:flex; align-items:center; justify-content:center; background:var(--panel-strong); border:1px solid var(--panel-border-strong); flex:none; }
.role-hero-name{ font-weight:800; font-size:18px; }
.role-hero-team{ font-size:12px; color:var(--ink-dim); margin-top:2px; }
.role-desc{ margin-top:12px; font-size:13px; color:var(--ink-dim); line-height:1.85; }
.role-stats{ display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
.stat-pill{ font-size:11.5px; background:var(--panel-strong); border:1px solid var(--panel-border); padding:5px 10px; border-radius:999px; color:var(--ink-dim); }
.stat-pill b{ color:var(--ink); }

/* ---------- Action Targets ---------- */
.targets{ display:flex; flex-direction:column; gap:8px; margin-top:12px; }
.targets.nato-roles { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.target-row{ display:flex; align-items:center; justify-content:space-between; gap:10px; background:var(--panel); border:1px solid var(--panel-border); border-radius:var(--radius-sm); padding:11px 14px; cursor:pointer; transition:border-color .15s, background .15s; }
.targets.nato-roles .target-row { padding: 8px 10px; }
.target-row:active{ transform:scale(.985); }
.target-row.picked{ border-color:var(--blood-bright); background:rgba(178,58,68,0.14); }
.target-row .tname{ font-weight:600; font-size:13.5px; }
.radio-dot{ width:18px; height:18px; border-radius:50%; border:2px solid var(--panel-border-strong); flex:none; position:relative; }
.target-row.picked .radio-dot{ border-color:var(--blood-bright); }
.target-row.picked .radio-dot::after{ content:""; position:absolute; inset:3px; border-radius:50%; background:var(--blood-bright); }

/* ---------- Voting ---------- */
.vote-bar-wrap{ margin-top:8px; }
.vote-row{ margin-bottom:12px; cursor:pointer; }
.vote-row:active .vote-track { transform:scale(0.99); }
.vote-row-top{ display:flex; justify-content:space-between; align-items:center; font-size:13px; margin-bottom:5px; }
.vote-row-top .vn{ font-weight:600; }
.vote-row-top .vc{ color:var(--ink-dim); font-family:var(--font-mono); }
.vote-track{ height:9px; border-radius:999px; background:var(--panel-strong); overflow:hidden; transition:transform 0.1s; }
.vote-fill{ height:100%; background:linear-gradient(90deg, var(--gold-dim), var(--gold)); border-radius:999px; transition:width .5s ease; }

/* ---------- Chat / Day Phase ---------- */
.chat-container { display: flex; flex-direction: column; height: calc(100vh - 180px); }
.chat-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--panel-strong); border-radius: var(--radius-lg) var(--radius-lg) 0 0; border: 1px solid var(--panel-border); border-bottom: none; }
.speaker-name { color: var(--gold); font-weight: 800; font-size: 16px; display:flex; align-items:center; gap:8px;}
.speaker-name.is-me { color: var(--good); }
.speaker-timer { font-family: var(--font-mono); font-size: 22px; color: var(--ink); font-weight: bold; background: var(--bg); padding: 4px 12px; border-radius: 8px; border: 1px solid var(--panel-border); }
.speaker-timer.urgent { color: var(--blood-bright); animation: pulse 1s infinite; }
@keyframes pulse { 50% { opacity: 0.5; } }

.chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; background: var(--panel); border-left: 1px solid var(--panel-border); border-right: 1px solid var(--panel-border); scroll-behavior: smooth; }
.chat-msg { padding: 12px 16px; border-radius: 16px; background: var(--panel-strong); max-width: 85%; align-self: flex-start; border: 1px solid var(--panel-border); line-height: 1.5; position: relative; }
.chat-msg.mine { background: rgba(184, 147, 76, 0.1); border-color: rgba(184, 147, 76, 0.3); align-self: flex-end; border-bottom-right-radius: 4px; }
.chat-msg.others { border-bottom-left-radius: 4px; }
.chat-msg.system { align-self: center; background: transparent; border: none; color: var(--ink-dim); font-size: 12px; text-align: center; width: 100%; padding: 4px; }
.chat-msg .sender { font-size: 11.5px; color: var(--gold); margin-bottom: 4px; font-weight: bold; }
.chat-msg.mine .sender { color: var(--good); }
.chat-msg .time { font-size: 9px; color: var(--ink-faint); margin-top: 4px; text-align: right; }

.chat-input-area { display: flex; gap: 8px; padding: 12px; background: var(--panel-strong); border-radius: 0 0 var(--radius-lg) var(--radius-lg); border: 1px solid var(--panel-border); border-top: none; }
.chat-input-area input { flex: 1; padding: 14px 18px; border-radius: 999px; background: var(--bg); border: 1px solid var(--panel-border-strong); color: #fff; font-size: 14.5px; outline: none; transition: border-color 0.2s; }
.chat-input-area input:focus { border-color: var(--gold-dim); }
.chat-input-area button { padding: 0 24px; border-radius: 999px; background: var(--gold); border: none; color: #1a1408; font-weight: 800; font-size: 15px; }
.chat-input-area input:disabled, .chat-input-area button:disabled { opacity: 0.4; cursor: not-allowed; background: var(--panel); border-color: transparent; color: var(--ink-faint); }

/* ---------- Bottom Nav ---------- */
nav.bottomnav{ position:fixed; bottom:0; left:0; right:0; z-index:30; display:flex; padding:8px 12px calc(8px + env(safe-area-inset-bottom)); gap:6px; background:rgba(10,11,13,0.92); backdrop-filter:blur(14px); border-top:1px solid var(--panel-border); }
nav.bottomnav button{ flex:1; background:none; border:none; color:var(--ink-faint); display:flex; flex-direction:column; align-items:center; gap:3px; padding:6px 2px; border-radius:12px; font-size:10.5px; position:relative; }
nav.bottomnav button .ico{ font-size:19px; }
nav.bottomnav button.active{ color:var(--ink); background:var(--panel); }
nav.bottomnav button .dot{ position:absolute; top:2px; left:50%; margin-left:9px; width:7px; height:7px; border-radius:50%; background:var(--blood-bright); display:none; }
nav.bottomnav button.alert .dot{ display:block; }

/* ---------- Toast ---------- */
#toast{ position:fixed; bottom:88px; left:50%; transform:translateX(-50%) translateY(20px); background:var(--panel-strong); border:1px solid var(--panel-border-strong); padding:10px 18px; border-radius:999px; font-size:12.5px; z-index:50; opacity:0; transition:opacity .25s ease, transform .25s ease; pointer-events:none; backdrop-filter:blur(10px); color:#fff; }
#toast.show{ opacity:1; transform:translateX(-50%) translateY(0); }

/* ---------- Timeline & End Game ---------- */
.tl-item{ display:flex; gap:10px; padding:10px 0; border-bottom:1px solid var(--panel-border); }
.tl-item:last-child{ border-bottom:none; }
.tl-icon{ width:30px; height:30px; border-radius:9px; background:var(--panel-strong); display:flex; align-items:center; justify-content:center; font-size:14px; flex:none; }
.tl-text{ font-size:13px; color:var(--ink-dim); padding-top:4px; }
.tl-head{ font-size:12px; font-weight:700; color:var(--ink); }

.endgame-banner{ text-align:center; padding:28px 16px 22px; }
.endgame-banner .emoji{ font-size:48px; }
.endgame-banner h2{ margin:10px 0 2px; font-size:20px; font-weight:800; }
.endgame-banner p{ color:var(--ink-dim); font-size:13px; margin:0; }
.reveal-row{ display:flex; align-items:center; justify-content:space-between; padding:11px 4px; border-bottom:1px solid var(--panel-border); }
.reveal-row:last-child{ border-bottom:none; }
.reveal-left{ display:flex; align-items:center; gap:10px; }
.reveal-name{ font-weight:600; font-size:13.5px; }
.reveal-role{ font-size:12px; color:var(--gold); }
</style>
</head>
<body>

<div id="atmosphere"><div class="fog"></div></div>

<div id="app">

  <!-- Header -->
  <header class="hdr" id="mainHeader" style="display:none;">
    <div class="hdr-row">
      <div class="hdr-disc" id="phaseDisc">🌙</div>
      <div class="hdr-mid">
        <div class="hdr-title" id="phaseTitle">در انتظار اتصال…</div>
        <div class="hdr-sub" id="phaseSub">مافیا</div>
      </div>
      <div class="hdr-timer" id="timer">--:--</div>
    </div>
    <div class="hdr-meta">
      <div class="hdr-chip">👥 <b id="aliveCount">–</b> بازیکن زنده</div>
      <div class="hdr-chip" id="dayNightChip">—</div>
    </div>
  </header>

  <main>
    <!-- VIEW: LOBBY INIT (Create / Join) -->
    <section class="view active" id="view-lobby-init">
       <div class="lobby-box">
          <div style="font-size: 70px; margin-bottom: 5px;">🎭</div>
          <h2 style="margin-top:0; font-weight:800; font-size:24px;">بازی مافیا</h2>
          <p style="color: var(--ink-dim); margin-bottom: 40px; font-size:14px;">لابی اختصاصی مینی‌اپ</p>
          
          <button class="btn primary" id="btnCreateLobby" style="margin-bottom:12px;">ساخت لابی جدید</button>
          <button class="btn ghost" id="btnShowJoin">پیوستن به لابی</button>
       </div>
       
       <div class="lobby-box" id="joinLobbyForm" style="display:none; padding-top:0;">
          <input type="text" dir="ltr" id="inputLobbyCode" class="input-code" placeholder="کد ۵ رقمی" maxlength="5" inputmode="numeric">
          <button class="btn gold" id="btnJoinLobbySubmit">ورود به بازی</button>
       </div>
    </section>

    <!-- VIEW: LOBBY WAIT (Show code & players) -->
    <section class="view" id="view-lobby-wait">
       <div class="lobby-box" style="padding-top:20px;">
          <div class="section-title" style="justify-content:center; font-size:14px;">کد لابی شما</div>
          <div class="lobby-code-display" dir="ltr" id="displayLobbyCode">-----</div>
          <button class="btn ghost" id="btnCopyLobbyCode" style="margin:0 0 16px; padding:10px; font-size:13px;">📋 کپی کد لابی</button>
          <p style="color: var(--ink-dim); font-size:13px; background:var(--panel); padding:10px; border-radius:10px;">این کد را به دوستان خود بدهید تا وارد بازی شوند</p>
          
          <div class="lobby-players">
             <div class="section-title">بازیکنان پیوسته (<span id="lobbyPlayerCount">0</span>)</div>
             <div id="lobbyPlayersList"></div>
          </div>
          
          <button class="btn primary" id="btnStartGame" style="display:none; margin-top:30px; box-shadow: 0 0 20px rgba(178,58,68,0.4);">شروع بازی</button>
          <div id="waitingForHostMsg" style="margin-top:30px; color:var(--ink-dim); display:none;">در انتظار میزبان برای شروع بازی...</div>
       </div>
    </section>

    <!-- VIEW: CHAT (40s Turn Based) -->
    <section class="view" id="view-chat">
       <div class="chat-container">
          <div class="chat-header">
             <div class="speaker-name" id="uiSpeakerName">---</div>
             <div class="speaker-timer" id="uiSpeakerTimer">--:--</div>
          </div>
          <div class="chat-messages" id="uiChatMessages"></div>
          
          <form class="chat-input-area" id="chatForm">
             <input type="text" id="uiChatInput" placeholder="فقط در نوبت خود می‌توانید صحبت کنید..." autocomplete="off" disabled>
             <button type="submit" id="uiChatSend" disabled>ارسال</button>
          </form>
       </div>
    </section>

    <!-- VIEW: PLAYERS -->
    <section class="view" id="view-players">
      <div class="section-title">👥 بازیکنان بازی</div>
      <div class="players-grid" id="playersGrid"></div>

      <div id="deadSection" style="display:none;">
        <div class="section-title">💀 حذف‌شده‌ها</div>
        <div class="players-grid" id="deadGrid"></div>
      </div>
    </section>

    <!-- VIEW: ROLE & ACTIONS -->
    <section class="view" id="view-role">
      <div class="panel" id="rolePanel"></div>
      <div class="panel" id="actionPanel" style="display:none;"></div>
    </section>

    <!-- VIEW: VOTING / COURT -->
    <section class="view" id="view-vote">
      <div class="panel" id="votePanel"></div>
    </section>

    <!-- VIEW: TIMELINE / EVENTS -->
    <section class="view" id="view-events">
      <div class="section-title">📜 روند بازی</div>
      <div class="panel" id="timelinePanel">
        <div class="empty-note"><span class="big">🕯</span>هنوز اتفاقی ثبت نشده</div>
      </div>
    </section>
  </main>

  <!-- Bottom Navigation -->
  <nav class="bottomnav" id="mainNav" style="display:none;">
    <button data-tab="lobby-wait" id="navLobbyBtn" style="display:none;"><span class="ico">🃏</span>لابی</button>
    <button data-tab="players" id="navPlayersBtn"><span class="ico">👥</span>بازیکنان</button>
    <button data-tab="role" id="navRoleBtn"><span class="ico">🎭</span>نقش من<span class="dot" id="actionDot"></span></button>
    <button data-tab="chat" id="navChatBtn"><span class="ico">💬</span>چت روز</button>
    <button data-tab="vote" id="navVoteBtn"><span class="ico">⚖️</span>دادگاه</button>
    <button data-tab="events" id="navEventsBtn"><span class="ico">📜</span>رویدادها</button>
  </nav>

</div>

<div id="toast"></div>

<script>
/* =====================================================================
   MAFIA MINI APP — FRONTEND LOGIC (Connected to Backend API)
   ===================================================================== */

const CONFIG = {
  API_BASE: window.location.origin,
  POLL_MS: 3000,
};

const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
if (tg) { tg.ready(); tg.expand(); try{ tg.setHeaderColor('#0a0b0d'); tg.setBackgroundColor('#0a0b0d'); }catch(e){} }

const qs = new URLSearchParams(location.search);
let CHAT_ID = qs.get('chat_id') || (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) || null;

const ROLE_META = {
  godfather:{name:'پدرخوانده',emoji:'🎩',team:'مافیا'},
  lecter:{name:'دکتر لکتر',emoji:'🩺',team:'مافیا'},
  nato:{name:'ناتو',emoji:'💣',team:'مافیا'},
  detective:{name:'کارآگاه',emoji:'🔍',team:'شهروند'},
  doctor:{name:'دکتر',emoji:'💉',team:'شهروند'},
  sniper:{name:'اسنایپر',emoji:'🎯',team:'شهروند'},
  mayor:{name:'شهردار',emoji:'🏛',team:'شهروند'},
  gunner:{name:'تفنگدار',emoji:'🔫',team:'شهروند'},
  invincible:{name:'رویین‌تن',emoji:'🛡',team:'شهروند'},
  escort:{name:'اسکورت',emoji:'💋',team:'شهروند'},
  paranoid:{name:'پارانوئید',emoji:'🧠',team:'شهروند'},
  johnny:{name:'جانی',emoji:'🔪',team:'مستقل'},
  joker:{name:'جوکر',emoji:'🤡',team:'مستقل'},
  bomber:{name:'بمب‌گذار',emoji:'🧨',team:'مستقل'},
  lonewolf:{name:'گرگ تنها',emoji:'🕵️',team:'مستقل'},
};

const ACTION_LABEL = {
  mafia_kill: {title:'انتخاب هدف قتل', cta:'تأیید قتل', icon:'🔪'},
  heal: {title:'انتخاب فرد برای نجات', cta:'تأیید نجات', icon:'💉'},
  investigate: {title:'استعلام هویت', cta:'تأیید استعلام', icon:'🔍'},
  snipe: {title:'انتخاب هدف شلیک', cta:'شلیک', icon:'🎯'},
  escort_block: {title:'مسدودسازی', cta:'تأیید مسدودسازی', icon:'💋'},
  nato_guess: {title:'حدس نقش', cta:'تأیید حدس', icon:'💣'},
  paranoid_alert: {title:'هوشیاری', cta:'هوشیار می‌شوم', icon:'🧠'},
  johnny_kill: {title:'انتخاب هدف قتل', cta:'تأیید قتل', icon:'🔪'},
  bomber_mark: {title:'علامت‌گذاری', cta:'تأیید علامت‌گذاری', icon:'🧨'},
  bomber_explode: {title:'انفجار', cta:'منفجر کن', icon:'💥'},
  gunner_give_war: {title:'توزیع تفنگ جنگی', cta:'تأیید جنگی', icon:'🔫'},
  gunner_give_black: {title:'توزیع تفنگ مشقی', cta:'تأیید مشقی', icon:'🔫'},
  gunner_shot: {title:'شلیک با تفنگ', cta:'شلیک', icon:'🔫'},
};

let state = { game:null, you:null, selectedTarget:null, selectedRole:null, activeTab:'lobby-init', lastChatLength: 0 };
let pollTimer = null;

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(()=>t.classList.remove('show'), 2200);
}

function fmtClock(sec){
  if (sec == null || sec < 0) return '--:--';
  const m = Math.floor(sec/60), s = Math.floor(sec%60);
  return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}
function toFa(n){ return String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]); }
function escapeHtml(s){ return String(s??'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

/* ---------------- API ---------------- */
async function apiGetState(){
  if (!CONFIG.API_BASE && !CHAT_ID) throw new Error('Backend not connected');
  const res = await fetch(\`\${CONFIG.API_BASE}/api/miniapp/state?chat_id=\${encodeURIComponent(CHAT_ID || '')}\`, {
    headers: { 'X-Telegram-Init-Data': tg ? tg.initData : '' },
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

async function apiPostAction(body){
  try {
    const res = await fetch(\`\${CONFIG.API_BASE}/api/miniapp/action\`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'X-Telegram-Init-Data': tg ? tg.initData : '' },
      body: JSON.stringify({ chatId: CHAT_ID, ...body }),
    });
    const data = await res.json();
    if (!data.ok) toast(data.error || 'خطا در ثبت اطلاعات');
    return data;
  } catch(e) { toast('ارتباط با سرور برقرار نشد'); return { ok:false }; }
}

/* ---------------- MAIN LOOP ---------------- */
async function pollLoop(){
  if (!CHAT_ID) return;
  try {
    const data = await apiGetState();
    if (data.ok) {
       state.game = data.game; 
       state.you = data.you;
       render();
    }
  } catch(e) { }
}

function startPolling(){
  pollLoop();
  clearInterval(pollTimer);
  pollTimer = setInterval(()=>{ if (!document.hidden) pollLoop(); }, CONFIG.POLL_MS);
}
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) pollLoop(); });

/* ---------------- TAB MANAGEMENT ---------------- */
function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.bottomnav button').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(\`.bottomnav button[data-tab="\${tabId}"]\`);
  if(btn) btn.classList.add('active');
  
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(\`view-\${tabId}\`).classList.add('active');
  if (tg) tg.HapticFeedback && tg.HapticFeedback.impactOccurred('light');
}

document.querySelectorAll('.bottomnav button').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

/* ---------------- LOBBY HANDLERS ---------------- */
document.getElementById('btnCreateLobby').addEventListener('click', async () => {
  const res = await apiPostAction({ action: 'create_lobby', api: true });
  if (res.ok && res.chatId) {
    CHAT_ID = res.chatId;
    window.history.replaceState(null, null, \`?chat_id=\${CHAT_ID}\`);
    startPolling();
  }
});

document.getElementById('btnShowJoin').addEventListener('click', () => {
  document.getElementById('joinLobbyForm').style.display = 'block';
  document.getElementById('inputLobbyCode').focus();
});

function toEnDigits(s){
  return String(s ?? '').replace(/[۰-۹٠-٩]/g, d => {
    const fa = '۰۱۲۳۴۵۶۷۸۹'.indexOf(d);
    if (fa !== -1) return String(fa);
    const ar = '٠١٢٣٤٥٦٧٨٩'.indexOf(d);
    return ar !== -1 ? String(ar) : d;
  });
}

const inputLobbyCodeEl = document.getElementById('inputLobbyCode');
inputLobbyCodeEl.addEventListener('input', (e) => {
  e.target.value = toEnDigits(e.target.value).replace(/[^0-9]/g, '').slice(0, 5);
});

document.getElementById('btnJoinLobbySubmit').addEventListener('click', async () => {
  const code = toEnDigits(document.getElementById('inputLobbyCode').value.trim());
  if (!/^\\d{5}$/.test(code)) { toast('کد لابی باید ۵ رقم انگلیسی باشد'); return; }
  const res = await apiPostAction({ action: 'join_lobby', api: true, code: code });
  if (res.ok && res.chatId) {
    CHAT_ID = res.chatId;
    window.history.replaceState(null, null, \`?chat_id=\${CHAT_ID}\`);
    startPolling();
  }
});

document.getElementById('btnCopyLobbyCode').addEventListener('click', async () => {
  const code = document.getElementById('displayLobbyCode').textContent.trim();
  if (!code || code === '-----') return;
  try {
    await navigator.clipboard.writeText(code);
    toast('کد لابی کپی شد');
  } catch (e) {
    toast('کپی انجام نشد');
  }
});

document.getElementById('btnStartGame').addEventListener('click', async () => {
  await apiPostAction({ action: 'start_game' });
  pollLoop();
});

/* ---------------- RENDER ---------------- */
const PHASE_META = {
  lobby:{disc:'🃏', label:'لابی بازی', dn:'day'},
  night:{disc:'🌙', label:'شب', dn:'night'},
  inquiry:{disc:'🔎', label:'استعلام شهر', dn:'day'},
  day:{disc:'☀️', label:'روز', dn:'day'},
  nomination:{disc:'⚖️', label:'معرفی متهم', dn:'day'},
  defense:{disc:'🎙', label:'دفاعیه', dn:'day'},
  verdict:{disc:'🗳', label:'رأی نهایی دادگاه', dn:'day'},
  resolving:{disc:'⏳', label:'در حال پردازش…', dn:'day'},
  finished:{disc:'🏁', label:'پایان بازی', dn:'day'},
};

function render() {
  const g = state.game, you = state.you;
  if (!g) return;

  // LOBBY PHASE
  if (g.phase === 'lobby') {
    document.getElementById('mainHeader').style.display = 'none';
    document.getElementById('mainNav').style.display = 'flex';
    document.getElementById('navLobbyBtn').style.display = 'flex';
    document.getElementById('navRoleBtn').style.display = 'none';
    document.getElementById('navChatBtn').style.display = 'none';
    document.getElementById('navVoteBtn').style.display = 'none';
    document.getElementById('navEventsBtn').style.display = 'none';
    
    if (state.activeTab === 'lobby-init') switchTab('lobby-wait');
    
    document.getElementById('displayLobbyCode').textContent = g.lobbyCode || '-----';
    document.getElementById('lobbyPlayerCount').textContent = toFa((g.players||[]).length);
    document.getElementById('lobbyPlayersList').innerHTML = (g.players||[]).map(p => \`
      <div class="player-row">
        <div style="display:flex; align-items:center; gap:8px;">
          <span>👤</span> <span>\${escapeHtml(p.displayName)}</span>
        </div>
        \${p.isHost ? '<span style="font-size:11px; color:var(--gold);">میزبان</span>' : ''}
      </div>
    \`).join('');
    
    const isMeHost = (g.players||[]).some(p => p.userId === (you&&you.userId) && p.isHost);
    document.getElementById('btnStartGame').style.display = isMeHost ? 'block' : 'none';
    document.getElementById('waitingForHostMsg').style.display = isMeHost ? 'none' : 'block';
    
    return;
  }

  // IN GAME PHASES
  document.getElementById('mainHeader').style.display = 'block';
  document.getElementById('mainNav').style.display = 'flex';
  document.getElementById('navLobbyBtn').style.display = 'none';
  document.getElementById('navRoleBtn').style.display = 'flex';
  document.getElementById('navVoteBtn').style.display = 'flex';
  document.getElementById('navEventsBtn').style.display = 'flex';
  
  const isDay = g.phase === 'day';
  document.getElementById('navChatBtn').style.display = isDay ? 'flex' : 'none';
  
  if (state.activeTab === 'lobby-init' || state.activeTab === 'lobby-wait') {
    switchTab(isDay ? 'chat' : 'role');
  }

  const meta = PHASE_META[g.phase] || PHASE_META.lobby;
  const atm = document.getElementById('atmosphere');
  atm.className = meta.dn === 'night' ? 'is-night' : 'is-day';

  document.getElementById('phaseDisc').textContent = meta.disc;
  const dayNightNum = g.phase === 'night' ? g.nightNumber : g.dayNumber;
  document.getElementById('phaseTitle').textContent = \`\${meta.label}\${dayNightNum ? ' ' + toFa(dayNightNum) : ''}\`;
  document.getElementById('phaseSub').textContent = g.chatTitle || 'مافیا';

  const alive = (g.players||[]).filter(p=>p.status==='alive');
  document.getElementById('aliveCount').textContent = toFa(alive.length);
  document.getElementById('dayNightChip').textContent = g.status === 'finished' ? 'پایان بازی' : (meta.dn === 'night' ? \`🌙 شب \${toFa(g.nightNumber||0)}\` : \`☀️ روز \${toFa(g.dayNumber||0)}\`);

  renderTimer(g);
  renderPlayers(g, you);
  renderRole(g, you);
  renderVote(g, you);
  renderTimeline(g);
  if (isDay) renderChatState(g, you);

  if (g.status === 'finished') renderEndgame(g, you);

  const hasAction = you && you.availableAction && you.status === 'alive';
  document.getElementById('actionDot').classList.toggle('alert', !!hasAction);
}

let timerInterval = null;
function renderTimer(g){
  clearInterval(timerInterval);
  const el = document.getElementById('timer');
  function tick(){
    if (!g.phaseEndsAt){ el.textContent='--:--'; el.classList.remove('low'); return; }
    const left = Math.max(0, Math.round((g.phaseEndsAt - Date.now())/1000));
    el.textContent = fmtClock(left);
    el.classList.toggle('low', left <= 10);
  }
  tick();
  timerInterval = setInterval(tick, 1000);
}

/* ---------------- PLAYERS ---------------- */
function pcardHTML(p, you, selectable, selected){
  const isYou = you && p.userId === you.userId;
  const showRole = isYou || (p.status !== 'alive' && state.game.status === 'finished');
  const roleInfo = showRole && (p.independentRole || p.role) ? (ROLE_META[p.independentRole || p.role] || {}) : null;
  return \`
  <div class="pcard \${p.status!=='alive'?'dead':''} \${isYou?'is-you':''} \${selected?'selected':''}" data-uid="\${p.userId}" data-selectable="\${selectable?1:0}">
    <div class="pcard-top">
      <div class="pcard-avatar">\${p.status==='alive' ? '👤' : '💀'}</div>
      \${isYou ? '<span class="you-badge">شما</span>' : ''}
    </div>
    <div class="pcard-name">\${escapeHtml(p.displayName)}</div>
    <div class="pcard-status \${p.status==='alive'?'alive':'dead'}">\${p.status==='alive' ? '🟢 زنده' : '💀 حذف‌شده'}</div>
    \${roleInfo ? \`<div class="pcard-role-tag">\${roleInfo.emoji||''} \${roleInfo.name||''}</div>\` : ''}
  </div>\`;
}

function renderPlayers(g, you){
  const players = g.players || [];
  const alive = players.filter(p=>p.status==='alive');
  const dead = players.filter(p=>p.status!=='alive');
  
  const selectable = you && you.availableAction && you.status==='alive' && you.availableAction.type !== 'paranoid_alert';
  
  document.getElementById('playersGrid').innerHTML = alive.map(p =>
    pcardHTML(p, you, selectable && (you.availableAction.targets||[]).includes(p.userId), state.selectedTarget===p.userId)
  ).join('') || \`<div class="empty-note">هنوز بازیکنی نیست</div>\`;

  document.getElementById('deadSection').style.display = dead.length ? 'block' : 'none';
  document.getElementById('deadGrid').innerHTML = dead.map(p => pcardHTML(p, you, false, false)).join('');

  document.querySelectorAll('#playersGrid .pcard[data-selectable="1"]').forEach(card=>{
    card.addEventListener('click', ()=>{
      const uid = Number(card.dataset.uid);
      state.selectedTarget = state.selectedTarget === uid ? null : uid;
      if (you.availableAction && you.availableAction.type === 'nato_guess') state.selectedRole = null;
      render();
    });
  });
}

/* ---------------- ROLE & ACTIONS ---------------- */
function renderRole(g, you){
  const panel = document.getElementById('rolePanel');
  if (!you || (!you.role && !you.independentRole)){
    panel.innerHTML = \`<div class="empty-note"><span class="big">🎭</span>نقش شما هنوز مشخص نشده</div>\`;
    document.getElementById('actionPanel').style.display='none';
    return;
  }
  
  const meta = ROLE_META[you.independentRole || you.role] || {name:'—',emoji:'🎭',team:'—'};
  panel.innerHTML = \`
    <div class="role-hero">
      <div class="role-hero-emoji">\${meta.emoji}</div>
      <div>
        <div class="role-hero-name">\${meta.name}</div>
        <div class="role-hero-team">تیم: \${meta.team}</div>
      </div>
    </div>
    <div class="role-desc">\${escapeHtml(you.roleDescription || '')}</div>
    \${renderRoleStats(you)}
  \`;

  const actionPanel = document.getElementById('actionPanel');
  if (you.status !== 'alive'){
    actionPanel.style.display='block';
    actionPanel.innerHTML = \`<div class="empty-note"><span class="big">👻</span>شما دیگر در بازی نیستید</div>\`;
    return;
  }
  if (!you.availableAction){
    if (g.phase === 'night') {
      actionPanel.style.display='block';
      actionPanel.innerHTML = \`<div class="empty-note"><span class="big">🌒</span>در این فاز اقدامی برای شما نیست</div>\`;
    } else {
      actionPanel.style.display='none';
    }
    return;
  }
  
  renderActionPanel(you, g);
}

function renderRoleStats(you){
  const chips = [];
  if (you.natoChancesLeft != null) chips.push(\`<span class="stat-pill">شانس حدس: <b>\${toFa(you.natoChancesLeft)}</b></span>\`);
  if (you.paranoidAlertLeft != null) chips.push(\`<span class="stat-pill">هوشیاری باقی‌مانده: <b>\${toFa(you.paranoidAlertLeft)}</b></span>\`);
  if (you.sniperShotsLeft != null) chips.push(\`<span class="stat-pill">تیر باقی‌مانده: <b>\${toFa(you.sniperShotsLeft)}</b></span>\`);
  if (you.gunnerNightsLeft != null) chips.push(\`<span class="stat-pill">شب‌های توزیع باقی‌مانده: <b>\${toFa(you.gunnerNightsLeft)}</b></span>\`);
  return chips.length ? \`<div class="role-stats">\${chips.join('')}</div>\` : '';
}

function renderActionPanel(you, g){
  const panel = document.getElementById('actionPanel');
  panel.style.display = 'block';
  
  const act = you.availableAction;
  const info = ACTION_LABEL[act.type] || {title:'انتخاب هدف', cta:'تأیید', icon:'🎯'};
  const targets = (g.players||[]).filter(p => (act.targets||[]).includes(p.userId));

  let isConfirmDisabled = state.selectedTarget == null;

  let natoRolesHtml = '';
  if (act.type === 'nato_guess' && state.selectedTarget != null) {
    const roles = act.guessableRoles || [];
    isConfirmDisabled = state.selectedRole == null;
    natoRolesHtml = \`
      <div class="section-title">انتخاب نقش (ناتو)</div>
      <div class="targets nato-roles">
        \${roles.map(r => \`<div class="target-row \${state.selectedRole === r.id ? 'picked' : ''}" data-role="\${r.id}">
          <div class="tname">\${r.emoji} \${escapeHtml(r.name)}</div>
          <div class="radio-dot"></div>
        </div>\`).join('')}
      </div>
    \`;
  }

  let bomberExplodeHtml = '';
  if (act.type === 'bomber_mark' && act.canExplode) {
    bomberExplodeHtml = \`<button class="btn primary" style="margin-top:16px;" id="btnExplode">💥 منفجر کردن بمب‌ها (\${toFa(act.markedCount||0)} نفر)</button>\`;
  }

  let targetsHtml = '';
  if (act.type !== 'paranoid_alert') {
    targetsHtml = \`
      <div class="targets" id="targetList">
        \${targets.map(t => \`
          <div class="target-row \${state.selectedTarget===t.userId?'picked':''}" data-uid="\${t.userId}">
            <div>
              <div class="tname">\${escapeHtml(t.displayName)}\${t.userId===you.userId?' (خودم)':''}</div>
            </div>
            <div class="radio-dot"></div>
          </div>\`).join('')}
      </div>
    \`;
  } else {
    isConfirmDisabled = false;
    targetsHtml = \`<div class="empty-note" style="padding-top:0;">آیا می‌خواهید امشب هوشیار شوید؟ (در صورت حمله به شما، حمله‌کننده کشته می‌شود)</div>\`;
  }

  panel.innerHTML = \`
    <div class="section-title" style="margin-top:0;">\${info.icon} \${info.title}</div>
    \${targetsHtml}
    \${natoRolesHtml}
    \${bomberExplodeHtml}
    <div class="btn-row">
      \${act.skipLabel ? \`<button class="btn ghost" id="btnSkip">\${escapeHtml(act.skipLabel)}</button>\` : ''}
      <button class="btn primary" id="btnConfirm" \${isConfirmDisabled ? 'disabled':''}>\${info.cta}</button>
    </div>
  \`;

  if (act.type !== 'paranoid_alert') {
    panel.querySelectorAll('#targetList .target-row').forEach(row=>{
      row.addEventListener('click', ()=>{
        state.selectedTarget = Number(row.dataset.uid);
        if (act.type === 'nato_guess') state.selectedRole = null;
        renderActionPanel(you, g);
        renderPlayers(g, you);
      });
    });
  }

  if (act.type === 'nato_guess') {
    panel.querySelectorAll('.nato-roles .target-row').forEach(row=>{
      row.addEventListener('click', ()=>{
        state.selectedRole = row.dataset.role;
        renderActionPanel(you, g);
      });
    });
  }

  document.getElementById('btnSkip')?.addEventListener('click', async ()=>{
    let payload = { action: act.type, targetId: null };
    if (act.type === 'paranoid_alert') payload.targetId = 0; 
    await apiPostAction(payload);
    state.selectedTarget = null;
    state.selectedRole = null;
    toast('اقدام رد شد');
    pollLoop();
  });

  document.getElementById('btnExplode')?.addEventListener('click', async ()=>{
    await apiPostAction({ action: 'bomber_explode' });
    state.selectedTarget = null;
    toast('بمب‌ها منفجر شدند!');
    pollLoop();
  });

  document.getElementById('btnConfirm').addEventListener('click', async ()=>{
    if (isConfirmDisabled) return;
    let payload = { action: act.type };
    if (act.type === 'paranoid_alert') {
      payload.targetId = you.userId;
    } else {
      payload.targetId = state.selectedTarget;
      if (act.type === 'nato_guess') payload.targetRole = state.selectedRole;
    }

    const res = await apiPostAction(payload);
    if (res.ok){ toast('ثبت شد'); state.selectedTarget = null; state.selectedRole = null; if (tg) tg.HapticFeedback && tg.HapticFeedback.notificationOccurred('success'); }
    pollLoop();
  });
}

/* ---------------- TURN BASED CHAT ---------------- */
function renderChatState(g, you) {
  if (g.phase !== 'day') return;
  
  const currentSpeakerId = g.currentSpeakerId;
  const isMyTurn = (currentSpeakerId === (you && you.userId));
  const currentSpeaker = (g.players||[]).find(p => p.userId === currentSpeakerId);
  
  const nameEl = document.getElementById('uiSpeakerName');
  if (currentSpeaker) {
     nameEl.innerHTML = isMyTurn ? \`🎙 شما <span style="font-size:12px; color:var(--ink-dim);">(درحال صحبت)</span>\` : \`🎙 \${escapeHtml(currentSpeaker.displayName)}\`;
     nameEl.className = \`speaker-name \${isMyTurn ? 'is-me' : ''}\`;
  } else {
     nameEl.innerHTML = \`---\`;
  }
  
  const timerEl = document.getElementById('uiSpeakerTimer');
  const timeLeft = g.speakerTimeLeft || 0;
  timerEl.textContent = \`00:\${String(timeLeft).padStart(2,'0')}\`;
  timerEl.classList.toggle('urgent', timeLeft <= 10);
  
  const inputEl = document.getElementById('uiChatInput');
  const btnEl = document.getElementById('uiChatSend');
  
  if (isMyTurn) {
    inputEl.disabled = false;
    btnEl.disabled = false;
    if (inputEl.placeholder !== "تایپ کنید...") inputEl.placeholder = "تایپ کنید...";
  } else {
    inputEl.disabled = true;
    btnEl.disabled = true;
    if (inputEl.placeholder !== "فقط در نوبت خود می‌توانید صحبت کنید...") inputEl.placeholder = "فقط در نوبت خود می‌توانید صحبت کنید...";
  }
  
  // Render Messages efficiently
  const chatMessages = g.miniAppChat || [];
  if (chatMessages.length !== state.lastChatLength) {
     const container = document.getElementById('uiChatMessages');
     container.innerHTML = chatMessages.map(msg => {
        if (msg.isSystem) return \`<div class="chat-msg system">\${escapeHtml(msg.text)}</div>\`;
        const isMine = you && msg.senderId === you.userId;
        const d = new Date(msg.time);
        const timeStr = \`\${String(d.getHours()).padStart(2,'0')}:\${String(d.getMinutes()).padStart(2,'0')}\`;
        return \`
          <div class="chat-msg \${isMine ? 'mine' : 'others'}">
            <div class="sender">\${escapeHtml(msg.senderName)}</div>
            <div class="text">\${escapeHtml(msg.text)}</div>
            <div class="time">\${timeStr}</div>
          </div>
        \`;
     }).join('');
     container.scrollTop = container.scrollHeight;
     state.lastChatLength = chatMessages.length;
  }
}

document.getElementById('chatForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('uiChatInput');
  const text = input.value.trim();
  if (text) {
    input.value = '';
    const res = await apiPostAction({ action: 'chat_send', text: text });
    if (res.ok) pollLoop(); // immediate fetch to show my message
  }
});


/* ---------------- VOTING ---------------- */
function renderVote(g, you){
  const panel = document.getElementById('votePanel');
  if (g.phase === 'nomination') renderNomination(panel, g, you);
  else if (g.phase === 'defense') renderDefense(panel, g);
  else if (g.phase === 'verdict') renderVerdict(panel, g, you);
  else if (g.phase === 'inquiry') renderInquiry(panel, g, you);
  else panel.innerHTML = \`<div class="empty-note"><span class="big">⚖️</span>الان رأی‌گیری فعالی نیست</div>\`;
}

function tallyVotes(votes, players){
  const byTarget = {};
  (votes||[]).forEach(v=>{
    if (v.targetId == null) return;
    byTarget[v.targetId] = (byTarget[v.targetId]||0) + (v.weight||1);
  });
  const max = Math.max(1, ...Object.values(byTarget), 1);
  return { byTarget, max };
}

function renderNomination(panel, g, you){
  const alive = (g.players||[]).filter(p=>p.status==='alive');
  const { byTarget, max } = tallyVotes(g.votes, alive);
  const myVote = (g.votes||[]).find(v=>v.voterId === (you&&you.userId));
  
  panel.innerHTML = \`
    <div class="section-title" style="margin-top:0;">⚖️ چه کسی باید به دادگاه برود؟</div>
    <div class="vote-bar-wrap">
      \${alive.map(p=>{
        const v = byTarget[p.userId]||0;
        return \`<div class="vote-row" data-uid="\${p.userId}">
          <div class="vote-row-top"><span class="vn">\${escapeHtml(p.displayName)}</span><span class="vc">\${toFa(v)} رأی</span></div>
          <div class="vote-track"><div class="vote-fill" style="width:\${(v/max)*100}%"></div></div>
        </div>\`;
      }).join('')}
    </div>
    \${you && you.status==='alive' ? \`<div class="btn-row"><button class="btn ghost" id="btnAbstain">\${myVote && myVote.targetId===null ? '✓ ممتنع' : 'ممتنع'}</button></div>\` : ''}
  \`;
  if (you && you.status==='alive'){
    panel.querySelectorAll('.vote-row').forEach(row=>{
      row.addEventListener('click', async ()=>{
        await apiPostAction({ action:'vote_nominate', targetId: Number(row.dataset.uid) });
        toast('رأی ثبت شد'); pollLoop();
      });
    });
    document.getElementById('btnAbstain')?.addEventListener('click', async ()=>{
      await apiPostAction({ action:'vote_nominate', targetId: null });
      toast('ممتنع ثبت شد'); pollLoop();
    });
  }
}

function renderDefense(panel, g){
  const accused = (g.players||[]).find(p=>p.userId === g.accusedUserId);
  panel.innerHTML = \`
    <div class="section-title" style="margin-top:0;">🎙 زمان دفاعیه</div>
    <div class="empty-note">
      <span class="big">🎙</span>
      \${accused ? escapeHtml(accused.displayName) + ' در حال دفاع از خودش است' : 'در انتظار دفاعیه'}
    </div>
  \`;
}

function renderVerdict(panel, g, you){
  const myVerdict = (g.verdictVotes||[]).find(v=>v.voterId === (you&&you.userId));
  const guilty = (g.verdictVotes||[]).filter(v=>v.guilty).reduce((s,v)=>s+(v.weight||1),0);
  const innocent = (g.verdictVotes||[]).filter(v=>!v.guilty).reduce((s,v)=>s+(v.weight||1),0);
  const total = Math.max(1, guilty+innocent);
  const accused = (g.players||[]).find(p=>p.userId === g.accusedUserId);
  
  panel.innerHTML = \`
    <div class="section-title" style="margin-top:0;">🗳 رأی نهایی — \${accused ? escapeHtml(accused.displayName) : ''}</div>
    <div class="vote-row">
      <div class="vote-row-top"><span class="vn">مجرم</span><span class="vc">\${toFa(guilty)}</span></div>
      <div class="vote-track"><div class="vote-fill" style="width:\${(guilty/total)*100}%"></div></div>
    </div>
    <div class="vote-row">
      <div class="vote-row-top"><span class="vn">بی‌گناه</span><span class="vc">\${toFa(innocent)}</span></div>
      <div class="vote-track"><div class="vote-fill" style="width:\${(innocent/total)*100}%"></div></div>
    </div>
    \${you && you.status==='alive' && you.userId !== g.accusedUserId ? \`
    <div class="btn-row">
      <button class="btn ghost" id="btnInnocent">\${myVerdict && !myVerdict.guilty ? '✓ ' : ''}بی‌گناه</button>
      <button class="btn primary" id="btnGuilty">\${myVerdict && myVerdict.guilty ? '✓ ' : ''}مجرم</button>
    </div>\` : ''}
  \`;
  if (you && you.status==='alive' && you.userId !== g.accusedUserId){
    document.getElementById('btnGuilty')?.addEventListener('click', async ()=>{ await apiPostAction({action:'vote_verdict', guilty:true}); toast('رأی مجرم ثبت شد'); pollLoop(); });
    document.getElementById('btnInnocent')?.addEventListener('click', async ()=>{ await apiPostAction({action:'vote_verdict', guilty:false}); toast('رأی بی‌گناه ثبت شد'); pollLoop(); });
  }
}

function renderInquiry(panel, g, you){
  const myVote = (g.inquiryVotes||[]).find(v=>v.voterId === (you&&you.userId));
  panel.innerHTML = \`
    <div class="section-title" style="margin-top:0;">🔎 استعلام شهر</div>
    <div class="empty-note" style="padding-bottom:10px;"><span class="big">🔎</span>آیا با استعلام نقش‌های خارج شده موافقت می‌کنید؟</div>
    \${you && you.status === 'alive' ? \`
      <div class="btn-row">
        <button class="btn ghost" id="btnInqNo">\${myVote && myVote.choice===false ? '✓ ' : ''}مخالفم</button>
        <button class="btn primary" id="btnInqYes">\${myVote && myVote.choice===true ? '✓ ' : ''}موافقم</button>
      </div>
    \` : ''}
  \`;
  if (you && you.status === 'alive') {
    document.getElementById('btnInqYes')?.addEventListener('click', async ()=>{ await apiPostAction({ action:'vote_inquiry', choice:true }); toast('رأی موافق ثبت شد'); pollLoop(); });
    document.getElementById('btnInqNo')?.addEventListener('click', async ()=>{ await apiPostAction({ action:'vote_inquiry', choice:false }); toast('رأی مخالف ثبت شد'); pollLoop(); });
  }
}

/* ---------------- EVENTS / TIMELINE ---------------- */
function renderTimeline(g){
  const panel = document.getElementById('timelinePanel');
  const items = g.timeline || [];
  if (!items.length){
    panel.innerHTML = \`<div class="empty-note"><span class="big">🕯</span>هنوز اتفاقی ثبت نشده</div>\`;
    return;
  }
  panel.innerHTML = items.map(it => \`
    <div class="tl-item">
      <div class="tl-icon">\${it.icon||'•'}</div>
      <div>
        <div class="tl-head">\${escapeHtml(it.head||'')}</div>
        <div class="tl-text">\${escapeHtml(it.text||'')}</div>
      </div>
    </div>
  \`).join('');
}

/* ---------------- END GAME ---------------- */
function renderEndgame(g, you){
  const panel = document.getElementById('votePanel');
  const winnerLabel = { mafia:'🎭 مافیا برنده شد', town:'🏘 شهروندان برنده شدند', independent:'🃏 مستقل برنده شد' }[g.winner] || 'بازی تمام شد';
  panel.innerHTML = \`
    <div class="endgame-banner">
      <div class="emoji">🏆</div>
      <h2>\${winnerLabel}</h2>
      <p>نتیجه نهایی بازی</p>
    </div>
    <div>
      \${(g.players||[]).map(p=>{
        const meta = ROLE_META[p.independentRole || p.role] || {};
        return \`<div class="reveal-row">
          <div class="reveal-left"><span>\${p.status==='alive'?'🟢':'💀'}</span><span class="reveal-name">\${escapeHtml(p.displayName)}</span></div>
          <span class="reveal-role">\${meta.emoji||''} \${meta.name||'—'}</span>
        </div>\`;
      }).join('')}
    </div>
  \`;
}

/* ---------------- BOOT ---------------- */
if (CHAT_ID) {
  document.getElementById('view-lobby-init').classList.remove('active');
  startPolling();
}
</script>
</body>
</html>
`;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  telegram_id INTEGER PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  started_bot INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  recent_roles TEXT,
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
  updated_at INTEGER NOT NULL,
  state_json TEXT,
  last_group_message_id INTEGER
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
CREATE TABLE IF NOT EXISTS kill_admins (
  user_id INTEGER PRIMARY KEY,
  added_by INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
`;

async function ensureSchema(db: D1Database): Promise<void> {
  const statements = SCHEMA_SQL.split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => db.prepare(s));
  await db.batch(statements);
  // FIX #2 (+ follow-up): `games` and `game_players` may already exist from
  // before some columns were introduced. CREATE TABLE IF NOT EXISTS above
  // won't add columns to an already-existing table, so migrate both
  // explicitly. ALTER TABLE ... ADD COLUMN has no "IF NOT EXISTS" form in
  // SQLite, so we probe for each column and swallow the "duplicate column"
  // error if a concurrent DO instance already added it. This is what was
  // causing every join/persist to fail in production with
  // "table game_players has no column named independent_role" — the table
  // pre-dated that column being added to SCHEMA_SQL and was never migrated.
  const tableMigrations: Record<string, Record<string, string>> = {
    users: {
      recent_roles: "TEXT",
    },
    games: {
      state_json: "TEXT",
      last_group_message_id: "INTEGER",
    },
    game_players: {
      role: "TEXT",
      team: "TEXT",
      independent_role: "TEXT",
      status: "TEXT NOT NULL DEFAULT 'alive'",
      death_reason: "TEXT",
      death_phase: "TEXT",
      death_round: "INTEGER",
      original_member_json: "TEXT",
    },
    votes: {
      weight: "INTEGER NOT NULL DEFAULT 1",
    },
    verdict_votes: {
      guilty: "INTEGER NOT NULL DEFAULT 0",
      weight: "INTEGER NOT NULL DEFAULT 1",
    },
    night_actions: {
      target_role: "TEXT",
    },
  };
  for (const [table, columns] of Object.entries(tableMigrations)) {
    try {
      const cols = await db.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
      const names = new Set((cols.results ?? []).map((c) => c.name));
      for (const [column, type] of Object.entries(columns)) {
        if (names.has(column)) continue;
        try {
          await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
        } catch (err) {
          console.error("ensureSchema: migration failed", table, column, err);
        }
      }
    } catch (err) {
      console.error("ensureSchema: column probe failed", table, err);
    }
  }
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

// A NATO guess can target the game's flavor role (RoleId) OR, when the
// target happens to be the independent player, their true independent
// identity (IndependentRoleId) — see the note on `assignRoles` and the
// nato_guess resolution in `resolveNight`.
export type GuessableRoleId = RoleId | IndependentRoleId;

export type GunType = "war" | "black";

export type PlayerStatus = "alive" | "dead" | "left";

export type GameStatus =
  | "idle"
  | "lobby"
  | "starting"
  | "night"
  | "inquiry"
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
  | "inquiry"
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
  | "joker"
  | "admin_kill"
  | "role_leak";

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
  | "johnny_kill"
  | "gunner_give_war"
  | "gunner_give_black";

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
  // Set only by checkLecterSuccession when this player is promoted to
  // Godfather mid-game (their `.role` becomes "godfather" at that point).
  // Purely for end-game report text ("پدرخوانده (دکتر لکتر سابق)" /
  // "پدرخوانده (ناتو سابق)") — does not affect any game logic, abilities,
  // or the succession system itself.
  promotedFrom?: "lecter" | "nato";
}

export interface NightAction {
  actorId: number;
  type: NightActionType;
  targetId: number | null;
  targetRole?: GuessableRoleId | null;
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

export interface InquiryVote {
  voterId: number;
  choice: boolean;
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
  inquiryVotes: InquiryVote[];
  cityInquiryCount: number;
  pendingInquiryDeaths: DeathRecord[] | null;
  accusedUserId: number | null;
  temporaryCourtAdminUserId: number | null;
  silencedUserIds: number[];
  blockedUserIds: number[];
  escortBlockedUserIds: number[];
  doctorSelfHealUsedBy: number[];
  sniperShotsLeft: Record<string, number>;
  detectiveChecked: Record<string, number[]>;
  godfatherRevealed: boolean;
  natoChancesLeft: number;
  paranoidAlertLeft: number;
  bomberMarkedTargets: number[];
  invincibleShieldHits: Record<string, number>;
  // gunnerGuns holds guns currently held by RECIPIENTS (any player the gunner
  // has given a gun to that night) — not guns held by the gunner themself.
  gunnerGuns: Record<string, GunType[]>;
  // Total nights (max 2) the gunner has *successfully* completed a full
  // war+black distribution. Only increments when both guns are delivered —
  // a skipped or incomplete night never consumes one of the 2 chances.
  gunnerNightsUsed: number;
  gunnerWarGunsGiven: number;
  gunnerBlackGunsGiven: number;
  independentRoleType: IndependentRoleId | null;
  savedDefaultPermissions: ChatPermissions | null;
  lastGroupMessageId: number | null;
  pinnedMessageId: number | null;
  // Every message ID the bot has pinned during THIS game (lobby card, phase
  // updates, game-over message, etc.) — Telegram allows many simultaneous
  // pins and only exposes the single latest one via getChat, so this is the
  // only reliable way to know "everything the bot pinned" for /delpin and
  // the end-of-game pin cleanup. See pin()/unpinAllBotPins().
  botPinnedMessageIds: number[];
  winner: Team | null;
  botUsername: string | null;
  botId: number | null;
  config: GameConfig;
  createdAt: number;
  updatedAt: number;
  startedAt: number | null;
  finishedAt: number | null;
  lobbyCode: string | null;
  dayStartedAt: number | null;
  miniAppChat: Array<{id: number, senderId: number, senderName: string, text: string, time: number, isSystem: boolean}>;
  // Anti role-leak system: per-user warning count for THIS game only (keyed
  // by userId as a string, since GameState is persisted as JSON). Reset to
  // empty for every new game — never shared across games. See
  // handleGroupTextForRoleLeak / eliminateForRoleLeak.
  roleLeakWarnings: Record<string, number>;
  // True only for lobbies created directly in the mini app (chatId is a synthetic
  // negative number, not a real Telegram group). Group-only mechanics — admin checks,
  // permission locking/unlocking, posting to "the group" — don't apply and must be
  // skipped, since there is no real Telegram chat behind them to call the Bot API on.
  isVirtual: boolean;
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
    status === "inquiry" ||
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
    status === "inquiry" ||
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
  // Optional: set via `wrangler secret put DEEPSEEK_API_KEY` to override the
  // hardcoded fallback key below without redeploying code.
  DEEPSEEK_API_KEY?: string;
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

// Picks a random index using crypto randomness, weighted by `weights`
// (all weights must be >= 0). Falls back to a uniform pick if every
// weight is zero, so a role is never truly impossible to draw.
function weightedPickIndex(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  if (total <= 0) return buf[0]! % weights.length;
  const r = (buf[0]! / 0x100000000) * total;
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i]!;
    if (r < acc) return i;
  }
  return weights.length - 1;
}

// Lower weight = less likely to be picked for this role. A role that
// shows up in the player's recent history gets penalized, and more so the
// more recently they had it — so getting the SAME role again right away
// is unlikely, while it's not literally impossible (keeps things random).
function roleWeight(role: RoleId, history: RoleId[]): number {
  let weight = 100;
  for (let i = 0; i < history.length; i++) {
    if (history[i] === role) {
      const recency = i + 1; // more recent entries are later in the array
      weight -= 30 * recency;
    }
  }
  return Math.max(weight, 5);
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

// Plain-text trigger words (no leading "/") that a user can DM the bot to
// leave/close a stuck lobby, for people who don't know or can't run bot
// commands. Kept as a small explicit allowlist on purpose — this cancels a
// whole lobby, so it should never fire on a stray word inside normal chat.
const LEAVE_KEYWORDS = new Set(["لفت", "لفت شدم", "خروج", "لغو لابی", "کنسل لابی"]);
export function isLeaveKeyword(text: string): boolean {
  return LEAVE_KEYWORDS.has(text.trim());
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
  reply_to_message?: TgMessage;
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

  deleteMessage(chatId: number, messageId: number) {
    return this.call("deleteMessage", {
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

export function inquiryKeyboard(dayNumber: number): InlineKeyboard {
  return [
    [
      { text: "✅ بله", callback_data: `INQ${dayNumber}:1` },
      { text: "❌ خیر", callback_data: `INQ${dayNumber}:0` },
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
    // Godfather's kill target list (also used identically by any promoted
    // successor — Lecter or NATO — once their `.role` becomes "godfather",
    // since this filter runs purely off `p.team`, not off role/actor
    // identity). Must be: all living players except living mafia teammates
    // (the actor's own team) — this deliberately includes Independents,
    // who are NOT on the "mafia" team and must never be filtered out here
    // just because they aren't "town" either.
    if (type === "mafia_kill") return p.team !== "mafia";
    if (type === "heal" && actor?.role === "lecter") return p.team === "mafia";
    if (type === "nato_guess") return p.team !== "mafia";
    // Johnny is the game's sole Independent, so there's never another
    // Independent to exclude. His kill panel is simply every living player
    // except himself — no team/role filter at all.
    if (type === "johnny_kill") return true;
    return true;
  });
}

// Paranoid's night panel is a plain yes/no on staying alert — never a
// player or role list. Backend semantics are untouched: it still rides the
// existing generic "N{night}:paranoid_alert:{targetId}" route into
// applyNightAction/resolveNight, which already treats targetId>0 (self) as
// "alert active" and targetId=0 (skip) as "alert inactive" — see the
// paranoid_alert handling in resolveNight. Only the keyboard changes.
export function paranoidDecisionKeyboard(actorId: number, nightNumber: number): InlineKeyboard {
  return [
    [{ text: "🛡 امشب هوشیار می‌مانم", callback_data: `N${nightNumber}:paranoid_alert:${actorId}` }],
    [{ text: "❌ نمی‌خواهم امشب هوشیار باشم", callback_data: `N${nightNumber}:paranoid_alert:0` }],
  ];
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

// Gunner's war-gun step: any living player except the gunner. Has a skip
// button ("امشب نمی‌خواهم تفنگ بدهم") — declining here is the ONLY skip
// point in the gunner's two-step flow.
export function gunnerWarKeyboard(
  players: Player[],
  gunnerId: number,
  nightNumber: number,
): InlineKeyboard {
  const targets = players.filter((p) => p.userId !== gunnerId);
  return playerButtons(targets, `GW${nightNumber}:`, [
    { text: "⏭ امشب نمی‌خواهم تفنگ بدهم", data: `GW${nightNumber}:0` },
  ]);
}

// Gunner's black-gun step: any living player except the gunner AND except
// whoever just received the war gun this same night. Deliberately has no
// skip button — the gunner must complete this to deliver either gun.
export function gunnerBlackKeyboard(
  players: Player[],
  gunnerId: number,
  warRecipientId: number,
  nightNumber: number,
): InlineKeyboard {
  const targets = players.filter((p) => p.userId !== gunnerId && p.userId !== warRecipientId);
  return playerButtons(targets, `GB${nightNumber}:`);
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
    description: "عضو مافیا هستید. هر شب می‌توانید نقش یک بازیکن غیرمافیا را حدس بزنید. اگر درست حدس بزنید، آن بازیکن کشته می‌شود. در کل بازی ۲ شانس دارید (حدس درست یا اشتباه، هر دو یک شانس مصرف می‌کنند).",
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
    description: "در کل بازی فقط ۲ شب می‌توانید تفنگ توزیع کنید. هر شب یک تفنگ جنگی و یک تفنگ مشقی به دو بازیکن زندهٔ متفاوت (هرگز به خودتان) می‌دهید؛ اگر هرکدام را کامل نکنید هیچ تفنگی تحویل داده نمی‌شود و فرصتتان هدر نمی‌رود. گیرنده تا لحظهٔ شلیک نمی‌داند چه نوع تفنگی دارد؛ تفنگ جنگی هدف را همان لحظه حذف می‌کند، تفنگ مشقی بی‌اثر است.",
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
  return 2;
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

// BUGFIX (fair role distribution): roleHistory (each player's last few
// roles, most recent last) lets this weight its random picks away from a
// role a player just had, instead of a plain uniform shuffle that could
// hand the same person the same role 4-5 games running. Composition
// guarantees are unchanged — every roleList role still lands exactly once
// among the non-independent players, just via weighted-random selection
// instead of a straight positional zip; still fully random, just less
// repetitive.
export function assignRoles(players: Player[], roleHistory: Record<number, RoleId[]> = {}): Player[] {
  const playerCount = players.length;
  const roleList = buildRoleListNew(playerCount); // exactly playerCount - 1 entries by design

  // Select independent role
  const indieRoles: IndependentRoleId[] = ["johnny", "joker", "bomber", "lonewolf"];
  const indieIndex = Math.floor(Math.random() * indieRoles.length);
  const indieRole = indieRoles[indieIndex];

  // BUGFIX: roleList (playerCount - 1 distinct roles) and the shuffled
  // player order used to be paired up by shuffling BOTH a "roleList + one
  // random duplicate" array and the players array independently, then
  // assuming the duplicate would land on the last (independent) player.
  // Since the two shuffles are independent, that's only true ~2/N of the
  // time; the rest of the time some real town/mafia role went missing
  // entirely (assigned to the independent slot) while a different role got
  // duplicated onto two real players — breaking the intended composition
  // (e.g. a game with no real Doctor, or two Detectives).
  //
  // Fix: assign roleList 1:1 to the first (playerCount - 1) shuffled
  // players ONLY, so every intended role always exists exactly once among
  // real town/mafia players. The last shuffled player always becomes the
  // independent role; their `.role` field is purely cosmetic flavor text
  // (night-action logic and win-checks key off `independentRole`/`team`,
  // never off `.role` for independent players) and can't disturb the real
  // composition since it never consumes a roleList slot.
  const shuffledPlayers = shuffle([...players]);
  const indiePlayer = shuffledPlayers[playerCount - 1]!;
  const rolePlayers = shuffledPlayers.slice(0, playerCount - 1);
  const flavorRole = roleList[Math.floor(Math.random() * roleList.length)]!;

  // Weighted-random 1:1 assignment: go through the roles in random order
  // and, for each one, weight-pick which remaining player gets it based on
  // how recently (if ever) they had that exact role.
  const shuffledRoles = shuffle([...roleList]);
  const remainingPlayers = [...rolePlayers];
  const roleByUserId = new Map<number, RoleId>();
  for (const role of shuffledRoles) {
    const weights = remainingPlayers.map((p) => roleWeight(role, roleHistory[p.userId] ?? []));
    const idx = weightedPickIndex(weights);
    const chosen = remainingPlayers[idx]!;
    roleByUserId.set(chosen.userId, role);
    remainingPlayers.splice(idx, 1);
  }

  const assigned = shuffledPlayers.map((p) => {
    const isIndie = p.userId === indiePlayer.userId;
    const role = isIndie ? flavorRole : roleByUserId.get(p.userId)!;
    const def = ROLES[role];

    return {
      ...p,
      role,
      team: isIndie ? ("independent" as const) : def.team,
      independentRole: isIndie ? indieRole : null,
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

// BUGFIX: Johnny ("survive until town wins") and Bomber ("survive until
// town or mafia wins") both win by being alive when the OTHER team's
// win is declared — a case distinct from the "last one standing" outright
// independent win already handled by checkIndependentWinner. Because their
// `team` is forced to "independent" (so they never count toward mafia/town
// totals), a plain `p.team === winner` check never credits them even though
// they met their own stated win condition. This returns the userIds of any
// such players so callers (stats + the game-over announcement) can credit
// and display them alongside the declared team winner instead of silently
// leaving them out.
export function getSharedWinnerIds(players: Player[], winner: Team): number[] {
  return players
    .filter((p) => p.status === "alive" && p.independentRole)
    .filter((p) => {
      if (p.independentRole === "johnny") return winner === "town";
      if (p.independentRole === "bomber") return winner === "town" || winner === "mafia";
      return false;
    })
    .map((p) => p.userId);
}

export function dayDurationSeconds(game: GameState): number {
  // BUGFIX: this used to scale off living(game.players).length — the
  // number of players CURRENTLY alive. Since players never get removed
  // from the array (applyDeaths only flips their status, see above), that
  // count silently shrinks every round as people die, so day 2/3/4 would
  // get progressively shorter (sometimes down to the 90s floor) even
  // though the host never changed any setting. Day length should scale
  // with how big the LOBBY was, not how many people happen to still be
  // alive right now — so use the fixed original player count instead,
  // which stays constant for the whole game and always yields the exact
  // duration implied by the configured settings.
  const n = game.players.length;
  const raw = game.config.daySecondsBase + game.config.daySecondsPerPlayer * n;
  return Math.min(game.config.daySecondsMax, Math.max(90, raw));
}

export function getTownRoles(): RoleId[] {
  return Object.entries(ROLES)
    .filter(([_, def]) => def.team === "town")
    .map(([id, _]) => id as RoleId);
}

// Every role actually in play in this specific game: the (mafia/town) flavor
// role of every player, plus the game's one independent role (if any) —
// used to build NATO's role-guess panel. Independent role is listed once
// under its own id (not the flavor role dressing the independent player),
// since that's what a NATO guess must actually match against.
export function gameRolesInPlay(game: GameState): Array<{ id: GuessableRoleId; emoji: string; name: string }> {
  const seen = new Set<GuessableRoleId>();
  const result: Array<{ id: GuessableRoleId; emoji: string; name: string }> = [];
  for (const p of game.players) {
    if (p.independentRole) continue; // listed separately below, not by flavor role
    if (!p.role || seen.has(p.role)) continue;
    seen.add(p.role);
    const def = ROLES[p.role];
    result.push({ id: p.role, emoji: def.emoji, name: def.name });
  }
  if (game.independentRoleType && !seen.has(game.independentRoleType)) {
    seen.add(game.independentRoleType);
    const def = INDEPENDENT_ROLES[game.independentRoleType];
    result.push({ id: game.independentRoleType, emoji: def.emoji, name: def.name });
  }
  return result;
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
    case "gunner":
      return ["gunner_give_war"];
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

    // NATO out of chances counts as done immediately — same idea as gunner
    // above, so an exhausted NATO never blocks the night from ending early.
    if (p.role === "nato" && game.natoChancesLeft <= 0) return true;

    // Gunner's two-step give flow is all-or-nothing: out of chances counts
    // as done; an explicit skip (war action with a null target) counts as
    // done; otherwise both the war AND black picks must be present.
    if (p.role === "gunner") {
      if (game.gunnerNightsUsed >= 2) return true;
      const warAction = game.nightActions.find(
        (a) => a.actorId === p.userId && a.type === "gunner_give_war" && a.nightNumber === game.nightNumber,
      );
      if (!warAction) return false;
      if (warAction.targetId === null) return true;
      return game.nightActions.some(
        (a) => a.actorId === p.userId && a.type === "gunner_give_black" && a.nightNumber === game.nightNumber,
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
  const markDead = (userId: number, reason: DeathRecord["reason"], opts?: { bypassShield?: boolean }) => {
    if (dead.has(userId)) return;
    const p = findPlayer(game.players, userId);
    if (!p || p.status !== "alive" || !p.role) return;
    if (!opts?.bypassShield && p.role === "invincible" && p.team === "town") {
      const key = String(userId);
      const hits = (game.invincibleShieldHits[key] ?? 0) + 1;
      game.invincibleShieldHits[key] = hits;
      if (hits < 3) {
        shieldAbsorbed.push(userId);
        return;
      }
    }
    dead.add(userId);
    // Central place for "real identity at death": an independent player's
    // `.role` is cosmetic flavor text, so revealedIndependentRole must always
    // be read here from the player record itself, not passed in ad hoc by
    // every call site (that's exactly how it went missing before).
    deaths.push({ userId, reason, revealedRole: p.role, revealedIndependentRole: p.independentRole ?? undefined });
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
        if (target?.status === "alive" && target.team !== "mafia") {
          // The independent player's `.role` is cosmetic flavor text (see
          // assignRoles); their real identity is `.independentRole`.
          const actualRole: GuessableRoleId | null = target.independentRole ?? target.role;
          natoTarget = a.targetId;
          if (actualRole === a.targetRole) {
            natoGuessCorrect = true;
            // A correct NATO guess is a direct result: only Escort
            // blocking NATO before this action ran (already filtered out
            // of `active`, above) can stop it. Doctor/Lecter Save
            // (protectedIds) and the Tough Guy shield (invincible) must
            // NOT be able to neutralize or soften it, unlike a normal
            // shot — hence bypassShield here and no protectedIds check.
            // Paranoid's alert/retaliation mechanic is intentionally left
            // exactly as-is (see the paranoid-alert section below).
            if (!paranoidAlerts.has(a.targetId)) {
              markDead(a.targetId, "nato", { bypassShield: true });
            }
          } else {
            natoGuessCorrect = false;
          }
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
    if (paranoidAlerts.has(target.userId)) {
      // Target is an alert paranoid: paranoid is fully immune this night,
      // no matter the target's team — the attacker (sniper) dies instead.
      // Checked BEFORE protectedIds/team logic so nothing can bypass it.
      markDead(actor.userId, "paranoid_alert");
      continue;
    }
    if (protectedIds.has(target.userId)) continue;
    if (target.team === "mafia") {
      // Correct target: only the mafia member dies.
      markDead(target.userId, "sniper");
    } else if (target.team === "independent") {
      // Independent is its own team, never a "wrong" (town) target — only
      // the independent dies, sniper is never penalized for this.
      markDead(target.userId, "sniper");
    } else {
      // Wrong target (town): only the sniper dies as a penalty, target survives.
      markDead(actor.userId, "sniper_penalty");
    }
  }

  // 4. Process Johnny kills
  for (const a of active) {
    if (a.type !== "johnny_kill" || !a.targetId || a.targetId <= 0) continue;
    const johnny = findPlayer(game.players, a.actorId);
    if (!johnny || johnny.status !== "alive" || johnny.independentRole !== "johnny") continue;
    if (paranoidAlerts.has(a.targetId)) {
      // Target is an alert paranoid: paranoid is fully immune this night —
      // Johnny (the attacker) dies instead. Checked before protectedIds so
      // nothing can bypass it.
      markDead(a.actorId, "paranoid_alert");
      continue;
    }
    if (protectedIds.has(a.targetId)) continue;
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
    const bomberAction = active.find((a) => {
      if (a.type !== "bomber_explode") return false;
      const bomber = findPlayer(game.players, a.actorId);
      return bomber?.status === "alive" && bomber.independentRole === "bomber";
    });
    for (const targetId of game.bomberMarkedTargets) {
      if (dead.has(targetId)) continue;
      const target = findPlayer(game.players, targetId);
      if (!target || target.status !== "alive") continue;
      if (paranoidAlerts.has(targetId)) {
        // Target is an alert paranoid: paranoid is fully immune this night —
        // the bomber (attacker) dies instead, this target is spared. Other
        // marked targets in the same explosion are unaffected.
        if (bomberAction && !dead.has(bomberAction.actorId)) {
          markDead(bomberAction.actorId, "paranoid_alert");
        }
        continue;
      }
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
        // Lonewolf gets the target's true identity — for an independent
        // target that's their independentRole, never the cosmetic base role.
        const result = target.independentRole
          ? independentRoleLabel(target.independentRole)
          : (target.role ? roleLabel(target.role) : "نامشخص");
        investigations.push({ actorId: actor.userId, targetId: target.userId, result });
      } else if (actor.role === "detective" && actor.status === "alive") {
        // Detective gets town/mafia/independent. Special case: the Godfather
        // reads as "town" the first time he's ever investigated (by anyone),
        // and only shows up as mafia from the second investigation onward.
        // Every other mafia member always shows mafia, from the first check.
        let result: string;
        if (target.role === "godfather") {
          result = game.godfatherRevealed ? "مافیا" : "شهروند";
          game.godfatherRevealed = true;
        } else if (target.team === "mafia") {
          result = "مافیا";
        } else if (target.team === "independent") {
          result = "مستقل";
        } else {
          result = "شهروند";
        }
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

// Central Godfather succession check. Must run after EVERY death path
// (night resolution, lynch, joker self-elimination, gunner shot, host
// removal, etc.) so a dead Godfather is always immediately followed by a
// successor — not just at night's end. Priority order: Doctor Lecter first
// (if alive), otherwise NATO (if alive); if neither is alive, no successor
// is chosen. Mutates game.players in place — the promoted player's `.role`
// is actually reassigned to "godfather" (not just cosmetic), so every later
// piece of game logic (night keyboards, mafia-kill eligibility, etc.)
// correctly treats them as the Godfather and no longer as Lecter/NATO.
// Returns the promoted player (for a private notification) or null if no
// succession happened. Entirely silent as far as this function is
// concerned — it does not send any messages itself, so callers control
// exactly who finds out (see the "fully secret" requirement: only the
// promoted player is ever told, never the group).
export function checkLecterSuccession(game: GameState, deaths: DeathRecord[]): Player | null {
  // Guard: an independent player's `.role` is cosmetic flavor text (see
  // assignRoles) and can coincidentally read "godfather" too — so this must
  // confirm the death was the REAL Godfather (team === "mafia"), not just
  // match on revealedRole, or an eliminated Joker/Bomber with "godfather"
  // flavor would wrongly trigger a promotion.
  const godfatherDied = deaths.some((d) => {
    if (d.revealedRole !== "godfather") return false;
    const p = findPlayer(game.players, d.userId);
    return p?.team === "mafia";
  });
  if (!godfatherDied) return null;
  const lecter = game.players.find((p) => p.role === "lecter" && p.status === "alive");
  if (lecter) {
    lecter.role = "godfather";
    lecter.promotedFrom = "lecter";
    return lecter;
  }
  const nato = game.players.find((p) => p.role === "nato" && p.status === "alive");
  if (nato) {
    nato.role = "godfather";
    nato.promotedFrom = "nato";
    return nato;
  }
  return null;
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

  if (list.length === 0) {
    return { tallies: list, eliminated: null, tied: false };
  }
  // Abstain (userId === null) now counts as a real bucket in the comparison:
  // if abstain ties or beats the top candidate, nobody goes to trial.
  const top = list[0]!;
  if (top.votes <= 0) {
    return { tallies: list, eliminated: null, tied: false };
  }
  const tiedWithTop = list.filter((t) => t.votes === top.votes);
  if (tiedWithTop.length > 1) {
    return { tallies: list, eliminated: null, tied: true };
  }
  if (top.userId === null) {
    // Abstain won outright — no one is put on trial.
    return { tallies: list, eliminated: null, tied: false };
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

export interface InquiryResolution {
  yes: number;
  no: number;
  tied: boolean;
  approved: boolean;
}

// A tie is deliberately its own outcome (neither approved nor a clean
// decline) — the caller must not announce a tally when tied.
export function resolveInquiry(votes: InquiryVote[], dayNumber: number): InquiryResolution {
  const dayVotes = votes.filter((v) => v.dayNumber === dayNumber);
  let yes = 0;
  let no = 0;
  for (const v of dayVotes) {
    if (v.choice) yes += 1;
    else no += 1;
  }
  const tied = yes === no;
  return { yes, no, tied, approved: !tied && yes > no };
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
  startGameFailed: "شروع بازی با خطا مواجه شد و بازی به‌صورت خودکار لغو شد. لطفاً دوباره /startgame یا /new را امتحان کنید.",
  joinFailedTransient: "⚠️ ورود شما به لابی با یک خطای موقت مواجه شد. لطفاً دوباره امتحان کنید.",
  lobbyCreateFailed: "⚠️ ساخت لابی به مشکل خورد. لطفاً دوباره /new را بزنید.",
  lobbyOnlyHere: "این دستور را در گروه بزنید.",
  resetAdminOnly: "برای ریست کردن بات در این گروه باید ادمین باشید.",
  delpinAdminOnly: "برای حذف پین‌های بات باید ادمین گروه باشید.",
  delpinNone: "هیچ پیام پین‌شده‌ای توسط بات پیدا نشد.",
  delpinDone(count: number): string {
    return `📌 <b>${count}</b> پیام پین‌شده توسط بات، آنپین شد.`;
  },
  resetDone: [
    "♻️ <b>بات ریست شد</b>",
    "همهٔ لابی‌ها و بازی‌های فعال این گروه غیرفعال شدند و بات دقیقاً مثل تازه اد شدن به گروه آماده است.",
    "برای شروع دوباره /new را بزنید.",
  ].join("\n"),
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

    // BUGFIX: independent players (johnny/joker/bomber/lonewolf) also carry
    // a second, purely-cosmetic "flavor" role on player.role (assigned only
    // so every Player object has *some* RoleId — see assignRoles). Their own
    // role card was showing that decoy role's name/description ABOVE the
    // real independent-role info, effectively handing them a role they
    // don't actually have. An independent player should see ONLY their real
    // (independent) role — never the flavor role.
    if (player.independentRole) {
      const indieDef = INDEPENDENT_ROLES[player.independentRole];
      return [
        `🎭 نقش شما: <b>${indieDef.emoji} ${indieDef.name}</b>`,
        `تیم: <b>${teamLabel(player.team)}</b>`,
        "",
        indieDef.description,
        `هدف: ${indieDef.winCondition}`,
        "",
        "این پیام محرمانه است. نقش خود را فاش نکنید مگر طبق قوانین بازی.",
      ].join("\n");
    }

    const def = ROLES[player.role];
    const teamLines = player.team === "mafia" && teammates.length
      ? ["", "<b>هم‌تیمی‌های مافیا:</b>", ...teammates.map((t) => `• ${esc(t.displayName)} — ${roleLabel(t.role)}`)]
      : [];

    return [
      `🎭 نقش شما: <b>${def.emoji} ${def.name}</b>`,
      `تیم: <b>${teamLabel(player.team)}</b>`,
      "",
      def.description,
      ...teamLines,
      "",
      "این پیام محرمانه است. نقش خود را فاش نکنید مگر طبق قوانین بازی.",
    ].join("\n");
  },

  gameStarted(n: number, mafiaN: number, indieRole: IndependentRoleId | null): string {
    // BUGFIX: this used to name the independent role (e.g. "🧨 بمب‌گذار")
    // directly in the GROUP announcement, in front of every player — instead
    // of keeping it secret like every other role. Only the player count
    // should be public here; the actual identity/role only goes out in the
    // private role-card DM.
    const indieLine = indieRole ? `\nتعداد مستقل: 1` : "";
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

  // Sent ONLY in the promoted player's own PV — never anywhere public. See
  // checkLecterSuccession / notifyLecterSuccession for why this must stay
  // completely invisible to the group and other mafia members.
  lecterSuccession(): string {
    return "🎩 پدرخوانده کشته شد.\nاز این لحظه، تو پدرخوانده جدید مافیا هستی.";
  },

  natoPrompt(seconds: number, chancesLeft: number): string {
    return [
      "💣 <b>نوبت اقدام شبانه — 💣 ناتو</b>",
      "",
      "یک بازیکن غیرمافیا را انتخاب کنید و نقش او را حدس بزنید.",
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
  lecterTownTarget: "دکتر لکتر فقط می‌تواند از اعضای تیم مافیا محافظت کند.",
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

  playerDied(name: string, userId: number, team: Team | null, reason: string): string {
    return `💀 ${mention(userId, name)} از بازی حذف شد.\nعلت: ${reason}\nسمت: <b>${teamLabel(team)}</b>`;
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
  reasonAdminKill: "حذف توسط مدیریت",
  reasonRoleLeak: "نقض قوانین بازی",

  roleLeakWarned(count: number, limit: number): string {
    return `⚠️ پیام شما در گروه به دلیل احتمال لو دادن نقش/اطلاعات بازی حذف شد.\nاخطار ${count} از ${limit}.\nدر صورت تکرار، از بازی حذف خواهید شد.`;
  },

  roleLeakEliminated(limit: number): string {
    return `🚫 به دلیل دریافت ${limit} اخطار برای لو دادن نقش، از بازی حذف شدید.`;
  },

  roleLeakGroupNotice(name: string, userId: number): string {
    return `🚫 ${mention(userId, name)} به دلیل نقض قوانین بازی از بازی حذف شد.`;
  },

  gunnerReceivedGun: "🔫 شما یک تفنگ دریافت کردید.",

  gunnerPanelPrompt: "🔫 می‌توانید با تفنگتان روی یکی از بازیکنان زنده شلیک کنید:",

  gunnerFired(name: string, targetName: string): string {
    return `🔫 کاربر ${esc(name)} یک تفنگ داشت.\nتفنگش را روی ${esc(targetName)} گذاشت و شلیک کرد.`;
  },

  gunnerBlackMiss: "تیر مشقی بود و اتفاقی نیفتاد.",

  gunnerWarPrompt(seconds: number): string {
    return ["🔫 به چه کسی می‌خواهی تفنگ جنگی بدهی؟", `⏱ ${seconds} ثانیه`].join("\n");
  },
  gunnerWarChosen(name: string): string {
    return `دریافت شد. تفنگ جنگی برای ${esc(name)} ثبت شد.`;
  },
  gunnerWarSkipped: "دریافت شد. امشب تفنگی نمی‌دهید.",
  gunnerBlackPrompt: "🔫 به چه کسی می‌خواهی تفنگ مشقی بدهی؟",
  gunnerBlackChosen(name: string): string {
    return `دریافت شد. تفنگ مشقی برای ${esc(name)} ثبت شد.`;
  },
  gunnerCannotSelf: "به خودت نمی‌توانی تفنگ بدهی.",
  gunnerNoNightsLeft: "دیگر فرصتی برای توزیع تفنگ ندارید.",
  gunnerMustChooseWarFirst: "ابتدا باید گیرندهٔ تفنگ جنگی را انتخاب کنید.",
  gunnerSameRecipient: "این بازیکن همین امشب تفنگ جنگی گرفته است؛ نمی‌تواند تفنگ مشقی هم بگیرد.",
  // FIX: shown when a gunner who has already completed BOTH guns for the
  // current night clicks a stale/old panel (or otherwise re-triggers the
  // give-gun flow). Exact wording per spec.
  gunnerNightAlreadyDone: "⛔ نمی‌توانید مجدداً تفنگ بدهید.\nتفنگ جنگی و مشقی امشب قبلاً تحویل داده‌شده‌اند.",
  gunnerWarAlreadyGiven: "⛔ شما همین امشب قبلاً تفنگ جنگی داده‌اید.",
  gunnerBlackAlreadyGiven: "⛔ شما همین امشب قبلاً تفنگ مشقی داده‌اید.",

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

  verdictResult(name: string, userId: number, res: VerdictResolution, team: Team | null): string {
    const lines = [
      `⚖️ <b>نتیجهٔ دادگاه</b>`,
      "",
      `گناهکار: ${res.guilty} | بی‌گناه: ${res.innocent}`,
      "",
    ];
    if (res.result === "guilty") {
      lines.push(`💀 ${mention(userId, name)} گناهکار شناخته شد و اعدام شد.`);
      lines.push(`سمت: <b>${teamLabel(team)}</b>`);
    } else {
      lines.push(`🕊 ${mention(userId, name)} تبرئه شد و به بازی برمی‌گردد.`);
    }
    return lines.join("\n");
  },

  gameOver(winner: Team, players: Player[], indieRole: IndependentRoleId | null, sharedWinnerIds: number[] = []): string {
    let title: string;
    if (winner === "town") title = "🏆 <b>شهروندان برنده شدند</b>";
    else if (winner === "mafia") title = "🏆 <b>مافیا برنده شد</b>";
    else title = "🏆 <b>نقش مستقل برنده شد</b>";
    
    const indieLine = indieRole ? `\n🎭 نقش مستقل: ${INDEPENDENT_ROLES[indieRole].emoji} ${INDEPENDENT_ROLES[indieRole].name}` : "";

    // BUGFIX: Johnny/Bomber can win *alongside* the announced team winner by
    // surviving to see it happen — call that out explicitly so it's not lost
    // in the roster below.
    const sharedSet = new Set(sharedWinnerIds);
    const sharedNames = players.filter((p) => sharedSet.has(p.userId)).map((p) => esc(p.displayName));
    const sharedLine = sharedNames.length
      ? `\n🎉 ${sharedNames.join("، ")} هم با زنده ماندن تا این لحظه، در این برد سهیم است.`
      : "";
    
    const list = players
      .map((p) => {
        const mark = p.status === "alive" ? "●" : "○";
        const roleStr = p.independentRole 
          ? `${INDEPENDENT_ROLES[p.independentRole].emoji} ${INDEPENDENT_ROLES[p.independentRole].name}`
          : roleLabel(p.role) + (p.promotedFrom === "lecter" ? " (دکتر لکتر سابق)" : p.promotedFrom === "nato" ? " (ناتو سابق)" : "");
        const winTag = sharedSet.has(p.userId) ? " 🏆" : "";
        return `${mark} ${esc(p.displayName)} — ${roleStr}${winTag}`;
      })
      .join("\n");
      
    return [
      "🏁 <b>پایان بازی</b>",
      title,
      indieLine,
      sharedLine,
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
    "/reset — ریست کامل بات در گروه (ادمین)",
    "/delpin — آنپین پیام‌های پین‌شده توسط بات (ادمین)",
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
  mafiaSawSave(actor: string, target: string): string {
    return `🩺 ${esc(actor)}، ${esc(target)} را سیو کرد.`;
  },
  mafiaSawNatoGuess(actor: string, target: string, roleName: string): string {
    return `🎯 ${esc(actor)} حدس زد: ${esc(target)} = ${esc(roleName)}`;
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
  restrictionsFailed(names: string[]): string {
    return `⚠️ تنظیم دسترسی این بازیکن(ها) با خطا مواجه شد: ${names.map(esc).join("، ")}. لطفاً دسترسی ادمین بات را بررسی کنید.`;
  },
  roleCardsFailed(names: string[]): string {
    return `⚠️ ارسال کارت نقش برای این بازیکن(ها) با خطا مواجه شد (احتمالاً بات را بلاک کرده‌اند): ${names.map(esc).join("، ")}.\nاین بازیکن‌ها می‌توانند با دستور /myrole در پیوی نقش خود را دریافت کنند.`;
  },
  defenseSkippedNoPromote(name: string, userId: number): string {
    return `⚖️ ${mention(userId, name)} به دادگاه احضار شد، اما چون بات دسترسی «ارتقاء اعضا» ندارد، مرحله‌ی دفاعیه رد می‌شود و مستقیم به رأی‌گیری نهایی می‌رویم.`;
  },
  courtDemotionFailed(name: string): string {
    return `⚠️ حذف دسترسی موقت دادگاه ${esc(name)} با خطا مواجه شد. بازی ادامه پیدا می‌کند، اما لطفاً دسترسی ادمین این کاربر را دستی بررسی کنید.`;
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

  cityInquiryPrompt(seconds: number, remaining: number): string {
    return [
      "🔎 <b>آیا می‌خواهید استعلام بگیرید؟</b>",
      "",
      "با موافقت شهر، نقش کسانی که امروز حذف شدند فاش می‌شود.",
      "فقط بازیکنان زندهٔ بازی می‌توانند رأی بدهند.",
      `تعداد استعلام باقی‌ماندهٔ شهر: <b>${remaining}</b>`,
      "",
      `⏱ ${seconds} ثانیه`,
    ].join("\n");
  },

  cityInquiryNotAllowed: "شما نمی‌توانید در این رأی‌گیری نظر دهید.",

  // Sent privately to a voter the moment their vote is registered.
  cityInquiryVotePrivate(choice: boolean): string {
    return choice
      ? "نتیجه شما ثبت شد، شما با استعلام موافقت کردید."
      : "نتیجه شما ثبت شد، شما با استعلام مخالفت کردید.";
  },

  // Live running tally posted to the group as votes come in — only the
  // count for the choice that was just cast/updated, singular vs plural
  // verb form depending on the count.
  cityInquiryVoteGroup(choice: boolean, count: number): string {
    const verb = count === 1 ? "کرد" : "کردند";
    return choice
      ? `${count} نفر با استعلام موافقت ${verb}.`
      : `${count} نفر با استعلام مخالفت ${verb}.`;
  },

  // Final tally, always shown once the 30s vote window ends — regardless
  // of whether it was approved, declined, or tied.
  cityInquiryResult(yes: number, no: number): string {
    return `نتیجه استعلام:\n\n${yes} نفر موافقت و ${no} نفر مخالفت کردند.`;
  },

  cityInquiryRolesRevealed(deaths: DeathRecord[], players: Player[], remaining: number): string {
    const lines = deaths.map((d) => {
      const p = findPlayer(players, d.userId);
      const name = p ? p.displayName : "؟";
      const roleStr = d.revealedIndependentRole
        ? `${INDEPENDENT_ROLES[d.revealedIndependentRole].emoji} ${INDEPENDENT_ROLES[d.revealedIndependentRole].name}`
        : roleLabel(d.revealedRole);
      return `• ${mention(d.userId, name)} — <b>${roleStr}</b>`;
    });
    return [
      "نقش بازیکنانی که امروز حذف شدند فاش شد:",
      "",
      ...lines,
      "",
      `استعلام باقی‌ماندهٔ شهر: ${remaining}`,
    ].join("\n");
  },
};

export function phaseFa(phase: string): string {
  switch (phase) {
    case "lobby": return "لابی";
    case "night": return "شب";
    case "inquiry": return "رأی‌گیری استعلام";
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
// KILL ADMIN — independent moderation feature.
// =============================================================================
// Deliberately isolated from Role / NightAction / Vote / Phase logic: nothing
// here reads or writes a RoleId, Team, NightAction, or Vote, and permission
// is decided purely from Telegram numeric user IDs — never username, display
// name, or reply "from" text. The super admin's ID is a fixed constant (not
// stored, so it can never be edited away); granted admins live in D1 (global,
// shared across every GameRoom Durable Object) so the list survives Worker
// restarts, Durable Object evictions, and redeploys.
export const SUPER_KILL_ADMIN_ID = 6337988032;

export async function isKillAdmin(db: D1Database, userId: number): Promise<boolean> {
  if (userId === SUPER_KILL_ADMIN_ID) return true;
  const row = await db.prepare("SELECT 1 FROM kill_admins WHERE user_id = ?").bind(userId).first();
  return row != null;
}

export async function addKillAdmin(db: D1Database, userId: number, addedBy: number): Promise<void> {
  await db
    .prepare("INSERT INTO kill_admins (user_id, added_by, created_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO NOTHING")
    .bind(userId, addedBy, Date.now())
    .run();
}

// =============================================================================
// ANTI ROLE-LEAK SYSTEM
//
// Two-stage pipeline for group text messages:
//   1) Cheap local keyword filter (this array) — pure trigger, decides
//      nothing on its own. No match -> message is ignored, no API call.
//   2) On a match, the message is sent to DeepSeek for real judgement.
//      See checkRoleLeakWithAI / handleGroupTextForRoleLeak in GameRoom.
//
// Edit ROLE_LEAK_TRIGGER_WORDS freely; matching is case-insensitive
// substring matching over the raw message text.
// =============================================================================

export const ROLE_LEAK_WARNING_LIMIT = 3;
export const ROLE_LEAK_CONFIDENCE_THRESHOLD = 0.6;
export const ROLE_LEAK_AI_TIMEOUT_MS = 4000;

// Hardcoded per user's request for convenience. Prefer setting this via
// `wrangler secret put DEEPSEEK_API_KEY` instead — if env.DEEPSEEK_API_KEY
// is set (as a secret), it always takes priority over this fallback.
const DEEPSEEK_API_KEY_FALLBACK = "sk-36be31427d1f434db826ddd221f45289";

export const ROLE_LEAK_TRIGGER_WORDS: string[] = [
  // نام نقش‌ها (فارسی)
  "دکتر", "پزشک", "کارگاه", "کارآگاه", "جاسوس", "اسنایپر", "تک‌تیرانداز", "تک تیرانداز",
  "پارانوئید", "پارانویید", "اسکورت", "مافیا", "گادفادر", "پدرخوانده", "جانی",
  "بمب‌گذار", "بمب گذار", "بمبی", "نتو", "تفنگدار", "گانر", "مستقل",
  // نام نقش‌ها (انگلیسی)
  "doctor", "sniper", "godfather", "escort", "gunner", "bomber",
  // فعل/عبارت‌های اکشن شب
  "سیو کردم", "نجات دادم", "شب زدم", "شب رفتم سراغ", "هدف گرفتم", "شلیک کردم",
  "زدمش", "کشتمش", "چک کردم", "تحقیق کردم", "شناسایی کردم", "انفجار دادم",
  "علامت زدم", "بلاک کردم", "هوشیار شدم", "هوشیار بودم", "حدس زدم", "گارد دادم",
  "محافظت کردم", "اسلحه دادم",
  // اعتراف مستقیم
  "من نقشم", "نقش من", "من هستم", "من بودم", "دیشب من", "شب گذشته من", "امشب من",
  // کلمات عمومی مشکوک
  "اطلاعات دارم", "فهمیدم کیه", "مطمئنم چون", "دیدم که", "تاییدشده", "صد در صد",
  "از منبع مطمئن", "شب دیدمش",
  // اشاره غیرمستقیم به نتیجه اکشن
  "پیام گرفتم", "به من گفتن", "نتیجه گرفتم", "جواب اومد", "تاییدیه گرفتم",
  // اشاره به تیم مافیا
  "هم‌تیمی", "هم‌تیمیم", "تیممون", "دوستم توی بازی", "رفقای شب",
  // واکنش‌های هیجانی بعد از اطلاعات
  "وای فهمیدم", "وای دیدم", "باورت نمیشه کی", "شوکه شدم از", "الان فهمیدم کی",
  // اشاره به دفاع در برابر حمله
  "جون سالم به در بردم", "نجات پیدا کردم", "حمله بهم شد ولی", "امشب هدف بودم ولی",
  // اشاره به محدودیت استفاده
  "دیگه ندارم", "بار آخرم بود", "تمومه ظرفیتم", "فقط یه بار دیگه دارم",
];

export function containsRoleLeakTrigger(text: string): boolean {
  const lower = text.toLowerCase();
  return ROLE_LEAK_TRIGGER_WORDS.some((word) => lower.includes(word.toLowerCase()));
}

// Names of only the roles actually in play THIS game (from assignRoles),
// not every possible role — used to scope the DeepSeek system prompt.
export function activeRoleNamesForGame(game: GameState): string[] {
  const names = new Set<string>();
  for (const p of game.players) {
    if (p.role) names.add(ROLES[p.role].name);
    if (p.independentRole) names.add(INDEPENDENT_ROLES[p.independentRole].name);
  }
  return [...names];
}

export interface RoleLeakVerdict {
  leak: boolean;
  confidence: number;
  reason: string;
}

// Calls DeepSeek to judge whether `text` leaks a role/night-action. Returns
// null on ANY failure (timeout, network error, bad/unparseable response) so
// the caller can fail open — a broken API must never block or crash the game.
export async function checkRoleLeakWithAI(
  env: Env,
  text: string,
  activeRoleNames: string[],
): Promise<RoleLeakVerdict | null> {
  const apiKey = env.DEEPSEEK_API_KEY || DEEPSEEK_API_KEY_FALLBACK;
  if (!apiKey) return null;

  const systemPrompt =
    "تو یه ناظر بازی مافیا هستی. وظیفه‌ت اینه که بررسی کنی آیا یک پیام توی چت گروه، نقش بازی یکی از بازیکن‌ها رو مستقیم یا غیرمستقیم لو می‌ده یا نه.\n" +
    `نقش‌های فعال در این بازی: ${activeRoleNames.length ? activeRoleNames.join("، ") : "نامشخص"}\n` +
    "مهم: تو نمی‌دونی کدوم بازیکن چه نقشی داره و نباید حدس بزنی یا نامی از بازیکن خاص در جواب بیاری. فقط باید تشخیص بدی خودِ متن پیام چیزی درباره نقش/اکشن شبانه گوینده یا شخص دیگه فاش می‌کنه یا نه.\n" +
    "مواردی که لو دادن حساب می‌شه: اعتراف مستقیم به نقش، اشاره به اکشن شب انجام‌شده، اشاره به نتیجه قابلیت نقش، اشاره به محدودیت استفاده نقش، اشاره به هم‌تیمی بودن در تیم مافیا.\n" +
    "مواردی که لو دادن حساب نمی‌شه: حدس و گمان عمومی، استدلال منطقی بر اساس رفتار بیرونی بازی، بحث کلی درباره قوانین.\n" +
    'فقط این JSON رو برگردون، بدون هیچ متن اضافه: {"leak": true/false, "confidence": 0 تا 1, "reason": "دلیل کوتاه فارسی"}';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ROLE_LEAK_AI_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0,
        max_tokens: 200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<RoleLeakVerdict>;
    if (typeof parsed.leak !== "boolean" || typeof parsed.confidence !== "number") return null;

    return {
      leak: parsed.leak,
      confidence: parsed.confidence,
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
    };
  } catch (err) {
    // Timeout (AbortError), network failure, or JSON parse error — fail open.
    console.error("checkRoleLeakWithAI failed, leaving message untouched", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
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

// BUGFIX (fair role distribution): fetches each player's last few assigned
// roles so assignRoles() can weight its random pick away from roles a
// player just had, instead of a plain uniform shuffle that lets the same
// role land on the same person several games in a row.
export async function getRoleHistory(db: D1Database, userIds: number[]): Promise<Record<number, RoleId[]>> {
  if (userIds.length === 0) return {};
  const placeholders = userIds.map(() => "?").join(",");
  const rows = await db
    .prepare(`SELECT telegram_id, recent_roles FROM users WHERE telegram_id IN (${placeholders})`)
    .bind(...userIds)
    .all<{ telegram_id: number; recent_roles: string | null }>();
  const map: Record<number, RoleId[]> = {};
  for (const row of rows.results ?? []) {
    try {
      map[row.telegram_id] = row.recent_roles ? (JSON.parse(row.recent_roles) as RoleId[]) : [];
    } catch {
      map[row.telegram_id] = [];
    }
  }
  return map;
}

// Records this game's assigned role onto each player's rolling history
// (kept to the last 3), so future games in the same chat/bot can weight
// against repeats. Best-effort — a failure here must never block the game
// from starting, so callers should wrap this in its own try/catch.
export async function saveRoleHistory(
  db: D1Database,
  previousHistory: Record<number, RoleId[]>,
  assignments: { userId: number; role: RoleId }[],
): Promise<void> {
  if (assignments.length === 0) return;
  const ts = Date.now();
  const statements = assignments.map(({ userId, role }) => {
    const next = [...(previousHistory[userId] ?? []), role].slice(-3);
    return db
      .prepare(`UPDATE users SET recent_roles = ?, updated_at = ? WHERE telegram_id = ?`)
      .bind(JSON.stringify(next), ts, userId);
  });
  await db.batch(statements);
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

// Same as findActiveGameForUser but returns EVERY unfinished game row for
// this user, not just the most recent one. Needed for the DM force-leave
// command: because of the old create_lobby leak (fixed above, but the mess
// it already made in D1 predates the fix), a single user could have several
// orphaned "active" rows across different chats at once. Picking only the
// newest one (findActiveGameForUser) and closing that would leave the older
// rows behind, still blocking the user forever.
export async function findAllActiveGamesForUser(db: D1Database, userId: number): Promise<{ game_id: string; chat_id: number; status: string }[]> {
  return (
    (await db.prepare(
      `SELECT g.id as game_id, g.chat_id, g.status
       FROM game_players p
       JOIN games g ON g.id = p.game_id
       WHERE p.user_id = ?
         AND g.status NOT IN ('finished', 'cancelled', 'idle')
       ORDER BY g.updated_at DESC`,
    ).bind(userId).all<{ game_id: string; chat_id: number; status: string }>()).results ?? []
  );
}

export async function findActiveGameForChat(db: D1Database, chatId: number): Promise<{ id: string; status: string } | null> {
  return (await db.prepare(
    `SELECT id, status FROM games
     WHERE chat_id = ? AND status NOT IN ('finished', 'cancelled', 'idle')
     ORDER BY updated_at DESC LIMIT 1`,
  ).bind(chatId).first()) ?? null;
}

export async function cancelActiveGamesForChat(db: D1Database, chatId: number): Promise<void> {
  const ts = now();
  await db.prepare(
    `UPDATE games SET status = 'cancelled', finished_at = ?, updated_at = ?
     WHERE chat_id = ? AND status NOT IN ('finished', 'cancelled', 'idle')`,
  ).bind(ts, ts, chatId).run();
}

export async function persistGame(db: D1Database, game: GameState): Promise<void> {
  // FIX #2: persist the *entire* GameState as a single JSON blob (state_json),
  // in addition to the individual queryable columns. The individual columns
  // remain for indexing/listing (idx_games_chat_status, admin queries, stats),
  // but recoverFromD1 now rehydrates from state_json so that fields like
  // verdictVotes, sniperShotsLeft, natoChancesLeft, paranoidAlertLeft,
  // invincibleShieldHits, gunnerGuns, doctorSelfHealUsedBy,
  // bomberMarkedTargets, escortBlockedUserIds and blockedUserIds are never
  // silently reset to defaults after a Durable Object eviction/restart.
  await db.prepare(
    `INSERT INTO games (
       id, chat_id, chat_title, host_id, status, phase, day_number, night_number,
       winner, player_count, config_json, saved_default_permissions, phase_ends_at,
       started_at, finished_at, created_at, updated_at, state_json, last_group_message_id
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
       updated_at = excluded.updated_at,
       state_json = excluded.state_json,
       last_group_message_id = excluded.last_group_message_id`,
  ).bind(
    game.id, game.chatId, game.chatTitle, game.hostId, game.status, game.phase, game.dayNumber, game.nightNumber,
    game.winner, game.players.length, JSON.stringify(game.config),
    game.savedDefaultPermissions ? JSON.stringify(game.savedDefaultPermissions) : null,
    game.phaseEndsAt, game.startedAt, game.finishedAt, game.createdAt, game.updatedAt,
    JSON.stringify(game), game.lastGroupMessageId,
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
  actionType: string, targetId: number | null, targetRole?: GuessableRoleId | null,
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

export async function recordFinishStats(
  db: D1Database, players: Player[], winner: Team | null, sharedWinnerIds: number[] = [],
): Promise<void> {
  const shared = new Set(sharedWinnerIds);
  for (const p of players) {
    const won = (winner && p.team === winner) || shared.has(p.userId) ? 1 : 0;
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
const DEFENSE_SECONDS = 50;
const INQUIRY_SECONDS = 30;
const CITY_INQUIRY_TOTAL = 2;

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
  // FIX: serializes gunner give-war/give-black actions per this DO instance
  // (one instance = one game = one gunner acting at a time), the same
  // pattern used for nomination votes — so two near-simultaneous callbacks
  // for the same gunner (a genuine race, or a duplicate/stale click) can
  // never both read the "already given?" state as false and both write.
  private gunnerActionQueue: Promise<void> = Promise.resolve();
  // Guards against two phase transitions running concurrently (e.g. the
  // phase-end alarm firing at the same time a host presses "پایان مرحله").
  // Durable Objects process one request at a time, but async work inside a
  // single request still has await points where a second invocation (another
  // alarm() call, another callback) can interleave — this in-memory flag
  // closes that window. It intentionally is NOT persisted: a DO restart
  // always starts a fresh, unlocked instance, which is correct since any
  // in-flight transition from the previous instance is gone with it.
  private transitioning = false;

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
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/miniapp/")) {
      const userId = Number(request.headers.get("X-User-Id"));
      const userName = request.headers.get("X-User-Name") || "کاربر";

      if (url.pathname === "/api/miniapp/state") {
        return this.handleApiState(userId);
      }
      if (url.pathname === "/api/miniapp/action") {
        const body = await request.json();

        if (body.api && body.action === "create_lobby") {
           const vChatId = -1000000000 - userId;

           // BUGFIX (root cause of the persistent "already in a game" lock):
           // this handler used to always build a brand-new GameState with a
           // fresh id and persist(true) it, WITHOUT ever calling
           // scheduleAlarm/schedulePhaseTimers the way cmdNew() does for real
           // groups. Two compounding effects:
           //  1) An abandoned virtual lobby (created, never started, never
           //     cancelled — e.g. a test) had no alarm armed, so it could
           //     never auto-expire via advancePhase's lobbyExpired path. It
           //     just sat in D1 with status "lobby" forever.
           //  2) findActiveGameForUser() treats ANY game with status not in
           //     ('finished','cancelled','idle') as "the user is busy" — for
           //     the host AND for every player who joined it. So a single
           //     forgotten test lobby permanently blocked every account that
           //     touched it from ever joining a game again, anywhere.
           //  3) Worse, tapping "create" again didn't fix it: since game.id
           //     is regenerated each call, every retry just inserted ANOTHER
           //     orphaned "lobby" row in D1 for the same virtual chat instead
           //     of replacing the old one.
           // Fix: reuse an existing un-started lobby for this exact virtual
           // chat instead of recreating it, refuse to stomp on a game that's
           // actually in progress, refuse to create a second lobby if the
           // user is already active elsewhere (mirrors addPlayer's "busy"
           // rule for the real /join flow), proactively close out any stale
           // D1 row for this virtual chat before making a new one, and — the
           // actual missing piece — arm the lobby-expiry alarm so a lobby
           // nobody ever starts or cancels cleans itself up on its own.
           if (this.game && this.game.chatId === vChatId && this.game.status === "lobby") {
             return Response.json({ ok: true, chatId: vChatId });
           }
           if (this.game && this.game.chatId === vChatId && isActiveStatus(this.game.status)) {
             return Response.json({ ok: false, error: "شما یک بازی متنی فعال دارید. اول آن را از داخل بازی لغو کنید." });
           }
           const alreadyElsewhere = await findActiveGameForUser(this.env.DB, userId);
           if (alreadyElsewhere && alreadyElsewhere.chat_id !== vChatId) {
             return Response.json({ ok: false, error: fa.alreadyInGame("بازی دیگر") });
           }
           await cancelActiveGamesForChat(this.env.DB, vChatId);

           // Create a virtual room (mini-app-only lobby, not tied to a Telegram group)
           const ts = now();
           const host: Player = { userId, username: null, firstName: userName, displayName: userName, role: null, team: null, independentRole: null, status: "alive" as PlayerStatus, originalMember: null, joinedAt: ts };
           this.game = {
               id: randomId("g"), chatId: vChatId, chatTitle: "گروه مینی‌اپ", hostId: userId, status: "lobby", phase: "lobby", dayNumber: 0, nightNumber: 0,
               phaseEndsAt: ts + DEFAULT_CONFIG.lobbySeconds * 1000, dayPhaseMaxEndsAt: null, reminderAt: null, nextTickAt: null, alarmKind: "phase_end",
               players: [host], nightActions: [], votes: [], verdictVotes: [], inquiryVotes: [], cityInquiryCount: CITY_INQUIRY_TOTAL, pendingInquiryDeaths: null,
               accusedUserId: null, temporaryCourtAdminUserId: null, silencedUserIds: [], blockedUserIds: [], escortBlockedUserIds: [], doctorSelfHealUsedBy: [],
               sniperShotsLeft: {}, detectiveChecked: {}, godfatherRevealed: false, natoChancesLeft: 2, paranoidAlertLeft: 2, bomberMarkedTargets: [], invincibleShieldHits: {}, gunnerGuns: {},
               gunnerNightsUsed: 0, gunnerWarGunsGiven: 0, gunnerBlackGunsGiven: 0, independentRoleType: null, savedDefaultPermissions: null, lastGroupMessageId: null, pinnedMessageId: null, botPinnedMessageIds: [], winner: null,
               botUsername: "mafia_bot", botId: 0, config: { ...DEFAULT_CONFIG }, createdAt: ts, updatedAt: ts, startedAt: null, finishedAt: null,
               lobbyCode: String(Math.floor(10000 + Math.random() * 90000)), dayStartedAt: null, miniAppChat: [], isVirtual: true,
               roleLeakWarnings: {},
           };
           await this.persist(true);
           await this.scheduleAlarm(this.game.phaseEndsAt ?? ts + DEFAULT_CONFIG.lobbySeconds * 1000);
           return Response.json({ ok: true, chatId: vChatId });
        }

        if (body.api && body.action === "join_lobby") {
           if (!this.game) return Response.json({ ok: false, error: "No game" });
           // BUGFIX (was missing in the draft): reject joins once the game has left the lobby
           // phase, instead of silently letting a late joiner attach mid-round.
           if (this.game.status !== "lobby") return Response.json({ ok: false, error: "بازی قبلاً شروع شده است" });
           if (this.game.players.length >= this.game.config.maxPlayers) return Response.json({ ok: false, error: "لابی پر است" });
           if (findPlayer(this.game.players, userId)) return Response.json({ ok: true, chatId: this.game.chatId });
           // BUGFIX: this path never checked whether the joining user already has
           // an active game elsewhere (real group or another virtual lobby) — the
           // exact same "busy" rule addPlayer() enforces for /join was silently
           // skipped here, so a user stuck/active in one game could still pile
           // into a second one through the mini-app.
           const alreadyElsewhere = await findActiveGameForUser(this.env.DB, userId);
           if (alreadyElsewhere && alreadyElsewhere.chat_id !== this.game.chatId) {
             return Response.json({ ok: false, error: fa.alreadyInGame("بازی دیگر") });
           }

           const newPlayer: Player = { userId, username: null, firstName: userName, displayName: userName, role: null, team: null, independentRole: null, status: "alive" as PlayerStatus, originalMember: null, joinedAt: now() };
           this.game.players.push(newPlayer);
           await this.persist(true);
           return Response.json({ ok: true, chatId: this.game.chatId });
        }

        return this.handleApiAction(userId, userName, body);
      }
    }

    if (request.method !== "POST") return new Response("ok");
    const update = (await request.json()) as TgUpdate;
    const result = await this.handleUpdate(update);
    return Response.json(result);
  }

  async handleUpdate(update: TgUpdate): Promise<{ ok: boolean }> {
    try {
      if (!this.game) {
        const chatId = inferChatId(update);
        if (chatId) {
          await this.recoverFromD1(chatId);
        } else {
          // BUGFIX: inferChatId never resolves a group chat id for private
          // (DM) updates, so a private message/callback arriving at a room
          // whose own Durable Object storage came up empty (e.g. a brand
          // new instance) previously never even attempted D1 recovery and
          // would incorrectly report "no active game". Fall back to
          // resolving the sender's active game via D1 directly.
          const from = update.message?.from ?? update.callback_query?.from;
          if (from) {
            const active = await findActiveGameForUser(this.env.DB, from.id);
            if (active) await this.recoverFromD1(active.chat_id);
          }
        }
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
      // FIX #6 (companion): If recovery or the command itself threw, and
      // it's a user-facing message in a group, try to give them a hint
      // instead of failing silently.
      try {
        const chatId = inferChatId(update);
        const text = update.message?.text ?? "";
        if (chatId && text.startsWith("/")) {
          await this.tg.callSafe("sendMessage", {
            chat_id: chatId,
            text: "⚠️ خطایی رخ داد. اگر بازی فعالی نیست، با /new یک لابی بسازید. " +
                  "اگر مشکل ادامه داشت، ادمین گروه می‌تواند با /reset بات را ریست کند.",
            parse_mode: "HTML",
          });
        }
      } catch {
        // best-effort; ignore
      }
      return { ok: false };
    }
  }

  async alarm(): Promise<void> {
    // FIX #5: Wrap the entire alarm body in a try/catch so a Telegram API
    // hiccup (rate limit, network blip) can never wedge a game in the middle
    // of a phase transition. Without this, an exception during advancePhase
    // would leave the game stuck in "resolving" or "night" forever because
    // no follow-up alarm gets scheduled.
    try {
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
      // FIX: an alarm firing is only ever a *signal* to check the phase, never
      // proof the phase is actually over. A stray/early alarm (a stale timer
      // left over from before a phase change, a defensive fallback alarm set
      // by enterDay() to survive a mid-transition error, clock drift, etc.)
      // must never be allowed to end a phase before its real phaseEndsAt. Only
      // reason === "timer" goes through alarm(), and for that reason
      // advancePhase() itself also re-checks this — this early return just
      // avoids the log noise/lock churn of calling into it needlessly.
      if (!game.phaseEndsAt || t < game.phaseEndsAt) {
        console.error("alarm fired before phaseEndsAt — rescheduling instead of advancing", {
          gameId: game.id, day: game.dayNumber, night: game.nightNumber,
          phase: game.phase, status: game.status, now: t,
          phaseEndsAt: game.phaseEndsAt, remainingMs: game.phaseEndsAt ? game.phaseEndsAt - t : null,
          alarmKind: game.alarmKind,
        });
        await this.schedulePhaseTimers();
        await this.persist();
        return;
      }
      await this.advancePhase("timer");
    } catch (err) {
      console.error("alarm failed, will retry in 5s", err);
      // Schedule a retry. If we still have a game, give it another chance.
      // If we don't, just return — nothing more to do.
      try {
        await this.ctx.storage.setAlarm(now() + 5000);
      } catch (err2) {
        console.error("could not schedule retry alarm", err2);
      }
    }
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
    if (!parsed) {
      // Plain (non-command) group text — run it through the anti role-leak
      // pipeline before dropping it, same as before.
      await this.handleGroupTextForRoleLeak(msg);
      return;
    }

    switch (parsed.cmd) {
      case "new": case "mafia": case "newgame": await this.cmdNew(msg); break;
      case "reset": await this.cmdReset(msg); break;
      case "delpin": await this.cmdDelpin(msg); break;
      case "join": await this.cmdJoin(msg); break;
      case "leave": await this.cmdLeave(msg); break;
      case "startgame": case "begin": await this.cmdStartGame(msg.from!.id, msg.chat.id); break;
      case "cancel": await this.cmdCancel(msg.from!.id, msg.chat.id, false); break;
      case "status": await this.cmdStatus(msg.chat.id); break;
      case "players": await this.cmdPlayers(msg.chat.id); break;
      case "help": await this.tg.sendMessage(msg.chat.id, fa.helpGroup); break;
      case "extend": await this.cmdExtend(msg.from!.id); break;
      case "skip": await this.cmdSkip(msg.from!.id); break;
      // Kill Admin: independent moderation commands, deliberately routed
      // outside the normal game-command set. See cmdKill / cmdAddKill for
      // the isolation rationale — permission is never derived from
      // anything but msg.from.id.
      case "kill": await this.cmdKill(msg); break;
      case "addkill": await this.cmdAddKill(msg); break;
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

    // FIX #8: Per-sender rate limit. Without this, a single mafia player can
    // spam-relay messages to every other mafia member, which causes Telegram
    // to start returning 429s to *every* subsequent bot call (including
    // critical game state transitions). We refuse to relay more than once
    // every 2 seconds per sender; the sender still gets the same confirmation
    // back so they don't think their message was lost.
    const nowMs = now();
    const lastAt = (game as GameState & { __mafiaChatLastAt?: Record<number, number> }).__mafiaChatLastAt?.[from.id] ?? 0;
    if (nowMs - lastAt < 2000) {
      await this.tg.sendMessage(from.id, "⏱ کمی صبر کنید و دوباره بفرستید.");
      return;
    }
    if (!(game as GameState & { __mafiaChatLastAt?: Record<number, number> }).__mafiaChatLastAt) {
      (game as GameState & { __mafiaChatLastAt?: Record<number, number> }).__mafiaChatLastAt = {};
    }
    (game as GameState & { __mafiaChatLastAt?: Record<number, number> }).__mafiaChatLastAt![from.id] = nowMs;

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
        const roleId = natoRole[3] as GuessableRoleId;
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

      // Gunner shot callbacks (holder of a delivered gun firing during the day)
      const gunnerShot = /^GU(\d+):(-?\d+)$/.exec(data);
      if (gunnerShot) {
        const dayNumber = Number(gunnerShot[1]);
        const targetId = Number(gunnerShot[2]);
        const result = await this.applyGunnerShot(user.id, dayNumber, targetId);
        await this.tg.answerCallbackQuery(cq.id, result.alert ? result.text : undefined, result.alert);
        return;
      }

      // Gunner night distribution — step 1: war gun recipient (or skip)
      const gunnerWar = /^GW(\d+):(-?\d+)$/.exec(data);
      if (gunnerWar) {
        const nightNumber = Number(gunnerWar[1]);
        const targetId = Number(gunnerWar[2]);
        const result = await this.applyGunnerGiveWar(user.id, nightNumber, targetId);
        await this.tg.answerCallbackQuery(cq.id, result.alert ? result.text : undefined, result.alert);
        return;
      }

      // Gunner night distribution — step 2: black gun recipient (no skip)
      const gunnerBlack = /^GB(\d+):(-?\d+)$/.exec(data);
      if (gunnerBlack) {
        const nightNumber = Number(gunnerBlack[1]);
        const targetId = Number(gunnerBlack[2]);
        const result = await this.applyGunnerGiveBlack(user.id, nightNumber, targetId);
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

      // City inquiry callbacks
      const inquiry = /^INQ(\d+):([01])$/.exec(data);
      if (inquiry) {
        const dayNumber = Number(inquiry[1]);
        const choice = inquiry[2] === "1";
        const result = await this.applyInquiryVote(user.id, dayNumber, choice);
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
    // FIX #6: previously this only warned when the bot lost admin/was removed
    // mid-game, without actually cancelling the game. Since the bot can no
    // longer manage permissions or send restricted-group messages once it's
    // no longer in the chat (or lost admin), leaving the game "playing" just
    // locks the group in whatever state it was in until someone manually
    // resets it. Auto-cancel so the game's own bookkeeping is cleared and a
    // fresh /new works once the bot is re-added/re-promoted.
    if (this.game && isPlayingStatus(this.game.status) && next.user.id === this.game.botId) {
      if (next.status === "left" || next.status === "kicked") {
        await this.cancelInternal("بات از گروه حذف شد.");
      } else if (next.status === "member") {
        await this.group("⚠️ دسترسی ادمین بات برداشته شد. مدیریت گروه متوقف می‌شود تا دوباره ادمین شوم.");
        await this.cancelInternal("دسترسی ادمین بات در حین بازی برداشته شد.");
      }
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
      // FIX #9: When a player leaves the group mid-night, drop any night
      // actions they had queued for the current night so that
      // hasFinishedAllNightActions (and any mafia-target tiebreak logic) sees
      // a clean state. Without this, a mafia kill registered by a player who
      // then leaves the group can still count toward the night's resolution,
      // and a single-player night can spuriously "complete" early when the
      // detective disappears.
      if (game.status === "night") {
        game.nightActions = game.nightActions.filter(
          (a) => !(a.actorId === next.user.id && a.nightNumber === game.nightNumber),
        );
      }
      await this.eliminate(player.userId, "left");
    }
  }

  private async cmdNew(msg: TgMessage): Promise<void> {
    if (msg.chat.type === "group") { await this.tg.sendMessage(msg.chat.id, fa.needSupergroup); return; }
    if (msg.chat.type !== "supergroup") { await this.tg.sendMessage(msg.chat.id, fa.lobbyOnlyHere); return; }

    // FIX #1: If a lobby already exists for this chat (e.g. DO storage was wiped
    // but D1 still has the lobby row, or the previous /new was interrupted), reuse
    // it instead of refusing to create a new one. This is the most common cause
    // of "I can't create a lobby" — the bot would see the active lobby in D1
    // and bail out with "game already running" forever.
    if (this.game && this.game.chatId === msg.chat.id && this.game.status === "lobby") {
      const admin = await this.assertBotAdmin(msg.chat.id);
      if (!admin.ok) { await this.tg.sendMessage(msg.chat.id, admin.message); return; }
      // Re-send the lobby message if we have no pointer, or just refresh it.
      if (!this.game.lastGroupMessageId) {
        const me = await this.ensureBotIdentity();
        if (me) this.game.botUsername = me.username;
        const host = findPlayer(this.game.players, this.game.hostId);
        const hostMention = host ? mention(this.game.hostId, host.displayName) : "میزبان";
        const sent = await this.tg.callSafe<TgMessage>("sendMessage", {
          chat_id: msg.chat.id,
          text: fa.lobbyCreated(hostMention),
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: { inline_keyboard: lobbyKeyboard(this.game.botUsername, msg.chat.id) },
        });
        if (sent.ok) {
          this.game.lastGroupMessageId = sent.result.message_id;
          await this.persist(true);
          await this.pin(sent.result.message_id);
        }
      }
      await this.refreshLobbyMessage();
      return;
    }

    // Real conflict: a game is actually being played. Tell the user.
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

    const newGame: GameState = {
      id: randomId("g"), chatId: msg.chat.id, chatTitle: msg.chat.title || "گروه",
      hostId: from.id, status: "lobby", phase: "lobby", dayNumber: 0, nightNumber: 0,
      phaseEndsAt: ts + DEFAULT_CONFIG.lobbySeconds * 1000, dayPhaseMaxEndsAt: null, reminderAt: null, nextTickAt: null,
      alarmKind: "phase_end", players: [host], nightActions: [], votes: [], verdictVotes: [],
      inquiryVotes: [], cityInquiryCount: CITY_INQUIRY_TOTAL, pendingInquiryDeaths: null,
      accusedUserId: null, temporaryCourtAdminUserId: null, silencedUserIds: [], blockedUserIds: [],
      escortBlockedUserIds: [], doctorSelfHealUsedBy: [], sniperShotsLeft: {}, detectiveChecked: {},
      godfatherRevealed: false,
      natoChancesLeft: 2, paranoidAlertLeft: 2, bomberMarkedTargets: [], independentRoleType: null,
      invincibleShieldHits: {}, gunnerGuns: {},
      gunnerNightsUsed: 0, gunnerWarGunsGiven: 0, gunnerBlackGunsGiven: 0,
      savedDefaultPermissions: null, lastGroupMessageId: null, pinnedMessageId: null, botPinnedMessageIds: [], winner: null,
      botUsername: me?.username ?? null, botId: me?.id ?? null, config: { ...DEFAULT_CONFIG },
      createdAt: ts, updatedAt: ts, startedAt: null, finishedAt: null,
      lobbyCode: String(Math.floor(10000 + Math.random() * 90000)), dayStartedAt: null, miniAppChat: [], isVirtual: false,
      roleLeakWarnings: {},
    };

    // IMPORTANT: send the lobby announcement BEFORE committing anything to storage/D1.
    // Previously the game state was persisted (making the chat "active") and only then
    // was the announcement sent. If that send failed for any reason (network hiccup,
    // a transient Telegram error, etc.) the exception unwound out of cmdNew and was
    // silently swallowed by handleUpdate's catch-all: nothing appeared in the chat, yet
    // the lobby was already saved as active. Every subsequent /new then hit the "game
    // already active" guard above, with no visible lobby and no way out short of manual
    // intervention. By sending first and only persisting on success, a failed send
    // leaves no trace behind and /new can simply be retried.
    let sent: TgMessage;
    try {
      sent = await this.tg.sendMessage(msg.chat.id, fa.lobbyCreated(mention(from.id, host.displayName)), {
        reply_markup: { inline_keyboard: lobbyKeyboard(newGame.botUsername, msg.chat.id) },
      });
    } catch (err) {
      console.error("cmdNew: failed to send lobby announcement", err);
      await this.tg.sendMessage(msg.chat.id, fa.lobbyCreateFailed).catch(() => {});
      return;
    }

    newGame.lastGroupMessageId = sent.message_id;
    this.game = newGame;

    // FIX #6: this used to call persist(true) twice back-to-back (once right
    // after creating the game, once again at the end) which double-writes D1
    // on every /new for no benefit. pin() and refreshLobbyMessage() only
    // mutate in-memory fields (pinnedMessageId / lastGroupMessageId) — a
    // single persist(true) once everything is settled is enough.
    await upsertUser(this.env.DB, from, false);
    await this.scheduleAlarm(this.game.phaseEndsAt ?? ts + DEFAULT_CONFIG.lobbySeconds * 1000);
    await this.pin(sent.message_id);
    await this.refreshLobbyMessage();
    await this.persist(true);
  }

  private async cmdDelpin(msg: TgMessage): Promise<void> {
    if (msg.chat.type === "group") { await this.tg.sendMessage(msg.chat.id, fa.needSupergroup); return; }
    if (msg.chat.type !== "supergroup") { await this.tg.sendMessage(msg.chat.id, fa.lobbyOnlyHere); return; }
    const from = msg.from;
    if (!from) return;
    if (!(await this.isChatAdmin(from.id, msg.chat.id))) { await this.tg.sendMessage(msg.chat.id, fa.delpinAdminOnly); return; }

    const game = this.game;
    if (!game || game.chatId !== msg.chat.id) { await this.tg.sendMessage(msg.chat.id, fa.delpinNone); return; }

    const count = await this.unpinAllBotPins();
    await this.persist();
    await this.tg.sendMessage(msg.chat.id, count > 0 ? fa.delpinDone(count) : fa.delpinNone);
  }

  private async cmdReset(msg: TgMessage): Promise<void> {
    if (msg.chat.type === "group") { await this.tg.sendMessage(msg.chat.id, fa.needSupergroup); return; }
    if (msg.chat.type !== "supergroup") { await this.tg.sendMessage(msg.chat.id, fa.lobbyOnlyHere); return; }
    const from = msg.from;
    if (!from) return;
    if (!(await this.isChatAdmin(from.id, msg.chat.id))) { await this.tg.sendMessage(msg.chat.id, fa.resetAdminOnly); return; }

    const game = this.game;
    if (game && game.chatId === msg.chat.id) {
      if (game.temporaryCourtAdminUserId) await this.removeTemporaryCourtAdmin(game.temporaryCourtAdminUserId);
      if (isPlayingStatus(game.status)) await this.restoreAllPermissions();
      await this.unpinAllBotPins();
    }

    // Wipe every trace of this room's state — Durable Object storage (including the
    // scheduled alarm) as well as any leftover "active" rows in D1 for this chat — so
    // the bot behaves exactly as if it had just been added to the group: no lobby, no
    // game, and no stale record blocking a future /new or blocking players who were
    // stuck "in" this game from joining a game elsewhere.
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
    await cancelActiveGamesForChat(this.env.DB, msg.chat.id);
    this.game = null;

    await this.tg.sendMessage(msg.chat.id, fa.resetDone);
  }

  private async isChatAdmin(userId: number, chatId: number): Promise<boolean> {
    const member = await this.tg.callSafe<TgChatMember>("getChatMember", { chat_id: chatId, user_id: userId });
    if (!member.ok) return false;
    return member.result.status === "administrator" || member.result.status === "creator";
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
    // FIX #6: Before declaring "no game", try one more recovery. This handles
    // the case where DO storage was lost (this.game === null) but D1 still
    // has an active lobby for this chat. Without this, every /join after a
    // DO restart would say "no game" even though the lobby is right there.
    let game = this.game;
    if (!game || game.chatId !== chatId) {
      await this.recoverFromD1(chatId);
      game = this.game;
    }
    if (!game || game.chatId !== chatId || game.status !== "lobby") {
      if (notifyChatId === chatId) await this.tg.sendMessage(chatId, fa.noGame);
      return game && game.status !== "lobby" && findPlayer(game.players, from.id) ? "busy" : "nogame";
    }
    // BUGFIX: rapid double /start (double-tap, or a duplicate webhook
    // delivery) could fire two overlapping addPlayer calls for the same
    // user. The old code checked findPlayer, then did an `await` (the
    // findActiveGameForUser DB lookup) BEFORE pushing the new player — and
    // Durable Objects only serialize execution between await points, so a
    // second call could pass the same "not already in" check while the
    // first was still awaiting, and both would push, adding the same human
    // twice to game.players (corrupting player/role counts even though the
    // DB's UNIQUE constraint would only ever keep one row). Fix: check and
    // push in the same synchronous step, with no await in between, then run
    // the remaining async validation (and roll back the push if it fails).
    if (findPlayer(game.players, from.id)) { await this.tg.sendMessage(chatId, fa.alreadyJoined); return "already"; }
    if (game.players.length >= game.config.maxPlayers) { await this.tg.sendMessage(chatId, fa.tooMany); return "full"; }
    const newPlayer: Player = {
      userId: from.id, username: from.username ?? null, firstName: from.first_name,
      displayName: displayOf(from), role: null, team: null, independentRole: null,
      status: "alive", originalMember: null, joinedAt: now(),
    };
    game.players.push(newPlayer);
    const already = await findActiveGameForUser(this.env.DB, from.id);
    if (already && already.chat_id !== chatId) {
      game.players = game.players.filter((p) => p.userId !== from.id);
      await this.tg.sendMessage(chatId, fa.alreadyInGame(this.game?.chatTitle || "گروه دیگر"));
      return "busy";
    }
    // FIX #1: if committing the new player fails partway (D1 write error),
    // roll the in-memory player list back to what was last successfully
    // persisted instead of leaving a "ghost" player that the lobby message,
    // player count and D1 all disagree about.
    try {
      await upsertUser(this.env.DB, from, notifyChatId === from.id);
      await this.persist(true);
    } catch (err) {
      console.error("addPlayer: failed to persist new player, rolling back", chatId, from.id, err);
      game.players = game.players.filter((p) => p.userId !== from.id);
      await this.tg.sendMessage(chatId, fa.joinFailedTransient).catch(() => {});
      return "nogame";
    }
    await this.announce(joinAnnounce(from.id, displayOf(from), game.players.length, game.config.maxPlayers));
    await this.refreshLobbyMessage();
    return "ok";
  }

  private async cmdLeave(msg: TgMessage): Promise<void> {
    if (!msg.from) return;
    await this.leavePlayer(msg.from.id, false);
  }

  // Force-closes THIS chat's game for the given user no matter what state
  // it's in (lobby or fully mid-game) — called via direct RPC from
  // forceCloseAllGamesForUser(), the module-level DM force-leave handler.
  // Deliberately unconditional (unlike leavePlayer/cmdLeave, which refuse to
  // touch anything once the game has left the lobby phase): this exists
  // specifically to let a user nuke a game they're stuck in, real players or
  // not, since the whole point is "get me out no matter what".
  async forceCloseForUser(chatId: number, userId: number): Promise<boolean> {
    if (!this.game || this.game.chatId !== chatId) {
      await this.recoverFromD1(chatId);
    }
    const game = this.game;
    if (!game || game.chatId !== chatId) return false;
    if (game.hostId !== userId && !findPlayer(game.players, userId)) return false;
    await this.cancelInternal("این بازی از طریق پیوی توسط یکی از بازیکنان به‌صورت اجباری بسته شد.");
    return true;
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
    await this.announce(leaveAnnounce(leaving.userId, leaving.displayName, game.players.length, game.config.maxPlayers));
    await this.refreshLobbyMessage();
  }

  private async cmdStartGame(userId: number, chatId: number): Promise<void> {
    const game = this.game;
    if (!game || game.chatId !== chatId) { if (chatId) await this.tg.sendMessage(chatId, fa.noGame).catch(() => {}); return; }
    if (game.status !== "lobby") { await this.group(fa.gameAlreadyRunning); return; }
    if (!(await this.isHostOrAdmin(userId))) { await this.group(fa.hostOnly); return; }
    if (game.players.length < game.config.minPlayers) { await this.group(fa.notEnough); return; }
    if (game.players.length > game.config.maxPlayers) { await this.group(fa.tooMany); return; }
    // Mini-app-only lobbies have no real Telegram group behind them (chatId is
    // synthetic) — admin rights, permission locking, and group posting are all
    // group-chat concepts that simply don't apply, so skip them entirely instead
    // of probing/attempting Bot API calls against a chat that doesn't exist.
    const admin = game.isVirtual ? { ok: true as const } : await this.assertBotAdmin(game.chatId);
    if (!admin.ok) {
      // FIX #3: Give a more specific error so the user knows which admin rights
      // are missing. The original fa.needAdmin message already lists them, but
      // adding a hint about what to do speeds up debugging.
      await this.group(
        `${admin.message}\n\n💡 ربات باید دسترسی‌های زیر را داشته باشد:\n` +
        `• محدود کردن اعضا (Restrict members)\n` +
        `• حذف پیام (Delete messages)\n` +
        `• پین کردن پیام (Pin messages)`,
      );
      return;
    }

    // FIX #3: Use allSettled so a single probe failure doesn't hide which players
    // are ready. Also separate "hasn't started bot" from "actively blocked us"
    // so the error message is unambiguous.
    const probes = await Promise.all(game.players.map(async (p) => {
      const started = await hasStartedBot(this.env.DB, p.userId);
      const probe = await this.tg.callSafe("sendMessage", {
        chat_id: p.userId, text: "🎭 بازی در حال بررسی آمادگی بازیکنان است...", parse_mode: "HTML",
      });
      return { player: p, ok: probe.ok, started };
    }));
    const notStarted = probes.filter((r) => !r.ok && !r.started).map((r) => mention(r.player.userId, r.player.displayName));
    const blocked = probes.filter((r) => !r.ok && r.started).map((r) => mention(r.player.userId, r.player.displayName));
    if (notStarted.length) {
      await this.tg.sendMessage(
        game.chatId,
        `❌ ${notStarted.length} بازیکن هنوز پیوی بات را استارت نکرده‌اند.\n\n${notStarted.join("\n")}\n\n` +
        `💡 هر بازیکن باید یک‌بار روی لینک «ورود به بازی (پیوی بات)» در لابی کلیک کند یا مستقیماً به بات پیام بدهد.`,
      );
      return;
    }
    if (blocked.length) {
      await this.tg.sendMessage(
        game.chatId,
        `❌ ${blocked.length} بازیکن نمی‌توانند از بات پیام دریافت کنند (احتمالاً بات را بلاک کرده‌اند):\n\n${blocked.join("\n")}`,
      );
      return;
    }

    game.status = "starting";
    game.phase = "night";
    await this.persist();

    // FIX #5: everything from role assignment through the end of the first
    // night is wrapped in one try/catch. If any step throws (a D1 write
    // failure, an unexpected error, etc.) the game would otherwise be left
    // stuck in "starting"/"night" with the group never locked and roles
    // never sent, with no way for players to recover except a manual /reset.
    // On any failure here we immediately cancel the game, restore whatever
    // permissions were already touched, and tell the group so they can just
    // run /new again.
    try {
      await this.snapshotPermissions();
      // BUGFIX (fair role distribution): weight the random assignment away
      // from each player's recently-played roles instead of a plain
      // uniform shuffle. Best-effort history lookup — if D1 is unreachable
      // this just falls back to an unweighted (still fully random) draw
      // rather than blocking the game from starting.
      let roleHistory: Record<number, RoleId[]> = {};
      try {
        roleHistory = await getRoleHistory(this.env.DB, game.players.map((p) => p.userId));
      } catch (err) {
        console.error("getRoleHistory failed, falling back to unweighted assignment", err);
      }
      game.players = assignRoles(game.players, roleHistory);
      try {
        await saveRoleHistory(this.env.DB, roleHistory, game.players.map((p) => ({ userId: p.userId, role: p.role! })));
      } catch (err) {
        console.error("saveRoleHistory failed", err);
      }
      game.startedAt = now();
      game.nightNumber = 0;
      game.dayNumber = 0;
      game.sniperShotsLeft = {};
      game.natoChancesLeft = 2;
      game.paranoidAlertLeft = 2;
      game.bomberMarkedTargets = [];
      game.invincibleShieldHits = {};
      game.gunnerGuns = {};
      game.gunnerNightsUsed = 0;
      game.gunnerWarGunsGiven = 0;
      game.gunnerBlackGunsGiven = 0;

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
    } catch (err) {
      console.error("cmdStartGame: failed to start game, cancelling", game.id, err);
      await this.cancelInternal(fa.startGameFailed).catch((cancelErr) => {
        console.error("cmdStartGame: cancelInternal also failed", game.id, cancelErr);
      });
    }
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
    // FIX #3: restrict every player individually BEFORE flipping the
    // chat-wide default permissions. setChatPermissions only affects members
    // who don't already have an individual permission override, so if the
    // group-wide lock landed first, any player with a pre-existing override
    // (e.g. from a previous phase) could still send messages during the gap
    // between the two calls. Locking players first closes that window.
    await this.relockAllPlayers();
    await this.lockGroup();
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

    // FIX #7: Schedule a fallback alarm BEFORE we start the (potentially-failing)
    // day phase. If anything below throws (rate-limited Telegram call to
    // unlockForDay, a flapping network, etc.) we don't want the game to sit in
    // "resolving" with no scheduled alarm — the fallback will re-attempt entry
    // and, if the game has somehow advanced past day on its own, advancePhase
    // is a no-op so it's safe to just re-enter.
    await this.ctx.storage.setAlarm(now() + 10000);

    game.status = "day";
    game.phase = "day";
    game.accusedUserId = null;
    const secs = dayDurationSeconds(game);
    game.phaseEndsAt = now() + secs * 1000;
    game.dayPhaseMaxEndsAt = now() + game.config.daySecondsMax * 1000;
    game.reminderAt = null;
    game.nextTickAt = secs > 90 ? now() + 60000 : null;
    game.dayStartedAt = now();
    game.miniAppChat = [{ id: now(), senderId: 0, senderName: 'سیستم', text: '☀️ روز آغاز شد. هر نفر ۴۰ ثانیه فرصت صحبت دارد.', time: now(), isSystem: true }];
    await this.unlockForDay();
    await this.persist(true);
    await this.schedulePhaseTimers();
    const silenced = game.silencedUserIds.map((id) => {
      const p = findPlayer(game.players, id);
      return p ? mention(p.userId, p.displayName) : null;
    }).filter(Boolean).join("، ");
    const sent = await this.group(resolutionText ? `${resolutionText}\n\n${fa.dayStart(game.dayNumber, secs, silenced || null)}` : fa.dayStart(game.dayNumber, secs, silenced || null), { reply_markup: { inline_keyboard: dayHostKeyboard() } });
    if (sent) await this.pin(sent.message_id);
    await this.sendGunnerPanels();
  }

  private async sendGunnerPanels(): Promise<void> {
    const game = this.game;
    if (!game) return;
    // Guns can now be held by ANY living player who received one from the
    // gunner overnight — not just the "gunner" role holder.
    for (const p of living(game.players)) {
      const guns = game.gunnerGuns[String(p.userId)] ?? [];
      if (guns.length === 0) continue;
      await this.pm(p.userId, fa.gunnerReceivedGun);
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
    // FIX #3: same ordering fix as enterNight — restrict players first, then
    // apply the chat-wide default lock, to avoid a gap where a player with an
    // individual permission override can still post.
    await this.relockAllPlayers();
    await this.lockGroup();
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

    // FIX #4: if the bot can't promote members at all, the whole point of the
    // defense phase (letting a muted accused speak) can never work. Skip it
    // and go straight to the verdict vote instead of parking the game in a
    // "defense" phase nobody can meaningfully use.
    if (!(await this.botCanPromoteChatMembers(game.chatId))) {
      game.accusedUserId = accusedUserId;
      await this.persist(true);
      await this.group(fa.defenseSkippedNoPromote(accused.displayName, accused.userId));
      await this.enterVerdict();
      return;
    }

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

    // FIX: central guard — this is the one place every transition path
    // (alarm's "timer", the skip button's "skip", and any internal "early"
    // call) funnels through. For "timer" specifically, we require the game
    // to still be active, in a real phase, with a phaseEndsAt that has
    // actually been reached — an alarm is only ever a hint to check, never
    // authorization to advance by itself. "skip" is deliberately exempt:
    // a host pressing "⏭ پایان مرحله" must always be able to end the phase
    // immediately, regardless of phaseEndsAt.
    if (reason === "timer") {
      const t = now();
      const blocked = !isActiveStatus(game.status) || !game.phase || !game.phaseEndsAt || t < game.phaseEndsAt;
      if (blocked) {
        console.error("advancePhase(timer) blocked — phase has not actually ended", {
          gameId: game.id, day: game.dayNumber, night: game.nightNumber,
          phase: game.phase, status: game.status, reason, now: t,
          phaseEndsAt: game.phaseEndsAt, remainingMs: game.phaseEndsAt ? game.phaseEndsAt - t : null,
          alarmKind: game.alarmKind,
        });
        await this.schedulePhaseTimers();
        await this.persist();
        return;
      }
    }

    // FIX: prevent two transitions from resolving the same phase twice (e.g.
    // the phase-end alarm and a host's Skip landing in the same tick). Only
    // one advancePhase() may be "in flight" at a time; a second call while
    // one is running is simply dropped — it would be trying to advance a
    // phase that (by the time it would run) is already gone.
    if (this.transitioning) {
      console.log("advancePhase ignored — a transition is already in progress", { gameId: game.id, reason });
      return;
    }
    this.transitioning = true;
    try {
      console.log("phase transition", {
        gameId: game.id, day: game.dayNumber, night: game.nightNumber,
        phase: game.phase, status: game.status, reason, now: now(),
        phaseEndsAt: game.phaseEndsAt,
        remainingMs: game.phaseEndsAt ? game.phaseEndsAt - now() : null,
        alarmKind: game.alarmKind,
      });
      if (game.status === "lobby") { await this.cancelInternal(fa.lobbyExpired); return; }
      if (game.status === "night") { await this.resolveNightPhase(); return; }
      if (game.status === "inquiry") { await this.resolveInquiryPhase(); return; }
      if (game.status === "day") { await this.enterNomination(); return; }
      if (game.status === "nomination") { await this.resolveNominationPhase(); return; }
      if (game.status === "defense") { await this.resolveDefensePhase(); return; }
      if (game.status === "verdict") { await this.resolveVerdictPhase(); return; }
      console.log("advance ignored", game.status, reason);
    } finally {
      this.transitioning = false;
    }
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
    await this.notifyLecterSuccession(res.deaths);

    for (const a of game.nightActions) {
      if (a.nightNumber === game.nightNumber && a.type === "heal" && a.targetId === a.actorId && !game.doctorSelfHealUsedBy.includes(a.actorId)) {
        game.doctorSelfHealUsedBy.push(a.actorId);
      }
    }

    // NATO chances — consumed on ANY resolved guess, correct or wrong.
    if (res.natoTarget && res.natoGuessCorrect !== null) {
      game.natoChancesLeft = Math.max(0, game.natoChancesLeft - 1);
    }

    // Invincible shield hits
    for (const userId of res.shieldAbsorbed) {
      const hits = game.invincibleShieldHits[String(userId)] ?? 0;
      await this.pm(userId, fa.invincibleShieldHit(Math.max(0, 3 - hits)));
    }


    // Bomber marks: if the bomb went off this night, the marked targets were
    // consumed by the explosion, so the list is cleared and NOT repopulated
    // with same-night marks (a bomber who both marks and detonates in one
    // night would otherwise have their fresh marks survive the blast).
    // Only when there was no explosion do newly-placed marks carry forward.
    if (res.bomberExploded) {
      game.bomberMarkedTargets = [];
    } else {
      for (const targetId of res.bomberMarked) {
        if (!game.bomberMarkedTargets.includes(targetId)) game.bomberMarkedTargets.push(targetId);
      }
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
        lines.push(fa.playerDied(p.displayName, p.userId, p.team, reason));
      }
    }
    await this.group(fa.nightReport(lines));

    // If the night's deaths already ended the game, skip the inquiry vote
    // and finish directly — the morning report above already covers the
    // "someone tell me who died" need, no point locking the group for a
    // vote nobody will get to act on.
    const winner = checkWinner(game.players);
    if (winner) { await this.finish(winner); return; }
    const indieWinner = checkIndependentWinner(game.players, game);
    if (indieWinner) { await this.finish(indieWinner); return; }

    if (res.deaths.length > 0 && game.cityInquiryCount > 0) {
      await this.startInquiry(res.deaths, game.dayNumber);
    } else {
      await this.enterDay("");
    }
  }

  private async startInquiry(deaths: DeathRecord[], dayNumber: number): Promise<void> {
    const game = this.game;
    if (!game) return;
    game.status = "inquiry";
    game.phase = "inquiry";
    game.pendingInquiryDeaths = deaths;
    game.inquiryVotes = game.inquiryVotes.filter((v) => v.dayNumber !== dayNumber);
    game.phaseEndsAt = now() + INQUIRY_SECONDS * 1000;
    game.reminderAt = null;
    game.nextTickAt = null;
    // Group stays locked from the night phase — we simply keep it that way
    // for a few more seconds instead of unlocking early.
    await this.persist(true);
    await this.schedulePhaseTimers();
    await this.group(fa.cityInquiryPrompt(INQUIRY_SECONDS, game.cityInquiryCount), {
      reply_markup: { inline_keyboard: inquiryKeyboard(dayNumber) },
    });
  }

  private async resolveInquiryPhase(): Promise<void> {
    const game = this.game;
    if (!game || game.status !== "inquiry") return;
    game.status = "resolving";
    game.phase = "resolving";
    await this.persist();

    const dayNumber = game.dayNumber;
    const res = resolveInquiry(game.inquiryVotes, dayNumber);
    const deaths = game.pendingInquiryDeaths ?? [];
    game.pendingInquiryDeaths = null;
    game.inquiryVotes = game.inquiryVotes.filter((v) => v.dayNumber !== dayNumber);

    // Final tally is always shown once the vote window ends, win/lose/tie
    // alike — only the role reveal itself is conditional on approval.
    let resolutionText = fa.cityInquiryResult(res.yes, res.no);
    if (res.approved) {
      game.cityInquiryCount = Math.max(0, game.cityInquiryCount - 1);
      resolutionText += "\n\n" + fa.cityInquiryRolesRevealed(deaths, game.players, game.cityInquiryCount);
    }

    await this.persist(true);
    await addEvent(this.env.DB, game.id, "inquiry_resolved", res);
    await this.enterDay(resolutionText);
  }

  private async applyInquiryVote(userId: number, dayNumber: number, choice: boolean): Promise<{ text: string; alert: boolean }> {
    const game = this.game;
    if (!game || game.status !== "inquiry" || game.dayNumber !== dayNumber) return { text: fa.staleAction, alert: true };
    const player = findPlayer(game.players, userId);
    if (!player || player.status !== "alive") return { text: fa.cityInquiryNotAllowed, alert: true };
    game.inquiryVotes = game.inquiryVotes.filter((v) => !(v.voterId === userId && v.dayNumber === dayNumber));
    game.inquiryVotes.push({ voterId: userId, choice, dayNumber, at: now() });
    await this.persist();

    // Private confirmation to the voter, plus a live-updating tally for
    // just their choice's running count posted to the group.
    await this.pm(userId, fa.cityInquiryVotePrivate(choice));
    const count = game.inquiryVotes.filter((v) => v.dayNumber === dayNumber && v.choice === choice).length;
    await this.group(fa.cityInquiryVoteGroup(choice, count));

    return { text: "", alert: false };
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

    // NOTE: Joker's win must NOT be checked here. Receiving the most votes
    // only sends a player to court (defense/verdict) — it never wins the
    // game by itself, even for the Joker. The Joker's win condition is
    // checked exclusively in resolveVerdictPhase, and only fires if the
    // verdict is "guilty" (executed). If acquitted there, no win is
    // recorded and the game continues normally.
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
        await this.notifyLecterSuccession([{ userId: accusedId, reason: "joker", revealedRole: accused.role! }]);
        await this.mutePlayer(accusedId);
        await this.persist(true);
        await this.group(fa.jokerWins(accused.displayName));
        await this.finish("independent");
        return;
      }

      game.players = applyDeaths(game.players, [{ userId: accusedId, reason: "lynch", revealedRole: accused.role!, revealedIndependentRole: accused.independentRole ?? undefined }], "verdict", game.dayNumber);
      await this.notifyLecterSuccession([{ userId: accusedId, reason: "lynch", revealedRole: accused.role! }]);
      await this.mutePlayer(accusedId);
    }

    game.accusedUserId = null;
    game.silencedUserIds = [];
    await this.persist(true);
    await addEvent(this.env.DB, game.id, "verdict_resolved", res);
    if (accused && stillAlive) await this.group(fa.verdictResult(accused.displayName, accused.userId, res, accused.team));

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
    // Central end-of-game pin cleanup — runs no matter which win condition
    // (town/mafia/independent) or other path led here, since every route to
    // game over passes through this one function.
    await this.unpinAllBotPins();
    game.status = "finished";
    game.phase = "finished";
    game.winner = winner;
    game.finishedAt = now();
    game.phaseEndsAt = null;
    game.alarmKind = "none";
    await this.ctx.storage.deleteAlarm();
    await this.restoreAllPermissions();
    await this.persist(true);
    // BUGFIX: credit Johnny/Bomber players who survived to see their side's
    // win, per their own stated win condition (see getSharedWinnerIds).
    const sharedWinnerIds = getSharedWinnerIds(game.players, winner);
    await recordFinishStats(this.env.DB, game.players, winner, sharedWinnerIds);
    await addEvent(this.env.DB, game.id, "finished", { winner, sharedWinnerIds });
    const sent = await this.group(fa.gameOver(winner, game.players, game.independentRoleType, sharedWinnerIds));
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
        // Valid targets are every living player except living mafia
        // teammates (checked above) — this must include Independents, so
        // there is no separate "must be town" restriction here.
        if (target.team === "mafia") return { text: fa.cannotKillTeammate, alert: true };
      }
      if (action === "heal" && player.role === "lecter") {
        // Lecter's targets are exactly the living mafia team (godfather,
        // nato, and himself) — self-protection is intentionally allowed.
        if (target.team !== "mafia") return { text: fa.lecterTownTarget, alert: true };
      }
      if (action === "heal" && player.role === "doctor" && targetId === userId) {
        if (game.doctorSelfHealUsedBy.includes(userId)) return { text: "نجات خودتان را قبلاً استفاده کرده‌اید.", alert: true };
      }
      if (action === "investigate" && player.independentRole === "lonewolf") {
        // FIX: this one-check-per-target restriction is specific to Lonewolf.
        // The Detective must be able to investigate the same player any
        // number of times, with no limit — detectiveChecked is still
        // recorded for the detective (used for the Godfather's first-check
        // reveal rule), it just no longer blocks repeat investigations.
        const prev = game.detectiveChecked[String(userId)] ?? [];
        if (prev.includes(targetId)) return { text: "این نفر را قبلاً استعلام کرده‌اید.", alert: true };
      }
      if (action === "snipe") {
        const left = game.sniperShotsLeft[String(userId)] ?? 0;
        if (left <= 0 && player.role === "sniper") return { text: "تیری برایتان نمانده.", alert: true };
      }
      if (action === "paranoid_alert") {
        if (game.paranoidAlertLeft <= 0) return { text: "دیگر امکان فعال کردن هوشیاری ندارید.", alert: true };
        // Vigilance is a self-only toggle, never a targeted action — reject
        // any stale/old-panel callback that tries to "target" someone else.
        if (targetId !== userId) return { text: fa.actionForbidden, alert: true };
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

    // Same team-wide visibility rule as the Godfather's kill above: any
    // action visible to the mafia team must reach every living mafia
    // member, not just whoever happens to be the target. Lecter's heal
    // (save) was missing this broadcast — Doctor's heal is unaffected
    // since Doctor isn't on the mafia team (livingMafia won't include them
    // as actor, and this block only fires for player.role === "lecter").
    if (action === "heal" && player.role === "lecter" && targetId > 0) {
      const target = findPlayer(game.players, targetId);
      for (const m of livingMafia(game.players)) {
        if (m.userId === userId) continue;
        await this.pm(m.userId, fa.mafiaSawSave(player.displayName, target?.displayName || "؟"));
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
    if (!target || target.status !== "alive" || target.team === "mafia") return { text: fa.targetNotInGame, alert: true };

    // Send role selection panel, built from every role actually in play this
    // game (all mafia/town roles among current players, plus the game's one
    // independent role if any) — NOT getTownRoles(), which only ever showed
    // town roles and made mafia/independent guesses impossible to register.
    // Deliberately no skip button here: choosing a target commits NATO to
    // that player for the night (per spec, this step must be completed once
    // started, not abandonable as a skip).
    const guessableRoles = gameRolesInPlay(game);
    const roleButtons = guessableRoles.map(({ id, emoji, name }) => ({
      text: `${emoji} ${name}`,
      callback_data: `NR${nightNumber}:${targetId}:${id}`,
    }));
    const keyboard: InlineKeyboard = chunk(roleButtons, 2);

    await this.pm(userId, fa.natoSelectRole(target.displayName), keyboard);
    return { text: `بازیکن <b>${target.displayName}</b> انتخاب شد. حالا نقش او را حدس بزنید.`, alert: false };
  }

  private async applyNatoRoleGuess(userId: number, nightNumber: number, targetId: number, roleId: GuessableRoleId): Promise<{ text: string; alert: boolean }> {
    const game = this.game;
    if (!game || game.status !== "night" || game.nightNumber !== nightNumber) return { text: fa.staleAction, alert: true };
    const player = findPlayer(game.players, userId);
    if (!player || player.status !== "alive" || player.role !== "nato") return { text: fa.actionForbidden, alert: true };
    if (game.natoChancesLeft <= 0) return { text: "تمام شانس‌های ناتو استفاده شده است.", alert: true };
    const target = findPlayer(game.players, targetId);
    if (!target || target.status !== "alive" || target.team === "mafia") return { text: fa.targetNotInGame, alert: true };
    const roleDef: { name: string } | undefined = (ROLES as Record<string, RoleDef>)[roleId] ?? (INDEPENDENT_ROLES as Record<string, IndependentRoleDef>)[roleId];
    if (!roleDef) return { text: fa.actionForbidden, alert: true };

    // Update existing NATO guess action
    const existingAction = game.nightActions.find((a) => a.actorId === userId && a.type === "nato_guess" && a.nightNumber === nightNumber);
    if (existingAction) {
      existingAction.targetId = targetId;
      existingAction.targetRole = roleId;
    } else {
      game.nightActions.push({ actorId: userId, type: "nato_guess", targetId, targetRole: roleId, nightNumber, at: now() });
    }

    await this.persist();
    await persistNightAction(this.env.DB, game.id, nightNumber, userId, "nato_guess", targetId, roleId);

    await this.pm(userId, fa.natoGuessMade(target.displayName, roleDef.name));

    // Same team-wide visibility rule as the Godfather's kill / Lecter's
    // save: NATO's guess must reach every other living mafia member too,
    // not just the actor.
    for (const m of livingMafia(game.players)) {
      if (m.userId === userId) continue;
      await this.pm(m.userId, fa.mafiaSawNatoGuess(player.displayName, target.displayName, roleDef.name));
    }

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
    // Any player who was given a gun can fire it — not just the "gunner" role.
    const player = findPlayer(game.players, userId);
    if (!player || player.status !== "alive") return { text: fa.actionForbidden, alert: true };
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
    await this.notifyLecterSuccession([{ userId: target.userId, reason: "gunner", revealedRole: target.role! }]);
    await this.mutePlayer(target.userId);
    await this.persist(true);
    await this.group(fa.playerDied(target.displayName, target.userId, target.team, fa.reasonGunner));

    let winner = checkWinner(game.players);
    if (winner) { await this.finish(winner); return { text: "شلیک انجام شد", alert: false }; }
    const indieWinner = checkIndependentWinner(game.players, game);
    if (indieWinner) { await this.finish(indieWinner); return { text: "شلیک انجام شد", alert: false }; }
    return { text: "شلیک انجام شد", alert: false };
  }

  private async applyGunnerGiveWar(userId: number, nightNumber: number, targetId: number): Promise<{ text: string; alert: boolean }> {
    const operation = this.gunnerActionQueue.then(() => this.applyGunnerGiveWarSerialized(userId, nightNumber, targetId));
    this.gunnerActionQueue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  // Returns whether this gunner already has a *valid* (targetId>0) war/black
  // action recorded for this specific night. This is the per-night source of
  // truth — deliberately separate from gunnerWarGunsGiven/gunnerBlackGunsGiven,
  // which are lifetime totals across both of the gunner's nights and can't by
  // themselves tell "did THIS night already finish". Only a request whose gun
  // was actually delivered counts; skips and rejected attempts never set this.
  private gunnerNightGunStatus(game: GameState, userId: number, nightNumber: number): { warGiven: boolean; blackGiven: boolean } {
    const warGiven = game.nightActions.some(
      (a) => a.actorId === userId && a.type === "gunner_give_war" && a.nightNumber === nightNumber && a.targetId !== null && a.targetId > 0,
    );
    const blackGiven = game.nightActions.some(
      (a) => a.actorId === userId && a.type === "gunner_give_black" && a.nightNumber === nightNumber && a.targetId !== null && a.targetId > 0,
    );
    return { warGiven, blackGiven };
  }

  private async applyGunnerGiveWarSerialized(userId: number, nightNumber: number, targetId: number): Promise<{ text: string; alert: boolean }> {
    const game = this.game;
    if (!game || game.status !== "night" || game.nightNumber !== nightNumber) return { text: fa.staleAction, alert: true };
    const player = findPlayer(game.players, userId);
    if (!player || player.status !== "alive" || player.role !== "gunner") return { text: fa.actionForbidden, alert: true };
    if (game.gunnerNightsUsed >= 2) return { text: fa.gunnerNoNightsLeft, alert: true };

    // FIX: Backend is the final authority — never trust that the panel is
    // gone or that this is the first time this callback has been seen. Once
    // a valid war gun has been recorded for THIS night, no further
    // gunner_give_war of any kind (a fresh pick, a stale panel, a duplicate
    // callback, a retry) is accepted for the same night, whether or not
    // black has been given yet. This also covers the "both already given"
    // case, since blackGiven implies warGiven.
    const { warGiven, blackGiven } = this.gunnerNightGunStatus(game, userId, nightNumber);
    if (blackGiven) return { text: fa.gunnerNightAlreadyDone, alert: true };
    if (warGiven) return { text: fa.gunnerWarAlreadyGiven, alert: true };

    // Explicit "امشب نمی‌خواهم تفنگ بدهم" — record it and stop; no black
    // panel is sent, and per spec this does NOT consume one of the 2 nights.
    if (targetId <= 0) {
      game.nightActions = game.nightActions.filter((a) => !(a.actorId === userId && (a.type === "gunner_give_war" || a.type === "gunner_give_black") && a.nightNumber === nightNumber));
      game.nightActions.push({ actorId: userId, type: "gunner_give_war", targetId: null, nightNumber, at: now() });
      await this.persist();
      await persistNightAction(this.env.DB, game.id, nightNumber, userId, "gunner_give_war", null);
      await this.pm(userId, fa.gunnerWarSkipped);
      if (hasFinishedAllNightActions(game)) {
        game.phaseEndsAt = Math.min(game.phaseEndsAt ?? now() + 3000, now() + 3000);
        await this.schedulePhaseTimers();
        await this.persist();
      }
      return { text: "ثبت شد", alert: false };
    }

    // Backend-enforced self-check on the Telegram numeric ID — never trust
    // that the UI already excluded the gunner from the list.
    if (targetId === userId) return { text: fa.gunnerCannotSelf, alert: true };

    const target = findPlayer(game.players, targetId);
    if (!target) return { text: fa.targetNotInGame, alert: true };
    if (target.status !== "alive") return { text: "این بازیکن زنده نیست.", alert: true };
    if (game.gunnerWarGunsGiven >= 2) return { text: fa.gunnerNoNightsLeft, alert: true };

    // No stale black selection can be lying around at this point — if one
    // existed for this night, blackGiven above would have already rejected
    // this request — but the filter is kept as defense in depth.
    game.nightActions = game.nightActions.filter((a) => !(a.actorId === userId && (a.type === "gunner_give_war" || a.type === "gunner_give_black") && a.nightNumber === nightNumber));
    game.nightActions.push({ actorId: userId, type: "gunner_give_war", targetId, nightNumber, at: now() });
    await this.persist();
    await persistNightAction(this.env.DB, game.id, nightNumber, userId, "gunner_give_war", targetId);

    await this.pm(userId, fa.gunnerWarChosen(target.displayName));
    await this.pm(userId, fa.gunnerBlackPrompt, gunnerBlackKeyboard(game.players, userId, targetId, nightNumber));
    return { text: "ثبت شد", alert: false };
  }

  private async applyGunnerGiveBlack(userId: number, nightNumber: number, targetId: number): Promise<{ text: string; alert: boolean }> {
    const operation = this.gunnerActionQueue.then(() => this.applyGunnerGiveBlackSerialized(userId, nightNumber, targetId));
    this.gunnerActionQueue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  private async applyGunnerGiveBlackSerialized(userId: number, nightNumber: number, targetId: number): Promise<{ text: string; alert: boolean }> {
    const game = this.game;
    if (!game || game.status !== "night" || game.nightNumber !== nightNumber) return { text: fa.staleAction, alert: true };
    const player = findPlayer(game.players, userId);
    if (!player || player.status !== "alive" || player.role !== "gunner") return { text: fa.actionForbidden, alert: true };
    if (game.gunnerNightsUsed >= 2) return { text: fa.gunnerNoNightsLeft, alert: true };

    // FIX: same per-night backend authority as the war step — once a valid
    // black gun has already been recorded for this night, no further
    // gunner_give_black (fresh, stale panel, duplicate, retry, race) is
    // accepted for the same night.
    const { blackGiven } = this.gunnerNightGunStatus(game, userId, nightNumber);
    if (blackGiven) return { text: fa.gunnerNightAlreadyDone, alert: true };

    const warAction = game.nightActions.find((a) => a.actorId === userId && a.type === "gunner_give_war" && a.nightNumber === nightNumber);
    if (!warAction || warAction.targetId === null) return { text: fa.gunnerMustChooseWarFirst, alert: true };
    const warTargetId = warAction.targetId;

    // No skip button on this step — a missing/invalid target is just rejected.
    if (targetId <= 0) return { text: "یک بازیکن انتخاب کنید.", alert: true };
    if (targetId === userId) return { text: fa.gunnerCannotSelf, alert: true };
    if (targetId === warTargetId) return { text: fa.gunnerSameRecipient, alert: true };

    const target = findPlayer(game.players, targetId);
    if (!target) return { text: fa.targetNotInGame, alert: true };
    if (target.status !== "alive") return { text: "این بازیکن زنده نیست.", alert: true };

    const warTarget = findPlayer(game.players, warTargetId);
    if (!warTarget || warTarget.status !== "alive") return { text: "گیرندهٔ تفنگ جنگی دیگر در بازی زنده نیست.", alert: true };
    if (game.gunnerWarGunsGiven >= 2 || game.gunnerBlackGunsGiven >= 2) return { text: fa.gunnerNoNightsLeft, alert: true };

    game.nightActions = game.nightActions.filter((a) => !(a.actorId === userId && a.type === "gunner_give_black" && a.nightNumber === nightNumber));
    game.nightActions.push({ actorId: userId, type: "gunner_give_black", targetId, nightNumber, at: now() });
    await this.persist();
    await persistNightAction(this.env.DB, game.id, nightNumber, userId, "gunner_give_black", targetId);

    // Both picks are now valid and complete — deliver both guns together,
    // atomically, and only now consume one of the gunner's 2 nights. A gun's
    // type is never revealed to its recipient until they actually fire it.
    const warGuns = game.gunnerGuns[String(warTargetId)] ?? [];
    warGuns.push("war");
    game.gunnerGuns[String(warTargetId)] = warGuns;

    const blackGuns = game.gunnerGuns[String(targetId)] ?? [];
    blackGuns.push("black");
    game.gunnerGuns[String(targetId)] = blackGuns;

    game.gunnerNightsUsed += 1;
    game.gunnerWarGunsGiven += 1;
    game.gunnerBlackGunsGiven += 1;

    await this.pm(userId, fa.gunnerBlackChosen(target.displayName));
    await this.persist(true);

    if (hasFinishedAllNightActions(game)) {
      game.phaseEndsAt = Math.min(game.phaseEndsAt ?? now() + 3000, now() + 3000);
      await this.schedulePhaseTimers();
      await this.persist();
    }
    return { text: "ثبت شد", alert: false };
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
    // BUGFIX: this write to the dedicated verdict_votes table was missing,
    // so verdict votes only ever lived inside the state_json snapshot. If
    // that snapshot were ever unparseable, votes cast in the current
    // verdict phase had nowhere else to be recovered from.
    await persistVerdictVote(this.env.DB, game.id, dayNumber, userId, guilty, weight);
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
    // FIX #4: Use Promise.allSettled so that one failed PM (e.g. user blocked
    // the bot, Telegram rate limit) doesn't abort the entire role-distribution
    // and leave the game stuck on the "night" phase with no prompts sent.
    // Failed players can still recover their role via /myrole.
    const results = await Promise.allSettled(
      game.players.map((p) => {
        const mates = p.team === "mafia" ? game.players.filter((x) => x.team === "mafia") : [];
        return this.pm(p.userId, fa.roleCard(p, mates));
      }),
    );
    const failedPlayers = game.players.filter((_, i) => results[i]?.status === "rejected");
    if (failedPlayers.length > 0) {
      console.warn(`sendRoleCards: ${failedPlayers.length}/${game.players.length} players did not receive their role card`, failedPlayers.map((p) => p.userId));
      // FIX #8: report the list of players who didn't get their role card to
      // the group/host instead of only logging it, so the host knows who
      // might need to run /myrole manually rather than silently wondering
      // why someone never acted at night.
      await this.group(fa.roleCardsFailed(failedPlayers.map((p) => p.displayName)));
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
        await this.pm(p.userId, fa.paranoidPrompt(secs, game.paranoidAlertLeft), paranoidDecisionKeyboard(p.userId, game.nightNumber));
        continue;
      }

      if (p.role === "mayor" || p.role === "invincible") {
        await this.pm(p.userId, fa.nightCitizenWait);
        continue;
      }

      if (p.role === "gunner") {
        if (game.gunnerNightsUsed >= 2) {
          await this.pm(p.userId, fa.nightCitizenWait);
        } else {
          await this.pm(p.userId, fa.gunnerWarPrompt(secs), gunnerWarKeyboard(game.players, p.userId, game.nightNumber));
        }
        continue;
      }

      if (p.role === "lecter") {
        await this.pm(p.userId, fa.lecterPrompt(secs), nightTargetKeyboard(game.players, p.userId, game.nightNumber, "heal", { includeSelf: true, skipLabel: "⏭ امشب محافظت نمی‌کنم" }));
        continue;
      }

      if (p.role === "nato") {
        if (game.natoChancesLeft <= 0) {
          await this.pm(p.userId, fa.nightCitizenWait);
        } else {
          await this.pm(p.userId, fa.natoPrompt(secs, game.natoChancesLeft), natoTargetKeyboard(game.players, p.userId, game.nightNumber));
        }
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
        const needs = nightActionTypesFor(p.role, p.independentRole).filter((a) => a !== "snipe" && a !== "escort_block" && a !== "paranoid_alert" && a !== "nato_guess" && a !== "gunner_give_war");
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

  // Runs the Lecter->Godfather succession check and — if it fired — tells
  // ONLY the promoted player via PV. Deliberately never touches this.group()
  // or any public/group-facing message; the group only ever sees the
  // original Godfather's death, never who (if anyone) replaced him.
  private async notifyLecterSuccession(deaths: DeathRecord[]): Promise<void> {
    const game = this.game;
    if (!game) return;
    const promoted = checkLecterSuccession(game, deaths);
    if (promoted) {
      await this.pm(promoted.userId, fa.lecterSuccession());
    }
  }

  private async eliminate(userId: number, reason: "left" | "host"): Promise<void> {
    const game = this.game;
    if (!game) return;
    const p = findPlayer(game.players, userId);
    if (!p || p.status !== "alive" || !p.role) return;
    game.players = applyDeaths(game.players, [{ userId, reason, revealedRole: p.role, revealedIndependentRole: p.independentRole }], game.phase, game.phase === "night" ? game.nightNumber : game.dayNumber);
    await this.notifyLecterSuccession([{ userId, reason, revealedRole: p.role }]);
    await this.mutePlayer(userId);
    await this.persist(true);
    await this.group(fa.playerDied(p.displayName, p.userId, p.team, reason === "left" ? fa.reasonLeft : fa.reasonLynch));
    let winner = checkWinner(game.players);
    if (winner) await this.finish(winner);
  }

  // ===========================================================================
  // KILL ADMIN — independent moderation feature (see module-level helpers
  // isKillAdmin/addKillAdmin above). Intentionally kept separate from every
  // Role/NightAction/Vote code path:
  //   - Permission is checked purely against msg.from.id (Telegram numeric
  //     user ID), never username/display name/reply-from text.
  //   - No NightAction is recorded, no Vote is cast, no Role ability is
  //     consumed, no Phase is advanced.
  //   - The actual kill reuses applyDeaths() — the same central death path
  //     used by lynch/host-removal (see eliminate() above) — so game state
  //     never diverges into a parallel death system.
  // ===========================================================================
  private async cmdKill(msg: TgMessage): Promise<void> {
    const from = msg.from;
    if (!from) return;
    const targetUser = msg.reply_to_message?.from;
    if (!targetUser) return; // /kill without a reply selects nobody — no-op.
    if (!(await isKillAdmin(this.env.DB, from.id))) return; // unauthorized — completely silent, no side effects.

    const game = this.game;
    if (!game || !isActiveStatus(game.status)) return; // no active game in this chat.

    const player = findPlayer(game.players, targetUser.id);
    if (!player || player.status !== "alive" || !player.role) return; // already dead / left / never in this game.

    game.players = applyDeaths(
      game.players,
      [{ userId: player.userId, reason: "admin_kill", revealedRole: player.role, revealedIndependentRole: player.independentRole }],
      game.phase,
      game.phase === "night" ? game.nightNumber : game.dayNumber,
    );
    await this.notifyLecterSuccession([{ userId: player.userId, reason: "admin_kill", revealedRole: player.role }]);
    await this.mutePlayer(player.userId);
    await this.persist(true);
    await this.group(fa.playerDied(player.displayName, player.userId, player.team, fa.reasonAdminKill));
    const winner = checkWinner(game.players);
    if (winner) await this.finish(winner);
  }

  // Anti role-leak pipeline, run on every plain (non-command) group message.
  // Stage 1 (local keyword filter) happens first and is free — only a match
  // triggers the DeepSeek call. See ROLE_LEAK_TRIGGER_WORDS / checkRoleLeakWithAI.
  private async handleGroupTextForRoleLeak(msg: TgMessage): Promise<void> {
    const from = msg.from;
    const text = msg.text ?? "";
    if (!from || !text) return;

    const game = this.game;
    if (!game || !isActiveStatus(game.status)) return;

    const player = findPlayer(game.players, from.id);
    if (!player || player.status !== "alive" || (!player.role && !player.independentRole)) return; // not a live player in this game — nothing to check.

    if (!containsRoleLeakTrigger(text)) return; // stage 1 filter: no trigger word, no API call.

    const verdict = await checkRoleLeakWithAI(this.env, text, activeRoleNamesForGame(game));
    // Fail open on timeout/error/low confidence: the message is left untouched
    // and nothing else happens, so a broken API can never block the game.
    if (!verdict || !verdict.leak || verdict.confidence < ROLE_LEAK_CONFIDENCE_THRESHOLD) return;

    const delRes = await this.tg.callSafe("deleteMessage", { chat_id: game.chatId, message_id: msg.message_id });
    if (!delRes.ok) console.error("role-leak deleteMessage failed", delRes.error.description);

    const key = String(from.id);
    const count = (game.roleLeakWarnings[key] ?? 0) + 1;
    game.roleLeakWarnings[key] = count;
    await this.persist(true);

    // Internal-only diagnostic log (raw AI verdict + message text). Never
    // surfaced in the group or any user-facing output.
    console.log("role-leak detected", {
      chatId: game.chatId, userId: from.id, warnCount: count,
      confidence: verdict.confidence, aiReason: verdict.reason, text,
    });

    await this.pm(from.id, fa.roleLeakWarned(count, ROLE_LEAK_WARNING_LIMIT));

    if (count >= ROLE_LEAK_WARNING_LIMIT) {
      await this.eliminateForRoleLeak(player.userId);
    }
  }

  // Removes a player immediately for accumulating ROLE_LEAK_WARNING_LIMIT
  // role-leak warnings. Deliberately mirrors cmdKill's elimination exactly
  // (same applyDeaths/notifyLecterSuccession/mutePlayer path) so this is an
  // unconditional admin-style removal — NOT a role action — and is never
  // affected by protective roles like Doctor or Paranoid.
  private async eliminateForRoleLeak(userId: number): Promise<void> {
    const game = this.game;
    if (!game) return;
    const player = findPlayer(game.players, userId);
    if (!player || player.status !== "alive" || (!player.role && !player.independentRole)) return;

    game.players = applyDeaths(
      game.players,
      [{ userId: player.userId, reason: "role_leak", revealedRole: player.role, revealedIndependentRole: player.independentRole }],
      game.phase,
      game.phase === "night" ? game.nightNumber : game.dayNumber,
    );
    await this.notifyLecterSuccession([{ userId: player.userId, reason: "role_leak", revealedRole: player.role }]);
    await this.mutePlayer(player.userId);
    await this.pm(player.userId, fa.roleLeakEliminated(ROLE_LEAK_WARNING_LIMIT));
    await this.persist(true);
    // Group only learns "removed for a rules violation" — never the internal
    // reason, filtered words, or the message content that triggered it.
    await this.group(fa.roleLeakGroupNotice(player.displayName, player.userId));
    const winner = checkWinner(game.players);
    if (winner) await this.finish(winner);
  }

  private async cmdAddKill(msg: TgMessage): Promise<void> {
    const from = msg.from;
    if (!from) return;
    if (from.id !== SUPER_KILL_ADMIN_ID) return; // only the super admin may grant Kill Admin — silent no-op otherwise.

    const parsed = parseCommand(msg.text ?? "");
    const replyTarget = msg.reply_to_message?.from;
    let targetId: number | null = null;
    if (replyTarget) {
      targetId = replyTarget.id;
    } else if (parsed?.args) {
      const n = Number(parsed.args.trim());
      if (Number.isInteger(n) && n > 0) targetId = n;
    }
    if (targetId === null) return; // no reply and no valid numeric ID — no-op.

    await addKillAdmin(this.env.DB, targetId, from.id);
    await this.group(`✅ کاربر <code>${targetId}</code> به Kill Admin اضافه شد.`);
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

    // FIX #4: retry the demotion a few times with a short backoff before
    // giving up. If it still fails (network hiccup, Telegram rate limit,
    // etc.) don't leave the game stuck waiting on it forever — report the
    // problem to the group and clear our own bookkeeping so play can
    // continue. The user stays a Telegram admin until a host manually fixes
    // it, but the *game* is never blocked by that.
    let demotionError: string | null = null;
    let demotedOk = false;
    for (let attempt = 0; attempt < 3 && !demotedOk; attempt++) {
      const demoted = await this.tg.callSafe("promoteChatMember", { chat_id: game.chatId, user_id: temporaryId, ...COURT_ADMIN_NO_RIGHTS });
      demotedOk = demoted.ok;
      demotionError = demoted.ok ? null : demoted.error.description;
      if (!demotedOk && attempt < 2) await sleep(300 * (attempt + 1));
    }
    if (!demotedOk) {
      console.error("court temporary demotion failed after retries", game.id, temporaryId, demotionError ?? "unknown");
      game.temporaryCourtAdminUserId = null;
      try { await this.persist(); } catch (err) { console.error("court demotion marker persist failed", game.id, temporaryId, err); }
      await this.group(fa.courtDemotionFailed(findPlayer(game.players, temporaryId)?.displayName ?? String(temporaryId)));
      return false;
    }

    game.temporaryCourtAdminUserId = null;
    try { await this.persist(); } catch (err) { console.error("court demotion marker persist failed", game.id, temporaryId, err); }
    return true;
  }

  private async snapshotPermissions(): Promise<void> {
    const game = this.game;
    if (!game || game.isVirtual) return;
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
    if (!game || game.isVirtual) return;
    await this.tg.callSafe("setChatPermissions", { chat_id: game.chatId, permissions: LOCKED_PERMISSIONS, use_independent_chat_permissions: true });
  }

  // FIX #3: unlockForDay/relockAllPlayers no longer let one failed
  // restrictChatMember call (e.g. target is an admin the bot can't restrict)
  // silently stop the loop partway through — every player is still attempted,
  // failures are collected into failedRestrictions, logged, and reported once
  // to the group at the end instead of leaving the rest of the players
  // out of sync with the game's intended permission state.
  private async unlockForDay(): Promise<void> {
    const game = this.game;
    if (!game || game.isVirtual) return;
    await this.tg.callSafe("setChatPermissions", { chat_id: game.chatId, permissions: DAY_PERMISSIONS, use_independent_chat_permissions: true });
    const failedRestrictions: string[] = [];
    for (const p of game.players) {
      if (p.originalMember?.isAdmin) continue;
      const permissions = p.status === "alive" && !game.silencedUserIds.includes(p.userId) ? DAY_PERMISSIONS : LOCKED_PERMISSIONS;
      const res = await this.tg.callSafe("restrictChatMember", { chat_id: game.chatId, user_id: p.userId, permissions, use_independent_chat_permissions: true });
      if (!res.ok) { console.error("unlockForDay: restrict failed", game.chatId, p.userId, res.error.description); failedRestrictions.push(p.displayName); }
    }
    if (failedRestrictions.length) await this.group(fa.restrictionsFailed(failedRestrictions));
  }

  private async relockAllPlayers(): Promise<void> {
    const game = this.game;
    if (!game || game.isVirtual) return;
    const failedRestrictions: string[] = [];
    for (const p of game.players) {
      if (p.originalMember?.isAdmin) continue;
      const res = await this.tg.callSafe("restrictChatMember", { chat_id: game.chatId, user_id: p.userId, permissions: LOCKED_PERMISSIONS, use_independent_chat_permissions: true });
      if (!res.ok) { console.error("relockAllPlayers: restrict failed", game.chatId, p.userId, res.error.description); failedRestrictions.push(p.displayName); }
    }
    if (failedRestrictions.length) await this.group(fa.restrictionsFailed(failedRestrictions));
  }

  private async mutePlayer(userId: number): Promise<void> {
    const game = this.game;
    if (!game || game.isVirtual) return;
    const p = findPlayer(game.players, userId);
    if (p?.originalMember?.isAdmin) { await this.group(fa.cannotMuteAdmin(p.displayName)); return; }
    const res = await this.tg.callSafe("restrictChatMember", { chat_id: game.chatId, user_id: userId, permissions: LOCKED_PERMISSIONS, use_independent_chat_permissions: true });
    if (!res.ok && res.error.description.toLowerCase().includes("admin")) await this.group(fa.cannotMuteAdmin(p?.displayName || String(userId)));
  }

  private async restoreAllPermissions(): Promise<void> {
    const game = this.game;
    if (!game || game.isVirtual) return;
    // FIX #3: Always fall back to a known-safe default (OPEN_PERMISSIONS) when
    // a player's pre-game snapshot is missing (e.g. the game state was
    // recovered from D1 after a Durable Object reset and per-player
    // originalMember data wasn't available), instead of leaving that player
    // with whatever restrictive permissions the game last set. Where a
    // snapshot IS available, merge it on top of OPEN_PERMISSIONS so the
    // player's actual prior permissions are respected rather than opened
    // wider than they were before the game.
    const defaults = game.savedDefaultPermissions ?? OPEN_PERMISSIONS;
    await this.tg.callSafe("setChatPermissions", { chat_id: game.chatId, permissions: defaults, use_independent_chat_permissions: true });
    const failedRestrictions: string[] = [];
    for (const p of game.players) {
      if (p.originalMember?.isAdmin) continue;
      const perPlayerPermissions = p.originalMember?.permissions ?? defaults;
      const res = await this.tg.callSafe("restrictChatMember", { chat_id: game.chatId, user_id: p.userId, permissions: { ...OPEN_PERMISSIONS, ...perPlayerPermissions }, use_independent_chat_permissions: true });
      if (!res.ok) { console.error("restoreAllPermissions: restrict failed", game.chatId, p.userId, res.error.description); failedRestrictions.push(p.displayName); }
    }
    if (failedRestrictions.length) await this.group(fa.restrictionsFailed(failedRestrictions));
  }

  private async refreshLobbyMessage(): Promise<void> {
    const game = this.game;
    if (!game || game.status !== "lobby") return;
    const extra = fa.lobbyCreated(mention(game.hostId, findPlayer(game.players, game.hostId)?.displayName || "میزبان"));
    const text = `${extra}\n\n${fa.lobbyBody(game)}`;
    // FIX #2 (companion): If we don't have a pointer to the lobby message
    // (e.g. just recovered from D1, or the previous send failed), send a
    // fresh one instead of silently doing nothing. Without this, a recovered
    // lobby would appear empty until the host ran /new again.
    if (!game.lastGroupMessageId) {
      const me = await this.ensureBotIdentity();
      if (me) game.botUsername = me.username;
      const sent = await this.tg.callSafe<TgMessage>("sendMessage", {
        chat_id: game.chatId, text, parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: lobbyKeyboard(game.botUsername, game.chatId) },
      });
      if (sent.ok) {
        game.lastGroupMessageId = sent.result.message_id;
        await this.persist();
        await this.pin(sent.result.message_id);
      }
      return;
    }
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
    // FIX #2: Don't clobber the lobby message ID once the game has left
    // lobby phase. During the game, phase messages (night/day/nomination/...)
    // legitimately become the new "current" message, but if a bug ever puts
    // us back into a lobby-like state, this would otherwise hijack the
    // lobby pointer and break refreshLobbyMessage.
    if (game.status !== "lobby") {
      game.lastGroupMessageId = res.result.message_id;
    }
    return res.result;
  }

  // Sends a plain, one-off announcement to the group (join/leave notices, etc.) WITHOUT
  // touching game.lastGroupMessageId. That field is the pointer refreshLobbyMessage() (and
  // the phase-transition flow) uses to know which message to edit. group() intentionally
  // repoints it whenever it sends a message that should become the new "current" reference
  // (e.g. the day/night phase message). Using group() for join/leave announcements was a
  // bug: every join or leave silently hijacked lastGroupMessageId to point at the brand-new
  // announcement instead of the pinned lobby card, so refreshLobbyMessage() ended up editing
  // that announcement into a duplicate lobby card while the real pinned lobby message froze
  // and never reflected new players — making it look like joining the lobby didn't work.
  private async announce(text: string): Promise<TgMessage | null> {
    const game = this.game;
    if (!game) return null;
    const res = await this.tg.callSafe<TgMessage>("sendMessage", {
      chat_id: game.chatId, text, parse_mode: "HTML", disable_web_page_preview: true,
    });
    if (!res.ok) { console.error("announce send failed", res.error); return null; }
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
    if (!game.botPinnedMessageIds.includes(messageId)) game.botPinnedMessageIds.push(messageId);
  }

  private async unpin(): Promise<void> {
    const game = this.game;
    if (!game?.pinnedMessageId) return;
    await this.tg.callSafe("unpinChatMessage", { chat_id: game.chatId, message_id: game.pinnedMessageId });
    game.botPinnedMessageIds = game.botPinnedMessageIds.filter((id) => id !== game.pinnedMessageId);
  }

  // Unpins EVERY message the bot has pinned during the current game (not
  // just the latest one) and clears the tracking list. Used by both /delpin
  // and the end-of-game cleanup — one shared implementation so they can
  // never drift apart.
  private async unpinAllBotPins(): Promise<number> {
    const game = this.game;
    if (!game || game.botPinnedMessageIds.length === 0) return 0;
    const ids = [...game.botPinnedMessageIds];
    let count = 0;
    for (const id of ids) {
      const res = await this.tg.callSafe("unpinChatMessage", { chat_id: game.chatId, message_id: id });
      if (res.ok) count += 1;
    }
    game.botPinnedMessageIds = [];
    game.pinnedMessageId = null;
    return count;
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
    // FIX #10: If we somehow ended up in a "non-playing" status with a stale
    // phaseEndsAt lying around (e.g. cmdReset was called between two phases
    // and a queued alarm try/catch recovery left a clock arm), make sure we
    // don't accidentally re-arm an alarm for a finished/cancelled/idle game.
    if (!isActiveStatus(game.status)) {
      game.alarmKind = "none";
      await this.ctx.storage.deleteAlarm();
      return;
    }
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

  // FIX #4: check this up front so enterDefense can skip straight to voting
  // instead of promoting the accused, discovering the bot can't, and leaving
  // them stuck mute in a phase built around them being able to speak.
  private async botCanPromoteChatMembers(chatId: number): Promise<boolean> {
    const me = await this.ensureBotIdentity();
    if (!me) return false;
    const member = await this.tg.callSafe<TgChatMember>("getChatMember", { chat_id: chatId, user_id: me.id });
    return member.ok && member.result.status === "administrator" && !!member.result.can_promote_members;
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
      created_at: number; updated_at: number; state_json: string | null; last_group_message_id: number | null;
    }>();
    if (!gameRow) return;

    // FIX #2: if a full state snapshot was persisted (state_json), rehydrate
    // from it directly instead of reconstructing from the lossy per-column
    // fallback below. This is what preserves verdictVotes, ammo/charge
    // counters, shield hits, gun inventories and the block/silence lists
    // across a Durable Object reset. We still validate it's a sane object
    // before trusting it, and fall through to the legacy reconstruction if
    // parsing fails or the row predates this column.
    if (gameRow.state_json) {
      try {
        const snapshot = JSON.parse(gameRow.state_json) as GameState;
        if (snapshot && typeof snapshot === "object" && snapshot.id === gameRow.id) {
          this.game = snapshot;
          // Safety default for games saved before roleLeakWarnings existed.
          if (!this.game.roleLeakWarnings) this.game.roleLeakWarnings = {};
          await this.persist();
          if (isActiveStatus(this.game.status)) await this.ensureAlarm();
          return;
        }
      } catch (err) {
        console.error("recoverFromD1: failed to parse state_json, falling back to legacy reconstruction", gameRow.id, err);
      }
    }

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
      targetRole: (r.target_role as GuessableRoleId | null) ?? null,
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

    // Best-effort replay: has the Godfather already been investigated once
    // before (his one-time "town" reveal already used up)?
    const godfatherPlayer = players.find((p) => p.role === "godfather");
    const godfatherRevealed = godfatherPlayer
      ? nightActions.some((a) => a.type === "investigate" && a.targetId === godfatherPlayer.userId)
      : false;

    // Best-effort replay: how many nights did the gunner fully complete
    // (both a war and a black gun successfully assigned that same night)?
    // Guns already delivered but not yet fired are NOT restored here (same
    // unavoidable cold-recovery gap as verdictVotes/inquiryVotes below) —
    // only the "chances used" counters, so a restart can't grant extra nights.
    let gunnerNightsUsed = 0, gunnerWarGunsGiven = 0, gunnerBlackGunsGiven = 0;
    const gunnerNightsSeen = new Set(
      nightActions.filter((a) => a.type === "gunner_give_war" && a.targetId !== null).map((a) => a.nightNumber),
    );
    for (const n of gunnerNightsSeen) {
      const hasWar = nightActions.some((a) => a.type === "gunner_give_war" && a.nightNumber === n && a.targetId !== null);
      const hasBlack = nightActions.some((a) => a.type === "gunner_give_black" && a.nightNumber === n && a.targetId !== null);
      if (hasWar && hasBlack) { gunnerNightsUsed += 1; gunnerWarGunsGiven += 1; gunnerBlackGunsGiven += 1; }
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
      // FIX #9: phase_ends_at is already the day's real end time; there is no
      // persisted "day started at" to derive a correct extend-cap from here,
      // so we must NOT fabricate one by adding daySecondsMax on top of the
      // end time (that silently inflated the /extend ceiling on this
      // legacy-recovery path). Leaving it null just means /extend has no cap
      // for the rest of this recovered day, instead of an incorrect one.
      phaseEndsAt: gameRow.phase_ends_at,
      dayPhaseMaxEndsAt: null,
      reminderAt: null,
      nextTickAt: null,
      alarmKind: "phase_end",
      players,
      nightActions,
      votes,
      verdictVotes: [], // not persisted to D1; unavoidable gap on cold recovery
      inquiryVotes: [], // not persisted to D1; unavoidable gap on cold recovery
      cityInquiryCount: CITY_INQUIRY_TOTAL,
      pendingInquiryDeaths: null,
      accusedUserId: null,
      temporaryCourtAdminUserId: null,
      silencedUserIds: [],
      blockedUserIds: [],
      escortBlockedUserIds: [],
      doctorSelfHealUsedBy: [],
      sniperShotsLeft: {},
      detectiveChecked,
      godfatherRevealed,
      natoChancesLeft: 2,
      paranoidAlertLeft: 2,
      bomberMarkedTargets,
      invincibleShieldHits: {},
      gunnerGuns: {},
      gunnerNightsUsed, gunnerWarGunsGiven, gunnerBlackGunsGiven,
      independentRoleType,
      savedDefaultPermissions,
      // FIX #6: prefer the persisted pointer to the lobby/status card so
      // refreshLobbyMessage() can keep editing it in place instead of
      // silently starting a brand-new message thread after recovery.
      lastGroupMessageId: gameRow.last_group_message_id,
      pinnedMessageId: null,
      botPinnedMessageIds: [],
      winner: (gameRow.winner as Team | null) ?? null,
      botUsername: null,
      botId: null,
      config,
      createdAt: gameRow.created_at,
      updatedAt: gameRow.updated_at,
      startedAt: gameRow.started_at,
      finishedAt: gameRow.finished_at,
      lobbyCode: null,
      dayStartedAt: null,
      miniAppChat: [],
      isVirtual: false,
      roleLeakWarnings: {}, // not persisted per-column to D1; unavoidable gap on cold recovery
    };

    await this.persist();
    if (isActiveStatus(this.game.status)) await this.ensureAlarm();
  }

  private async handleApiState(userId: number): Promise<Response> {
    if (!this.game) return Response.json({ ok: false, error: "No game" });
    const g = this.game;
    const p = findPlayer(g.players, userId);

    let availableAction: any = null;
    let youStatus = p ? p.status : 'left';
    let roleDescription = p?.role ? (ROLES[p.role]?.description || '') : (p?.independentRole ? (INDEPENDENT_ROLES[p.independentRole]?.description || '') : '');

    if (p && p.status === 'alive') {
      if (g.status === 'night') {
        if (p.independentRole === 'bomber') {
            availableAction = { type: 'bomber_mark', targets: nightTargetsFor(g.players, userId, 'bomber_mark').map(x=>x.userId), canExplode: g.bomberMarkedTargets.length > 0, markedCount: g.bomberMarkedTargets.length, skipLabel: '⏭ رد کردن این شب' };
        } else if (p.independentRole === 'johnny') {
             availableAction = { type: 'johnny_kill', targets: nightTargetsFor(g.players, userId, 'johnny_kill').map(x=>x.userId), skipLabel: '⏭ امشب قتل نمی‌کنم' };
        } else if (p.independentRole === 'lonewolf') {
             availableAction = { type: 'investigate', targets: nightTargetsFor(g.players, userId, 'investigate').map(x=>x.userId), skipLabel: '⏭ رد کردن این شب' };
        } else if (p.role === 'paranoid') {
             if (g.paranoidAlertLeft > 0) availableAction = { type: 'paranoid_alert', skipLabel: '❌ نمی‌خواهم امشب هوشیار باشم' };
        } else if (p.role === 'gunner') {
             if (g.gunnerNightsUsed < 2) {
                 const { warGiven, blackGiven } = this.gunnerNightGunStatus(g, userId, g.nightNumber);
                 if (!warGiven) availableAction = { type: 'gunner_give_war', targets: g.players.filter(x=>x.userId !== userId && x.status === 'alive').map(x=>x.userId), skipLabel: '⏭ امشب تفنگ نمی‌دهم' };
                 else if (!blackGiven) availableAction = { type: 'gunner_give_black', targets: g.players.filter(x=>x.userId !== userId && x.status === 'alive' && !g.nightActions.some(a=>a.actorId===userId&&a.type==="gunner_give_war"&&a.targetId===x.userId)).map(x=>x.userId) };
             }
        } else if (p.role === 'nato') {
             if (g.natoChancesLeft > 0) availableAction = { type: 'nato_guess', targets: nightTargetsFor(g.players, userId, 'nato_guess').map(x=>x.userId), guessableRoles: gameRolesInPlay(g), skipLabel: '⏭ رد کردن این شب' };
        } else {
             const def = ROLES[p.role!];
             if (def?.nightAction) availableAction = { type: def.nightAction, targets: nightTargetsFor(g.players, userId, def.nightAction, { includeSelf: def.id === 'doctor' || def.id === 'lecter' }).map(x=>x.userId), skipLabel: (def.nightOptional || def.id === 'doctor' || def.id === 'lecter') ? '⏭ امشب رد می‌کنم' : null };
        }
      } else if (g.status === 'day') {
          const guns = g.gunnerGuns[String(userId)] ?? [];
          if (guns.length > 0) availableAction = { type: 'gunner_shot', targets: g.players.filter(x=>x.userId !== userId && x.status === 'alive').map(x=>x.userId) };
      }
    }

    // TURN BASED CHAT CALCULATION (40 SECONDS)
    let currentSpeakerId = null;
    let speakerEndsAt = null;
    let speakerTimeLeft = 0;

    if (g.status === 'day' && g.dayStartedAt) {
       const alive = g.players.filter(x => x.status === 'alive');
       if (alive.length > 0) {
           const elapsed = now() - g.dayStartedAt;
           const turnDuration = 40000;
           const turnIndex = Math.floor(elapsed / turnDuration);
           const speaker = alive[turnIndex % alive.length];
           currentSpeakerId = speaker.userId;
           speakerEndsAt = g.dayStartedAt + (turnIndex + 1) * turnDuration;
           speakerTimeLeft = Math.max(0, Math.ceil((speakerEndsAt - now()) / 1000));
       }
    }

    const sanitizedGame = {
      chatId: g.chatId,
      status: g.status,
      phase: g.phase,
      dayNumber: g.dayNumber,
      nightNumber: g.nightNumber,
      chatTitle: g.chatTitle,
      phaseEndsAt: g.phaseEndsAt,
      winner: g.winner,
      accusedUserId: g.accusedUserId,
      lobbyCode: g.lobbyCode,
      votes: g.votes,
      verdictVotes: g.verdictVotes,
      inquiryVotes: g.inquiryVotes,
      timeline: [],
      currentSpeakerId,
      speakerEndsAt,
      speakerTimeLeft,
      miniAppChat: g.miniAppChat || [],
      players: g.players.map(x => ({
          userId: x.userId,
          displayName: x.displayName,
          status: x.status,
          isHost: x.userId === g.hostId,
          role: g.status === 'finished' ? x.role : null,
          independentRole: g.status === 'finished' ? x.independentRole : null,
          deathReason: x.deathReason,
          team: g.status === 'finished' ? x.team : null,
      }))
    };

    return Response.json({
      ok: true,
      game: sanitizedGame,
      you: p ? {
          userId: p.userId, status: youStatus, role: p.role, independentRole: p.independentRole, team: p.team, roleDescription, availableAction,
          natoChancesLeft: g.natoChancesLeft, paranoidAlertLeft: g.paranoidAlertLeft,
          sniperShotsLeft: p.role === 'sniper' ? (g.sniperShotsLeft[String(userId)] ?? 0) : null,
          gunnerNightsLeft: p.role === 'gunner' ? Math.max(0, 2 - g.gunnerNightsUsed) : null,
      } : null
    });
  }

  private async handleApiAction(userId: number, userName: string, body: any): Promise<Response> {
    const { action, targetId, targetRole, guilty, choice, text } = body;
    const g = this.game;
    if (!g) return Response.json({ ok: false, error: "No game" });

    // LEAVE / CANCEL LOBBY (mini-app previously had no way to get out of a
    // created/joined virtual lobby at all — this is what lets a user
    // un-stick themselves instead of being permanently locked out of every
    // future game. Reuses leavePlayer(), the exact same logic the text/group
    // /leave command uses: a regular player is just removed, but the host
    // (or the last remaining player) leaving cancels the whole lobby.)
    if (action === "leave_lobby" || action === "cancel_lobby") {
        if (g.status !== "lobby") return Response.json({ ok: false, error: "بازی در جریان است؛ ابتدا آن را از میان بازی لغو کنید." });
        await this.leavePlayer(userId, true);
        return Response.json({ ok: true });
    }

    // START GAME
    if (action === "start_game") {
        if (g.hostId !== userId) return Response.json({ ok: false, error: "شما میزبان نیستید" });
        if (g.status !== "lobby") return Response.json({ ok: false, error: "بازی قبلاً شروع شده است" });
        if (g.players.length < g.config.minPlayers) return Response.json({ ok: false, error: `حداقل ${g.config.minPlayers} بازیکن لازم است` });
        if (g.players.length > g.config.maxPlayers) return Response.json({ ok: false, error: `حداکثر ${g.config.maxPlayers} بازیکن مجاز است` });
        await this.cmdStartGame(userId, g.chatId);
        // cmdStartGame is shared with the text-command flow and reports failures by
        // posting to the group (or, for a virtual lobby, dropping them silently) rather
        // than returning them — so the only reliable signal here is whether the game
        // actually left the lobby phase.
        if (this.game && this.game.status === "lobby") {
          return Response.json({ ok: false, error: "شروع بازی ناموفق بود؛ همه بازیکنان باید ربات را استارت کرده باشند" });
        }
        return Response.json({ ok: true });
    }

    // CHAT SEND (40s turn-based logic)
    if (action === "chat_send") {
        if (g.status !== 'day' || !g.dayStartedAt) return Response.json({ ok: false, error: "چت غیرفعال است" });
        // BUGFIX: reject empty/whitespace-only messages instead of pushing blank chat bubbles.
        if (typeof text !== "string" || !text.trim()) return Response.json({ ok: false, error: "پیام خالی است" });
        const alive = g.players.filter(x => x.status === 'alive');
        const turnDuration = 40000;
        const turnIndex = Math.floor((now() - g.dayStartedAt) / turnDuration);
        const speaker = alive[turnIndex % alive.length];

        if (!speaker || speaker.userId !== userId) {
            return Response.json({ ok: false, error: "نوبت شما نیست" });
        }

        if (!g.miniAppChat) g.miniAppChat = [];
        g.miniAppChat.push({ id: now(), senderId: userId, senderName: userName, text: text.trim().slice(0, 500), time: now(), isSystem: false });
        await this.persist();
        return Response.json({ ok: true });
    }

    let res = { alert: false, text: "" };

    if (action === "vote_nominate") res = await this.applyNomination(userId, g.dayNumber, targetId ?? 0);
    else if (action === "vote_verdict") res = await this.applyVerdict(userId, g.dayNumber, guilty);
    else if (action === "vote_inquiry") res = await this.applyInquiryVote(userId, g.dayNumber, choice);
    else if (action === "gunner_shot") res = await this.applyGunnerShot(userId, g.dayNumber, targetId ?? 0);
    else if (action === "gunner_give_war") res = await this.applyGunnerGiveWar(userId, g.nightNumber, targetId ?? 0);
    else if (action === "gunner_give_black") res = await this.applyGunnerGiveBlack(userId, g.nightNumber, targetId ?? 0);
    else if (action === "nato_guess") {
       if (targetRole) res = await this.applyNatoRoleGuess(userId, g.nightNumber, targetId, targetRole);
       else res = await this.applyNightAction(userId, g.nightNumber, "nato_guess", 0);
    }
    else if (action === "bomber_explode") res = await this.applyBomberExplode(userId, g.nightNumber);
    else res = await this.applyNightAction(userId, g.nightNumber, action as NightActionType, targetId ?? 0);

    if (res.alert) return Response.json({ ok: false, error: res.text });
    return Response.json({ ok: true });
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
      // Detective panel always shows all currently-alive players, regardless
      // of whether they were investigated on a previous night. Being
      // investigated before must NOT remove a player from future panels
      // (e.g. godfather must be re-investigable to flip from "town" to
      // "mafia" after godfatherRevealed triggers). detectiveChecked is still
      // recorded elsewhere (unchanged) for that reveal logic — it's just no
      // longer used to filter this list. nightTargetKeyboard/nightTargetsFor
      // already restrict candidates to living players and exclude the actor.
      const candidates = game.players.filter((p) => p.status === "alive");
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


async function verifyInitData(initData: string | null, token: string) {
  if (!initData) return null;
  const q = new URLSearchParams(initData);
  const hash = q.get("hash");
  if (!hash) return null;
  q.delete("hash");
  const keys = [...q.keys()].sort();
  const dataCheckString = keys.map(k => `${k}=${q.get(k)}`).join("\n");

  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey("raw", encoder.encode("WebAppData"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const secretHash = await crypto.subtle.sign("HMAC", secretKey, encoder.encode(token));
  const finalKey = await crypto.subtle.importKey("raw", secretHash, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", finalKey, encoder.encode(dataCheckString));
  const hex = [...new Uint8Array(signature)].map(b => b.toString(16).padStart(2, '0')).join('');

  if (hex !== hash) return null;
  // BUGFIX: reject stale/replayed init data instead of trusting it forever —
  // Telegram issues a fresh auth_date each time the mini app is (re)opened;
  // anything older than 24h is almost certainly a leaked/replayed payload.
  const authDate = Number(q.get("auth_date"));
  if (!authDate || (Date.now() / 1000 - authDate) > 86400) return null;
  try { return JSON.parse(q.get("user") || "{}"); } catch { return null; }
}

async function handleMiniappApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  let initData = request.headers.get("X-Telegram-Init-Data");
  const user = await verifyInitData(initData, env.BOT_TOKEN);

  if (!user || !user.id) return json({ ok: false, error: "Unauthorized" }, 401);

  let body: any = {};
  if (method === "POST") body = await request.clone().json().catch(() => ({}));

  // Handle Create Lobby (Virtual Chat Room, not tied to a Telegram group)
  if (method === "POST" && body.action === "create_lobby") {
     const virtualChatId = -1000000000 - user.id; // Synthetic ID
     const stub = env.GAME_ROOM.get(env.GAME_ROOM.idFromName(`chat:${virtualChatId}`));
     return stub.fetch(new Request(request.url, {
         method: "POST",
         headers: { ...Object.fromEntries(request.headers), "X-User-Id": String(user.id), "X-User-Name": user.first_name || "کاربر" },
         body: JSON.stringify({ api: true, action: "create_lobby" })
     }));
  }

  // Handle Join Lobby (by the 5-digit lobby code)
  if (method === "POST" && body.action === "join_lobby") {
     const code = body.code;
     if (!code) return json({ ok: false, error: "کد لابی را وارد کنید" });
     const row = await env.DB.prepare(`SELECT chat_id FROM games WHERE json_extract(state_json, '$.lobbyCode') = ? AND status = 'lobby' ORDER BY created_at DESC LIMIT 1`).bind(String(code)).first<{chat_id: number}>();
     if (!row) return json({ ok: false, error: "لابی یافت نشد یا پر شده است" });
     const stub = env.GAME_ROOM.get(env.GAME_ROOM.idFromName(`chat:${row.chat_id}`));
     return stub.fetch(new Request(request.url, {
         method: "POST",
         headers: { ...Object.fromEntries(request.headers), "X-User-Id": String(user.id), "X-User-Name": user.first_name || "کاربر" },
         body: JSON.stringify({ api: true, action: "join_lobby", chatId: row.chat_id })
     }));
  }

  let chatId = Number(url.searchParams.get("chat_id") || body.chatId);
  if (!chatId || isNaN(chatId)) {
      // Find active game for user
      const active = await findActiveGameForUser(env.DB, user.id);
      if (active) chatId = active.chat_id;
      else return json({ ok: false, error: "No active game" });
  }

  const stub = env.GAME_ROOM.get(env.GAME_ROOM.idFromName(`chat:${chatId}`));
  const newRequest = new Request(request.url, {
    method: request.method,
    headers: { ...Object.fromEntries(request.headers), "X-User-Id": String(user.id), "X-User-Name": user.first_name || "کاربر" },
    body: request.method === "POST" ? await request.clone().text() : null
  });

  return stub.fetch(newRequest);
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "telegram-mafia-bot", ts: Date.now() });
    }
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/app")) {
      return new Response(MINIAPP_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (url.pathname.startsWith("/api/miniapp/")) {
      // BUGFIX: the mini-app API talks to D1/Durable Objects, so schema
      // must exist before it's queried — the webhook path already did this,
      // but the miniapp path was missing it, causing "no such table" on a
      // cold worker whose /webhook hadn't fired yet.
      await ensureSchema(env.DB);
      return handleMiniappApi(request, env);
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

// DM force-leave: closes EVERY unfinished game this user is registered in,
// across every chat (real group or virtual mini-app room), regardless of
// phase — lobby, night, day, doesn't matter. Not scoped to "whichever game
// routing happens to pick" the way findActiveGameForUser (LIMIT 1) is, since
// stale/orphaned rows can pile up across multiple chats for the same user.
//
// IMPORTANT: also handles multiple orphaned rows under the SAME chat_id —
// this happened for real before the create_lobby leak was fixed (every
// retry inserted a new games row under the same virtual chat without
// closing the old one). Calling the room's forceCloseForUser() only touches
// whichever single game is currently loaded in that Durable Object's memory
// (one game_id) — it would leave older orphaned rows for that same chat
// untouched in D1, still satisfying "not finished/cancelled/idle" and still
// blocking the user forever. So after the DO-level cleanup, we ALSO run a
// direct D1 UPDATE (cancelActiveGamesForChat) per chat, which closes every
// non-finished row for that chat_id in one shot — a DB-level guarantee that
// doesn't depend on Durable Object memory state at all.
async function forceCloseAllGamesForUser(env: Env, userId: number): Promise<number> {
  const rows = await findAllActiveGamesForUser(env.DB, userId);
  const chatIds = [...new Set(rows.map((r) => r.chat_id))];
  for (const chatId of chatIds) {
    try {
      const stub = env.GAME_ROOM.get(env.GAME_ROOM.idFromName(`chat:${chatId}`));
      await (stub as DurableObjectStub<GameRoom>).forceCloseForUser(chatId, userId);
    } catch (err) {
      console.error("forceCloseAllGamesForUser: DO cleanup failed for chat", chatId, err);
    }
    // Belt-and-suspenders DB-level guarantee — runs even if the DO call above
    // threw, and catches any older orphaned rows the DO call alone can't reach.
    await cancelActiveGamesForChat(env.DB, chatId).catch((err) => {
      console.error("forceCloseAllGamesForUser: D1 cleanup failed for chat", chatId, err);
    });
  }
  return chatIds.length;
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

  // NEW: DM-only "force leave" — handled here, BEFORE routing to any single
  // game, so it isn't limited to whichever one game findActiveGameForUser's
  // LIMIT 1 happens to pick. Closes EVERY unfinished game this user is in
  // (any chat, any phase — lobby or mid-game) unconditionally.
  if (parsed?.cmd === "leave" || (text && isLeaveKeyword(text))) {
    const closed = await forceCloseAllGamesForUser(env, from.id);
    await tg.sendMessage(
      from.id,
      closed > 0
        ? `✅ ${closed} بازی/لابی که در آن‌ها بودید بسته شد.`
        : "شما الان توی هیچ بازی یا لابی‌ای نیستید.",
    );
    return;
  }

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
    { command: "status", description: "وضعیت بازی" }, { command: "reset", description: "ریست کامل بات (ادمین)" },
    { command: "help", description: "راهنما" },
  ], { type: "all_group_chats" });
  await tg.setMyCommands([{ command: "start", description: "فعال‌سازی بات" }, { command: "myrole", description: "مشاهده نقش" }, { command: "leave", description: "خروج از لابی / بستن لابی گیرکرده" }, { command: "help", description: "راهنما" }], { type: "all_private_chats" });
  const me = await tg.getMe();
  const info = await tg.getWebhookInfo();
  return json({ ok: true, webhook, bot: me, webhookInfo: info });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}
