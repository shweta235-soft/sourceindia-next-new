export declare const SETTINGS_IMAGE_MAX_BYTES: number;
export declare const SETTINGS_MULTIPART_MAX_BYTES: number;
export declare function settingsImageType(filename: string, mime: string, bytes: Uint8Array): {extension: string; mime: string} | null;
export declare function settingsQaRoot(raw: string | undefined): string | null;
export declare function settingsOwnedFilename(value: unknown): value is string;
export declare function settingsOwnedDbPath(value: unknown): value is string;
export declare function settingsImageMime(filename: string): string | null;
