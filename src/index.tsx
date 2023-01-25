import React from "react";
import ReactDOM from "react-dom/client";
import * as C from "calendar-link";
import Markdown from "marked-react";
import "./main.css";

// https://developers.google.com/maps/documentation/embed/quickstart#create-project
// https://console.cloud.google.com/apis/credentials/key/99030294-c599-4b23-be52-0ccbac57405e?project=github-erosson-event-links
// do your worst, it's client-side anyway and restrictions are configured
const gmapsApiKey = "AIzaSyAhjw-wL4YLka_g5FCA7wsbLlqUf_MITYk";

const tzOffset = new Date().getTimezoneOffset();
const tzOffsetMs = tzOffset * 60000;
const tzOffsetHrs = tzOffset / 60;
// const tzString = new window.Intl.DateTimeFormat().resolvedOptions().timeZone;
const tzString = `GMT${-tzOffsetHrs < 0 ? "" : "+"}${-tzOffsetHrs}:00`;

function App(): JSX.Element {
  const url = new URL(document.location.href);
  const qs = Object.fromEntries(url.searchParams.entries());

  const title = qs.title ?? "";
  const description = qs.description ?? "";
  const location = qs.location ?? "";
  const allDay = !!qs.allDay;
  const start = new Date(qs.start);
  const end = qs.end
    ? new Date(qs.end)
    : new Date(start.getTime() + 1000 * 60 * 60);

  const event: C.CalendarEvent = {
    title,
    start: isNaN(start.getTime()) ? null : start,
    end: isNaN(end.getTime()) ? null : end,
    allDay,
    description,
    location,
    url: url.toString(),
  };

  const edit = !!qs.edit || !(qs.title && qs.start);
  return edit ? (
    <Edit url={url} event={event} />
  ) : (
    <View url={url} event={event} />
  );
}

function dateToInput(utc: Date | null): string {
  if (!utc) return "";
  // datetime-local works with local dates/times, as the name implies. JS `Date` is UTC.
  const local = new Date(utc.getTime() - tzOffsetMs);
  // datetime-local format matches ISO without the trailing Z.
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local#value
  return local.toISOString().replace(/Z$/, "");
}
function dateFromInput(input: string): Date | null {
  const local = new Date(`${input}Z`);
  if (isNaN(local.getTime())) return null;
  return new Date(local.getTime() + tzOffsetMs);
}

function Edit(props: { url: URL; event: C.CalendarEvent }): JSX.Element {
  const [title, setTitle] = React.useState(props.event.title ?? "");
  const [startS, setStart] = React.useState(dateToInput(props.event.start));
  const [endS, setEnd] = React.useState(dateToInput(props.event.end));
  const [allDay, setAllDay] = React.useState(!!props.event.allDay ?? false);
  const [description, setDescription] = React.useState(
    props.event.description ?? ""
  );
  const [location, setLocation] = React.useState(props.event.location ?? "");

  const qsOut = {
    title,
    start: dateFromInput(startS)?.toISOString() ?? "",
    end: dateFromInput(endS)?.toISOString() ?? "",
    allDay: allDay ? "1" : "",
    description,
    location,
  };
  const urlOut = new URL(props.url);
  urlOut.search = new URLSearchParams(qsOut).toString();

  const event: C.CalendarEvent = {
    title,
    start: startS,
    end: endS,
    allDay,
    description,
    location,
    url: urlOut.toString(),
  };

  const eventBody = (
    <ul>
      <li>
        <label>
          <div>Title</div>
          <input
            value={title}
            onInput={(e) => setTitle(e.currentTarget.value)}
          />
        </label>
      </li>
      <li>
        <label>
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.currentTarget.checked)}
          />{" "}
          All day?
        </label>
      </li>
      <li>
        <label>
          <div>Start</div>
          <input
            type="datetime-local"
            value={startS}
            onChange={(e) => setStart(e.currentTarget.value)}
          />
        </label>
      </li>
      <li>
        <label>
          <div>End</div>
          <input
            type="datetime-local"
            value={endS}
            onChange={(e) => setEnd(e.currentTarget.value)}
          />
        </label>
        <div>
          <small>{tzString}</small>
        </div>
      </li>
      <li>
        <label>
          <div>Description</div>
          <textarea
            value={description}
            style={{ width: "100%", maxWidth: "80em", height: "8em" }}
            onInput={(e) => setDescription(e.currentTarget.value)}
          />
          {description ? (
            <>
              <p>
                <small>Markdown preview:</small>
              </p>
              <div style={{ margin: "1em" }}>
                <Markdown>{description}</Markdown>
              </div>
            </>
          ) : (
            <></>
          )}
        </label>
      </li>
      <li>
        <label>
          <div>Location</div>
          <input
            value={location}
            onInput={(e) => setLocation(e.currentTarget.value)}
          />
        </label>
      </li>
    </ul>
  );

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <div style={{ marginRight: "1em" }}>{eventBody}</div>
        <div>
          <Location location={location} />
        </div>
      </div>
      <div>
        <h2>
          <a href={urlOut.toString()}>Share Your Event</a>
        </h2>
        <div>
          <a href="/">Clear Form</a>
        </div>
      </div>
    </div>
  );
}

