import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate, weekday } from "../utils/dates.js";

const BAR_COLOR = "#4f46e5";
const GRID_COLOR = "#e2e8f0";
const AXIS_TEXT = { fontSize: 12, fill: "#64748b" };
const LABEL_TEXT = { fontSize: 12, fill: "#334155" };

function CountTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
      <p className="text-slate-500">{row.label}</p>
      <p className="font-medium text-slate-900">
        {row.count} {row.count === 1 ? "card" : "cards"}
      </p>
    </div>
  );
}

// one horizontal bar per column name
export function StatusChart({ data }) {
  const rows = data.map((row) => ({ ...row, label: row.status }));

  return (
    <ResponsiveContainer width="100%" height={rows.length * 36 + 8}>
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 0, right: 32, bottom: 0, left: 0 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={96}
          tick={AXIS_TEXT}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CountTooltip />} cursor={{ fill: "#f1f5f9" }} />
        <Bar
          dataKey="count"
          fill={BAR_COLOR}
          radius={[0, 4, 4, 0]}
          barSize={18}
          isAnimationActive={false}
        >
          <LabelList dataKey="count" position="right" style={LABEL_TEXT} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// one column per day for the next 7 days
export function DueChart({ data, today }) {
  const rows = data.map((row) => ({
    ...row,
    day: row.date === today ? "Today" : weekday(row.date),
    label: row.date === today ? "Today" : formatDate(row.date),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID_COLOR} />
        <XAxis
          dataKey="day"
          tick={AXIS_TEXT}
          axisLine={{ stroke: "#cbd5e1" }}
          tickLine={false}
        />
        <YAxis
          width={28}
          tick={AXIS_TEXT}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CountTooltip />} cursor={{ fill: "#f1f5f9" }} />
        <Bar
          dataKey="count"
          fill={BAR_COLOR}
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
