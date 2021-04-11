import 'mocha';
import * as fs from 'fs';
import path from 'path';
import { expect } from 'chai';

import Parser from '../src/parser';
import { DayPlannerSettings } from '../src/settings';

describe('parser', () => {
  it('should return parsed items', async () => {
    const fileContents = fs.readFileSync(path.join(__dirname, 'fixtures/test.md')).toString().split('\n');

    const settings = new DayPlannerSettings();
    settings.breakLabel = '☕️ COFFEE BREAK';
    settings.endLabel = '🛑 FINISH';

    const parser = new Parser(settings);

    const results = await parser.parseMarkdown(fileContents);

    expect(results.empty).to.be.false;
    expect(results.invalid).to.be.false;
    expect(results.items).to.have.lengthOf(9);

    const firstItem = results.items[0];
    expect(firstItem.isCompleted).to.be.true;
    expect(firstItem.isBreak).to.be.false;
    expect(firstItem.isEnd).to.be.false;
    expect(firstItem.rawTime).to.eql('08:00');
    expect(firstItem.text).to.eql('morning stuff');

    const fourthItem = results.items[3];
    expect(fourthItem.isCompleted).to.be.true;
    expect(fourthItem.isBreak).to.be.true;
    expect(fourthItem.isEnd).to.be.false;
    expect(fourthItem.rawTime).to.eql('11:00');
    expect(fourthItem.text).to.eql('☕️ COFFEE BREAK');

    const fifthItem = results.items[4];
    expect(fifthItem.isCompleted).to.be.false;
    expect(fifthItem.isBreak).to.be.false;
    expect(fifthItem.isEnd).to.be.false;
    expect(fifthItem.rawTime).to.eql('11:10');
    expect(fifthItem.text).to.eql('reading');

    const seventhItem = results.items[6];
    expect(seventhItem.isCompleted).to.be.false;
    expect(seventhItem.isBreak).to.be.true;
    expect(seventhItem.isEnd).to.be.false;
    expect(seventhItem.rawTime).to.eql('13:00');
    expect(seventhItem.text).to.eql('☕️ COFFEE BREAK');

    const ninthItem = results.items[8];
    expect(ninthItem.isCompleted).to.be.false;
    expect(ninthItem.isBreak).to.be.false;
    expect(ninthItem.isEnd).to.be.true;
    expect(ninthItem.rawTime).to.eql('14:00');
    expect(ninthItem.text).to.eql('🛑 FINISH');
  });
});