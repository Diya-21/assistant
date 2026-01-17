from fastapi import UploadFile
import pdfplumber


def extract_text_from_pdf(file: UploadFile) -> str:
    text = ""

    with pdfplumber.open(file.file) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

    if not text.strip():
        raise ValueError("No extractable text found in PDF")

    return text
