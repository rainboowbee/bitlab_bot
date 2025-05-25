-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "answer" TEXT,
ADD COLUMN     "files" JSONB,
ADD COLUMN     "solution" TEXT;
