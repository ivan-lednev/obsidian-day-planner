import 'mocha';
import { assert } from 'chai';
import { TimeZone, DayPlannerSettings } from '../src/settings';

const settings = new DayPlannerSettings();
describe("Day Planner Settings defaults", () => {

    it("Time zone ", () => {
        assert.equal(settings.timeZone, TimeZone.GMT);
    });
});