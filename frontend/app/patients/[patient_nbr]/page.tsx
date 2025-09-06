import { getPatient } from '@/lib/api';
import { PatientDetailView } from '@/components/patient-detail/patient-detail-view';
import { notFound } from 'next/navigation';

interface PatientDetailPageProps {
  params: { patient_nbr: string };
}

// This is a Server Component for initial data fetch
export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  try {
    const { patient } = await getPatient(params.patient_nbr);
    
    return <PatientDetailView patient={patient} patientNbr={params.patient_nbr} />;
  } catch (error) {
    console.error('Error fetching patient:', error);
    notFound();
  }
}