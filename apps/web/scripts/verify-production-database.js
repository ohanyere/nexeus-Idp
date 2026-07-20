const requiredEnv = ["DATABASE_URL", "DATABASE_URL_UNPOOLED"];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const tableRows = await prisma.$queryRaw`
    SELECT
      to_regclass('public."Service"')::text AS service_table,
      to_regclass('public."InfrastructureProvisionRequest"')::text AS infrastructure_provision_request_table
  `;
  const tableStatus = tableRows[0] ?? {};
  const serviceTablePresent = Boolean(tableStatus.service_table);
  const provisionRequestTablePresent = Boolean(tableStatus.infrastructure_provision_request_table);

  console.log(`Service table: ${serviceTablePresent ? "present" : "missing"}`);
  console.log(`InfrastructureProvisionRequest table: ${provisionRequestTablePresent ? "present" : "missing"}`);

  if (!serviceTablePresent || !provisionRequestTablePresent) {
    process.exitCode = 1;
    return;
  }

  const [serviceCount, provisionRequestCount] = await Promise.all([
    prisma.service.count(),
    prisma.infrastructureProvisionRequest.count()
  ]);

  console.log(`Service model query: ok (${serviceCount} rows)`);
  console.log(`InfrastructureProvisionRequest model query: ok (${provisionRequestCount} rows)`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Production database verification failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
