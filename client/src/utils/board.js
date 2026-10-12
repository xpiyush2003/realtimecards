// moves a card on screen straight away, before the server has saved it
export function moveCardOnBoard(columns, cardId, toColumnId, index) {
  let moved;
  const without = columns.map((column) => ({
    ...column,
    cards: column.cards.filter((card) => {
      if (card.id !== cardId) return true;
      moved = card;
      return false;
    }),
  }));
  if (!moved) return columns;

  return without.map((column) => {
    if (column.id !== toColumnId) return column;
    const cards = [...column.cards];
    cards.splice(index, 0, { ...moved, column_id: toColumnId });
    return { ...column, cards };
  });
}
