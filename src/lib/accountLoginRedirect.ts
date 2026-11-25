/** Seller and buyer use the same role-aware dashboard URL. */
const accountRoutes = new Set([
  "/dashboard", "/is-interested", "/profile", "/profile-edit", "/company-edit", "/my_enquiry",
  "/my-product", "/add_product", "/open-enquiry-dashboard", "/my-open-enquiry-dashboard",
  "/my-buyer-enquiries", "/seller_enquiry", "/all-leads-chats", "/my-all-enquiries-chats",
]);

const enquiryIdentifier = "[\\p{L}\\p{N}][\\p{L}\\p{N}_.-]{0,119}";
const leadDetailPattern = new RegExp(`^/lead-detail/${enquiryIdentifier}(?:\\?(?:received=1|my-enquiry=true))?$`, "u");

function isAccountReturnTo(path: string): boolean {
  return accountRoutes.has(path)
    || /^\/edit_product\/[1-9][0-9]*$/.test(path)
    || /^\/open-enquiry\/[1-9][0-9]*(?:\?type=1)?$/.test(path)
    || leadDetailPattern.test(path);
}

/**
 * Preserve the only query parameters which determine the account detail view.
 * Never forward arbitrary query strings (which could contain unsafe destinations).
 */
export function accountLoginReturnTarget(pathname: string, search: string): string {
  const query = new URLSearchParams(search);
  let target = pathname;
  if (/^\/open-enquiry\/[1-9][0-9]*$/.test(pathname) && query.get("type") === "1") {
    target += "?type=1";
  } else if (new RegExp(`^/lead-detail/${enquiryIdentifier}$`, "u").test(pathname)) {
    if (query.get("received") === "1") target += "?received=1";
    else if (query.get("my-enquiry") === "true") target += "?my-enquiry=true";
  }
  return isAccountReturnTo(target) ? target : "/dashboard";
}

/** Public detail pages intentionally use `redirect` instead of `returnTo`. */
function isPublicRedirect(path: string): boolean {
  return /^\/(?:products|companies)\/[a-zA-Z0-9_-]+$/.test(path);
}

/** Only route-specific same-origin login destinations are accepted. */
export function accountLoginDestination(search: string): string {
  const query = new URLSearchParams(search);
  const returnTo = query.get("returnTo");
  if (returnTo !== null) return isAccountReturnTo(returnTo) ? returnTo : "/dashboard";
  const redirect = query.get("redirect");
  if (redirect && isPublicRedirect(redirect)) return redirect;
  return "/dashboard";
}
