const { PrismaClient } = require('@prisma/client');
const { syncTableDefinitions } = require('./scripts/auto-sync.js');
const prisma = new PrismaClient();

async function main() {
  console.log("Updating tables...");

  const devUser = await prisma.user.findFirst({ where: { role: 'developer' } });
  if (!devUser) throw new Error("No developer user found");
  const devId = devUser.id;

  // 1. Rename existing "10. Deposition of police officials" to 9.
  const pdTable = await prisma.dataEntryTable.findUnique({ where: { slug: 'police-deposition' } });
  if (pdTable) {
    await prisma.dataEntryTable.update({
      where: { id: pdTable.id },
      data: { name: "9. Deposition of police officials", sortOrder: 9 }
    });
  }

  // 2. Rename existing "11. VC of prisoners" to 12.
  const vpTable = await prisma.dataEntryTable.findUnique({ where: { slug: 'vc-prisoners' } });
  if (vpTable) {
    await prisma.dataEntryTable.update({
      where: { id: vpTable.id },
      data: { name: "12. VC of prisoners", sortOrder: 12 }
    });
  }

  // 3. Create "10. Deposition of other govt officials"
  const t10 = await prisma.dataEntryTable.upsert({
    where: { slug: 'deposition-other-govt' },
    update: { sortOrder: 10, name: "10. Deposition of other govt officials" },
    create: {
      name: "10. Deposition of other govt officials",
      slug: "deposition-other-govt",
      description: "Deposition of other govt officials",
      singleRow: true,
      sortOrder: 10,
      createdBy: devId,
    }
  });
  
  const cols10 = [
    { name: "Supposed to appear", slug: "supposed_to_appear", dataType: "number", isRequired: true, sortOrder: 0 },
    { name: "Informed on phone one day before", slug: "informed_on_phone", dataType: "number", isRequired: true, sortOrder: 1 },
    { name: "Appeared physically", slug: "appeared_physically", dataType: "number", isRequired: true, sortOrder: 2 },
    { name: "Examined physically", slug: "examined_physically", dataType: "number", isRequired: true, sortOrder: 3 },
    { name: "Examined through VC", slug: "examined_via_vc", dataType: "number", isRequired: true, sortOrder: 4 }
  ];
  for (const c of cols10) {
    await prisma.dataEntryColumn.upsert({
        where: { tableId_slug: { tableId: t10.id, slug: c.slug } },
        update: {},
        create: { ...c, tableId: t10.id }
    });
  }

  // 4. Create "11. Deposition of private individuals (public)"
  const t11 = await prisma.dataEntryTable.upsert({
    where: { slug: 'deposition-private-individuals' },
    update: { sortOrder: 11, name: "11. Deposition of private individuals (public)" },
    create: {
      name: "11. Deposition of private individuals (public)",
      slug: "deposition-private-individuals",
      description: "Deposition of private individuals (public)",
      singleRow: true,
      sortOrder: 11,
      createdBy: devId,
    }
  });
  
  const cols11 = [
    { name: "Supposed to appear", slug: "supposed_to_appear", dataType: "number", isRequired: true, sortOrder: 0 },
    { name: "Appeared physically", slug: "appeared_physically", dataType: "number", isRequired: true, sortOrder: 1 },
    { name: "Examined physically", slug: "examined_physically", dataType: "number", isRequired: true, sortOrder: 2 },
    { name: "Examined through VC", slug: "examined_via_vc", dataType: "number", isRequired: true, sortOrder: 3 }
  ];
  for (const c of cols11) {
    await prisma.dataEntryColumn.upsert({
        where: { tableId_slug: { tableId: t11.id, slug: c.slug } },
        update: {},
        create: { ...c, tableId: t11.id }
    });
  }

  // 5. Create "19. List of the accused who surrendered in court"
  const t19 = await prisma.dataEntryTable.upsert({
    where: { slug: 'accused-surrendered' },
    update: { sortOrder: 19 },
    create: {
      name: "19. List of the accused who surrendered in court",
      slug: "accused-surrendered",
      description: "List of the accused who surrendered in court",
      singleRow: false,
      sortOrder: 19,
      createdBy: devId,
    }
  });
  const cols19 = [
    { name: "Name of Accused", slug: "accused_name", dataType: "text", isRequired: true, sortOrder: 0 },
    { name: "FIR Number", slug: "fir_no", dataType: "text", isRequired: true, sortOrder: 1 },
    { name: "FIR Year", slug: "fir_year", dataType: "year", isRequired: true, sortOrder: 2 },
    { name: "Sections", slug: "sections", dataType: "text", isRequired: true, sortOrder: 3 },
    { name: "Police Station", slug: "police_station", dataType: "text", isRequired: true, sortOrder: 4 },
    { name: "Status of Accused", slug: "accused_status", dataType: "enum", isRequired: true, sortOrder: 5, options: ["Granted Regular Bail", "Sent to Judicial Custody", "Sent to Police Custody"] }
  ];
  for (const c of cols19) {
      await prisma.dataEntryColumn.upsert({
          where: { tableId_slug: { tableId: t19.id, slug: c.slug } },
          update: { dataType: c.dataType, enumOptions: c.options || null },
          create: { ...c, enumOptions: c.options || null, options: undefined, tableId: t19.id }
      });
  }

  // 6. Create "20. Details of adverse order passed against police officials"
  const t20 = await prisma.dataEntryTable.upsert({
    where: { slug: 'adverse-orders-police' },
    update: { sortOrder: 20, singleRow: false },
    create: {
      name: "20. Details of adverse order passed against police officials",
      slug: "adverse-orders-police",
      description: "Details of adverse order passed against police officials",
      singleRow: false,
      sortOrder: 20,
      createdBy: devId,
    }
  });

  // Since we changed table 20 from singleRow to multi-row and completely changed columns,
  // we delete old columns to avoid schema conflicts.
  await prisma.dataEntryColumn.deleteMany({
    where: { tableId: t20.id, slug: { in: ['under_trial', 'appeal_revision', 'bail_police_remand', 'other_matters'] } }
  });

  const cols20 = [
    { name: "Case Details", slug: "case_details", dataType: "text", isRequired: true, sortOrder: 0 },
    { name: "Police Station", slug: "police_station", dataType: "text", isRequired: true, sortOrder: 1 },
    { name: "Category", slug: "category", dataType: "enum", isRequired: true, sortOrder: 2, options: ["Arnesh Kumar Violation", "Ground of Arrest Violation (47 BNSS)", "Fail to submit replies", "Summon/Warrant report not submitted", "Unable to execute BW/NBW", "Detention for more than 24 Hrs", "Misbehaviour"] }
  ];
  for (const c of cols20) {
      await prisma.dataEntryColumn.upsert({
          where: { tableId_slug: { tableId: t20.id, slug: c.slug } },
          update: { dataType: c.dataType, enumOptions: c.options || null },
          create: { ...c, enumOptions: c.options || null, options: undefined, tableId: t20.id }
      });
  }

  // 7. Create "21. Details of applications filed by police officials DISMISSED by the court"
  const t21 = await prisma.dataEntryTable.upsert({
    where: { slug: 'police-apps-dismissed' },
    update: { sortOrder: 21, singleRow: false },
    create: {
      name: "21. Details of applications filed by police officials DISMISSED by the court",
      slug: "police-apps-dismissed",
      description: "Details of applications filed by police officials DISMISSED by the court",
      singleRow: false,
      sortOrder: 21,
      createdBy: devId,
    }
  });

  // Delete old old columns for 21 as well
  await prisma.dataEntryColumn.deleteMany({
    where: { tableId: t21.id, slug: { in: ['bail_cancelled', 'untraced_cancelled', 'cancelation_report_cancelled', '173_8_crpc_dismissed', 'other_app_dismissed'] } }
  });

  const cols21 = [
    { name: "Case Details", slug: "case_details", dataType: "text", isRequired: true, sortOrder: 0 },
    { name: "Police Station", slug: "police_station", dataType: "text", isRequired: true, sortOrder: 1 },
    { name: "Category", slug: "category", dataType: "enum", isRequired: true, sortOrder: 2, options: ["Bail Cancellation", "Disposal of case property", "Remand from judicial custody"] }
  ];
  for (const c of cols21) {
      await prisma.dataEntryColumn.upsert({
          where: { tableId_slug: { tableId: t21.id, slug: c.slug } },
          update: { dataType: c.dataType, enumOptions: c.options || null },
          create: { ...c, enumOptions: c.options || null, options: undefined, tableId: t21.id }
      });
  }

  // Trigger sync
  await syncTableDefinitions(prisma);
  console.log("Done syncing tables!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
