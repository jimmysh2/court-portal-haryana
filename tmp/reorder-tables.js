const { PrismaClient } = require('@prisma/client');
const { syncTableDefinitions } = require('../scripts/auto-sync');
const prisma = new PrismaClient();

const NEW_ORDER = [
    { slug: 'trials-disposed', name: '1. List of trials disposed/completed today' },
    { slug: 'cancellation-decisions', name: '2. Decision on Cancellation/Untraced Files' },
    { slug: 'police-applications', name: '3. Decision on any application filed by police officials' },
    { slug: 'bail-granted', name: '4. List of accused whose bail bonds were furnished after grant of bail' },
    { slug: 'po-pp-bj', name: '5. List of declared POs/PPs/BJs' },
    { slug: 'property-attached', name: '6. Value of Property attached (85 BNSS & 107 BNSS)' },
    { slug: 'complaints-against-police', name: '7. Applications/Complaints/Istgasa filed against Police Officials' },
    { slug: 'fir-156-3', name: '8. FIR Registration under 156(3) CrPC' },
    { slug: 'police-deposition', name: '9. Deposition of police officials' },
    { slug: 'other-govt-deposition', name: '10. Deposition of other govt officials' },
    { slug: 'private-deposition', name: '11. Deposition of private individuals (public)' },
    { slug: 'vc-prisoners', name: '12. VC of prisoners' },
    { slug: 'tips-conducted', name: '13. Test Identification Parade of accused persons conducted today' },
    { slug: 'pairvi-witness', name: '14. Pairvi for private witness' },
    { slug: 'gangster-next-day', name: '15. Any Gangster/Notorious Criminal physically appearing in Court the next day' },
    { slug: 'property-offender-next-day', name: '16. Any Crime against Property offender physically appearing in court the next day' },
    { slug: 'bail-applications-tomorrow', name: '17. Fresh Bail Applications listed for tomorrow' },
    { slug: 'nbw-arrest-warrants', name: '18. NBW Arrest Warrants issued today' },
    { slug: 'accused-surrendered', name: '19. List of the accused who surrendered in court' },
    { slug: 'adverse-orders-police', name: '20. Details of adverse order passed against police officials' },
    { slug: 'police-apps-dismissed', name: '21. Details of applications filed by police officials: DISMISSED by the court' }
];

const TABLE_TO_DELETE = 'sho-dsp-appeared'; // Old 9

async function main() {
    console.log('🔄 Reordering and Renaming Tables 1 to 21...');

    // First delete the old table 9
    const old9 = await prisma.dataEntryTable.findUnique({ where: { slug: TABLE_TO_DELETE } });
    if (old9 && !old9.deletedAt) {
        await prisma.dataEntryTable.update({
            where: { slug: TABLE_TO_DELETE },
            data: { deletedAt: new Date() }
        });
        console.log(`🗑️ Soft-deleted old table: ${old9.name}`);
    }

    // Now loop over the new order and update existing tables
    for (let i = 0; i < NEW_ORDER.length; i++) {
        const item = NEW_ORDER[i];
        const newSortOrder = i + 1;
        
        await prisma.dataEntryTable.update({
            where: { slug: item.slug },
            data: {
                name: item.name,
                sortOrder: newSortOrder
            }
        });
        console.log(`✅ Set [${newSortOrder}] -> ${item.name}`);
    }

    // Run auto sync
    console.log('\n🔄 Running auto-sync to apply changes to table-definitions.js...');
    await syncTableDefinitions(prisma);
    console.log('🎉 Done! Tables sequence updated perfectly from 1 to 21.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
