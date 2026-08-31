from dataclasses import dataclass, field

import fitz

from app.services.ingestion.sensitive import detect_sensitive_content, redact_public_text


@dataclass(frozen=True)
class ParsedBlock:
    page_number: int
    text: str
    public_safe_text: str
    bbox: dict[str, float]
    contains_sensitive_content: bool
    ocr_required: bool = False


@dataclass(frozen=True)
class ExtractedImage:
    page_number: int
    extension: str
    content: bytes
    width: int
    height: int


@dataclass
class ParsedPDF:
    blocks: list[ParsedBlock] = field(default_factory=list)
    images: list[ExtractedImage] = field(default_factory=list)
    ocr_pages: list[int] = field(default_factory=list)


def parse_pdf(content: bytes) -> ParsedPDF:
    result = ParsedPDF()
    with fitz.open(stream=content, filetype="pdf") as document:
        for page_index, page in enumerate(document):
            page_number = page_index + 1
            blocks = page.get_text("blocks")
            page_has_text = False
            for raw in blocks:
                text = str(raw[4]).strip()
                if not text:
                    continue
                page_has_text = True
                sensitive = bool(detect_sensitive_content(text))
                result.blocks.append(
                    ParsedBlock(
                        page_number=page_number,
                        text=text,
                        public_safe_text=redact_public_text(text),
                        bbox={"x0": raw[0], "y0": raw[1], "x1": raw[2], "y1": raw[3]},
                        contains_sensitive_content=sensitive,
                    )
                )
            if not page_has_text:
                result.ocr_pages.append(page_number)
            for info in page.get_images(full=True):
                extracted = document.extract_image(info[0])
                result.images.append(
                    ExtractedImage(
                        page_number=page_number,
                        extension=str(extracted["ext"]),
                        content=bytes(extracted["image"]),
                        width=int(extracted["width"]),
                        height=int(extracted["height"]),
                    )
                )
    return result
