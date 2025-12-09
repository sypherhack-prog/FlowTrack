// components/EmployeeReportPDF.tsx
import jsPDF from 'jspdf';

export interface EmployeeReport {
  name: string;
  totalTime: string;
  activity: number;
  screenshots: string[];
}

export const generatePDF = async (employee: EmployeeReport) => {
  if (typeof window === 'undefined') return;

  const toDataUrl = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text(`Rapport - ${employee.name}`, 20, 20);

  doc.setFontSize(12);
  doc.text(`Temps total: ${employee.totalTime}`, 20, 40);
  doc.text(`Productivité: ${employee.activity}%`, 20, 50);

  let y = 70;
  for (const src of employee.screenshots) {
    try {
      const dataUrl = await toDataUrl(src);
      doc.addImage(dataUrl, 'WEBP', 20, y, 160, 90);
      y += 100;
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
    } catch {
      // ignore failed image
    }
  }

  doc.save(`${employee.name}-rapport.pdf`);
};