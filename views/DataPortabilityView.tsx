import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Filter, Wallet, ChevronDown, X,
  Upload, CloudUpload, GitBranch, ShieldCheck, ArrowRight,
  TrendingUp, TrendingDown, Share2, FileDown, FileUp, FileText,
  FileJson, FileSpreadsheet, ArrowLeft
} from 'lucide-react';
import { Transaction, Account, Currency, Language, TransactionType, UserProfile } from '../types';
import { getTranslation } from '../i18n';
import { CATEGORIES } from '../constants';

type DataTab = 'EXPORT' | 'IMPORT' | 'REPORT';
type ExportFormat = 'CSV' | 'JSON';
type ImportMode = 'JSON_BACKUP' | 'CSV_EXTERNAL';
type CategoryFilter = 'INCOME' | 'EXPENSES' | 'TRANSFERS';

interface ColumnMapping {
  csvColumn: string;
  targetField: 'date' | 'amount' | 'category' | 'note' | 'skip';
  preview: string;
}

const TARGET_FIELDS = ['date', 'amount', 'category', 'note', 'skip'] as const;

export interface DataPortabilityViewProps {
  initialTab?: DataTab;
  transactions: Transaction[];
  accounts: Account[];
  profile: UserProfile;
  lang: Language;
  exchangeRate: number;
  euroRate?: number;
  displayCurrency: Currency;
  isBalanceVisible: boolean;
  onImportData: (data: any) => void;
  onImportTransactions?: (txs: Partial<Transaction>[]) => void;
  onBack?: () => void;
}

