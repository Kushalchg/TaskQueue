# TaskSequence — Photo Backup App (Expo)

A lightweight Expo app that helps you pick photos from your device, store them locally, and automatically upload them to a remote server. Uploads happen immediately when the app is active and online, or periodically in the background when the device is online.

This guide explains the architecture, file structure, and how the system works. It's designed for beginners.

**⚠️ Platform Note:** iOS build is not currently available (development machine is Linux). Only Android builds are available.

---

## Quick Start

```bash
npm install
npx expo start
```

Select your platform from the menu (Android Emulator, iOS Simulator, or Expo Go).

**Important:** When prompted, grant photo library access — otherwise the image picker won't work.

---

## Project Structure

```
TaskSequence/
├── app/
│   └── (tabs)/
│       ├── index.tsx          ← Main UI & foreground processing logic
│       └── _components/       ← UI components (tabs)
│
├── components/
│   └── tasks/                 ← Task UI components
│       ├── ActionButton.tsx   ← Reusable button component
│       ├── StatBox.tsx        ← Statistics display
│       ├── StatusIcon.tsx     ← Status indicator (pending/processing/completed/failed)
│       ├── TaskListItem.tsx   ← Individual task display with image thumbnail
│       ├── types.ts           ← Task TypeScript interface
│       └── ...
│
├── services/                  ← Core business logic
│   ├── backgroundTaskService.ts   ← Background scheduling & worker
│   ├── imageService.ts           ← Image picking & storage
│   ├── storageService.ts         ← AsyncStorage persistence
│   └── uploadService.ts          ← Upload endpoint integration
│
├── README.md                  ← This file
└── package.json

```

---

## How It Works

### Task Object Structure

Each image is represented as a Task:

```typescript
interface Task {
  id: string; // Unique identifier
  name: string; // File name
  uri: string; // Local file path in app storage
  status: TaskStatus; // "pending" | "processing" | "completed" | "failed"
  retries: number; // Upload attempt counter
}
```

---

## System Flow (Step-by-Step)

## System Flow (Step-by-Step)

### 1. User Picks Images

- User taps **"Add Photos"** button.
- `imageService.ts` opens the system photo picker.
- Selected images are copied from the device library into the app's document storage.
- New Task objects are created with `status: "pending"`.
- Tasks are saved to AsyncStorage (key: `backup_tasks`).

### 2. Upload Decision (Foreground vs Background)

After saving tasks, the app decides how to proceed:

| Condition                      | Action                                                |
| ------------------------------ | ----------------------------------------------------- |
| App is active + Device online  | Call `processTasks()` immediately (foreground upload) |
| App is backgrounded or offline | Register background task for periodic processing      |

### 3. Foreground Upload (`processTasks()`)

When the app is active and online:

1. Load latest tasks from storage (avoid stale state).
2. Mark pending tasks as `processing` and update UI.
3. Upload each task one-by-one using `uploadService.ts`.
4. Update task status to `completed` or `failed` after each upload.
5. Update UI and persist to storage after every change.

**Result:** User sees progress in real-time as images upload.

### 4. Background Upload (When App is Not Active)

When the app is backgrounded but device is online:

1. The OS runs the `BACKGROUND_TASK_NAME` task on a schedule (every ~16 minutes).
2. Background worker loads tasks from storage.
3. Uploads all pending tasks (same logic as foreground).
4. Saves results back to AsyncStorage.
5. When user opens the app, it reloads tasks and shows the updated status.

---

## Upload Endpoint

### Where Images Are Uploaded

Currently, images are uploaded to a **free API webhook service** (webhook.site):

**Endpoint:** `https://webhook.site/8c411855-103d-4ffd-9c76-373192e644c9`

- Images are sent as multipart form data with the field name `file`.
- Content-Type is set to `image/jpeg`.

### Location in Code

Edit `services/uploadService.ts` to change the endpoint:

```typescript
const WEBHOOK_URL = "https://webhook.site/8c411855-103d-4ffd-9c76-373192e644c9";
// ↑ Replace this with your own API endpoint
```

---

## API Limit & Error Handling

### Upload Failures

If a task is marked as `failed`, it could be due to:

1. **Network timeout** — device went offline during upload.
2. **Server error** — remote endpoint returned non-OK status.
3. **Free API limit reached** — webhook.site may have daily/hourly rate limits.

### Changing the Upload Endpoint

To use a different API service:

1. Replace `WEBHOOK_URL` in `services/uploadService.ts` with your endpoint.
2. Ensure your backend accepts multipart form data with a `file` field.
3. Return an HTTP 200+ response on success.

**Example:**

```typescript
const WEBHOOK_URL = "https://your-server.com/api/upload";
```

---

## Release & API Endpoints

The repository includes debug and release versions with different API endpoints:

- **Debug API:** `https://webhook.site/debug-endpoint-placeholder`
  - _(You will add the actual debug endpoint URL in releases)_
- **Release API:** `https://webhook.site/release-endpoint-placeholder`
  - _(You will add the actual release endpoint URL in releases)_

To use a specific endpoint:

