import React, { Fragment, useMemo } from "react";

const isPlainObject = (value) => {
  return (
    value != null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
};

const toDisplayString = (value) => {
  if (value == null) return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "N/A";
  if (typeof value === "string") return value.trim() === "" ? "N/A" : value;
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isNaN(t) ? "N/A" : value.toLocaleString();
  }
  return String(value);
};

const asArray = (value) => (Array.isArray(value) ? value : value != null ? [value] : []);

const joinList = (value) => {
  const arr = asArray(value)
    .flatMap((v) => (Array.isArray(v) ? v : [v]))
    .filter((v) => v != null && String(v).trim() !== "")
    .map((v) => String(v));
  return arr.length > 0 ? arr.join(", ") : "N/A";
};

const parseDateStringLoose = (raw) => {
  const s = String(raw || "").trim();
  if (!s) return null;

  // Numeric timestamps sometimes arrive as strings.
  // 13+ digits: ms; 10 digits: seconds.
  if (/^\d{10,}$/.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n)) {
      const ms = s.length >= 13 ? n : n * 1000;
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  // MySQL-like formats: "YYYY-MM-DD HH:mm" or "YYYY-MM-DD HH:mm:ss"
  const ymdSpace = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (ymdSpace) {
    const [, y, m, d, hh, mm, ss] = ymdSpace;
    const date = new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      Number(hh),
      Number(mm),
      ss ? Number(ss) : 0
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Prefer stable, timezone-safe handling for date-only ISO strings.
  const isoDateOnly = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateOnly) {
    const [, y, m, d] = isoDateOnly;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // If API sends date-only as ISO midnight, keep it stable as a date-only.
  // For real date-time strings (non-midnight), fall through to native parsing to preserve time.
  const isoMidnight = s.match(
    /^(\d{4})-(\d{2})-(\d{2})T00:00(?::00(?:\.000)?)?(?:Z|[+-]\d{2}:?\d{2})?$/
  );
  if (isoMidnight) {
    const [, y, m, d] = isoMidnight;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Common platform formats (India): DD/MM/YYYY or DD-MM-YYYY (optionally with a time suffix)
  const dmySlash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T].*)?$/);
  if (dmySlash) {
    const [, d, m, y] = dmySlash;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const dmyDash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:[ T].*)?$/);
  if (dmyDash) {
    const [, d, m, y] = dmyDash;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Fallback to native parsing for RFC/ISO date-time strings.
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

const coerceDateInput = (value) => {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value;

  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "string") {
    return parseDateStringLoose(value);
  }

  if (isPlainObject(value)) {
    if (Object.prototype.hasOwnProperty.call(value, "$date")) return coerceDateInput(value.$date);
    if (Object.prototype.hasOwnProperty.call(value, "date")) return coerceDateInput(value.date);
    if (Object.prototype.hasOwnProperty.call(value, "start")) return coerceDateInput(value.start);
    if (Object.prototype.hasOwnProperty.call(value, "startDate")) return coerceDateInput(value.startDate);
    if (Object.prototype.hasOwnProperty.call(value, "value")) return coerceDateInput(value.value);

    const candidate = Object.values(value).find(
      (v) => typeof v === "string" || typeof v === "number" || v instanceof Date
    );
    return candidate != null ? coerceDateInput(candidate) : null;
  }

  return null;
};

