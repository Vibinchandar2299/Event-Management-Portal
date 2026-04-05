const isPlainObject = (v) => v && typeof v === "object" && !Array.isArray(v);

export const withMongoId = (record) => {
  if (!record) return record;
  if (Array.isArray(record)) return record.map(withMongoId);
  if (!isPlainObject(record)) return record;

  const id = record.id ?? record._id;
  if (!id) return record;

  return {
    ...record,
    _id: String(id),
  };
};

export const withMongoIdsDeep = (value) => {
  if (Array.isArray(value)) return value.map(withMongoIdsDeep);
  if (!isPlainObject(value)) return value;

  const out = { ...value };
  if (out.id && !out._id) out._id = String(out.id);

  for (const [k, v] of Object.entries(out)) {
    out[k] = withMongoIdsDeep(v);
  }

  return out;
};

export const ensureApprovalsShape = (approvals) => {
  const base = {
    communication: { approved: false, approvedBy: "", approvedAt: null, department: "Communication" },
    food: { approved: false, approvedBy: "", approvedAt: null, department: "Food" },
    transport: { approved: false, approvedBy: "", approvedAt: null, department: "Transport" },
    guestroom: { approved: false, approvedBy: "", approvedAt: null, department: "Guest Deparment" },
    iqac: { approved: false, approvedBy: "", approvedAt: null, department: "IQAC" },
  };

  if (!approvals || typeof approvals !== "object") return base;

  const merged = { ...base };
  for (const key of Object.keys(base)) {
    if (approvals[key] && typeof approvals[key] === "object") {
      merged[key] = { ...base[key], ...approvals[key] };
    }
  }

  return merged;
};
