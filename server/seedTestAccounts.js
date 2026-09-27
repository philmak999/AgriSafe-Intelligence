// Creates the two demo accounts (admin/admin, farmer/farmer) if they don't
// already exist. Called automatically on every server boot (see index.js) so
// they're always present even on a host with an ephemeral disk — and safe to
// also run by hand: `node server/seedTestAccounts.js`.
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { getStaffByUsername, createStaffAccount } from './staffStore.js';
import { getFarmerByUsername, createFarmer, approveFarmer } from './farmerStore.js';

const TEST_FARM = { farmName: 'Seneca Valley Farms', farmId: 'NY-0455' };

async function seedAdmin() {
  if (await getStaffByUsername('admin')) return;
  await createStaffAccount({ username: 'admin', password: 'admin', name: 'Admin (Test Account)', role: 'scientist' });
  console.log('Seeded staff account: username="admin" password="admin" (scientist, full access).');
}

async function seedInspector() {
  if (await getStaffByUsername('inspector')) return;
  await createStaffAccount({ username: 'inspector', password: 'inspector', name: 'Inspector (Test Account)', role: 'inspector' });
  console.log('Seeded staff account: username="inspector" password="inspector" (inspector role).');
}

async function seedFarmer() {
  if (await getFarmerByUsername('farmer')) return;
  const farmer = await createFarmer({
    username: 'farmer',
    password: 'farmer',
    name: 'Farmer (Test Account)',
    email: 'farmer-test@example.com',
    farmName: TEST_FARM.farmName,
    farmId: TEST_FARM.farmId,
    documentData: null,
    documentMimetype: null,
    documentOriginalName: 'test-account-no-document',
  });
  await approveFarmer(farmer.id); // test account — skip the normal staff-review step
  console.log(`Seeded farmer account: username="farmer" password="farmer" (linked to "${TEST_FARM.farmName}", pre-approved).`);
}

export async function seedTestAccounts() {
  await seedAdmin();
  await seedInspector();
  await seedFarmer();
}

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  await seedTestAccounts();
}
