import React from "react";
import {
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
} from "recharts";

const MonthlyChart = ({ monthlyData = [] }) => {
  // Default data if no props provided
  const defaultData = [
    { name: "Jan", uv: 4000 },
    { name: "Feb", uv: 3000 },
    { name: "Mar", uv: 2000 },
    { name: "Apr", uv: 2780 },
    { name: "May", uv: 1890 },
    { name: "Jun", uv: 2390 },
    { name: "Jul", uv: 3490 },
    { name: "Aug", uv: 2780 },
    { name: "Sep", uv: 1890 },
    { name: "Oct", uv: 2390 },
    { name: "Nov", uv: 3490 },
    { name: "Dec", uv: 3490 },
  ];

  // Use provided data or fallback to defaults
  const data = monthlyData.length > 0 ? monthlyData : defaultData;

  return (
    <div className="dashboard-card rounded-2xl bg-white p-4 md:p-6">
      <h2 className="mb-4 text-sm font-semibold text-slate-700">Monthly Trends</h2>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5a3" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#0ea5a3" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <CartesianGrid strokeDasharray="3 3" stroke="#dce9e2" />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="uv"
              stroke="#0f766e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorUv)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyChart;
