export const exportToCSV = (data: any[], filename: string, customHeaders?: string[]) => {
  if (!data || data.length === 0) return;

  const csvRows = [];

  const headers = customHeaders || (Array.isArray(data[0]) ? [] : Object.keys(data[0]));
  if (headers.length > 0) {
    csvRows.push(headers.join(','));
  }

  for (const row of data) {
    let values: any[];
    if (Array.isArray(row)) {
      values = row;
    } else {
      values = headers.map(header => row[header]);
    }

    const processedValues = values.map(val => {
      const stringVal = val === null || val === undefined ? '' : String(val);
      const escaped = stringVal.replace(/"/g, '""');
      return `"${escaped}"`;
    });

    csvRows.push(processedValues.join(','));
  }

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
