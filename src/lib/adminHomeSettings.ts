import type { SettingsSection } from "./adminSettings";

export const homeSections: SettingsSection[] = [
  { id: "category", title: "Top Categories", icon: "bx-category", fields: [
    ["categorysub_heading", "Sub Heading"], ["category_heading", "Heading"],
    ["categoryshort_description", "Short Description", "multiline", 12],
  ] },
  { id: "choose", title: "Why Choose", icon: "bx-check", fields: [
    ["choosesub_heading", "Sub Heading"], ["choose_heading", "Heading"],
    ["choose_inner_heading_1", "Inner Heading 1", "text", 12], ["choose_inner_desc_1", "Inner Description 1", "multiline", 12],
    ["choose_inner_heading_2", "Inner Heading 2", "text", 12], ["choose_inner_desc_2", "Inner Description 2", "multiline", 12],
    ["choose_inner_heading_3", "Inner Heading 3", "text", 12], ["choose_inner_desc_3", "Inner Description 3", "multiline", 12],
  ] },
  { id: "products", title: "Product Section", icon: "bx-cart", fields: [
    ["productsub_heading", "Sub Heading"], ["product_heading", "Heading"],
    ["product_description", "Short Description", "multiline", 12],
  ] },
  { id: "company", title: "Company Section", icon: "bx-building", fields: [
    ["companysub_heading", "Sub Heading"], ["company_heading", "Heading"],
  ] },
  { id: "work", title: "Work Section", icon: "bx-task", uppercase: true, fields: [
    ["worksub_heading", "Sub Heading"], ["work_heading", "Heading"],
    ["work_description", "Short Description", "multiline", 12], ["work_video_url", "Video Url", "url", 12],
  ] },
  { id: "testimonial", title: "Testimonial Section", icon: "bxs-quote-alt-left", fields: [
    ["testimonialsub_heading", "Sub Heading"], ["testimonial_heading", "Heading"],
  ] },
  { id: "counter", title: "Counter Section", icon: "bx-calculator", fields: [
    ["counter_1_heading", "Heading 1"], ["counter_1_number", "Number 1", "number"],
    ["counter_2_heading", "Heading 2"], ["counter_2_number", "Number 2", "number"],
    ["counter_3_heading", "Heading 3"], ["counter_3_number", "Number 3", "number"],
  ] },
  { id: "contact", title: "Contact Us Information", icon: "bx-envelope", fields: [
    ["contactsub_heading", "Sub Heading"], ["contact_heading", "Heading"],
    ["contactshort_description", "Short Description", "multiline", 12], ["contactaddress", "Address", "editor", 12],
    ["contactphone_1", "Phone 1", "text", 4], ["contactphone_2", "Phone 2", "text", 4], ["contactemail", "Site Email", "email", 4],
    ["contact_map_url", "Map URL", "url", 12],
  ] },
  { id: "git", title: "Get in Touch", icon: "bx-phone", fields: [
    ["get_touchsub_heading", "Sub Heading"], ["get_touch_heading", "Heading"],
    ["get_touchshort_description", "Short Description", "multiline", 12],
  ] },
  { id: "footer", title: "Footer Section", icon: "bx-copyright", uppercase: true, fields: [
    ["newsletter_heading", "Newsletter Heading", "text", 12], ["newsletter_short_description", "Newsletter Description", "multiline", 12],
    ["footer_heading", "Heading", "text", 12], ["footershort_description", "Short Description", "multiline", 12],
    ["facebook_url", "Facebook Url", "url", 12], ["twitter_url", "Twitter Url", "url", 12],
    ["instagram_url", "Instagram Url", "url", 12], ["linkedin_url", "Linkedin Url", "url", 12], ["youtube_url", "Youtube Url", "url", 12],
    ["footer_logo", "Footer Logo", "image", 4], ["footer_img_1", "Footer Image 1", "image", 4], ["footer_img_2", "Footer Image 2", "image", 4],
  ] },
  { id: "popup", title: "Pop-up Section", icon: "bx-image", fields: [
    ["popup_banner_url", "Popup Redirect URL", "url", 12], ["popup_banner_file", "Popup Banner Image", "image", 12],
    ["popup_banner_status", "Enable popup on homepage", "switch", 12],
  ] },
];
