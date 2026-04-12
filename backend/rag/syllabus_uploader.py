from fastapi import UploadFile
import pdfplumber
from typing import List, Dict


import re

def extract_text_from_pdf(file: UploadFile) -> List[Dict]:
    """
    Extracts text from PDF and preserves page numbers.
    Also detects Unit/Module headers for automated filtration.
    """
    pages_data = []
    current_unit = "General"

    with pdfplumber.open(file.file) as pdf:
        for i, page in enumerate(pdf.pages):
            page_text = page.extract_text()
            if page_text and page_text.strip():
                # --- AUTOMATED CUSTOMIZATION: Unit Detection ---
                # Detects patterns like "Unit I", "Module 1", "UNIT 2"
                unit_match = re.search(r'(Unit|Module)\s+([0-9IVX]+)', page_text, re.IGNORECASE)
                if unit_match:
                    current_unit = f"{unit_match.group(1)} {unit_match.group(2)}"
                # -----------------------------------------------

                pages_data.append({
                    "page_content": page_text,
                    "metadata": {
                        "page": i + 1,
                        "source": file.filename,
                        "unit": current_unit
                    }
                })

    if not pages_data:
        raise ValueError("No extractable text found in PDF")

    return pages_data
