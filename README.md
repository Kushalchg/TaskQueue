# TaskSequence — Photo Backup App (Expo)

This repository contains a small Expo app that helps you pick photos from the device, store them locally, and automatically upload them to a remote server. The upload can happen immediately while the app is in the foreground or periodically while the app is in the background.

The README below explains how the system works, what the main files do, and how to test common scenarios. It's written so beginners can quickly understand the architecture and the flow.

**Quick Start**

- **Install:** `npm install`
- **Start:** `npx expo start`
- **Reset starter app:** `npm run reset-project`

**Important:** Grant photo library permission when prompted — otherwise the image picker won't return any images.

**Files to inspect**

- **App entry / UI:** `app/(tabs)/index.tsx`
- **Services:** `app/(tabs)/_services/` contains the core logic:
  - `backgroundTaskService.ts` — background scheduling & task worker
  - `imageService.ts` — picks images and copies them into app storage
  - `storageService.ts` — load/save/clear tasks in AsyncStorage
  - `uploadService.ts` — uploads files to the remote endpoint

**High-level Overview**

- The app allows you to pick images which are added as 'tasks'. Each task is a small object that includes an id, file name, a uri pointing to the file in the app's storage, a status, and a retry counter.
- Tasks are persisted to AsyncStorage using the key `backup_tasks` so both foreground code and background workers read the same source of truth.
- Uploads happen in two ways:
  1. Foreground immediate processing: when the app is active and online it processes pending tasks right away.
  2. Background processing: when the app is not active, an Expo background task runs periodically and uploads pending tasks if the device is online.

**Task object (shape)**

- `id`: unique string
- `name`: file name
- `uri`: local file uri inside app document storage
- `status`: `pending` | `processing` | `completed` | `failed`
- `retries`: number of upload attempts

How the pieces connect (step-by-step)

1. User selects photos via the UI (image picker).
   - The `imageService` copies selected images into the app's document storage and returns new task objects with `status: "pending"`.
   - The UI calls `saveTasks(...)` (from `storageService`) to persist the joined task list.
2. After saving tasks the app chooses an approach depending on network and app state:
   - If the device is online and the app is in the foreground, `processTasks()` runs immediately.
   - If the device is offline or the app is backgrounded, the app triggers the background task registration (so the OS can run periodic uploads when possible).
3. `processTasks()` (foreground) behavior:
   - It always loads the latest tasks from storage (to avoid stale state problems).
   - Marks pending tasks as `processing`, persists, and updates UI via `setTasks`.
   - Uploads tasks one by one using `uploadService`. After each upload it updates the task status to `completed` or `failed` (and increments `retries` on failure), saves to storage and updates the UI.
4. `backgroundTaskService` (background) behavior:
   - A background worker is defined with a stable name (see `BACKGROUND_TASK_NAME`). It waits for an initialization promise, checks the network, then loads tasks from `backup_tasks` and uploads pending items similarly to the foreground flow.
   - Each upload result is saved back to AsyncStorage so UI shows the correct status when the user opens the app.

**Network & AppState rules (summary)**

- Foreground + Online: uploads start immediately and UI shows `processing` → `completed`.
- Foreground + Offline: new tasks stay as `pending`. When internet is restored while the app is active, the app will detect it and start processing automatically.
- Background (app not active): background worker runs on a timer (Expo background tasks) and processes pending tasks only if the device is online. Results are saved to AsyncStorage.

Why the app reloads tasks from storage before processing

- React state can be stale when triggered by lifecycle events (for example, AppState or network change hooks). To avoid race conditions the upload logic always loads the latest saved tasks from `storageService` before mutating status and uploading. This makes AsyncStorage the single source of truth.

UI status updates

- The UI reads tasks from `storageService` on mount and when the app returns to the foreground. When `processTasks()` runs it saves updates to storage and calls `setTasks(...)` so the list on screen shows the current status for each image.

Troubleshooting (common issues)

- "Uploads say offline immediately after picking images": the app now checks live network status with `Network.getNetworkStateAsync()` at the moment it begins processing — if you still see this, check permission and make sure the emulator/device network is actually connected.
- "UI doesn't show updated status immediately": confirm that `storageService.saveTasks` is completing and `loadTasks` returns the updated list; reopen the app to force a reload; enable logs to inspect sequence (see Developer Tips below).
- "Background uploads not running": background tasks depend on device scheduling policies and OS. In development tools you can force them, but on a real device behavior depends on battery, OS policy, etc.

Developer tips

- Storage key: `backup_tasks`. You can inspect AsyncStorage contents with device debugging tools.
- To force a background upload cycle during development, use the app action that calls `triggerBackgroundTask()` (this re-registers the background task and can be used to make the system re-evaluate scheduling).
- To add logs: put `console.log` statements in `processTasks`, `uploadService`, and `storageService` to verify the order of operations.

Recommended test scenarios

- Pick images while online and active → verify items go through `processing` -> `completed` and UI updates.
- Pick images while offline → verify tasks remain `pending`, then enable network while the app is active → verify they start processing automatically.
- Put app to background and enable network → wait for scheduled background work and then bring app to foreground; verify completed tasks are reflected in the UI.

Where to look in code (quick pointers)

- Foreground flow & UI: `app/(tabs)/index.tsx`
- Background registration & worker: `app/(tabs)/_services/backgroundTaskService.ts`
- Image picking & local copy: `app/(tabs)/_services/imageService.ts`
- Persistence: `app/(tabs)/_services/storageService.ts`
- Upload endpoint: `app/(tabs)/_services/uploadService.ts`

If you want, I can:

- add temporary verbose logs around save/load/upload to help debugging on a device,
- inspect `TaskListItem` to make sure status fields render visually as you expect,
- add a small dev screen to manually trigger `processTasks()` and `triggerBackgroundTask()` for easier testing.

Thanks — happy to expand any section or add debug helpers you prefer.
