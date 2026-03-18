-- Step 1: Deduplicate magistrates before adding unique index.
-- For each (district_id, name) pair, keep the row with the lowest id
-- and re-point any courts / data_entries to the surviving record.

-- Re-point courts that reference a duplicate magistrate to the keeper
UPDATE courts c
SET magistrate_id = keeper.id
FROM (
    SELECT DISTINCT ON (district_id, name) id, district_id, name
    FROM magistrates
    ORDER BY district_id, name, id ASC
) keeper
WHERE c.magistrate_id IN (
    SELECT id FROM magistrates m
    WHERE m.district_id = keeper.district_id
      AND m.name       = keeper.name
      AND m.id         <> keeper.id
);

-- Re-point data_entries that reference a duplicate magistrate to the keeper
UPDATE data_entries de
SET magistrate_id = keeper.id
FROM (
    SELECT DISTINCT ON (district_id, name) id, district_id, name
    FROM magistrates
    ORDER BY district_id, name, id ASC
) keeper
WHERE de.magistrate_id IN (
    SELECT id FROM magistrates m
    WHERE m.district_id = keeper.district_id
      AND m.name       = keeper.name
      AND m.id         <> keeper.id
);

-- Delete all duplicates (keep lowest id per district_id+name pair)
DELETE FROM magistrates
WHERE id NOT IN (
    SELECT MIN(id)
    FROM magistrates
    GROUP BY district_id, name
);

-- Step 2: Now it is safe to add the unique index
-- CreateIndex
CREATE UNIQUE INDEX "magistrates_district_id_name_key" ON "magistrates"("district_id", "name");
