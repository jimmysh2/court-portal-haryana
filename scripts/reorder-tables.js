const prisma = require('../server/lib/prisma');
const { syncTableDefinitions } = require('./auto-sync');

const updates = {
  "trials-disposed": { name: "1. List of trials disposed/completed today", sortOrder: 1 },
  "cancellation-decisions": { name: "2. Decision on Cancellation/Untraced Files", sortOrder: 2 },
  "police-applications": { name: "Decision on any application filed by police officials", sortOrder: 3 },
  "bail-granted": { name: "3. List of accused granted bail (along with surety/ Identifier, Photos Etc)", sortOrder: 4 },
  "po-pp-bj": { name: "4. List of declared POs/PPs/BJs", sortOrder: 5 },
  "property-attached": { name: "5. Value of Property attached (85 BNSS & 107 BNSS)", sortOrder: 6 },
  "complaints-against-police": { name: "6. Applications/Complaints/Istgasa filed against Police Officials", sortOrder: 7 },
  "fir-156-3": { name: "7. FIR Registration under 156(3) CrPC", sortOrder: 8 },
  "sho-dsp-appeared": { name: "8. List of SHOs and DSPs who appeared in court today (for deposition or other matter)", sortOrder: 9 },
  "police-deposition": { name: "9. Deposition of police officials", sortOrder: 10 },
  "deposition-govt-officials": { name: "10. Deposition of other govt officials", sortOrder: 11 },
  "deposition-private": { name: "11. Deposition of private individuals (public)", sortOrder: 12 },
  "vc-prisoners": { name: "12. VC of prisoners", sortOrder: 13 },
  "tips-conducted": { name: "13. TIPs conducted today", sortOrder: 14 },
  "pairvi-witness": { name: "14. Pairvi for private witness", sortOrder: 15 },
  "gangster-next-day": { name: "15. Any Gangster/Notorious Criminal appearing in Court the next day", sortOrder: 16 },
  "property-offender-next-day": { name: "16. Any Crime against Property offender appearing in court the next day", sortOrder: 17 },
  "bail-applications-tomorrow": { name: "17. Fresh Bail Applications listed for tomorrow", sortOrder: 18 },
  "nbw-arrest-warrants": { name: "18. NBW Arrest Warrants issued today", sortOrder: 19 },
  "accused-surrendered": { name: "19. List of the accused who surrendered in court", sortOrder: 20 },
  "adverse-order-police": { name: "20. Details of adverse order passed against police officials", sortOrder: 21 },
  "applications-dismissed": { name: "21. Details of applications filed by police officials DISMISSED by the court", sortOrder: 22 },
};

async function fix() {
  for (const [slug, data] of Object.entries(updates)) {
    await prisma.dataEntryTable.updateMany({
      where: { slug },
      data: { name: data.name, sortOrder: data.sortOrder }
    });
  }
  
  // also check if "Istgasa" is in the complaints-against-police header
  console.log("Renamed tables successfully");
  await syncTableDefinitions(prisma);
  console.log("Sync done");
}

fix().catch(console.error).finally(() => prisma.$disconnect());
