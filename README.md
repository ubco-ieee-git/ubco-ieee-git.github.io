# IEEE UBC Okanagan Student Branch

The site is served from the repository root using GitHub Pages and its Jekyll build. The public navigation links to Home, Events, Our Team, and the Contact section of the homepage (`/#contact`). The store placeholder is available directly at `/store/`.

## Add an event

1. If the event has a poster, put it in `assets/events/`.
2. Add a uniquely named JSON file under `_data/events/YYYY/` using the event’s start year, or the year its schedule starts if there is no set date. Use [the PCB workshop entry](_data/events/2025/2025-11-pcb-workshop.json) as a starting point. Set `title`, `date` (YYYY-MM-DD or `null` if there is no set date), and `description`. Use `endDate` for a date range or `additionalDates` for separate session dates in ascending order after `date`. Set `status` to `ongoing` for an ongoing event.
3. Keep all fields in the copied entry. Use `null` for any unused field and `[]` when there are no additional session dates. Use an absolute HTTPS URL for `signupUrl` and the exact poster filename for `image`, including any spaces.
4. Commit the JSON and any poster together. Jekyll collects the event files into `/events/feed.json` on the next Pages build.

The site treats events as upcoming through their final date in Kelowna. Upcoming events are ordered by earliest start date and past events by most recent end date. The homepage displays the next upcoming event, or the most recently completed one if there are no upcoming events.

## Update a headshot

Add the photo under `assets/member_info/member_headshots/` and replace the matching member card's image path in `our-team/index.html`. Use a square crop for consistent framing.

## Preview locally

Run `python preview.py` from the repository root, then open [the Events page](http://127.0.0.1:8000/events/). The script uses Python's standard library and reads the event JSON files on every feed request. Refresh the page after editing an event.

If port 8000 is in use, run `python preview.py --port 8001` and open the same path on port 8001. Press Ctrl+C to stop the server.
