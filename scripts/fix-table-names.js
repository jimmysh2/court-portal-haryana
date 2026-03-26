const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Exact names from the PDF (with number prefix)
const CORRECT_NAMES = {
    'trials-disposed': '1. List of trials disposed/completed today',
    'cancellation-decisions': '2. Decision on Cancellation/Untraced Files',
    'police-applications': '3. Decision on any application filed by police officials',
    'bail-granted': '4. List of accused granted bail (along with surety / Identifier, Photos Etc)',
    'po-pp-bj': '5. List of declared POs/PPs/BJs',
    'property-attached': '6. Value of Property attached (85 BNSS & 107 BNSS)',
    'complaints-against-police': '7. Applications/Complaints/Istgasa filed against Police Officials',
    'fir-156-3': '8. FIR Registration under 156(3) CrPC',
    'sho-dsp-appeared': '9. List of SHOs and DSPs who appeared in court today (for deposition or other matter)',
    'police-deposition': '10. Deposition of police officials',
    'vc-prisoners': '11. VC of prisoners',
    'tips-conducted': '12. TIPs conducted today',
    'pairvi-witness': '13. Pairvi for private witness',
    'gangster-next-day': '14. Any Gangster/Notorious Criminal appearing in Court the next day',
    'property-offender-next-day': '15. Any Crime against Property offender appearing in court the next day',
    'bail-applications-tomorrow': '16. Fresh Bail Applications listed for tomorrow',
    'nbw-arrest-warrants': '17. NBW Arrest Warrants issued today',
};

async function main() {
    console.log('🔧 Fixing table names to match PDF exactly...\n');

    for (const [slug, correctName] of Object.entries(CORRECT_NAMES)) {
        const result = await prisma.dataEntryTable.updateMany({
            where: { slug },
            data: { name: correctName }
        });
        if (result.count > 0) {
            console.log(`  ✅ ${slug} => "${correctName}"`);
        } else {
            console.log(`  ⚠️ ${slug} not found in DB`);
        }
    }

    console.log('\n🎉 All table names updated!');
}

main().then(() => process.exit());
