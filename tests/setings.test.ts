import 'mocha';
import { assert } from 'chai';
import { DayPlannerSettings } from '../src/settings';

const settings = new DayPlannerSettings();
describe("Day Planner Settings defaults", () => {

    it("Custom Folder", () => {
        assert.equal(settings.customFolder, 'Day Planners');
    });
});