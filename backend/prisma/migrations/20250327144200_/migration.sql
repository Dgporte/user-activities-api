/*
  Warnings:

  - A unique constraint covering the columns `[userId,typeId]` on the table `Preference` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Preference_userId_typeId_key" ON "Preference"("userId", "typeId");
