/*
  Warnings:

  - A unique constraint covering the columns `[activityId,userId]` on the table `ActivityParticipant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ActivityParticipant_activityId_userId_key" ON "ActivityParticipant"("activityId", "userId");
