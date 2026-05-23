#!/usr/bin/env python3
"""Convert a Markdown report to styled HTML."""

import sys
import re
import os
import json
from datetime import datetime
from pathlib import Path

def markdown_to_html(md_text: str) -> str:
    """Simple Markdown to HTML converter for the report format."""
    lines = md_text.split('\n')
    html_parts = []
    in_code_block = False
    code_buffer = []
    in_list = False
    list_type = None

    for line in lines:
        # Code block handling
        if line.startswith('```'):
            if in_code_block:
                html_parts.append(f'<pre><code>{"".join(code_buffer)}</code></pre>')
                code_buffer = []
                in_code_block = False
            else:
                in_code_block = True
                # Extract language if specified
                lang = line[3:].strip()
                code_buffer = []
            continue

        if in_code_block:
            code_buffer.append(line + '\n')
            continue

        # Close any open list
        if in_list and not line.startswith('- ') and not line.startswith('* ') and not line.startswith('1. '):
            if list_type == 'ul':
                html_parts.append('</ul>')
            else:
                html_parts.append('</ol>')
            in_list = False
            list_type = None

        # Empty line
        if not line.strip():
            html_parts.append('')
            continue

        # Headers
        if line.startswith('### '):
            html_parts.append(f'<h3>{line[4:]}</h3>')
        elif line.startswith('## '):
            html_parts.append(f'<h2>{line[3:]}</h2>')
        elif line.startswith('# '):
            html_parts.append(f'<h1>{line[2:]}</h1>')

        # Bullet list
        elif line.startswith('- ') or line.startswith('* '):
            if not in_list or list_type != 'ul':
                if in_list:
                    html_parts.append('</ul>')
                html_parts.append('<ul>')
                in_list = True
                list_type = 'ul'
            content = line[2:]
            # Process inline bold
            content = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', content)
            html_parts.append(f'<li>{content}</li>')

        # Ordered list
        elif re.match(r'^\d+\.\s', line):
            if not in_list or list_type != 'ol':
                if in_list:
                    html_parts.append('</ol>')
                html_parts.append('<ol>')
                in_list = True
                list_type = 'ol'
            content = re.sub(r'^\d+\.\s', '', line)
            content = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', content)
            html_parts.append(f'<li>{content}</li>')

        # Blockquote
        elif line.startswith('> '):
            content = line[2:]
            content = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', content)
            html_parts.append(f'<blockquote>{content}</blockquote>')

        # Regular paragraph
        else:
            content = line
            # Inline code
            content = re.sub(r'`([^`]+)`', r'<code>\1</code>', content)
            # Bold
            content = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', content)
            # Links
            content = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', content)
            html_parts.append(f'<p>{content}</p>')

    # Close any open list
    if in_list:
        if list_type == 'ul':
            html_parts.append('</ul>')
        else:
            html_parts.append('</ol>')

    return '\n'.join(html_parts)


def render_html(md_path: str, html_path: str) -> None:
    """Read markdown file and write styled HTML."""
    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    body_html = markdown_to_html(md_text)

    html_template = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>前端技术日报 - 2026-05-23</title>
<style>
  :root {
    --bg: #f8f9fa;
    --card-bg: #ffffff;
    --text: #1a1a2e;
    --text-secondary: #495057;
    --accent: #e74c3c;
    --accent-light: #ffe0db;
    --border: #e9ecef;
    --code-bg: #f1f3f5;
    --link: #2563eb;
    --heading: #0d1b2a;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.7;
    font-size: 15px;
  }
  .container {
    max-width: 720px;
    margin: 0 auto;
    padding: 40px 20px 80px;
  }
  .card {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 32px 36px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    border: 1px solid var(--border);
  }
  h1 {
    font-size: 24px;
    color: var(--heading);
    margin-bottom: 4px;
    line-height: 1.3;
  }
  h1 + p {
    color: var(--text-secondary);
    font-size: 14px;
    margin-bottom: 24px;
  }
  h2 {
    font-size: 18px;
    color: var(--heading);
    margin: 28px 0 12px;
    padding-bottom: 6px;
    border-bottom: 2px solid var(--accent-light);
  }
  h3 {
    font-size: 15px;
    color: var(--heading);
    margin: 20px 0 8px;
  }
  p { margin: 8px 0; }
  ul, ol { margin: 8px 0; padding-left: 24px; }
  li { margin: 4px 0; }
  code {
    font-family: "JetBrains Mono", "SF Mono", "Cascadia Code", monospace;
    background: var(--code-bg);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
  }
  pre {
    background: #1e1e2e;
    color: #cdd6f4;
    border-radius: 8px;
    padding: 16px 20px;
    overflow-x: auto;
    margin: 12px 0;
    font-size: 13px;
    line-height: 1.5;
  }
  pre code {
    background: transparent;
    padding: 0;
    color: inherit;
    font-size: inherit;
  }
  strong { font-weight: 600; }
  a { color: var(--link); text-decoration: none; }
  a:hover { text-decoration: underline; }
  blockquote {
    border-left: 3px solid var(--accent);
    padding: 8px 16px;
    margin: 8px 0;
    background: var(--accent-light);
    border-radius: 0 6px 6px 0;
    color: var(--text-secondary);
    font-size: 14px;
  }
  hr {
    border: none;
    border-top: 1px solid var(--border);
    margin: 24px 0;
  }
  .footer {
    text-align: center;
    color: var(--text-secondary);
    font-size: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }
  .tag {
    display: inline-block;
    background: var(--accent-light);
    color: var(--accent);
    font-size: 12px;
    padding: 2px 10px;
    border-radius: 12px;
    font-weight: 500;
    margin: 0 4px 4px 0;
  }
  /* Section numbering styling */
  h2:before {
    content: attr(data-number) " ";
  }
  @media (max-width: 600px) {
    .card { padding: 20px 16px; }
    h1 { font-size: 20px; }
  }
</style>
</head>
<body>
<div class="container">
  <div class="card">
    {body}
    <div class="footer">
      前端技术日报 · 每日工程判断 · 2026-05-23
    </div>
  </div>
</div>
</body>
</html>'''

    # Insert body HTML
    html_output = html_template.replace('{body}', body_html)

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_output)

    print(f'✅ HTML rendered: {html_path}')
    print(f'   Source MD: {md_path}')
    file_size = os.path.getsize(html_path)
    print(f'   Size: {file_size:,} bytes')


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: render_report_html.py <input.md> <output.html>')
        sys.exit(1)

    md_path = sys.argv[1]
    html_path = sys.argv[2]

    if not os.path.exists(md_path):
        print(f'Error: File not found: {md_path}')
        sys.exit(1)

    render_html(md_path, html_path)
