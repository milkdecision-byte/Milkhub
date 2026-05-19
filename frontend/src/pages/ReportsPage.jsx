import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileSpreadsheet, FileText, Download, Loader2, Filter,
  Search, ShieldAlert, CheckCircle2, LayoutDashboard,
  Calendar, Clock, Database, ChevronDown, Mail, Activity,
  ArrowRight, Sparkles, RotateCcw, Microscope, Thermometer, Droplets, FlaskConical, Zap
} from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { PARAMETER_LABELS } from '../utils/parameters'

import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  LineChart, Line, AreaChart, Area 
} from 'recharts'
import html2canvas from 'html2canvas'
import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// ── Shared Components ─────────────────────────────────────────────────────────

function StatMiniCard({ label, value, icon: Icon, colorClass }) {
  return (
    <div className="card-premium p-6 flex items-center gap-6 border-[#C4B5FD]/10 shadow-lg group hover:border-[#7C3AED]/40 transition-all">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl ${colorClass} group-hover:scale-110 transition-transform`}>
        <Icon size={24} className="text-white"/>
      </div>
      <div>
        <p className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-bold text-[#1E1B4B] tracking-tighter">{value.toLocaleString()}</p>
      </div>
    </div>
  )
}

function ExportCard({ icon: Icon, title, desc, colorClass, onClick, loading, variant = 'full' }) {
  const isCompact = variant === 'compact'
  return (
    <motion.button
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      className={`card-premium p-8 text-left transition-all duration-500 flex items-center gap-8 disabled:opacity-50 group border-transparent hover:border-[#C4B5FD]/40 ${isCompact ? 'sm:p-6' : ''}`}
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl ${colorClass} group-hover:scale-110 transition-transform`}>
        {loading ? <Loader2 size={24} className="animate-spin text-white"/> : <Icon size={24} className="text-white"/>}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`font-bold text-[#111827] tracking-tight group-hover:text-[#7C3AED] transition-colors ${isCompact ? 'text-lg' : 'text-xl'}`}>
          {title}
        </h4>
        <p className="text-[10px] text-[#374151] font-semibold leading-relaxed mt-1">
          {desc}
        </p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] dark:bg-white/10 flex items-center justify-center text-[#7C3AED] group-hover:bg-[#7C3AED] group-hover:text-white transition-all">
        <Download size={18} />
      </div>
    </motion.button>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [filters, setFilters] = useState({ 
    date_from: '', 
    date_to: '', 
    decision: '', 
    fraud_risk: '', 
    session: '' 
  })
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingKey, setLoadingKey] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  // Offscreen rendering state for export charts capture
  const [exportRecords, setExportRecords] = useState(null)
  const [exportStats, setExportStats] = useState(null)
  const exportChartsRef = useRef(null)

  const displayedRecords = records.filter(r => !filters.date_from || r.date === filters.date_from)

  const fetchReportsData = useCallback(async () => {
    setLoading(true)
    setRecords([]) // Clear previous state
    setSummary(null)
    try {
      const activeFilters = Object.fromEntries(Object.entries(filters).filter(([,v]) => v))
      
      if (activeFilters.date_from && new Date(activeFilters.date_from) > new Date()) {
        toast.error('Future dates are unavailable')
        setLoading(false)
        setRecords([])
        setSummary(null)
        return
      }

      const [sumRes, recRes] = await Promise.all([
        api.get('/records/summary', { params: activeFilters }),
        api.get('/records', { params: { ...activeFilters, page, per_page: 20 } })
      ])
      setSummary(sumRes.data)
      setRecords(recRes.data.records)
      setTotal(recRes.data.total)
    } catch (e) {
      toast.error('Data synchronization failed')
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    fetchReportsData()
  }, [fetchReportsData])

  const setFilter = (k, v) => {
    setFilters(p => ({ ...p, [k]: v }))
    setPage(1)
  }

  // ── Helper to process daily trend data from complete records ─────────────────
  const getTrendData = (recordsList) => {
    if (!recordsList || recordsList.length === 0) return [];
    const grouped = {};
    recordsList.forEach(r => {
      const d = r.date;
      if (!grouped[d]) {
        grouped[d] = { date: d, total: 0, accepted: 0, rejected: 0, fatSum: 0, snfSum: 0, count: 0 };
      }
      grouped[d].total += r.quantity || 0;
      if (r.decision === 'accept') {
        grouped[d].accepted += r.quantity || 0;
      } else {
        grouped[d].rejected += r.quantity || 0;
      }
      grouped[d].fatSum += r.fat || 0;
      grouped[d].snfSum += r.snf || 0;
      grouped[d].count += 1;
    });

    return Object.values(grouped)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(g => ({
        name: g.date.split('-').slice(1).join('/'), // MM/DD
        date: g.date,
        total: Math.round(g.total * 10) / 10,
        accepted: Math.round(g.accepted * 10) / 10,
        rejected: Math.round(g.rejected * 10) / 10,
        avgFat: g.count ? Math.round((g.fatSum / g.count) * 100) / 100 : 0,
        avgSnf: g.count ? Math.round((g.snfSum / g.count) * 100) / 100 : 0,
      }));
  };

  // ── Capturing offscreen charts using html2canvas ────────────────────────────
  const captureCharts = async () => {
    const chartIds = ['chart-pie', 'chart-bar', 'chart-area', 'chart-donut', 'chart-line', 'chart-heatmap'];
    const base64s = {};

    for (const id of chartIds) {
      const el = document.getElementById(id);
      if (el) {
        try {
          const canvas = await html2canvas(el, { 
            scale: 2, 
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
          base64s[id.replace('chart-', '')] = canvas.toDataURL('image/png');
        } catch (err) {
          console.error(`Failed to capture chart: ${id}`, err);
        }
      }
    }
    return base64s;
  };

  // ── PDF Document Generation ──────────────────────────────────────────────────
  const generatePDFReport = async (exportRecords, stats, chartsBase64) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const primaryColor = [30, 27, 75]; // #1E1B4B
    const tealColor = [0, 167, 157]; // #00A79D

    // Page 1 Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('IVRI Milk Quality Hub', 15, 16);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('OPERATIONAL QUALITY LOG & ANALYTICS REPORT', 15, 24);
    doc.text(`Generated: ${new Date().toLocaleString()}  |  Total Records: ${stats.totalCount}`, 15, 30);

    // Mini Brand Box
    doc.setFillColor(...tealColor);
    doc.rect(pageWidth - 32, 10, 18, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('IMH', pageWidth - 29, 21);

    // Filters row
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    const activeFilters = [
      filters.date_from ? `Date: ${filters.date_from}` : 'All Dates',
      filters.session ? `Shift: ${filters.session}` : 'All Shifts',
      filters.decision ? `Decision: ${filters.decision}` : 'All Decisions',
      filters.fraud_risk ? `Risk: ${filters.fraud_risk}` : 'All Risk'
    ].join(' | ');
    doc.text(`Active Filters: ${activeFilters}`, 15, 48);

    // Summary Metric Cards
    const cardWidth = 35;
    const cardHeight = 20;
    const startX = 15;
    const startY = 53;
    const cardGap = 4;

    const cards = [
      { t: 'TOTAL VOL (L)', v: stats.totalVolume.toFixed(1) },
      { t: 'ACCEPTED (L)', v: stats.acceptedVolume.toFixed(1) },
      { t: 'REJECTED (L)', v: stats.rejectedVolume.toFixed(1) },
      { t: 'ACCEPTANCE %', v: `${stats.acceptanceRate}%` },
      { t: 'QUALITY ALERTS', v: stats.fraudAlerts.toString() }
    ];

    cards.forEach((c, idx) => {
      const x = startX + idx * (cardWidth + cardGap);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, startY, cardWidth, cardHeight, 3, 3, 'FD');

      doc.setTextColor(100, 116, 139);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(c.t, x + 3, startY + 6);

      doc.setTextColor(30, 27, 75);
      doc.setFontSize(11);
      doc.text(c.v, x + 3, startY + 14);
    });

    // Charts Section Title
    doc.setTextColor(30, 27, 75);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text('Visual Quality Analytics & Compliance Trends', 15, 83);
    doc.setDrawColor(...tealColor);
    doc.setLineWidth(0.4);
    doc.line(15, 85, pageWidth - 15, 85);

    // Place main requested charts: Pie, Area, Bar
    let currentY = 90;
    if (chartsBase64.pie) {
      doc.addImage(chartsBase64.pie, 'PNG', 15, currentY, 85, 52);
    }
    if (chartsBase64.area) {
      doc.addImage(chartsBase64.area, 'PNG', 105, currentY, 90, 52);
    }

    currentY += 56;
    if (chartsBase64.bar) {
      doc.addImage(chartsBase64.bar, 'PNG', 15, currentY, 90, 52);
    }
    if (chartsBase64.donut) {
      doc.addImage(chartsBase64.donut, 'PNG', 110, currentY, 85, 52);
    }

    currentY += 56;
    if (chartsBase64.heatmap) {
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'bold');
      doc.text('Laboratory Quality Parameter Compliance Heatmap', 15, currentY);
      doc.addImage(chartsBase64.heatmap, 'PNG', 15, currentY + 3, 180, 50);
    }

    // Page 2: Table Records
    doc.addPage();
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.text('Detailed Milk Collection Ledger Records', 15, 9);

    const headers = [['Farmer Code', 'Farmer Name', 'Qty (L)', 'Fat (%)', 'SNF (%)', 'pH', 'Decision', 'Risk Status']];
    const data = exportRecords.map(r => [
      r.farmer_code || '—',
      r.farmer_name || '—',
      r.quantity ? r.quantity.toFixed(1) : '0.0',
      r.fat ? r.fat.toFixed(2) : '0.00',
      r.snf ? r.snf.toFixed(2) : '0.00',
      r.ph ? r.ph.toFixed(2) : '0.00',
      (r.decision || 'reject').toUpperCase(),
      r.fraud_risk === 'high' ? 'HIGH RISK' : r.fraud_risk === 'medium' ? 'MEDIUM RISK' : 'CLEAN'
    ]);

    doc.autoTable({
      startY: 20,
      head: headers,
      body: data,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' }
      },
      didParseCell: function (data) {
        if (data.column.index === 6) {
          if (data.cell.raw === 'ACCEPTED' || data.cell.raw === 'ACCEPT') {
            data.cell.styles.textColor = [16, 185, 129];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [239, 68, 68];
            data.cell.styles.fontStyle = 'bold';
          }
        }
        if (data.column.index === 7) {
          if (data.cell.raw === 'HIGH RISK') {
            data.cell.styles.textColor = [239, 68, 68];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.raw === 'MEDIUM RISK') {
            data.cell.styles.textColor = [245, 158, 11];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [16, 185, 129];
          }
        }
      }
    });

    const finalY = doc.autoTable.previous.finalY || 20;
    if (finalY + 45 < pageHeight) {
      drawAIInsights(doc, stats, finalY + 12);
    } else {
      doc.addPage();
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'bold');
      doc.text('Automated AI Quality Insights & Decision Matrix', 15, 9);
      drawAIInsights(doc, stats, 22);
    }

    doc.save(`milkhub_audit_report_${Date.now()}.pdf`);
  };

  // ── Executive Analytics PDF Generation ──────────────────────────────────────
  const generateAnalyticsPDF = async (stats, chartsBase64) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    const primaryColor = [30, 27, 75]; // #1E1B4B
    const tealColor = [0, 167, 157]; // #00A79D

    // Page 1 Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('IVRI Milk Quality Hub', 15, 17);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('EXECUTIVE EXECUTIVE VISUAL ANALYTICS REPORT', 15, 25);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 31);

    // Mini Brand Box
    doc.setFillColor(...tealColor);
    doc.rect(pageWidth - 32, 10, 18, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('IMH', pageWidth - 29, 21);

    // Summary Metric Cards
    const cardWidth = 35;
    const cardHeight = 20;
    const startX = 15;
    const startY = 53;
    const cardGap = 4;

    const cards = [
      { t: 'TOTAL VOL (L)', v: stats.totalVolume.toFixed(1) },
      { t: 'ACCEPTED (L)', v: stats.acceptedVolume.toFixed(1) },
      { t: 'REJECTED (L)', v: stats.rejectedVolume.toFixed(1) },
      { t: 'ACCEPTANCE %', v: `${stats.acceptanceRate}%` },
      { t: 'QUALITY ALERTS', v: stats.fraudAlerts.toString() }
    ];

    cards.forEach((c, idx) => {
      const x = startX + idx * (cardWidth + cardGap);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, startY, cardWidth, cardHeight, 3, 3, 'FD');

      doc.setTextColor(100, 116, 139);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(c.t, x + 3, startY + 6);

      doc.setTextColor(30, 27, 75);
      doc.setFontSize(11);
      doc.text(c.v, x + 3, startY + 14);
    });

    // Part 1 Charts
    doc.setTextColor(30, 27, 75);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text('Core Volume and Shift Distribution', 15, 83);
    doc.setDrawColor(...tealColor);
    doc.setLineWidth(0.4);
    doc.line(15, 85, pageWidth - 15, 85);

    if (chartsBase64.pie) {
      doc.addImage(chartsBase64.pie, 'PNG', 15, 90, 85, 52);
    }
    if (chartsBase64.bar) {
      doc.addImage(chartsBase64.bar, 'PNG', 105, 90, 90, 52);
    }

    // Part 2 Charts
    doc.setTextColor(30, 27, 75);
    doc.setFontSize(11);
    doc.text('Collection Trends and Risk Analysis', 15, 150);
    doc.line(15, 152, pageWidth - 15, 152);

    if (chartsBase64.area) {
      doc.addImage(chartsBase64.area, 'PNG', 15, 158, 90, 52);
    }
    if (chartsBase64.donut) {
      doc.addImage(chartsBase64.donut, 'PNG', 110, 158, 85, 52);
    }

    // Page 2: line + heatmap + AI analysis
    doc.addPage();
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.text('Parameter Consistency & Laboratory Compliance Map', 15, 9);

    if (chartsBase64.line) {
      doc.addImage(chartsBase64.line, 'PNG', 15, 20, 90, 52);
    }
    if (chartsBase64.heatmap) {
      doc.addImage(chartsBase64.heatmap, 'PNG', 110, 20, 85, 52);
    }

    drawAIInsights(doc, stats, 82);

    doc.save(`milkhub_analytics_report_${Date.now()}.pdf`);
  };

  const drawAIInsights = (doc, stats, yPos) => {
    doc.setTextColor(30, 27, 75);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text('AI Quality Insights & Decision Matrix Summary', 15, yPos);
    
    doc.setDrawColor(0, 167, 157);
    doc.setLineWidth(0.4);
    doc.line(15, yPos + 2, doc.internal.pageSize.getWidth() - 15, yPos + 2);

    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    const rate = stats.acceptanceRate;
    let summaryText = `During this reporting cycle, a total of ${stats.totalVolume.toFixed(1)} Liters of raw milk was processed. The system recorded an overall acceptance rate of ${rate}%. `;
    
    if (rate > 90) {
      summaryText += `This indicates exceptionally high quality compliance and consistency across the supply chain, with minimal parameter deviations. `;
    } else if (rate > 75) {
      summaryText += `This indicates moderate compliance, but reveals opportunities to address common parameters causing rejections. `;
    } else {
      summaryText += `This signifies critical quality failures. Main drivers include high temperatures or abnormal pH levels, requiring immediate supplier calibration. `;
    }

    if (stats.fraudAlerts > 0) {
      summaryText += `CRITICAL WARNING: The AI engine detected ${stats.fraudAlerts} samples with high or medium fraud indicators (e.g. potential water dilution or non-dairy solids addition). Immediate laboratory verification is advised for flagged providers.`;
    } else {
      summaryText += `Supply safety check: The system detected 0 fraud flags. All parameters align with standard density, SNF, and specific gravity models.`;
    }

    const splitText = doc.splitTextToSize(summaryText, doc.internal.pageSize.getWidth() - 30);
    doc.text(splitText, 15, yPos + 8);
  };

  // ── Excel Document Generation with ExcelJS ──────────────────────────────────
  const generateExcelReport = async (exportRecords, stats, chartsBase64) => {
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Dashboard
    const wsDash = workbook.addWorksheet('Executive Analytics');
    
    const primaryFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E1B4B' } };
    const accentFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '00A79D' } };
    const cardFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
    const borderThin = {
      top: { style: 'thin', color: { argb: 'E2E8F0' } },
      left: { style: 'thin', color: { argb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
      right: { style: 'thin', color: { argb: 'E2E8F0' } }
    };

    // Title Block
    wsDash.mergeCells('A1:L2');
    const titleCell = wsDash.getCell('A1');
    titleCell.value = 'IVRI MILK MANAGEMENT HUB - ANALYTICS REPORT';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = primaryFill;
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    wsDash.mergeCells('A3:L3');
    const subtitleCell = wsDash.getCell('A3');
    subtitleCell.value = `Generated: ${new Date().toLocaleString()}  |  Total Records: ${stats.totalCount}`;
    subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FFFFFF' } };
    subtitleCell.fill = accentFill;
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // KPI Cards columns B, D, F, H, J
    const cardCols = [
      { c: 'B', t: 'Total Volume (L)', v: stats.totalVolume.toFixed(1) },
      { c: 'D', t: 'Accepted Volume (L)', v: stats.acceptedVolume.toFixed(1) },
      { c: 'F', t: 'Rejected Volume (L)', v: stats.rejectedVolume.toFixed(1) },
      { c: 'H', t: 'Acceptance Rate', v: `${stats.acceptanceRate}%` },
      { c: 'J', t: 'Quality Alerts', v: stats.fraudAlerts }
    ];

    cardCols.forEach(card => {
      const colLetter = card.c;
      const nextCol = String.fromCharCode(colLetter.charCodeAt(0) + 1);

      wsDash.mergeCells(`${colLetter}5:${nextCol}5`);
      const tCell = wsDash.getCell(`${colLetter}5`);
      tCell.value = card.t;
      tCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '64748B' } };
      tCell.fill = cardFill;
      tCell.alignment = { horizontal: 'center', vertical: 'middle' };
      tCell.border = borderThin;

      wsDash.mergeCells(`${colLetter}6:${nextCol}6`);
      const vCell = wsDash.getCell(`${colLetter}6`);
      vCell.value = card.v;
      vCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: '1E1B4B' } };
      vCell.fill = cardFill;
      vCell.alignment = { horizontal: 'center', vertical: 'middle' };
      vCell.border = borderThin;
    });

    // Visual Analytics Title
    wsDash.mergeCells('A8:L8');
    const chartTitle = wsDash.getCell('A8');
    chartTitle.value = 'VISUAL QUALITY ANALYTICS & BREAKDOWN';
    chartTitle.font = { name: 'Arial', size: 11, bold: true, color: { argb: '1E1B4B' } };
    chartTitle.alignment = { horizontal: 'left', vertical: 'middle' };

    let currentRow = 10;
    if (chartsBase64.pie) {
      const pieId = workbook.addImage({ base64: chartsBase64.pie, extension: 'png' });
      wsDash.addImage(pieId, `A${currentRow}:F${currentRow + 14}`);
    }
    if (chartsBase64.bar) {
      const barId = workbook.addImage({ base64: chartsBase64.bar, extension: 'png' });
      wsDash.addImage(barId, `G${currentRow}:L${currentRow + 14}`);
    }
    currentRow += 16;

    if (chartsBase64.area) {
      const areaId = workbook.addImage({ base64: chartsBase64.area, extension: 'png' });
      wsDash.addImage(areaId, `A${currentRow}:F${currentRow + 14}`);
    }
    if (chartsBase64.donut) {
      const donutId = workbook.addImage({ base64: chartsBase64.donut, extension: 'png' });
      wsDash.addImage(donutId, `G${currentRow}:L${currentRow + 14}`);
    }

    // Sheet 2: Collection records log
    const wsLog = workbook.addWorksheet('Collection Records');
    const logHeaders = [
      'Farmer Code', 'Farmer Name', 'Date', 'Shift', 'Fat (%)', 'SNF (%)', 
      'pH', 'Acidity (% LA)', 'Temp (°C)', 'Specific Gravity', 'COB Test', 
      'MBRT (min)', 'Decision', 'Fraud Status'
    ];
    
    wsLog.addRow(logHeaders);
    const logHeaderRow = wsLog.getRow(1);
    logHeaderRow.height = 24;
    logHeaderRow.eachCell(cell => {
      cell.fill = primaryFill;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    exportRecords.forEach(r => {
      const row = wsLog.addRow([
        r.farmer_code || '—',
        r.farmer_name || '—',
        r.date || '—',
        (r.shift || '—').toUpperCase(),
        r.fat || 0,
        r.snf || 0,
        r.ph || 0,
        r.acidity || 0,
        r.temperature || 0,
        r.specific_gravity || 0,
        (r.cob_test || '—').toUpperCase(),
        r.mbrt || 0,
        (r.decision || '—').toUpperCase(),
        r.fraud_risk === 'high' ? 'HIGH RISK' : r.fraud_risk === 'medium' ? 'MEDIUM RISK' : 'CLEAN'
      ]);

      row.height = 18;
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = borderThin;
        cell.font = { name: 'Arial', size: 9 };
        cell.alignment = { vertical: 'middle' };

        if ([5,6,7,8,9,10,12].includes(colNumber)) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }

        if (colNumber === 13) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          if (cell.value === 'ACCEPT' || cell.value === 'ACCEPTED') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1FAE5' } };
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '065F46' } };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '991B1B' } };
          }
        }

        if (colNumber === 14) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          if (cell.value === 'HIGH RISK') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '991B1B' } };
          } else if (cell.value === 'MEDIUM RISK') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '92400E' } };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1FAE5' } };
            cell.font = { name: 'Arial', size: 9, color: { argb: '065F46' } };
          }
        }
      });
    });

    wsDash.columns.forEach(col => { col.width = 12; });
    wsLog.columns.forEach(col => {
      let maxLen = 0;
      col.eachCell({ includeEmpty: true }, cell => {
        const val = cell.value ? cell.value.toString() : '';
        if (val.length > maxLen) maxLen = val.length;
      });
      col.width = Math.max(maxLen + 3, 11);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `milkhub_records_export_${Date.now()}.xlsx`;
    a.click();
  };

  // ── CSV Document Generation ──────────────────────────────────────────────────
  const generateCSVReport = (exportRecords, stats) => {
    const metadata = [
      '# ==================================================',
      '# IVRI MILK QUALITY HUB - EXPORT DATA LEDGER',
      `# Generated: ${new Date().toLocaleString()}`,
      '# ==================================================',
      `# Total Collection Volume (L): ${stats.totalVolume.toFixed(1)}`,
      `# Accepted Volume (L): ${stats.acceptedVolume.toFixed(1)}`,
      `# Rejected Volume (L): ${stats.rejectedVolume.toFixed(1)}`,
      `# Acceptance Percentage (%): ${stats.acceptanceRate}`,
      `# Morning Shift Volume (L): ${stats.morningVolume.toFixed(1)}`,
      `# Evening Shift Volume (L): ${stats.eveningVolume.toFixed(1)}`,
      `# Quality Alerts Counter: ${stats.fraudAlerts}`,
      '# ==================================================',
      ''
    ].join('\n');

    const headers = [
      'Farmer Code', 'Farmer Name', 'Date', 'Shift', 'Fat (%)', 'SNF (%)', 
      'pH', 'Acidity (% LA)', 'Temp (°C)', 'Specific Gravity', 'COB Test', 
      'MBRT (min)', 'Decision', 'Fraud Status'
    ].join(',');

    const rows = exportRecords.map(r => [
      `"${r.farmer_code || '—'}"`,
      `"${r.farmer_name || '—'}"`,
      `"${r.date || '—'}"`,
      `"${(r.shift || '—').toUpperCase()}"`,
      r.fat || 0,
      r.snf || 0,
      r.ph || 0,
      r.acidity || 0,
      r.temperature || 0,
      r.specific_gravity || 0,
      `"${(r.cob_test || '—').toUpperCase()}"`,
      r.mbrt || 0,
      `"${(r.decision || '—').toUpperCase()}"`,
      `"${r.fraud_risk === 'high' ? 'HIGH RISK' : r.fraud_risk === 'medium' ? 'MEDIUM RISK' : 'CLEAN'}"`
    ].join(','));

    const csvContent = metadata + headers + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `milkhub_records_${Date.now()}.csv`;
    a.click();
  };

  // ── Unified Export Dispatcher ────────────────────────────────────────────────
  const handleExport = async (type) => {
    if (!summary || summary.total === 0) {
      toast.error('No valid data exists for export')
      return
    }
    setLoadingKey(type)
    try {
      const activeFilters = Object.fromEntries(Object.entries(filters).filter(([,v]) => v))
      const res = await api.get('/records', { params: { ...activeFilters, per_page: summary.total } })
      const allRecs = res.data.records

      if (!allRecs || allRecs.length === 0) {
        toast.error('Export failed: Empty dataset retrieved')
        setLoadingKey(null)
        return
      }

      // Calculate aggregated metrics
      const totalVolume = allRecs.reduce((sum, r) => sum + (r.quantity || 0), 0)
      const acceptedVolume = allRecs.reduce((sum, r) => sum + (r.decision === 'accept' ? (r.quantity || 0) : 0), 0)
      const rejectedVolume = allRecs.reduce((sum, r) => sum + (r.decision === 'reject' ? (r.quantity || 0) : 0), 0)
      const acceptanceRate = totalVolume ? Math.round((acceptedVolume / totalVolume) * 100) : 0
      
      const morningVolume = allRecs.reduce((sum, r) => sum + (r.shift === 'morning' ? (r.quantity || 0) : 0), 0)
      const eveningVolume = allRecs.reduce((sum, r) => sum + (r.shift === 'evening' ? (r.quantity || 0) : 0), 0)

      const fraudAlerts = allRecs.filter(r => r.fraud_risk === 'high' || r.fraud_risk === 'medium').length
      const fraudHigh = allRecs.filter(r => r.fraud_risk === 'high').length
      const fraudMedium = allRecs.filter(r => r.fraud_risk === 'medium').length
      const fraudLow = allRecs.filter(r => r.fraud_risk === 'low' || !r.fraud_risk).length

      const stats = {
        totalCount: allRecs.length,
        totalVolume,
        acceptedVolume,
        rejectedVolume,
        acceptanceRate,
        morningVolume,
        eveningVolume,
        fraudAlerts,
        fraudHigh,
        fraudMedium,
        fraudLow
      }

      setExportRecords(allRecs)
      setExportStats(stats)

      // Allow one React rendering frame tick for Recharts nodes to mount fully
      await new Promise(resolve => setTimeout(resolve, 800))

      const chartsBase64 = await captureCharts()

      if (type === 'pdf') {
        await generatePDFReport(allRecs, stats, chartsBase64)
      } else if (type === 'excel') {
        await generateExcelReport(allRecs, stats, chartsBase64)
      } else if (type === 'csv') {
        generateCSVReport(allRecs, stats)
      } else if (type === 'analytics') {
        await generateAnalyticsPDF(stats, chartsBase64)
      }
      
      toast.success('Report generated and downloaded successfully')
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate report visuals')
    } finally {
      setExportRecords(null)
      setExportStats(null)
      setLoadingKey(null)
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-24">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold uppercase tracking-[0.25em] bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent flex items-center gap-4">
          <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#F97316] shadow-lg shadow-purple-500/20" /> 
          Download Quality Reports
        </h2>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Reports Ready
          </span>
        </div>
      </div>

      {/* ── Summary Analytics ── */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <StatMiniCard label="Total Records" value={summary.total} icon={Database} colorClass="bg-gradient-to-br from-indigo-600 to-blue-700" />
          <StatMiniCard label="ACCEPTED" value={summary.approved} icon={CheckCircle2} colorClass="bg-gradient-to-br from-emerald-500 to-teal-600" />
          <StatMiniCard label="REJECTED" value={summary.rejected} icon={ShieldAlert} colorClass="bg-gradient-to-br from-rose-500 to-red-700" />
          <StatMiniCard label="Fraud High" value={summary.fraud} icon={Zap} colorClass="bg-gradient-to-br from-slate-700 to-slate-900" />
          <StatMiniCard label="Morning" value={summary.morning} icon={Calendar} colorClass="bg-gradient-to-br from-purple-500 to-indigo-600" />
          <StatMiniCard label="Evening" value={summary.evening} icon={Clock} colorClass="bg-gradient-to-br from-orange-500 to-amber-600" />
        </div>
      )}

      {/* ── Master Filter Matrix ── */}
      <div 
        style={{ 
          backgroundColor: '#00A79D',
          boxShadow: '0 10px 30px rgba(0, 167, 157, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }} 
        className="p-10 rounded-[2rem] text-white"
      >
        <div className="flex items-center justify-between border-b border-white/20 pb-8 mb-8">
          <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.3em] flex items-center gap-4">
            <Filter size={18} className="text-white/85" /> Filter by Date and Shift
          </h3>
          <button 
            onClick={() => setFilters({ date_from:'', date_to:'', decision:'', fraud_risk:'', session:'' })}
            className="text-[10px] font-bold text-white/70 hover:text-white uppercase tracking-widest transition-all flex items-center gap-2 group"
          >
            Clear Filters <RotateCcw size={12} className="group-hover:rotate-180 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Date Picker */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest ml-1">Date Selection</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/85 pointer-events-none" />
              <input 
                type="date" 
                className="w-full bg-white/10 border border-white/15 pl-12 pr-5 py-4 rounded-2xl text-sm font-bold text-white outline-none focus:ring-4 focus:ring-white/20 transition-all shadow-sm" 
                value={filters.date_from}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setFilter('date_from', e.target.value)}
              />
            </div>
          </div>

          {/* Decision Filter */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest ml-1">Quality Result</label>
            <div className="relative">
              <select 
                className="w-full bg-white/10 border border-white/15 px-5 py-4 rounded-2xl text-sm font-bold text-white outline-none focus:ring-4 focus:ring-white/20 appearance-none transition-all shadow-sm"
                value={filters.decision}
                onChange={e => setFilter('decision', e.target.value)}
              >
                <option value="" className="bg-[#00A79D]">All Results</option>
                <option value="accept" className="bg-[#00A79D]">ACCEPTED Only</option>
                <option value="reject" className="bg-[#00A79D]">REJECTED Only</option>
              </select>
              <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/85 pointer-events-none" />
            </div>
          </div>

          {/* Fraud Filter */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest ml-1">Risk Level</label>
            <div className="relative">
              <select 
                className="w-full bg-white/10 border border-white/15 px-5 py-4 rounded-2xl text-sm font-bold text-white outline-none focus:ring-4 focus:ring-white/20 appearance-none transition-all shadow-sm"
                value={filters.fraud_risk}
                onChange={e => setFilter('fraud_risk', e.target.value)}
              >
                <option value="" className="bg-[#00A79D]">All Risk Profiles</option>
                <option value="detected" className="bg-[#00A79D]">Fraud Detected (High/Med)</option>
                <option value="high" className="bg-[#00A79D]">Fraud High</option>
                <option value="medium" className="bg-[#00A79D]">Fraud Medium</option>
                <option value="clean" className="bg-[#00A79D]">Clean Samples Only</option>
              </select>
              <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/85 pointer-events-none" />
            </div>
          </div>

          {/* Session Filter */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest ml-1">Entry Source</label>
            <div className="relative">
              <select 
                className="w-full bg-white/10 border border-white/15 px-5 py-4 rounded-2xl text-sm font-bold text-white outline-none focus:ring-4 focus:ring-white/20 appearance-none transition-all shadow-sm"
                value={filters.session}
                onChange={e => setFilter('session', e.target.value)}
              >
                <option value="" className="bg-[#00A79D]">All Sessions</option>
                <option value="morning" className="bg-[#00A79D]">Morning Shift</option>
                <option value="evening" className="bg-[#00A79D]">Evening Shift</option>
                <option value="manual" className="bg-[#00A79D]">Manual Intelligence Entry</option>
              </select>
              <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/85 pointer-events-none" />
            </div>
          </div>

          {/* Download Quick Actions */}
          <div className="flex items-end gap-3 pb-0.5">
            <button onClick={() => handleExport('excel')} disabled={loadingKey !== null} className="flex-1 py-4 rounded-2xl bg-[#059669] text-white flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 text-xs font-bold uppercase tracking-widest">
              {loadingKey === 'excel' ? <Loader2 size={16} className="animate-spin"/> : <FileSpreadsheet size={16} />} Excel
            </button>
            <button onClick={() => handleExport('pdf')} disabled={loadingKey !== null} className="flex-1 py-4 rounded-2xl bg-orange-500 text-white flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 text-xs font-bold uppercase tracking-widest">
              {loadingKey === 'pdf' ? <Loader2 size={16} className="animate-spin"/> : <FileText size={16} />} PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Data Terminal Table ── */}
      <div className="card-premium overflow-hidden border-[#C4B5FD]/10 shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1800px]">
            <thead>
              <tr className="bg-[#1E1B4B] text-white border-b border-[#C4B5FD]/20">
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest sticky left-0 bg-[#1E1B4B] z-20">Provider Entity</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Date / Time</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">{PARAMETER_LABELS.fat}</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">{PARAMETER_LABELS.snf}</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">{PARAMETER_LABELS.ph}</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">{PARAMETER_LABELS.acidity}</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">{PARAMETER_LABELS.temperature}</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">{PARAMETER_LABELS.specific_gravity}</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">{PARAMETER_LABELS.cob_test}</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">{PARAMETER_LABELS.mbrt}</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Quality Result</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest text-right pr-10">Risk Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE9FE] dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-48 text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                    <p className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-[0.4em] animate-pulse">Generating Report...</p>
                  </td>
                </tr>
              ) : displayedRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-48 text-center">
                    <Database size={64} className="text-[#7C3AED] dark:text-slate-200 mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-[#1E1B4B] dark:text-white mb-2">No milk records available for selected date</h3>
                    <p className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-widest">Adjust your date and shift filters to view records.</p>
                  </td>
                </tr>
              ) : displayedRecords.map((r, i) => (
                <tr key={r.id} className="hover:bg-[#F5F3FF]/70 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-5 sticky left-0 bg-white dark:bg-[#111827] z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-lg shadow-purple-500/20">
                        {r.farmer_name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1E1B4B] dark:text-white truncate max-w-[150px]">{r.farmer_name}</p>
                        <p className="text-[9px] font-bold text-[#7C3AED] dark:text-[#7C3AED] uppercase tracking-widest">{r.entry_type === 'manual' ? 'Manual Entry' : 'Bulk Upload'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-[#1E1B4B] dark:text-white">{r.date}</p>
                    <p className="text-[10px] font-bold text-[#7C3AED] dark:text-[#7C3AED] uppercase tracking-widest">{r.shift}</p>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">{r.fat?.toFixed(2)}</td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">{r.snf?.toFixed(2)}</td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">{r.ph?.toFixed(2)}</td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">{r.acidity?.toFixed(3)}</td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">{r.temperature?.toFixed(1)}</td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">{r.specific_gravity?.toFixed(4)}</td>
                  <td className="px-6 py-5">
                    <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-lg border ${r.cob_test === 'positive' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                      {r.cob_test}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">{r.mbrt || '---'}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                        <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-lg text-center ${r.decision === 'accept' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                          {r.decision === 'accept' ? 'ACCEPTED' : 'REJECTED'}
                        </span>
                      {r.decision === 'reject' && r.reasons?.slice(0,1).map((res,idx) => {
                        let displayReason = res;
                        if (res.toUpperCase().includes('ALCOHOL TEST FAIL')) displayReason = `Alcohol Test: ${r.alcohol_test || 'positive'}`;
                        if (res.toUpperCase().includes('COB POSITIVE')) displayReason = `COB Test: ${r.cob_test || 'positive'}`;
                        if (res.toUpperCase().includes('PH')) displayReason = `pH: ${r.ph?.toFixed(2)}`;
                        if (res.toUpperCase().includes('FAT')) displayReason = `Fat: ${r.fat?.toFixed(2)}%`;
                        if (res.toUpperCase().includes('SNF')) displayReason = `SNF: ${r.snf?.toFixed(2)}%`;
                        
                        return (
                          <span key={idx} className="text-[8px] font-bold text-rose-500 uppercase tracking-tighter text-center">{displayReason}</span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right pr-10">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${r.fraud_risk === 'high' ? 'text-rose-500' : r.fraud_risk === 'medium' ? 'text-orange-500' : 'text-emerald-500'}`}>
                      {r.fraud_risk === 'high' ? '!!! HIGH QUALITY RISK' : r.fraud_risk === 'medium' ? '! MEDIUM QUALITY RISK' : '✓ QUALITY VERIFIED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="px-10 py-8 bg-[#F5F3FF] dark:bg-black/40 border-t border-[#C4B5FD]/10 flex items-center justify-between">
            <p className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-widest">
              Showing <span className="text-[#7C3AED]">{records.length}</span> of <span className="text-[#7C3AED]">{total}</span> Milk Records
            </p>
            <div className="flex items-center gap-4">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="w-12 h-12 rounded-xl bg-white dark:bg-white/10 border border-[#C4B5FD]/20 flex items-center justify-center text-purple-600 disabled:opacity-30 hover:bg-purple-50 transition-all"
              >
                <ArrowRight className="rotate-180" size={18} />
              </button>
              <span className="text-sm font-bold text-[#1E1B4B] dark:text-white">Page {page}</span>
              <button 
                disabled={page * 20 >= total}
                onClick={() => setPage(p => p + 1)}
                className="w-12 h-12 rounded-xl bg-white dark:bg-white/10 border border-[#C4B5FD]/20 flex items-center justify-center text-purple-600 disabled:opacity-30 hover:bg-purple-50 transition-all"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Export Options Suite ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <ExportCard
          icon={FileSpreadsheet} colorClass="bg-gradient-to-br from-[#059669] to-[#10B981]"
          title="Excel with Charts"
          desc={<span>Download Advanced Excel report with <span className="text-[#7C3AED] font-bold">EMBEDDED CHARTS</span></span>}
          loading={loadingKey === 'excel'}
          onClick={() => handleExport('excel')}
        />
        <ExportCard
          icon={FileText} colorClass="bg-gradient-to-br from-[#7C3AED] to-indigo-700"
          title="PDF with Charts"
          desc={<span>Download A4 PDF report with summary, charts, and <span className="text-[#7C3AED] font-bold">LEDGER LOGS</span></span>}
          loading={loadingKey === 'pdf'}
          onClick={() => handleExport('pdf')}
        />
        <ExportCard
          icon={Sparkles} colorClass="bg-gradient-to-br from-amber-500 to-orange-600"
          title="Analytics Report"
          desc={<span>Download Executive dashboard PDF with <span className="text-[#7C3AED] font-bold">AI INSIGHTS</span></span>}
          loading={loadingKey === 'analytics'}
          onClick={() => handleExport('analytics')}
        />
        <ExportCard
          icon={FileSpreadsheet} colorClass="bg-gradient-to-br from-slate-700 to-slate-900"
          title="Filtered CSV Data"
          desc={<span>Download records in CSV format with <span className="text-[#7C3AED] font-bold">ANALYTICS METADATA</span></span>}
          loading={loadingKey === 'csv'}
          onClick={() => handleExport('csv')}
        />
      </div>

      {/* Hidden export charts generator (Glassmorphism Styled Off-Screen Canvas DOM Node) */}
      {exportRecords && exportStats && (
        <div 
          ref={exportChartsRef}
          style={{ 
            position: 'absolute', 
            left: '-9999px', 
            top: '-9999px', 
            width: '1000px', 
            background: '#ffffff', 
            padding: '40px',
            fontFamily: 'sans-serif'
          }}
        >
          <div style={{ padding: '20px', background: '#F8FAFC', borderRadius: '16px', marginBottom: '24px', border: '1px solid #E2E8F0' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1E1B4B', margin: 0 }}>Milk Quality Decision Hub Analytics Canvas</h1>
            <p style={{ fontSize: '10px', color: '#64748B', margin: '4px 0 0 0' }}>Captured dynamically on {new Date().toLocaleString()}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px' }}>
            
            {/* 1. Accepted vs Rejected Pie Chart */}
            <div id="chart-pie" style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '12px', fontWeight: 'bold', color: '#1E1B4B', textTransform: 'uppercase', letterSpacing: '1px' }}>Accepted vs Rejected Ratio</h4>
              <PieChart width={420} height={240}>
                <Pie
                  data={[
                    { name: 'Accepted', value: exportStats.acceptedVolume },
                    { name: 'Rejected', value: exportStats.rejectedVolume }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#EF4444" />
                </Pie>
              </PieChart>
            </div>

            {/* 2. Morning vs Evening Shift Comparison Bar Chart */}
            <div id="chart-bar" style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '12px', fontWeight: 'bold', color: '#1E1B4B', textTransform: 'uppercase', letterSpacing: '1px' }}>Shift Volume Comparison (Liters)</h4>
              <BarChart
                width={420}
                height={240}
                data={[
                  { name: 'Morning Shift', value: exportStats.morningVolume },
                  { name: 'Evening Shift', value: exportStats.eveningVolume }
                ]}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Bar dataKey="value" fill="#6366F1" radius={[8, 8, 0, 0]}>
                  <Cell fill="#6366F1" />
                  <Cell fill="#F59E0B" />
                </Bar>
              </BarChart>
            </div>

            {/* 3. Milk Collection Trend Area Chart */}
            <div id="chart-area" style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '12px', fontWeight: 'bold', color: '#1E1B4B', textTransform: 'uppercase', letterSpacing: '1px' }}>Milk Collection Volume Trend (Liters)</h4>
              <AreaChart
                width={420}
                height={240}
                data={getTrendData(exportRecords)}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="exportColorAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0E74B8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0E74B8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="total" stroke="#0E74B8" strokeWidth={3} fillOpacity={1} fill="url(#exportColorAcc)" />
              </AreaChart>
            </div>

            {/* 4. Fraud Risk Donut Chart */}
            <div id="chart-donut" style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '12px', fontWeight: 'bold', color: '#1E1B4B', textTransform: 'uppercase', letterSpacing: '1px' }}>Supply Chain Risk Distribution</h4>
              <PieChart width={420} height={240}>
                <Pie
                  data={[
                    { name: 'Low Risk', value: exportStats.fraudLow },
                    { name: 'Med Risk', value: exportStats.fraudMedium },
                    { name: 'High Risk', value: exportStats.fraudHigh }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#F59E0B" />
                  <Cell fill="#EF4444" />
                </Pie>
              </PieChart>
            </div>

            {/* 5. Fat & SNF Consistency Line Chart */}
            <div id="chart-line" style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '12px', fontWeight: 'bold', color: '#1E1B4B', textTransform: 'uppercase', letterSpacing: '1px' }}>Fat & SNF Quality Consistency Trend</h4>
              <LineChart
                width={420}
                height={240}
                data={getTrendData(exportRecords)}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="avgFat" name="Fat (%)" stroke="#F59E0B" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="avgSnf" name="SNF (%)" stroke="#6366F1" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </div>

            {/* 6. Parameter Compliance Heatmap */}
            <div id="chart-heatmap" style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '12px', fontWeight: 'bold', color: '#1E1B4B', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Quality Compliance Matrix Heatmap</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(6, 1fr)', gap: '6px', fontWeight: 'bold', borderBottom: '2px solid #E2E8F0', paddingBottom: '6px', fontSize: '10px', color: '#475569' }}>
                <div>Farmer</div>
                <div style={{ textAlign: 'center' }}>Fat</div>
                <div style={{ textAlign: 'center' }}>SNF</div>
                <div style={{ textAlign: 'center' }}>pH</div>
                <div style={{ textAlign: 'center' }}>Acid</div>
                <div style={{ textAlign: 'center' }}>Temp</div>
                <div style={{ textAlign: 'center' }}>Grav</div>
              </div>
              {exportRecords.slice(0, 7).map((r, idx) => {
                const getCellColor = (val, min, max, isMaxOnly = false) => {
                  if (val === undefined || val === null) return { bg: '#F1F5F9', text: '#64748B' };
                  if (isMaxOnly) {
                    return val <= max ? { bg: '#DEF7EC', text: '#03543F' } : { bg: '#FDE8E8', text: '#9B1C1C' };
                  }
                  return (val >= min && val <= max) ? { bg: '#DEF7EC', text: '#03543F' } : { bg: '#FDE8E8', text: '#9B1C1C' };
                };
                const fatCell = getCellColor(r.fat, 3.2, 3.5);
                const snfCell = getCellColor(r.snf, 8.3, 8.5);
                const phCell = getCellColor(r.ph, 6.5, 6.8);
                const acidityCell = getCellColor(r.acidity, 0.10, 0.15);
                const tempCell = getCellColor(r.temperature, 0, 15, true);
                const gravityCell = getCellColor(r.specific_gravity, 1.028, 1.032);

                return (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '100px repeat(6, 1fr)', gap: '6px', paddingTop: '6px', borderBottom: '1px solid #F1F5F9', fontSize: '9px', alignItems: 'center' }}>
                    <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.farmer_name}</div>
                    <div style={{ textAlign: 'center', padding: '3px', borderRadius: '4px', background: fatCell.bg, color: fatCell.text, fontWeight: 'bold' }}>{r.fat?.toFixed(1)}</div>
                    <div style={{ textAlign: 'center', padding: '3px', borderRadius: '4px', background: snfCell.bg, color: snfCell.text, fontWeight: 'bold' }}>{r.snf?.toFixed(1)}</div>
                    <div style={{ textAlign: 'center', padding: '3px', borderRadius: '4px', background: phCell.bg, color: phCell.text, fontWeight: 'bold' }}>{r.ph?.toFixed(1)}</div>
                    <div style={{ textAlign: 'center', padding: '3px', borderRadius: '4px', background: acidityCell.bg, color: acidityCell.text, fontWeight: 'bold' }}>{r.acidity?.toFixed(2)}</div>
                    <div style={{ textAlign: 'center', padding: '3px', borderRadius: '4px', background: tempCell.bg, color: tempCell.text, fontWeight: 'bold' }}>{r.temperature?.toFixed(0)}</div>
                    <div style={{ textAlign: 'center', padding: '3px', borderRadius: '4px', background: gravityCell.bg, color: gravityCell.text, fontWeight: 'bold' }}>{r.specific_gravity?.toFixed(3)}</div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
