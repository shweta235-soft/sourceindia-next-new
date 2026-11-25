import { GET as getByCategory } from '../catalog/categories/[id]/subcategories/route';
import { validCategoryId, isCatalogTrackingParam } from '@/lib/localCatalog';

export const runtime = 'nodejs';
/** Compatibility route: GET /api/local/subcategories?categoryId=123.
 * Subcategories require a parent category, and must not be fetched unscoped. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  if ([...url.searchParams.keys()].some(k => k !== 'categoryId' && !isCatalogTrackingParam(k)) || url.searchParams.getAll('categoryId').length !== 1) {
    return Response.json({ message: 'Provide one categoryId query parameter, e.g. ?categoryId=1.' }, { status: 400 });
  }
  const id = url.searchParams.get('categoryId') ?? '';
  if (!validCategoryId(id)) {
    return Response.json({ message: 'Invalid categoryId.' }, { status: 400 });
  }
  return getByCategory(request, { params: Promise.resolve({ id }) });
}
