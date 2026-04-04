const { PrismaClient } = require('@prisma/client');
const { syncTableDefinitions } = require('../scripts/auto-sync');
const prisma = new PrismaClient();

const NEW_ORDER = [
    { slug: 'trials-disposed', name: '1. List of trials disposed/completed today' },
    { slug: 'cancellation-decisions', name: '2. Decision on Cancellation/Untraced Files' },
    { slug: 'bail-granted', name: '3. List of accused granted bail (along with surety / Identifier, Photos Etc)' },
    { slug: 'po-pp-bj', name: '4. List of declared POs/PPs/BJs' },
    { slug: 'property-attached', name: '5. Value of Property attached (85 BNSS & 107 BNSS)' },
    { slug: 'complaints-against-police', name: '6. Applications/Complaints/Istgasa filed against Police Officials' },
    { slug: 'fir-156-3', name: '7. FIR Registration under 156(3) CrPC' },
    { slug: 'sho-dsp-appeared', name: '8. List of SHOs and DSPs who appeared in court today (for deposition or other matter)' },
    { slug: 'police-deposition', name: '9. Deposition of police officials' },
    { slug: 'other-govt-deposition', name: '10. Deposition of other govt officials' },
    { slug: 'private-deposition', name: '11. Deposition of private individuals (public)' },
    { slug: 'vc-prisoners', name: '12. VC of prisoners' },
    { slug: 'tips-conducted', name: '13. TIPs conducted today' },
    { slug: 'pairvi-witness', name: '14. Pairvi for private witness' },
    { slug: 'gangster-next-day', name: '15. Any Gangster/Notorious Criminal appearing in Court the next day' },
    { slug: 'property-offender-next-day', name: '16. Any Crime against Property offender appearing in court the next day' },
    { slug: 'bail-applications-tomorrow', name: '17. Fresh Bail Applications listed for tomorrow' },
    { slug: 'nbw-arrest-warrants', name: '18. NBW Arrest Warrants issued today' },
    { slug: 'accused-surrendered', name: '19. List of the accused who surrendered in court' },
    { slug: 'adverse-orders-police', name: '20. Details of adverse order passed against police officials' },
    { slug: 'police-apps-dismissed', name: '21. Police apps DISMISSED (Bail Cancel, Case prop, Remand)' }
];

const TABLES_TO_DELETE = ['police-applications']; // Old 3

async function main() {
    console.log('🔄 Reordering and Renaming Tables exactly as requested...');

    // Delete what needs to be deleted
    for(const slug of TABLES_TO_DELETE) {
        const t = await prisma.dataEntryTable.findUnique({ where: { slug } });
        if (t && !t.deletedAt) {
            await prisma.dataEntryTable.update({
                where: { slug },
                data: { deletedAt: new Date() } // Removed sortOrder: null
            });
            console.log(`🗑️ Soft-deleted old table: ${t.name}`);
        }
    }

    // Now loop over the new order and update existing tables (and restore if deleted)
    for (let i = 0; i < NEW_ORDER.length; i++) {
        const item = NEW_ORDER[i];
        const newSortOrder = i + 1;
        
        await prisma.dataEntryTable.update({
            where: { slug: item.slug },
            data: {
                name: item.name,
                sortOrder: newSortOrder,
                deletedAt: null // ensuring it's restored if it was soft-deleted
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