1. Go to `services/uploadService.ts`
2. Update `WEBHOOK_URL` with the appropriate endpoint for your build type (debug/release).

---

## Platform Support

| Platform | Status           | Notes                                                  |
| -------- | ---------------- | ------------------------------------------------------ |
| Android  | ✅ Available     | Tested & working                                       |
| iOS      | ❌ Not Available | Development machine is Linux; iOS build requires macOS |
| Web      | ❌ Not Available | Expo Go may work for testing                           |

To build for iOS, use a macOS machine or CI/CD service with macOS runners.

---

## Network & App State Behavior

| App State  | Network | Behavior                                               |
| ---------- | ------- | ------------------------------------------------------ |
| Foreground | Online  | Uploads start immediately                              |
| Foreground | Offline | Tasks remain `pending`; process when network returns   |
| Background | Online  | Background worker uploads on schedule (~16 min)        |
| Background | Offline | Background worker exits; retries on next scheduled run |

---

## UI Status Icons & Displays

Each task shows:

- **Thumbnail:** Image preview (50×50 px).
- **File name:** Display name of the image.
- **Status icon** (rendered by `StatusIcon.tsx`):
  - 🔵 **Pending** — Waiting to upload.
  - ⏳ **Processing** — Currently uploading.
  - ✅ **Completed** — Successfully uploaded.
  - ❌ **Failed** — Upload failed; may retry.

### Dashboard Stats

- **Total:** Total images added.
- **Pending:** Images waiting to upload.
- **Backed up:** Successfully completed uploads.

---

## Persistence & Storage

### AsyncStorage (Local Database)

All tasks are stored locally using **AsyncStorage**:

- **Storage Key:** `backup_tasks`
- **Format:** JSON array of Task objects
- **Accessed by:** Foreground UI, background worker, all services

This ensures a single source of truth — both foreground and background code read/write to the same storage.

### File Storage

- **Image files:** Stored in the app's document directory (Expo `Paths.document`).
- **Persistence:** Files persist until the app is uninstalled or storage is cleared.

---

## Service File Descriptions

### `services/backgroundTaskService.ts`

Defines and registers the background upload worker:

- **`initializeBackgroundTask(promise)`:** Sets up the background task definition. Waits for the app to mount, then runs on schedule.
- **`registerBackgroundTask()`:** Registers the task with the OS for periodic execution (~16 min intervals).
- **`triggerBackgroundTask()`:** Re-registers the task (used to force re-evaluation of scheduling).
- **Key constant:** `BACKGROUND_TASK_NAME = "backup-images"`

**How it works:** When the OS triggers the task, it loads pending tasks from storage, checks network, and uploads each one—just like the foreground flow.

### `services/imageService.ts`

Handles image selection and local storage:

- **`pickImages()`:** Opens the system photo picker (supports multiple selection).
- **Copies images** from device library to app's document storage.
- **Returns:** Array of new Task objects with `status: "pending"`.

**Output:** Array of tasks ready to be added to the task list.

### `services/storageService.ts`

Manages AsyncStorage persistence:

- **`loadTasks()`:** Retrieves all tasks from `backup_tasks` key.
- **`saveTasks(tasks)`:** Persists task array to storage.
- **`clearAllTasks()`:** Deletes all tasks (called by "Clear" button).

**Key:** All uploads, status updates, and deletions go through this service.

### `services/uploadService.ts`

Handles the actual upload to remote server:

```typescript
const WEBHOOK_URL = "https://webhook.site/8c411855-103d-4ffd-9c76-373192e644c9";

export const uploadImageToServer = async (task: Task): Promise<boolean>
```

- **Input:** A single Task object.
- **Output:** `true` if successful (HTTP 200+), `false` otherwise.
- **Format:** Multipart form data with field name `file` and content-type `image/jpeg`.

**To change endpoint:** Update `WEBHOOK_URL` and redeploy.

---

## Component File Descriptions

### `components/tasks/TaskListItem.tsx`

Renders a single task in the list:

- Displays image thumbnail (50×50 px).
- Shows file name.
- Renders status icon (pending/processing/completed/failed).

### `components/tasks/StatusIcon.tsx`

Renders the status indicator icon based on task status:

- **Pending:** Waiting icon
- **Processing:** Spinner/loading icon
- **Completed:** Checkmark icon
- **Failed:** Error/X icon

### `components/tasks/ActionButton.tsx`

Reusable button component used for:

- "Add Photos" button
- "Backup" (manual upload) button
- "Clear" button

### `components/tasks/StatBox.tsx`

Displays statistics cards:

- Total tasks count
- Pending tasks count
- Completed tasks count

### `components/tasks/types.ts`

TypeScript definitions:

```typescript
type TaskStatus = "pending" | "processing" | "completed" | "failed";

interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  retries: number;
  uri: string;
}
```

---

## Troubleshooting

### Issue: "Offline" alert immediately after picking images

**Cause:** The app is checking live network state with `Network.getNetworkStateAsync()`.

**Solution:**

- Verify device/emulator is actually connected to internet.
- Check permission grants (Settings → Apps → TaskSequence → Permissions).
- Try toggling WiFi off and on.

