// Card definitions for Ember Duel: every card is one plain object.
// cost is energy (0-3), kind drives the effect, value is its strength.
export const CARDS = {
  strike:   { id: 'strike',   name: 'Strike',      cost: 1, kind: 'damage', value: 3, text: 'Deal 3 damage.' },
  heavy:    { id: 'heavy',    name: 'Heavy Blow',  cost: 2, kind: 'damage', value: 6, text: 'Deal 6 damage.' },
  twin:     { id: 'twin',     name: 'Twin Cut',    cost: 2, kind: 'double', value: 2, text: 'Deal 2 damage, twice.' },
  ember:    { id: 'ember',    name: 'Ember Spark', cost: 1, kind: 'ember',  value: 2, text: 'Deal 2 damage. Draw 1.' },
  guard:    { id: 'guard',    name: 'Guard',       cost: 1, kind: 'shield', value: 6, text: 'Gain 6 shield.' },
  mend:     { id: 'mend',     name: 'Mend',        cost: 2, kind: 'heal',   value: 5, text: 'Restore 5 life.' },
};

// A starter deck: 12 cards, shuffled. No card appears in any other game.
export const DECK_IDS = [
  'strike', 'strike', 'strike', 'strike',
  'heavy', 'heavy',
  'twin', 'twin',
  'ember', 'ember',
  'guard', 'guard',
  'mend',
];

export function buildDeck(rng) {
  const deck = DECK_IDS.map((id) => ({ ...CARDS[id] }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Small deterministic RNG so staged screenshots look the same every run.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
