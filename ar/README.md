# Locals Go WebAR Treasure Hunt Portal

**Location-based AR experiences tied to Locals Go's treasure hunt and check-in system.**

---

## Overview

This `/ar/` directory contains a standalone WebAR app built with **Three.js + AR.js**. When a player scans a QR code or Gold Locals Go card at a physical checkpoint, an interactive AR scene comes alive featuring:

- **Branded avatar** or treasure portal animation
- **Points/reward reveal** overlay
- **Automatic check-in logging** to Supabase backend
- **Defensive fallback UI** when AR tracking fails or assets are missing

---

## Key Features

### 1. **Defensive Fallback States**

If AR is unavailable or tracking fails, the app gracefully falls back to a **full-featured checkpoint card** that includes:

- **Fallback Asset State**: When a business hasn't uploaded their AR asset/product photo yet:
  - Replaces the live product photo circle with the **Locals Go pin icon** on a soft glow background
  - Shows text reading **"Photo coming soon"**
  - Background defaults to a branded gradient (instead of camera feed)
  - **Business name, "PORTAL CHECKPOINT ACTIVE" label, points badge, and "Add to Order" functionality remain fully functional**
  - Only the image is a placeholder; the checkpoint is not broken

- **Full Fallback Mode**: When AR is unsupported or camera denied:
  - Displays the same checkpoint card as the AR overlay, but on a branded gradient background
  - All interactive elements work: Add to Order, business info, points display
  - Player can still complete the transaction even without AR

### 2. **AR Tracking & Marker Detection**

The app uses AR.js to detect QR codes and barcodes. When a marker is detected:

1. The checkpoint overlay slides up
2. The AR scene renders the checkpoint's asset (2D texture or 3D model)
3. A check-in event is logged to Supabase
4. Points are awarded and displayed on the card

### 3. **Supabase Integration**

On marker detection, the app automatically logs a check-in event:

```sql
-- lg_checkin_events
INSERT INTO lg_checkin_events (
  player_id,
  checkpoint_id,
  business_id,
  timestamp,
  ar_triggered
) VALUES (...);
```

Player points are updated in `lg_players` (via backend trigger or manual update in Supabase).

### 4. **Mobile-First Responsive Design**

- Full-screen canvas on mobile
- Checkpoint card positioned as an overlay on AR view
- Touch-friendly buttons and controls
- Fallback UI centers on smaller screens

---

## URL Parameters

QR codes and Gold Cards should deep-link to `/ar/` with these query parameters:

```
?checkpoint_id=<UUID>&business_id=<UUID>&player_id=<UUID>
```

**Example:**
```
https://go.blindrumors.cloud/ar/?checkpoint_id=abc123&business_id=def456&player_id=xyz789
```

---

## File Structure

```
ar/
├── index.html          # Main HTML scaffold
├── styles.css          # Responsive styles (fallback card + overlays)
├── ar-app.js           # Three.js + AR.js app logic
└── README.md           # This file
```

---

## AR Asset Setup

### Without Custom Assets (Development)

Use the fallback state to test the checkout flow:
1. Ensure `checkpoint.asset_url` is `null` in your Supabase table
2. The pin icon and "Photo coming soon" state will display
3. All business info and checkout buttons remain functional

### With 2D Brand Assets (Recommended Starting Point)

1. Upload your 2D brand art (PNG/JPG) to a CDN (e.g., Supabase Storage)
2. Store the URL in `lg_checkpoints.asset_url`
3. The AR app will render the texture on a plane at the marker position

**Steps:**

```javascript
// In Supabase:
UPDATE lg_checkpoints
SET asset_url = 'https://storage.supabase.co/..../business-logo.png'
WHERE id = 'checkpoint-1';
```

### With 3D Models (Advanced)

For full 3D AR experiences:
1. Export your model as `.gltf` or `.glb` (Three.js native format)
2. Host on CDN
3. Modify `ar-app.js` to load with `THREE.GLTFLoader` instead of texture loader:

```javascript
const gltfLoader = new THREE.GLTFLoader();
gltfLoader.load(modelUrl, (gltf) => {
  this.markerGroup.add(gltf.scene);
});
```

---

## Error Handling

The app handles these failure modes:

1. **WebAR not supported** → Fallback UI
2. **Camera permission denied** → Fallback UI with error message
3. **AR tracking fails** → Closes overlay, shows status
4. **Asset texture fails to load** → Shows pin icon + "Photo coming soon"
5. **Supabase connection fails** → Uses mock data, continues to fallback

---

## Deployment

1. Push this folder to `main` branch
2. GitHub Pages will serve at `https://go.blindrumors.cloud/ar/`
3. QR codes and Gold Cards can link directly with checkpoint parameters

---

## Browser & Device Support

- ✅ **Mobile Chrome/Edge** (Android with ARCore)
- ✅ **Mobile Safari** (iOS 14+ with ARKit, via AR.js)
- ⚠️ **Desktop** (limited AR, falls back to checkpoint card)
- ⚠️ **AR.js tracking** is looser than paid solutions (8th Wall, WebAR) — QR codes should be high-contrast and ~20cm minimum

---

## Next Steps

1. **Test fallback card** with mock data (QR code with no checkpoint_id parameter)
2. **Create Supabase lg_checkpoints table** with columns: `id`, `business_id`, `business_name`, `product_name`, `product_price`, `asset_url`, `points`
3. **Upload 2D brand assets** to Supabase Storage
4. **Generate QR codes** linking to `/ar/?checkpoint_id=...&business_id=...&player_id=...`
5. **Print Gold Cards** with QR code; test scanning at physical locations
6. **Monitor lg_checkin_events** for player interactions and reward claims

---

## Questions?

Refer to:
- [AR.js Documentation](https://ar-js-org.github.io/AR.js-Docs/)
- [Three.js Documentation](https://threejs.org/docs/)
- Supabase PostgreSQL docs for real-time updates
