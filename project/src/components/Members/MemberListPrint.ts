import { Household, FamilyMember } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// MEMBER LIST PRINT
// Two formats, same layout as the Treasurer Sheet (Reports/PaymentLedgerPrint.tsx):
//   • 'treasurer' — Treasurer's Copy: empty month boxes (J–D), no payment records.
//   • 'details'   — Member details: Birthdate, Age, Sector, Contact, Voter, TROPA, PhilHealth.
// Every family_members record is treated as a TROPA member.
// ─────────────────────────────────────────────────────────────────────────────

export type MemberPrintFormat = 'treasurer' | 'details';

interface MemberListPrintProps {
  households:   Household[];
  members:      FamilyMember[];
  filterLabel?: string;
  format?:      MemberPrintFormat;
  leadersOnly?: boolean;
  lgu?:         string;
  barangay?:    string;
}

const MONTH_INITIALS = ['J','F','M','A','M','J','J','A','S','O','N','D'];
const MONTH_LABELS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const HH_PER_PAGE = 6;
const LEADERS_PER_PAGE = 45;
const TARGET_ROWS = 7;

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(d?: Date | string): string {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  return `${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getDate()).padStart(2, '0')}/${dt.getFullYear()}`;
}

function calcAge(m: FamilyMember): string {
  if (m.birth_date) {
    const b = new Date(m.birth_date);
    if (!isNaN(b.getTime())) {
      const now = new Date();
      let a = now.getFullYear() - b.getFullYear();
      const md = now.getMonth() - b.getMonth();
      if (md < 0 || (md === 0 && now.getDate() < b.getDate())) a--;
      return String(a);
    }
  }
  return m.age != null ? String(m.age) : '';
}

function fullName(m: FamilyMember): string {
  const lastName  = (m.lastname ?? '').toUpperCase();
  const firstName = [m.firstname, m.middlename].filter(Boolean).join(' ').toUpperCase();
  const ext       = m.extension ? ` ${m.extension.toUpperCase()}` : '';
  return `${lastName}, ${firstName}${ext}`;
}

const byName = (a: FamilyMember, b: FamilyMember) =>
  `${a.lastname ?? ''}${a.firstname ?? ''}`.toUpperCase()
    .localeCompare(`${b.lastname ?? ''}${b.firstname ?? ''}`.toUpperCase());

