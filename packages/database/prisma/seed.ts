// Sprint 0 placeholder: no real seed data exists yet.
// This script exists only so the seeding pipeline is wired up for future sprints.
async function main(): Promise<void> {
  console.log("No seed data defined yet (Sprint 0).");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
