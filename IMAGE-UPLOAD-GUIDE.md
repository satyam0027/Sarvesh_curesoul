# IMAGE UPLOAD GUIDE

Upload these images to: `d:\SARVESH MISHRA\images\`

---

## PRIORITY 1: REQUIRED IMAGES (Upload These First)

### 1. Main Portrait (Most Important)
**Filename:** `sarvesh-mishra.jpg`  
**Size:** 800x1000px (portrait orientation)  
**Alt Text:** "Sarvesh Mishra - Life Decoder"  
**Used On:** Home (hero), About (hero), Life Decoder, Contact  
**Style:** Professional portrait, calm expression, neutral background (white/beige/grey)  
**Purpose:** Primary branding image across the site

### 2. CureSoulLife Initiative
**Filename:** `work-curesoullife.jpg`  
**Size:** 600x400px (landscape)  
**Alt Text:** "CureSoulLife - conscious living"  
**Used On:** Home (initiatives), Work page  
**Style:** Retreat/calm/nature vibe, natural lighting  
**Purpose:** Visual representation of the CureSoulLife platform

### 3. Dialogues Initiative
**Filename:** `work-dialogues.jpg`  
**Size:** 600x400px (landscape)  
**Alt Text:** "Sarvesh Mishra dialogue session"  
**Used On:** Home (initiatives)  
**Style:** Group discussion/circle, dialogue session context  
**Purpose:** Shows the dialogue/retreat work

### 4. Media Initiative
**Filename:** `work-media.jpg`  
**Size:** 600x400px (landscape)  
**Alt Text:** "Sarvesh Mishra Show podcast setup"  
**Used On:** Home (initiatives)  
**Style:** Podcast/recording setup with mic  
**Purpose:** Represents media and podcast work

---

## PRIORITY 2: SECONDARY IMAGES

### 5. Philosophy Abstract
**Filename:** `philosophy-abstract.jpg`  
**Size:** 1200x600px (wide landscape)  
**Alt Text:** "Inner Alchemy - symbolic representation"  
**Used On:** Philosophy page  
**Style:** Minimal, calm abstract/texture (NOT religious, NOT cliché)  
**Options:** Light/shadow play, minimal art, paper texture, calm geometric  
**Purpose:** Visual break, contemplative mood

### 6. Speaking Stage
**Filename:** `speaking-stage-1.jpg`  
**Size:** 800x500px (landscape)  
**Alt Text:** "Sarvesh Mishra speaking at dialogue session"  
**Used On:** Speaking page  
**Style:** On stage with real audience, professional speaking context  
**Purpose:** Authority and credibility for speaking engagements

---

## IMAGE REQUIREMENTS

### Technical Specs:
- **Format:** JPG (primary) or WebP (optimized)
- **File Size:** Under 200KB each (compress before upload)
- **Quality:** High resolution but optimized for web
- **Color Profile:** sRGB
- **Compression:** Use TinyPNG, Squoosh, or similar

### Style Guidelines:
✓ Natural lighting (no harsh flash or over-editing)  
✓ Neutral tones (white, beige, grey backgrounds)  
✓ Calm expression, thinking/depth vibe  
✓ Real moments, not posed corporate shots  
✗ NO stock photos  
✗ NO meditation poses or spiritual clichés  
✗ NO over-edited or heavily filtered  
✗ NO random smiling or fake corporate energy  

---

## CURRENT STATUS

All image placeholders are marked with:
```html
<!-- TODO: Replace with real photo before launch -->
```

**To Find All Image TODOs:**
Search codebase for: "TODO: Replace with real photo"

---

## UPLOAD CHECKLIST

Once you have the images:

1. [ ] Compress all images to under 200KB
2. [ ] Rename files exactly as specified above
3. [ ] Upload to `d:\SARVESH MISHRA\public\images\`
4. [ ] Verify images display correctly on each page
5. [ ] Check page load speed (should stay under 3 seconds)
6. [ ] Remove TODO comments from HTML files

---

## OPTIONAL IMAGES (Skip if uncertain)

These are marked as optional in the code:

**Writings Page Banner:**
- Filename: Could use `sarvesh-mishra.jpg` or skip entirely
- Note: "Skip if it hurts load speed. Text focus priority."

**Contact Page Portrait:**
- Filename: Could use `sarvesh-mishra.jpg` or skip entirely
- Note: "If unsure, leave no image — clean is better than wrong image here."

---

## AFTER UPLOAD

Update Schema Markup in `about.html` line 17:
```html
"image": "https://thesarveshmishra.com/images/sarvesh-mishra.jpg",
```

This URL appears in Google Knowledge Panel and search results.

---

## IMAGE ALT TEXT REFERENCE

Use these exact alt texts (already in the code):

| Image | Alt Text |
|-------|----------|
| Hero portrait | "Sarvesh Mishra - Life Decoder" |
| CureSoulLife | "CureSoulLife - conscious living" |
| Dialogues | "Sarvesh Mishra dialogue session" |
| Media | "Sarvesh Mishra Show podcast setup" |
| Philosophy abstract | "Inner Alchemy - symbolic representation" |
| Speaking | "Sarvesh Mishra speaking at dialogue session" |
| Writings (optional) | "Sarvesh Mishra - conscious living researcher" |

---

## TROUBLESHOOTING

**If images don't display:**
1. Check file path: `/images/filename.jpg`
2. Verify filename matches exactly (case-sensitive)
3. Clear browser cache
4. Check file permissions

**If page loads slowly:**
1. Compress images further (aim for 100-150KB)
2. Convert to WebP format
3. Use image optimization tools

**If images look wrong:**
1. Verify dimensions match specs
2. Check aspect ratio is correct
3. Ensure natural lighting and neutral tones
