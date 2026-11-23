import db from '../shared/db.js';

async function main() {
  console.log('[DEV RESET] Initiating development database wipe...');
  try {
    const stats = await db.resetDevelopmentData();
    console.log('[DEV RESET] Database successfully reset!');
    console.log(`[DEV RESET] Verification stats:`);
    console.log(`  - Requirements:      ${stats.requirements}`);
    console.log(`  - Matching Runs:     ${stats.matchingRuns}`);
    console.log(`  - Approvals:         ${stats.approvals}`);
    console.log(`  - Negotiations:      ${stats.negotiations}`);
    console.log(`  - Messages:          ${stats.messages}`);
    console.log(`  - Audit Events:      ${stats.auditEvents}`);
    console.log(`  - Suppliers Catalog: ${stats.suppliers} (Master JSON Preserved)`);
    process.exit(0);
  } catch (err) {
    console.error('[DEV RESET] Error resetting development data:', err.message);
    process.exit(1);
  }
}

main();
