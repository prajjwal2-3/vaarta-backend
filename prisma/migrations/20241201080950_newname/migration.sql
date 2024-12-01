/*
  Warnings:

  - You are about to drop the column `name` on the `Room` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Room" DROP COLUMN "name",
ADD COLUMN     "names" TEXT[];
