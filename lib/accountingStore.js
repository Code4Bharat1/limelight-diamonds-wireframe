'use client';
import { create } from 'zustand';

// Initial Chart of Accounts (Ledgers)
const INITIAL_LEDGERS = [
  // Capital & Reserves
  { id: 'led_1', name: 'Vikram Shah (Capital A/c)', group: 'Capital Account', type: 'Cr', openingBalance: 2500000, currentBalance: 2500000, gstin: '', city: 'Pune' },
  { id: 'led_2', name: 'General Reserve', group: 'Reserves & Surplus', type: 'Cr', openingBalance: 450000, currentBalance: 450000, gstin: '', city: 'Pune' },
  
  // Bank Accounts & Cash
  { id: 'led_3', name: 'HDFC Bank Current A/c', group: 'Bank Accounts', type: 'Dr', openingBalance: 820000, currentBalance: 820000, bankDetails: { accNo: '50200012345678', ifsc: 'HDFC0001234', branch: 'Shivajinagar, Pune' } },
  { id: 'led_4', name: 'SBI Current A/c', group: 'Bank Accounts', type: 'Dr', openingBalance: 410000, currentBalance: 410000, bankDetails: { accNo: '30495867201', ifsc: 'SBIN0000456', branch: 'FC Road, Pune' } },
  { id: 'led_5', name: 'Cash Account', group: 'Cash-in-hand', type: 'Dr', openingBalance: 125000, currentBalance: 125000 },
  { id: 'led_6', name: 'Petty Cash A/c', group: 'Cash-in-hand', type: 'Dr', openingBalance: 15000, currentBalance: 15000 },

  // Sundry Debtors (Customers)
  { id: 'led_7', name: 'Aurum Fine Jewellers', group: 'Sundry Debtors', type: 'Dr', openingBalance: 320000, currentBalance: 320000, gstin: '27AAACT0001G1Z1', city: 'Pune', state: 'Maharashtra' },
  { id: 'led_8', name: 'Sparkle Bridal House', group: 'Sundry Debtors', type: 'Dr', openingBalance: 185000, currentBalance: 185000, gstin: '27AABCM0001H1Z3', city: 'Mumbai', state: 'Maharashtra' },
  { id: 'led_9', name: 'Heritage Jewels', group: 'Sundry Debtors', type: 'Dr', openingBalance: 240000, currentBalance: 240000, gstin: '29AACCK0001N1ZK', city: 'Bangalore', state: 'Karnataka' },
  { id: 'led_10', name: 'Lumière Luxury Retail', group: 'Sundry Debtors', type: 'Dr', openingBalance: 480000, currentBalance: 480000, gstin: '27AAAPG0001P1Z2', city: 'Pune', state: 'Maharashtra' },
  { id: 'led_11', name: 'The Grand Palace Hotel Boutique', group: 'Sundry Debtors', type: 'Dr', openingBalance: 95000, currentBalance: 95000, gstin: '27AAAGH0001Q1ZS', city: 'Pune', state: 'Maharashtra' },
  { id: 'led_12', name: 'Ms. Aditi Kulkarni (Retail)', group: 'Sundry Debtors', type: 'Dr', openingBalance: 160000, currentBalance: 160000, gstin: '27AAACI0001L1ZR', city: 'Pune', state: 'Maharashtra' },

  // Sundry Creditors (Suppliers)
  { id: 'led_13', name: 'Shree Gems Exports', group: 'Sundry Creditors', type: 'Cr', openingBalance: 420000, currentBalance: 420000, gstin: '27AAECP9010N1Z2', city: 'Mumbai', state: 'Maharashtra' },
  { id: 'led_14', name: 'Antwerp Rough Traders', group: 'Sundry Creditors', type: 'Cr', openingBalance: 280000, currentBalance: 280000, gstin: '27AAACH1234M1Z5', city: 'Pune', state: 'Maharashtra' },
  { id: 'led_15', name: 'GreenLab Diamonds Pvt Ltd', group: 'Sundry Creditors', type: 'Cr', openingBalance: 310000, currentBalance: 310000, gstin: '09AADCS1234L1ZP', city: 'Noida', state: 'Uttar Pradesh' },
  { id: 'led_16', name: 'Royal Gold Castings', group: 'Sundry Creditors', type: 'Cr', openingBalance: 145000, currentBalance: 145000, gstin: '27AAACP0001Q1ZM', city: 'Pune', state: 'Maharashtra' },
  { id: 'led_17', name: 'Premium Jewel Packaging', group: 'Sundry Creditors', type: 'Cr', openingBalance: 520000, currentBalance: 520000, gstin: '27AAACE0001R1Z7', city: 'Nashik', state: 'Maharashtra' },

  // Duties & Taxes
  { id: 'led_18', name: 'Output CGST @ 9%', group: 'Duties & Taxes', type: 'Cr', openingBalance: 45000, currentBalance: 45000 },
  { id: 'led_19', name: 'Output SGST @ 9%', group: 'Duties & Taxes', type: 'Cr', openingBalance: 45000, currentBalance: 45000 },
  { id: 'led_20', name: 'Output IGST @ 18%', group: 'Duties & Taxes', type: 'Cr', openingBalance: 32000, currentBalance: 32000 },
  { id: 'led_21', name: 'Input CGST @ 9%', group: 'Duties & Taxes', type: 'Dr', openingBalance: 38000, currentBalance: 38000 },
  { id: 'led_22', name: 'Input SGST @ 9%', group: 'Duties & Taxes', type: 'Dr', openingBalance: 38000, currentBalance: 38000 },
  { id: 'led_23', name: 'Input IGST @ 18%', group: 'Duties & Taxes', type: 'Dr', openingBalance: 25000, currentBalance: 25000 },
  { id: 'led_24', name: 'TDS Payable (Sec 194C/194J)', group: 'Duties & Taxes', type: 'Cr', openingBalance: 18000, currentBalance: 18000 },

  // Sales & Purchases
  { id: 'led_25', name: 'Sales Account (Domestic @ 18%)', group: 'Sales Accounts', type: 'Cr', openingBalance: 0, currentBalance: 0 },
  { id: 'led_26', name: 'Sales Account (Inter-State @ 18%)', group: 'Sales Accounts', type: 'Cr', openingBalance: 0, currentBalance: 0 },
  { id: 'led_27', name: 'Purchase Account (Domestic @ 18%)', group: 'Purchase Accounts', type: 'Dr', openingBalance: 0, currentBalance: 0 },
  { id: 'led_28', name: 'Purchase Account (Inter-State @ 18%)', group: 'Purchase Accounts', type: 'Dr', openingBalance: 0, currentBalance: 0 },

  // Direct Expenses
  { id: 'led_29', name: 'Freight Inward & Carriage', group: 'Direct Expenses', type: 'Dr', openingBalance: 28000, currentBalance: 28000 },
  { id: 'led_30', name: 'Warehouse Power & Electricity', group: 'Direct Expenses', type: 'Dr', openingBalance: 42000, currentBalance: 42000 },
  { id: 'led_31', name: 'Loading & Unloading Charges', group: 'Direct Expenses', type: 'Dr', openingBalance: 16000, currentBalance: 16000 },

  // Indirect Expenses
  { id: 'led_32', name: 'Staff Salaries & Wages', group: 'Indirect Expenses', type: 'Dr', openingBalance: 275000, currentBalance: 275000 },
  { id: 'led_33', name: 'Warehouse Godown Rent', group: 'Indirect Expenses', type: 'Dr', openingBalance: 85000, currentBalance: 85000 },
  { id: 'led_34', name: 'Office Administration & Tea Expenses', group: 'Indirect Expenses', type: 'Dr', openingBalance: 12500, currentBalance: 12500 },
  { id: 'led_35', name: 'Bank Interest & Service Charges', group: 'Indirect Expenses', type: 'Dr', openingBalance: 6400, currentBalance: 6400 },
  { id: 'led_36', name: 'Depreciation on Warehouse Equipment', group: 'Indirect Expenses', type: 'Dr', openingBalance: 35000, currentBalance: 35000 },

  // Fixed Assets
  { id: 'led_37', name: 'Warehouse Building & Godown', group: 'Fixed Assets', type: 'Dr', openingBalance: 1800000, currentBalance: 1800000 },
  { id: 'led_38', name: 'Forklifts & Material Handling Equip', group: 'Fixed Assets', type: 'Dr', openingBalance: 320000, currentBalance: 320000 },
  { id: 'led_39', name: 'Computers & Barcode Scanners', group: 'Fixed Assets', type: 'Dr', openingBalance: 140000, currentBalance: 140000 },

  // Indirect Income
  { id: 'led_40', name: 'Discount Received from Suppliers', group: 'Indirect Incomes', type: 'Cr', openingBalance: 14500, currentBalance: 14500 },
  { id: 'led_41', name: 'Interest on Bank Fixed Deposit', group: 'Indirect Incomes', type: 'Cr', openingBalance: 22000, currentBalance: 22000 },
];

