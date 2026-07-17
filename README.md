# Accessible OCR Web App v1.0

An accessible Optical Character Recognition (OCR) web application built with **Python**, **Flask**, and **Tesseract OCR**.

This application enables users to extract text from scanned PDF documents and image files through a simple, keyboard-friendly web interface. It was designed with accessibility as a primary goal and works well with screen readers such as **NVDA**.

---

## Why This Project?

Many OCR tools are difficult to use with screen readers or require complicated software installation.

This project aims to provide a simple, accessible, and user-friendly OCR solution that allows users to upload scanned documents or images, extract text, and download the results in multiple formats.

---

## Features

- Extract text from scanned PDF files
- Extract text from image files
- Select specific PDF pages before OCR
- Supports:
  - All pages
  - Single page (Example: `3`)
  - Page ranges (Example: `2-5`)
  - Multiple pages (Example: `2,5,8`)
- Multiple OCR language support using Tesseract
- Copy extracted text with one click
- Download extracted text as TXT
- Download extracted text as Microsoft Word (DOCX)
- Keyboard-friendly interface
- Screen reader accessible

---

## Technologies Used

- Python 3
- Flask
- Tesseract OCR
- pdf2image
- Pillow (PIL)
- python-docx
- HTML5
- CSS3
- JavaScript

---

## Requirements

Before running the application locally, install:

- Python 3.13 or later
- Tesseract OCR
- Poppler (required for PDF processing)

Install the required Python packages:

```bash
pip install -r requirements.txt
```

---

## Running the Application

Start the Flask server:

```bash
python app.py
```

Then open:

```text
http://127.0.0.1:5000
```

---

## Supported File Types

### Images

- PNG
- JPG
- JPEG
- BMP
- TIFF

### Documents

- PDF

---

## Supported OCR Languages

Version 1.0 has been tested with:

- English
- Malayalam
- Hindi
- Tamil
- Telugu
- Kannada

Additional Tesseract language packs can be installed if required.

---

## Accessibility Features

- Keyboard-only navigation
- Screen reader friendly
- Clear status messages
- Simple interface
- Accessible forms and controls

---

## Project Status

**Current Version:** v1.0.0

Status:

- Stable
- Fully tested
- Ready for public use

---

## Roadmap

Planned features for future versions include:

- Automatic language detection
- Gemini AI OCR integration
- Better formatting preservation
- Searchable PDF export
- Batch OCR processing
- Progress indicator
- Improved HTML page navigation
- Additional export formats

---

## License

This project is licensed under the MIT License.

---

## Author

**Manu M M**

Kerala, India

---

## Acknowledgements

This project uses the following open-source software:

- Flask
- Tesseract OCR
- Poppler
- Pillow
- pdf2image
- python-docx

Special thanks to the developers and maintainers of these excellent open-source projects.