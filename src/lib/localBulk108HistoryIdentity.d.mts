/** Schema-derived identity; no user-controlled SQL identifiers. */
export interface HistoryColumnMetadata {
 COLUMN_NAME: string;
 COLUMN_KEY: string;
 DATA_TYPE: string;
}
export function resolveNewsletterHistoryIdentity(columns: readonly HistoryColumnMetadata[]): string | null;
export function newsletterHistoryIdExpression(name: string): string;
