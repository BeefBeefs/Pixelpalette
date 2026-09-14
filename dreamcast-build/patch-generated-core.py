from __future__ import annotations

import re
import sys
from pathlib import Path


def replace_once(text: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1)
    if count != 1:
        raise SystemExit(f"generated core patch did not find {label}")
    return updated


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: patch-generated-core.py PATH_TO_CORE_JS")

    path = Path(sys.argv[1])
    text = path.read_text(encoding="utf-8")

    text = replace_once(
        text,
        r"var _glGetError=\(\)=>\{var error=GLctx\.getError\(\)\|\|GL\.lastError;GL\.lastError=0;return error\};",
        "var _glGetError=()=>{var error=GLctx.getError()||GL.lastError;GL.lastError=0;return error===1280?0:error};",
        "GL_INVALID_ENUM suppression",
    )

    helper = (
        "var _ejsHasBoundTexture=(target)=>{switch(target){"
        "case 3553:return !!GLctx.getParameter(32873);"
        "case 34067:return !!GLctx.getParameter(34068);"
        "case 32879:return !!GLctx.getParameter(32874);"
        "default:return true}};"
    )
    marker = "var _glTexParameterf="
    if marker not in text:
        raise SystemExit("generated core patch did not find texture parameter functions")
    text = text.replace(marker, helper + marker, 1)

    text = replace_once(
        text,
        r"var _glTexParameterf=\(x0,x1,x2\)=>GLctx\.texParameterf\(x0,x1,x2\);",
        "var _glTexParameterf=(x0,x1,x2)=>{if(_ejsHasBoundTexture(x0))GLctx.texParameterf(x0,x1,x2)};",
        "glTexParameterf",
    )
    text = replace_once(
        text,
        r"var _glTexParameterfv=\(target,pname,params\)=>\{var param=HEAPF32\[params>>2\];GLctx\.texParameterf\(target,pname,param\)\};",
        "var _glTexParameterfv=(target,pname,params)=>{if(_ejsHasBoundTexture(target)){var param=HEAPF32[params>>2];GLctx.texParameterf(target,pname,param)}};",
        "glTexParameterfv",
    )
    text = replace_once(
        text,
        r"var _glTexParameteri=\(x0,x1,x2\)=>GLctx\.texParameteri\(x0,x1,x2\);",
        "var _glTexParameteri=(x0,x1,x2)=>{if(_ejsHasBoundTexture(x0))GLctx.texParameteri(x0,x1,x2)};",
        "glTexParameteri",
    )
    text = replace_once(
        text,
        r"var _glTexParameteriv=\(target,pname,params\)=>\{var param=HEAP32\[params>>2\];GLctx\.texParameteri\(target,pname,param\)\};",
        "var _glTexParameteriv=(target,pname,params)=>{if(_ejsHasBoundTexture(target)){var param=HEAP32[params>>2];GLctx.texParameteri(target,pname,param)}};",
        "glTexParameteriv",
    )

    path.write_text(text, encoding="utf-8", newline="")

    required = (
        "OpenGL ES 3.0 WebGL 2.0",
        "return error===1280?0:error",
        "_ejsHasBoundTexture",
    )
    for marker in required:
        if marker not in text:
            raise SystemExit(f"generated core patch validation failed: {marker}")


if __name__ == "__main__":
    main()
