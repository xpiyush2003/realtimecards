// takes a card out of one ordered list of ids and puts it into another
// at the given place, the two lists can be the same column
export function moveCardInLists(fromIds, toIds, cardId, index, sameColumn) {
  const from = fromIds.filter((id) => id !== cardId);
  const to = sameColumn ? from : toIds.filter((id) => id !== cardId);

  // a place past the end means the end
  const place = Math.min(Math.max(index, 0), to.length);
  to.splice(place, 0, cardId);

  return { from, to };
}
