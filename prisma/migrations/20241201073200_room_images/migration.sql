/*
  Warnings:

  - You are about to drop the column `roomImage` on the `Room` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Room" DROP COLUMN "roomImage",
ADD COLUMN     "roomImages" TEXT[];
