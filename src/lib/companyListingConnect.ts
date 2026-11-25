/** A buyer-listing Connect action must retain which company was selected.
 * The company detail page owns the existing authentication and Connect flow.
 */
export function companyListingConnectHref(slug: string | null | undefined): string | null {
  if (!slug || !/^[a-zA-Z0-9_-]+$/.test(slug)) return null;
  return `/companies/${slug}`;
}