// Initial Realistic Tally Vouchers
const INITIAL_VOUCHERS = [
  {
    id: 'vch_1',
    voucherNo: 'SAL/25-26/001',
    type: 'Sales',
    date: '2026-08-02',
    refNo: 'PO-TM-8891',
    narration: 'Being electrical wire and MCB switches supplied to Tata Motors Pune Plant against PO-TM-8891',
    entries: [
      { ledgerId: 'led_7', ledgerName: 'Aurum Fine Jewellers', type: 'Dr', amount: 141600 },
      { ledgerId: 'led_25', ledgerName: 'Sales Account (Domestic @ 18%)', type: 'Cr', amount: 120000 },
      { ledgerId: 'led_18', ledgerName: 'Output CGST @ 9%', type: 'Cr', amount: 10800 },
      { ledgerId: 'led_19', ledgerName: 'Output SGST @ 9%', type: 'Cr', amount: 10800 },
    ],
    totalAmount: 141600,
  },
  {
    id: 'vch_2',
    voucherNo: 'PUR/25-26/001',
    type: 'Purchase',
    date: '2026-08-04',
    refNo: 'INV-POL-5542',
    narration: 'Being copper wires 4mm and conduits purchased from Shree Gems Exports Mumbai',
    entries: [
      { ledgerId: 'led_27', ledgerName: 'Purchase Account (Domestic @ 18%)', type: 'Dr', amount: 200000 },
      { ledgerId: 'led_21', ledgerName: 'Input CGST @ 9%', type: 'Dr', amount: 18000 },
      { ledgerId: 'led_22', ledgerName: 'Input SGST @ 9%', type: 'Dr', amount: 18000 },
      { ledgerId: 'led_13', ledgerName: 'Shree Gems Exports', type: 'Cr', amount: 236000 },
    ],
    totalAmount: 236000,
  },
  {
    id: 'vch_3',
    voucherNo: 'RCP/25-26/001',
    type: 'Receipt',
    date: '2026-08-08',
    refNo: 'NEFT-TM-9923',
    narration: 'Being RTGS payment received from Aurum Fine Jewellers against pending bills',
    entries: [
      { ledgerId: 'led_3', ledgerName: 'HDFC Bank Current A/c', type: 'Dr', amount: 200000 },
      { ledgerId: 'led_7', ledgerName: 'Aurum Fine Jewellers', type: 'Cr', amount: 200000 },
    ],
    totalAmount: 200000,
  },
  {
    id: 'vch_4',
    voucherNo: 'PAY/25-26/001',
    type: 'Payment',
    date: '2026-08-10',
    refNo: 'CHQ-55201',
    narration: 'Being supplier payment made to Shree Gems Exports via HDFC Bank Cheque',
    entries: [
      { ledgerId: 'led_13', ledgerName: 'Shree Gems Exports', type: 'Dr', amount: 150000 },
      { ledgerId: 'led_3', ledgerName: 'HDFC Bank Current A/c', type: 'Cr', amount: 150000 },
    ],
    totalAmount: 150000,
  },
  {
    id: 'vch_5',
    voucherNo: 'SAL/25-26/002',
    type: 'Sales',
    date: '2026-08-14',
    refNo: 'PO-PMC-441',
    narration: 'Being street LED panel lights and distribution boxes supplied to Lumière Luxury Retail',
    entries: [
      { ledgerId: 'led_10', ledgerName: 'Lumière Luxury Retail', type: 'Dr', amount: 212400 },
      { ledgerId: 'led_25', ledgerName: 'Sales Account (Domestic @ 18%)', type: 'Cr', amount: 180000 },
      { ledgerId: 'led_18', ledgerName: 'Output CGST @ 9%', type: 'Cr', amount: 16200 },
      { ledgerId: 'led_19', ledgerName: 'Output SGST @ 9%', type: 'Cr', amount: 16200 },
    ],
    totalAmount: 212400,
  },
  {
    id: 'vch_6',
    voucherNo: 'CNT/25-26/001',
    type: 'Contra',
    date: '2026-08-16',
    refNo: 'CSH-DEP-01',
    narration: 'Being cash deposited into HDFC Bank Current Account from warehouse counter collections',
    entries: [
      { ledgerId: 'led_3', ledgerName: 'HDFC Bank Current A/c', type: 'Dr', amount: 50000 },
      { ledgerId: 'led_5', ledgerName: 'Cash Account', type: 'Cr', amount: 50000 },
    ],
    totalAmount: 50000,
  },
  {
    id: 'vch_7',
    voucherNo: 'JNL/25-26/001',
    type: 'Journal',
    date: '2026-08-20',
    refNo: 'ADJ-SAL-AUG',
    narration: 'Being warehouse staff salaries provided for the current cycle',
    entries: [
      { ledgerId: 'led_32', ledgerName: 'Staff Salaries & Wages', type: 'Dr', amount: 65000 },
      { ledgerId: 'led_3', ledgerName: 'HDFC Bank Current A/c', type: 'Cr', amount: 65000 },
    ],
    totalAmount: 65000,
  },
  {
    id: 'vch_8',
    voucherNo: 'PUR/25-26/002',
    type: 'Purchase',
    date: '2026-08-22',
    refNo: 'INV-EXD-998',
    narration: 'Being 150Ah Inverter Batteries supplied by Premium Jewel Packaging Nashik MIDC',
    entries: [
      { ledgerId: 'led_27', ledgerName: 'Purchase Account (Domestic @ 18%)', type: 'Dr', amount: 160000 },
      { ledgerId: 'led_21', ledgerName: 'Input CGST @ 9%', type: 'Dr', amount: 14400 },
      { ledgerId: 'led_22', ledgerName: 'Input SGST @ 9%', type: 'Dr', amount: 14400 },
      { ledgerId: 'led_17', ledgerName: 'Premium Jewel Packaging', type: 'Cr', amount: 188800 },
    ],
    totalAmount: 188800,
  },
];

