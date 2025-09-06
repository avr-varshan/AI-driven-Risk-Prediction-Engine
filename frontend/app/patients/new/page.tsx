import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PatientForm } from '@/components/patients/patient-form';
import { ArrowLeft } from 'lucide-react';

export default function NewPatientPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button variant="outline" size="sm" className="mb-4" asChild>
          <Link href="/patients">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900">Add New Patient</h1>
        <p className="text-gray-600 mt-1">
          Enter patient information to calculate immediate readmission risk assessment
        </p>
      </div>

      <PatientForm />
    </div>
  );
}