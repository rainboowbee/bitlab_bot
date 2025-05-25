/*
  Warnings:

  - The primary key for the `_EnrolledCourses` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_EnrolledCourses` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "_EnrolledCourses" DROP CONSTRAINT "_EnrolledCourses_AB_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "_EnrolledCourses_AB_unique" ON "_EnrolledCourses"("A", "B");
