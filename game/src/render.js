// All canvas drawing for Ember Duel: the table, the cards, the life bars,
// the title screen and the win / loss screens. No assets, only flat shapes.
export const W = 1280, H = 720;
const CARD_W = 150, CARD_H = 210;

const KIND_COLOR = {
  damage: '#e05252', double: '#e07b39', ember: '#e0a53a',
  shield: '#4f8fd0', heal: '#58a86a',
};

export function drawTable(ctx, s) {
  // Felt table
  ctx.fillStyle = '#1d4a2e'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#256b3a'; ctx.beginPath(); ctx.ellipse(W / 2, H / 2, 560, 260, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = '#f5e9c9'; ctx.font = 'bold 26px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText('EMBER DUEL', W / 2, 52);

  drawFighter(ctx, s.foe, 130, 120, false);
  drawFighter(ctx, s.you, 130, 610, true);

  // Turn + energy + log
  ctx.fillStyle = '#f5e9c9'; ctx.font = '20px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText(`Turn ${s.turn} — ${s.phase === 'player' ? 'Your turn' : s.phase === 'foe' ? 'Ash Warden is thinking…' : '—'}`, 40, 690);
  ctx.textAlign = 'right';
  ctx.fillText(`Energy: ${s.you.energy} / 3`, W - 40, 690);
  ctx.textAlign = 'center';
  ctx.font = '18px Georgia, serif'; ctx.fillStyle = '#ffd98a';
  ctx.fillText(s.log, W / 2, 445);

  // End turn button
  const b = { x: W - 210, y: 300, w: 170, h: 52 };
  ctx.fillStyle = s.phase === 'player' ? '#c9a227' : '#6b6b6b';
  roundRect(ctx, b.x, b.y, b.w, b.h, 10); ctx.fill();
  ctx.fillStyle = '#1d1d1d'; ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('END TURN', b.x + b.w / 2, b.y + 34);
  s.endButton = b;

  // Hands
  drawHand(ctx, s.foe.hand, W / 2, 190, false, s);
  drawHand(ctx, s.you.hand, W / 2, 470, true, s);

  // Floaters (damage / heal numbers)
  for (const f of s.floaters) {
    ctx.globalAlpha = Math.max(0, f.life / 60);
    ctx.fillStyle = f.color; ctx.font = 'bold 30px Georgia, serif';
    ctx.fillText(f.text, f.x, f.y - (60 - f.life));
    ctx.globalAlpha = 1;
  }
}

function drawFighter(ctx, f, x, y, isYou) {
  // Portrait circle on the left, name + life bar to its right.
  ctx.beginPath(); ctx.arc(x, y, 40, 0, Math.PI * 2);
  ctx.fillStyle = isYou ? '#c9a227' : '#7a3b2e'; ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = '#f5e9c9'; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 26px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText(isYou ? 'Y' : 'A', x, y + 9);
  const tx = x + 56;
  ctx.fillStyle = '#f5e9c9'; ctx.font = 'bold 22px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText(f.name, tx, y - 22);
  // Life bar
  const bw = 220;
  ctx.fillStyle = '#222'; ctx.fillRect(tx, y - 10, bw, 20);
  ctx.fillStyle = '#e05252'; ctx.fillRect(tx, y - 10, bw * Math.max(0, f.life / f.maxLife), 20);
  ctx.strokeStyle = '#f5e9c9'; ctx.lineWidth = 2; ctx.strokeRect(tx, y - 10, bw, 20);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(`${f.life} / ${f.maxLife} life`, tx + 6, y + 6);
  if (f.shield > 0) {
    ctx.fillStyle = '#8ec6f0'; ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText(`🛡 ${f.shield} shield`, tx, y + 34);
  }
}

function drawHand(ctx, hand, cx, y, faceUp, s) {
  const n = hand.length;
  const gap = Math.min(CARD_W + 14, (W - 200) / Math.max(1, n));
  const startX = cx - ((n - 1) * gap) / 2;
  hand.forEach((card, i) => {
    const x = startX + i * gap - CARD_W / 2;
    const lift = faceUp && s.hover === i ? -26 : 0;
    drawCard(ctx, card, x, y + lift, faceUp, faceUp && s.you.energy >= card.cost);
  });
  if (faceUp) s.handRects = hand.map((card, i) => ({
    x: startX + i * gap - CARD_W / 2, y: y - 26, w: CARD_W, h: CARD_H + 26, index: i,
  }));
}

