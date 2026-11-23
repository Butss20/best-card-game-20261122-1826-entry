// The opponent, the Ash Warden: picks one readable card a turn.
// Its rule is simple enough for a player to read and counter:
// heal or guard when hurt, finish the player when it can, otherwise hit.
export function chooseAiCard(hand, self, foe) {
  const playable = hand.filter((c) => c.cost <= self.energy);
  if (!playable.length) return null;
  const heal = playable.find((c) => c.kind === 'heal' && self.life <= 14);
  if (heal) return heal;
  const shield = playable.find((c) => c.kind === 'shield' && self.life <= 18);
  if (shield) return shield;
  const lethal = playable.find((c) => damageOf(c) >= foe.life - foe.shield);
  if (lethal) return lethal;
  const damage = playable.filter((c) => damageOf(c) > 0);
  if (damage.length) return damage.reduce((a, b) => (damageOf(b) > damageOf(a) ? b : a));
  return playable[0];
}

export function damageOf(card) {
  if (card.kind === 'damage') return card.value;
  if (card.kind === 'double') return card.value * 2;
  if (card.kind === 'ember') return card.value;
  return 0;
}
