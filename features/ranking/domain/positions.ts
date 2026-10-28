export function withTiedPositions<T extends { points: number }>(
  sorted: readonly T[]
): (T & { position: number })[] {
  let position = 0;
  return sorted.map((item, index) => {
    if (index === 0 || item.points !== sorted[index - 1].points) position = index + 1;
    return { ...item, position };
  });
}
