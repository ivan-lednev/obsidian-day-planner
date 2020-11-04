import 'mocha';
import { assert } from 'chai';
import { TimeZone, DayPlannerSettings } from '../src/settings';
import DayPlannerFile from 'src/file';

const settings = new DayPlannerSettings(new DayPlannerFile(null));
describe("Day Planner Settings defaults", () => {

    it("Time zone ", () => {
        assert.equal(settings.timeZone, TimeZone.GMT);
    });
});