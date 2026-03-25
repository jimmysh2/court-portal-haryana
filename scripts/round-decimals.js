const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up decimal values in data entries...');
  
  const entries = await prisma.dataEntry.findMany({
    where: { deletedAt: null }
  });

  console.log(`🔍 Checking ${entries.length} entries...`);
  let updatedCount = 0;

  for (const entry of entries) {
    const values = entry.values || {};
    let changed = false;
    const newValues = { ...values };

    for (const [key, val] of Object.entries(values)) {
      // If it's a number or a string that looks like a decimal
      const num = Number(val);
      if (!isNaN(num) && val !== '' && val !== null) {
        if (!Number.isInteger(num)) {
          newValues[key] = Math.round(num);
          changed = true;
          console.log(`  📝 Rounding entry ${entry.id} field [${key}]: ${val} -> ${newValues[key]}`);
        }
      }
    }

    if (changed) {
      await prisma.dataEntry.update({
        where: { id: entry.id },
        data: { values: newValues }
      });
      updatedCount++;
    }
  }

  console.log(`\n✅ Done! Updated ${updatedCount} entries.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
