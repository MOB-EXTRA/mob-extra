const PORTFOLIO_PATH = /\/pages\/portfolio\/(?:team|community)\/[^/]+(?:\/|$)/i;

export function isReviewEnabled(
  page = document,
  pathname = window.location.pathname,
) {
  if (!PORTFOLIO_PATH.test(pathname)) return true;
  return (
    page
      .querySelector('meta[name="review-enabled"]')
      ?.content?.trim()
      .toLowerCase() === "true"
  );
}
