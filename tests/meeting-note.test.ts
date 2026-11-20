import moment from "moment";
import { describe, expect, test, vi } from "vitest";

import type { RemoteTimeBlock, WithDuration } from "../src/time-block-types";
import {
  addLineUnderHeading,
  createMeetingNoteContents,
  createMeetingNotePath,
  descriptionToMarkdown,
  getDateProperty,
  formatDuration,
  getDurationProperty,
  getMeetingProperties,
  mergeMeetingProperties,
  renderMeetingTemplate,
  getMeetingId,
  sanitizeFileName,
} from "../src/util/meeting-note";

vi.mock("obsidian", () => ({}));

function createEvent(
  overrides: Partial<WithDuration<RemoteTimeBlock>> = {},
): WithDuration<RemoteTimeBlock> {
  return {
    id: "random",
    source: "ical",
    calendar: { name: "Work", url: "https://example.com", color: "#fff" },
    summary: "Weekly sync",
    uid: "abc-123",
    rsvpStatus: "ACCEPTED",
    startTime: moment("2026-11-19T10:00"),
    durationMinutes: 30,
    ...overrides,
  };
}

describe("getMeetingId", () => {
  test("combines UID with the date so recurring events get separate notes", () => {
    expect(getMeetingId(createEvent())).toBe("abc-123/2026-11-19");
    expect(
      getMeetingId(createEvent({ startTime: moment("2026-11-26T10:00") })),
    ).toBe("abc-123/2026-11-26");
  });

  test("falls back to summary and time when there is no UID", () => {
    expect(getMeetingId(createEvent({ uid: undefined }))).toBe(
      "Weekly sync@10:00/2026-11-19",
    );
  });
});

describe("paths", () => {
  test("removes characters that are not allowed in file names", () => {
    expect(sanitizeFileName('1:1 / Ali <> "Ayşe" #retro')).toBe(
      "1 1 Ali Ayşe retro",
    );
  });

  test("creates a path inside the folder", () => {
    expect(createMeetingNotePath(createEvent(), "Work/Meetings/")).toBe(
      "Work/Meetings/2026-11-19 Weekly sync.md",
    );
    expect(createMeetingNotePath(createEvent(), "")).toBe(
      "2026-11-19 Weekly sync.md",
    );
  });
});

describe("createMeetingNoteContents", () => {
  test("puts meeting details into properties", () => {
    const contents = createMeetingNoteContents({
      timeBlock: createEvent({
        location: "Room 1, https://zoom.us/j/123",
        onlineMeetingUrl: "https://zoom.us/j/123",
        attendees: ["boss@example.com", "me@example.com"],
        description: "<p>Agenda:</p><ul><li>Roadmap</li></ul>",
      }),
      timestampFormat: "HH:mm",
      dailyNoteLinkText: "2026-11-19",
    });

    expect(
      contents.startsWith(`---
title: "Weekly sync"
meeting-id: "abc-123/2026-11-19"
location: "Room 1"
meeting-link: "https://zoom.us/j/123"
daily-note: "[[2026-11-19]]"
---
`),
    ).toBe(true);
    expect(contents).toContain("**Join:** <https://zoom.us/j/123>");
    expect(contents).toContain("## Agenda\n\nAgenda:\n- Roadmap");
  });

  test("only adds title, meeting ID, place and daily note by default", () => {
    const contents = createMeetingNoteContents({
      timeBlock: createEvent({ attendees: ["a@example.com"] }),
      timestampFormat: "HH:mm",
    });

    for (const key of ["tags", "date", "duration", "calendar", "attendees"]) {
      expect(contents).not.toMatch(new RegExp(`^${key}:`, "m"));
    }
  });

  test("skips missing details", () => {
    const contents = createMeetingNoteContents({
      timeBlock: createEvent(),
      timestampFormat: "HH:mm",
    });

    expect(contents).not.toContain("location:");
    expect(contents).not.toContain("meeting-link:");
    expect(contents).not.toContain("attendees:");
  });
});

describe("date properties", () => {
  test("all-day events get a plain date and no end", () => {
    const event = createEvent({ isAllDayEvent: true, durationMinutes: 1440 });

    expect(getDateProperty(event)).toBe("2026-11-19");
    expect(getDurationProperty(event)).toBeUndefined();
  });

  test("duration is a number of minutes", () => {
    expect(getDurationProperty(createEvent({ durationMinutes: 90 }))).toBe(90);
  });

  test("formats durations for templates", () => {
    expect(formatDuration(45)).toBe("45m");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(90)).toBe("1h 30m");
  });
});

