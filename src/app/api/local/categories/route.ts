/** Compatibility endpoint for public categories. */
import { GET as getCatalogCategories } from '../catalog/categories/route';

// Next.js route segment config must be declared locally as a static literal.
export const runtime = 'nodejs';
export async function GET() {
  return getCatalogCategories();
}
