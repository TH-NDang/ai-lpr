import { redirect } from 'next/navigation'

import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default async function Page() {
  redirect('/license-plate')
}
