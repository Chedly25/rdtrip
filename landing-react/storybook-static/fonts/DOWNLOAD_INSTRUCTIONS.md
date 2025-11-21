# Inter Font Download Instructions

## Quick Download (Recommended)

**Option 1: Download from Official Source**
1. Visit: https://github.com/rsms/inter/releases/latest
2. Download: **Inter-4.0.zip** (or latest version)
3. Extract the zip file
4. Copy these files to `public/fonts/`:
   - `Inter-Regular.woff2` (from `web/` folder)
   - `Inter-Medium.woff2` (from `web/` folder)
   - `Inter-SemiBold.woff2` (from `web/` folder)
   - `Inter-Bold.woff2` (from `web/` folder)
   - **OR** use `Inter-VariableFont.woff2` for all weights in one file

**Option 2: Use Variable Font (Better Performance)**
1. Download from: https://github.com/rsms/inter/releases/latest
2. Get: **Inter.var.woff2** (Variable font - supports all weights)
3. Copy to `public/fonts/inter-var.woff2`

## Alternative: Download via npm

```bash
npm install @fontsource/inter
# Then copy from node_modules/@fontsource/inter/files/
```

## What You Need

**Minimum (for this project):**
- Inter Regular (400)
- Inter Medium (500)
- Inter SemiBold (600)
- Inter Bold (700)

**Or just:**
- Inter Variable Font (supports 400-700 in one file) ← **Recommended**

## File Checklist

After download, you should have in `public/fonts/`:

```
public/fonts/
├── inter-var.woff2           (Variable font - ALL weights)
OR
├── inter-regular.woff2       (Weight 400)
├── inter-medium.woff2        (Weight 500)
├── inter-semibold.woff2      (Weight 600)
└── inter-bold.woff2          (Weight 700)
```

## File Sizes (for verification)

- Variable font: ~500-600 KB
- Individual weights: ~100-150 KB each

## Next Step

Once files are downloaded, run:
```bash
ls -lh public/fonts/
```

Then I'll update the CSS configuration to use these fonts!