// Diamond & Jewellery Stock Items for Tally Stock Summary
const INITIAL_STOCK_GROUPS = [
  {
    group: 'Loose Diamonds',
    items: [
      { name: 'Round Brilliant Solitaire 1.00ct VVS1 E', openingQty: 10, inwardQty: 5, outwardQty: 3, closingQty: 12, rate: 385000, unit: 'pcs', value: 4620000 },
      { name: 'Princess Cut Diamond 0.50ct VS1 F', openingQty: 24, inwardQty: 14, outwardQty: 10, closingQty: 28, rate: 98000, unit: 'pcs', value: 2744000 },
      { name: 'Melee Diamonds Parcel 1.2-1.5mm (10ct)', openingQty: 8, inwardQty: 3, outwardQty: 2, closingQty: 9, rate: 145000, unit: 'parcel', value: 1305000 },
    ],
  },
  {
    group: 'Lab-Grown Diamonds',
    items: [
      { name: 'Oval Lab-Grown Diamond 1.50ct VS2 G', openingQty: 30, inwardQty: 12, outwardQty: 8, closingQty: 34, rate: 72000, unit: 'pcs', value: 2448000 },
      { name: 'Emerald Cut Lab-Grown 2.00ct VVS2 F', openingQty: 6, inwardQty: 2, outwardQty: 4, closingQty: 4, rate: 115000, unit: 'pcs', value: 460000 },
    ],
  },
  {
    group: 'Rings & Bands',
    items: [
      { name: 'Classic Solitaire Engagement Ring 18K', openingQty: 20, inwardQty: 8, outwardQty: 6, closingQty: 22, rate: 145000, unit: 'pcs', value: 3190000 },
      { name: 'Halo Diamond Engagement Ring Platinum', openingQty: 10, inwardQty: 3, outwardQty: 4, closingQty: 9, rate: 210000, unit: 'pcs', value: 1890000 },
      { name: 'Eternity Band 1ct 18K Yellow Gold', openingQty: 16, inwardQty: 8, outwardQty: 6, closingQty: 18, rate: 88000, unit: 'pcs', value: 1584000 },
    ],
  },
  {
    group: 'Necklaces, Earrings & Bracelets',
    items: [
      { name: 'Diamond Tennis Necklace 5ct 18K White Gold', openingQty: 5, inwardQty: 1, outwardQty: 1, closingQty: 5, rate: 520000, unit: 'pcs', value: 2600000 },
      { name: 'Diamond Stud Earrings 0.50ct pair', openingQty: 28, inwardQty: 12, outwardQty: 9, closingQty: 31, rate: 62000, unit: 'pair', value: 1922000 },
      { name: 'Diamond Tennis Bracelet 3ct', openingQty: 10, inwardQty: 2, outwardQty: 1, closingQty: 11, rate: 265000, unit: 'pcs', value: 2915000 },
    ],
  },
  {
    group: 'Mounts & Packaging',
    items: [
      { name: '18K White Gold Solitaire Mount', openingQty: 50, inwardQty: 30, outwardQty: 16, closingQty: 64, rate: 18500, unit: 'pcs', value: 1184000 },
      { name: 'Velvet Ring Box (Emerald Green)', openingQty: 400, inwardQty: 200, outwardQty: 80, closingQty: 520, rate: 180, unit: 'pcs', value: 93600 },
    ],
  },
];

