const fs = require("node:fs");
const path = require("node:path");

const project = fs.realpathSync(__dirname);
const admin = path.join(project, "src", "app", "admin");
const protectedAdmin = path.join(admin, "(protected)");

const migratedFiles = [
  "layout.tsx",
  "add_product/page.tsx",
  "admin-view-enquiry/[enquiry_number]/page.tsx",
  "approve-product-list/page.tsx",
  "approve_leads/page.tsx",
  "buyer-enquiries/page.tsx",
  "buyers/page.tsx",
  "category-remove-list/page.tsx",
  "deleted_buyers/page.tsx",
  "deleted_sellers/page.tsx",
  "edit_product/[productId]/page.tsx",
  "enquiries-list/page.tsx",
  "enquiry-remove-list/page.tsx",
  "inactive_buyers/page.tsx",
  "inactive_sellers/page.tsx",
  "item-category-remove-list/page.tsx",
  "item-sub-category-remove-list/page.tsx",
  "item_category/page.tsx",
  "item_sub_category/page.tsx",
  "items-remove-list/page.tsx",
  "leads/page.tsx",
  "new_items/page.tsx",
  "not_approved_buyers/page.tsx",
  "not_approved_sellers/page.tsx",
  "not_completed_sellers/page.tsx",
  "notapprove-product-list/page.tsx",
  "open-enquiries/[id]/page.tsx",
  "open-enquiry-remove-list/page.tsx",
  "open_enquiries/page.tsx",
  "product-list/page.tsx",
  "product-remove/page.tsx",
  "product_categories/page.tsx",
  "product_sub_categories/page.tsx",
  "products/page.tsx",
  "public_enquiries/page.tsx",
  "sellers/page.tsx",
  "subcategory-remove-list/page.tsx",
];

function hasProjectFile(filename) {
  let info;
  try {
    info = fs.lstatSync(filename);
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
  const actual = fs.realpathSync(filename);
  const relative = path.relative(project, actual);
  if (!info.isFile() || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Expected a regular file inside this project: ${filename}`);
  }
  return true;
}

function repairRoutes() {
  const requiredFiles = [
    path.join(project, "package.json"),
    path.join(project, "src", "proxy.ts"),
    path.join(admin, "login", "page.tsx"),
    path.join(protectedAdmin, "dashboard", "page.tsx"),
    path.join(protectedAdmin, "layout.tsx"),
  ];
  if (!requiredFiles.every(hasProjectFile)) {
    throw new Error("Place this script beside package.json in the project where Phase 16 is already applied.");
  }

  const files = [];
  for (const name of migratedFiles) {
    const legacyFile = path.join(admin, name);
    if (!hasProjectFile(legacyFile)) continue;

    const replacement = path.join(protectedAdmin, name);
    if (!hasProjectFile(replacement)) {
      throw new Error(`Protected replacement is missing for ${name}. Reapply the repair ZIP before running this script.`);
    }
    files.push(legacyFile);
  }
  const cache = path.join(project, ".next");
  const cacheInfo = fs.lstatSync(cache, { throwIfNoEntry: false });
  if (cacheInfo && !cacheInfo.isDirectory()) {
    throw new Error(`Expected .next to be a generated directory: ${cache}`);
  }

  if (files.length) {
    const backup = fs.mkdtempSync(path.join(path.dirname(project), `${path.basename(project)}-admin-route-backup-`));
    console.log(`Backup folder: ${backup}`);
    for (const filename of files) {
      const destination = path.join(backup, path.relative(project, filename));
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.renameSync(filename, destination);
    }
    console.log(`Moved ${files.length} legacy admin route/layout files to backup.`);
  }
  if (cacheInfo) {
    fs.rmSync(cache, { recursive: true, force: true, maxRetries: 4, retryDelay: 200 });
    console.log("Cleared .next, including generated route types.");
  }
  console.log("Repair complete. Run npm run build.");
}

try {
  repairRoutes();
} catch (error) {
  console.error(`Admin route repair stopped: ${error.message}`);
  process.exitCode = 1;
}
