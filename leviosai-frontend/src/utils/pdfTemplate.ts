import type { WizardState } from '../types'

interface PdfOptions {
  title: string
  state: WizardState
  body: string
  lightBg?: boolean
}

export function buildPdfHtml({ title, state, body, lightBg = true }: PdfOptions): string {
  const now = new Date()
  const generatedDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const projectName = state.projectName || 'Untitled Project'
  const projectNo = state.projectNo || 1
  const author = state.projectAuthor || 'Unknown'
  const projectDate = state.projectCustomDate || now.toISOString().split('T')[0]

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title} - LeviosAI</title>
<style>
  @page { margin: 20mm 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #222;
    background: ${lightBg ? '#fff' : '#f8f9fc'};
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 24px 32px 16px;
    border-bottom: 2px solid #6b96be;
  }
  .logo-area {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .logo-mark {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #6b96be 0%, #4a7fad 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 900;
    font-size: 16px;
    font-family: monospace;
  }
  .logo-text {
    display: flex;
    flex-direction: column;
  }
  .logo-text .name {
    font-size: 18px;
    font-weight: 800;
    color: #1a2a3a;
    letter-spacing: -0.5px;
  }
  .logo-text .sub {
    font-size: 9px;
    font-family: monospace;
    color: #6b96be;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }
  .info-table {
    border-collapse: collapse;
    font-size: 11px;
  }
  .info-table td {
    padding: 3px 10px;
    border: 1px solid #ddd;
  }
  .info-table td:first-child {
    font-weight: 700;
    color: #555;
    background: #f5f7fa;
    white-space: nowrap;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .info-table td:last-child {
    color: #222;
    min-width: 120px;
  }
  .content {
    flex: 1;
    padding: 24px 32px;
  }
  .content h1 {
    font-size: 20px;
    font-weight: 700;
    color: #1a2a3a;
    margin-bottom: 16px;
  }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 12px 32px 16px;
    border-top: 1px solid #ddd;
    font-size: 10px;
    color: #888;
    font-family: monospace;
  }
  .footer .copyright {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  @media print {
    body { background: white; }
    .footer { position: fixed; bottom: 0; left: 0; right: 0; }
  }
  @media screen {
    .content img { max-width: 100%; }
  }
</style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="logo-area">
      <div class="logo-mark">L</div>
      <div class="logo-text">
        <span class="name">LeviosAI</span>
        <span class="sub">Edge AI Optimization Platform</span>
      </div>
    </div>
    <table class="info-table">
      <tr><td>Project</td><td>${esc(projectName)}</td></tr>
      <tr><td>No.</td><td>#${projectNo}</td></tr>
      <tr><td>Author</td><td>${esc(author)}</td></tr>
      <tr><td>Date</td><td>${projectDate}</td></tr>
    </table>
  </div>

  <!-- Content -->
  <div class="content">
    <h1>${esc(title)}</h1>
    ${body}
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="copyright">&copy; ${now.getFullYear()} Horcrux Technologies</div>
    <div>Generated: ${generatedDate}</div>
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Convenience: open a new window with canvas screenshot inside the PDF template */
export function exportCanvasPdf(
  canvas: HTMLCanvasElement,
  title: string,
  state: WizardState,
) {
  const dataUrl = canvas.toDataURL('image/png')
  const body = `<div style="text-align:center;padding:12px 0;"><img src="${dataUrl}" style="max-width:100%;max-height:70vh;border-radius:8px;border:1px solid #eee;" /></div>`
  const html = buildPdfHtml({ title, state, body })
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
}
