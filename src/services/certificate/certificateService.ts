import QRCode from "qrcode";
import { jsPDF } from "jspdf";

/**
 * Certificate data required for PDF generation.
 */
export interface CertificateData {
  claimId: string;
  claimType: string;
  claimTypeLabel: string;
  description: string | null;
  verificationDate: string;
  primaryMetric: { label: string; value: string | number };
  metrics: { label: string; value: string | number }[];
  confidenceScore: number;
  status: string;
  evidenceHash: string | null;
  verificationHash: string | null;
  txHash: string | null;
  verificationUrl: string;
}

/**
 * Certificate generation service.
 *
 * Creates a downloadable PDF certificate for any verification type with:
 * - VisionLedger branding
 * - Verification type and details
 * - Type-specific metrics
 * - QR code linking to the verification page
 * - Cryptographic hashes for independent verification
 */
export class CertificateService {
  /**
   * Generate a PDF certificate as a Blob for download.
   */
  static async generatePDF(data: CertificateData): Promise<Blob> {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let y = 25;

    // ── Header ──
    doc.setFillColor(45, 85, 55);
    doc.rect(0, 0, pageWidth, 50, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("VisionLedger", margin, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("AI-Powered Proof of Reality Certificate", margin, 32);
    doc.text(`Issued: ${data.verificationDate}`, margin, 40);

    y = 60;

    // ── Certificate ID ──
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text(`Certificate ID: ${data.claimId}`, margin, y);
    y += 12;

    // ── Verification Results ──
    doc.setTextColor(45, 45, 45);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Verification Results", margin, y);
    y += 10;

    // Divider
    doc.setDrawColor(45, 85, 55);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Result rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    const results = [
      { label: "Verification Type", value: data.claimTypeLabel },
      { label: "Status", value: data.status },
      { label: data.primaryMetric.label, value: String(data.primaryMetric.value) },
      { label: "AI Confidence", value: `${data.confidenceScore}%` },
      { label: "Verification Date", value: data.verificationDate },
    ];

    for (const { label, value } of results) {
      doc.setTextColor(130, 130, 130);
      doc.setFontSize(10);
      doc.text(label, margin, y);
      doc.setTextColor(45, 45, 45);
      doc.setFontSize(12);
      doc.text(value, margin + 60, y);
      y += 8;
    }

    // Additional metrics
    if (data.metrics.length > 0) {
      y += 4;
      doc.setTextColor(130, 130, 130);
      doc.setFontSize(10);
      doc.text("Additional Metrics", margin, y);
      y += 5;

      for (const { label, value } of data.metrics) {
        doc.setTextColor(130, 130, 130);
        doc.setFontSize(9);
        doc.text(label, margin + 4, y);
        doc.setTextColor(45, 45, 45);
        doc.setFontSize(10);
        doc.text(String(value), margin + 60, y);
        y += 6;
      }
    }

    // Description
    if (data.description) {
      y += 4;
      doc.setTextColor(130, 130, 130);
      doc.setFontSize(10);
      doc.text("Description", margin, y);
      y += 5;

      doc.setTextColor(45, 45, 45);
      doc.setFontSize(11);
      const descLines = doc.splitTextToSize(data.description, pageWidth - margin * 2 - 60);
      doc.text(descLines, margin + 60, y);
      y += descLines.length * 5 + 5;
    }

    y += 5;

    // ── Hash Verification ──
    if (data.evidenceHash || data.verificationHash) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(45, 45, 45);
      doc.text("Cryptographic Proof", margin, y);
      y += 8;

      doc.setDrawColor(45, 85, 55);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      const hashes = [
        { label: "Evidence Hash", value: data.evidenceHash },
        { label: "Verification Hash", value: data.verificationHash },
        { label: "Transaction Hash", value: data.txHash },
      ];

      for (const { label, value } of hashes) {
        if (!value) continue;
        doc.setTextColor(130, 130, 130);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(label, margin, y);
        y += 4;

        doc.setTextColor(70, 70, 70);
        doc.setFont("courier", "normal");
        doc.setFontSize(8);
        const hashLines = doc.splitTextToSize(value, pageWidth - margin * 2);
        doc.text(hashLines, margin, y);
        y += hashLines.length * 3.5 + 4;
      }

      y += 5;
    }

    // ── QR Code ──
    if (data.verificationUrl) {
      const qrDataUrl = await QRCode.toDataURL(data.verificationUrl, {
        width: 300,
        margin: 1,
        color: { dark: "#2D5537", light: "#FFFFFF" },
      });

      const qrSize = 40;
      const qrX = pageWidth - margin - qrSize;

      if (y + qrSize > pageHeight - 30) {
        doc.addPage();
        y = 25;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(45, 45, 45);
      doc.text("Verify This Certificate", margin, y + 5);
      y += 10;

      doc.addImage(qrDataUrl, "PNG", qrX, y, qrSize, qrSize);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.text("Scan QR code or visit:", margin, y + 10);
      doc.setTextColor(45, 85, 55);
      doc.setFontSize(9);
      doc.text(data.verificationUrl, margin, y + 16);
    }

    // ── Footer ──
    const footerY = pageHeight - 15;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `VisionLedger — AI-Powered Proof of Reality — © ${new Date().getFullYear()}`,
      margin,
      footerY,
    );

    return doc.output("blob");
  }

  /**
   * Trigger a browser download of the certificate PDF.
   */
  static async downloadCertificate(data: CertificateData): Promise<void> {
    const blob = await this.generatePDF(data);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `VisionLedger-Certificate-${data.claimId.slice(0, 8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
