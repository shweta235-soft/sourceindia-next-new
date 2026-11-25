# Bulk98 - Content and navigation read-only API batch

12 new GET operations covering Knowledge Center and Front Menu. Six public, six signed-admin. Original reference models: `KnowledgeCenter` -> `knowledge_centers.knowledge_center_id`, `UploadImage` -> `upload_images.upload_image_id`, `FrontMenu` -> `front_menu.front_menu_id`. No schema changes, no writes and no UI changes. The front menu public tree includes only visible active rows, with nesting following the Express controller. Knowledge Center public rows require `status=1` and `is_delete=0`. Admin requests use signed `/admin` cookie and should return JSON 401 for anonymous callers.

Run `node --test src/lib/localContentNavigation.test.mjs`, then `npm run build`, then `npm run dev`, then `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-content-bulk98.ps1` in a second terminal.

Potential differences: front menu public response is wrapped as `{items:[...]}` rather than original Express bare array; no UI was rewired. Authenticated admin and DB-backed smoke tests pending on Windows. The menu list is intentionally not paginated on public route to preserve complete hierarchy; admin list is paginated.
