/** Compatibility endpoint for public catalog products. */
import { GET as getCatalogProducts } from '../catalog/products/route';

// Next.js route segment config must be declared locally as a static literal.
export const runtime = 'nodejs';
export async function GET(request: Request) {
  return getCatalogProducts(request);
}
