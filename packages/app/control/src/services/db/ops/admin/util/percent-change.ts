export function percentChange(
  currentValue: number | bigint,
  previousValue: number | bigint
): number {
  const currentNumber = Number(currentValue) || 0;
  const previousNumber = Number(previousValue) || 0;
  if (previousNumber === 0) return currentNumber ? 100 : 0;
  const delta = currentNumber - previousNumber;
  return (delta / previousNumber) * 100;
}
