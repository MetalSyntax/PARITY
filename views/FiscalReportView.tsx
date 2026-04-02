import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Filter, Receipt, TrendingUp, TrendingDown, Calendar, FileText, ChevronRight, Check } from 'lucide-react';
import { Transaction, TransactionType, Language, Currency, Account } from '../types';
import { getTranslation } from '../i18n';
import { CurrencyAmount } from '../components/CurrencyAmount';
import { formatAmount } from '../utils/formatUtils';
import { calculateFiscalYearSummary } from '../utils/forecast';

interface FiscalReportViewProps {
  transactions: Transaction[];
  accounts: Account[];
  lang: Language;
  onBack: () => void;
  exchangeRate: number;
  euroRate?: number;
  displayCurrency: Currency;
  isBalanceVisible: boolean;
}

export const FiscalReportView: React.FC<FiscalReportViewProps> = ({
  transactions,
  accounts,
  lang,
  onBack,
  exchangeRate,
  euroRate,
  displayCurrency,
  isBalanceVisible
}) => {
  const t = (key: any) => getTranslation(lang, key);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [filter, setFilter] = useState<'ALL' | 'TAXABLE' | 'DEDUCTIBLE'>('ALL');

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentYear);
    transactions.forEach(tx => years.add(new Date(tx.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  const reportData = useMemo(() => {
    const summary = calculateFiscalYearSummary(transactions, selectedYear);
    
    const taxableItems = summary.items.filter(t => t.fiscalTag === 'TAXABLE_INCOME');
    const deductibleItems = summary.items.filter(t => t.fiscalTag === 'DEDUCTIBLE_EXPENSE');

    return {
      taxableIncome: summary.taxableIncome,
      deductibleExpense: summary.deductibleExpense,
      netTaxable: summary.netTaxable,
      taxableItems,
      deductibleItems,
      allFiscalItems: summary.items.sort((a, b) => b.date.localeCompare(a.date))
    };
  }, [transactions, selectedYear]);

  const displayedItems = useMemo(() => {
    if (filter === 'TAXABLE') return reportData.taxableItems;
    if (filter === 'DEDUCTIBLE') return reportData.deductibleItems;
    return reportData.allFiscalItems;
  }, [reportData, filter]);

  const handleExportCSV = () => {
    try {
      const headers = [t('date'), t('note'), t('type'), 'USD', 'VES'];
      const rows = displayedItems.map(tx => [
        new Date(tx.date).toLocaleDateString(),
        tx.note || t('noNote'),
        tx.fiscalTag === 'TAXABLE_INCOME' ? t('taxable') : t('deductible'),
        tx.normalizedAmountUSD.toFixed(2),
        (tx.normalizedAmountUSD * exchangeRate).toFixed(2)
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Parity_Fiscal_Report_${selectedYear}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("CSV export failed", error);
      alert("Export failed.");
    }
  };

  const handleExport = () => {
    try {
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF();
      
      // Indigo theme color
      const indigo = [99, 102, 241];
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(indigo[0], indigo[1], indigo[2]);
      doc.text("PARITY", 14, 20);
      
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text(`${t('fiscalReport')} - ${selectedYear}`, 14, 30);
      
      // Horizontal Line
      doc.setDrawColor(230, 230, 230);
      doc.line(14, 35, 196, 35);
      
      // Summary Box
      doc.setFillColor(245, 247, 255);
      doc.rect(14, 40, 182, 35, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(indigo[0], indigo[1], indigo[2]);
      doc.setFont(undefined, 'bold');
      doc.text(t('netTaxable').toUpperCase(), 20, 50);
      
      doc.setFontSize(16);
      doc.text(`$ ${reportData.netTaxable.toFixed(2)}`, 20, 60);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`≈ Bs. ${(reportData.netTaxable * exchangeRate).toLocaleString()}`, 20, 68);
      
      // Sub-metrics
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`${t('taxableIncome')}: $ ${reportData.taxableIncome.toFixed(2)}`, 100, 50);
      doc.text(`${t('deductibleExpense')}: $ ${reportData.deductibleExpense.toFixed(2)}`, 100, 60);
      
      // Table
      const tableData = displayedItems.map(tx => [
        new Date(tx.date).toLocaleDateString(),
        tx.note || t('noNote'),
        tx.fiscalTag === 'TAXABLE_INCOME' ? t('taxable') : t('deductible'),
        `$ ${tx.normalizedAmountUSD.toFixed(2)}`,
        `Bs. ${(tx.normalizedAmountUSD * exchangeRate).toFixed(2)}`
      ]);
      
      (doc as any).autoTable({
        startY: 85,
        head: [[t('date'), t('note'), t('type'), 'USD', 'VES']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: indigo, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { top: 85 },
        styles: { fontSize: 8, cellPadding: 4 }
      });
      
      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated by Parity App - ${new Date().toLocaleString()}`, 14, 285);
        doc.text(`Page ${i} of ${pageCount}`, 180, 285);
      }

      doc.save(`Parity_Fiscal_Report_${selectedYear}.pdf`);
      
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("Export failed. Ensure you are online to load the export library.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-theme-bg">
      {/* Header */}
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-2 bg-white/5 rounded-full text-theme-secondary hover:text-theme-primary transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black text-theme-primary uppercase tracking-tight">{t('fiscalReport')}</h1>
          <div className="flex gap-2">
            <button 
                onClick={handleExportCSV} 
                className="p-2 bg-theme-brand/5 text-theme-secondary rounded-full hover:bg-theme-brand/10 hover:text-theme-brand transition-colors border border-white/5"
                title="Export CSV"
            >
                <Filter size={18} />
            </button>
            <button 
                onClick={handleExport} 
                className="p-2 bg-theme-brand/10 text-theme-brand rounded-full hover:bg-theme-brand/20 transition-colors"
                title="Export PDF"
            >
                <Download size={20} />
            </button>
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedYear === year ? 'bg-theme-brand text-white shadow-lg shadow-brand/20' : 'bg-theme-surface text-theme-secondary border border-white/5'}`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-10">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-theme-surface p-6 rounded-[2rem] border border-white/5 shadow-xl relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
               <div>
                  <p className="text-[10px] font-black text-theme-secondary uppercase tracking-widest opacity-40 mb-1">{t('netTaxable')}</p>
                  <div className="flex items-baseline gap-2">
                    <CurrencyAmount
                      amount={reportData.netTaxable}
                      exchangeRate={exchangeRate}
                      euroRate={euroRate}
                      displayCurrency={displayCurrency}
                      isBalanceVisible={isBalanceVisible}
                      size="xl"
                      weight="black"
                    />
                  </div>
               </div>
               <div className="bg-theme-brand/10 p-3 rounded-2xl text-theme-brand">
                  <FileText size={24} />
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
                <div>
                   <p className="text-[9px] font-black text-theme-secondary uppercase tracking-tighter opacity-40 mb-1">{t('taxableIncome')}</p>
                   <div className="flex items-center gap-1.5 text-emerald-400">
                      <TrendingUp size={12} />
                      <CurrencyAmount
                        amount={reportData.taxableIncome}
                        exchangeRate={exchangeRate}
                        euroRate={euroRate}
                        displayCurrency={displayCurrency}
                        isBalanceVisible={isBalanceVisible}
                        size="xs"
                        weight="bold"
                      />
                   </div>
                </div>
                <div>
                   <p className="text-[9px] font-black text-theme-secondary uppercase tracking-tighter opacity-40 mb-1">{t('deductibleExpense')}</p>
                   <div className="flex items-center gap-1.5 text-blue-400">
                      <TrendingDown size={12} />
                      <CurrencyAmount
                        amount={reportData.deductibleExpense}
                        exchangeRate={exchangeRate}
                        euroRate={euroRate}
                        displayCurrency={displayCurrency}
                        isBalanceVisible={isBalanceVisible}
                        size="xs"
                        weight="bold"
                      />
                   </div>
                </div>
            </div>
          </motion.div>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-theme-surface p-1 rounded-2xl border border-white/5 mb-6">
           {(['ALL', 'TAXABLE', 'DEDUCTIBLE'] as const).map(f => (
             <button
               key={f}
               onClick={() => setFilter(f)}
               className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filter === f ? 'bg-theme-bg text-theme-primary shadow-sm' : 'text-theme-secondary opacity-50'}`}
             >
               {f === 'ALL' ? t('all') : f === 'TAXABLE' ? t('taxable') : t('deductible')}
             </button>
           ))}
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-theme-secondary uppercase tracking-[0.2em] mb-4 opacity-50 px-2">{t('taggedTransactions')}</h3>
          {displayedItems.length > 0 ? (
            displayedItems.map(tx => (
              <div key={tx.id} className="bg-theme-surface p-4 rounded-2xl border border-white/5 flex items-center gap-4 group hover:border-theme-soft transition-colors">
                 <div className={`p-3 rounded-xl ${tx.type === TransactionType.INCOME ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    {tx.type === TransactionType.INCOME ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-theme-primary truncate">{tx.note || t('noNote')}</p>
                    <p className="text-[10px] text-theme-secondary font-medium opacity-60">
                      {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {tx.fiscalTag === 'TAXABLE_INCOME' ? t('taxable') : t('deductible')}
                    </p>
                 </div>
                 <div className="text-right">
                    <CurrencyAmount
                      amount={tx.normalizedAmountUSD}
                      exchangeRate={exchangeRate}
                      euroRate={euroRate}
                      displayCurrency={displayCurrency}
                      isBalanceVisible={isBalanceVisible}
                      size="sm"
                      weight="black"
                    />
                    <p className="text-[9px] font-black text-theme-secondary opacity-40 uppercase">{accounts.find(a => a.id === tx.accountId)?.currency}</p>
                 </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-theme-surface rounded-[2rem] border border-dashed border-white/10">
               <Receipt size={40} className="mx-auto text-theme-secondary opacity-20 mb-4" />
               <p className="text-xs font-bold text-theme-secondary opacity-40 uppercase tracking-widest">{t('noTaggedTransactions')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
