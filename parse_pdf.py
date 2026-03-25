import sys
from pypdf import PdfReader

def extract_text(pdf_path, out_path):
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(text)
        print("Success")
    except Exception as e:
        print("Error:", e)

extract_text("report formats only.pdf", "new_reports.txt")
