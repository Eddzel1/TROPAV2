import { Household, FamilyMember, DuesPayment, ContributionRate } from '../../types';
import { generateMonthRange, getMemberPaidMonths, getRateForMonth, getCurrentRate } from '../../lib/utils';

const MONTH_INITIALS = ['J','F','M','A','M','J','J','A','S','O','N','D'];
const MONTH_LABELS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const HH_PER_PAGE    = 5;

interface PaymentLedgerPrintProps {
  households:        Household[];
  members:           FamilyMember[];
  payments:          DuesPayment[];
  contributionRates: ContributionRate[];
  filterLabel?:      string;
}

export function printPaymentLedger({
  households,
  members,
  payments,
  contributionRates,
  filterLabel = 'All',
}: PaymentLedgerPrintProps) {
  const printWindow = window.open('', '_blank', 'width=950,height=1200');
  if (!printWindow) return;

  const now             = new Date();
  const currentYear     = now.getFullYear();
  const currentMonth    = now.getMonth() + 1;
  const currentMonthISO = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const today = now.toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const displayRate = getCurrentRate(contributionRates);

  // ── helpers ────────────────────────────────────────────────────────────────
  function getStartMonthStr(m: FamilyMember): string {
    if (m.membership_date) {
      const md = new Date(m.membership_date);
      if (!isNaN(md.getTime()))
        return `${md.getFullYear()}-${String(md.getMonth() + 1).padStart(2, '0')}`;
    }
    return currentMonthISO;
  }

  /**
   * Build 12 month cells (Jan–Dec current year).
   * ✓ = paid   □ = unpaid / due / future   - = before registration
   */
  function buildMonthCells(startMonthStr: string, paidMonths: Set<string>): string {
    const [startYear, startMonthNum] = startMonthStr.split('-').map(Number);

    return MONTH_INITIALS.map((_init, idx) => {
      const monthNum = idx + 1;
      const monthISO = `${currentYear}-${String(monthNum).padStart(2, '0')}`;

      const beforeReg = currentYear < startYear
        || (currentYear === startYear && monthNum < startMonthNum);
      const isPaid    = !beforeReg && paidMonths.has(monthISO);
      const isCurrent = monthNum === currentMonth;

      const curBorderL = isCurrent ? 'border-left:1.5px solid #000;' : '';
      const curBorderR = isCurrent ? 'border-right:1.5px solid #000;' : '';

      if (beforeReg) {
        return `<td class="mc" style="${curBorderL}${curBorderR}border-color:#ccc;"><span style="color:#bbb;font-size:11px;">-</span></td>`;
      } else if (isPaid) {
        return `<td class="mc mc-paid" style="${curBorderL}${curBorderR}" title="${MONTH_LABELS[idx]}"><span class="cb-check">&#10003;</span></td>`;
      } else {
        return `<td class="mc mc-due" style="${curBorderL}${curBorderR}" title="${MONTH_LABELS[idx]}"><span class="cb-box"></span></td>`;
      }
    }).join('');
  }

  // ── sort households alphabetically ────────────────────────────────────────
  const coopHouseholds = [...households]
    .filter(hh => members.some(m => m.household_id === hh.id && m.is_cooperative_member))
    .sort((a, b) => a.household_name.localeCompare(b.household_name));

  // ── month header row — reused in every page ───────────────────────────────
  const monthHeaders = MONTH_INITIALS.map((init, i) => {
    const isCurrent = (i + 1) === currentMonth;
    return `<th class="th-mo${isCurrent ? ' th-cur' : ''}" title="${MONTH_LABELS[i]}">${init}</th>`;
  }).join('');

  const theadHTML = `
    <thead>
      <tr>
        <th class="th-name">Member Name</th>
        ${monthHeaders}
        <th class="th-bal">Balance</th>
      </tr>
    </thead>`;

  // ── build rows ─────────────────────────────────────────────────────────────
  let grandExpected = 0;
  let grandPaid     = 0;

  function buildHouseholdRows(hh: Household): string {
    const coopMembers = members
      .filter(m => m.household_id === hh.id && m.is_cooperative_member)
      .sort((a, b) => {
        const la = `${a.lastname ?? ''}${a.firstname ?? ''}`.toUpperCase();
        const lb = `${b.lastname ?? ''}${b.firstname ?? ''}`.toUpperCase();
        return la.localeCompare(lb);
      });

    let hhExpected = 0;
    let hhPaid     = 0;

    const memberRows = coopMembers.map((m, mIdx) => {
      const lastName  = m.lastname?.toUpperCase() ?? '';
      const firstName = [m.firstname, m.middlename].filter(Boolean).join(' ');
      const ext       = m.extension ? ` ${m.extension}` : '';
      const fullName  = `${lastName}, ${firstName}${ext}`;

      const memberPayments = payments.filter(p => p.member_id === m.id);
      const paidMonths     = getMemberPaidMonths(memberPayments);
      const startMonthStr  = getStartMonthStr(m);

      const dueMonths  = generateMonthRange(startMonthStr, currentMonthISO);
      const unpaidDue  = dueMonths.filter(mo => !paidMonths.has(mo));
      const paidDue    = dueMonths.filter(mo =>  paidMonths.has(mo));

      const expectedAmt = dueMonths.reduce((s, mo) => s + getRateForMonth(contributionRates, mo), 0);
      const paidAmt     = paidDue.reduce((s, mo)   => s + getRateForMonth(contributionRates, mo), 0);
      const balAmt      = unpaidDue.reduce((s, mo)  => s + getRateForMonth(contributionRates, mo), 0);

      hhExpected += expectedAmt;
      hhPaid     += paidAmt;

      const monthCells = buildMonthCells(startMonthStr, paidMonths);
      const rowStyle   = mIdx % 2 === 1 ? 'background:#f7f7f7;' : '';
      const balStyle   = balAmt > 0 ? 'font-weight:700;' : 'color:#777;font-style:italic;';

      return `
        <tr style="${rowStyle}">
          <td class="name">${fullName}</td>
          ${monthCells}
          <td class="num" style="${balStyle}">₱${balAmt.toLocaleString()}</td>
        </tr>`;
    }).join('');

    const hhBalance = hhExpected - hhPaid;
    grandExpected  += hhExpected;
    grandPaid      += hhPaid;

    return `
      <tr class="hh-header">
        <td colspan="14">${hh.household_name}
          <span class="hh-loc">${hh.lgu} &middot; ${hh.barangay} &middot; Purok ${hh.purok}</span>
        </td>
      </tr>
      ${memberRows}
      <tr class="hh-total">
        <td style="text-align:right;padding-right:6px;font-size:9px;color:#555;">Household Total →</td>
        <td colspan="12"></td>
        <td class="num" style="font-weight:700;">₱${hhBalance.toLocaleString()}</td>
      </tr>`;
  }

  // ── chunk into pages ───────────────────────────────────────────────────────
  const chunks: Household[][] = [];
  for (let i = 0; i < coopHouseholds.length; i += HH_PER_PAGE) {
    chunks.push(coopHouseholds.slice(i, i + HH_PER_PAGE));
  }

  // Build all page bodies first (grand totals accumulate as side-effect)
  const pageBodyRows = chunks.map(chunk =>
    chunk.map(hh => buildHouseholdRows(hh)).join('')
  );

  const totalPages    = chunks.length;
  const grandBalance  = grandExpected - grandPaid;
  const coopMemberCt  = members.filter(m => m.is_cooperative_member && coopHouseholds.some(h => h.id === m.household_id)).length;

  // ── per-page header (repeated on every page) ──────────────────────────────
  function buildPageHeader(pageIdx: number): string {
    return `
      <div class="page-header">
        <div class="doc-title">TROPA &mdash; Monthly Collection Sheet &nbsp;${currentYear}</div>
        <p class="doc-sub">
          Printed: ${today}
          &nbsp;&nbsp;|&nbsp;&nbsp;Location: <strong>${filterLabel}</strong>
          &nbsp;&nbsp;|&nbsp;&nbsp;Rate: <strong>₱${displayRate}/member/month</strong> (as of ${currentMonthISO})
          &nbsp;&nbsp;|&nbsp;&nbsp;Page <strong>${pageIdx + 1}</strong> of <strong>${totalPages}</strong>
        </p>

        <div class="summary">
          <span><strong>${coopHouseholds.length}</strong><br/>Households</span>
          <span><strong>${coopMemberCt}</strong><br/>TROPA Members</span>
          <span><strong>₱${grandExpected.toLocaleString()}</strong><br/>Total Expected</span>
          <span><strong>₱${grandPaid.toLocaleString()}</strong><br/>Total Collected</span>
          <span class="bal"><strong>₱${grandBalance.toLocaleString()}</strong><br/>Outstanding</span>
        </div>

        <div class="legend">
          <strong>Legend:</strong>
          <span class="legend-item"><span class="cb-check-sm">&#10003;</span>&nbsp;Paid</span>
          <span class="legend-item"><span class="cb-box-sm"></span>&nbsp;Unpaid</span>
          <span class="legend-item" style="color:#999;"><em>-</em>&nbsp;Before registration</span>
          <span class="legend-item"><em>Italic header col</em>&nbsp;= current month</span>
        </div>
      </div>`;
  }

  const pageTables = pageBodyRows.map((bodyRows, pageIdx) => {
    const isLast    = pageIdx === chunks.length - 1;
    const pageBreak = !isLast ? 'page-break-after:always;' : '';

    return `
      <div style="${pageBreak}">
        ${buildPageHeader(pageIdx)}
        <table>
          ${theadHTML}
          <tbody>${bodyRows}</tbody>
          ${isLast ? `
          <tfoot>
            <tr class="grand-total">
              <td style="font-weight:800;padding:5px 8px;">GRAND TOTAL</td>
              <td colspan="12"></td>
              <td class="num" style="font-weight:800;font-size:12px;">₱${grandBalance.toLocaleString()}</td>
            </tr>
          </tfoot>` : ''}
        </table>
      </div>`;
  }).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>TROPA Collection Sheet — ${filterLabel}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: Arial, sans-serif;
          font-size: 10px;
          color: #000;
          padding: 18px 16px;
        }

        @media print {
          body { padding: 0; }
          @page { margin: 0.7cm 0.8cm; size: 8.5in 14in portrait; }
        }

        /* ── Per-page header ── */
        .page-header {
          margin-bottom: 8px;
        }

        .doc-title {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.4px;
          border-bottom: 1.5px solid #000;
          padding-bottom: 4px;
          margin-bottom: 4px;
        }

        .doc-sub {
          font-size: 9px;
          color: #444;
          margin-bottom: 7px;
        }

        .summary {
          display: flex;
          gap: 0;
          border: 1px solid #000;
          margin-bottom: 6px;
          font-size: 9px;
        }
        .summary > span {
          flex: 1;
          padding: 5px 8px;
          border-right: 1px solid #000;
          line-height: 1.4;
        }
        .summary > span:last-child { border-right: none; }
        .summary strong { font-size: 13px; display: block; }
        .summary .bal strong { text-decoration: underline; }

        .legend {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 9px;
          padding: 4px 8px;
          border: 1px dashed #999;
          border-radius: 2px;
          width: fit-content;
          margin-bottom: 6px;
        }
        .legend-item { display: flex; align-items: center; gap: 3px; }
        .cb-check-sm { font-size: 12px; font-weight: 900; line-height: 1; }
        .cb-box-sm {
          display: inline-block;
          width: 11px; height: 11px;
          border: 1px solid #000;
          vertical-align: middle;
        }

        /* ── Table ── */
        table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
        }

        th {
          border: 1px solid #777;
          padding: 4px 3px;
          font-size: 9px;
          font-weight: 700;
          text-align: center;
          white-space: nowrap;
          background: #f0f0f0;
        }

        .th-name {
          text-align: left;
          padding-left: 6px;
          min-width: 160px;
          background: #f0f0f0;
        }
        .th-mo    { width: 18px; min-width: 18px; }
        .th-cur   {
          border-left: 1.5px solid #000 !important;
          border-right: 1.5px solid #000 !important;
          font-style: italic;
        }
        .th-bal   { min-width: 48px; }

        td {
          padding: 3px 2px;
          border: 1px solid #ccc;
          vertical-align: middle;
        }

        .name {
          font-size: 10px;
          padding-left: 6px;
          white-space: nowrap;
        }
        .num {
          text-align: right;
          padding-right: 5px;
          font-size: 10px;
          white-space: nowrap;
        }

        /* Month cells */
        .mc { text-align: center; width: 18px; padding: 1px 0; }
        .cb-check {
          font-size: 12px;
          font-weight: 900;
          line-height: 1;
        }
        .cb-box {
          display: inline-block;
          width: 11px; height: 11px;
          border: 1px solid #000;
          vertical-align: middle;
        }

        /* Household header row */
        .hh-header td {
          font-weight: 700;
          font-size: 10px;
          padding: 4px 6px;
          border-top: 1.5px solid #000;
          border-bottom: 1px solid #000;
          border-left: 1px solid #000;
          border-right: 1px solid #000;
        }
        .hh-loc {
          font-weight: 400;
          font-size: 8.5px;
          margin-left: 8px;
          color: #555;
        }

        /* Household subtotal */
        .hh-total td {
          font-size: 9px;
          padding: 3px 4px;
          color: #444;
          border-top: 1px dashed #aaa;
        }

        /* Grand total */
        .grand-total td {
          border-top: 1.5px solid #000;
          padding: 5px 4px;
        }
      </style>
    </head>
    <body>
      ${pageTables}
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); }, 400);
}

