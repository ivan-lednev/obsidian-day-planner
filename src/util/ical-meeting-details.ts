import type { VEvent } from "node-ical";

/**
 * Extracts meeting details (attendees, online meeting link, physical location)
 * from an iCal event. Kept free of Obsidian imports, so it can be unit-tested.
 */

type PropertyValue = string | { val: string; params?: Record<string, unknown> };

function getValue(property: unknown) {
  if (typeof property === "string") {
    return property;
  }

  if (
    property &&
    typeof property === "object" &&
    "val" in property &&
    typeof property.val === "string"
  ) {
    return property.val;
  }

  return undefined;
}

function getParams(property: unknown): Record<string, unknown> {
  if (property && typeof property === "object" && "params" in property) {
    const { params } = property as { params?: Record<string, unknown> };

    return params ?? {};
  }

  return {};
}

const emailRegExp = /[^\s:<>"'()]+@[^\s:<>"'()]+\.[^\s:<>"'()]+/;

function toEmail(property: unknown) {
  const fromValue = getValue(property)
    ?.replace(/^mailto:/i, "")
    .trim();

  if (fromValue && emailRegExp.test(fromValue)) {
    return fromValue.toLowerCase();
  }

  // Some providers put the email into CN only
  const cn = getParams(property).CN;

  if (typeof cn === "string" && emailRegExp.test(cn)) {
    return cn.replace(/^"|"$/g, "").trim().toLowerCase();
  }

  return undefined;
}

function isResource(property: unknown) {
  const cuType = getParams(property).CUTYPE;

  return cuType === "ROOM" || cuType === "RESOURCE";
}

function liftToArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

/**
 * Organizer first, then attendees in calendar order, without duplicates.
 * Rooms and other resources are skipped.
 */
export function getAttendeeEmails(
  event: Pick<VEvent, "attendee"> & {
    organizer?: unknown;
  },
) {
  const people = [
    ...liftToArray(event.organizer),
    ...liftToArray<unknown>(event.attendee as PropertyValue[] | undefined),
  ].filter((it) => !isResource(it));

  const emails = people
    .map(toEmail)
    .filter((it): it is string => it !== undefined);

  return [...new Set(emails)];
}

// node-ical drops the "X-" prefix of custom properties
const conferenceProperties = [
  "GOOGLE-CONFERENCE",
  "MICROSOFT-SKYPETEAMSMEETINGURL",
  "MICROSOFT-ONLINEMEETINGCONFLINK",
  "MICROSOFT-ONLINEMEETINGEXTERNALLINK",
].flatMap((name) => [name, `X-${name}`]);

const knownMeetingHosts =
  /https?:\/\/(?:[\w-]+\.)*(?:meet\.google\.com|zoom\.us|zoom\.com|teams\.microsoft\.com|teams\.live\.com|webex\.com|whereby\.com|gotomeeting\.com|meet\.goto\.com|chime\.aws|meet\.jit\.si|bluejeans\.com|slack\.com\/huddle|around\.co|discord\.gg)[^\s<>"')\]]*/i;

const anyUrl = /^https?:\/\/\S+$/i;

/**
 * Finds a link for joining the meeting online: dedicated conference
 * properties first, then a known meeting host in the location, URL or
 * description.
 */
export function getOnlineMeetingUrl(
  event: Partial<Pick<VEvent, "description" | "location">> & { url?: unknown },
) {
  const customProperties = event as unknown as Record<string, unknown>;

  for (const key of conferenceProperties) {
    const value = getValue(customProperties[key])?.trim();

    if (value && /^https?:\/\//i.test(value)) {
      return value;
    }
  }

  const candidates = [
    getValue(event.location),
    getValue(event.url),
    getValue(event.description),
  ];

  for (const text of candidates) {
    const match = text?.match(knownMeetingHosts);

    if (match) {
      return match[0].replace(/[.,;]+$/, "");
    }
  }

  const location = getValue(event.location)?.trim();

  if (location && anyUrl.test(location)) {
    return location;
  }

  return undefined;
}

/**
 * The location, unless it's just a link (then it's an online meeting, not a
 * place). Google adds the room name and the address separated by commas,
 * which is kept as is.
 */
export function getPhysicalLocation(location: unknown) {
  const value = getValue(location)?.trim();

  if (!value || anyUrl.test(value)) {
    return undefined;
  }

  // "Room 1; https://zoom.us/..." -> "Room 1"
  const withoutLinks = value
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[\s;,|-]+$/, "")
    .replace(/^[\s;,|-]+/, "")
    .trim();

  return withoutLinks || undefined;
}
