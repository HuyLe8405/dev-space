-- CreateEnum
CREATE TYPE "node_types" AS ENUM ('CONCEPT', 'COMPONENT', 'SERVICE', 'MODULE', 'DATABASE', 'INTERFACE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "relation_types" AS ENUM ('RELATES_TO', 'DEPENDS_ON', 'CONTAINS');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'Folder',
    "color" TEXT NOT NULL DEFAULT 'cyan',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nodes" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "nodeType" "node_types" NOT NULL DEFAULT 'CONCEPT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "node_relationships" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "type" "relation_types" NOT NULL DEFAULT 'RELATES_TO',
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "node_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_areaId_idx" ON "projects"("areaId");

-- CreateIndex
CREATE INDEX "projects_areaId_updatedAt_idx" ON "projects"("areaId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "projects_areaId_name_key" ON "projects"("areaId", "name");

-- CreateIndex
CREATE INDEX "nodes_projectId_idx" ON "nodes"("projectId");

-- CreateIndex
CREATE INDEX "nodes_projectId_createdAt_idx" ON "nodes"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "nodes_projectId_name_key" ON "nodes"("projectId", "name");

-- CreateIndex
CREATE INDEX "node_relationships_projectId_idx" ON "node_relationships"("projectId");

-- CreateIndex
CREATE INDEX "node_relationships_sourceNodeId_idx" ON "node_relationships"("sourceNodeId");

-- CreateIndex
CREATE INDEX "node_relationships_targetNodeId_idx" ON "node_relationships"("targetNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "node_relationships_projectId_sourceNodeId_targetNodeId_type_key" ON "node_relationships"("projectId", "sourceNodeId", "targetNodeId", "type");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_relationships" ADD CONSTRAINT "node_relationships_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_relationships" ADD CONSTRAINT "node_relationships_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_relationships" ADD CONSTRAINT "node_relationships_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