export const DataPortabilityView: React.FC<DataPortabilityViewProps> = ({
  initialTab = 'EXPORT',
  transactions,
  accounts,
  profile,
  lang,
  exchangeRate,
  isBalanceVisible,
  onImportData,
  onImportTransactions,
  onBack,
}) => {
  const t = (key: any) => getTranslation(lang, key);
  const [activeTab, setActiveTab] = useState<DataTab>(initialTab);

  // ── Export state ──────────────────────────────────────────────────────────
  const [format, setFormat] = useState<ExportFormat>('CSV');
  const [currency, setCurrency] = useState<'USD' | 'VES' | 'EUR'>('USD');
  const [selectedCategories, setSelectedCategories] = useState<CategoryFilter[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('ALL');
  const [isExporting, setIsExporting] = useState(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);

  // ── Import state ──────────────────────────────────────────────────────────
  const [importMode, setImportMode] = useState<ImportMode>('JSON_BACKUP');
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvFileRows, setCsvFileRows] = useState(0);
  const [csvFileSize, setCsvFileSize] = useState('');
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [deduplication, setDeduplication] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [rawData, setRawData] = useState<string[][]>([]);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const triggerDownload = (href: string, name: string) => {
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toggleCategory = (cat: CategoryFilter) =>
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );

  const categoryLabels: Record<CategoryFilter, string> = {
    INCOME: t('income'),
    EXPENSES: t('expenses'),
    TRANSFERS: t('transfer'),
  };

  // ── Export logic (ported from ProfileView) ───────────────────────────────
  const getFilteredTransactions = () => {
    let filtered = [...transactions];
    if (dateFrom) filtered = filtered.filter(tx => tx.date >= dateFrom);
    if (dateTo) filtered = filtered.filter(tx => tx.date <= dateTo);
    if (selectedWallet !== 'ALL') filtered = filtered.filter(tx => tx.accountId === selectedWallet);
    return filtered;
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const filtered = getFilteredTransactions();
      const headers = [
        t('csv_id'), t('csv_date'), t('csv_type'), t('csv_amount'),
        t('csv_currency'), t('csv_category'), t('csv_account'),
        t('csv_note'), t('csv_exchangeRate'), t('csv_usdEquivalent'),
      ];
      const rows = filtered.map(tx => {
        const accName = accounts.find(a => a.id === tx.accountId)?.name || t('unknown') || 'Unknown';
        return [
          tx.id,
          new Date(tx.date).toLocaleDateString(),
          tx.type,
          tx.amount,
          tx.originalCurrency,
          tx.category,
          accName,
          `"${(tx.note || '').replace(/"/g, '""')}"`,
          tx.exchangeRate,
          tx.normalizedAmountUSD.toFixed(2),
        ].join(',');
      });
      const csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n' + rows.join('\n');
      triggerDownload(csvContent, `parity_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    setIsExporting(true);
    try {
      const backup = {
        version: 3,
        date: new Date().toISOString(),
        userProfile: profile,
        accounts,
        transactions,
      };
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
      triggerDownload(dataStr, `parity_backup_${new Date().toISOString().split('T')[0]}.json`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    if (format === 'CSV') handleExportCSV();
    else handleExportJSON();
  };

  // ── JSON Backup import ────────────────────────────────────────────────────
  const handleJsonFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string);
        onImportData(data);
        setImportSuccess(file.name);
      } catch {
        setImportSuccess(null);
      }
    };
    reader.readAsText(file);
  };

  // ── CSV external import ───────────────────────────────────────────────────
  const handleCsvFile = (file: File) => {
    setCsvFileName(file.name);
    setCsvFileSize(`${(file.size / 1024 / 1024).toFixed(1)} MB`);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const lines = text.trim().split('\n');
      setCsvFileRows(lines.length - 1);
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const firstRow = lines[1]?.split(',').map(c => c.replace(/"/g, '').trim()) || [];
      setRawData(lines.slice(1).map(l => l.split(',').map(c => c.replace(/"/g, '').trim())));
      setMappings(headers.map((h, i) => {
        const lh = h.toLowerCase();
        let targetField: ColumnMapping['targetField'] = 'skip';
        if (lh.includes('date')) targetField = 'date';
        else if (lh.includes('amount') || lh.includes('value') || lh.includes('monto') || lh.includes('valor')) targetField = 'amount';
        else if (lh.includes('merchant') || lh.includes('description') || lh.includes('category') || lh.includes('categoria')) targetField = 'category';
        else if (lh.includes('note') || lh.includes('memo') || lh.includes('nota')) targetField = 'note';
        return { csvColumn: h, targetField, preview: firstRow[i] || '' };
      }));
    };
    reader.readAsText(file);
  };

  const handleCommit = async () => {
    if (!onImportTransactions || rawData.length === 0) return;
    setIsImporting(true);
    const dateIdx = mappings.findIndex(m => m.targetField === 'date');
    const amountIdx = mappings.findIndex(m => m.targetField === 'amount');
    const categoryIdx = mappings.findIndex(m => m.targetField === 'category');
    const noteIdx = mappings.findIndex(m => m.targetField === 'note');
    const txs: Partial<Transaction>[] = rawData
      .filter(row => row.length > 0)
      .map(row => {
        const amount = parseFloat((row[amountIdx] || '0').replace(/[^0-9.-]/g, '')) || 0;
        return {
          id: `imp_${Date.now()}${Math.random()}`,
          date: row[dateIdx] ? new Date(row[dateIdx]).toISOString() : new Date().toISOString(),
          normalizedAmountUSD: Math.abs(amount),
          type: amount < 0 ? TransactionType.EXPENSE : TransactionType.INCOME,
          category: row[categoryIdx] || 'misc',
          note: row[noteIdx] || '',
          currency: 'USD' as any,
          amount: Math.abs(amount),
          exchangeRateAtTime: 1,
          amountInOriginalCurrency: Math.abs(amount),
        };
      });
    onImportTransactions(txs);
    setIsImporting(false);
    setCsvFileName(null);
    setRawData([]);
    setMappings([]);
    setImportSuccess(`${txs.length} transactions`);
  };

  const mappedCount = mappings.filter(m => m.targetField !== 'skip').length;

  // ── Report computation ────────────────────────────────────────────────────
  const now = new Date();
  const monthName = now.toLocaleString(
    lang === 'es' ? 'es' : lang === 'pt' ? 'pt' : 'en',
    { month: 'long' }
  );
  const year = now.getFullYear();

  const report = useMemo(() => {
    const month = now.getMonth();
    const monthly = transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const totalIncome = monthly
      .filter(tx => tx.type === TransactionType.INCOME)
      .reduce((s, tx) => s + tx.normalizedAmountUSD, 0);
    const totalExpense = monthly
      .filter(tx => tx.type === TransactionType.EXPENSE)
      .reduce((s, tx) => s + tx.normalizedAmountUSD, 0);
    const byCategory = monthly
      .filter(tx => tx.type === TransactionType.EXPENSE)
      .reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.normalizedAmountUSD;
        return acc;
      }, {} as Record<string, number>);
    const topCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([catId, amount]) => {
        const cat = CATEGORIES.find(c => c.id === catId);
        return { id: catId, name: cat ? t(cat.name) : catId, amount };
      });
    const allMonthly = [...monthly].sort((a, b) => b.date.localeCompare(a.date));
    const recent = allMonthly.slice(0, 6);
    return {
      totalIncome,
      totalExpense,
      netFlow: totalIncome - totalExpense,
      topCategories,
      maxCatAmount: topCategories[0]?.amount || 1,
      recent,
      allMonthly,
    };
  }, [transactions, year]);

  const fmt = (n: number) => isBalanceVisible ? `$${n.toFixed(2)}` : '••••••';
  const fmtSigned = (n: number) =>
    isBalanceVisible ? `${n >= 0 ? '+' : '-'}$${Math.abs(n).toFixed(2)}` : '••••••';

  const handleDownloadPdf = () => {
    try {
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF();
      const blue: [number, number, number] = [43, 108, 238];
      const grey: [number, number, number] = [100, 100, 100];
      const lightGrey: [number, number, number] = [150, 150, 150];

      // ── Header ──────────────────────────────────────────────────────────────
      doc.setFontSize(22);
      doc.setTextColor(...blue);
      doc.setFont(undefined, 'bold');
      doc.text('PARITY', 14, 20);

      doc.setFontSize(13);
      doc.setTextColor(...grey);
      doc.setFont(undefined, 'normal');
      doc.text(`${t('financialSummaryReport')} — ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`, 14, 30);

      if (profile?.name) {
        doc.setFontSize(9);
        doc.setTextColor(...lightGrey);
        doc.text(profile.name, 14, 37);
      }

      doc.setDrawColor(220, 220, 220);
      doc.line(14, 43, 196, 43);

      // ── Summary box ─────────────────────────────────────────────────────────
      doc.setFillColor(240, 245, 255);
      doc.roundedRect(14, 48, 182, 38, 3, 3, 'F');

      doc.setFontSize(8);
      doc.setTextColor(...blue);
      doc.setFont(undefined, 'bold');
      doc.text(t('netFlow').toUpperCase(), 20, 58);

      const netColor: [number, number, number] = report.netFlow >= 0 ? [16, 185, 129] : [239, 68, 68];
      doc.setFontSize(16);
      doc.setTextColor(...netColor);
      doc.text(`${report.netFlow >= 0 ? '+' : ''}$ ${report.netFlow.toFixed(2)}`, 20, 68);

      doc.setFontSize(9);
      doc.setTextColor(...lightGrey);
      doc.text(`≈ Bs. ${(Math.abs(report.netFlow) * exchangeRate).toFixed(0)}`, 20, 76);

      doc.setFontSize(8);
      doc.setTextColor(...grey);
      doc.setFont(undefined, 'normal');
      doc.text(`${t('totalIncomeLabel')}: $ ${report.totalIncome.toFixed(2)}`, 110, 58);
      doc.text(`${t('totalExpenses')}: $ ${report.totalExpense.toFixed(2)}`, 110, 68);
      doc.setTextColor(...lightGrey);
      doc.text(t('compiledByParity'), 110, 76);

      // ── Top categories ───────────────────────────────────────────────────────
      if (report.topCategories.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(40, 40, 40);
        doc.setFont(undefined, 'bold');
        doc.text(t('topCategories'), 14, 100);

        (doc as any).autoTable({
          startY: 104,
          head: [[t('category'), 'USD', '%']],
          body: report.topCategories.map(cat => [
            cat.name,
            `$ ${cat.amount.toFixed(2)}`,
            report.totalExpense > 0 ? `${((cat.amount / report.totalExpense) * 100).toFixed(1)}%` : '0%',
          ]),
          theme: 'striped',
          headStyles: { fillColor: blue, textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 250, 255] },
          styles: { fontSize: 9, cellPadding: 4 },
          columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
        });
      }

      // ── Transactions table ───────────────────────────────────────────────────
      const tableY = (doc as any).lastAutoTable?.finalY
        ? (doc as any).lastAutoTable.finalY + 12
        : 104;

      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.setFont(undefined, 'bold');
      doc.text(t('recentTransactions'), 14, tableY);

      (doc as any).autoTable({
        startY: tableY + 4,
        head: [[t('date'), t('description'), t('type'), 'USD']],
        body: report.allMonthly.map(tx => {
          const cat = CATEGORIES.find(c => c.id === tx.category);
          return [
            new Date(tx.date).toLocaleDateString(),
            tx.note || (cat ? t(cat.name) : tx.category),
            tx.type === TransactionType.INCOME ? t('income') : t('expense'),
            `${tx.type === TransactionType.INCOME ? '+' : '-'}$ ${tx.normalizedAmountUSD.toFixed(2)}`,
          ];
        }),
        theme: 'striped',
        headStyles: { fillColor: blue, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 255] },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: { 3: { halign: 'right' } },
      });

      // ── Footer ───────────────────────────────────────────────────────────────
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...lightGrey);
        doc.setFont(undefined, 'normal');
        doc.text(`${t('generated_by')} Parity App — ${new Date().toLocaleString()}`, 14, 285);
        doc.text(`${t('page')} ${i} ${t('of')} ${pageCount}`, 180, 285);
      }

      doc.save(`Parity_Report_${monthName}_${year}.pdf`);
    } catch (error) {
      console.error('PDF generation failed', error);
    }
  };

  const tabs: { id: DataTab; label: string; icon: React.ReactNode }[] = [
    { id: 'EXPORT', label: t('exportData'), icon: <FileDown size={13} /> },
    { id: 'IMPORT', label: t('importData'), icon: <FileUp size={13} /> },
    { id: 'REPORT', label: t('pdfReport'), icon: <FileText size={13} /> },
  ];

  return (
    <div className="h-full flex flex-col bg-theme-bg overflow-y-auto no-scrollbar px-6 py-6 pb-24 animate-in slide-in-from-right duration-300 w-full max-w-2xl md:max-w-5xl lg:max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="p-2 bg-theme-surface border border-white/5 rounded-full text-theme-secondary hover:text-theme-primary transition-colors"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <div>
          <h1 className="text-xl font-bold text-theme-primary">{t('exportCenter')}</h1>
          <p className="text-sm text-theme-secondary opacity-60">{t('exportCenterSubtitle')}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-theme-surface rounded-2xl p-1 mb-5 border border-white/5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === tab.id
                ? 'bg-theme-bg text-theme-primary shadow-sm'
                : 'text-theme-secondary hover:text-theme-primary'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── EXPORT TAB ─────────────────────────────────────────────────────── */}
        {activeTab === 'EXPORT' && (
          <motion.div
            key="export"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            {/* Format selector */}
            <div className="bg-theme-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
              <h2 className="text-base font-black text-theme-primary mb-4">{t('exportData')}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormat('CSV')}
                  className={`flex-1 py-3 rounded-full text-sm font-black transition-all flex items-center justify-center gap-2 ${format === 'CSV' ? 'bg-theme-brand text-white shadow-lg' : 'bg-theme-surface text-theme-secondary border-white/10 hover:border-white/20'}`}
                >
                  <FileSpreadsheet size={14} /> CSV
                </button>
                <button
                  onClick={() => setFormat('JSON')}
                  className={`flex-1 py-3 rounded-full text-sm font-black transition-all flex items-center justify-center gap-2 ${format === 'JSON' ? 'bg-theme-brand text-white shadow-lg' : 'bg-theme-surface text-theme-secondary border-white/10 hover:border-white/20'}`}
                >
                  <FileJson size={14} /> JSON
                </button>
              </div>
              <p className="text-[10px] text-theme-secondary mt-3 leading-relaxed opacity-70">
                {format === 'CSV' ? t('csvFormatDesc') : t('jsonFormatDesc')}
              </p>
            </div>

            {/* Filters */}
            <div className={`bg-theme-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl space-y-5 relative ${isWalletDropdownOpen ? 'z-50' : 'z-10'}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-theme-primary">{t('filters')}</h2>
                <Filter size={15} className="text-theme-secondary" />
              </div>

              {/* Date range */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest">{t('dateRange')}</label>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="bg-theme-surface rounded-2xl px-4 py-3 border border-white/10 flex items-center">
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="bg-transparent text-[11px] text-theme-secondary outline-none w-full"
                      />
                    </div>
                    <span className="text-[10px] font-black text-theme-secondary uppercase tracking-widest block px-4 opacity-60">{t('from')}</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="bg-theme-surface rounded-2xl px-4 py-3 border border-white/10 flex items-center">
                      <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="bg-transparent text-[11px] text-theme-secondary outline-none w-full"
                      />
                    </div>
                    <span className="text-[10px] font-black text-theme-secondary uppercase tracking-widest block px-4 opacity-60">{t('to')}</span>
                  </div>
                </div>
              </div>

              {/* Wallet */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest px-1">{t('wallet')}</label>
                <div className="relative">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
                    className="w-full bg-theme-surface border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-theme-primary outline-none focus:border-theme-brand/40 flex items-center justify-between transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Wallet size={16} className="text-theme-brand flex-shrink-0" />
                      <span className="truncate">
                        {selectedWallet === 'ALL' ? t('allWallets') : accounts.find(a => a.id === selectedWallet)?.name || selectedWallet}
                      </span>
                    </div>
                    <ChevronDown size={14} className={`text-theme-secondary transition-transform duration-300 ${isWalletDropdownOpen ? 'rotate-180' : ''}`} />
                  </motion.button>

                  <AnimatePresence>
                    {isWalletDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-[60]" 
                          onClick={() => setIsWalletDropdownOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute top-full mt-2 left-0 right-0 bg-theme-surface border border-white/10 rounded-2xl shadow-2xl z-[70] overflow-hidden"
                        >
                          <div className="max-h-[240px] overflow-y-auto no-scrollbar py-2">
                            <button
                              onClick={() => {
                                setSelectedWallet('ALL');
                                setIsWalletDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 text-xs font-black transition-colors hover:bg-white/5 ${selectedWallet === 'ALL' ? 'text-theme-brand bg-white/5' : 'text-theme-secondary'}`}
                            >
                              {t('allWallets')}
                            </button>
                            <div className="h-[px] bg-white/5 my-1" />
                            {accounts.map(acc => (
                              <button
                                key={acc.id}
                                onClick={() => {
                                  setSelectedWallet(acc.id);
                                  setIsWalletDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors hover:bg-white/5 ${selectedWallet === acc.id ? 'text-theme-brand bg-white/5' : 'text-theme-secondary hover:text-theme-primary'}`}
                              >
                                {acc.name}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest">{t('category')}</label>
                <div className="flex flex-wrap gap-2">
                  {(['INCOME', 'EXPENSES', 'TRANSFERS'] as CategoryFilter[]).map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-4 py-2 rounded-full text-[11px] font-black flex items-center gap-1 transition-all ${selectedCategories.includes(cat) ? 'bg-theme-surface text-theme-brand' : 'bg-theme-surface text-theme-secondary'}`}
                    >
                      {categoryLabels[cat]}
                      {selectedCategories.includes(cat) && <X size={10} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Currency base (only for CSV) */}
            {format === 'CSV' && (
              <div className="bg-theme-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                <h2 className="text-base font-black text-theme-primary mb-4">{t('currencyBase')}</h2>
                <div className="bg-theme-surface rounded-full p-1 flex relative">
                  <div
                    className="absolute top-1 bottom-1 w-[32%] bg-theme-bg border border-white/10 rounded-full shadow-inner pointer-events-none transition-all duration-300"
                    style={{ left: currency === 'USD' ? '4px' : currency === 'VES' ? 'calc(33.33% + 2px)' : 'calc(66.66% + 2px)' }}
                  />
                  {(['USD', 'VES', 'EUR'] as const).map(c => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={`flex-1 py-2 text-sm font-black z-10 transition-colors ${currency === c ? 'text-theme-primary' : 'text-theme-secondary'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Generate */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleExport}
              disabled={isExporting || transactions.length === 0}
              className="w-full bg-theme-brand text-white rounded-full py-4 font-black text-base shadow-[0_0_20px_rgba(43,108,238,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download size={18} />
              {isExporting ? t('generating') : `${t('generateExport')}`}
            </motion.button>
          </motion.div>
        )}

        {/* ── IMPORT TAB ─────────────────────────────────────────────────────── */}
        {activeTab === 'IMPORT' && (
          <motion.div
            key="import"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            {/* Import mode selector */}
            <div className="flex gap-2 bg-theme-surface rounded-2xl p-1 border border-white/5">
              {([
                { id: 'JSON_BACKUP' as ImportMode, icon: <FileJson size={13} />, label: t('jsonBackup') },
                { id: 'CSV_EXTERNAL' as ImportMode, icon: <FileSpreadsheet size={13} />, label: t('csvExternal') },
              ]).map(m => (
                <button
                  key={m.id}
                  onClick={() => { setImportMode(m.id); setImportSuccess(null); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black ${importMode === m.id ? 'bg-theme-bg text-theme-primary shadow-sm' : 'text-theme-secondary hover:text-theme-primary'}`}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>

            {/* Success message */}
            {importSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <ShieldCheck size={16} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-emerald-400">{importMode === 'JSON_BACKUP' ? t('backupRestored') : t('importComplete')}</p>
                  <p className="text-[11px] text-theme-secondary">{importSuccess}</p>
                </div>
              </div>
            )}

            {/* JSON Backup mode */}
            {importMode === 'JSON_BACKUP' && (
              <div className="bg-theme-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                <h3 className="text-base font-black text-theme-primary mb-1 flex items-center gap-2">
                  <FileJson size={16} className="text-theme-brand" /> {t('restoreData')}
                </h3>
                <p className="text-[11px] text-theme-secondary mb-5 opacity-70">
                  {t('selectBackupDesc')}
                </p>
                <motion.label
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  htmlFor="json-import"
                  className="w-full py-5 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-theme-brand/40 hover:bg-theme-brand/5 transition-all"
                >
                  <div className="w-14 h-14 rounded-full bg-theme-surface flex items-center justify-center">
                    <Upload size={22} className="text-theme-secondary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-theme-primary">{t('restoreData')}</p>
                    <p className="text-[11px] text-theme-secondary mt-1">parity_backup_*.json</p>
                  </div>
                </motion.label>
                <input
                  id="json-import"
                  ref={jsonInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleJsonFile(f); }}
                />
              </div>
            )}

            {/* CSV External mode */}
            {importMode === 'CSV_EXTERNAL' && (
              <>
                {/* Drop zone */}
                <div className="bg-theme-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden group">
                  <h3 className="text-base font-black text-theme-primary mb-4 flex items-center gap-2">
                    <Upload size={16} className="text-theme-brand" /> {t('sourceFile')}
                  </h3>
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleCsvFile(f); }}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${isDragging ? 'border-theme-brand/60 bg-theme-brand/5' : 'border-white/20 bg-theme-surface/30 hover:bg-theme-surface/50'}`}
                  >
                    <div className="w-14 h-14 rounded-full bg-theme-surface flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <CloudUpload size={24} className="text-theme-secondary group-hover:text-theme-brand transition-colors" />
                    </div>
                    <p className="text-sm font-bold text-theme-primary mb-1">{t('dragDropCsv')}</p>
                    <p className="text-[11px] text-theme-secondary mb-5">{t('maxFileSizeDesc')}</p>
                    <button
                      onClick={() => csvInputRef.current?.click()}
                      className="bg-theme-brand text-white font-black py-3 px-6 rounded-full transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(43,108,238,0.4)] hover:opacity-90"
                    >
                      {t('browseFiles')}
                    </button>
                    <input
                      ref={csvInputRef}
                      type="file"
                      accept=".csv,.xls,.xlsx"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleCsvFile(f); }}
                      className="hidden"
                    />
                  </div>

                  {csvFileName && (
                    <div className="mt-4 p-3 rounded-2xl bg-theme-surface border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-theme-brand/20 flex items-center justify-center">
                          <FileSpreadsheet size={14} className="text-theme-brand" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-theme-primary">{csvFileName}</p>
                          <p className="text-[11px] text-theme-secondary">{csvFileSize} • {csvFileRows} {t('rowsDetected')}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setCsvFileName(null); setRawData([]); setMappings([]); }}
                        className="text-theme-secondary hover:text-red-400 transition-colors p-1 rounded-full"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Column mapping (only when file loaded) */}
                {mappings.length > 0 && (
                  <div className="bg-theme-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-base font-black text-theme-primary flex items-center gap-2">
                          <GitBranch size={16} className="text-emerald-400" /> {t('dataMapping')}
                        </h3>
                        <p className="text-[11px] text-theme-secondary mt-0.5">{t('dataMappingDesc')}</p>
                      </div>
                      <div className="px-3 py-1 bg-theme-surface rounded-full border border-white/10 text-[11px] text-theme-secondary font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {mappedCount}/{mappings.length} {t('mapped')}
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-white/10 bg-theme-surface/50">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-theme-surface border-b border-white/10">
                            <th className="p-3 text-[10px] font-black text-theme-secondary uppercase tracking-widest w-1/3">{t('csvColumn')}</th>
                            <th className="p-3 w-8" />
                            <th className="p-3 text-[10px] font-black text-theme-secondary uppercase tracking-widest w-1/3">{t('targetField')}</th>
                            <th className="p-3 text-[10px] font-black text-theme-secondary uppercase tracking-widest">{t('preview')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {mappings.map((mapping, i) => (
                            <tr key={i} className="hover:bg-theme-surface/50 transition-colors">
                              <td className="p-3">
                                <div className="px-3 py-1.5 bg-theme-surface rounded-lg border border-white/10 text-sm font-bold text-theme-primary inline-block">
                                  {mapping.csvColumn}
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <ArrowRight size={12} className="text-theme-secondary" />
                              </td>
                              <td className="p-3">
                                <div className="relative">
                                  <select
                                    value={mapping.targetField}
                                    onChange={e => {
                                      const nm = [...mappings];
                                      nm[i].targetField = e.target.value as ColumnMapping['targetField'];
                                      setMappings(nm);
                                    }}
                                    className="w-full appearance-none bg-theme-surface border border-white/10 text-theme-primary text-sm rounded-lg pl-3 pr-7 py-2 outline-none focus:border-theme-brand/40"
                                  >
                                    {TARGET_FIELDS.map(f => (
                                      <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                                    ))}
                                  </select>
                                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-theme-secondary pointer-events-none" />
                                </div>
                              </td>
                              <td className="p-3 text-sm text-theme-secondary font-mono truncate max-w-[80px]">{mapping.preview}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Smart deduplication */}
                <div className="bg-theme-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-theme-surface border border-white/10 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={18} className="text-theme-brand" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-black text-theme-primary mb-1">{t('smartDeduplication')}</h4>
                    <p className="text-[11px] text-theme-secondary mb-3">{t('smartDeduplicationDesc')}</p>
                    <div
                      onClick={() => setDeduplication(d => !d)}
                      className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${deduplication ? 'bg-theme-brand' : 'bg-theme-surface border border-white/20'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${deduplication ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                </div>

                {/* Commit */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCommit}
                  disabled={isImporting || !csvFileName || rawData.length === 0}
                  className="w-full bg-gradient-to-r from-theme-brand to-blue-400 text-white rounded-full py-4 font-black text-base shadow-[0_0_20px_rgba(43,108,238,0.4)] flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
                >
                  {isImporting ? t('importing') : t('commitImport')}
                  <ArrowRight size={16} />
                </motion.button>
              </>
            )}
          </motion.div>
        )}

        {/* ── REPORT TAB ─────────────────────────────────────────────────────── */}
        {activeTab === 'REPORT' && (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            {transactions.length === 0 ? (
              <div className="bg-theme-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-12 shadow-2xl flex flex-col items-center justify-center text-center">
                <FileText size={40} className="text-theme-secondary opacity-30 mb-4" />
                <p className="text-base font-black text-theme-primary mb-1">{t('noTransactions')}</p>
                <p className="text-sm text-theme-secondary opacity-60">{t('noTransactionsReport')}</p>
              </div>
            ) : (
              <>
                {/* Document card */}
                <div className="bg-theme-surface/50 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="p-5 border-b border-white/10 flex justify-between items-center bg-theme-surface/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-theme-brand flex items-center justify-center">
                        <span className="font-black text-white text-sm">P</span>
                      </div>
                      <div>
                        <h2 className="text-base font-black text-theme-primary">{t('financialSummaryReport')}</h2>
                        <p className="text-[11px] text-theme-secondary capitalize">{monthName} {year} — {t('compiledByParity')}</p>
                      </div>
                    </div>
                    <span className="text-theme-brand font-black text-[10px] uppercase tracking-widest">{t('confidential')}</span>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Summary grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-theme-surface/60 border border-white/5 p-4 rounded-xl relative overflow-hidden">
                        <div className="absolute -right-3 -top-3 w-14 h-14 bg-emerald-500/10 rounded-full blur-xl" />
                        <div className="flex items-center gap-1 text-theme-secondary text-[10px] mb-2 font-semibold">
                          <TrendingDown size={10} className="text-emerald-400" />
                          <span>{t('totalIncomeLabel')}</span>
                        </div>
                        <span className="text-base font-black text-theme-primary block">{fmt(report.totalIncome)}</span>
                      </div>
                      <div className="bg-theme-surface/60 border border-white/5 p-4 rounded-xl relative overflow-hidden">
                        <div className="absolute -right-3 -top-3 w-14 h-14 bg-orange-500/10 rounded-full blur-xl" />
                        <div className="flex items-center gap-1 text-theme-secondary text-[10px] mb-2 font-semibold">
                          <TrendingUp size={10} className="text-orange-400" />
                          <span>{t('totalExpenses')}</span>
                        </div>
                        <span className="text-base font-black text-theme-primary block">{fmt(report.totalExpense)}</span>
                      </div>
                      <div className="bg-theme-brand/10 p-4 rounded-xl">
                        <span className="text-theme-secondary text-[10px] mb-2 block font-semibold">{t('netFlow')}</span>
                        <span className={`text-base font-black block ${report.netFlow >= 0 ? 'text-theme-brand' : 'text-red-400'}`}>
                          {fmtSigned(report.netFlow)}
                        </span>
                      </div>
                    </div>

                    {/* Top categories */}
                    {report.topCategories.length > 0 && (
                      <div className="bg-theme-surface/60 border border-white/5 p-4 rounded-xl">
                        <h3 className="text-sm font-black text-theme-primary mb-3">{t('topCategories')}</h3>
                        <div className="space-y-3">
                          {report.topCategories.map((cat, i) => {
                            const barColors = ['bg-theme-brand', 'bg-orange-500', 'bg-emerald-500', 'bg-purple-500', 'bg-yellow-500'];
                            return (
                              <div key={cat.id}>
                                <div className="flex justify-between mb-1">
                                  <span className="text-theme-secondary text-[11px]">{cat.name}</span>
                                  <span className="text-theme-primary font-bold text-[11px]">{fmt(cat.amount)}</span>
                                </div>
                                <div className="w-full bg-theme-surface h-1.5 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(cat.amount / report.maxCatAmount) * 100}%` }}
                                    transition={{ duration: 0.6, delay: i * 0.08 }}
                                    className={`${barColors[i % barColors.length]} h-full rounded-full`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Recent transactions */}
                    {report.recent.length > 0 && (
                      <div className="bg-theme-surface/60 border border-white/5 p-4 rounded-xl">
                        <h3 className="text-sm font-black text-theme-primary mb-3">{t('recentTransactions')}</h3>
                        <div className="overflow-x-auto -mx-1">
                          <table className="w-full text-left min-w-[300px]">
                            <thead className="border-b border-white/10">
                              <tr>
                                <th className="pb-2 text-[10px] font-black text-theme-secondary">{t('date')}</th>
                                <th className="pb-2 text-[10px] font-black text-theme-secondary">{t('note')}</th>
                                <th className="pb-2 text-[10px] font-black text-theme-secondary text-right">{t('amount')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {report.recent.map(tx => {
                                const cat = CATEGORIES.find(c => c.id === tx.category);
                                return (
                                  <tr key={tx.id} className="hover:bg-theme-surface/50 transition-colors">
                                    <td className="py-2 text-theme-secondary text-[10px]">{new Date(tx.date).toLocaleDateString()}</td>
                                    <td className="py-2 font-bold text-[10px] truncate max-w-[120px] text-theme-primary">
                                      {tx.note || (cat ? t(cat.name) : tx.category)}
                                    </td>
                                    <td className={`py-2 text-right font-bold text-[10px] ${tx.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-theme-primary'}`}>
                                      {tx.type === TransactionType.INCOME ? '+' : '-'}{fmt(tx.normalizedAmountUSD)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center py-1">
                      <div className="w-10 h-0.5 bg-white/10 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (navigator.share) {
                        await navigator.share({
                          title: t('financialSummaryReport'),
                          text: `${t('totalIncomeLabel')}: ${fmt(report.totalIncome)} | ${t('totalExpenses')}: ${fmt(report.totalExpense)} | ${t('netFlow')}: ${fmtSigned(report.netFlow)}`,
                        });
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-theme-surface text-theme-primary py-4 px-5 rounded-full font-black text-sm border border-white/10 hover:bg-theme-surface/80 transition-colors shadow-lg"
                  >
                    <Share2 size={16} /> {t('shareReport')}
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleDownloadPdf}
                    className="flex-1 flex items-center justify-center gap-2 bg-theme-brand text-white py-2 px-2 rounded-full font-black text-sm shadow-[0_0_20px_rgba(43,108,238,0.4)] transition-all"
                  >
                    <Download size={16} /> {t('downloadPdf')}
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
