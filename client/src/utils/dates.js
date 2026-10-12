const indiaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
});

// today's date in India as "YYYY-MM-DD"
export function todayInIndia() {
  return indiaDate.format(new Date());
}

function toUtcDate(date) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

// "2026-10-12" -> "12 Oct"
export function formatDate(date) {
  return toUtcDate(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

// "2026-10-12" -> "Mon"
export function weekday(date) {
  return toUtcDate(date).toLocaleDateString("en-IN", {
    weekday: "short",
    timeZone: "UTC",
  });
}

// a timestamp from the server -> "12 Oct, 4:30 pm" in India time
export function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}
