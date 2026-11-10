# IEEE UBC Okanagan Student Branch

The site is served from the repository root using GitHub Pages and its Jekyll build. Home, Events, Our Team, and Contact are the public navigation tabs. The store placeholder is available directly at `/store/`.

## Add an event

1. Put the poster in `assets/events/`.
2. Add a uniquely named JSON file under `_data/events/`. Use [the PCB workshop entry](_data/events/2025-11-pcb-workshop.json) as a starting point. Set `title`, `date` (YYYY-MM-DD), and `description`. Set `image` to the poster's filename including its extension. `imageAlt`, `endDate`, `time`, `location`, `cost`, and `signupUrl` are optional. Use an absolute HTTPS URL for signup and keep the poster filename as-is in JSON, including any spaces.
3. Commit both files together. Jekyll collects the event files into `/events/feed.json` on the next Pages build.

The site treats events as upcoming through their final date in Kelowna. Upcoming events are ordered by earliest start date and past events by most recent end date. The homepage displays the next upcoming event, or the most recently completed one if there are no upcoming events.

## Update a headshot

Add the photo under `assets/member_info/member_headshots/` and replace the matching member card's image path in `our-team/index.html`. Use a square crop for consistent framing.

## Preview locally

Use [GitHub's Jekyll preview instructions](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/testing-your-github-pages-site-locally-with-jekyll) to serve the repository root. Jekyll processes the event feed template, which a plain static file server serves as source text.
