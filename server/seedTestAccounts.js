// One-off/re-runnable script to create local test accounts.
// Usage: node server/seedTestAccounts.js
import 'dotenv/config';
import { getStaffByUsername, createStaffAccount } from './staffStore.js';
import { getFarmerByUsername, createFarmer, approveFarmer } from './farmerStore.js';

const TEST_FARM = { farmName: 'Seneca Valley Farms', farmId: 'NY-0455' };

async function seedAdmin() {
  if (getStaffByUsername('admin')) {
    console.log('Staff account "admin" already exists — skipping.');
    return;
  }
  await createStaffAccount({ username: 'admin', password: 'admin', name: 'Admin (Test Account)' });
  console.log('Created staff account: username="admin" password="admin" (full access).');
}

async function seedFarmer() {
  if (getFarmerByUsername('farmer')) {
    console.log('Farmer account "farmer" already exists — skipping.');
    return;
  }
  const farmer = await createFarmer({
    username: 'farmer',
    password: 'farmer',
    name: 'Farmer (Test Account)',
    email: 'farmer-test@example.com',
    farmName: TEST_FARM.farmName,
    farmId: TEST_FARM.farmId,
    documentPath: null,
    documentOriginalName: 'test-account-no-document',
  });
  approveFarmer(farmer.id); // test account — skip the normal staff-review step
  console.log(`Created farmer account: username="farmer" password="farmer" (linked to "${TEST_FARM.farmName}", pre-approved).`);
}

await seedAdmin();
await seedFarmer();
