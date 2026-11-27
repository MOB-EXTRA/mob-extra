const DEVICE_ID_KEY = "mob-extra-review-device";
const DEVICE_ID_ALIASES = [
  DEVICE_ID_KEY,
  "vile_tempest_device_token",
  "vile_tempest_redeem_device_token",
];
const AUTHOR_NAME_KEY = "mob-extra-review-author";

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
  return localStorage.getItem(AUTHOR_NAME_KEY)?.trim() || "";
}

export function setReviewAuthorName(author) {
  const name = String(author || "").trim().slice(0, 80);
  if (!name || name === "Community member") {
    localStorage.removeItem(AUTHOR_NAME_KEY);
    return "";
  }
  localStorage.setItem(AUTHOR_NAME_KEY, name);
  return name;
}
