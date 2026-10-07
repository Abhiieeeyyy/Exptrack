import * as XLSX from 'xlsx';

/**
 * Excel & CSV Generation and Export utilities
 * Fully supports Unicode (Malayalam, Hindi, Tamil, etc.) for Microsoft Excel
 */

/**
 * Convert an array of objects to an Excel (.xlsx) workbook and trigger download
 * Preserves Malayalam / Indic scripts natively without mojibake/encoding corruption.
 * @param {Array<Object>} rows 
 * @param {Array<{key: string, label: string, formatter?: Function}>} columns 
 * @param {string} filename 
 * @param {string} sheetName 
 */
export function exportToExcel(rows, columns, filename = 'Srikainari_Ulsavam_2026_Export.xlsx', sheetName = 'Ledger') {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }

  // 1. Header row
  const headerRow = columns.map(c => c.label);

  // 2. Data rows
  const dataRows = rows.map(row => {
    return columns.map(col => {
      let val = row[col.key];
      if (col.formatter) {
        val = col.formatter(val, row);
      }
      if (val === null || val === undefined) {
        return '';
      }
      // If it's a number string with 2 decimals from formatter, convert to number if valid
      if (typeof val === 'string' && /^-?\d+(\.\d+)?$/.test(val.trim())) {
        const numVal = parseFloat(val);
        if (!isNaN(numVal) && col.key.toLowerCase().includes('amount')) {
          return numVal;
        }
      }
      return val;
    });
  });

  const sheetData = [headerRow, ...dataRows];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // 3. Auto-fit column widths to accommodate Malayalam text and labels
  const colWidths = columns.map((col, colIdx) => {
    let maxLen = col.label ? String(col.label).length : 10;
    for (let r = 0; r < dataRows.length; r++) {
      const cellVal = dataRows[r][colIdx];
      const strVal = cellVal !== undefined && cellVal !== null ? String(cellVal) : '';
      if (strVal.length > maxLen) {
        maxLen = strVal.length;
      }
    }
    // Malayalam characters take visual space; give comfortable width
    return { wch: Math.min(Math.max(maxLen + 4, 14), 70) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));

  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, cleanFilename);
}

/**
 * Convert an array of objects to CSV string with UTF-8 BOM and trigger browser download
 * @param {Array<Object>} rows 
 * @param {Array<{key: string, label: string, formatter?: Function}>} columns 
 * @param {string} filename 
 */
export function exportToCSV(rows, columns, filename = 'Srikainari_Ulsavam_2026_Export.csv') {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }

  // Header row
  const headers = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');

  // Data rows
  const dataRows = rows.map(row => {
    return columns.map(col => {
      let val = row[col.key];
      if (col.formatter) {
        val = col.formatter(val, row);
      }
      if (val === null || val === undefined) {
        val = '';
      }
      const strVal = String(val).replace(/"/g, '""');
      return `"${strVal}"`;
    }).join(',');
  });

  const csvContent = [headers, ...dataRows].join('\r\n');
  // Include UTF-8 BOM (\ufeff)
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
