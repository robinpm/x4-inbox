#!/usr/bin/env python3
"""Rebuild opds.xml from Books/, Papers/, and Articles/."""

from __future__ import annotations

import datetime as dt
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
OWNER = "robinpm"
REPO = "x4-inbox"
BRANCH = "main"
FOLDERS = ("Books", "Papers", "Articles")
EXTS = {".epub", ".pdf", ".txt", ".html", ".xhtml"}
MIME = {
    ".epub": "application/epub+zip",
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".html": "text/html",
    ".xhtml": "application/xhtml+xml",
}
RAW = f"https://raw.githubusercontent.com/{OWNER}/{REPO}/{BRANCH}"


def entries() -> list[tuple[Path, Path]]:
    found: list[tuple[Path, Path]] = []
    for folder in FOLDERS:
        base = ROOT / folder
        if not base.exists():
            continue
        for path in sorted(base.rglob("*")):
            if path.is_file() and path.suffix.lower() in EXTS and path.name != ".gitkeep":
                found.append((folder, path))
    return found


def atom() -> str:
    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        "<feed xmlns=\"http://www.w3.org/2005/Atom\"",
        '      xmlns:opds=\"http://opds-spec.org/2010/catalog\">',
        f"  <id>https://github.com/{OWNER}/{REPO}</id>",
        "  <title>x4-inbox</title>",
        f"  <updated>{now}</updated>",
        "  <author>",
        f"    <name>{OWNER}</name>",
        "  </author>",
        f'  <link rel=\"self\" type=\"application/atom+xml;profile=opds-catalog;kind=acquisition\" href=\"{RAW}/opds.xml\"/>',
        f'  <link rel=\"start\" type=\"application/atom+xml;profile=opds-catalog;kind=acquisition\" href=\"{RAW}/opds.xml\"/>',
    ]
    for folder, path in entries():
        rel = path.relative_to(ROOT).as_posix()
        title = path.stem.replace("_", " ").replace("-", " ")
        href = f"{RAW}/{rel}"
        mime = MIME[path.suffix.lower()]
        updated = dt.datetime.fromtimestamp(path.stat().st_mtime, tz=dt.timezone.utc).strftime(
            "%Y-%m-%dT%H:%M:%SZ"
        )
        parts += [
            "  <entry>",
            f"    <title>{escape(title)}</title>",
            f"    <id>https://github.com/{OWNER}/{REPO}/blob/{BRANCH}/{rel}</id>",
            f"    <updated>{updated}</updated>",
            f"    <content type=\"text\">{escape(folder)}</content>",
            f'    <link rel=\"http://opds-spec.org/acquisition\" href=\"{escape(href)}\" type=\"{mime}\"/>',
            "  </entry>",
        ]
    parts.append("</feed>")
    parts.append("")
    return "\n".join(parts)


def main() -> None:
    (ROOT / "opds.xml").write_text(atom(), encoding="utf-8")
    n = len(entries())
    print(f"wrote opds.xml ({n} item(s))")


if __name__ == "__main__":
    main()
