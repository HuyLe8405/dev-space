-- CreateTable
CREATE TABLE "areas" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'Layers',
    "color" TEXT NOT NULL DEFAULT 'indigo',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "areas_workspaceId_idx" ON "areas"("workspaceId");

-- CreateIndex
CREATE INDEX "areas_workspaceId_order_idx" ON "areas"("workspaceId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "areas_workspaceId_name_key" ON "areas"("workspaceId", "name");

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "areas_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
