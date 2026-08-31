from dataclasses import dataclass

from bs4 import BeautifulSoup, Tag

from app.services.ingestion.sensitive import redact_public_text


@dataclass(frozen=True)
class ParsedHTML:
    title: str
    author: str
    publication_date: str
    canonical_url: str
    text: str
    public_safe_text: str


def parse_html(content: bytes) -> ParsedHTML:
    soup = BeautifulSoup(content, "html.parser")
    for node in soup(["script", "style", "nav", "header", "footer", "aside", "form"]):
        node.decompose()
    title = soup.title.get_text(" ", strip=True) if soup.title else ""
    author_result = soup.find("meta", attrs={"name": "author"})
    date_result = soup.find("meta", attrs={"property": "article:published_time"})
    canonical_result = soup.find("link", attrs={"rel": "canonical"})
    author_node = author_result if isinstance(author_result, Tag) else None
    date_node = date_result if isinstance(date_result, Tag) else None
    canonical = canonical_result if isinstance(canonical_result, Tag) else None
    main = soup.find("main") or soup.find("article") or soup.body or soup
    text = "\n".join(line.strip() for line in main.get_text("\n").splitlines() if line.strip())
    return ParsedHTML(
        title=title,
        author=str(author_node.get("content", "")) if author_node else "",
        publication_date=str(date_node.get("content", "")) if date_node else "",
        canonical_url=str(canonical.get("href", "")) if canonical else "",
        text=text,
        public_safe_text=redact_public_text(text),
    )
