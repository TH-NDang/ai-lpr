import { LicensePlateUpload } from "@/components/license-plate-upload";

export default function LicensePlatePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">License Plate Recognition</h1>
      <LicensePlateUpload />
    </div>
  );
}
