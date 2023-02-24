import 'mocha';
import { expect } from 'chai';

import { PlanItemFactory } from '../src/plan-data';
import { DayPlannerSettings } from '../src/settings';

describe('plan-data', () => {
  describe('PlanItemFactory', () => {
    const matchIndex = 1;
    const charIndex = 0;
    const isCompleted = true;
    const isBreak = false;
    const isEnd = false;
    const time = new Date('2021-04-11T11:10:00.507Z');
    const rawStartTime = '11:10';
    const rawEndTime = ''
    const text = 'meeting';
    const raw = '- [x] 11:10 meeting';

    it('should generate PlanItem with given text', () => {
      const factory = new PlanItemFactory(new DayPlannerSettings());

      const item = factory.getPlanItem(matchIndex, charIndex, isCompleted, isBreak, isEnd, time, undefined, rawStartTime, rawEndTime, text, raw);

      expect(item.matchIndex).to.eql(matchIndex);
      expect(item.charIndex).to.eql(charIndex);
      expect(item.isCompleted).to.eql(isCompleted);
      expect(item.isBreak).to.eql(isBreak);
      expect(item.isEnd).to.eql(isEnd);
      expect(item.startTime).to.eql(time);
      expect(item.rawStartTime).to.eql(rawStartTime);
      expect(item.text).to.eql(text);
      expect(item.raw).to.eql(raw);
    });

    it('should generate PlanItem with break text from settings', () => {
      const settings = new DayPlannerSettings();
      settings.breakLabel = 'Custom Break Label';

      const factory = new PlanItemFactory(settings);

      const isBreakOn = true;
      const item = factory.getPlanItem(matchIndex, charIndex, isCompleted, isBreakOn, isEnd, time, undefined, rawStartTime, rawEndTime, text, raw);

      expect(item.isBreak).to.eql(isBreakOn);
      expect(item.text).to.eql(settings.breakLabel);
    });

    it('should generate PlanItem with end text from settings', () => {
      const settings = new DayPlannerSettings();
      settings.endLabel = 'Custom End Label';

      const factory = new PlanItemFactory(settings);

      const isEndOn = true;
      const item = factory.getPlanItem(matchIndex, charIndex, isCompleted, isBreak, isEndOn, time, undefined, rawStartTime, rawEndTime, text, raw);

      expect(item.isEnd).to.eql(isEndOn);
      expect(item.text).to.eql(settings.endLabel);
    });
  });
});