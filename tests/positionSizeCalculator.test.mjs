import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePipPositionSize,
  calculatePricePositionSize,
  calculateRiskAmount,
  roundDownToStep,
} from '../lib/positionSizeCalculator.mjs';

test('calculates the fictional XAUUSD pip example', () => {
  const result = calculatePipPositionSize({
    balance: 10000,
    riskMode: 'percentage',
    riskValue: 1,
    stopPips: 20,
    pipValuePerLot: 10,
    lotStep: 0.01,
  });
  assert.equal(result.riskAmount, 100);
  assert.equal(result.lossPerLot, 200);
  assert.equal(result.roundedLots, 0.5);
  assert.equal(result.estimatedLoss, 100);
});

test('calculates the fictional XAUUSD price-distance example', () => {
  const result = calculatePricePositionSize({
    balance: 10000,
    riskMode: 'percentage',
    riskValue: 1,
    entryPrice: 4150,
    stopPrice: 4148,
    contractSize: 100,
    quoteToUsd: 1,
    lotStep: 0.01,
  });
  assert.equal(result.riskAmount, 100);
  assert.equal(result.stopDistance, 2);
  assert.equal(result.lossPerLot, 200);
  assert.equal(result.roundedLots, 0.5);
});

test('rounds down to the entered lot step', () => {
  assert.equal(roundDownToStep(0.537, 0.01), 0.53);
  assert.equal(roundDownToStep(1.2, 0.1), 1.2);
});

test('accepts a direct USD risk amount', () => {
  assert.equal(calculateRiskAmount({ balance: '', riskMode: 'usd', riskValue: 75 }), 75);
});

test('rejects invalid risk and price inputs', () => {
  assert.equal(calculateRiskAmount({ balance: 10000, riskMode: 'percentage', riskValue: 101 }), null);
  assert.equal(
    calculatePricePositionSize({
      balance: 10000,
      riskMode: 'percentage',
      riskValue: 1,
      entryPrice: 4150,
      stopPrice: 4150,
      contractSize: 100,
      quoteToUsd: 1,
      lotStep: 0.01,
    }),
    null
  );
});
