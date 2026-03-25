-- CreateTable
CREATE TABLE "daily_submissions" (
    "id" SERIAL NOT NULL,
    "court_id" INTEGER NOT NULL,
    "entry_date" DATE NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_by" INTEGER NOT NULL,

    CONSTRAINT "daily_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_submissions_court_id_entry_date_key" ON "daily_submissions"("court_id", "entry_date");

-- AddForeignKey
ALTER TABLE "daily_submissions" ADD CONSTRAINT "daily_submissions_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_submissions" ADD CONSTRAINT "daily_submissions_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
