import type { SettingsSection } from "./adminSettings";

const enabled: Array<[string, string]> = [["1", "Enabled"], ["0", "Disabled"]];
const limits: Array<[string, string]> = [["", "Select here"],
  ...Array.from({ length: 10 }, (_, index): [string, string] => [String(index + 1), String(index + 1)])];

export const siteSections: SettingsSection[] = [
  { id: "system", title: "System Settings", icon: "bx-folder", fields: [
    ["title", "Title", "text", 4], ["website_email", "Website Email", "email", 4], ["mobile", "Mobile", "text", 4],
    ["logo_file", "Image", "image", 6], ["favicon_file", "Favicon", "image", 6],
    ["address", "Address", "multiline", 12],
    ["seller_category_limit", "Seller Category Limit", "select", 3, { options: limits }],
    ["site_email", "Admin Site Email", "email", 3, { placeholder: "Site Email" }],
    ["site_email_cc", "Admin Site Email CC", "email", 3, { placeholder: "Site Email CC" }],
    ["site_email_bcc", "Admin Site Email BCC", "email", 3, { placeholder: "Site Email BCC" }],
    ["trending_b2b_enabled", "Trending Section", "select", 4, { optional: true, options: enabled, defaultValue: "1" }],
    ["trending_b2b_random_monthly", "Monthly Random Rotation", "select", 4, { optional: true, options: enabled, defaultValue: "1" }],
    ["trending_b2b_limit", "Trending Items Limit", "number", 4, { min: 1, max: 50, placeholder: "12", defaultValue: "12" }],
    ["trending_b2b_item_subcategory_ids", "Trending Item Subcategory IDs", "multiline", 12, {
      optional: true, placeholder: "Comma separated IDs, e.g. 12,15,21",
      help: "Leave empty to use all active item subcategories with products. When enabled, the list will rotate randomly every month.",
    }],
  ] },
  { id: "password", title: "Change Password", icon: "bx-key", fields: [
    ["oldPassword", "Old Password", "password", 4, { autoComplete: "current-password" }],
    ["newPassword", "New Password", "password", 4, { autoComplete: "new-password" }],
    ["confirmPassword", "Confirm Password", "password", 4, { autoComplete: "new-password" }],
  ] },
  { id: "meta", title: "Meta Settings", icon: "bx-cog", fields: [
    ["meta_keywords", "Meta Keywords"], ["meta_description", "Meta Description", "multiline", 12],
  ] },
  { id: "email", title: "Email Settings", icon: "bx-at", fields: [
    ["smtp_from_name", "SMTP From Name"], ["smtp_from_address", "SMTP From Address"],
    ["smtp_server_address", "SMTP Server Address"], ["smtp_port", "SMTP Port"], ["smtp_username", "Username", "email"],
    ["smtp_password", "Password", "password", 6, { autoComplete: "new-password" }],
    ["smtp_tls", "Turn on transport layer security (TLS)", "select", 6, {
      options: [["", "Select here"], ["yes", "Yes"], ["no", "No"]],
    }],
    ["smtp_auto_reply", "Auto email reply to email", "email"],
  ] },
  { id: "sms", title: "SMS Settings", icon: "bx-message", fields: [
    ["sms_username", "SMS Username"], ["sms_password", "SMS Password", "password", 6, { autoComplete: "new-password" }],
    ["sms_route", "SMS Route"], ["sms_dlt_template_id", "SMS dlt template ID"], ["sms_pid", "SMS Pid"], ["sms_url", "SMS Url", "url"],
  ] },
];