export function printMemberList({
  households,
  members,
  filterLabel = 'All',
  format = 'treasurer',
  leadersOnly = false,
  lgu = 'All',
  barangay = 'All',
}: MemberListPrintProps) {
  const now          = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const today        = now.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  const isTreasurer  = format === 'treasurer';

  // ── columns ──────────────────────────────────────────────────────────────
  const extraHeaders = leadersOnly ? '<th class="th-md">LOCATION</th>' : '';
  const COLS = (isTreasurer ? 13 : 8) + (leadersOnly ? 1 : 0);

  const theadHTML = isTreasurer
    ? `<thead><tr>
        <th class="th-name">MEMBER NAME</th>${extraHeaders}
        ${MONTH_INITIALS.map((init, i) =>
          `<th class="th-mo${i + 1 === currentMonth ? ' th-cur' : ''}" title="${MONTH_LABELS[i]}">${init}</th>`).join('')}
      </tr></thead>`
    : `<thead><tr>
        <th class="th-name">MEMBER NAME</th>${extraHeaders}
        <th class="th-sm">BIRTHDATE</th>
        <th class="th-xs">AGE</th>
        <th class="th-md">SECTOR</th>
        <th class="th-md">CONTACT NO.</th>
        <th class="th-xs">VOTER</th>
        <th class="th-xs">TROPA</th>
        <th class="th-md">PHILHEALTH NO.</th>
      </tr></thead>`;

  const monthCells = MONTH_INITIALS.map((_i, idx) => {
    const cur = idx + 1 === currentMonth ? 'border-left:1.5px solid #000;border-right:1.5px solid #000;' : '';
    return `<td class="mc" style="${cur}" title="${MONTH_LABELS[idx]}"><span class="cb-box"></span></td>`;
  }).join('');

  function dataCells(m: FamilyMember | null): string {
    if (isTreasurer) return monthCells;
    if (!m) return '<td></td>'.repeat(7);
    const phic = m.phic_no || (m.phic_member ? 'YES' : '');
    return `
      <td class="c">${fmtDate(m.birth_date)}</td>
      <td class="c">${calcAge(m)}</td>
      <td class="l">${esc((m.sector || '').toUpperCase())}</td>
      <td class="l">${esc(m.contact_number || '')}</td>
      <td class="c">${m.is_voter ? '&#10003;' : ''}</td>
      <td class="c">&#10003;</td>
      <td class="l">${esc(phic)}</td>`;
  }

  function memberRow(m: FamilyMember | null, i: number, hh?: Household): string {
    const rowStyle = i % 2 === 1 ? 'background:#f7f7f7;' : '';
    const leader   = m && m.is_household_leader && !leadersOnly ? ' <span class="tag">(LEADER)</span>' : '';
    const hhCell   = leadersOnly
      ? `<td class="l">${esc(hh ? `${hh.barangay} · PUROK ${(hh.purok ?? '').toUpperCase()}` : '')}</td>`
      : '';
    return `
      <tr style="${rowStyle}">
        <td class="name">${m ? esc(fullName(m)) + leader : '&nbsp;'}</td>${hhCell}
        ${dataCells(m)}
      </tr>`;
  }

  // ── group members ────────────────────────────────────────────────────────
  const byHousehold = new Map<string, FamilyMember[]>();
  members.forEach(m => {
    if (!m.household_id) return;
    if (leadersOnly && !m.is_household_leader) return;
    const arr = byHousehold.get(m.household_id) ?? [];
    arr.push(m);
    byHousehold.set(m.household_id, arr);
  });

  const sortedHouseholds = [...households]
    .filter(hh => byHousehold.has(hh.id))
    .sort((a, b) => a.household_name.localeCompare(b.household_name));

  // ── page bodies ──────────────────────────────────────────────────────────
  let pageBodies: string[] = [];

  if (leadersOnly) {
    // Flat list of leaders (no household grouping / padding)
    const rows: { m: FamilyMember; hh: Household }[] = [];
    sortedHouseholds.forEach(hh => (byHousehold.get(hh.id) ?? []).forEach(m => rows.push({ m, hh })));
    rows.sort((a, b) => byName(a.m, b.m));
    for (let i = 0; i < rows.length; i += LEADERS_PER_PAGE) {
      pageBodies.push(rows.slice(i, i + LEADERS_PER_PAGE).map((r, idx) => memberRow(r.m, idx, r.hh)).join(''));
    }
  } else {
    const buildHousehold = (hh: Household) => {
      const list = (byHousehold.get(hh.id) ?? []).sort((a, b) => {
        if (!isTreasurer && a.is_household_leader !== b.is_household_leader) return a.is_household_leader ? -1 : 1;
        return byName(a, b);
      });
      let rows = list.map((m, i) => memberRow(m, i)).join('');
      for (let i = list.length; i < TARGET_ROWS; i++) rows += memberRow(null, i);
      const hhLoc = `${hh.lgu} · ${hh.barangay} · PUROK ${(hh.purok ?? '').toUpperCase()}`;
      return `
        <tr class="hh-header"><td colspan="${COLS}">${esc(hh.household_name.toUpperCase())}
          <span class="hh-loc">${esc(hhLoc)}</span></td></tr>
        ${rows}
        <tr class="hh-spacer"><td colspan="${COLS}"></td></tr>`;
    };
    for (let i = 0; i < sortedHouseholds.length; i += HH_PER_PAGE) {
      pageBodies.push(sortedHouseholds.slice(i, i + HH_PER_PAGE).map(buildHousehold).join(''));
    }
  }

  const totalPages = pageBodies.length;
  const titleLabel = leadersOnly
    ? `LIST OF HOUSEHOLD LEADERS${isTreasurer ? " — TREASURER'S COPY" : ''}`
    : isTreasurer ? "TREASURER'S COPY" : 'LIST OF MEMBERS';

  const pageHeader = (idx: number) => `
    <div class="doc-head">
      <div class="doc-title">${titleLabel}</div>
      <div class="doc-sub">
        LGU: <strong>${esc(lgu.toUpperCase())}</strong>
        &nbsp;&nbsp;|&nbsp;&nbsp; BARANGAY: <strong>${esc(barangay.toUpperCase())}</strong>
        &nbsp;&nbsp;|&nbsp;&nbsp; ${isTreasurer ? `YEAR: <strong>${currentYear}</strong> &nbsp;&nbsp;|&nbsp;&nbsp; ` : ''}PAGE ${idx + 1} OF ${totalPages}
      </div>
    </div>`;

  const pageTables = totalPages === 0
    ? `<div style="text-align:center;padding:50px;font-size:14px;"><h2>No members found for the selected location.</h2></div>`
    : pageBodies.map((body, idx) => {
        const pageBreak = idx < totalPages - 1 ? 'page-break-after:always;' : '';
        return `
          <div style="${pageBreak}">
            ${pageHeader(idx)}
            <table>${theadHTML}<tbody>${body}</tbody></table>
            <p class="page-stamp">
              ${titleLabel} &nbsp;|&nbsp; ${esc(filterLabel.toUpperCase())} &nbsp;|&nbsp; ${today.toUpperCase()} &nbsp;|&nbsp;
              PAGE ${idx + 1} / ${totalPages}
            </p>
          </div>`;
      }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${titleLabel} — ${esc(filterLabel.toUpperCase())} ${currentYear}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 10px; color: #000; padding: 18px 16px; text-transform: uppercase; }
        @media print {
          body { padding: 0; }
          @page { margin: 0.7cm 0.8cm; size: 8.5in 14in portrait; }
        }
        table { width: 100%; border-collapse: collapse; border: 1px solid #000; }
        th { border: 1px solid #777; padding: 4px 3px; font-size: 9px; font-weight: 700; text-align: center; white-space: nowrap; background: #f0f0f0; }
        .th-name { text-align: left; padding-left: 6px; min-width: 160px; }
        .th-mo  { width: 18px; min-width: 18px; }
        .th-cur { border-left: 1.5px solid #000 !important; border-right: 1.5px solid #000 !important; font-style: italic; }
        .th-xs { width: 38px; }
        .th-sm { width: 64px; }
        .th-md { width: 90px; }
        td { padding: 3px 2px; border: 1px solid #ccc; vertical-align: middle; font-size: 9.5px; }
        .name { font-size: 10px; padding-left: 6px; white-space: nowrap; }
        .c { text-align: center; white-space: nowrap; }
        .l { white-space: nowrap; padding-left: 4px; }
        .tag { font-size: 8px; color: #555; font-weight: 700; }
        .mc { text-align: center; width: 18px; padding: 1px 0; }
        .cb-box { display: inline-block; width: 11px; height: 11px; border: 1px solid #000; vertical-align: middle; }
        .hh-header td { font-weight: 700; font-size: 10px; padding: 4px 6px; border: 1px solid #000; border-top: 1.5px solid #000; }
        .hh-loc { font-weight: 400; font-size: 8.5px; margin-left: 8px; color: #555; }
        .hh-spacer td { height: 6px; border: none; padding: 0; }
        .page-stamp { font-size: 7.5px; color: #777; text-align: right; margin-top: 3px; letter-spacing: 0.3px; }
        .doc-head { margin-bottom: 6px; }
        .doc-title { font-size: 15px; font-weight: 800; letter-spacing: 0.4px; border-bottom: 1.5px solid #000; padding-bottom: 3px; margin-bottom: 3px; }
        .doc-sub { font-size: 9.5px; color: #333; }
      </style>
    </head>
    <body>${pageTables}</body>
    </html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank', 'width=950,height=1200');
  if (!w) { URL.revokeObjectURL(url); return; }
  w.onload = () => {
    w.focus();
    w.print();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };
}
