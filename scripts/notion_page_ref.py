"""Utilities for normalizing Notion page references.

The local `ntn pages get` command expects a page id, while project notes often
store copy-link URLs. Keep the URL parsing small and tested so callers can pass
either form.
"""

from __future__ import annotations

import re
from urllib.parse import parse_qs, unquote, urlparse


COMPACT_UUID_RE = re.compile(r"(?<![0-9a-fA-F])([0-9a-fA-F]{32})(?![0-9a-fA-F])")
DASHED_UUID_RE = re.compile(
    r"(?<![0-9a-fA-F])"
    r"([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-"
    r"[0-9a-fA-F]{4}-[0-9a-fA-F]{12})"
    r"(?![0-9a-fA-F])"
)
PAGE_QUERY_KEYS = ("p", "page_id", "pageId")


class NotionPageRefError(ValueError):
    """Raised when a page id cannot be extracted from a reference."""


def _compact_uuid(value: str) -> str | None:
    stripped = value.strip()
    if DASHED_UUID_RE.fullmatch(stripped):
        return stripped.replace("-", "").lower()
    if COMPACT_UUID_RE.fullmatch(stripped):
        return stripped.lower()
    return None


def _ids_in_text(value: str) -> list[str]:
    ids: list[str] = []
    for match in DASHED_UUID_RE.finditer(value):
        ids.append(match.group(1).replace("-", "").lower())
    for match in COMPACT_UUID_RE.finditer(value):
        candidate = match.group(1).lower()
        if candidate not in ids:
            ids.append(candidate)
    return ids


def extract_notion_page_id(reference: str) -> str:
    """Return a compact 32-character Notion page id from an id or URL.

    Query parameter `p` takes precedence because database URLs can contain a
    database id in the path and the actual page id in `p`. View ids such as `v`
    are intentionally ignored.
    """

    raw = reference.strip()
    if not raw:
        raise NotionPageRefError("empty Notion page reference")

    compact = _compact_uuid(raw)
    if compact:
        return compact

    parsed = urlparse(raw)
    if not parsed.scheme and not parsed.netloc:
        ids = _ids_in_text(unquote(raw))
        if ids:
            return ids[-1]
        raise NotionPageRefError(f"could not find a Notion page id in: {reference}")

    query = parse_qs(parsed.query)
    for key in PAGE_QUERY_KEYS:
        for value in query.get(key, []):
            compact = _compact_uuid(unquote(value))
            if compact:
                return compact
            ids = _ids_in_text(unquote(value))
            if ids:
                return ids[-1]

    path_ids = _ids_in_text(unquote(parsed.path))
    if path_ids:
        return path_ids[-1]

    raise NotionPageRefError(f"could not find a Notion page id in URL: {reference}")
