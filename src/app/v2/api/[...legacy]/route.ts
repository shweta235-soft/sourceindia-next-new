/**
 * Legacy Express URLs not yet converted into dedicated Next.js handlers.
 * Specific existing v2 routes take precedence over this catch-all route.
 * This compatibility layer is intentionally opt-in for dangerous operations.
 */
import { legacyExpressBridgeRequest } from '@/lib/localLegacyExpressBridge';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = legacyExpressBridgeRequest;
export const HEAD = legacyExpressBridgeRequest;
export const OPTIONS = legacyExpressBridgeRequest;
export const POST = legacyExpressBridgeRequest;
export const PUT = legacyExpressBridgeRequest;
export const PATCH = legacyExpressBridgeRequest;
export const DELETE = legacyExpressBridgeRequest;
