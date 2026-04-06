
# Zprovoznění LaTeX na Windows
Nainstalovat `MikTex` a aktualizovat knihovny.

Nainstalovat `Strawberry Perl`.

Stáhnout do `VS Code` extension `LaTeX Workshop` (James Yu).

V nastavení změnit výsput kompilace `Latex-workshop › Latex: Out Dir` do jiné než základní složky, například nastavit na `out`.

Otevřít ve `VS Code` příkazem `Preferences: Open User Settings (JSON)` soubor `settings.json` a přidat do něj následující kód:

```JSON
"latex-workshop.latex.recipes": [
    {
    "name": "latexmk ➞ copy-pdf",
    "tools": ["latexmk", "copy-pdf"]
    }
],
"latex-workshop.latex.tools": [
    {
        "name": "latexmk",
        "command": "latexmk",
        "args": [
            "-pdf",
            "-synctex=1",
            "-interaction=nonstopmode",
            "-outdir=%OUTDIR%",
            "%DOC%"
        ],
        "env": {}
    },
    {
        "name": "copy-pdf",
        "command": "powershell",
        "args": [
            "-ExecutionPolicy",
            "Bypass",
            "-NoProfile",
            "-Command",
            "Copy-Item %OUTDIR%/%DOCFILE%.pdf %DOCFILE%.pdf"
        ]
    },
],
```

Poslední úpravu výše se po kompilaci překopíruje zkompilované PDF z výsupní složky do základního adresáře.