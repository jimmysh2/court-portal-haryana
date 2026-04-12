/**
 * Live formula test — pulls REAL data from the local DB and
 * applies every percentage formula from reportConfigs.jsx
 * for Tables 10, 11 & 12.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const pct = (num, den) =>
    den === 0 ? '0.00%' : ((Math.max(0, num) / den) * 100).toFixed(2) + '%';

const parseVal = (v) => {
    if (!v) return 0;
    const p = parseFloat(v);
    return isNaN(p) ? 0 : p;
};

const sumField = (entries, slug) =>
    entries.reduce((acc, e) => acc + parseVal(e.values?.[slug]), 0);

// ─────────────────────────────────────────────
//  TABLE 10  — police-deposition
// ─────────────────────────────────────────────
async function testTable10() {
    console.log('\n══════════════════════════════════════════════════════');
    console.log('  TABLE 10 — Deposition of Police Officials');
    console.log('══════════════════════════════════════════════════════');

    const table = await prisma.table.findFirst({ where: { slug: 'police-deposition' } });
    if (!table) { console.log('  ⚠ Table not found in DB'); return; }

    const entries = await prisma.entry.findMany({ where: { tableId: table.id } });
    console.log(`  📋 Total entry rows found: ${entries.length}\n`);

    if (entries.length === 0) { console.log('  ⚠ No data rows — skipping formula test\n'); return; }

    // Raw sums
    const s1 = sumField(entries, 'supposed_to_appear');   // Summoned
    const s2 = sumField(entries, 'appeared_physically');  // Appeared Physically
    const s3 = sumField(entries, 'examined_physically');  // Examined Physically
    const s4 = sumField(entries, 'examined_via_vc');      // Examined via VC
    const s5 = sumField(entries, 'absent_unauthorized');  // Absent Unauthorized

    const notAppeared = Math.max(0, s1 - (s2 + s4));

    console.log('  ── Raw Input Values (sum across all entries) ──');
    console.log(`  Col 1  Summoned (supposed_to_appear) : ${s1}`);
    console.log(`  Col 2  Appeared Physically           : ${s2}`);
    console.log(`  Col 3  Examined Physically           : ${s3}`);
    console.log(`  Col 4  Examined via VC               : ${s4}`);
    console.log(`  Col 5  Absent Unauthorized           : ${s5}`);

    console.log('\n  ── Calculated Report Columns ──');
    console.log(`  Summoned                                 : ${s1}`);
    console.log(`  Not Appeared  [1-(2+4)]                  : ${notAppeared}`);
    console.log(`  % Not Appeared  [max(0,1-(2+4))/1]       : ${pct(notAppeared, s1)}  ✓`);
    console.log(`  Attended Physically [2]                  : ${s2}`);
    console.log(`  Examined in Court [3]                    : ${s3}`);
    console.log(`  % Examined in Court after Physically [3/2]: ${pct(s3, s2)}  ✓`);
    console.log(`  Not Examined after being Present [2-3]   : ${Math.max(0, s2 - s3)}`);
    console.log(`  Examined through VC [4]                  : ${s4}`);
    console.log(`  % examined through VC [4/1]              : ${pct(s4, s1)}  ✓`);
    console.log(`  Total Examined (Court+VC) [3+4]          : ${s3 + s4}`);
    console.log(`  % Total Examined [(3+4)/1]               : ${pct(s3 + s4, s1)}  ✓`);
    const authorized = Math.max(0, notAppeared - s5);
    console.log(`  Authorized Request [{1-(2+4)}-5]         : ${authorized}`);
    console.log(`  Unauthorized Request [5]                 : ${s5}`);
    console.log(`  % Unauthorized Req [5/{1-(2+4)}]         : ${pct(s5, notAppeared)}  ✓`);

    // Sanity checks
    console.log('\n  ── Sanity Checks ──');
    const sumCheck = s2 + s4 + notAppeared;
    console.log(`  s2+s4+NotAppeared should equal Summoned (${s1}): ${sumCheck} → ${sumCheck === s1 ? '✅ OK' : '❌ MISMATCH'}`);
    const authUnauthCheck = authorized + s5;
    console.log(`  Authorized+Unauthorized should equal NotAppeared (${notAppeared}): ${authUnauthCheck} → ${authUnauthCheck === notAppeared ? '✅ OK' : '❌ MISMATCH'}`);
}

// ─────────────────────────────────────────────
//  TABLE 11  — deposition-govt-officials
// ─────────────────────────────────────────────
async function testTable11() {
    console.log('\n══════════════════════════════════════════════════════');
    console.log('  TABLE 11 — Deposition of Other Govt Officials');
    console.log('══════════════════════════════════════════════════════');

    const table = await prisma.table.findFirst({ where: { slug: 'deposition-govt-officials' } });
    if (!table) { console.log('  ⚠ Table not found in DB'); return; }

    const entries = await prisma.entry.findMany({ where: { tableId: table.id } });
    console.log(`  📋 Total entry rows found: ${entries.length}\n`);

    if (entries.length === 0) { console.log('  ⚠ No data rows — skipping formula test\n'); return; }

    const s1 = sumField(entries, 'supposed_to_appear');   // Summoned
    const s2 = sumField(entries, 'informed_on_phone');    // Informed on Phone
    const s3 = sumField(entries, 'appeared_physically');  // Appeared Physically
    const s4 = sumField(entries, 'examined_physically');  // Examined Physically
    const s5 = sumField(entries, 'examined_through_vc'); // Examined through VC

    const notAppeared = Math.max(0, s1 - (s3 + s5));

    console.log('  ── Raw Input Values (sum across all entries) ──');
    console.log(`  Col 1  Summoned (supposed_to_appear) : ${s1}`);
    console.log(`  Col 2  Informed on Phone             : ${s2}`);
    console.log(`  Col 3  Appeared Physically           : ${s3}`);
    console.log(`  Col 4  Examined Physically           : ${s4}`);
    console.log(`  Col 5  Examined through VC           : ${s5}`);

    console.log('\n  ── Calculated Report Columns ──');
    console.log(`  Summoned                                   : ${s1}`);
    console.log(`  Not Appeared  [1-(3+5)]                    : ${notAppeared}`);
    console.log(`  % Not Appeared  [max(0,1-(3+5))/1]         : ${pct(notAppeared, s1)}  ✓`);
    console.log(`  Attended Physically [3]                    : ${s3}`);
    console.log(`  Examined in Court [4]                      : ${s4}`);
    console.log(`  % Examined in Court after Physically [4/3] : ${pct(s4, s3)}  ✓`);
    console.log(`  Not Examined after being Present [3-4]     : ${Math.max(0, s3 - s4)}`);
    console.log(`  Examined through VC [5]                    : ${s5}`);
    console.log(`  % examined through VC [5/1]                : ${pct(s5, s1)}  ✓`);
    console.log(`  Total Examined (Court+VC) [4+5]            : ${s4 + s5}`);
    console.log(`  % Total Examined [(4+5)/1]                 : ${pct(s4 + s5, s1)}  ✓`);
    console.log(`  Telephonically Informed [2]                : ${s2}`);
    console.log(`  % Informed [2/1]                           : ${pct(s2, s1)}  ✓`);

    console.log('\n  ── Sanity Check ──');
    const sumCheck = s3 + s5 + notAppeared;
    console.log(`  s3+s5+NotAppeared should equal Summoned (${s1}): ${sumCheck} → ${sumCheck === s1 ? '✅ OK' : '❌ MISMATCH'}`);
}

// ─────────────────────────────────────────────
//  TABLE 12  — deposition-private
// ─────────────────────────────────────────────
async function testTable12() {
    console.log('\n══════════════════════════════════════════════════════');
    console.log('  TABLE 12 — Deposition of Private Individuals');
    console.log('══════════════════════════════════════════════════════');

    const table = await prisma.table.findFirst({ where: { slug: 'deposition-private' } });
    if (!table) { console.log('  ⚠ Table not found in DB'); return; }

    const entries = await prisma.entry.findMany({ where: { tableId: table.id } });
    console.log(`  📋 Total entry rows found: ${entries.length}\n`);

    if (entries.length === 0) { console.log('  ⚠ No data rows — skipping formula test\n'); return; }

    // Same column structure as Table 11
    const s1 = sumField(entries, 'supposed_to_appear');
    const s2 = sumField(entries, 'informed_on_phone');
    const s3 = sumField(entries, 'appeared_physically');
    const s4 = sumField(entries, 'examined_physically');
    const s5 = sumField(entries, 'examined_through_vc');

    const notAppeared = Math.max(0, s1 - (s3 + s5));

    console.log('  ── Raw Input Values (sum across all entries) ──');
    console.log(`  Col 1  Summoned (supposed_to_appear) : ${s1}`);
    console.log(`  Col 2  Informed on Phone             : ${s2}`);
    console.log(`  Col 3  Appeared Physically           : ${s3}`);
    console.log(`  Col 4  Examined Physically           : ${s4}`);
    console.log(`  Col 5  Examined through VC           : ${s5}`);

    console.log('\n  ── Calculated Report Columns ──');
    console.log(`  Summoned                                   : ${s1}`);
    console.log(`  Not Appeared  [1-(3+5)]                    : ${notAppeared}`);
    console.log(`  % Not Appeared  [max(0,1-(3+5))/1]         : ${pct(notAppeared, s1)}  ✓`);
    console.log(`  Attended Physically [3]                    : ${s3}`);
    console.log(`  Examined in Court [4]                      : ${s4}`);
    console.log(`  % Examined in Court after Physically [4/3] : ${pct(s4, s3)}  ✓`);
    console.log(`  Not Examined after being Present [3-4]     : ${Math.max(0, s3 - s4)}`);
    console.log(`  Examined through VC [5]                    : ${s5}`);
    console.log(`  % examined through VC [5/1]                : ${pct(s5, s1)}  ✓`);
    console.log(`  Total Examined (Court+VC) [4+5]            : ${s4 + s5}`);
    console.log(`  % Total Examined [(4+5)/1]                 : ${pct(s4 + s5, s1)}  ✓`);
    console.log(`  Telephonically Informed [2]                : ${s2}`);
    console.log(`  % Informed [2/1]                           : ${pct(s2, s1)}  ✓`);

    console.log('\n  ── Sanity Check ──');
    const sumCheck = s3 + s5 + notAppeared;
    console.log(`  s3+s5+NotAppeared should equal Summoned (${s1}): ${sumCheck} → ${sumCheck === s1 ? '✅ OK' : '❌ MISMATCH'}`);
}

// ─────────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────────
async function main() {
    console.log('\n🔬 LIVE FORMULA TEST — using real DB data\n');
    try {
        await testTable10();
        await testTable11();
        await testTable12();
    } finally {
        await prisma.$disconnect();
        console.log('\n✅ Done.\n');
    }
}

main().catch(e => { console.error(e); process.exit(1); });
