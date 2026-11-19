type FieldType = "text" | "multiline" | "editor" | "url" | "email" | "number" | "image" | "switch" | "select" | "password";

type FieldOptions = {
  optional?: boolean;
  placeholder?: string;
  defaultValue?: string;
  options?: Array<[value: string, label: string]>;
  autoComplete?: string;
  help?: string;
  min?: number;
  max?: number;
};

export type SettingField = [name: string, label: string, type?: FieldType, columns?: 3 | 4 | 6 | 12, options?: FieldOptions];
export type SettingsSection = { id: string; title: string; icon: string; fields: SettingField[]; uppercase?: boolean };
