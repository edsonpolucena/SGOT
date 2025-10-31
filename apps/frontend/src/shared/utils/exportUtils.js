export function arrayToCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const s = String(val).replaceAll('"', '""');
    if (s.search(/[",\n]/) >= 0) return '"' + s + '"';
    return s;
  };
  const header = Object.keys(rows[0]).map(escape).join(',');
  const data = rows.map((r) => Object.values(r).map(escape).join(',')).join('\n');
  return header + '\n' + data;
}

export function downloadBlob(content, filename, type = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

export function openPrintWindowWithTable(title, columns, rows) {
  const win = window.open('', '_blank');
  if (!win) return;
  const styles = `
    <style>
      body { font-family: Arial, sans-serif; padding: 16px; }
      h1 { font-size: 18px; margin: 0 0 12px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; }
      th { background: #f3f4f6; text-align: left; }
      @media print {
        @page { size: A4; margin: 12mm; }
      }
    </style>
  `;
  const thead = '<tr>' + columns.map((c) => `<th>${c.header}</th>`).join('') + '</tr>';
  const tbody = rows.map((r) => {
    return '<tr>' + columns.map((c) => `<td>${(r[c.key] ?? '')}</td>`).join('') + '</tr>';
  }).join('');
  win.document.write(`<!doctype html><html><head><meta charset=\"utf-8\">${styles}</head><body>`);
  win.document.write(`<h1>${title}</h1>`);
  win.document.write(`<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`);
  win.document.write('</body></html>');
  win.document.close();
  win.focus();
  win.print();
}



