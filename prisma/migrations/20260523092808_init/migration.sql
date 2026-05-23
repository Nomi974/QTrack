-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "floor" INTEGER NOT NULL DEFAULT 1,
    "x" REAL,
    "y" REAL,
    "width" REAL,
    "height" REAL,
    "capacity" INTEGER
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serialNo" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "purchaseDate" DATETIME,
    "purchasePrice" REAL,
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'IN_STORAGE',
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "currentLocationId" TEXT,
    "homeLocationId" TEXT,
    "responsibleUserId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Asset_currentLocationId_fkey" FOREIGN KEY ("currentLocationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Asset_homeLocationId_fkey" FOREIGN KEY ("homeLocationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Asset_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssetEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "locationId" TEXT,
    "actorId" TEXT,
    "conditionAfter" TEXT,
    "statusAfter" TEXT,
    "source" TEXT NOT NULL,
    "eventRequestId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssetEvent_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AssetEvent_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AssetEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AssetEvent_eventRequestId_fkey" FOREIGN KEY ("eventRequestId") REFERENCES "EventRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT
);

-- CreateTable
CREATE TABLE "EventRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requesterId" TEXT NOT NULL,
    "approverId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "locationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EventRequest_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EventRequest_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventRequestId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ALLOCATED',
    "checkedOutAt" DATETIME,
    "returnedAt" DATETIME,
    "returnedCondition" TEXT,
    CONSTRAINT "EventAllocation_eventRequestId_fkey" FOREIGN KEY ("eventRequestId") REFERENCES "EventRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventAllocation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'WARNING',
    "message" TEXT NOT NULL,
    "assetId" TEXT,
    "eventRequestId" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Alert_eventRequestId_fkey" FOREIGN KEY ("eventRequestId") REFERENCES "EventRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_serialNo_key" ON "Asset"("serialNo");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status");

-- CreateIndex
CREATE INDEX "Asset_category_idx" ON "Asset"("category");

-- CreateIndex
CREATE INDEX "Asset_currentLocationId_idx" ON "Asset"("currentLocationId");

-- CreateIndex
CREATE INDEX "AssetEvent_assetId_createdAt_idx" ON "AssetEvent"("assetId", "createdAt");

-- CreateIndex
CREATE INDEX "AssetEvent_createdAt_idx" ON "AssetEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "EventRequest_status_idx" ON "EventRequest"("status");

-- CreateIndex
CREATE INDEX "EventAllocation_status_idx" ON "EventAllocation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EventAllocation_eventRequestId_assetId_key" ON "EventAllocation"("eventRequestId", "assetId");

-- CreateIndex
CREATE INDEX "Alert_acknowledged_createdAt_idx" ON "Alert"("acknowledged", "createdAt");
