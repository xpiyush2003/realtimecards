const indiaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
});

// today's date in India as "YYYY-MM-DD"
export function todayInIndia() {
  return indiaDate.format(new Date());
}

// "2026-10-12" plus 3 -> "2026-10-15", a negative number goes back
export function addDays(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