export function drawCard(ctx, card, x, y, faceUp, playable) {
  ctx.save();
  ctx.globalAlpha = faceUp && !playable ? 0.55 : 1;
  // Back
  ctx.fillStyle = faceUp ? '#f8f1dc' : '#7a3b2e';
  roundRect(ctx, x, y, CARD_W, CARD_H, 12); ctx.fill();
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 3; ctx.stroke();
  if (faceUp) {
    ctx.fillStyle = KIND_COLOR[card.kind] || '#888';
    roundRect(ctx, x + 8, y + 8, CARD_W - 16, 44, 8); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 17px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText(card.name, x + CARD_W / 2, y + 36);
    // Cost gem
    ctx.beginPath(); ctx.arc(x + 24, y + 74, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#2b6cb0'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText(String(card.cost), x + 24, y + 80);
    // Value
    ctx.fillStyle = '#1d1d1d'; ctx.font = 'bold 44px Georgia, serif';
    ctx.fillText(String(card.value), x + CARD_W / 2, y + 128);
    ctx.font = '15px Georgia, serif'; ctx.fillStyle = '#444';
    wrapText(ctx, card.text, x + CARD_W / 2, y + 152, CARD_W - 20, 18);
  } else {
    ctx.fillStyle = '#c9a227'; ctx.font = 'bold 40px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText('🔥', x + CARD_W / 2, y + CARD_H / 2 + 14);
  }
  ctx.restore();
}

export function drawTitle(ctx) {
  ctx.fillStyle = '#1d2b1d'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#c9a227'; ctx.beginPath(); ctx.arc(W / 2, 190, 90, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e05252'; ctx.font = 'bold 70px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText('🔥', W / 2, 214);
  ctx.fillStyle = '#f5e9c9'; ctx.font = 'bold 72px Georgia, serif';
  ctx.fillText('EMBER DUEL', W / 2, 340);
  ctx.font = '26px Georgia, serif'; ctx.fillStyle = '#ffd98a';
  ctx.fillText('A duel of cards against the Ash Warden.', W / 2, 390);
  ctx.fillText('Play cards, guard your life, bring theirs to zero.', W / 2, 426);
  ctx.fillStyle = '#c9a227'; roundRect(ctx, W / 2 - 130, 480, 260, 64, 12); ctx.fill();
  ctx.fillStyle = '#1d1d1d'; ctx.font = 'bold 28px Georgia, serif';
  ctx.fillText('▶  PLAY', W / 2, 522);
  ctx.fillStyle = '#f5e9c9'; ctx.font = '19px Georgia, serif';
  ctx.fillText('Click PLAY, or press Enter.  Click a card to play it, then END TURN.', W / 2, 600);
  ctx.fillText('Keys 1–7 play a card · Space ends your turn.', W / 2, 630);
}

export function drawEnd(ctx, won) {
  ctx.fillStyle = won ? '#1d4a2e' : '#3a1d1d'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f5e9c9'; ctx.font = 'bold 80px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText(won ? '🔥 YOU WIN!' : '💀 YOU LOSE', W / 2, 300);
  ctx.font = '28px Georgia, serif'; ctx.fillStyle = '#ffd98a';
  ctx.fillText(won ? 'The Ash Warden crumbles to embers. The duel is yours.'
    : 'The Ash Warden stands over the ashes. Try again, duelist.', W / 2, 370);
  ctx.fillStyle = '#c9a227'; roundRect(ctx, W / 2 - 150, 440, 300, 60, 12); ctx.fill();
  ctx.fillStyle = '#1d1d1d'; ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('↻  PLAY AGAIN', W / 2, 480);
  ctx.fillStyle = '#f5e9c9'; ctx.font = '19px Georgia, serif';
  ctx.fillText('Press R or click PLAY AGAIN to duel once more.', W / 2, 560);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y); line = w; y += lh; }
    else line = test;
  }
  ctx.fillText(line, x, y);
}
