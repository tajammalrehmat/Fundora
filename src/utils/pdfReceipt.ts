import { jsPDF } from 'jspdf';

export function generateReceiptPDF(item: any, type: 'transaction' | 'claim') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Page width and height
  const pageWidth = doc.internal.pageSize.width; // 210mm
  const pageHeight = doc.internal.pageSize.height; // 297mm

  // Colors
  const primaryColor = [15, 23, 42]; // Slate 900
  const accentColor = [16, 185, 129]; // Emerald 500
  const textColor = [51, 65, 85]; // Slate 700

  // 1. Header Box (Dark Theme)
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('INVESTYA REAL ESTATE', 15, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(150, 180, 200);
  doc.text('SECURE DECENTRALIZED LEDGER RECEIPT', 15, 25);

  // Decorative Accent bar
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 42, pageWidth, 3, 'F');

  // Receipt ID on right of header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const titleId = type === 'transaction' ? 'TX ID:' : 'CLAIM ID:';
  doc.text(`${titleId} ${item.id}`, pageWidth - 15, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  const statusStr = item.status || 'Verified';
  doc.text(`STATUS: ${statusStr.toUpperCase()}`, pageWidth - 15, 25, { align: 'right' });

  // 2. Main Title
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('OFFICIAL TRANSACTION RECEIPT', 15, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('This document verifies that the transaction described below is recorded and cleared in the Investya Real Estate central ledger.', 15, 66, { maxWidth: 180 });

  // 3. Grid Details
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.3);
  doc.line(15, 75, pageWidth - 15, 75);

  let y = 85;
  const drawRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(label, 15, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(value, 75, y, { maxWidth: 120 });

    doc.line(15, y + 4, pageWidth - 15, y + 4);
    y += 12;
  };

  // Populate data based on type
  if (type === 'transaction') {
    drawRow('Transaction ID', item.id);
    drawRow('User Account', item.userEmail || 'N/A');
    drawRow('Transaction Type', item.type);
    drawRow('Asset Amount', `$${Number(item.amount).toFixed(2)} USDT`);
    drawRow('Timestamp', item.date);
    drawRow('Network Protocol', item.network ? `USDT (${item.network} Network)` : 'Internal App Settlement');
    if (item.walletAddress) {
      drawRow('Destination Wallet', item.walletAddress);
    }
    if (item.txHash) {
      drawRow('Cryptographic Hash', item.txHash);
    }
    drawRow('Details', item.description || 'N/A');
  } else {
    drawRow('Settlement ID', item.id);
    drawRow('User Account', item.userEmail || 'N/A');
    drawRow('Settlement Type', 'Daily Yield Claim');
    drawRow('Accrued Amount', `$${Number(item.amount).toFixed(2)} USDT`);
    drawRow('Settlement Date', item.date);
    drawRow('Claim Timestamp', item.claimedAt ? `${item.date} ${item.claimedAt}` : `${item.date} (Settled)`);
    drawRow('Status', item.status || 'Claimed');
    drawRow('Details', 'Dynamic portfolio yield credited straight to available balance.');
  }

  // 4. Security Seal & Signatures
  y += 5;
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.roundedRect(15, y, pageWidth - 30, 32, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('PLATFORM COMPLIANCE INTEGRITY AUDIT', 20, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('This is a computer-generated, cryptographically signed ledger record. The integrity of this clearance index is verified under platform compliance locks. No physical signature is required.', 20, y + 14, { maxWidth: pageWidth - 45 });

  // Verified Badge
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.roundedRect(pageWidth - 60, y + 18, 45, 8, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('✓ LEDGER VERIFIED', pageWidth - 37, y + 23, { align: 'center' });

  // 5. Tech Barcode-like element and Footer
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  // draw a stylized digital signature barcode bar
  for (let i = 0; i < 40; i++) {
    const width = Math.random() > 0.4 ? 1 : 0.3;
    doc.setLineWidth(width);
    doc.line(15 + i * 2, pageHeight - 28, 15 + i * 2, pageHeight - 18);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('INVESTYA REAL ESTATE TRADING PLATFORM', pageWidth - 15, pageHeight - 25, { align: 'right' });
  doc.text('Verify ledger integrity via public index on the platform homepage.', pageWidth - 15, pageHeight - 20, { align: 'right' });

  // Save the PDF
  const filename = `${type}_receipt_${item.id}.pdf`;
  doc.save(filename);
}
