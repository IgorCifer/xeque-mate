-- CreateTable
CREATE TABLE "user_activity_day" (
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,

    CONSTRAINT "user_activity_day_pkey" PRIMARY KEY ("userId","day")
);

-- AddForeignKey
ALTER TABLE "user_activity_day" ADD CONSTRAINT "user_activity_day_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
