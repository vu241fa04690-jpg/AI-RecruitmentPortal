import io
import os
import re
from typing import Any, Dict, List, Optional
from services.ai_service import COMMON_TECH_SKILLS, extract_skills_from_text


def extract_text_from_pdf_bytes(content: bytes) -> str:
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text() + "\n"
        return text
    except Exception as e:
        print(f"Error reading PDF bytes with PyMuPDF: {e}")
        return ""


def extract_text_from_docx_bytes(content: bytes) -> str:
    try:
        import docx
        doc = docx.Document(io.BytesIO(content))
        lines = [p.text for p in doc.paragraphs if p.text]
        for table in doc.tables:
            for row in table.rows:
                cell_texts = [c.text.strip() for c in row.cells if c.text.strip()]
                if cell_texts:
                    lines.append(" ".join(cell_texts))
        return "\n".join(lines)
    except Exception as e:
        print(f"Error reading DOCX bytes: {e}")
        return ""


def extract_candidate_name_from_text(text: str, filename: str = "") -> str:
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    for line in lines[:5]:
        if len(line.split()) in [2, 3, 4] and not any(kw in line.lower() for kw in ["resume", "curriculum", "vitae", "email", "phone", "http", "@"]):
            return line
    if filename:
        clean_fn = re.sub(r"\.[^/.]+$", "", filename)
        clean_fn = re.sub(r"[_\-]", " ", clean_fn)
        clean_fn = re.sub(r"(?i)(resume|cv|coverpage|profile)", "", clean_fn).strip()
        if clean_fn:
            return clean_fn.title()
    return "Candidate"


def parse_resume_bytes(content: bytes, filename: str) -> Dict[str, Any]:
    ext = os.path.splitext(filename)[1].lower()
    text = ""
    if ext == ".pdf":
        text = extract_text_from_pdf_bytes(content)
    elif ext in [".docx", ".doc"]:
        text = extract_text_from_docx_bytes(content)
    elif ext == ".txt":
        try:
            text = content.decode("utf-8", errors="ignore")
        except Exception:
            pass

    # If stream extraction produced empty text, fallback to filename inspection
    if not text.strip():
        text = f"Resume file: {filename}\nProfile uploaded for software development & engineering assessment."

    email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
    phone_match = re.search(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)
    skills = extract_skills_from_text(text)
    
    education_keywords = ["bachelor", "master", "phd", "b.tech", "b.s", "m.s", "bca", "mca", "computer science", "electronics"]
    degrees_found = [deg.title() for deg in education_keywords if re.search(r"\b" + deg + r"\b", text, re.IGNORECASE)]

    cert_keywords = ["aws", "azure", "gcp", "certified", "kubernetes", "ckad", "cka", "pmp", "cisco", "scrum"]
    certs_found = [c.upper() for c in cert_keywords if re.search(r"\b" + c + r"\b", text, re.IGNORECASE)]

    candidate_name = extract_candidate_name_from_text(text, filename)

    return {
        "candidate_name": candidate_name,
        "email": email_match.group(0) if email_match else None,
        "phone": phone_match.group(0) if phone_match else None,
        "skills": skills,
        "education": degrees_found,
        "certifications": certs_found,
        "text": text,
        "filename": filename,
        "char_count": len(text)
    }


def parse_resume_document(file_path: str) -> Dict[str, Any]:
    with open(file_path, "rb") as f:
        content = f.read()
    return parse_resume_bytes(content, os.path.basename(file_path))
