CREATE TABLE "InfrastructureProvisionRequest" (
  "id" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceName" TEXT NOT NULL,
  "claimName" TEXT NOT NULL,
  "claimKind" TEXT NOT NULL,
  "apiVersion" TEXT NOT NULL,
  "compositionRef" TEXT NOT NULL,
  "teamName" TEXT NOT NULL,
  "teamSlug" TEXT NOT NULL,
  "environment" TEXT NOT NULL,
  "namespace" TEXT NOT NULL,
  "serviceId" TEXT,
  "serviceName" TEXT,
  "requester" TEXT NOT NULL,
  "requesterEmail" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "gitOpsStatus" TEXT NOT NULL,
  "provisioningStatus" TEXT NOT NULL,
  "clusterStatus" TEXT NOT NULL,
  "repositoryOwner" TEXT NOT NULL,
  "repositoryName" TEXT NOT NULL,
  "repositoryUrl" TEXT NOT NULL,
  "defaultBranch" TEXT NOT NULL,
  "branch" TEXT,
  "commitSha" TEXT,
  "prUrl" TEXT,
  "prNumber" INTEGER,
  "prStatus" TEXT,
  "mergeStatus" TEXT,
  "claimPath" TEXT NOT NULL,
  "claimManifest" TEXT NOT NULL,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InfrastructureProvisionRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InfrastructureProvisionEvent" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "actor" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InfrastructureProvisionEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InfrastructureProvisionRequest_teamSlug_environment_idx" ON "InfrastructureProvisionRequest"("teamSlug", "environment");
CREATE INDEX "InfrastructureProvisionRequest_serviceId_idx" ON "InfrastructureProvisionRequest"("serviceId");
CREATE INDEX "InfrastructureProvisionRequest_status_idx" ON "InfrastructureProvisionRequest"("status");
CREATE INDEX "InfrastructureProvisionEvent_requestId_idx" ON "InfrastructureProvisionEvent"("requestId");

ALTER TABLE "InfrastructureProvisionEvent" ADD CONSTRAINT "InfrastructureProvisionEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "InfrastructureProvisionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
