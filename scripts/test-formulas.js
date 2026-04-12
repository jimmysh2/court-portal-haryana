const testTable10 = () => {
    console.log("=== TABLE 10 (POLICE DEPOSITION) TEST ===");
    // dummy data
    const supposed_to_appear = 200;
    const appeared_physically = 40;
    const examined_physically = 30;
    const examined_via_vc = 40;
    const absent_unauthorized = 10;
    
    const sum1 = supposed_to_appear;
    const sum2 = appeared_physically;
    const sum3 = examined_physically;
    const sum4 = examined_via_vc;
    const sum5 = absent_unauthorized;

    const notAppeared = sum1 - (sum2 + sum4);
    console.log(`Summoned: ${sum1}`);
    console.log(`Not Appeared: ${notAppeared}`);
    console.log(`% Not Appeared in Court or VC: ${((notAppeared / sum1) * 100).toFixed(2)}% (Formula: ((200 - (40 + 40)) / 200) * 100)`);
    console.log(`Attended Physically: ${sum2}`);
    console.log(`Examined in Court: ${sum3}`);
    console.log(`% Examined in Court after appearing Physically: ${((sum3 / sum2) * 100).toFixed(2)}% (Formula: (30 / 40) * 100)`);
    const notExaminedPresent = sum2 - sum3;
    console.log(`Not Examined in Court after being Present: ${notExaminedPresent}`);
    console.log(`Examined through VC: ${sum4}`);
    console.log(`% examined through VC: ${((sum4 / sum1) * 100).toFixed(2)}% (Formula: (40 / 200) * 100)`);
    const totalExamined = sum3 + sum4;
    console.log(`Total Examined (Court+VC): ${totalExamined}`);
    console.log(`% Total Examined: ${((totalExamined / sum1) * 100).toFixed(2)}% (Formula: ((30 + 40) / 200) * 100)`);
    const authorized = notAppeared - sum5;
    console.log(`Authorized Request: ${authorized}`);
    console.log(`Unauthorized Request: ${sum5}`);
    console.log(`% Unauthorized Request: ${((sum5 / notAppeared) * 100).toFixed(2)}% (Formula: (10 / 120) * 100)`);
    console.log("");
}

const testTable11_12 = () => {
    console.log("=== TABLE 11 & 12 (GOVT/PRIVATE DEPOSITION) TEST ===");
    // dummy data
    const supposed_to_appear = 200;
    const informed_on_phone = 50;
    const appeared_physically = 40;
    const examined_physically = 30;
    const examined_through_vc = 40;

    const sum1 = supposed_to_appear;
    const sum2 = informed_on_phone;
    const sum3 = appeared_physically;
    const sum4 = examined_physically;
    const sum5 = examined_through_vc;

    const notAppeared = sum1 - (sum3 + sum5);
    console.log(`Summoned: ${sum1}`);
    console.log(`Not Appeared: ${notAppeared}`);
    console.log(`% Not Appeared in Court or VC: ${((notAppeared / sum1) * 100).toFixed(2)}%`);
    console.log(`Attended Physically: ${sum3}`);
    console.log(`Examined in Court: ${sum4}`);
    console.log(`% Examined in Court after appearing Physically: ${((sum4 / sum3) * 100).toFixed(2)}%`);
    console.log(`Not Examined in Court after being Present: ${sum3 - sum4}`);
    console.log(`Examined through VC: ${sum5}`);
    console.log(`% examined through VC: ${((sum5 / sum1) * 100).toFixed(2)}%`);
    const totalExamined = sum4 + sum5;
    console.log(`Total Examined (Court+VC): ${totalExamined}`);
    console.log(`% Total Examined: ${((totalExamined / sum1) * 100).toFixed(2)}%`);
    console.log(`Telephonically informed: ${sum2}`);
    console.log(`% Informed: ${((sum2 / sum1) * 100).toFixed(2)}%`);
}

testTable10();
testTable11_12();
