// ─── AUTO-GENERATED: Single Source of Truth for Table Definitions ───────────
// This file is automatically updated whenever a table or column is modified
// via the Developer Dashboard. You may also edit it manually if needed.

module.exports = [
    {
        "name": "1. List of trials disposed/completed today",
        "slug": "trials-disposed",
        "description": "List of trials disposed/completed today",
        "singleRow": false,
        "sortOrder": 1,
        "columns": [
            { "name": "FIR Number", "slug": "fir_no", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "FIR Year", "slug": "fir_year", "dataType": "year", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Sections (U/s)", "slug": "sections", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 2 },
            { "name": "Police Station", "slug": "police_station", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 3 },
            { "name": "Name of Accused", "slug": "accused_name", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 4 }
        ]
    },
    {
        "name": "2. Decision on Cancellation/Untraced Files",
        "slug": "cancellation-decisions",
        "description": "Decision on Cancellation/Untraced Files",
        "singleRow": false,
        "sortOrder": 2,
        "columns": [
            { "name": "FIR Number", "slug": "fir_no", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "FIR Year", "slug": "fir_year", "dataType": "year", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Sections (U/s)", "slug": "sections", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 2 },
            { "name": "Police Station", "slug": "police_station", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 3 },
            { "name": "Decision", "slug": "decision", "dataType": "enum", "enumOptions": ["Accept", "Further investigation", "Take cognizance", "Take protest petition and proceed as complaint"], "isRequired": true, "sortOrder": 4 }
        ]
    },
    {
        "name": "2b. Decision on any application filed by police officials",
        "slug": "police-applications",
        "description": "Decision on any application filed by police officials",
        "singleRow": false,
        "sortOrder": 3,
        "columns": [
            { "name": "Application Type", "slug": "application_type", "dataType": "enum", "enumOptions": ["Case Property Disposal", "Bail Cancellation", "Other"], "isRequired": true, "sortOrder": 0 },
            { "name": "Date of Application", "slug": "application_date", "dataType": "date", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Decision", "slug": "decision", "dataType": "enum", "enumOptions": ["Allowed", "Dismissed", "Abated"], "isRequired": true, "sortOrder": 2 },
            { "name": "Reasons for Dismissal", "slug": "dismissal_reasons", "dataType": "text", "enumOptions": null, "isRequired": false, "sortOrder": 3 },
            { "name": "Remarks", "slug": "remarks", "dataType": "text", "enumOptions": null, "isRequired": false, "sortOrder": 4 }
        ]
    },
    {
        "name": "3. List of accused granted bail",
        "slug": "bail-granted",
        "description": "List of accused whose bail bonds were furnished (along with surety/identifier etc.)",
        "singleRow": false,
        "sortOrder": 4,
        "columns": [
            { "name": "Name of Accused", "slug": "accused_name", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "FIR Details", "slug": "fir_details", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Police Station", "slug": "police_station", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 2 },
            { "name": "Bail Type", "slug": "bail_type", "dataType": "enum", "enumOptions": ["Regular Bail", "Interim Bail", "Anticipatory Bail"], "isRequired": true, "sortOrder": 3 },
            { "name": "Name of Surety", "slug": "surety_name", "dataType": "text", "enumOptions": null, "isRequired": false, "sortOrder": 4 },
            { "name": "Photo (Yes/No)", "slug": "photo_taken", "dataType": "boolean", "enumOptions": null, "isRequired": false, "sortOrder": 5 }
        ]
    },
    {
        "name": "4. List of declared POs/PPs/BJs",
        "slug": "po-pp-bj",
        "description": "List of declared POs/PPs/BJs",
        "singleRow": false,
        "sortOrder": 5,
        "columns": [
            { "name": "Name of Accused", "slug": "accused_name", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "FIR Details", "slug": "fir_details", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Police Station", "slug": "police_station", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 2 },
            { "name": "Declaration Type", "slug": "declaration_type", "dataType": "enum", "enumOptions": ["PO/PP", "BJ"], "isRequired": true, "sortOrder": 3 }
        ]
    },
    {
        "name": "5. Value of Property attached (86 BNSS & 107 BNSS)",
        "slug": "property-attached",
        "description": "Detail of Property attached (86 BNSS & 107 BNSS)",
        "singleRow": false,
        "sortOrder": 6,
        "columns": [
            { "name": "Name of Accused", "slug": "accused_name", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "FIR Details", "slug": "fir_details", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Police Station", "slug": "police_station", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 2 },
            { "name": "Section (86/107 BNSS)", "slug": "bnss_section", "dataType": "enum", "enumOptions": ["86 BNSS", "107 BNSS"], "isRequired": true, "sortOrder": 3 },
            { "name": "Details of Property", "slug": "property_details", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 4 },
            { "name": "Value of Property", "slug": "property_value", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 5 }
        ]
    },
    {
        "name": "6. Applications/Complaints filed against Police Officials",
        "slug": "complaints-against-police",
        "description": "Applications/Complaints filed against Police Officials",
        "singleRow": false,
        "sortOrder": 7,
        "columns": [
            { "name": "Details of Applicant", "slug": "applicant_details", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "Brief Fact of Application", "slug": "brief_facts", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Next hearing date", "slug": "next_hearing_date", "dataType": "date", "enumOptions": null, "isRequired": true, "sortOrder": 2 }
        ]
    },
    {
        "name": "7. FIR Registration under 156(3) CrPC",
        "slug": "fir-156-3",
        "description": "FIR Registration under 156(3) CrPC",
        "singleRow": false,
        "sortOrder": 8,
        "columns": [
            { "name": "Details of Applicant", "slug": "applicant_details", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "Sections mentioned in complaint", "slug": "complaint_sections", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Police Station", "slug": "police_station", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 2 },
            { "name": "Details of police officials", "slug": "police_official_details", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 3 }
        ]
    },
    {
        "name": "8. List of SHOs and DSPs who appeared in court today",
        "slug": "sho-dsp-appeared",
        "description": "List of SHOs and DSPs who appeared in court today",
        "singleRow": false,
        "sortOrder": 9,
        "columns": [
            { "name": "Name of SHO/ DSP", "slug": "officer_name", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "Rank (SHO/DSP/ASP/etc)", "slug": "rank", "dataType": "enum", "enumOptions": ["SHO", "DSP/ASP/Addl SP"], "isRequired": true, "sortOrder": 1 },
            { "name": "Place of Posting", "slug": "posting_place", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 2 },
            { "name": "Reason", "slug": "reason", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 3 },
            { "name": "Duration of Stay", "slug": "stay_duration", "dataType": "text", "enumOptions": null, "isRequired": false, "sortOrder": 4 },
            { "name": "Remarks", "slug": "remarks", "dataType": "text", "enumOptions": null, "isRequired": false, "sortOrder": 5 }
        ]
    },
    {
        "name": "9. Deposition of police officials",
        "slug": "police-deposition",
        "description": "Deposition of police officials aggregate counts",
        "singleRow": true,
        "sortOrder": 10,
        "columns": [
            { "name": "Supposed to Appear", "slug": "supposed_to_appear", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "Appeared Physically", "slug": "appeared_physically", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Examined Physically", "slug": "examined_physically", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 2 },
            { "name": "Examined via VC", "slug": "examined_via_vc", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 3 },
            { "name": "Absent (Unauthorized)", "slug": "absent_unauthorized", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 4 }
        ]
    },
    {
        "name": "10. Deposition of other govt officials",
        "slug": "govt-deposition",
        "description": "Deposition of other govt officials aggregate counts",
        "singleRow": true,
        "sortOrder": 11,
        "columns": [
            { "name": "Supposed to Appear", "slug": "supposed_to_appear", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "Informed on phone one day before", "slug": "informed_on_phone", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Appeared Physically", "slug": "appeared_physically", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 2 },
            { "name": "Examined Physically", "slug": "examined_physically", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 3 },
            { "name": "Examined via VC", "slug": "examined_via_vc", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 4 }
        ]
    },
    {
        "name": "11. Deposition of private individuals (public)",
        "slug": "private-deposition",
        "description": "Deposition of private individuals aggregate counts",
        "singleRow": true,
        "sortOrder": 12,
        "columns": [
            { "name": "Supposed to Appear", "slug": "supposed_to_appear", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "Informed on phone one day before", "slug": "informed_on_phone", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Appeared Physically", "slug": "appeared_physically", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 2 },
            { "name": "Examined Physically", "slug": "examined_physically", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 3 },
            { "name": "Examined via VC", "slug": "examined_via_vc", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 4 }
        ]
    },
    {
        "name": "12. VC of prisoners",
        "slug": "vc-prisoners",
        "description": "VC of prisoners aggregate counts",
        "singleRow": true,
        "sortOrder": 13,
        "columns": [
            { "name": "Produced Physically", "slug": "produced_physically", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "Produced via VC", "slug": "produced_via_vc", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 1 }
        ]
    },
    {
        "name": "13. TIPs conducted today",
        "slug": "tips-conducted",
        "description": "TIPs conducted today",
        "singleRow": false,
        "sortOrder": 14,
        "columns": [
            { "name": "FIR Details (No/Date/Us)", "slug": "fir_details", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "Police Station", "slug": "police_station", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 1 }
        ]
    },
    {
        "name": "14. Pairvi for private witness",
        "slug": "pairvi-witness",
        "description": "Pairvi for private witness aggregate counts",
        "singleRow": true,
        "sortOrder": 15,
        "columns": [
            { "name": "Witnesses Examined", "slug": "witnesses_examined", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "Witnesses prepared out of examined", "slug": "witnesses_prepared", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 1 }
        ]
    },
    {
        "name": "15. Any Gangster/Notorious Criminal physically appearing in Court the next day",
        "slug": "gangster-next-day",
        "description": "Gangster appearing in court next day",
        "singleRow": false,
        "sortOrder": 16,
        "columns": [
            { "name": "Gang Details", "slug": "gangster_details", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "FIR Details", "slug": "fir_details", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Police Station", "slug": "police_station", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 2 },
            { "name": "Accused Status", "slug": "accused_status", "dataType": "enum", "enumOptions": ["On Bail", "In Custody"], "isRequired": true, "sortOrder": 3 },
            { "name": "Name of Jail", "slug": "jail_name", "dataType": "text", "enumOptions": null, "isRequired": false, "sortOrder": 4 }
        ]
    },
    {
        "name": "16. Any Crime against Property offender physically appearing in court the next day",
        "slug": "property-offender-next-day",
        "description": "Property offender appearing in court next day",
        "singleRow": false,
        "sortOrder": 17,
        "columns": [
            { "name": "Accused Details", "slug": "accused_details", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "FIR Details", "slug": "fir_details", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Police Station", "slug": "police_station", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 2 },
            { "name": "Accused Status", "slug": "accused_status", "dataType": "enum", "enumOptions": ["On Bail", "In Custody"], "isRequired": true, "sortOrder": 3 },
            { "name": "Name of Jail", "slug": "jail_name", "dataType": "text", "enumOptions": null, "isRequired": false, "sortOrder": 4 }
        ]
    },
    {
        "name": "17. Fresh Bail Applications listed for tomorrow",
        "slug": "bail-applications-tomorrow",
        "description": "Bail Applications listed for tomorrow",
        "singleRow": false,
        "sortOrder": 18,
        "columns": [
            { "name": "Name of Accused", "slug": "accused_name", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "FIR Details", "slug": "fir_details", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Police Station", "slug": "police_station", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 2 },
            { "name": "Bail Type", "slug": "bail_type", "dataType": "enum", "enumOptions": ["Regular Bail", "Anticipatory Bail"], "isRequired": true, "sortOrder": 3 }
        ]
    },
    {
        "name": "18. NBW Arrest Warrants issued today",
        "slug": "nbw-arrest-warrants",
        "description": "NBW Arrest Warrants issued today",
        "singleRow": false,
        "sortOrder": 19,
        "columns": [
            { "name": "Name of Accused", "slug": "accused_name", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "FIR Details", "slug": "fir_details", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Police Station", "slug": "police_station", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 2 },
            { "name": "Next Date", "slug": "next_date", "dataType": "date", "enumOptions": null, "isRequired": true, "sortOrder": 3 }
        ]
    },
    {
        "name": "19. List of the accused who surrendered in court",
        "slug": "surrendered-accused",
        "description": "Accused who surrendered in court",
        "singleRow": false,
        "sortOrder": 20,
        "columns": [
            { "name": "Name of Accused", "slug": "accused_name", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "FIR Details", "slug": "fir_details", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Police Station", "slug": "police_station", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 2 },
            { "name": "Status of Accused", "slug": "accused_status", "dataType": "enum", "enumOptions": ["Granted Regular Bail", "Sent to Judicial Custody", "Sent to Police Custody"], "isRequired": true, "sortOrder": 3 }
        ]
    },
    {
        "name": "20. Details of adverse order passed against police officials",
        "slug": "adverse-police-orders",
        "description": "Adverse orders against police officials",
        "singleRow": false,
        "sortOrder": 21,
        "columns": [
            { "name": "Case Details", "slug": "case_details", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "Police Station", "slug": "police_station", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Category", "slug": "category", "dataType": "enum", "enumOptions": ["Amesh Kumar Violation", "Ground of Arrest Violation", "Fail to submit replies", "Summon/Warrant report not submitted", "Unable to execute BW/NBW", "Detention > 24 Hrs", "Misbehaviour"], "isRequired": true, "sortOrder": 2 }
        ]
    },
    {
        "name": "21. Details of applications filed by police officials DISMISSED by the court",
        "slug": "dismissed-police-applications",
        "description": "Dismissed police applications",
        "singleRow": false,
        "sortOrder": 22,
        "columns": [
            { "name": "Case Details", "slug": "case_details", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "Police Station", "slug": "police_station", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Category", "slug": "category", "dataType": "enum", "enumOptions": ["Bail Cancellation", "Disposal of case property", "Remand from judicial custody"], "isRequired": true, "sortOrder": 2 }
        ]
    },
    {
        "name": "22. Checking of Court Security and Prisoner escort guards",
        "slug": "security-checking",
        "description": "Checking of Court Security",
        "singleRow": false,
        "sortOrder": 23,
        "columns": [
            { "name": "Checking done by", "slug": "checked_by", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "Time of checking", "slug": "checking_time", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Court Security Total", "slug": "court_total", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 2 },
            { "name": "Court Security Present", "slug": "court_present", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 3 },
            { "name": "Prisoner Escort Total", "slug": "escort_total", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 4 },
            { "name": "Prisoner Escort Present", "slug": "escort_present", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 5 }
        ]
    },
    {
        "name": "23. Details of security provided to court and judicial officers",
        "slug": "security-deployment",
        "description": "Security deployment aggregate",
        "singleRow": true,
        "sortOrder": 24,
        "columns": [
            { "name": "Total persons deployed in court security", "slug": "court_security", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "Total persons deployed in security of Judicial officers", "slug": "officer_security", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 1 }
        ]
    },
    {
        "name": "24. E-Summon Implementation",
        "slug": "e-summon-implementation",
        "description": "E-Summon implementation stats",
        "singleRow": true,
        "sortOrder": 25,
        "columns": [
            { "name": "Total Summons Served", "slug": "total_summons", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "Served through Electronic mode", "slug": "electronic_summons", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Served physically/Manually", "slug": "physical_summons", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 2 }
        ]
    },
    {
        "name": "25. E-Challan submission",
        "slug": "e-challan-submission",
        "description": "E-Challan submission count",
        "singleRow": true,
        "sortOrder": 26,
        "columns": [
            { "name": "No. of E-Challans", "slug": "total_challans", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 0 }
        ]
    },
    {
        "name": "26. Summons/Warrants (from E-summon App)",
        "slug": "e-summon-stats",
        "description": "E-summon app warrants",
        "singleRow": true,
        "sortOrder": 27,
        "columns": [
            { "name": "Summons Issued", "slug": "summons", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "Bailable Warrants Issued", "slug": "bailable", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Non Bailable Warrants Issued", "slug": "non_bailable", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 2 },
            { "name": "Conditional Warrants Issued", "slug": "conditional", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 3 }
        ]
    },
    {
        "name": "27. Summons/Warrants due for next day",
        "slug": "warrants-next-day",
        "description": "Warrants due for next day aggregate",
        "singleRow": true,
        "sortOrder": 28,
        "columns": [
            { "name": "Number of Summons", "slug": "summons", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "Number of Bailable Warrants", "slug": "bailable", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "Number of non-bailable Warrants", "slug": "non_bailable", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 2 },
            { "name": "Number of Conditional Warrants", "slug": "conditional", "dataType": "number", "enumOptions": null, "isRequired": true, "sortOrder": 3 }
        ]
    },
    {
        "name": "28. IIF-6 Form filled",
        "slug": "iif6-forms",
        "description": "IIF-6 Form status",
        "singleRow": false,
        "sortOrder": 29,
        "columns": [
            { "name": "FIR Details (No/Date/Us)", "slug": "fir_details", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 0 },
            { "name": "Police Station", "slug": "police_station", "dataType": "text", "enumOptions": null, "isRequired": true, "sortOrder": 1 },
            { "name": "IIF-6 Form filled (Yes/No)", "slug": "iif6_filled", "dataType": "boolean", "enumOptions": null, "isRequired": true, "sortOrder": 2 }
        ]
    }
];
