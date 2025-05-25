/*
  Warnings:

  - You are about to drop the column `isProfileComplete` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `telegramId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `telegramUsername` on the `User` table. All the data in the column will be lost.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "User_telegramId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isProfileComplete",
DROP COLUMN "telegramId",
DROP COLUMN "telegramUsername",
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "password" SET NOT NULL;
