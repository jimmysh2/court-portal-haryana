/**
 * update-table-names.js
 * One-time script: Updates table names in the database to match table-definitions.js
 * Run with: node scripts/update-table-names.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Slug → New Name mapping (from updated table-definitions.js)
const nameUpdates = [
    { slug: 'police-applications',        name: '3. Decision on any application filed by police officials' },
    { slug: 'bail-granted',               name: '4. List of accused granted bail (along with surety/ Identifier, Photos Etc)' },
    { slug: 'po-pp-bj',                   name: '5. List of declared POs/PPs/BJs' },
    { slug: 'property-attached',          name: '6. Value of Property attached (85 BNSS & 107 BNSS)' },
    { slug: 'complaints-against-police',  name: '7. Applications/Complaints/Istgasa filed against Police Officials' },
    { slug: 'fir-156-3',                  name: '8. FIR Registration under 156(3) CrPC' },
    { slug: 'sho-dsp-appeared',           name: '9. List of SHOs and DSPs who appeared in court today (for deposition or other matter)' },
    { slug: 'police-deposition',          name: '10. Deposition of police officials' },
    { slug: 'deposition-govt-officials',  name: '11. Deposition of other govt officials' },
    { slug: 'deposition-private',         name: '12. Deposition of private individuals (public)' },
    { slug: 'vc-prisoners',              name: '13. VC of prisoners' },
    { slug: 'tips-conducted',            name: '14. TIPs conducted today' },
    { slug: 'pairvi-witness',            name: '15. Pairvi for private witness' },
    { slug: 'gangster-next-day',         name: '16. Any Gangster/Notorious Criminal appearing in Court the next day' },
    { slug: 'property-offender-next-day',name: '17. Any Crime against Property offender appearing in court the next day' },
    { slug: 'bail-applications-tomorrow',name: '18. Fresh Bail Applications listed for tomorrow' },
    { slug: 'nbw-arrest-warrants',       name: '19. NBW Arrest Warrants issued today' },
    { slug: 'accused-surrendered',       name: '20. List of the accused who surrendered in court' },
    { slug: 'adverse-order-police',      name: '21. Details of adverse order passed against police officials' },
    { slug: 'applications-dismissed',    name: '22. Details of applications filed by police officials DISMISSED by the court' },
];

async function main() {
    console.log('🔄 Updating table names in database...\n');

    for (const update of nameUpdates) {
        const existing = await prisma.dataEntryTable.findFirst({
            where: { slug: update.slug, deletedAt: null }
        });

        if (!existing) {
            console.log(`⚠️  SKIP — slug not found: ${update.slug}`);
            continue;
        }

        if (existing.name === update.name) {
            console.log(`✅ Already up-to-date: ${update.slug}`);
            continue;
        }

        await prisma.dataEntryTable.update({
            where: { id: existing.id },
            data: { name: update.name }
        });

        console.log(`✅ Updated: "${existing.name}"\n         → "${update.name}"`);
    }

    console.log('\n🎉 Done! All table names updated in database.');
    console.log('⚡ Frontend will now show the updated names automatically.');
}

main()
    .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
    .finally(() => prisma.$disconnect());
