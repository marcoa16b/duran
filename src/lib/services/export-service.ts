import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const ExportService = {
  async generatePDF(
    titulo: string,
    subtitulo: string,
    headers: string[],
    rows: (string | number)[][],
  ): Promise<Uint8Array> {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(titulo, 14, 20);
    doc.setFontSize(10);
    doc.text(subtitulo, 14, 28);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    return new Uint8Array(doc.output("arraybuffer"));
  },

  async generateExcel(
    titulo: string,
    headers: string[],
    rows: (string | number)[][],
  ): Promise<Uint8Array> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(titulo.slice(0, 31));

    sheet.columns = headers.map((h) => ({ header: h, key: h, width: 20 }));
    for (const row of rows) {
      const obj: Record<string, string | number> = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] ?? "";
      });
      sheet.addRow(obj);
    }

    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(buffer);
  },
};
