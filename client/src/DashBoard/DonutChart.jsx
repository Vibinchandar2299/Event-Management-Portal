import React from "react";
import {
  PieChart,
  Pie,
  Cell,
} from "recharts";

const DonutChart = ({ departmentBookings = [], eventTypes = [] }) => {
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    value,
    name,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  };

  // Default data if no props provided
  const defaultDepartmentBookings = [
    { name: "CSE", value: 4 },
    { name: "ECE", value: 3 },
    { name: "MECH", value: 2 },
    { name: "CIVIL", value: 2 },
  ];

  const defaultEventTypes = [
    { name: "Workshops", value: 25 },
    { name: "Seminars", value: 15 },
    { name: "Conferences", value: 13 },
    { name: "Others", value: 10 },
  ];

  // Use provided data or fallback to defaults
  const deptBookings = departmentBookings.length > 0 ? departmentBookings : defaultDepartmentBookings;
  const evtTypes = eventTypes.length > 0 ? eventTypes : defaultEventTypes;

  const COLORS = {
    blue: ["#60A5FA", "#3B82F6", "#2563EB", "#1D4ED8"],
    green: ["#4ADE80", "#22C55E", "#16A34A", "#15803D"],
  };

  // Calculate totals for center text
  const totalDeptBookings = deptBookings.reduce((sum, item) => sum + item.value, 0);
  const totalEventTypes = evtTypes.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Department Bookings */}
      <div className="dashboard-card rounded-2xl bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Department Bookings</h2>
        <div className="h-64 flex items-center justify-center">
          <PieChart width={200} height={200}>
            <Pie
              data={deptBookings}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              innerRadius={60}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {deptBookings.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS.blue[index % COLORS.blue.length]}
                />
              ))}
            </Pie>
            <text x={100} y={100} textAnchor="middle" dominantBaseline="middle">
              <tspan x={100} dy="-0.5em" className="text-xl font-bold">
                {totalDeptBookings}
              </tspan>
              <tspan x={100} dy="1.5em" className="text-sm">
                Total Booking
              </tspan>
            </text>
          </PieChart>
        </div>
      </div>

      {/* Event Types */}
      <div className="dashboard-card rounded-2xl bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Event Types</h2>
        <div className="h-64 flex items-center justify-center">
          <PieChart width={200} height={200}>
            <Pie
              data={evtTypes}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              innerRadius={60}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {evtTypes.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS.green[index % COLORS.green.length]}
                />
              ))}
            </Pie>
            <text x={100} y={100} textAnchor="middle" dominantBaseline="middle">
              <tspan x={100} dy="-0.5em" className="text-xl font-bold">
                {totalEventTypes}
              </tspan>
              <tspan x={100} dy="1.5em" className="text-sm">
                Total Events
              </tspan>
            </text>
          </PieChart>
        </div>
      </div>
    </div>
  );
};

export default DonutChart;
