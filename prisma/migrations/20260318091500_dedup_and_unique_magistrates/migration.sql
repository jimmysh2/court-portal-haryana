-- Step 1: Re-point courts that reference a duplicate magistrate to the keeper (lowest id)
UPDATE courts
SET magistrate_id = keepers.keep_id
FROM (
    SELECT MIN(id) AS keep_id, district_id, name
    FROM magistrates
    GROUP BY district_id, name
    HAVING COUNT(*) > 1
) keepers
JOIN magistrates dupes
    ON dupes.district_id IS NOT DISTINCT FROM keepers.district_id
   AND dupes.name = keepers.name
   AND dupes.id <> keepers.keep_id
WHERE courts.magistrate_id = dupes.id;

-- Step 2: Re-point data_entries that reference a duplicate magistrate to the keeper
UPDATE data_entries
SET magistrate_id = keepers.keep_id
FROM (
    SELECT MIN(id) AS keep_id, district_id, name
    FROM magistrates
    GROUP BY district_id, name
    HAVING COUNT(*) > 1
) keepers
JOIN magistrates dupes
    ON dupes.district_id IS NOT DISTINCT FROM keepers.district_id
   AND dupes.name = keepers.name
   AND dupes.id <> keepers.keep_id
WHERE data_entries.magistrate_id = dupes.id;

-- Step 3: Delete all duplicate magistrate rows (keep lowest id per district_id+name)
DELETE FROM magistrates
WHERE id NOT IN (
    SELECT MIN(id)
    FROM magistrates
    GROUP BY district_id, name
);

-- Step 4: Now safe to create the unique index
CREATE UNIQUE INDEX "magistrates_district_id_name_key" ON "magistrates"("district_id", "name");
