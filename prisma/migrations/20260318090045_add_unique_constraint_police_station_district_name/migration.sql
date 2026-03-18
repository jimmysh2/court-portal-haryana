-- Step 1: Deduplicate police_stations before adding unique index.
-- For each (district_id, name) pair, keep the row with the lowest id.

DELETE FROM police_stations
WHERE id NOT IN (
    SELECT MIN(id)
    FROM police_stations
    GROUP BY district_id, name
);

-- Step 2: Now safe to add unique index
-- CreateIndex
CREATE UNIQUE INDEX "police_stations_district_id_name_key" ON "police_stations"("district_id", "name");