const formatDate = (value) => {
  const d = coerceDateInput(value);
  if (!d) return "N/A";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatDateTime = (value) => {
  const d = coerceDateInput(value);
  if (!d) return "N/A";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PageHeader = ({ title }) => {
  return (
    <div className="sece-pdf-header">
      <div className="sece-pdf-header__titleRow">
        <div className="sece-pdf-header__titleCell">
          <div className="sece-pdf-title">{title}</div>
        </div>
      </div>
    </div>
  );
};

const Card = ({ title, children }) => {
  return (
    <div className="sece-pdf-card">
      <div className="sece-pdf-card__title">{title}</div>
      <div className="sece-pdf-card__body">{children}</div>
    </div>
  );
};

const FieldTable = ({ rows }) => {
  return (
    <table className="sece-pdf-kv">
      <tbody>
        {rows.map((row, idx) => (
          <tr key={`${row.label}-${idx}`}>
            <td className="sece-pdf-kv__key">{row.label}</td>
            <td className="sece-pdf-kv__val">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const SimpleTable = ({ columns, rows }) => {
  return (
    <table className="sece-pdf-table">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length > 0 ? (
          rows.map((r, idx) => (
            <tr key={idx}>
              {r.map((cell, i) => (
                <td key={i}>{cell}</td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={columns.length} className="sece-pdf-empty">
              No data available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

const normalizeFoodDates = (foodform) => {
  const { dates, foodDetails } = foodform || {};
  if (!foodform) return [];

  if (Array.isArray(dates)) {
    return dates
      .filter((d) => d && d.date)
      .map((d) => ({ date: d.date, details: d.foodDetails || {} }));
  }

  if (isPlainObject(dates)) {
    return Object.entries(dates).map(([dateKey, dateValue]) => ({
      date: dateValue?.date || { start: dateKey, end: dateKey },
      details: dateValue?.foodDetails || (foodDetails && foodDetails[dateKey]) || {},
    }));
  }

  if (isPlainObject(foodDetails)) {
    return Object.entries(foodDetails).map(([dateKey, details]) => ({
      date: { start: dateKey, end: dateKey },
      details: details || {},
    }));
  }

  return [];
};

const FoodAmenitiesTables = ({ foodform }) => {
  const dateEntries = useMemo(() => normalizeFoodDates(foodform), [foodform]);

  const mealTypes = useMemo(() => {
    const set = new Set();
    dateEntries.forEach((entry) => {
      if (!isPlainObject(entry.details)) return;
      Object.keys(entry.details).forEach((k) => {
        if (k === "_id" || k === "__v" || k === "id") return;
        const normalized =
          k === "Morning Refreshment" ? "MorningRefreshment" : k === "Evening Refreshment" ? "EveningRefreshment" : k;
        set.add(normalized);
      });
    });
    return Array.from(set);
  }, [dateEntries]);

  const getMealData = (details, mealType) => {
    if (!details) return {};
    const aliases = {
      MorningRefreshment: ["MorningRefreshment", "Morning Refreshment"],
      EveningRefreshment: ["EveningRefreshment", "Evening Refreshment"],
    };
    const candidates = aliases[mealType] || [mealType];
    for (const key of candidates) {
      if (details[key]) return details[key];
    }
    return {};
  };

  const toCount = (value) => {
    if (value == null || value === "") return "0";
    return String(value);
  };

  const getCount = (details, mealType, section, key) => {
    const mealData = getMealData(details, mealType);
    const sectionData = mealData?.[section];
    if (sectionData == null) return "0";

    const isRefreshment = mealType === "MorningRefreshment" || mealType === "EveningRefreshment";
    if (isRefreshment) {
      if (typeof sectionData === "object") return toCount(sectionData?.total);
      return toCount(sectionData);
    }

    if (typeof sectionData === "number" || typeof sectionData === "string") return toCount(sectionData);

    const nonVegValue = sectionData?.NonVeg ?? sectionData?.["Non Veg"];
    if (key === "Veg") return toCount(sectionData?.Veg);
    if (key === "NonVeg") return toCount(nonVegValue);
    return toCount(sectionData?.[key]);
  };

  if (dateEntries.length === 0) {
    return <div className="sece-pdf-emptyBlock">No food/amenities data provided</div>;
  }

  return (
    <div>
      {dateEntries.map((entry, idx) => {
        const start = entry?.date && typeof entry.date === "object" ? entry.date.start : entry?.date;
        const end = entry?.date && typeof entry.date === "object" ? entry.date.end : entry?.date;
        const title = `${formatDate(start)}${end && end !== start ? ` - ${formatDate(end)}` : ""}`;
        return (
          <div key={idx} className="sece-pdf-block">
            <div className="sece-pdf-blockTitle">Date: {title || "N/A"}</div>
            <SimpleTable
              columns={[
                "Type",
                "Participants Veg",
                "Participants NonVeg",
                "Guest/VIP Veg",
                "Guest/VIP NonVeg",
              ]}
              rows={mealTypes.map((mealType) => {
                const label =
                  mealType === "MorningRefreshment"
                    ? "Morning Refreshment"
                    : mealType === "EveningRefreshment"
                      ? "Evening Refreshment"
                      : mealType;
                return [
                  label,
                  getCount(entry.details, mealType, "participants", "Veg"),
                  getCount(entry.details, mealType, "participants", "NonVeg"),
                  getCount(entry.details, mealType, "guest", "Veg"),
                  getCount(entry.details, mealType, "guest", "NonVeg"),
                ];
              })}
            />
          </div>
        );
      })}
    </div>
  );
};

const TransportSummary = ({ transport }) => {
  const list = Array.isArray(transport) ? transport : transport ? [transport] : [];

  const columns = [
    "Type of Vehicle",
    "Pick Up Date & Time",
    "Drop Date & Time",
    "Number of Passengers",
    "Pick Up Location",
    "Drop Location",
  ];

  const rows = list.map((t, idx) => {
    const vehicle = t?.travelDetails?.vehicleType || "N/A";
    const pick = t?.travelDetails?.pickUpDateTime || "N/A";
    const drop = t?.travelDetails?.dropDateTime || "N/A";
    const passengers = t?.travelDetails?.numberOfPassengers ?? "N/A";
    const from = t?.travelDetails?.pickUpLocation || "N/A";
    const to = t?.travelDetails?.dropLocation || "N/A";
    return [vehicle, formatDateTime(pick), formatDateTime(drop), toDisplayString(passengers), from, to];
  });

  return <SimpleTable columns={columns} rows={rows} />;
};

const ListBlock = ({ items }) => {
  const list = asArray(items).filter((i) => i != null && String(i).trim() !== "");
  if (list.length === 0) return <span className="sece-pdf-muted">None</span>;
  return (
    <div>
      {list.map((it, idx) => (
        <div key={idx} className="sece-pdf-bullet">• {String(it)}</div>
      ))}
    </div>
  );
};

const unwrapEnvelope = (value) => {
  if (value == null) return value;
  if (Array.isArray(value)) return value;
  if (!isPlainObject(value)) return value;

  if (isPlainObject(value.data)) return value.data;
  if (isPlainObject(value.requirement)) return value.requirement;
  if (isPlainObject(value.booking)) return value.booking;
  if (isPlainObject(value.guestBooking)) return value.guestBooking;
  return value;
};

export default function EventPdfTemplate({ eventData }) {
  const basic = eventData?.basicEvent || {};
  const communication = eventData?.communicationdata || eventData?.communicationform || {};
  const foodform = unwrapEnvelope(eventData?.foodform) || {};
  const transport = eventData?.transport || [];
  const guestform = unwrapEnvelope(eventData?.guestform) || {};

  return (
    <div>
      {/* Page 1: Event + Basic */}
      <div className="sece-pdf-page" data-sece-page="basic">
        <PageHeader title="Event & Basic Details" />
        <div className="sece-pdf-body">
          <Card title="Basic Event Information">
            <FieldTable
              rows={[
                { label: "IQAC Number", value: toDisplayString(basic?.iqacNumber) },
                { label: "Event Name", value: toDisplayString(basic?.eventName) },
                { label: "Event Type", value: toDisplayString(basic?.eventType) },
                { label: "Event Venue", value: toDisplayString(basic?.eventVenue || basic?.venue) },
                { label: "Start Date", value: formatDate(basic?.startDate) },
                { label: "End Date", value: formatDate(basic?.endDate) },
                { label: "Start Time", value: toDisplayString(basic?.startTime) },
                { label: "End Time", value: toDisplayString(basic?.endTime) },
                { label: "Departments", value: joinList(basic?.departments || basic?.department) },
                { label: "Professional Societies", value: joinList(basic?.professional) },
                { label: "Logos", value: joinList(basic?.logos) },
                { label: "Year", value: toDisplayString(basic?.year) },
                { label: "Category", value: joinList(basic?.categories) },
              ]}
            />
          </Card>

          <Card title="Organizers">
            <SimpleTable
              columns={["Employee ID", "Name", "Designation", "Phone"]}
              rows={asArray(basic?.organizers).map((o) => [
                toDisplayString(o?.employeeId || o?.employeeid),
                toDisplayString(o?.name),
                toDisplayString(o?.designation),
                toDisplayString(o?.phone),
              ])}
            />
          </Card>

          <Card title="Resource Persons">
            <SimpleTable
              columns={["Name", "Affiliation"]}
              rows={asArray(basic?.resourcePersons).map((p) => [
                toDisplayString(p?.name),
                toDisplayString(p?.affiliation),
              ])}
            />
          </Card>

          <Card title="Description">
            <div className="sece-pdf-paragraph">{toDisplayString(basic?.description)}</div>
          </Card>
        </div>
      </div>

      {/* Page 2: Communication */}
      <div className="sece-pdf-page" data-sece-page="communication">
        <PageHeader title="Communication Details" />
        <div className="sece-pdf-body">
          <Card title="Communication & Media Requirements">
            {communication && Object.keys(communication).length > 0 ? (
              <FieldTable
                rows={[
                  { label: "Event Poster", value: <ListBlock items={communication?.eventPoster} /> },
                  { label: "Videos", value: <ListBlock items={communication?.videos} /> },
                  { label: "Onstage Requirements", value: <ListBlock items={communication?.onStageRequirements} /> },
                  { label: "Flex Banners", value: <ListBlock items={communication?.flexBanners} /> },
                  {
                    label: "Reception TV Streaming Requirements",
                    value: <ListBlock items={communication?.receptionTVStreamingRequirements} />,
                  },
                  { label: "Communication", value: <ListBlock items={communication?.communication} /> },
                ]}
              />
            ) : (
              <div className="sece-pdf-emptyBlock">No communication data provided</div>
            )}
          </Card>
        </div>
      </div>

      {/* Page 3: Food & Amenities */}
      <div className="sece-pdf-page" data-sece-page="food">
        <PageHeader title="Food & Amenities" />
        <div className="sece-pdf-body">
          <Card title="Requisition Details">
            <FieldTable
              rows={[
                { label: "IQAC Number", value: toDisplayString(foodform?.iqacNumber) },
                {
                  label: "Requisition Date",
                  value: formatDate(
                    foodform?.requisitionDate ||
                      foodform?.requisitiondate ||
                      foodform?.requisition_date ||
                      foodform?.basicDetails?.requisitionDate ||
                      foodform?.date ||
                      foodform?.createdAt
                  ),
                },
                {
                  label: "Event Requestor Department",
                  value: toDisplayString(foodform?.department || foodform?.["department/centre"]),
                },
                { label: "Event Requestor Name", value: toDisplayString(foodform?.requestorName) },
                { label: "Employee ID", value: toDisplayString(foodform?.empId) },
                {
                  label: "Event Requestor Designation",
                  value: toDisplayString(foodform?.designationDepartment || foodform?.designation),
                },
                {
                  label: "Event Requestor Mobile Number",
                  value: toDisplayString(
                    foodform?.eventRequestorMobileNumber || foodform?.mobileNumber || foodform?.mobile
                  ),
                },
                { label: "Name of the Event", value: toDisplayString(foodform?.eventName || basic?.eventName) },
                { label: "Type of the Event", value: toDisplayString(foodform?.eventType || basic?.eventType) },
              ]}
            />
          </Card>

          <Card title="Food & Amenities Details">
            <FoodAmenitiesTables foodform={foodform} />
          </Card>
        </div>
      </div>

      {/* Page 4: Transport */}
      <div className="sece-pdf-page" data-sece-page="transport">
        <PageHeader title="Transport Details" />
        <div className="sece-pdf-body">
          <Card title="Transport Summary">
            {Array.isArray(transport) && transport.length > 0 ? (
              <TransportSummary transport={transport} />
            ) : (
              <div className="sece-pdf-emptyBlock">No transport data provided</div>
            )}
          </Card>

          {Array.isArray(transport) && transport.length > 0 ? (
            <Card title="Transport Requests (Form View)">
              {transport.map((t, idx) => (
                <div key={t?._id || idx} className="sece-pdf-block">
                  <FieldTable
                    rows={[
                      {
                        label: "Event Requestor Department",
                        value: toDisplayString(t?.basicDetails?.departmentName || t?.departmentName),
                      },
                      {
                        label: "Event Requestor Designation",
                        value: toDisplayString(t?.basicDetails?.designation || t?.designation),
                      },
                      { label: "Employee ID", value: toDisplayString(t?.basicDetails?.empId || t?.empId) },
                      { label: "IQAC Number", value: toDisplayString(t?.basicDetails?.iqacNumber || t?.iqacNumber) },
                      {
                        label: "Event Requestor Mobile Number",
                        value: toDisplayString(t?.basicDetails?.mobileNumber || t?.mobileNumber),
                      },
                      {
                        label: "Event Requestor Name",
                        value: toDisplayString(t?.basicDetails?.requestorName || t?.requestorName),
                      },
                      { label: "Requisition Date", value: formatDate(t?.basicDetails?.requisitionDate || t?.requisitionDate) },
                      {
                        label: "Name of the Event",
                        value: toDisplayString(t?.eventDetails?.eventName || t?.eventName || basic?.eventName),
                      },
                      {
                        label: "Type of the Event",
                        value: toDisplayString(t?.eventDetails?.eventType || t?.eventType || basic?.eventType),
                      },
                      {
                        label: "Details of the Traveller",
                        value: toDisplayString(t?.eventDetails?.travellerDetails || t?.eventDetails?.travellerDetails),
                      },
                      { label: "Type of Vehicle", value: toDisplayString(t?.travelDetails?.vehicleType) },
                      { label: "Pick Up Date & Time", value: formatDateTime(t?.travelDetails?.pickUpDateTime) },
                      { label: "Drop Date & Time", value: formatDateTime(t?.travelDetails?.dropDateTime) },
                      { label: "Pick Up Location", value: toDisplayString(t?.travelDetails?.pickUpLocation) },
                      { label: "Drop Location", value: toDisplayString(t?.travelDetails?.dropLocation) },
                      { label: "Number of Passengers", value: toDisplayString(t?.travelDetails?.numberOfPassengers) },
                      { label: "Special Requirements", value: toDisplayString(t?.travelDetails?.specialRequirements) },
                      { label: "Driver Name", value: toDisplayString(t?.driverDetails?.name) },
                      { label: "Driver Mobile Number", value: toDisplayString(t?.driverDetails?.mobileNumber) },
                    ]}
                  />
                </div>
              ))}
            </Card>
          ) : null}
        </div>
      </div>

      {/* Page 5: Guest Room */}
      <div className="sece-pdf-page" data-sece-page="guestroom">
        <PageHeader title="Guest Room Details" />
        <div className="sece-pdf-body">
          <Card title="Guest Room Booking Form">
            {guestform && Object.keys(guestform).length > 0 ? (
              <FieldTable
                rows={[
                  { label: "IQAC Number", value: toDisplayString(guestform?.iqacNumber) },
                  { label: "Employee ID", value: toDisplayString(guestform?.empId) },
                  { label: "Event Requestor Name", value: toDisplayString(guestform?.requestorName) },
                  {
                    label: "Event Requestor Mobile Number",
                    value: toDisplayString(guestform?.mobile || guestform?.mobileNumber),
                  },
                  { label: "Event Requestor Designation", value: toDisplayString(guestform?.designation) },
                  {
                    label: "Requisition Date",
                    value: formatDate(
                      guestform?.date ||
                        guestform?.requisitionDate ||
                        guestform?.requisitiondate ||
                        guestform?.requisition_date ||
                        guestform?.createdAt
                    ),
                  },
                  { label: "Number of Days", value: toDisplayString(guestform?.stayDays) },
                  { label: "Event Requestor Department", value: toDisplayString(guestform?.department) },
                  { label: "Event Name", value: toDisplayString(guestform?.eventName || basic?.eventName) },
                  { label: "Event Type", value: toDisplayString(guestform?.eventType || basic?.eventType) },
                  { label: "Number of Guests", value: toDisplayString(guestform?.guestCount) },
                  { label: "Purpose", value: toDisplayString(guestform?.purpose) },
                  { label: "Selected Rooms", value: joinList(guestform?.selectedRooms) },
                ]}
              />
            ) : (
              <div className="sece-pdf-emptyBlock">No guest room data provided</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