### Issue: UI doesn't update immediately after upload

**Cause:** React state can be stale if `processTasks()` is not awaited properly.

**Solution:**

- The app loads tasks from storage before processing—ensure `storageService.loadTasks()` returns fresh data.
- Reopen the app to force reload from storage.
- Add logs to `processTasks()` and `uploadService.ts` to track the sequence.

### Issue: Background uploads not running

**Cause:** Expo background tasks depend on OS scheduling, battery state, and network.

**Solution:**

- Ensure device is not in aggressive low-battery mode.
- Keep app fresh in the background (don't force-close).
- In emulator, the background task should run regularly; on real devices it depends on OS policy.

### Issue: Upload fails with repeated retries

**Possible Causes:**

1. **Network issue:** Device intermittently goes offline.
2. **Server error:** Remote endpoint is returning non-OK response.
3. **API limit reached:** If using the free webhook.site, daily/hourly limits may apply.

**Solution:**

- Check the remote server logs to see if requests are reaching the endpoint.
- Switch to a different API endpoint in `services/uploadService.ts`.
- Monitor the `retries` counter to see how many attempts were made.

---

## Developer Tips

### Enable Logging

Add `console.log` statements in:

- `app/(tabs)/index.tsx` — `processTasks()`, lifecycle events
- `services/uploadService.ts` — before/after upload, response status
- `services/storageService.ts` — before/after save operations

**Example:**

```typescript
console.log("Starting upload for task:", task.id);
const success = await uploadImageToServer(task);
console.log("Upload result:", { taskId: task.id, success });
```

### Force a Background Task Run

Tap the app's action that calls `triggerBackgroundTask()` to re-register the task and nudge the OS scheduler.

### Inspect Storage Contents

Use React Native debugger or Expo DevTools to inspect AsyncStorage:

- Key: `backup_tasks`
- Value: JSON array of tasks

### Test Offline Mode

In the emulator:

- Android Studio emulator: Simulate network via "Extended controls" → Network.
- iOS simulator: Unplug all network in System Settings.

Test the flow: pick images (offline) → upload button disabled → enable network → upload starts.

---

## Recommended Test Scenarios

### Scenario 1: Online + Foreground

1. App is open and online.
2. Tap **"Add Photos"** → select 2-3 images.
3. Verify:
   - Images appear in the list with `pending` status.
   - After 1-2 seconds, status changes to `processing`.
   - After upload, status shows `completed`.
   - Dashboard shows updated "Backed up" count.

**Expected behavior:** Uploads happen immediately with visual feedback.

### Scenario 2: Offline → Online (Foreground)

1. Emulator/device is offline.
2. Tap **"Add Photos"** → select images.
3. Verify: Images show as `pending` (upload button disabled).
4. Enable network while app is open.
5. Verify: Uploads start automatically without tapping "Backup".

**Expected behavior:** App detects network and processes immediately.

### Scenario 3: Background Upload

1. Pick images while online.
2. Allow them to upload or leave them `pending`.
3. Press Home to background the app.
4. Wait ~16 minutes (or manually call `triggerBackgroundTask()`).
5. Reopen the app.
6. Verify: Any pending tasks from step 2 now show as `completed` or `failed`.

**Expected behavior:** Background worker processed tasks while app was closed.

### Scenario 4: Manual Backup

1. Pick several images while online.
2. Tap the **"Backup"** button.
3. Verify: Uploads start and status updates in real-time.

**Expected behavior:** Manual trigger works alongside automatic processing.

---

## FAQ

**Q: Why are my uploads failing?**

A: Check:

1. Device is connected to internet (not just WiFi enabled).
2. The remote server endpoint is reachable.
3. If using free webhook.site, you may have hit rate limits. Use a different endpoint in `services/uploadService.ts`.

**Q: Can I change the upload endpoint?**

A: Yes. Edit `services/uploadService.ts` and update `WEBHOOK_URL` to your server, then rebuild.

**Q: Will my tasks sync to the cloud?**

A: No. Tasks are stored locally in AsyncStorage. After upload to your server, images are persisted on your backend. If you want cloud backup, implement it on your server side.

**Q: How often does the background task run?**

A: Approximately every 16 minutes (Expo background task minimum interval). The OS may delay based on battery state and other policies.

**Q: Can I use this app on iOS?**

A: Not currently. iOS build requires macOS. Use a macOS machine or CI/CD with macOS runners to build for iOS.

**Q: How do I debug what's happening?**

A: Add `console.log` statements in `processTasks()`, `uploadService.ts`, and `storageService.ts`. Use React Native Debugger or Expo DevTools to inspect the flow.

---

## Summary

1. **Pick images** → Tasks created as `pending`.
2. **Automatic upload** → Happens immediately if app is active and online.
3. **Background upload** → Runs periodically if app is backgrounded.
4. **Status tracking** → UI shows progress in real-time.
5. **Persistence** → All data stored in AsyncStorage; survives app restart.

The system is designed to be reliable, responsive, and user-friendly. Pick images, and they upload—either right away or when the time is right.

---

**Questions or issues?** Check the Troubleshooting section or review the service files in `services/` for implementation details.
