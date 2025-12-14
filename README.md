# TaskSequence — Photo Backup App

Pick photos → They upload automatically (if online). Works in background too.

## Setup

```bash
npm install
npx expo start
```

Pick your platform, hit it. Grant photo permission when asked.

## What It Does

1. **Pick photos** → Added as tasks
2. **App active + online** → Upload right now
3. **App backgrounded or offline** → Upload later when possible
4. **UI updates** → See the status (pending → processing → done)

## Folder Structure

```
services/
  ├── backgroundTaskService.ts  (runs when app is closed)
  ├── imageService.ts          (picks & saves photos)
  ├── storageService.ts        (saves data locally)
  └── uploadService.ts         (sends to server)

components/tasks/
  ├── TaskListItem.tsx         (shows photo + status)
  ├── StatusIcon.tsx           (pending/done/failed icons)
  ├── ActionButton.tsx         (buttons)
  ├── StatBox.tsx              (total/pending/backed up count)
  └── types.ts                 (task type definition)
```

## How It Works

### Foreground (App Open + Online)

- Pick photo → status: `pending`
- Upload starts → status: `processing`
- Done → status: `completed`
- All happens fast, you see it happen

### Offline (App Open)

- Pick photo → status: `pending`
- Can't upload (no internet)
- Internet back → uploads automatically

### Background (App Closed)

- Tasks saved in storage
- Background worker checks every ~16 min
- If online, uploads pending photos
- Results saved, you see them when you open the app

## Upload Endpoint

Photos go to: `https://webhook.site/8c411855-103d-4ffd-9c76-373192e644c9`

Want to use your own server? Edit `services/uploadService.ts`:

```typescript
const WEBHOOK_URL = "your-api-endpoint-here";
```

## Storage

Everything saved locally in AsyncStorage (key: `backup_tasks`). Photos stored in app document folder.

## Troubleshooting

**Upload failing?**

- Check internet connection
- If free API hits limit, change endpoint in `services/uploadService.ts`
- Check if server is up

**UI not updating?**

- Close and reopen app
- Check AsyncStorage has data (debug tools)

**Background not running?**

- OS schedules background tasks (depends on battery, settings)
- Try toggling the app in background

## Testing

1. **Online + app open** → pick photo → should upload instantly
2. **Offline + app open** → pick photo → goes pending, then enable internet → should upload auto
3. **App closed** → wait ~16 min with internet → open app → should see completed uploads

## Notes

- **Android only** (for now, need macOS to build iOS)
- **Debug/Release endpoints** → you'll add these in releases
- Uses Expo background tasks (runs even when app closed)
- **Free API limits** → if uploads fail after many retries, likely hit rate limit on webhook.site

## Release and Debug build

Release and Debug apk will be available on [https://github.com/Kushalchg/TaskQueue/releases/tag/v1.0.0](https://github.com/Kushalchg/TaskQueue/releases/tag/v1.0.0)

## Quick Commands

```bash
npm install        # Setup
npx expo start     # Run
npm run reset-project  # Fresh start
```

That's it. Pick photos, they backup.
