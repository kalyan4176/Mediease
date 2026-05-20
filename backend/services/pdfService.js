import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generatePrescriptionPDF = (prescription, doctorName, patientName, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });

      // Create directories if missing
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      // --- PDF Header ---
      doc
        .fillColor('#0d9488')
        .fontSize(24)
        .text('MEDIEASE HEALTH PORTAL', { align: 'center' });
      doc
        .fillColor('#4b5563')
        .fontSize(10)
        .text('Teleconsultation & Digital Prescription Service', { align: 'center' })
        .moveDown(1.5);

      // --- Horizontal Rule ---
      doc
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(562, doc.y)
        .stroke()
        .moveDown(1.5);

      // --- Metadata Grid ---
      const initialY = doc.y;
      
      // Doctor info (Left column)
      doc
        .fillColor('#1f2937')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('DOCTOR DETAILS', 50, initialY)
        .font('Helvetica')
        .fontSize(10)
        .text(`Name: Dr. ${doctorName}`)
        .text('Hospital: Mediease Specialty Care');

      // Patient & Consultation info (Right column)
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('PATIENT & APPOINTMENT', 320, initialY)
        .font('Helvetica')
        .fontSize(10)
        .text(`Patient Name: ${patientName}`)
        .text(`Date: ${new Date(prescription.createdAt || Date.now()).toDateString()}`)
        .text(`Appointment ID: ${prescription.appointmentId.toString().slice(-8).toUpperCase()}`);

      doc.y = initialY + 65; // Reset vertical position after two-column setup

      // --- Rx Section Header ---
      doc
        .moveDown(1.5)
        .fillColor('#0d9488')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('Rx', 50, doc.y)
        .moveDown(0.5);

      // --- Medicines Table ---
      doc.fillColor('#1f2937').fontSize(11);
      
      // Table Header
      let currentY = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Medicine Name', 50, currentY, { width: 180 });
      doc.text('Dosage Regime', 240, currentY, { width: 100 });
      doc.text('Duration', 350, currentY, { width: 80 });
      doc.text('Instructions', 440, currentY, { width: 120 });
      
      doc
        .strokeColor('#d1d5db')
        .lineWidth(1)
        .moveTo(50, currentY + 15)
        .lineTo(562, currentY + 15)
        .stroke();

      currentY += 22;
      doc.font('Helvetica');

      // Medicines Loop
      prescription.medicines.forEach((med) => {
        // Handle overflow check in future, here assumes single page for size
        doc.text(med.name, 50, currentY, { width: 180 });
        doc.text(med.dosage, 240, currentY, { width: 100 });
        doc.text(med.duration, 350, currentY, { width: 80 });
        doc.text(med.instructions || 'N/A', 440, currentY, { width: 120 });
        currentY += 25;
      });

      doc.y = currentY + 10;

      // --- Doctor Notes / Advice ---
      if (prescription.notes) {
        doc
          .moveDown(1.5)
          .font('Helvetica-Bold')
          .fontSize(12)
          .text('ADVICE / DIAGNOSTIC NOTES')
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#4b5563')
          .text(prescription.notes, { align: 'justify', width: 512 })
          .moveDown(2);
      }

      // --- Signature Area ---
      doc.y = 700; // Force near bottom of standard A4 sheet
      doc
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(562, doc.y)
        .stroke()
        .moveDown(0.8);

      doc
        .fillColor('#9ca3af')
        .fontSize(9)
        .text('This is a digitally generated prescription by Mediease Portal and does not require a physical signature.', 50, doc.y + 5, { align: 'center' });

      doc.end();

      writeStream.on('finish', () => {
        resolve(outputPath);
      });
      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};