function View(props: { url: URL; event: C.CalendarEvent }): JSX.Element {
  const { url, event } = props;
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <div>
          <ViewEventBody event={event} />
        </div>
        <div>
          {event.location ? <Location location={event.location} /> : <></>}
        </div>
      </div>
      <Footer event={event} url={url} />
    </div>
  );
}
function ViewEventBody(props: { event: C.CalendarEvent }): JSX.Element {
  const { event } = props;
  return (
    <>
      <h1>{event.title}</h1>
      <div style={{ display: "flex" }}>
        <div
          style={{
            marginRight: "0.5em",
            display: "flex",
            alignItems: "center",
          }}
        >
          📅
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div
            style={{
              marginRight: "1em",
              marginTop: "0.5em",
              marginBottom: "0.5em",
            }}
          >
            {event.allDay ? (
              <>All day {event.start.toDateString()}</>
            ) : event.end ? (
              <>
                from <b>{event.start.toLocaleString()}</b>
                <br /> until <b>{event.end.toLocaleString()}</b>
                <br />
                <small>{tzString}</small>
              </>
            ) : (
              <>
                starts <b>{event.start.toLocaleString()}</b>
                <br />
                <small>{tzString}</small>
              </>
            )}
          </div>
          <div
            style={{
              marginTop: "0.5em",
              marginBottom: "0.5em",
            }}
          >
            <CalendarLinks event={props.event} />
          </div>
        </div>
      </div>
      {event.description ? (
        <div style={{ margin: "1em" }}>
          <Markdown>{event.description}</Markdown>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}
function CalendarLinks(props: { event: C.CalendarEvent }): JSX.Element {
  const { event } = props;
  return (
    <>
      <div>
        <b>{/*📆 */}Add to Calendar</b>
      </div>
      <a target="_blank" href={C.google(event)}>
        Google
      </a>
      ,{" "}
      <a target="_blank" href={C.office365(event)}>
        Office365
      </a>
      ,{" "}
      <a target="_blank" href={C.outlook(event)}>
        Outlook
      </a>
      ,{" "}
      <a target="_blank" href={C.yahoo(event)}>
        Yahoo
      </a>
      ,{" "}
      <a target="_blank" href={C.ics(event)}>
        <code>.ics</code> file
      </a>
    </>
  );
}

function Location(props: { location: string }): JSX.Element {
  const encLoc = encodeURIComponent(props.location);
  const mapsLink = encLoc
    ? `https://www.google.com/maps/search/${encLoc}`
    : null;
  const mapsEmbed = encLoc
    ? `https://www.google.com/maps/embed/v1/place?key=${gmapsApiKey}&q=${encLoc}`
    : null;
  return (
    <>
      {mapsLink ? (
        <div>
          📍{" "}
          <a target="_blank" href={mapsLink}>
            {props.location}
          </a>
        </div>
      ) : (
        <></>
      )}
      {mapsEmbed ? (
        <div>
          <iframe
            style={{
              border: 0,
              borderRadius: "0.5em",
              width: "90vw",
              maxWidth: "600px",
              height: "450px",
            }}
            loading="lazy"
            allowFullScreen={true}
            referrerPolicy="no-referrer-when-downgrade"
            src={mapsEmbed}
          ></iframe>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}
function Footer(props: { event: C.CalendarEvent; url: URL }): JSX.Element {
  return (
    <>
      {props.event.title && props.event.start ? (
        <>
          <p>
            <a target="_blank" href={props.url.toString()}>
              Share this event:{" "}
            </a>
            <input readOnly={true} value={props.url.toString()} />
          </p>
          <p>
            <a target="_blank" href={`${props.url.toString()}&edit=1`}>
              Create a new event
            </a>
            , or{" "}
            <a href={`${props.url.toString()}&edit=1`}>
              edit a copy of this event
            </a>
          </p>
        </>
      ) : (
        <></>
      )}
    </>
  );
}

function main() {
  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("no root");
  const root = ReactDOM.createRoot(rootEl);
  root.render(<App />);
}
main();
