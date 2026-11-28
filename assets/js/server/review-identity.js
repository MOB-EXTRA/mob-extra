const DEVICE_ID_KEY = "mob-extra-review-device";
const DEVICE_ID_ALIASES = [
  DEVICE_ID_KEY,
  "vile_tempest_device_token",
  "vile_tempest_redeem_device_token",
];
const AUTHOR_NAME_KEY = "mob-extra-review-author";
const RESERVED_AUTHOR_FRAGMENTS = [
  "mobextra",
  "viletempest",
  "marcjohnford",
];

export function isReservedReviewAuthor(author) {
  const normalized = String(author || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return RESERVED_AUTHOR_FRAGMENTS.some((fragment) =>
    normalized.includes(fragment),
  );
}

export function normalizeReviewAuthor(author) {
  return String(author || "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function generateReviewAuthor() {
  const values = new Uint32Array(2);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(values);
  } else {
    values[0] = Math.floor(Math.random() * 0xffffffff);
    values[1] = Math.floor(Math.random() * 0xffffffff);
  }
  const suffix = Array.from(values, (value) => value.toString(36)).join("");
  return `Community-${suffix}`;
}

export function getReviewDeviceId() {
  let deviceId = DEVICE_ID_ALIASES.map((key) => localStorage.getItem(key)).find(
    Boolean,
  );
  if (!deviceId) {
    deviceId = `review_${crypto.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
  }

  DEVICE_ID_ALIASES.forEach((key) => localStorage.setItem(key, deviceId));
  return deviceId;
}

export function getReviewAuthorName() {
  const name = localStorage.getItem(AUTHOR_NAME_KEY)?.trim() || "";
  if (isReservedReviewAuthor(name)) {
    localStorage.removeItem(AUTHOR_NAME_KEY);
    return "";
  }
  return name;
}

export function setReviewAuthorName(author) {
  const name = String(author || "").trim().slice(0, 80);
  if (!name || name === "Community member") {
    localStorage.removeItem(AUTHOR_NAME_KEY);
    return "";
  }
  if (isReservedReviewAuthor(name)) {
    throw new Error("Names that impersonate the site owner are not allowed.");
  }
  localStorage.setItem(AUTHOR_NAME_KEY, name);
  return name;
}
