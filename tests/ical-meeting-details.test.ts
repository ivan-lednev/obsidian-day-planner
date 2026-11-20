import ical from "node-ical";
import { describe, expect, test } from "vitest";

import {
  getAttendeeEmails,
  getOnlineMeetingUrl,
  getPhysicalLocation,
} from "../src/util/ical-meeting-details";

describe("getAttendeeEmails", () => {
  test("collects organizer and attendees, skipping rooms and duplicates", () => {
    expect(
      getAttendeeEmails({
        organizer: { val: "mailto:Boss@Example.com", params: { CN: "Boss" } },
        attendee: [
          {
            val: "mailto:boss@example.com",
            params: { CN: "boss@example.com" },
          },
          { val: "mailto:me@example.com", params: { PARTSTAT: "ACCEPTED" } },
          {
            val: "mailto:c_123@resource.calendar.google.com",
            params: { CUTYPE: "RESOURCE", CN: "Room 1" },
          },
        ],
      }),
    ).toEqual(["boss@example.com", "me@example.com"]);
  });

  test("handles a single attendee and a missing organizer", () => {
    expect(getAttendeeEmails({ attendee: "mailto:solo@example.com" })).toEqual([
      "solo@example.com",
    ]);
    expect(getAttendeeEmails({})).toEqual([]);
  });
});

describe("getOnlineMeetingUrl", () => {
  test("reads conference links from parsed iCal events", () => {
    const parsed = ical.parseICS(
      [
        "BEGIN:VCALENDAR",
        "BEGIN:VEVENT",
        "UID:1",
        "DTSTART:20261120T100000Z",
        "DTEND:20261120T103000Z",
        "SUMMARY:Sync",
        "X-GOOGLE-CONFERENCE:https://meet.google.com/abc-defg-hij",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n"),
    );
    const event = Object.values(parsed).find((it) => it.type === "VEVENT");

    expect(getOnlineMeetingUrl(event as ical.VEvent)).toBe(
      "https://meet.google.com/abc-defg-hij",
    );
  });

  test("prefers conference properties", () => {
    expect(
      getOnlineMeetingUrl({
        "X-GOOGLE-CONFERENCE": "https://meet.google.com/abc-defg-hij",
        description: "See https://zoom.us/j/1",
      } as never),
    ).toBe("https://meet.google.com/abc-defg-hij");
  });

  test("finds a known meeting link in the description", () => {
    expect(
      getOnlineMeetingUrl({
        description:
          "Agenda: https://docs.example.com\nJoin: https://us02web.zoom.us/j/123?pwd=x.",
      }),
    ).toBe("https://us02web.zoom.us/j/123?pwd=x");
  });

  test("treats a link in location as the meeting link", () => {
    expect(
      getOnlineMeetingUrl({ location: "https://custom.example.com/room" }),
    ).toBe("https://custom.example.com/room");
  });

  test("returns nothing for in-person meetings", () => {
    expect(
      getOnlineMeetingUrl({ location: "Office", description: "Bring snacks" }),
    ).toBeUndefined();
  });
});

describe("getPhysicalLocation", () => {
  test("drops links", () => {
    expect(getPhysicalLocation("https://zoom.us/j/1")).toBeUndefined();
    expect(getPhysicalLocation("Room 1; https://zoom.us/j/1")).toBe("Room 1");
    expect(getPhysicalLocation("Kat 3, Ankara")).toBe("Kat 3, Ankara");
    expect(getPhysicalLocation(undefined)).toBeUndefined();
  });
});
