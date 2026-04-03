export const ClickableNum = ({ num, entries, onClick }) => {
    if (!num || num === '0' || num === 0) return <span>0</span>;
    const displayVal = typeof num === 'number' ? num.toLocaleString('en-IN') : num;
    return (
        <span 
            onClick={() => onClick(entries)}
            style={{ color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}
            title="Click to view underlying entries"
        >
            {displayVal}
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
    return regex.test(val);
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
                {
                    header: 'Accepted',
                    renderCell: (entries, openModal) => {
                        const subset = filterByRegex(entries, 'decision', /accept/i);
                        return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                    }
                },
                {
                    header: 'Further Investigation',
                    renderCell: (entries, openModal) => {
                        const subset = filterByRegex(entries, 'decision', /further/i);
                        return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                    }
                },
                {
                    header: 'Take Cognizance',
                    renderCell: (entries, openModal) => {
                        const subset = filterByRegex(entries, 'decision', /cognizance/i);
                        return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                    }
                },
                {
                    header: 'Proceeded as complaint on protest petition',
                    renderCell: (entries, openModal) => {
                        const subset = filterByRegex(entries, 'decision', /protest/i);
                        return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                    }
                },
                {
                    header: 'Total',
                    renderCell: (entries, openModal) => <ClickableNum num={entries.length} entries={entries} onClick={openModal} />
                }
            ];
        case 'police-applications':
            return [
                {
                    header: 'Allowed',
                    renderCell: (entries, openModal) => {
                        const subset = filterByRegex(entries, 'decision', /allow/i);
                        return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                    }
                },
                {
                    header: 'Dismissed',
                    renderCell: (entries, openModal) => {
                        const subset = filterByRegex(entries, 'decision', /dismiss/i);
                        return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                    }
                },
                {
                    header: 'Abated',
                    renderCell: (entries, openModal) => {
                        const subset = filterByRegex(entries, 'decision', /abat/i);
                        return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                    }
                },
                {
                    header: 'Total',
                    renderCell: (entries, openModal) => <ClickableNum num={entries.length} entries={entries} onClick={openModal} />
                }
            ];
        case 'bail-granted':
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
        case 'bail-applications-tomorrow':
            return [
                { header: 'Regular Bail', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'bail_type', /regular/i);
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
                { header: 'PO/PP', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'declaration_type', /PO\/PP/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Bail Jumpers', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'declaration_type', /BJ/i);
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
                { header: 'Total Value of Property', renderCell: (entries, openModal) => {
                    const val = entries.reduce((sum, e) => sum + parseVal(e.values?.property_value), 0);
                    return <ClickableNum num={val} entries={entries} onClick={openModal} />
                }}
            ];
        case 'complaints-against-police':
        case 'fir-156-3':
        case 'tips-conducted':
        case 'nbw-arrest-warrants':
            return [
                { header: 'Total', renderCell: (entries, openModal) => <ClickableNum num={entries.length} entries={entries} onClick={openModal} /> }
            ];
        case 'sho-dsp-appeared':
            return [
                { header: 'SHOs', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'rank', /sho/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'DSPs/ASPs/Addl SPs', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'rank', /dsp|asp/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Total Appearances', renderCell: (entries, openModal) => <ClickableNum num={entries.length} entries={entries} onClick={openModal} /> }
            ];
        case 'police-deposition':
            return [
                { header: 'Summoned', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.supposed_to_appear), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: 'Not Appeared', renderCell: (entries, openModal) => {
                    const sum1 = entries.reduce((acc, e) => acc + parseVal(e.values?.supposed_to_appear), 0);
                    const sum2 = entries.reduce((acc, e) => acc + parseVal(e.values?.appeared_physically), 0);
                    const sum4 = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_via_vc), 0);
                    const val = sum1 - (sum2 + sum4);
                    return <span>{val < 0 ? 0 : val}</span>;
                }},
                { header: '% Not Appeared in Court or VC', renderCell: (entries) => {
                    const sum1 = entries.reduce((acc, e) => acc + parseVal(e.values?.supposed_to_appear), 0);
                    const sum2 = entries.reduce((acc, e) => acc + parseVal(e.values?.appeared_physically), 0);
                    const sum4 = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_via_vc), 0);
                    if (sum1 === 0) return <span>0%</span>;
                    const val = sum1 - (sum2 + sum4);
                    return <span>{((val / sum1) * 100).toFixed(1)}%</span>;
                }},
                { header: 'Attended Physically', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.appeared_physically), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: 'Examined in Court', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_physically), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: '% Examined in Court after appearing Physically', renderCell: (entries) => {
                    const sum2 = entries.reduce((acc, e) => acc + parseVal(e.values?.appeared_physically), 0);
                    const sum3 = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_physically), 0);
                    if (sum2 === 0) return <span>0%</span>;
                    return <span>{((sum3 / sum2) * 100).toFixed(1)}%</span>;
                }},
                { header: 'Not Examined in Court after being Present', renderCell: (entries) => {
                    const sum2 = entries.reduce((acc, e) => acc + parseVal(e.values?.appeared_physically), 0);
                    const sum3 = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_physically), 0);
                    const val = sum2 - sum3;
                    return <span>{val < 0 ? 0 : val}</span>;
                }},
                { header: 'Examined through VC', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_via_vc), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: '% examined through VC', renderCell: (entries) => {
                    const sum3 = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_physically), 0);
                    const sum4 = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_via_vc), 0);
                    const totalExamined = sum3 + sum4;
                    if (totalExamined === 0) return <span>0%</span>;
                    return <span>{((sum4 / totalExamined) * 100).toFixed(1)}%</span>;
                }},
                { header: 'Total Examined (Court+VC)', renderCell: (entries) => {
                    const sum3 = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_physically), 0);
                    const sum4 = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_via_vc), 0);
                    return <span>{sum3 + sum4}</span>;
                }},
                { header: '% Total Examined', renderCell: (entries) => {
                    const sum1 = entries.reduce((acc, e) => acc + parseVal(e.values?.supposed_to_appear), 0);
                    const sum3 = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_physically), 0);
                    const sum4 = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_via_vc), 0);
                    if (sum1 === 0) return <span>0%</span>;
                    return <span>{(((sum3 + sum4) / sum1) * 100).toFixed(1)}%</span>;
                }},
                { header: 'Authorized Request', renderCell: (entries) => {
                    const sum1 = entries.reduce((acc, e) => acc + parseVal(e.values?.supposed_to_appear), 0);
                    const sum2 = entries.reduce((acc, e) => acc + parseVal(e.values?.appeared_physically), 0);
                    const sum4 = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_via_vc), 0);
                    const sum5 = entries.reduce((acc, e) => acc + parseVal(e.values?.absent_unauthorized), 0);
                    const notAppeared = sum1 - (sum2 + sum4);
                    const val = notAppeared - sum5;
                    return <span>{val < 0 ? 0 : val}</span>;
                }},
                { header: 'Unauthorized Request', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.absent_unauthorized), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: '% Unauthorized Request', renderCell: (entries) => {
                    const sum1 = entries.reduce((acc, e) => acc + parseVal(e.values?.supposed_to_appear), 0);
                    const sum2 = entries.reduce((acc, e) => acc + parseVal(e.values?.appeared_physically), 0);
                    const sum4 = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_via_vc), 0);
                    const sum5 = entries.reduce((acc, e) => acc + parseVal(e.values?.absent_unauthorized), 0);
                    const notAppeared = sum1 - (sum2 + sum4);
                    if (notAppeared === 0) return <span>0%</span>;
                    return <span>{((sum5 / notAppeared) * 100).toFixed(1)}%</span>;
                }}
            ];
        case 'vc-prisoners':
            return [
                { header: 'Total Accused produced Physically', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.produced_physically), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: 'Total Accused produced through VC', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.produced_via_vc), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: '% Appearance through VC', renderCell: (entries) => {
                    const sumP = entries.reduce((acc, e) => acc + parseVal(e.values?.produced_physically), 0);
                    const sumV = entries.reduce((acc, e) => acc + parseVal(e.values?.produced_via_vc), 0);
                    const tot = sumP + sumV;
                    if (tot === 0) return <span>0%</span>;
                    return <span>{((sumV / tot) * 100).toFixed(1)}%</span>;
                }}
            ];
        case 'pairvi-witness':
            return [
                { header: 'Total Witnesses Examined', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.witnesses_examined), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: 'Witness prepared to testify', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.witnesses_prepared), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: '% witnesses prepared', renderCell: (entries) => {
                    const ex = entries.reduce((acc, e) => acc + parseVal(e.values?.witnesses_examined), 0);
                    const pr = entries.reduce((acc, e) => acc + parseVal(e.values?.witnesses_prepared), 0);
                    if (ex === 0) return <span>0%</span>;
                    return <span>{((pr / ex) * 100).toFixed(1)}%</span>;
                }}
            ];
        case 'gangster-next-day':
        case 'property-offender-next-day':
            return [
                { header: 'On Bail', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'accused_status', /bail/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'From Judicial Custody', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'accused_status', /custody/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Total', renderCell: (entries, openModal) => <ClickableNum num={entries.length} entries={entries} onClick={openModal} /> }
            ];
        case 'deposition-other-govt':
        case 'deposition-private':
            return [
                { header: 'Total Summoned', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.total_summoned), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: 'Telephonically Informed', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.telephonically_informed), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: '% Informed', renderCell: (entries) => {
                    const s1 = entries.reduce((acc, e) => acc + parseVal(e.values?.total_summoned), 0);
                    const s2 = entries.reduce((acc, e) => acc + parseVal(e.values?.telephonically_informed), 0);
                    if (s1 === 0) return <span>0%</span>;
                    return <span>{((s2 / s1) * 100).toFixed(1)}%</span>;
                }},
                { header: 'Appeared Physically', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.appeared_physically), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: 'Examined Physically', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_physically), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: 'Examined via VC', renderCell: (entries, openModal) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_vc), 0);
                    return <ClickableNum num={sum} entries={entries} onClick={openModal} />
                }},
                { header: 'Total Examined (Phys + VC)', renderCell: (entries) => {
                    const p = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_physically), 0);
                    const v = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_vc), 0);
                    return <span>{p + v}</span>;
                }},
                { header: '% Total Examined', renderCell: (entries) => {
                    const s = entries.reduce((acc, e) => acc + parseVal(e.values?.total_summoned), 0);
                    const p = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_physically), 0);
                    const v = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_vc), 0);
                    if (s === 0) return <span>0%</span>;
                    return <span>{(((p + v) / s) * 100).toFixed(1)}%</span>;
                }},
                { header: 'Not Appeared', renderCell: (entries) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.total_summoned), 0);
                    const p = entries.reduce((acc, e) => acc + parseVal(e.values?.appeared_physically), 0);
                    const v = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_vc), 0);
                    const val = sum - (p + v);
                    return <span>{val < 0 ? 0 : val}</span>;
                }},
                { header: '% Not Appeared', renderCell: (entries) => {
                    const sum = entries.reduce((acc, e) => acc + parseVal(e.values?.total_summoned), 0);
                    const p = entries.reduce((acc, e) => acc + parseVal(e.values?.appeared_physically), 0);
                    const v = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_vc), 0);
                    if (sum === 0) return <span>0%</span>;
                    const val = sum - (p + v);
                    return <span>{((val / sum) * 100).toFixed(1)}%</span>;
                }},
                { header: 'Not Examined (after appearing)', renderCell: (entries) => {
                    const p = entries.reduce((acc, e) => acc + parseVal(e.values?.appeared_physically), 0);
                    const e_p = entries.reduce((acc, e) => acc + parseVal(e.values?.examined_physically), 0);
                    const val = p - e_p;
                    return <span>{val < 0 ? 0 : val}</span>;
                }}
            ];
        case 'accused-surrendered':
            return [
                { header: 'Granted Regular Bail', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'status', /regular/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Sent to Judicial Custody', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'status', /judicial/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Sent to Police Custody', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'status', /police/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Total', renderCell: (entries, openModal) => <ClickableNum num={entries.length} entries={entries} onClick={openModal} /> }
            ];
        case 'adverse-orders':
            return [
                { header: 'Arnesh Kumar Violation', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'category', /arnesh/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Arrest Violation (47 BNSS)', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'category', /47\s+bnss/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Filing/No filing replies', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'category', /filing/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Summon/Warrant Not Submitted', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'category', /summon/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'BW/NBW Execution Failure', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'category', /bw/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Detention > 24hrs', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'category', /24/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Misbehaviour', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'category', /misbehav/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Total Orders', renderCell: (entries, openModal) => <ClickableNum num={entries.length} entries={entries} onClick={openModal} /> }
            ];
        case 'applications-dismissed':
            return [
                { header: 'Bail Cancellation', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'category', /bail/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Disposal of case property', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'category', /disposal/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Remand from Judicial Custody', renderCell: (entries, openModal) => {
                    const subset = filterByRegex(entries, 'category', /remand/i);
                    return <ClickableNum num={subset.length} entries={subset} onClick={openModal} />
                }},
                { header: 'Total Dismissed', renderCell: (entries, openModal) => <ClickableNum num={entries.length} entries={entries} onClick={openModal} /> }
            ];
        default:
            return [
                { header: 'Total Entries', renderCell: (entries, openModal) => <ClickableNum num={entries.length} entries={entries} onClick={openModal} /> }
            ];
    }
};
