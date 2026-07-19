import { getStudents, calculateGrade, getSubjects } from './store.js';
import { showToast } from './app.js';

// DOM Elements
const classSelect = document.getElementById('report-class-select');
const typeSelect = document.getElementById('report-type-select');
const previewBox = document.getElementById('report-preview-box');

const generateBtn = document.getElementById('btn-generate-report');
const exportExcelBtn = document.getElementById('btn-export-excel');
const exportPdfBtn = document.getElementById('btn-export-pdf');

// Active report state for exports
let currentReportData = {
  className: '',
  type: '',
  headers: [],
  rows: []
};

export function initReports() {
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      buildReportPreview();
    });
  }

  if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', () => {
      exportToExcel();
    });
  }

  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', () => {
      exportToPDF();
    });
  }
}

function buildReportPreview() {
  const cls = classSelect.value;
  const type = typeSelect.value;
  if (!cls || !type) return;

  const students = getStudents().filter(s => s.class === cls);
  students.sort((a, b) => a.rollNo.localeCompare(b.rollNo));

  if (students.length === 0) {
    previewBox.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:300px; color:#ef4444;">
        <i class="fa-solid fa-circle-xmark" style="font-size:3rem; margin-bottom:16px;"></i>
        <p>No student records found to generate a report for.</p>
      </div>
    `;
    return;
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let reportTitle = '';
  let tableHeaderHTML = '';
  let tableBodyHTML = '';
  
  // Reset state
  currentReportData.className = cls;
  currentReportData.type = type;
  currentReportData.rows = [];

  if (type === 'roster') {
    reportTitle = 'STUDENT CONTACT ROSTER';
    currentReportData.headers = ['Roll No', 'Student ID', 'Full Name', 'Email Address', 'Phone Number'];
    
    tableHeaderHTML = currentReportData.headers.map(h => `<th>${h}</th>`).join('');
    
    tableBodyHTML = students.map(s => {
      currentReportData.rows.push([s.rollNo, s.id, s.name, s.email, s.phone]);
      return `
        <tr>
          <td><strong>${s.rollNo}</strong></td>
          <td>${s.id}</td>
          <td><strong>${s.name}</strong></td>
          <td>${s.email}</td>
          <td>${s.phone}</td>
        </tr>
      `;
    }).join('');
    
  } else if (type === 'attendance') {
    reportTitle = 'CLASS ATTENDANCE SUMMARY REPORT';
    currentReportData.headers = ['Roll No', 'Student Name', 'Present Classes', 'Absent Classes', 'Attendance Rate'];
    
    tableHeaderHTML = currentReportData.headers.map(h => `<th>${h}</th>`).join('');
    
    tableBodyHTML = students.map(s => {
      let presentCount = 0;
      let totalLogs = 0;
      if (s.attendance) {
        Object.values(s.attendance).forEach(status => {
          totalLogs++;
          if (status === 'present' || status === 'late') presentCount++;
        });
      }
      const absentCount = totalLogs - presentCount;
      const rate = totalLogs > 0 ? ((presentCount / totalLogs) * 100).toFixed(1) + '%' : '100.0%';
      
      currentReportData.rows.push([s.rollNo, s.name, presentCount, absentCount, rate]);
      
      return `
        <tr>
          <td><strong>${s.rollNo}</strong></td>
          <td><strong>${s.name}</strong></td>
          <td>${presentCount} days</td>
          <td>${absentCount} days</td>
          <td><span style="font-weight:bold; color: ${parseFloat(rate) < 75 ? '#dc2626' : '#059669'};">${rate}</span></td>
        </tr>
      `;
    }).join('');

  } else if (type === 'marks') {
    reportTitle = 'CUMULATIVE MARKS & ACADEMIC EVALUATION';
    const activeSubjects = getSubjects();
    currentReportData.headers = ['Roll No', 'Student Name', ...activeSubjects.map(s => s.name), 'Average GPA', 'Result'];
    
    tableHeaderHTML = currentReportData.headers.map(h => `<th>${h}</th>`).join('');
    
    tableBodyHTML = students.map(s => {
      const rowScores = [];
      let totalPoints = 0;
      let isPassing = true;

      activeSubjects.forEach(subObj => {
        const sub = subObj.name;
        const intMark = s.marks && s.marks.internal && s.marks.internal[sub] !== undefined ? s.marks.internal[sub] : 0;
        const semMark = s.marks && s.marks.semester && s.marks.semester[sub] !== undefined ? s.marks.semester[sub] : 0;
        const total = intMark + semMark;
        const grading = calculateGrade(intMark, semMark);
        totalPoints += grading.points;
        if (grading.status === 'Fail') isPassing = false;
        
        rowScores.push(`${total} (${grading.grade})`);
      });

      const avgGpa = activeSubjects.length > 0 ? (totalPoints / activeSubjects.length).toFixed(2) : '0.00';
      const statusText = isPassing ? 'Pass' : 'Fail';
      
      currentReportData.rows.push([s.rollNo, s.name, ...rowScores, avgGpa, statusText]);

      return `
        <tr>
          <td><strong>${s.rollNo}</strong></td>
          <td><strong>${s.name}</strong></td>
          ${rowScores.map(score => `<td>${score}</td>`).join('')}
          <td><strong>${avgGpa} / 10</strong></td>
          <td><span style="font-weight:bold; color: ${isPassing ? '#059669' : '#dc2626'};">${statusText}</span></td>
        </tr>
      `;
    }).join('');
  }

  // Draw paper template in preview container
  previewBox.innerHTML = `
    <div style="border: 1px solid #e5e7eb; padding: 40px; background: white; color: #1f2937; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-radius: 8px;">
      <div class="report-preview-header">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
          <div style="text-align: left;">
            <h2 style="font-size: 1.4rem; font-weight: 800; color: #111827; letter-spacing: -0.5px; margin:0;">J.P. College of Engineering</h2>
            <p style="color:#6b7280; font-size: 0.8rem; text-transform:uppercase; margin: 2px 0 0 0;">Office of the Academic Registrar</p>
          </div>
          <div style="text-align: right; font-size: 0.85rem; color: #4b5563;">
            <p><strong>Generated:</strong> ${currentDate}</p>
            <p><strong>Roster Scope:</strong> ${cls}</p>
          </div>
        </div>
        <hr style="border: 0; border-top: 3px double #374151; margin-bottom: 20px;">
        <h3 style="font-size: 1.25rem; font-weight: 700; color: #1f2937; text-align: center; margin: 0;">${reportTitle}</h3>
      </div>
      
      <table class="report-preview-table" id="report-table-export">
        <thead>
          <tr>
            ${tableHeaderHTML}
          </tr>
        </thead>
        <tbody>
          ${tableBodyHTML}
        </tbody>
      </table>
      
      <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 0.8rem; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 15px;">
        <p>J.P. College of Engineering Student Information System - Report Portal</p>
        <p>Page 1 of 1</p>
      </div>
    </div>
  `;

  showToast('Report preview generated successfully.', 'success');
}

// Export to Excel using SheetJS XLSX CDN
function exportToExcel() {
  if (currentReportData.rows.length === 0) {
    showToast('Please click Preview to generate data before exporting.', 'warning');
    return;
  }

  try {
    const filename = `JPCOE_${currentReportData.className.replace(' ', '')}_${currentReportData.type}_Report.xlsx`;
    const tableEl = document.getElementById('report-table-export');
    
    if (!tableEl) {
      showToast('Error: Preview element not ready.', 'danger');
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.table_to_sheet(tableEl);
    
    // Auto fit column widths
    const max_cols = currentReportData.headers.length;
    const wscols = [];
    for (let i = 0; i < max_cols; i++) {
      wscols.push({ wch: 18 }); // Standard width
    }
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Academic Report");
    XLSX.writeFile(wb, filename);
    
    showToast(`Spreadsheet exported: ${filename}`, 'success');
  } catch (error) {
    console.error(error);
    showToast('Failed to export Excel file.', 'danger');
  }
}

// Export to PDF using jsPDF
function exportToPDF() {
  if (currentReportData.rows.length === 0) {
    showToast('Please click Preview to generate data before exporting.', 'warning');
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    
    // Create new document landscape or portrait depending on columns count
    const orientation = currentReportData.type === 'marks' ? 'landscape' : 'portrait';
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Set Font
    doc.setFont("helvetica");
    
    // Header Block
    doc.setFontSize(22);
    doc.setTextColor(17, 24, 39); // Slate 900
    doc.text("J.P. COLLEGE OF ENGINEERING", 14, 20);
    
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128); // Gray 500
    doc.text("OFFICE OF THE ACADEMIC REGISTRAR | SYSTEM RECORDS", 14, 25);
    
    // Date and scope
    const dateStr = new Date().toLocaleDateString();
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99); // Gray 600
    doc.text(`Scope: ${currentReportData.className}`, pageWidth - 55, 20);
    doc.text(`Date: ${dateStr}`, pageWidth - 55, 25);
    
    // Divider line
    doc.setDrawColor(55, 65, 81); // Slate 700
    doc.setLineWidth(0.8);
    doc.line(14, 28, pageWidth - 14, 28);
    
    // Report Title
    const titleText = currentReportData.type === 'roster' 
      ? 'CLASS CONTACT ROSTER' 
      : currentReportData.type === 'attendance'
      ? 'ATTENDANCE SUMMARY LEDGER'
      : 'CUMULATIVE PERFORMANCE REPORT';
      
    doc.setFontSize(13);
    doc.setTextColor(31, 41, 55); // Gray 800
    doc.setFont("helvetica", "bold");
    doc.text(titleText, 14, 36);
    
    // Render Custom Data Table Grid
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    const headers = currentReportData.headers;
    const rows = currentReportData.rows;
    
    // Calculate columns space dynamically
    const leftMargin = 14;
    const printableWidth = pageWidth - 28;
    const colWidth = printableWidth / headers.length;
    
    let y = 44;
    
    // Header fill
    doc.setFillColor(243, 244, 246); // Gray 100
    doc.rect(leftMargin, y, printableWidth, 8, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 41, 55);
    
    headers.forEach((h, i) => {
      doc.text(h, leftMargin + (i * colWidth) + 2, y + 5.5);
    });
    
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99);
    
    // Rows print
    rows.forEach((row, rowIndex) => {
      // Check pagination break
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20; // reset margin
        
        // Redraw table headers on new page
        doc.setFillColor(243, 244, 246);
        doc.rect(leftMargin, y, printableWidth, 8, 'F');
        doc.setFont("helvetica", "bold");
        doc.setTextColor(31, 41, 55);
        headers.forEach((h, i) => {
          doc.text(h, leftMargin + (i * colWidth) + 2, y + 5.5);
        });
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(75, 85, 99);
      }
      
      // Zebra stripe colors
      if (rowIndex % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(leftMargin, y, printableWidth, 8, 'F');
      }
      
      // Bottom border line
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.1);
      doc.line(leftMargin, y + 8, pageWidth - leftMargin, y + 8);
      
      row.forEach((cell, cellIndex) => {
        // Truncate cell text if it overflows its boundary
        const textStr = String(cell);
        const textTruncated = doc.clipToArray(textStr, colWidth - 4);
        doc.text(textStr, leftMargin + (cellIndex * colWidth) + 2, y + 5.5);
      });
      
      y += 8;
    });

    // Footer info
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text("Generated securely via J.P. College of Engineering Student Information Management Portal.", 14, pageHeight - 10);
    
    const docName = `JPCOE_${currentReportData.className.replace(' ', '')}_${currentReportData.type}_Report.pdf`;
    doc.save(docName);
    
    showToast(`PDF downloaded: ${docName}`, 'success');
  } catch (error) {
    console.error(error);
    showToast('Failed to export PDF file.', 'danger');
  }
}
