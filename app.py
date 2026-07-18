from flask import Flask, render_template, request, send_file
import os
import io
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
from docx import Document

import platform

if platform.system() == "Windows":
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    POPPLER_PATH = (
        r"C:\Users\MANU M M\AppData\Local\Microsoft\WinGet\Packages"
        r"\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe"
        r"\poppler-25.07.0\Library\bin"
    )
else:
    # Linux (Docker / Render)
    pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"
    POPPLER_PATH = "/usr/bin"

app = Flask(__name__, static_folder="static", template_folder="templates")
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def parse_page_selection(page_selection):
    page_selection = page_selection.strip()

    if not page_selection or page_selection.lower() == "all":
        return None

    pages = set()

    try:
        for part in page_selection.split(","):
            part = part.strip()

            if "-" in part:
                start, end = part.split("-", 1)
                start = int(start)
                end = int(end)

                if start > end:
                    raise ValueError

                pages.update(range(start, end + 1))
            else:
                pages.add(int(part))

        return sorted(pages)

    except ValueError:
        raise ValueError(
            "Invalid page selection. Examples: All, 3, 1-3, 2,5,8"
        )


@app.route("/")
def home():
    return render_template(
        "index.html",
        status="Ready",
        extracted_text="",
        selected_language="auto",
        other_language=""
    )


@app.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files or request.files["file"].filename == "":
        return render_template(
            "index.html",
            status="No file selected.",
            extracted_text=""
        )

    lang = request.form.get("language", "auto")
    other = request.form.get("other_language", "").strip()
    try:
        page_selection = parse_page_selection(
            request.form.get("pageSelection", "All")
        )
    except ValueError as e:
        return render_template(
            "index.html",
            status=str(e),
            extracted_text="",
            selected_language=lang,
            other_language=other
        )

    if lang == "other":
        ocr_lang = other or "eng"
    elif lang == "auto":
        ocr_lang = None
    else:
        ocr_lang = lang

    f = request.files["file"]
    path = os.path.join(UPLOAD_FOLDER, f.filename)
    f.save(path)

    ext = os.path.splitext(path)[1].lower()

    try:
        if ext == ".pdf":
            pages = convert_from_path(path, poppler_path=POPPLER_PATH)
            out = []                        
            if page_selection is not None:
                total_pages = len(pages)

                if max(page_selection) > total_pages or min(page_selection) < 1:
                    raise ValueError(
                        f"Invalid page selection. This PDF has {total_pages} pages."
                    )


            for i, p in enumerate(pages, 1):
                if page_selection is not None and i not in page_selection:
                    continue
                out.append(f"\nPage {i}\n\n")

                if ocr_lang:
                    out.append(
                        pytesseract.image_to_string(
                            p,
                            lang=ocr_lang
                        )
                    )
                else:
                    out.append(
                        pytesseract.image_to_string(p)
                    )

                out.append("\n")

            text = "".join(out)

        else:
            img = Image.open(path)

            if ocr_lang:
                text = pytesseract.image_to_string(
                    img,
                    lang=ocr_lang
                )
            else:
                text = pytesseract.image_to_string(img)

        if ext == ".pdf":
            status = f"OCR completed successfully. {len(pages)} page(s) processed."
        else:
            status = "OCR completed successfully. Image processed."
    except Exception as e:
        import traceback

        traceback.print_exc()

    


        status = f"OCR failed: {e}"
        text = f"{type(e).__name__}: {e}"

    return render_template(
        "index.html",
        status=status,
        extracted_text=text,
        selected_language=lang,
        other_language=other
    )


@app.route("/download-docx", methods=["POST"])
def download_docx():
    text = request.form.get("text", "")

    document = Document()
    document.add_heading("OCR Result", level=1)
    document.add_paragraph(text)

    memory_file = io.BytesIO()
    document.save(memory_file)
    memory_file.seek(0)

    return send_file(
        memory_file,
        as_attachment=True,
        download_name="ocr_result.docx",
        mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)