const STANDARD_GROUPS = [
  'Capital Account',
  'Reserves & Surplus',
  'Bank Accounts',
  'Cash-in-hand',
  'Sundry Debtors',
  'Sundry Creditors',
  'Duties & Taxes',
  'Sales Accounts',
  'Purchase Accounts',
  'Direct Expenses',
  'Indirect Expenses',
  'Direct Incomes',
  'Indirect Incomes',
  'Fixed Assets',
  'Current Assets',
  'Current Liabilities',
  'Loans (Liability)',
  'Investments',
  'Stock-in-hand',
];

const useAccountingStore = create((set, get) => ({
  companyName: 'Limelight Diamonds Pvt. Ltd.',
  financialYear: '1-Apr-2025 to 31-Mar-2026',
  currentDate: '2026-08-25',
  gstin: '27AAACD9988E1Z4',
  state: 'Maharashtra (27)',

  // Theme: 'tally-prime' (Azure modern) | 'tally-erp9' (Retro olive green) | 'modern-saas' (Clean tech)
  theme: 'tally-prime',

  // Active view: 'gateway' | 'vouchers' | 'balance-sheet' | 'pnl' | 'trial-balance' | 'day-book' | 'ledger-view' | 'stock-summary' | 'gst-reports' | 'ratio-analysis' | 'accounts-info'
  currentView: 'gateway',
  viewHistory: ['gateway'],
  activeLedgerId: 'led_3', // For ledger statement drill-down
  selectedVoucherType: 'Sales', // Default voucher type
  isDetailedView: true, // Alt+F1 toggle

  ledgers: INITIAL_LEDGERS,
  vouchers: INITIAL_VOUCHERS,
  stockGroups: INITIAL_STOCK_GROUPS,
  standardGroups: STANDARD_GROUPS,

  // Navigation & View Actions
  setView: (view, params = {}) => {
    const { viewHistory } = get();
    if (params.ledgerId) set({ activeLedgerId: params.ledgerId });
    if (params.voucherType) set({ selectedVoucherType: params.voucherType });
    set({
      currentView: view,
      viewHistory: [...viewHistory, view],
    });
  },

  goBack: () => {
    const { viewHistory } = get();
    if (viewHistory.length > 1) {
      const nextHistory = [...viewHistory];
      nextHistory.pop();
      const previousView = nextHistory[nextHistory.length - 1];
      set({ currentView: previousView, viewHistory: nextHistory });
    } else {
      set({ currentView: 'gateway' });
    }
  },

  setTheme: (theme) => set({ theme }),
  toggleDetailedView: () => set((state) => ({ isDetailedView: !state.isDetailedView })),
  setCurrentDate: (currentDate) => set({ currentDate }),

  // Voucher operations
  addVoucher: (newVoucher) => {
    const { vouchers, ledgers } = get();
    const voucherWithId = {
      ...newVoucher,
      id: `vch_${Date.now()}`,
      voucherNo: newVoucher.voucherNo || `${newVoucher.type.substring(0, 3).toUpperCase()}/25-26/${String(vouchers.length + 1).padStart(3, '0')}`,
      date: newVoucher.date || get().currentDate,
    };

    // Update ledger balances based on voucher entries
    const updatedLedgers = ledgers.map((ledger) => {
      const matchingEntries = voucherWithId.entries.filter((e) => e.ledgerId === ledger.id);
      if (matchingEntries.length === 0) return ledger;

      let balanceDelta = 0;
      matchingEntries.forEach((entry) => {
        if (ledger.type === 'Dr') {
          balanceDelta += entry.type === 'Dr' ? entry.amount : -entry.amount;
        } else {
          balanceDelta += entry.type === 'Cr' ? entry.amount : -entry.amount;
        }
      });

      return {
        ...ledger,
        currentBalance: ledger.currentBalance + balanceDelta,
      };
    });

    set({
      vouchers: [voucherWithId, ...vouchers],
      ledgers: updatedLedgers,
    });

    return voucherWithId;
  },

  deleteVoucher: (id) => {
    set((state) => ({
      vouchers: state.vouchers.filter((v) => v.id !== id),
    }));
  },

  // Master operations
  addLedger: (ledgerData) => {
    const newLedger = {
      ...ledgerData,
      id: `led_${Date.now()}`,
      currentBalance: Number(ledgerData.openingBalance || 0),
    };
    set((state) => ({
      ledgers: [...state.ledgers, newLedger],
    }));
    return newLedger;
  },

  // Calculations & Report Builders
  getClosingStockValue: () => {
    const { stockGroups } = get();
    return stockGroups.reduce((total, grp) => {
      return total + grp.items.reduce((sub, item) => sub + (item.closingQty * item.rate), 0);
    }, 0);
  },

  getOpeningStockValue: () => {
    const { stockGroups } = get();
    return stockGroups.reduce((total, grp) => {
      return total + grp.items.reduce((sub, item) => sub + (item.openingQty * item.rate), 0);
    }, 0);
  },

  // Comprehensive Trial Balance Data
  getTrialBalanceData: () => {
    const { ledgers, vouchers } = get();
    
    // Group totals
    const groupMap = {};

    ledgers.forEach((l) => {
      // Calculate debit & credit transactions from vouchers
      let debitTotal = l.type === 'Dr' ? l.openingBalance : 0;
      let creditTotal = l.type === 'Cr' ? l.openingBalance : 0;

      vouchers.forEach((v) => {
        v.entries.forEach((e) => {
          if (e.ledgerId === l.id) {
            if (e.type === 'Dr') debitTotal += Number(e.amount || 0);
            if (e.type === 'Cr') creditTotal += Number(e.amount || 0);
          }
        });
      });

      const netDebit = debitTotal > creditTotal ? debitTotal - creditTotal : 0;
      const netCredit = creditTotal > debitTotal ? creditTotal - debitTotal : 0;

      if (!groupMap[l.group]) {
        groupMap[l.group] = {
          groupName: l.group,
          totalDebit: 0,
          totalCredit: 0,
          ledgers: [],
        };
      }

      groupMap[l.group].totalDebit += netDebit;
      groupMap[l.group].totalCredit += netCredit;
      groupMap[l.group].ledgers.push({
        ...l,
        debit: netDebit,
        credit: netCredit,
      });
    });

    const groups = Object.values(groupMap);
    const totalDebit = groups.reduce((acc, g) => acc + g.totalDebit, 0);
    const totalCredit = groups.reduce((acc, g) => acc + g.totalCredit, 0);

    return { groups, totalDebit, totalCredit };
  },

  // Balance Sheet Data (Liabilities vs Assets)
  getBalanceSheetData: () => {
    const { ledgers, vouchers, getClosingStockValue, getProfitAndLossData } = get();
    const pnl = getProfitAndLossData();
    const closingStock = getClosingStockValue();

    const getGroupBalance = (groupName) => {
      let balance = 0;
      const groupLedgers = ledgers.filter((l) => l.group === groupName);
      groupLedgers.forEach((l) => {
        let dr = l.type === 'Dr' ? l.openingBalance : 0;
        let cr = l.type === 'Cr' ? l.openingBalance : 0;
        vouchers.forEach((v) => {
          v.entries.forEach((e) => {
            if (e.ledgerId === l.id) {
              if (e.type === 'Dr') dr += Number(e.amount || 0);
              if (e.type === 'Cr') cr += Number(e.amount || 0);
            }
          });
        });
        balance += (cr - dr); // Credit is positive for liabilities
      });
      return { balance, ledgers: groupLedgers };
    };

    const getAssetGroupBalance = (groupName) => {
      let balance = 0;
      const groupLedgers = ledgers.filter((l) => l.group === groupName);
      groupLedgers.forEach((l) => {
        let dr = l.type === 'Dr' ? l.openingBalance : 0;
        let cr = l.type === 'Cr' ? l.openingBalance : 0;
        vouchers.forEach((v) => {
          v.entries.forEach((e) => {
            if (e.ledgerId === l.id) {
              if (e.type === 'Dr') dr += Number(e.amount || 0);
              if (e.type === 'Cr') cr += Number(e.amount || 0);
            }
          });
        });
        balance += (dr - cr); // Debit is positive for assets
      });
      return { balance, ledgers: groupLedgers };
    };

    // Liabilities
    const capital = getGroupBalance('Capital Account');
    const reserves = getGroupBalance('Reserves & Surplus');
    const creditors = getGroupBalance('Sundry Creditors');
    const dutiesTaxes = getGroupBalance('Duties & Taxes');

    const totalLiabilities = 
      capital.balance + 
      reserves.balance + 
      creditors.balance + 
      dutiesTaxes.balance + 
      pnl.netProfit;

    // Assets
    const fixedAssets = getAssetGroupBalance('Fixed Assets');
    const debtors = getAssetGroupBalance('Sundry Debtors');
    const bank = getAssetGroupBalance('Bank Accounts');
    const cash = getAssetGroupBalance('Cash-in-hand');

    const totalAssets = 
      fixedAssets.balance + 
      debtors.balance + 
      bank.balance + 
      cash.balance + 
      closingStock;

    return {
      liabilities: {
        capital,
        reserves,
        creditors,
        dutiesTaxes,
        netProfit: pnl.netProfit,
        total: totalLiabilities,
      },
      assets: {
        fixedAssets,
        debtors,
        bank,
        cash,
        closingStock,
        total: totalAssets,
      },
      difference: totalAssets - totalLiabilities,
    };
  },

  // Profit & Loss Data (Trading Account + P&L)
  getProfitAndLossData: () => {
    const { ledgers, vouchers, getClosingStockValue, getOpeningStockValue } = get();
    const openingStock = getOpeningStockValue();
    const closingStock = getClosingStockValue();

    const calculateLedgerNet = (ledgerId, normalType) => {
      const l = ledgers.find((item) => item.id === ledgerId);
      if (!l) return 0;
      let dr = l.type === 'Dr' ? l.openingBalance : 0;
      let cr = l.type === 'Cr' ? l.openingBalance : 0;
      vouchers.forEach((v) => {
        v.entries.forEach((e) => {
          if (e.ledgerId === l.id) {
            if (e.type === 'Dr') dr += Number(e.amount || 0);
            if (e.type === 'Cr') cr += Number(e.amount || 0);
          }
        });
      });
      return normalType === 'Cr' ? (cr - dr) : (dr - cr);
    };

    // Sales Accounts
    const salesDomestic = calculateLedgerNet('led_25', 'Cr');
    const salesInterstate = calculateLedgerNet('led_26', 'Cr');
    const totalSales = salesDomestic + salesInterstate;

    // Purchase Accounts
    const purchaseDomestic = calculateLedgerNet('led_27', 'Dr');
    const purchaseInterstate = calculateLedgerNet('led_28', 'Dr');
    const totalPurchases = purchaseDomestic + purchaseInterstate;

    // Direct Expenses
    const directExpenses = ledgers
      .filter((l) => l.group === 'Direct Expenses')
      .map((l) => ({ ...l, amount: calculateLedgerNet(l.id, 'Dr') }));
    const totalDirectExpenses = directExpenses.reduce((sum, item) => sum + item.amount, 0);

    // Gross Profit
    const tradingIncome = totalSales + closingStock;
    const tradingExpense = openingStock + totalPurchases + totalDirectExpenses;
    const grossProfit = tradingIncome - tradingExpense;

    // Indirect Expenses
    const indirectExpenses = ledgers
      .filter((l) => l.group === 'Indirect Expenses')
      .map((l) => ({ ...l, amount: calculateLedgerNet(l.id, 'Dr') }));
    const totalIndirectExpenses = indirectExpenses.reduce((sum, item) => sum + item.amount, 0);

    // Indirect Income
    const indirectIncomes = ledgers
      .filter((l) => l.group === 'Indirect Incomes')
      .map((l) => ({ ...l, amount: calculateLedgerNet(l.id, 'Cr') }));
    const totalIndirectIncomes = indirectIncomes.reduce((sum, item) => sum + item.amount, 0);

    // Net Profit
    const netProfit = grossProfit + totalIndirectIncomes - totalIndirectExpenses;

    return {
      openingStock,
      totalPurchases,
      purchaseDomestic,
      purchaseInterstate,
      directExpenses,
      totalDirectExpenses,
      totalSales,
      salesDomestic,
      salesInterstate,
      closingStock,
      grossProfit,
      indirectExpenses,
      totalIndirectExpenses,
      indirectIncomes,
      totalIndirectIncomes,
      netProfit,
    };
  },

  // Single Ledger Statement
  getLedgerStatement: (ledgerId) => {
    const { ledgers, vouchers } = get();
    const ledger = ledgers.find((l) => l.id === ledgerId) || ledgers[0];
    if (!ledger) return null;

    let runningBalance = ledger.openingBalance;
    const transactions = [];

    vouchers
      .slice()
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach((v) => {
        const matching = v.entries.filter((e) => e.ledgerId === ledger.id);
        matching.forEach((entry) => {
          // Find the opposing ledger particulars
          const otherEntries = v.entries.filter((e) => e.ledgerId !== ledger.id);
          const particulars = otherEntries.map((o) => o.ledgerName).join(', ') || 'As per details';

          if (ledger.type === 'Dr') {
            runningBalance += (entry.type === 'Dr' ? entry.amount : -entry.amount);
          } else {
            runningBalance += (entry.type === 'Cr' ? entry.amount : -entry.amount);
          }

          transactions.push({
            id: `${v.id}_${entry.type}`,
            date: v.date,
            voucherNo: v.voucherNo,
            voucherType: v.type,
            particulars,
            debit: entry.type === 'Dr' ? entry.amount : null,
            credit: entry.type === 'Cr' ? entry.amount : null,
            runningBalance,
            narration: v.narration,
          });
        });
      });

    const totalDebit = transactions.reduce((acc, t) => acc + (t.debit || 0), 0);
    const totalCredit = transactions.reduce((acc, t) => acc + (t.credit || 0), 0);

    return {
      ledger,
      transactions,
      totalDebit,
      totalCredit,
      closingBalance: runningBalance,
    };
  },
}));

export default useAccountingStore;
