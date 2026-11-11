const featured = document.querySelector("#featured-event");
const eventPreview = document.querySelector("#event-preview-stack");
const upcomingList = document.querySelector("#upcoming-events");
const pastList = document.querySelector("#past-events");
const undatedList = document.querySelector("#undated-events");
const eventSections = [featured, upcomingList, pastList].filter(Boolean);

const campusCalendar = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Vancouver",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

const displayDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "UTC",
  year: "numeric",
  month: "long",
  day: "numeric"
});

const dateList = new Intl.ListFormat("en-CA");
const calendarMonth = new Intl.DateTimeFormat("en-CA", {
  timeZone: "UTC",
  month: "short",
  year: "numeric"
});

function element(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value) node.textContent = value;
  return node;
}

function dateLabel(event) {
  const start = new Date(event.date);
  if (event.additionalDates?.length) {
    return dateList.format([event.date, ...event.additionalDates].map(date => displayDate.format(new Date(date))));
  }
  return event.endDate && event.endDate !== event.date
    ? displayDate.formatRange(start, new Date(event.endDate))
    : displayDate.format(start);
}

function calendarBadge(event) {
  const calendar = element("div", "event-calendar");
  calendar.setAttribute("role", "group");
  calendar.setAttribute("aria-label", dateLabel(event));

  const dates = [event.date, ...(event.additionalDates ?? [])];
  const end = event.endDate;
  const sameMonthRange = end && end !== event.date && end.slice(0, 7) === event.date.slice(0, 7);
  const spansMonths = end && end !== event.date && !sameMonthRange;
  if (spansMonths) dates.push(end);
  if (dates.length === 2) calendar.classList.add("event-calendar--pair");

  for (const date of dates) {
    if (spansMonths && date === end) {
      const separator = element("span", "calendar-separator", "to");
      separator.setAttribute("aria-hidden", "true");
      calendar.append(separator);
    }
    const tile = element("div", "calendar-tile");
    tile.setAttribute("aria-hidden", "true");
    const day = Number(date.slice(-2));
    const days = sameMonthRange ? `${day}–${Number(end.slice(-2))}` : String(day);
    tile.append(
      element("span", "calendar-month", calendarMonth.format(new Date(date))),
      element("span", "calendar-day", days)
    );
    calendar.append(tile);
  }
  return calendar;
}

function signUpLink(value) {
  if (!value || !URL.canParse(value)) return null;
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const link = element("a", "button button-primary", "Sign up");
  link.href = url.href;
  return link;
}

function eventCard(event, upcoming, { preview = false } = {}) {
  const showPoster = event.image && !preview;
  const card = element("article", showPoster ? "event-card" : "event-card event-card--text");

  if (showPoster) {
    const poster = element("a", "event-poster");
    poster.href = "/assets/events/" + encodeURIComponent(event.image);
    poster.setAttribute("aria-label", "View poster for " + event.title);

    const image = element("img");
    image.src = poster.href;
    image.alt = event.imageAlt || "";
    image.loading = "lazy";
    poster.append(image);
    card.append(poster);
  }

  const details = element("div", "event-details");
  details.append(element("h3", "", event.title));

  const metadata = element("ul", "event-meta");
  for (const value of [event.time, event.location].filter(Boolean)) {
    metadata.append(element("li", "", value));
  }
  if (metadata.childElementCount) details.append(metadata);
  details.append(element("p", "event-description", event.description));

  const link = upcoming ? signUpLink(event.signupUrl) : null;
  if (link) details.append(link);
  const content = element("div", "event-content");
  content.append(details);
  if (event.date) content.append(calendarBadge(event));
  card.append(content);
  return card;
}

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(value);
}

function validEvent(event) {
  if (!event || typeof event.title !== "string" || !event.title.trim()
    || typeof event.description !== "string" || !event.description.trim()) return false;
  const additionalDates = event.additionalDates ?? [];
  if (!Array.isArray(additionalDates)) return false;
  if (event.date === null) return !event.endDate && additionalDates.length === 0;
  return validDate(event.date)
    && (!event.endDate || (validDate(event.endDate) && event.endDate >= event.date))
    && (!event.endDate || additionalDates.length === 0)
    && additionalDates.every((date, index) => validDate(date) && date > (additionalDates[index - 1] || event.date));
}

function lastDay(event) {
  return event.additionalDates?.at(-1) || event.endDate || event.date;
}

function renderList(target, cards, emptyMessage) {
  target.replaceChildren(...(cards.length ? cards : [element("p", "status-message", emptyMessage)]));
}

async function loadEvents() {
  const response = await fetch("/events/feed.json");
  if (!response.ok) throw new Error("Event feed returned " + response.status);

  const records = await response.json();
  const events = records.filter(validEvent);
  if (events.length !== records.length) console.warn("The event feed contains invalid records.");

  const parts = campusCalendar.formatToParts(new Date());
  const { year, month, day } = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const today = [year, month, day].join("-");
  const datedEvents = events.filter(event => event.date !== null);
  const upcoming = datedEvents.filter(event => lastDay(event) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = datedEvents.filter(event => lastDay(event) < today)
    .sort((a, b) => lastDay(b).localeCompare(lastDay(a)) || b.date.localeCompare(a.date));

  if (featured) {
    const next = upcoming[0];
    const latest = past[0];
    const cards = next ? [eventCard(next, true)]
      : latest ? [eventCard(latest, false)] : [];
    renderList(featured, cards, "There are no events listed yet.");
  }

  if (eventPreview) {
    const cards = upcoming.slice(1, 4).map(event => eventCard(event, false, { preview: true }));
    eventPreview.replaceChildren(...cards);
    eventPreview.hidden = cards.length === 0;
  }

  if (upcomingList) {
    renderList(upcomingList, upcoming.map(event => eventCard(event, true)), "No upcoming events are scheduled.");
  }
  if (pastList) {
    renderList(pastList, past.map(event => eventCard(event, false)), "There are no past events listed yet.");
  }
  if (undatedList) {
    const undated = events.filter(event => event.date === null);
    undatedList.replaceChildren(...undated.map(event => eventCard(event, false)));
    undatedList.closest("section").hidden = undated.length === 0;
  }
}

for (const target of eventSections) {
  renderList(target, [], "Loading event details…");
}

loadEvents().catch(error => {
  console.error(error);
  for (const target of eventSections) {
    renderList(target, [], "Event details are temporarily unavailable. Please try again later.");
  }
});
