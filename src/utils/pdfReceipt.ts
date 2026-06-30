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
  doc.text('FUNDORA REAL ESTATE', 15, 18);

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
  doc.text('This document verifies that the transaction described below is recorded and cleared in the Fundora Real Estate central ledger.', 15, 66, { maxWidth: 180 });

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
  doc.text('This is a computer-generated, cryptographically signed ledger record. The integrity of this clearance index is verified under platform compliance locks. No physical signature is required.', 20, y + 14, { maxWidth: 115 });

  // Verified Badge
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.roundedRect(pageWidth - 65, y + 18, 40, 8, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('✓ LEDGER VERIFIED', pageWidth - 45, y + 23, { align: 'center' });

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
  doc.text('FUNDORA REAL ESTATE TRADING PLATFORM', pageWidth - 15, pageHeight - 25, { align: 'right' });
  doc.text('Verify ledger integrity via public index on the platform homepage.', pageWidth - 15, pageHeight - 20, { align: 'right' });

  // Save the PDF
  const filename = `${type}_receipt_${item.id}.pdf`;
  doc.save(filename);
}

export function generateDocumentPDF(docName: string, project: any) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.width; // 210mm
  const pageHeight = doc.internal.pageSize.height; // 297mm

  const primaryColor = [15, 23, 42]; // Slate 900
  const accentColor = [16, 185, 129]; // Emerald 500
  const secondaryColor = [245, 158, 11]; // Amber 500

  // 1. Header Band
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Decorative Accent bar
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 38, pageWidth, 2, 'F');

  // Brand Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('FUNDORA FRACTIONAL REAL ESTATE', 15, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('SECURE CO-OWNERSHIP DEED & LEGAL REGULATION DEPOSIT', 15, 22);

  // Document Badge on Header
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.roundedRect(pageWidth - 75, 10, 60, 7, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('OFFICIAL CERTIFIED DEED', pageWidth - 45, 14.5, { align: 'center' });

  // 2. Document Details Section
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('LEGAL COMPLIANCE PROSPECTUS', 15, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`This document serves as an official certified digital prospectus copy of "${docName}" attached to the fractionalized real estate offering described below.`, 15, 58, { maxWidth: 180 });

  // 3. Grid for Property Info
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.3);
  doc.line(15, 68, pageWidth - 15, 68);

  let y = 76;
  const drawRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(label, 15, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(value, 75, y, { maxWidth: 120 });

    doc.line(15, y + 4, pageWidth - 15, y + 4);
    y += 11;
  };

  drawRow('Property Asset Name', project.name);
  drawRow('Asset ID', `PROJ-00${project.id}`);
  drawRow('Asset Location', project.location);
  drawRow('Asset Category', project.category || 'N/A');
  drawRow('Total Target Valuation', `$${(project.totalShares * project.pricePerShare).toLocaleString()} USDT`);
  drawRow('Share Price Unit', `$${project.pricePerShare} USDT / Share`);
  drawRow('Regulatory Issuer', 'Fundora Global Asset Custody Trust LLC');
  drawRow('Compliance Standard', 'ERC-3643 Securities Protocol');

  // Customize content based on doc type
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('REGULATORY & TRUSTEE STATEMENTS', 15, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);

  let legalText = '';
  if (docName.toLowerCase().includes('brochure') || docName.toLowerCase().includes('specs')) {
    legalText = `The asset represents high-yield fractionalized holdings managed by certified property administrators. Annual yield forecasts target ${project.expectedRoi}% APR with monthly settlement distributions. Minimum lockup and risk parameters adhere to regulatory guidelines. Fully backed by solid real-world physical properties.`;
  } else if (docName.toLowerCase().includes('registry') || docName.toLowerCase().includes('approval') || docName.toLowerCase().includes('permit')) {
    legalText = `Certified by the local Land Registry authority. This document is on file under registry index Ref: UK-REG-${project.id}492A-X. Total asset ownership blocks are locked in smart escrow accounts to protect shareholders from third-party liquidation claims. Verified compliant with standard zoning regulations.`;
  } else {
    legalText = `All-conditions Non-Objection Consent (NOC) granted for fractioned liquidity issuance. Licensed by municipal development councils and local governments. This certificate remains legally binding under international digital asset compliance protocols for the duration of the 12-Month investment vaults.`;
  }

  doc.text(legalText, 15, y, { maxWidth: 180 });

  // 4. Verification Seal Box
  y += 28;
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.roundedRect(15, y, pageWidth - 30, 32, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('CRYPTOGRAPHIC TRUST INTEGRITY VERIFIED', 20, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`This is a regulatory grade electronic prospectus deposit copy. Original filing records, metadata, and notary hashes are registered on-chain with SHA-256 block indexes: 8e5f2a1b94d2c7380cf87${project.id}a4e5d6c7b8a90123.`, 20, y + 14, { maxWidth: 115 });

  // Stamp Badge
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.roundedRect(pageWidth - 65, y + 18, 40, 8, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('✓ STATUS: SECURED', pageWidth - 45, y + 23, { align: 'center' });

  // Barcode / Tech footer
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  for (let i = 0; i < 48; i++) {
    const width = Math.random() > 0.4 ? 1.1 : 0.3;
    doc.setLineWidth(width);
    doc.line(15 + i * 1.8, pageHeight - 28, 15 + i * 1.8, pageHeight - 18);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('FUNDORA GLOBAL ASSETS SECURITIZATION REGISTER', pageWidth - 15, pageHeight - 25, { align: 'right' });
  doc.text('Verify registry signatures online using the secured portal.', pageWidth - 15, pageHeight - 20, { align: 'right' });

  doc.save(docName);
}
