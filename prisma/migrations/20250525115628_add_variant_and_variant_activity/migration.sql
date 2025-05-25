-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL,
    "variantNumber" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVariantActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL,
    "attemptNumber" INTEGER NOT NULL,

    CONSTRAINT "UserVariantActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_VariantTasks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Variant_variantNumber_key" ON "Variant"("variantNumber");

-- CreateIndex
CREATE UNIQUE INDEX "UserVariantActivity_userId_variantId_attemptNumber_key" ON "UserVariantActivity"("userId", "variantId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "_VariantTasks_AB_unique" ON "_VariantTasks"("A", "B");

-- CreateIndex
CREATE INDEX "_VariantTasks_B_index" ON "_VariantTasks"("B");

-- AddForeignKey
ALTER TABLE "UserVariantActivity" ADD CONSTRAINT "UserVariantActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVariantActivity" ADD CONSTRAINT "UserVariantActivity_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VariantTasks" ADD CONSTRAINT "_VariantTasks_A_fkey" FOREIGN KEY ("A") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VariantTasks" ADD CONSTRAINT "_VariantTasks_B_fkey" FOREIGN KEY ("B") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