test("descriptionToMarkdown keeps links", () => {
  expect(
    descriptionToMarkdown('Join <a href="https://meet.example">here</a>'),
  ).toBe("Join [here](https://meet.example)");
});

describe("addLineUnderHeading", () => {
  const line = "- [[Meetings/2026-11-19 Weekly sync|10:00 Weekly sync]]";
  const dedupeKey = "[[Meetings/2026-11-19 Weekly sync";

  test("creates the heading at the end when it is missing", () => {
    expect(
      addLineUnderHeading({
        contents: "# Day planner\n\n- [ ] 09:00 Coffee\n",
        heading: "Meetings",
        headingLevel: 1,
        line,
      }),
    ).toBe(`# Day planner\n\n- [ ] 09:00 Coffee\n\n# Meetings\n\n${line}\n`);
  });

  test("appends to the end of an existing section, before the next heading", () => {
    const contents = `# Meetings\n\n- [[Other]]\n\n# Journal\n\nText`;

    expect(
      addLineUnderHeading({
        contents,
        heading: "Meetings",
        headingLevel: 1,
        line,
      }),
    ).toBe(`# Meetings\n\n- [[Other]]\n${line}\n\n# Journal\n\nText`);
  });

  test("fills an empty section", () => {
    expect(
      addLineUnderHeading({
        contents: "## Meetings\n## Journal",
        heading: "Meetings",
        headingLevel: 2,
        line,
      }),
    ).toBe(`## Meetings\n\n${line}\n\n## Journal`);
  });

  test("does not add the same link twice", () => {
    const contents = `# Meetings\n\n${line}\n`;

    expect(
      addLineUnderHeading({
        contents,
        heading: "Meetings",
        headingLevel: 1,
        line,
        dedupeKey,
      }),
    ).toBe(contents);
  });
});

describe("templates", () => {
  const timeBlock = createEvent({
    location: "Room 1",
    onlineMeetingUrl: "https://meet.google.com/abc",
    attendees: ["a@example.com", "b@example.com"],
    description: "Discuss <b>roadmap</b>",
  });

  test("replaces meeting variables, with optional formats", () => {
    const template = [
      "# {{summary}} ({{date:DD.MM.YYYY}}, {{time-range}})",
      "Note: {{title}} {{meeting-id}}",
      "Where: {{location}} / {{meeting-link}}",
      "Who: {{attendees}}",
      "{{attendee-list}}",
      "{{description}}",
      "Day: {{daily-note}}",
      "Start {{start}}, end {{end:H.mm}}, {{duration}} ({{duration-minutes}})",
    ].join("\n");

    expect(
      renderMeetingTemplate(template, {
        timeBlock,
        timestampFormat: "HH:mm",
        noteTitle: "2026-11-19 Weekly sync",
        dailyNoteLinkText: "2026-11-19",
      }),
    ).toBe(
      [
        "# Weekly sync (19.11.2026, 10:00 - 10:30)",
        "Note: 2026-11-19 Weekly sync abc-123/2026-11-19",
        "Where: Room 1 / https://meet.google.com/abc",
        "Who: a@example.com, b@example.com",
        "- a@example.com\n- b@example.com",
        "Discuss roadmap",
        "Day: [[2026-11-19]]",
        "Start 10:00, end 10.30, 30m (30)",
      ].join("\n"),
    );
  });

  test("leaves unknown variables and Templater syntax alone", () => {
    expect(
      renderMeetingTemplate("{{unknown}} <% tp.date.now() %>", {
        timeBlock,
        timestampFormat: "HH:mm",
        noteTitle: "x",
      }),
    ).toBe("{{unknown}} <% tp.date.now() %>");
  });

  test("merges meeting properties into template frontmatter", () => {
    const frontmatter: Record<string, unknown> = {
      tags: ["work", "meeting"],
      project: "Apollo",
      title: "will be replaced",
      attendees: ["a@example.com"],
    };

    mergeMeetingProperties(
      frontmatter,
      getMeetingProperties({ timeBlock, dailyNoteLinkText: "2026-11-19" }),
    );

    expect(frontmatter).toEqual({
      tags: ["work", "meeting"],
      project: "Apollo",
      title: "Weekly sync",
      "meeting-id": "abc-123/2026-11-19",
      attendees: ["a@example.com"],
      location: "Room 1",
      "meeting-link": "https://meet.google.com/abc",
      "daily-note": "[[2026-11-19]]",
    });
  });

  test("merges tags written as a string", () => {
    const frontmatter: Record<string, unknown> = { tags: "work, 1on1" };

    mergeMeetingProperties(frontmatter, { tags: ["meeting"] });

    expect(frontmatter.tags).toEqual(["work", "1on1", "meeting"]);
  });
});
