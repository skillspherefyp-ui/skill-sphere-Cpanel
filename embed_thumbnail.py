"""
embed_thumbnail.py
------------------
Embeds a custom thumbnail image into an existing PPTX file so Windows
Explorer shows your actual slide instead of a blank page.

HOW TO USE:
1. Export Slide 1 as a PNG from PowerPoint:
   File → Export → Change File Type → PNG → Save As
   (PowerPoint saves each slide; grab Slide1.PNG)

2. Set the two paths below and run:
   python embed_thumbnail.py
"""

import os
import zipfile
from PIL import Image
import io

# ── CONFIGURE THESE TWO PATHS ─────────────────────────────────────────────────
PPTX_PATH  = r"D:\skillsphere design Project part 2\SkillSphere_Presentation_Updated.pptx"
THUMB_PNG  = r"C:\Users\Talha\OneDrive\Desktop\Slide1.PNG"   # change to wherever you saved it
# ─────────────────────────────────────────────────────────────────────────────

def embed_thumbnail(pptx_path, thumb_png_path):
    # Convert PNG → JPEG bytes (thumbnail must be JPEG for Office)
    img = Image.open(thumb_png_path).convert("RGB")
    img.thumbnail((1280, 720), Image.LANCZOS)  # keep aspect ratio, decent resolution
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=92)
    thumb_jpeg = buf.getvalue()

    # XML snippets needed for Office to recognise the thumbnail
    thumb_ct  = '<Override PartName="/docProps/thumbnail.jpeg" ContentType="image/jpeg"/>'
    thumb_rel = '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail" Target="docProps/thumbnail.jpeg"/>'
    ct_name   = '[Content_Types].xml'
    rels_name = '_rels/.rels'

    # Read every entry from the original PPTX into memory
    with zipfile.ZipFile(pptx_path, 'r') as zin:
        entries = {item.filename: zin.read(item.filename) for item in zin.infolist()}

    # Patch Content_Types.xml
    ct_xml = entries[ct_name].decode('utf-8')
    if 'thumbnail.jpeg' not in ct_xml:
        ct_xml = ct_xml.replace('</Types>', thumb_ct + '</Types>')
    entries[ct_name] = ct_xml.encode('utf-8')

    # Patch _rels/.rels
    rels_xml = entries[rels_name].decode('utf-8')
    if 'thumbnail' not in rels_xml:
        rels_xml = rels_xml.replace('</Relationships>', thumb_rel + '</Relationships>')
    entries[rels_name] = rels_xml.encode('utf-8')

    # Inject the thumbnail image
    entries['docProps/thumbnail.jpeg'] = thumb_jpeg

    # Write patched PPTX to a temp file then replace original
    tmp = pptx_path + ".tmp"
    with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zout:
        for name, data in entries.items():
            zout.writestr(name, data)
    os.replace(tmp, pptx_path)

    print(f"Done! Thumbnail embedded into:\n  {pptx_path}")
    print("Refresh Windows Explorer (F5) to see it.")

if __name__ == "__main__":
    embed_thumbnail(PPTX_PATH, THUMB_PNG)
