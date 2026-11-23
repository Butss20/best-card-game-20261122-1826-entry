// Ember Duel: game state, input and the main loop.
// One duel, you vs the Ash Warden. 3 energy a turn, draw 1, first to 0 life loses.
import { buildDeck, mulberry32 } from './cards.js';
import { chooseAiCard, damageOf } from './ai.js';
import { W, H, drawTable, drawTitle, drawEnd } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W; canvas.height = H;

const params = new URLSearchParams(location.search);
const shot = params.get('shot') || '';
const rng = mulberry32(20261122);

function newFighter(name, isYou) {
  return { name, isYou, life: 30, maxLife: 30, shield: 0, energy: 3, hand: [], deck: [] };
}

function newState() {
  const s = {
    screen: 'title', phase: 'player', turn: 1,
    you: newFighter('You', true), foe: newFighter('Ash Warden', false),
    log: 'Click PLAY to begin the duel.', floaters: [], hover: -1,
    handRects: [], endButton: null, aiTimer: 0, aiPlays: [],
  };
  s.you.deck = buildDeck(rng); s.foe.deck = buildDeck(rng);
  for (let i = 0; i < 4; i++) { drawCard(s.you); drawCard(s.foe); }
  return s;
}

let s = newState();

function drawCard(f) {
  if (!f.deck.length) f.deck = buildDeck(rng);
  if (f.hand.length < 7) f.hand.push(f.deck.pop());
}

function hurt(target, amount, x, y) {
  let left = amount;
  if (target.shield > 0) { const blocked = Math.min(target.shield, left); target.shield -= blocked; left -= blocked; }
  target.life = Math.max(0, target.life - left);
  s.floaters.push({ text: `-${amount}`, x, y, life: 60, color: '#ff6b6b' });
}

function applyCard(card, caster, target) {
  if (card.kind === 'damage' || card.kind === 'ember') hurt(target, card.value, W / 2, caster.isYou ? 150 : 430);
  if (card.kind === 'double') { hurt(target, card.value, W / 2, caster.isYou ? 150 : 430); hurt(target, card.value, W / 2 + 60, caster.isYou ? 150 : 430); }
  if (card.kind === 'shield') { caster.shield += card.value; s.floaters.push({ text: `+${card.value} shield`, x: W / 2, y: caster.isYou ? 430 : 150, life: 60, color: '#8ec6f0' }); }
  if (card.kind === 'heal') { caster.life = Math.min(caster.maxLife, caster.life + card.value); s.floaters.push({ text: `+${card.value}`, x: W / 2, y: caster.isYou ? 430 : 150, life: 60, color: '#7ed491' }); }
  if (card.kind === 'ember') drawCard(caster);
}

function checkEnd() {
  if (s.foe.life <= 0) { s.screen = 'win'; s.log = 'You win!'; }
  else if (s.you.life <= 0) { s.screen = 'loss'; s.log = 'You lose.'; }
}

function playPlayerCard(i) {
  if (s.screen !== 'table' || s.phase !== 'player') return;
  const card = s.you.hand[i];
  if (!card || card.cost > s.you.energy) return;
  s.you.energy -= card.cost;
  s.you.hand.splice(i, 1);
  applyCard(card, s.you, s.foe);
  s.log = `You play ${card.name}.`;
  checkEnd();
}

function endTurn() {
  if (s.screen !== 'table' || s.phase !== 'player') return;
  s.phase = 'foe'; s.aiTimer = 50; s.aiPlays = [];
  s.log = 'Ash Warden is thinking…';
}

function aiStep() {
  if (s.aiTimer > 0) { s.aiTimer--; return; }
  const card = chooseAiCard(s.foe.hand, s.foe, s.you);
  if (card && s.foe.energy >= card.cost) {
    s.foe.energy -= card.cost;
    s.foe.hand.splice(s.foe.hand.indexOf(card), 1);
    applyCard(card, s.foe, s.you);
    s.log = `Ash Warden plays ${card.name}.`;
    s.aiTimer = 55;
    checkEnd();
    if (s.screen !== 'table') return;
    if (s.foe.energy <= 0 || !s.foe.hand.some((c) => c.cost <= s.foe.energy)) { startPlayerTurn(); }
  } else startPlayerTurn();
}

function startPlayerTurn() {
  s.turn++;
  s.you.energy = 3; s.foe.energy = 3;
  drawCard(s.you); drawCard(s.foe);
  s.phase = 'player'; s.log = `Turn ${s.turn} — your move.`;
}

function startGame() {
  s = newState(); s.screen = 'table';
}

// ---- Staged states for screenshots (deterministic, ?shot=...) ----
function stageShot() {
  if (shot === 'title') { s.screen = 'title'; return; }
  s.screen = 'table';
  if (shot === 'table') {
    s.you.life = 24; s.foe.life = 19; s.foe.shield = 4;
    s.log = 'You play Heavy Blow.';
    s.floaters.push({ text: '-6', x: W / 2, y: 150, life: 55, color: '#ff6b6b' });
  } else if (shot === 'win') { s.foe.life = 0; s.screen = 'win'; }
  else if (shot === 'loss') { s.you.life = 0; s.screen = 'loss'; }
}

if (shot) stageShot();

// ---- Input ----
canvas.addEventListener('click', (e) => {
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * (W / r.width), y = (e.clientY - r.top) * (H / r.height);
  if (s.screen === 'title') { startGame(); return; }
  if (s.screen === 'win' || s.screen === 'loss') { startGame(); return; }
  if (s.phase === 'player') {
    const b = s.endButton;
    if (b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { endTurn(); return; }
    const hit = (s.handRects || []).find((rc) => x >= rc.x && x <= rc.x + rc.w && y >= rc.y && y <= rc.y + rc.h);
    if (hit) playPlayerCard(hit.index);
  }
});
canvas.addEventListener('mousemove', (e) => {
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * (W / r.width), y = (e.clientY - r.top) * (H / r.height);
  const hit = (s.handRects || []).find((rc) => x >= rc.x && x <= rc.x + rc.w && y >= rc.y && y <= rc.y + rc.h);
  s.hover = hit ? hit.index : -1;
});
document.addEventListener('keydown', (e) => {
  if (s.screen === 'title' && (e.key === 'Enter' || e.key === ' ')) startGame();
  else if ((s.screen === 'win' || s.screen === 'loss') && (e.key === 'r' || e.key === 'R' || e.key === 'Enter')) startGame();
  else if (s.screen === 'table' && e.key >= '1' && e.key <= '7') playPlayerCard(Number(e.key) - 1);
  else if (s.screen === 'table' && e.key === ' ') endTurn();
});

// ---- Loop ----
function frame() {
  for (const f of s.floaters) f.life--;
  s.floaters = s.floaters.filter((f) => f.life > 0);
  if (s.screen === 'table' && s.phase === 'foe') aiStep();
  ctx.clearRect(0, 0, W, H);
  if (s.screen === 'title') drawTitle(ctx);
  else if (s.screen === 'win') drawEnd(ctx, true);
  else if (s.screen === 'loss') drawEnd(ctx, false);
  else drawTable(ctx, s);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
