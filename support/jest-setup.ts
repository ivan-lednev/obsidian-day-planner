import moment, { type Moment } from "moment";

window.moment = moment;
performance.mark = jest.fn();

function areMomentsEqual(a: Moment, b: Moment) {
  const isAMomment = moment.isMoment(a);
  const isBMomment = moment.isMoment(b);

  if (isAMomment && isBMomment) {
    return a.isSame(b);
  } else if (!isAMomment && !isBMomment) {
    return undefined;
  }

  return false;
}

// todo: fix type error
// @ts-expect-error
expect.addEqualityTesters([areMomentsEqual]);
