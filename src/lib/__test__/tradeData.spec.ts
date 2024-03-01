import { describe, expect, it } from 'vitest';

import { PositionSide } from '@/constants/trade';

import { hasPositionSideChanged } from '../tradeData';

describe('hasPositionSideChanged', () => {
  describe('Should return false when the position side has not changed', () => {
    it('has no position', () => {
      expect(hasPositionSideChanged({ currentSize: 0, postOrderSize: 0 })).toEqual({
        currentPositionSide: PositionSide.None,
        newPositionSide: PositionSide.None,
        positionSideHasChanged: false,
      });
    });
    it('Increase existing long position', () => {
      expect(hasPositionSideChanged({ currentSize: 1, postOrderSize: 3 })).toEqual({
        currentPositionSide: PositionSide.Long,
        newPositionSide: PositionSide.Long,
        positionSideHasChanged: false,
      });
    });
    it('Reduce long position but still long', () => {
      expect(hasPositionSideChanged({ currentSize: 3, postOrderSize: 1 })).toEqual({
        currentPositionSide: PositionSide.Long,
        newPositionSide: PositionSide.Long,
        positionSideHasChanged: false,
      });
    });
    it('Increase existing short position', () => {
      expect(hasPositionSideChanged({ currentSize: -1, postOrderSize: -3 })).toEqual({
        currentPositionSide: PositionSide.Short,
        newPositionSide: PositionSide.Short,
        positionSideHasChanged: false,
      });
    });
    it('Reduce short position but still short', () => {
      expect(hasPositionSideChanged({ currentSize: -3, postOrderSize: -1 })).toEqual({
        currentPositionSide: PositionSide.Short,
        newPositionSide: PositionSide.Short,
        positionSideHasChanged: false,
      });
    });
  });

  describe('Should return true when closing an existing position', () => {
    it('Close long position', () => {
      expect(hasPositionSideChanged({ currentSize: 1, postOrderSize: 0 })).toEqual({
        currentPositionSide: PositionSide.Long,
        newPositionSide: PositionSide.None,
        positionSideHasChanged: true,
      });
    });
    it('Close short position', () => {
      expect(hasPositionSideChanged({ currentSize: -3, postOrderSize: 0 })).toEqual({
        currentPositionSide: PositionSide.Short,
        newPositionSide: PositionSide.None,
        positionSideHasChanged: true,
      });
    });
  });

  describe('Should return true when changing position sides', () => {
    it('Close long position and open short position', () => {
      expect(hasPositionSideChanged({ currentSize: 1, postOrderSize: -4 })).toEqual({
        currentPositionSide: PositionSide.Long,
        newPositionSide: PositionSide.Short,
        positionSideHasChanged: true,
      });
    });
    it('Close short position and open long position', () => {
      expect(hasPositionSideChanged({ currentSize: -7, postOrderSize: 4 })).toEqual({
        currentPositionSide: PositionSide.Short,
        newPositionSide: PositionSide.Long,
        positionSideHasChanged: true,
      });
    });
  });
});
