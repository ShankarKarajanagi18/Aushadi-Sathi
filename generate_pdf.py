import re
import subprocess
from pathlib import Path

def convert_md_to_html(md_path: Path, html_path: Path):
    md_text = md_path.read_text(encoding="utf-8")
    lines = md_text.splitlines()
    html_lines = []
    
    html_lines.append("""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>AushadhiSaathi - Complete Prompt & Engineering Documentation</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
    color: #1e293b;
    max-width: 900px;
    margin: 40px auto;
    padding: 0 30px;
  }
  h1 { color: #005D67; border-bottom: 2px solid #005D67; padding-bottom: 8px; font-size: 26px; page-break-before: always; }
  h1:first-of-type { page-break-before: avoid; }
  h2 { color: #005D67; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-top: 32px; font-size: 20px; }
  h3 { color: #0f766e; margin-top: 24px; font-size: 16px; }
  h4 { color: #334155; margin-top: 18px; font-size: 14px; }
  blockquote {
    border-left: 4px solid #005D67;
    background-color: #f0fdfa;
    padding: 10px 16px;
    margin: 16px 0;
    color: #0f766e;
    border-radius: 0 8px 8px 0;
  }
  code {
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 13px;
    color: #0f172a;
  }
  pre {
    background: #0f172a;
    color: #f8fafc;
    padding: 14px;
    border-radius: 8px;
    overflow-x: auto;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }
  pre code {
    background: transparent;
    color: inherit;
    padding: 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 13px;
  }
  th, td {
    border: 1px solid #cbd5e1;
    padding: 8px 12px;
    text-align: left;
    vertical-align: top;
  }
  th {
    background-color: #f8fafc;
    color: #005D67;
    font-weight: 700;
  }
  tr:nth-child(even) { background-color: #f8fafc; }
  ul, ol { padding-left: 24px; }
  li { margin-bottom: 6px; }
  hr { border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0; }
  a { color: #005D67; text-decoration: none; }
  @page {
    margin: 20mm 15mm;
    size: A4;
  }
</style>
</head>
<body>
""")

    in_code = False
    in_table = False

    for line in lines:
        if line.strip().startswith("```"):
            if in_code:
                html_lines.append("</code></pre>")
                in_code = False
            else:
                in_code = True
                html_lines.append("<pre><code>")
            continue

        if in_code:
            escaped = line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            html_lines.append(escaped)
            continue

        # Table detection
        if line.strip().startswith("|") and line.strip().endswith("|"):
            parts = [p.strip() for p in line.strip()[1:-1].split("|")]
            if all(re.match(r"^:?-+:?$", p) for p in parts):
                continue
            if not in_table:
                in_table = True
                html_lines.append("<table><thead><tr>" + "".join(f"<th>{p}</th>" for p in parts) + "</tr></thead><tbody>")
            else:
                html_lines.append("<tr>" + "".join(f"<td>{p}</td>" for p in parts) + "</tr>")
            continue
        elif in_table:
            html_lines.append("</tbody></table>")
            in_table = False

        # Blockquote
        if line.startswith("> "):
            content = line[2:].strip()
            content = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", content)
            content = re.sub(r"`(.*?)`", r"<code>\1</code>", content)
            html_lines.append(f"<blockquote>{content}</blockquote>")
            continue

        # Headings
        if line.startswith("# "):
            html_lines.append(f"<h1>{line[2:].strip()}</h1>")
        elif line.startswith("## "):
            html_lines.append(f"<h2>{line[3:].strip()}</h2>")
        elif line.startswith("### "):
            html_lines.append(f"<h3>{line[4:].strip()}</h3>")
        elif line.startswith("#### "):
            html_lines.append(f"<h4>{line[5:].strip()}</h4>")
        elif line.strip() == "---":
            html_lines.append("<hr>")
        elif line.startswith("- ") or line.startswith("* "):
            content = line[2:].strip()
            content = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", content)
            content = re.sub(r"`(.*?)`", r"<code>\1</code>", content)
            content = re.sub(r"\[(.*?)\]\((.*?)\)", r'<a href="\2">\1</a>', content)
            html_lines.append(f"<li>{content}</li>")
        elif re.match(r"^\d+\.\s", line):
            content = re.sub(r"^\d+\.\s*", "", line).strip()
            content = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", content)
            content = re.sub(r"`(.*?)`", r"<code>\1</code>", content)
            content = re.sub(r"\[(.*?)\]\((.*?)\)", r'<a href="\2">\1</a>', content)
            html_lines.append(f"<li>{content}</li>")
        elif not line.strip():
            html_lines.append("<br>")
        else:
            content = line.strip()
            content = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", content)
            content = re.sub(r"`(.*?)`", r"<code>\1</code>", content)
            content = re.sub(r"\[(.*?)\]\((.*?)\)", r'<a href="\2">\1</a>', content)
            html_lines.append(f"<p>{content}</p>")

    if in_table:
        html_lines.append("</tbody></table>")

    html_lines.append("</body></html>")
    html_path.write_text("\n".join(html_lines), encoding="utf-8")
    print(f"Generated HTML: {html_path.resolve()}")


def generate_pdf_via_chrome(html_path: Path, pdf_path: Path):
    chrome_path = Path("C:/Program Files/Google/Chrome/Application/chrome.exe")
    if not chrome_path.exists():
        chrome_path = Path("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe")
    
    if not chrome_path.exists():
        print("Neither Chrome nor Edge was found.")
        return False

    cmd = [
        str(chrome_path),
        "--headless",
        "--disable-gpu",
        f"--print-to-pdf={str(pdf_path.resolve())}",
        str(html_path.resolve())
    ]
    print("Running command:", " ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True)
    if pdf_path.exists() and pdf_path.stat().st_size > 0:
        print(f"Success! PDF created at: {pdf_path.resolve()} ({pdf_path.stat().st_size} bytes)")
        return True
    else:
        print("PDF generation failed:", result.stderr)
        return False


if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent
    md_file = base_dir / "PROMPT_DOCUMENTATION.md"
    html_file = base_dir / "PROMPT_DOCUMENTATION.html"
    pdf_file = base_dir / "PROMPT_DOCUMENTATION.pdf"

    convert_md_to_html(md_file, html_file)
    generate_pdf_via_chrome(html_file, pdf_file)
