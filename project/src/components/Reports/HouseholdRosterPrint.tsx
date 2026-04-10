import { Household, FamilyMember } from '../../types';

interface HouseholdRosterPrintProps {
  households: Household[];
  members: FamilyMember[];
}

function formatName(m: FamilyMember): string {
  const lastname = m.lastname?.trim() || '';
  const firstname = m.firstname?.trim() || '';
  const middlename = m.middlename?.trim() || '';
  const extension = m.extension?.trim() || '';

  // Build "Lastname, Firstname Middlename Ext"
  const afterComma = [firstname, middlename, extension].filter(Boolean).join(' ');
  if (lastname && afterComma) return `${lastname}, ${afterComma}`;
  if (lastname) return lastname;
  return afterComma;
}

function formatSector(sector: string | null | undefined): string {
  if (!sector) return '—';
  const s = sector.trim().toLowerCase();
  if (s === 'general') return 'G';
  if (s === 'youth') return 'Y';
  if (s === 'lgbtq' || s === 'lgbtq+') return 'LGBTQ';
  if (s === 'student') return 'S';
  if (s === 'senior citizen' || s === 'senior') return 'SC';
  if (s === 'pwd' || s === 'person with disability') return 'PWD';
  if (s === 'solo parent') return 'SP';
  if (s === 'indigenous people' || s === 'ip') return 'IP';
  return sector;
}

function formatClassification(m: FamilyMember): string {
  const codes: string[] = [];
  if (m.is_household_leader) codes.push('L');
  if (m.is_cooperative_member) codes.push('M');
  if (m.is_voter) codes.push('V');
  return codes.join(', ') || '—';
}

export function printHouseholdRoster({ households, members }: HouseholdRosterPrintProps) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;

  const sorted = [...households].sort((a, b) =>
    `${a.lgu} ${a.barangay} ${a.household_name}`.localeCompare(
      `${b.lgu} ${b.barangay} ${b.household_name}`
    )
  );

  const householdRows = sorted
    .map((hh) => {
      const hhMembers = members.filter((m) => m.household_id === hh.id);
      const leader = hhMembers.find((m) => m.is_household_leader);
      const others = hhMembers.filter((m) => !m.is_household_leader);
      const allSorted = leader ? [leader, ...others] : others;

      const memberRows = allSorted
        .map((m) => {
          const fullName = formatName(m);
          const classification = formatClassification(m);
          const sector = formatSector(m.sector);

          return `
            <tr>
              <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;">${fullName}</td>
              <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">${m.age ?? '—'}</td>
              <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">${sector}</td>
              <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">${classification}</td>
              <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;">${m.contact_number || '—'}</td>
            </tr>`;
        })
        .join('');

      return `
        <div class="household-block" style="margin-bottom:24px;page-break-inside:avoid;">
          <div style="background:#1f2937;color:#fff;padding:8px 12px;border-radius:6px 6px 0 0;display:flex;justify-content:space-between;align-items:center;">
            <strong style="font-size:13px;">${hh.household_name}</strong>
            <span style="font-size:11px;opacity:0.9;">${hh.lgu} · ${hh.barangay} · Purok ${hh.purok}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-top:none;font-size:12px;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="padding:6px 8px;text-align:left;border-bottom:1px solid #e5e7eb;font-weight:600;">Name</th>
                <th style="padding:6px 8px;text-align:center;border-bottom:1px solid #e5e7eb;font-weight:600;width:50px;">Age</th>
                <th style="padding:6px 8px;text-align:center;border-bottom:1px solid #e5e7eb;font-weight:600;width:60px;">Sector</th>
                <th style="padding:6px 8px;text-align:center;border-bottom:1px solid #e5e7eb;font-weight:600;width:100px;">Classification</th>
                <th style="padding:6px 8px;text-align:left;border-bottom:1px solid #e5e7eb;font-weight:600;">Contact</th>
              </tr>
            </thead>
            <tbody>
              ${memberRows || '<tr><td colspan="5" style="padding:8px;text-align:center;color:#9ca3af;">No members</td></tr>'}
            </tbody>
          </table>
          <div style="text-align:right;font-size:11px;color:#6b7280;padding:4px 8px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 6px 6px;">
            ${hhMembers.length} member${hhMembers.length !== 1 ? 's' : ''}
          </div>
        </div>`;
    })
    .join('');

  const today = new Date().toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Household Roster</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; color: #111827; padding: 24px; }
        @media print {
          body { padding: 12px; color: #000 !important; }
          @page { margin: 1cm; }
          h1, .subtitle, .summary-bar, .summary-bar span strong,
          th, td, .legend-box, .legend-box * {
            color: #000 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact;
          }
          .household-block > div:first-child {
            background: #000 !important;
            color: #fff !important;
            -webkit-print-color-adjust: exact;
          }
          .summary-bar { border: 1px solid #999 !important; }
          .legend-box { border: 1px solid #999 !important; }
        }
        h1 { font-size: 18px; color: #0d9488; }
        .subtitle { font-size: 12px; color: #6b7280; margin-bottom: 18px; }
        .summary-bar { display: flex; gap: 24px; background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 6px; padding: 10px 14px; margin-bottom: 20px; font-size: 12px; }
        .summary-bar span strong { font-size: 15px; display: block; color: #0f766e; }
        .legend-box {
          margin-bottom: 14px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 5px 10px;
          font-size: 10px;
          color: #374151;
          page-break-inside: avoid;
          line-height: 1.6;
        }
        .legend-label { font-weight: 700; margin-right: 4px; }
        .legend-sep { color: #9ca3af; margin: 0 6px; }
        .legend-section { margin-right: 12px; }
        .legend-title { font-weight: 700; font-size: 10px; margin-right: 4px; }
      </style>
    </head>
    <body>
      <h1>TROPA — Household Roster</h1>
      <p class="subtitle">Printed on ${today} &nbsp;|&nbsp; ${households.length} household${households.length !== 1 ? 's' : ''} &nbsp;|&nbsp; ${members.length} member${members.length !== 1 ? 's' : ''}</p>
      <div class="summary-bar">
        <span><strong>${households.length}</strong>Households</span>
        <span><strong>${members.length}</strong>Total Members</span>
        <span><strong>${members.filter((m) => m.is_cooperative_member).length}</strong>TROPA Members</span>
        <span><strong>${members.filter((m) => m.is_voter).length}</strong>Registered Voters</span>
      </div>
      <div class="legend-box">
        <span class="legend-title">Classification:</span>
        <span><span class="legend-label">V</span>=Voter</span><span class="legend-sep">·</span>
        <span><span class="legend-label">M</span>=Member</span><span class="legend-sep">·</span>
        <span><span class="legend-label">L</span>=Leader</span>
        <span class="legend-sep">|</span>
        <span class="legend-title">Sector:</span>
        <span><span class="legend-label">G</span>=General</span><span class="legend-sep">·</span>
        <span><span class="legend-label">Y</span>=Youth</span><span class="legend-sep">·</span>
        <span><span class="legend-label">LGBTQ</span>=LGBTQ+</span><span class="legend-sep">·</span>
        <span><span class="legend-label">S</span>=Student</span><span class="legend-sep">·</span>
        <span><span class="legend-label">SC</span>=Senior Citizen</span><span class="legend-sep">·</span>
        <span><span class="legend-label">PWD</span>=PWD</span><span class="legend-sep">·</span>
        <span><span class="legend-label">SP</span>=Solo Parent</span><span class="legend-sep">·</span>
        <span><span class="legend-label">IP</span>=Indigenous People</span>
      </div>
      ${householdRows}
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
}
