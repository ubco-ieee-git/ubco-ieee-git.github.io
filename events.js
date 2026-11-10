const featured = document.querySelector("#featured-event");
const upcomingList = document.querySelector("#upcoming-events");
const pastList = document.querySelector("#past-events");
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

function element(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value) node.textContent = value;
  return node;
}

function dateLabel(event) {
  const start = new Date(event.date);
  return event.endDate && event.endDate !== event.date
    ? displayDate.formatRange(start, new Date(event.endDate))
    : displayDate.format(start);
}

function signUpLink(value) {
  if (!value || !URL.canParse(value)) return null;
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const link = element("a", "button button-primary", "Sign up");
  link.href = url.href;
  return link;
}

function eventCard(event, label, upcoming) {
  const card = element("article", event.image ? "event-card" : "event-card event-card--text");

  if (event.image) {
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
  if (label) details.append(element("p", "event-tag", label));
  details.append(element("h3", "", event.title));

  const metadata = element("ul", "event-meta");
  const date = element("time", "", dateLabel(event));
  date.dateTime = event.date;
  const dateItem = element("li");
  dateItem.append(date);
  metadata.append(dateItem);
  for (const value of [event.time, event.location, event.cost].filter(Boolean)) {
    metadata.append(element("li", "", value));
  }
  details.append(metadata, element("p", "event-description", event.description));

  const link = upcoming ? signUpLink(event.signupUrl) : null;
  if (link) details.append(link);
  card.append(details);
  return card;
}

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(value);
}

function validEvent(event) {
  return event
    && typeof event.title === "string" && event.title.trim()
    && typeof event.description === "string" && event.description.trim()
    && validDate(event.date)
    && (!event.endDate || (validDate(event.endDate) && event.endDate >= event.date));
}

function lastDay(event) {
  return event.endDate || event.date;
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
  const upcoming = events.filter(event => lastDay(event) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = events.filter(event => lastDay(event) < today)
    .sort((a, b) => lastDay(b).localeCompare(lastDay(a)) || b.date.localeCompare(a.date));

  if (featured) {
    const next = upcoming[0];
    const latest = past[0];
    const cards = next ? [eventCard(next, "Next event", true)]
      : latest ? [eventCard(latest, "Most recent event", false)] : [];
    renderList(featured, cards, "There are no events listed yet.");
  }

  if (upcomingList) {
    renderList(upcomingList, upcoming.map(event => eventCard(event, "", true)), "No upcoming events are scheduled.");
  }
  if (pastList) {
    renderList(pastList, past.map(event => eventCard(event, "", false)), "There are no past events listed yet.");
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
