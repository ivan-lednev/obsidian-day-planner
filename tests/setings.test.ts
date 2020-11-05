import 'mocha';
import { assert } from 'chai';
import DayPlannerSettings, { DayPlannerMode } from '../src/settings';

const settings = new DayPlannerSettings();
describe("Day Planner Settings defaults", () => {

    it("Custom Folder", () => {
        assert.equal(settings.customFolder, 'Day Planners');
    });

    it("Mode", () => {
        assert.equal(settings.mode, DayPlannerMode.File);
    });
});