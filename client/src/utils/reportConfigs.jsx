import React from 'react';

export const ClickableNum = ({ num, entries, onClick }) => {
    if (!num || num === '0' || num === 0) return <span>0</span>;
    return (
        <span 
            onClick={() => onClick(entries)}
            style={{ color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}
            title="Click to view underlying entries"
        >
            {num}
        </span>
    );
};

export const parseVal = (v) => {
    if (!v) return 0;
    const p = parseFloat(v);
    return isNaN(p) ? 0 : p;
};

export const filterByRegex = (entries, colSlug, regex) => entries.filter(e => {
    const val = e.values?.[colSlug] || '';
    return regex.test(String(val));
});

export const getTableColumns = (tableSlug) => {
    switch(tableSlug) {
        case 'trials-disposed':
            return [
                {
                    header: 'No. of FIRs',
                    renderCell: (entries, openModal) => <ClickableNum num={entries.length} entries={entries} onClick={openModal} />
                },
                {
                    header: 'No. of accused',
                    renderCell: (entries, openModal) => {
                        const count = entries.reduce((sum, e) => {
                            const val = e.values?.accused_name || '';
                            return sum + (val ? val.split(',').length : 0);
                        }, 0);
                        return <ClickableNum num={count} entries={entries} onClick={openModal} />
                    }
                }
            ];
        case 'cancellation-decisions':
            return [
                { header: 'Accepted', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'decision', /accept/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Further Investigation', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'decision', /further/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Take Cognizance', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'decision', /cognizance/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Proceeded as complaint', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'decision', /protest/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Total', renderCell: (entries, openModal) => <ClickableNum num={entries.length} entries={entries} onClick={openModal} /> }
            ];
        case 'police-applications':
            return [
                { header: 'Allowed', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'decision', /allow/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Dismissed', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'decision', /dismiss/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Abated', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'decision', /abat/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Total', renderCell: (entries, openModal) => <ClickableNum num={entries.length} entries={entries} onClick={openModal} /> }
            ];
        case 'bail-granted':
        case 'bail-applications-tomorrow':
            return [
                { header: 'Regular Bail', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'bail_type', /regular/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Interim Bail', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'bail_type', /interim/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Anticipatory Bail', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'bail_type', /anticipatory/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Total', renderCell: (entries, openModal) => <ClickableNum num={entries.length} entries={entries} onClick={openModal} /> }
            ];
        case 'po-pp-bj':
            return [
                { header: 'POs', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'declaration_type', /^po$/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'PPs', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'declaration_type', /^pp$/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Bail Jumpers', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'declaration_type', /bj|jumper/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Total', renderCell: (entries, openModal) => <ClickableNum num={entries.length} entries={entries} onClick={openModal} /> }
            ];
        case 'property-attached':
            return [
                { header: 'u/s 85 BNSS', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'bnss_section', /85/i);
                    const val = subset.reduce((sum, e) => sum + parseVal(e.values?.property_value), 0);
                    return <ClickableNum num={val} entries={subset} onClick={openModal} />
                }},
                { header: 'u/s 107 BNSS', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'bnss_section', /107/i);
                    const val = subset.reduce((sum, e) => sum + parseVal(e.values?.property_value), 0);
                    return <ClickableNum num={val} entries={subset} onClick={openModal} />
                }},
                { header: 'Total Value', renderCell: (entries, openModal) => {
                    const val = entries.reduce((sum, e) => sum + parseVal(e.values?.property_value), 0);
                    return <ClickableNum num={val} entries={entries} onClick={openModal} />
                }}
            ];
        case 'sho-dsp-appeared':
            return [
                { header: 'SHOs', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'rank', /sho/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'DSPs/Addl SPs', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'rank', /dsp|asp|sp/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Total', renderCell: (entries, openModal) => <ClickableNum num={entries.length} entries={entries} onClick={openModal} /> }
            ];
        case 'deposition-police':
            return [
                { header: 'Summoned', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.supposed_to_appear), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: 'Attended (Court)', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.appeared_physically), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: 'Examined (Court)', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_physically), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: 'Examined (VC)', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_via_vc), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: 'Exemptions', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.exemption_allowed), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: 'Unauthorized Absence', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.absent_unauthorized), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: 'Total Examined', renderCell: (entries) => {
                    const s3 = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_physically), 0);
                    const s4 = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_via_vc), 0);
                    return <span>{s3 + s4}</span>;
                }},
                { header: 'Pending Completion', renderCell: (entries) => {
                    const s1 = entries.reduce((acc, e) => acc + parseVal(e.values?.supposed_to_appear), 0);
                    const s3 = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_physically), 0);
                    const s4 = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_via_vc), 0);
                    const ex = entries.reduce((acc, e) => acc + parseVal(e.values?.exemption_allowed), 0);
                    const val = s1 - (s3 + s4 + ex);
                    return <span style={{ color: val > 0 ? 'var(--color-danger)' : 'inherit' }}>{val < 0 ? 0 : val}</span>;
                }}
            ];
        case 'vc-prisoners':
            return [
                { header: 'Physical Production', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.produced_physically), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: 'VC Production', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.produced_via_vc), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: 'Total produced', renderCell: (entries) => {
                    const sum1 = entries.reduce((acc, e) => acc + parseVal(e.values?.produced_physically), 0);
                    const sum2 = entries.reduce((acc, e) => acc + parseVal(e.values?.produced_via_vc), 0);
                    return <span>{sum1 + sum2}</span>;
                }}
            ];
        case 'pairvi-witness':
            return [
                { header: 'Examined', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.witnesses_examined), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: 'Prepared to Testify', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.witnesses_prepared), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }}
            ];
        case 'gangster-next-day':
        case 'property-offender-next-day':
            return [
                { header: 'On Bail', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'accused_status', /bail/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Judicial Custody', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'accused_status', /custody/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Total', renderCell: (entries, openModal) => <ClickableNum num={entries.length} entries={entries} onClick={openModal} /> }
            ];
        default:
            return [
                { header: 'Total Entries', renderCell: (entries, openModal) => <ClickableNum num={entries.length} entries={entries} onClick={openModal} /> }
            ];
    }
};
