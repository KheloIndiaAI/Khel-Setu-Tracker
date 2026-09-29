import { describe, it, expect } from 'vitest';
import {
  Status,
  calculateActual,
  calculatePacer,
  calculateMissionHeadline,
  ItemProgressData,
} from './progress';

describe('Progress Calculations', () => {
  describe('calculateActual', () => {
    it('returns the status value for a task with no children', () => {
      const task: ItemProgressData = {
        id: '1',
        status: Status.DOING,
        weight: 1,
        parked: false,
        targetStartDate: null,
        targetEndDate: null,
      };
      expect(calculateActual(task)).toBe(25);
    });

    it('calculates size-weighted average of children', () => {
      const parent: ItemProgressData = {
        id: '1',
        status: Status.TO_DO,
        weight: 1,
        parked: false,
        targetStartDate: null,
        targetEndDate: null,
        children: [
          {
            id: '2',
            status: Status.LIVE,
            weight: 2, // L = 2? No, S=1, M=2, L=3. Let's use 2 and 1
            parked: false,
            targetStartDate: null,
            targetEndDate: null,
          },
          {
            id: '3',
            status: Status.TO_DO,
            weight: 1,
            parked: false,
            targetStartDate: null,
            targetEndDate: null,
          },
        ],
      };
      // (100 * 2 + 0 * 1) / 3 = 200 / 3 = 66.666...
      expect(calculateActual(parent)).toBeCloseTo(66.667, 3);
    });


    it('excludes parked children from calculation', () => {
      const parent: ItemProgressData = {
        id: '1',
        status: Status.TO_DO,
        weight: 1,
        parked: false,
        targetStartDate: null,
        targetEndDate: null,
        children: [
          {
            id: '2',
            status: Status.LIVE,
            weight: 2,
            parked: false,
            targetStartDate: null,
            targetEndDate: null,
          },
          {
            id: '3',
            status: Status.TO_DO,
            weight: 1,
            parked: true, // Should be ignored
            targetStartDate: null,
            targetEndDate: null,
          },
        ],
      };
      // (100 * 2) / 2 = 100
      expect(calculateActual(parent)).toBe(100);
    });

    it('returns 0 for a parked item', () => {
      const task: ItemProgressData = {
        id: '1',
        status: Status.LIVE,
        weight: 1,
        parked: true,
        targetStartDate: null,
        targetEndDate: null,
      };
      expect(calculateActual(task)).toBe(0);
    });
  });

  describe('calculatePacer', () => {
    it('returns 0 before start date', () => {
      const task: ItemProgressData = {
        id: '1',
        status: Status.TO_DO,
        weight: 1,
        parked: false,
        targetStartDate: new Date('2026-09-01T00:00:00Z'),
        targetEndDate: new Date('2026-09-10T00:00:00Z'),
      };
      const today = new Date('2026-08-31T00:00:00Z');
      expect(calculatePacer(task, today)).toBe(0);
    });

    it('returns 100 after end date', () => {
      const task: ItemProgressData = {
        id: '1',
        status: Status.TO_DO,
        weight: 1,
        parked: false,
        targetStartDate: new Date('2026-09-01T00:00:00Z'),
        targetEndDate: new Date('2026-09-10T00:00:00Z'),
      };
      const today = new Date('2026-09-11T00:00:00Z');
      expect(calculatePacer(task, today)).toBe(100);
    });

    it('calculates linear progress during the period', () => {
      const task: ItemProgressData = {
        id: '1',
        status: Status.TO_DO,
        weight: 1,
        parked: false,
        targetStartDate: new Date('2026-09-01T00:00:00Z'),
        targetEndDate: new Date('2026-09-11T00:00:00Z'), // 10 days total
      };
      const today = new Date('2026-09-06T00:00:00Z'); // 5 days elapsed
      expect(calculatePacer(task, today)).toBe(50);
    });

    it('rolls up linear progress size-weighted', () => {
      const parent: ItemProgressData = {
        id: '1',
        status: Status.TO_DO,
        weight: 1,
        parked: false,
        targetStartDate: null,
        targetEndDate: null,
        children: [
          {
            id: '2',
            status: Status.TO_DO,
            weight: 2,
            parked: false,
            targetStartDate: new Date('2026-09-01T00:00:00Z'),
            targetEndDate: new Date('2026-09-11T00:00:00Z'),
          },
          {
            id: '3',
            status: Status.TO_DO,
            weight: 3,
            parked: false,
            targetStartDate: new Date('2026-09-01T00:00:00Z'),
            targetEndDate: new Date('2026-09-05T00:00:00Z'),
          }
        ]
      };
      const today = new Date('2026-09-06T00:00:00Z'); 
      // Child 2 is 50% done (5/10 days), weight 2
      // Child 3 is 100% done (past end date), weight 3
      // Total = (50 * 2 + 100 * 3) / 5 = 400 / 5 = 80
      expect(calculatePacer(parent, today)).toBe(80);
    });
  });

  describe('calculateMissionHeadline', () => {
    it('calculates headline metrics correctly', () => {
      const today = new Date('2026-09-21T00:00:00Z');
      const mission = {
        actual: 34,
        startDate: new Date('2026-07-01T00:00:00Z'), // 82 days elapsed
        targetDate: new Date('2026-09-30T00:00:00Z'), // 9 days left
      };
      
      const headline = calculateMissionHeadline(mission, today);
      
      expect(headline.remaining).toBe(66);
      expect(headline.daysLeft).toBeCloseTo(9, 1);
      
      // neededPerDay = 66 / 9 = 7.33
      expect(headline.neededPerDay).toBeCloseTo(7.33, 2);
      
      // averageSoFar = 34 / 82 = 0.414...
      expect(headline.averageSoFar).toBeCloseTo(0.414, 2);
      
      // forecastFinish = today + (remaining / averageSoFar) days
      // 66 / 0.4146 = 159.17 days from today
      const expectedForecastMs = today.getTime() + (66 / (34 / 82)) * 86400000;
      expect(headline.forecastFinish.getTime()).toBeCloseTo(expectedForecastMs, -4);
    });
  });
});
