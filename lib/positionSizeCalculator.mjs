export function toPositiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function calculateRiskAmount({ balance, riskMode, riskValue }) {
  const selectedRisk = toPositiveNumber(riskValue);
  if (!selectedRisk) return null;

  if (riskMode === 'usd') return selectedRisk;

  const accountBalance = toPositiveNumber(balance);
  if (!accountBalance || selectedRisk > 100) return null;
  return accountBalance * (selectedRisk / 100);
}

export function roundDownToStep(value, step) {
  const numericValue = toPositiveNumber(value);
  const numericStep = toPositiveNumber(step);
  if (!numericValue || !numericStep) return null;

  const precision = Math.min(
    8,
    Math.max(0, (String(numericStep).split('.')[1] || '').length)
  );
  const rounded = Math.floor((numericValue + Number.EPSILON) / numericStep) * numericStep;
  return Number(rounded.toFixed(precision));
}

export function calculatePipPositionSize({
  balance,
  riskMode,
  riskValue,
  stopPips,
  pipValuePerLot,
  lotStep,
}) {
  const riskAmount = calculateRiskAmount({ balance, riskMode, riskValue });
  const pips = toPositiveNumber(stopPips);
  const pipValue = toPositiveNumber(pipValuePerLot);
  const step = toPositiveNumber(lotStep);
  if (!riskAmount || !pips || !pipValue || !step) return null;

  const lossPerLot = pips * pipValue;
  const rawLots = riskAmount / lossPerLot;
  const roundedLots = roundDownToStep(rawLots, step);
  if (roundedLots === null) return null;

  return {
    riskAmount,
    stopDistance: pips,
    stopUnit: 'pips',
    lossPerLot,
    rawLots,
    roundedLots,
    estimatedLoss: roundedLots * lossPerLot,
  };
}

export function calculatePricePositionSize({
  balance,
  riskMode,
  riskValue,
  entryPrice,
  stopPrice,
  contractSize,
  quoteToUsd,
  lotStep,
}) {
  const riskAmount = calculateRiskAmount({ balance, riskMode, riskValue });
  const entry = toPositiveNumber(entryPrice);
  const stop = toPositiveNumber(stopPrice);
  const contract = toPositiveNumber(contractSize);
  const conversion = toPositiveNumber(quoteToUsd);
  const step = toPositiveNumber(lotStep);
  if (!riskAmount || !entry || !stop || entry === stop || !contract || !conversion || !step) {
    return null;
  }

  const stopDistance = Math.abs(entry - stop);
  const lossPerLot = stopDistance * contract * conversion;
  const rawLots = riskAmount / lossPerLot;
  const roundedLots = roundDownToStep(rawLots, step);
  if (roundedLots === null) return null;

  return {
    riskAmount,
    stopDistance,
    stopUnit: 'price units',
    lossPerLot,
    rawLots,
    roundedLots,
    estimatedLoss: roundedLots * lossPerLot,
  };
}
