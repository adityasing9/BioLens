"""
BioLens AI - Hybrid OCR Extraction Engine
Combines OpenCV preprocessing with Tesseract and EasyOCR for maximum accuracy.
"""
import cv2
import numpy as np
import pytesseract
import os
import time
import logging

logger = logging.getLogger("biolens_ocr")

# Lazy-loaded EasyOCR reader singleton
_easyocr_reader = None


def _get_easyocr_reader():
    """Initialize EasyOCR reader on first use to avoid slow startup."""
    global _easyocr_reader
    if _easyocr_reader is None:
        try:
            import easyocr
            _easyocr_reader = easyocr.Reader(["en"], gpu=False, verbose=False)
            logger.info("EasyOCR reader initialized successfully")
        except Exception as e:
            logger.warning(f"EasyOCR initialization failed: {e}. Falling back to Tesseract only.")
    return _easyocr_reader


def preprocess_image(image: np.ndarray) -> np.ndarray:
    """
    Apply OpenCV preprocessing pipeline to enhance OCR accuracy.
    Steps: Grayscale -> Denoise -> Adaptive Threshold -> Deskew
    """
    # Convert to grayscale if needed
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()

    # Gaussian blur to reduce noise
    denoised = cv2.GaussianBlur(gray, (5, 5), 0)

    # Adaptive thresholding for binarization
    binary = cv2.adaptiveThreshold(
        denoised, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11, 2
    )

    # Optional: deskew detection via contours
    try:
        coords = np.column_stack(np.where(binary > 0))
        if len(coords) > 100:
            angle = cv2.minAreaRect(coords)[-1]
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle
            if abs(angle) > 0.5 and abs(angle) < 15:
                h, w = binary.shape
                center = (w // 2, h // 2)
                M = cv2.getRotationMatrix2D(center, angle, 1.0)
                binary = cv2.warpAffine(binary, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    except Exception:
        pass  # Skip deskew if it fails

    return binary


def extract_text_from_image(image_path: str) -> str:
    """Extract text from a single image using hybrid Tesseract + EasyOCR."""
    start = time.time()
    image = cv2.imread(image_path)
    if image is None:
        logger.error(f"Failed to read image: {image_path}")
        return ""

    preprocessed = preprocess_image(image)

    # Primary: Tesseract OCR
    tesseract_text = ""
    try:
        tesseract_text = pytesseract.image_to_string(preprocessed, config="--oem 3 --psm 6")
        logger.info(f"Tesseract extracted {len(tesseract_text)} chars")
    except Exception as e:
        logger.warning(f"Tesseract failed: {e}")

    # Secondary: EasyOCR as fallback/supplement
    easyocr_text = ""
    reader = _get_easyocr_reader()
    if reader:
        try:
            results = reader.readtext(image, detail=0, paragraph=True)
            easyocr_text = "\n".join(results)
            logger.info(f"EasyOCR extracted {len(easyocr_text)} chars")
        except Exception as e:
            logger.warning(f"EasyOCR failed: {e}")

    # Combine: prefer Tesseract if substantial, supplement with EasyOCR
    if len(tesseract_text.strip()) > 50:
        combined = tesseract_text
        # Append any unique EasyOCR content
        if easyocr_text and len(easyocr_text.strip()) > len(tesseract_text.strip()) * 0.3:
            combined += "\n\n--- Additional OCR Pass ---\n" + easyocr_text
    elif easyocr_text:
        combined = easyocr_text
    else:
        combined = tesseract_text or ""

    elapsed = time.time() - start
    logger.info(f"Image OCR completed in {elapsed:.2f}s - {len(combined)} total chars")
    return combined.strip()


def extract_text_from_pdf(pdf_path: str) -> str:
    """Convert PDF pages to images and extract text from each page."""
    start = time.time()
    try:
        from pdf2image import convert_from_path
        images = convert_from_path(pdf_path, dpi=300)
    except Exception as e:
        logger.error(f"PDF to image conversion failed: {e}")
        # Fallback: try reading as text-based PDF
        try:
            import subprocess
            result = subprocess.run(
                ["pdftotext", pdf_path, "-"],
                capture_output=True, text=True, timeout=30
            )
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.strip()
        except Exception:
            pass
        return ""

    all_text = []
    for i, pil_image in enumerate(images):
        # Convert PIL to numpy array for OpenCV
        img_array = np.array(pil_image)
        if len(img_array.shape) == 3:
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

        # Save temp image for OCR functions
        temp_path = f"/tmp/biolens_page_{i}.png"
        cv2.imwrite(temp_path, img_array)

        page_text = extract_text_from_image(temp_path)
        if page_text:
            all_text.append(f"--- Page {i + 1} ---\n{page_text}")

        # Cleanup temp file
        try:
            os.remove(temp_path)
        except OSError:
            pass

    elapsed = time.time() - start
    combined = "\n\n".join(all_text)
    logger.info(f"PDF OCR completed in {elapsed:.2f}s - {len(images)} pages, {len(combined)} total chars")
    return combined


def extract_text(file_path: str) -> str:
    """
    Main entry point: detect file type and extract text accordingly.
    Supports PDF, PNG, JPEG, JPG.
    """
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return ""

    ext = os.path.splitext(file_path)[1].lower()
    logger.info(f"Starting OCR extraction for: {file_path} (type: {ext})")

    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in (".png", ".jpg", ".jpeg"):
        return extract_text_from_image(file_path)
    else:
        logger.warning(f"Unsupported file extension: {ext}")
        return ""
