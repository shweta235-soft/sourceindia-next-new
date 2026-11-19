export const originalAdminIcons: Record<string,string> = {
  "Dashboard": "bx bx-home-circle",
  "Buyers": "bx bx-group",
  "Sellers": "bx bx-group",
  "Public Enquiries": "bx bx-user",
  "Leads Master": "bx bx-user",
  "Open Enquiries": "bx bx-user",
  "Management Portal": "bx bx-user",
  "Category Master": "bx bx-cart",
  "Keyword Master": "lni lni-keyword-research",
  "Products": "bx bx-cart",
  "Support System": "bx bx-bulb",
  "FAQ": "bx bx-question-mark",
  "Home Banner": "bx bx-slider",
  "Knowledge Center": "bx bx-info-square",
  "Emails Templates": "bx bx-mail-send",
  "Membership Plan": "bx bx-user-plus",
  "Contact Us": "bx bx-phone",
  "Mail History": "bx bx-envelope",
  "Email Circular": "bx bx-envelope",
  "Event 2024 Registrations": "bx bx-envelope",
  "Activity": "bx bx-task",
  "Applications": "bx bx-mobile",
  "Testimonials": "bx bxs-quote-alt-left",
  "Settings": "bx bx-cog",
  "Seo Pages": "bx bxs-file",
  "User History": "bx bxs-user",
  "User Activities": "bx bxs-user-check",
  "Conflict Logs": "bx bx-error",
  "Pages": "bx bx-file-blank",
  "Reports": "bx bx-file-blank"
};
export const adminMenu = [
  {
    "title": "Dashboard",
    "links": [
      {
        "title": "Dashboard",
        "href": "/admin"
      }
    ]
  },
  {
    "title": "Buyers",
    "links": [
      {
        "title": "Add Buyer",
        "href": "/admin/add_buyer"
      },
      {
        "title": "Buyers List",
        "href": "/admin/buyers"
      },
      {
        "title": "Inactive Buyers",
        "href": "/admin/inactive_buyers"
      },
      {
        "title": "Not Approved Buyers",
        "href": "/admin/not_approved_buyers"
      },
      {
        "title": "Recently Deleted Buyers",
        "href": "/admin/removed_buyers"
      },
      {
        "title": "Buyer Enquiry List",
        "href": "/admin/buyer-enquiries"
      }
    ]
  },
  {
    "title": "Sellers",
    "links": [
      {
        "title": "Add Seller",
        "href": "/admin/add_seller"
      },
      {
        "title": "Sellers List",
        "href": "/admin/sellers"
      },
      {
        "title": "Inactive Sellers",
        "href": "/admin/inactive_sellers"
      },
      {
        "title": "Not Completed Sellers",
        "href": "/admin/not_completed_sellers"
      },
      {
        "title": "Not Approved Sellers",
        "href": "/admin/not_approved_sellers"
      },
      {
        "title": "Recently Deleted Sellers",
        "href": "/admin/removed_sellers"
      }
    ]
  },
  {
    "title": "Public Enquiries",
    "links": [
      {
        "title": "Public Enquiries",
        "href": "/admin/public_enquiries"
      }
    ]
  },
  {
    "title": "Leads Master",
    "links": [
      {
        "title": "Approve Leads",
        "href": "/admin/approve_leads"
      },
      {
        "title": "Pending Leads",
        "href": "/admin/enquiries-list"
      }
    ]
  },
  {
    "title": "Open Enquiries",
    "links": [
      {
        "title": "Open Enquiry List",
        "href": "/admin/open_enquiries"
      },
      {
        "title": "Delete Open Enquiry",
        "href": "/admin/open-enquiry-remove-list"
      }
    ]
  },
  {
    "title": "Management Portal",
    "links": [
      {
        "title": "Roles List",
        "href": "/admin/roles"
      },
      {
        "title": "Sub Admin List",
        "href": "/admin/sub_admin"
      }
    ]
  },
  {
    "title": "Category Master",
    "links": [
      {
        "title": "Categories",
        "href": "/admin/product_categories"
      },
      {
        "title": "Sub Categories",
        "href": "/admin/product_sub_categories"
      },
      {
        "title": "Interest Categories",
        "href": "/admin/interest_categories"
      },
      {
        "title": "Source Interest Categories",
        "href": "/admin/source_interest_categories"
      },
      {
        "title": "Item Categories",
        "href": "/admin/item_category"
      },
      {
        "title": "Item Sub Categories",
        "href": "/admin/item_sub_category"
      },
      {
        "title": "New Items",
        "href": "/admin/new_items"
      }
    ]
  },
  {
    "title": "Keyword Master",
    "links": [
      {
        "title": "Product Keywords",
        "href": "/admin/product_keywords"
      }
    ]
  },
  {
    "title": "Products",
    "links": [
      {
        "title": "Add Product",
        "href": "/admin/add_product"
      },
      {
        "title": "Product List",
        "href": "/admin/approve-product-list"
      },
      {
        "title": "Not Approve Products",
        "href": "/admin/notapprove-product-list"
      }
    ]
  },
  {
    "title": "Support System",
    "links": [
      {
        "title": "Ticket List",
        "href": "/admin/tickets"
      },
      {
        "title": "Ticket Categories",
        "href": "/admin/ticket_categories"
      }
    ]
  },
  {
    "title": "FAQ",
    "links": [
      {
        "title": "Manage FAQ",
        "href": "/admin/faqs"
      },
      {
        "title": "FAQ Categories",
        "href": "/admin/faq_categories"
      }
    ]
  },
  {
    "title": "Home Banner",
    "links": [
      {
        "title": "Home Banner",
        "href": "/admin/home_banners"
      }
    ]
  },
  {
    "title": "Knowledge Center",
    "links": [
      {
        "title": "Knowledge Center",
        "href": "/admin/knowledge_center"
      }
    ]
  },
  {
    "title": "Emails Templates",
    "links": [
      {
        "title": "Emails Templates",
        "href": "/admin/emails-list"
      }
    ]
  },
  {
    "title": "Membership Plan",
    "links": [
      {
        "title": "Membership Plan",
        "href": "/admin/membership_plan"
      }
    ]
  },
  {
    "title": "Contact Us",
    "links": [
      {
        "title": "Contact Us",
        "href": "/admin/contacts-list"
      }
    ]
  },
  {
    "title": "Mail History",
    "links": [
      {
        "title": "Mail History",
        "href": "/admin/mail_history"
      }
    ]
  },
  {
    "title": "Email Circular",
    "links": [
      {
        "title": "Email Circular",
        "href": "/admin/email_circular"
      },
      {
        "title": "Add Email Circular",
        "href": "/admin/add_email_circular"
      }
    ]
  },
  {
    "title": "Event 2024 Registrations",
    "links": [
      {
        "title": "Registrations",
        "href": "/admin/registrations-list"
      },
      {
        "title": "Deleted Registrations",
        "href": "/admin/registrations-remove-list"
      }
    ]
  },
  {
    "title": "Activity",
    "links": [
      {
        "title": "Core Activity",
        "href": "/admin/core_activity"
      },
      {
        "title": "Activity",
        "href": "/admin/activity"
      }
    ]
  },
  {
    "title": "Applications",
    "links": [
      {
        "title": "Applications",
        "href": "/admin/applications"
      }
    ]
  },
  {
    "title": "Testimonials",
    "links": [
      {
        "title": "Testimonials",
        "href": "/admin/testimonials"
      }
    ]
  },
  {
    "title": "Settings",
    "links": [
      {
        "title": "Site Settings",
        "href": "/admin/site_settings"
      },
      {
        "title": "Home Settings",
        "href": "/admin/home_settings"
      },
      {
        "title": "ShortCut menu",
        "href": "/admin/shortcut-page"
      },
      {
        "title": "Front menu",
        "href": "/admin/front_menu"
      }
    ]
  },
  {
    "title": "Seo Pages",
    "links": [
      {
        "title": "Seo Pages",
        "href": "/admin/seo_pages"
      }
    ]
  },
  {
    "title": "User History",
    "links": [
      {
        "title": "User History",
        "href": "/admin/user_history"
      }
    ]
  },
  {
    "title": "User Activities",
    "links": [
      {
        "title": "User Activities",
        "href": "/admin/user_activity"
      }
    ]
  },
  {
    "title": "Conflict Logs",
    "links": [
      {
        "title": "Conflict Logs",
        "href": "/admin/category_conflict_logs"
      }
    ]
  },
  {
    "title": "Pages",
    "links": [
      {
        "title": "Terms & Conditions",
        "href": "/admin/terms_conditions"
      },
      {
        "title": "Privacy Policy",
        "href": "/admin/privacy_policy"
      }
    ]
  },
  {
    "title": "Reports",
    "links": [
      {
        "title": "Seller Unused Categories",
        "href": "/admin/seller_category_report"
      },
      {
        "title": "Product Unused Categories",
        "href": "/admin/product_category_report"
      },
      {
        "title": "Seller Categories Graph",
        "href": "/admin/seller_category_graph"
      },
      {
        "title": "Product Categories Graph",
        "href": "/admin/product_category_graph"
      },
      {
        "title": "Sourcing Interest Graph",
        "href": "/admin/sourcing_interest_graph"
      }
    ]
  }
] as const;