// ─────────────────────────────────────────────────────────────────────────────
// TREASURER'S COLLECTION SHEET
// Same grid as the main ledger but:
//   • No page header / stats / legend
//   • No Balance column
//   • All text uppercase
//   • Minimal page stamp (page X / Y) at bottom-right
// ─────────────────────────────────────────────────────────────────────────────

export function printTreasurerSheet({
  households,
  members,
  filterLabel = 'All',
}: Omit<PaymentLedgerPrintProps, 'payments' | 'contributionRates'>) {
  const printWindow = window.open('', '_blank', 'width=950,height=1200');
  if (!printWindow) return;

  const now             = new Date();
  const currentYear     = now.getFullYear();
  const currentMonth    = now.getMonth() + 1;
  const today           = now.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

  function buildMonthCells(): string {
    return MONTH_INITIALS.map((_init, idx) => {
      const monthNum = idx + 1;
      const isCurrent = monthNum === currentMonth;
      const curBorder = isCurrent ? 'border-left:1.5px solid #000;border-right:1.5px solid #000;' : '';

      return `<td class="mc mc-due" style="${curBorder}" title="${MONTH_LABELS[idx]}"><span class="cb-box"></span></td>`;
    }).join('');
  }

  // ── sort households alphabetically ───────────────────────────────────────
  const coopHouseholds = [...households]
    .filter(hh => members.some(m => m.household_id === hh.id && m.is_cooperative_member))
    .sort((a, b) => a.household_name.localeCompare(b.household_name));

  // ── month header (no Balance col) ────────────────────────────────────────
  const monthHeaders = MONTH_INITIALS.map((init, i) => {
    const isCurrent = (i + 1) === currentMonth;
    return `<th class="th-mo${isCurrent ? ' th-cur' : ''}" title="${MONTH_LABELS[i]}">${init}</th>`;
  }).join('');

  const theadHTML = `
    <thead>
      <tr>
        <th class="th-name">MEMBER NAME</th>
        ${monthHeaders}
      </tr>
    </thead>`;

  // ── build household rows ──────────────────────────────────────────────────
  function buildHouseholdRows(hh: Household): string {
    const coopMembers = members
      .filter(m => m.household_id === hh.id && m.is_cooperative_member)
      .sort((a, b) => {
        const la = `${a.lastname ?? ''}${a.firstname ?? ''}`.toUpperCase();
        const lb = `${b.lastname ?? ''}${b.firstname ?? ''}`.toUpperCase();
        return la.localeCompare(lb);
      });

    let memberRows = coopMembers.map((m, mIdx) => {
      // Force all name parts to UPPERCASE
      const lastName  = (m.lastname  ?? '').toUpperCase();
      const firstName = [m.firstname, m.middlename].filter(Boolean).join(' ').toUpperCase();
      const ext       = m.extension ? ` ${m.extension.toUpperCase()}` : '';
      const fullName  = `${lastName}, ${firstName}${ext}`;

      const monthCells     = buildMonthCells();
      const rowStyle       = mIdx % 2 === 1 ? 'background:#f7f7f7;' : '';

      return `
        <tr style="${rowStyle}">
          <td class="name">${fullName}</td>
          ${monthCells}
        </tr>`;
    }).join('');

    // Pad with blank rows to guarantee at least 7 rows per household minimum
    const TARGET_ROWS = 7;
    const currentRows = coopMembers.length;
    for (let i = currentRows; i < TARGET_ROWS; i++) {
        const rowStyle = i % 2 === 1 ? 'background:#f7f7f7;' : '';
        memberRows += `
          <tr style="${rowStyle}">
            <td class="name"></td>
            ${buildMonthCells()}
          </tr>`;
    }

    // UPPERCASE household name too
    const hhName = hh.household_name.toUpperCase();
    const hhLoc  = `${hh.lgu} · ${hh.barangay} · PUROK ${(hh.purok ?? '').toUpperCase()}`;

    return `
      <tr class="hh-header">
        <td colspan="13">${hhName}
          <span class="hh-loc">${hhLoc}</span>
        </td>
      </tr>
      ${memberRows}
      <tr class="hh-spacer"><td colspan="13"></td></tr>`;
  }

  // ── chunk into pages ──────────────────────────────────────────────────────
  const TREASURER_HH_PER_PAGE = 6;
  const chunks: Household[][] = [];
  for (let i = 0; i < coopHouseholds.length; i += TREASURER_HH_PER_PAGE) {
    chunks.push(coopHouseholds.slice(i, i + TREASURER_HH_PER_PAGE));
  }
  const totalPages = chunks.length;

  const pageTables = chunks.map((chunk, pageIdx) => {
    const isLast    = pageIdx === totalPages - 1;
    const pageBreak = !isLast ? 'page-break-after:always;' : '';
    const bodyRows  = chunk.map(hh => buildHouseholdRows(hh)).join('');

    return `
      <div style="${pageBreak}position:relative;">
        <table>
          ${theadHTML}
          <tbody>${bodyRows}</tbody>
        </table>
        <p class="page-stamp">
          ${filterLabel.toUpperCase()} &nbsp;|&nbsp; ${today.toUpperCase()} &nbsp;|&nbsp;
          PAGE ${pageIdx + 1} / ${totalPages}
        </p>
      </div>`;
  }).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>TREASURER SHEET — ${filterLabel.toUpperCase()} ${currentYear}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: Arial, sans-serif;
          font-size: 10px;
          color: #000;
          padding: 18px 16px;
          text-transform: uppercase;
        }

        @media print {
          body { padding: 0; }
          @page { margin: 0.7cm 0.8cm; size: 8.5in 14in portrait; }
        }

        table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
        }

        th {
          border: 1px solid #777;
          padding: 4px 3px;
          font-size: 9px;
          font-weight: 700;
          text-align: center;
          white-space: nowrap;
          background: #f0f0f0;
          text-transform: uppercase;
        }

        .th-name {
          text-align: left;
          padding-left: 6px;
          min-width: 160px;
          background: #f0f0f0;
        }
        .th-mo  { width: 18px; min-width: 18px; }
        .th-cur {
          border-left: 1.5px solid #000 !important;
          border-right: 1.5px solid #000 !important;
          font-style: italic;
        }

        td {
          padding: 3px 2px;
          border: 1px solid #ccc;
          vertical-align: middle;
        }

        .name {
          font-size: 10px;
          padding-left: 6px;
          white-space: nowrap;
          text-transform: uppercase;
        }

        .mc { text-align: center; width: 18px; padding: 1px 0; }
        .cb-check { font-size: 12px; font-weight: 900; line-height: 1; }
        .cb-box {
          display: inline-block;
          width: 11px; height: 11px;
          border: 1px solid #000;
          vertical-align: middle;
        }

        .hh-header td {
          font-weight: 700;
          font-size: 10px;
          padding: 4px 6px;
          border-top: 1.5px solid #000;
          border-bottom: 1px solid #000;
          border-left: 1px solid #000;
          border-right: 1px solid #000;
          text-transform: uppercase;
        }
        .hh-loc {
          font-weight: 400;
          font-size: 8.5px;
          margin-left: 8px;
          color: #555;
          text-transform: uppercase;
        }

        .hh-spacer td { height: 6px; border: none; padding: 0; }

        .page-stamp {
          font-size: 7.5px;
          color: #777;
          text-align: right;
          margin-top: 3px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
      </style>
    </head>
    <body>
      ${pageTables}
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); }, 400);
}
