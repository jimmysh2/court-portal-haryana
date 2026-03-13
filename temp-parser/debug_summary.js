const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const districts = await prisma.district.count();
    const courts = await prisma.court.count();
    const magistrates = await prisma.magistrate.count();
    const users = await prisma.user.groupBy({
        by: ['role'],
        _count: { id: true }
    });

    console.log(`Districts: ${districts}`);
    console.log(`Courts: ${courts}`);
    console.log(`Judicial Officers: ${magistrates}`);
    console.log(`Users:`, users);

    const allUsers = await prisma.user.findMany({
        select: { username: true, role: true, name: true }
    });

    const roles = {
        developer: allUsers.filter(u => u.role === 'developer'),
        state_admin: allUsers.filter(u => u.role === 'state_admin'),
        state_viewer: allUsers.filter(u => u.role === 'state_viewer'),
        district_admin: allUsers.filter(u => u.role === 'district_admin'),
        district_viewer: allUsers.filter(u => u.role === 'district_viewer'),
        naib_court: allUsers.filter(u => u.role === 'naib_court')
    };

    console.log('\n--- SYSTEM USERS ---');
    console.log('Developer (pw: admin123):', roles.developer.map(u => u.username).join(', '));
    console.log('State Admin (pw: state123):', roles.state_admin.map(u => u.username).join(', '));
    console.log('State Viewer (pw: viewer123):', roles.state_viewer.map(u => u.username).join(', '));
    console.log('\nDistrict Admins (pw: district123):');
    roles.district_admin.forEach(u => console.log(`  - ${u.name}: ${u.username}`));
    console.log('\nDistrict Viewers (pw: viewer123):');
    roles.district_viewer.forEach(u => console.log(`  - ${u.name}: ${u.username}`));

    // Naib courts sample just to show format
    console.log(`\nNaib Courts (pw: Welcome@123): ${roles.naib_court.length} total users imported.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
