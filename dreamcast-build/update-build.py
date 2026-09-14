from __future__ import annotations

import re
import sys
from pathlib import Path


TEXT_EXTENSIONS = {
    ".css",
    ".html",
    ".js",
    ".json",
    ".md",
    ".ps1",
    ".py",
    ".webmanifest",
    ".yml",
    ".yaml",
}


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit("usage: update-build.py ROOT OLD_BUILD NEW_BUILD")
    root = Path(sys.argv[1]).resolve()
    old, new = sys.argv[2], sys.argv[3]

    changed = 0
    for path in root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        if ".git" in path.parts or path.name in {"patch-generated-core.py", "update-build.py"}:
            continue
        if path.parts[-2:] == ("dreamcast-core", "build.json"):
            continue
        text = path.read_text(encoding="utf-8")
        updated = re.sub(rf"(?<!\d){re.escape(old)}(?!\d)", new, text)
        if updated != text:
            path.write_text(updated, encoding="utf-8", newline="")
            changed += 1
    print(f"updated build {old} -> {new} in {changed} files")


if __name__ == "__main__":
    main()
