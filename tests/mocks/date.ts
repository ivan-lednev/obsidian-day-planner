/**
 * https://kimpers.com/mocking-date-and-time-in-tests-with-typescript-and-jest
 * @param {Date} expected The date to which we want to freeze time
 * @returns {Function} Call to remove Date mocking
 */
export const mockDate = (expected: Date) => {
    const _Date = Date
  
    // If any Date or number is passed to the constructor
    // use that instead of our mocked date
    function MockDate(mockOverride?: Date | number) {
      return new _Date(mockOverride || expected)
    }
  
    MockDate.UTC = _Date.UTC
    MockDate.parse = _Date.parse
    MockDate.now = () => expected.getTime()
    // Give our mock Date has the same prototype as Date
    // Some libraries rely on this to identify Date objects
    MockDate.prototype = _Date.prototype
  
    // Our mock is not a full implementation of Date
    // Types will not match but it's good enough for our tests
    global.Date = MockDate as any
  
    // Callback function to remove the Date mock
    return () => {
      global.Date = _Date
    }
  }