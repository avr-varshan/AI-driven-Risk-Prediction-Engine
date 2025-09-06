// Core data types based on API response shapes
export interface RiskSplit {
  high: number;
  medium: number;
  low: number;
}

export interface LabStats {
  a1c_gt8_pct: number;
  glucose_abnormal_pct: number;
}

export interface Summary {
  total_patients: number;
  avg_time_in_hospital: number;
  avg_num_diagnoses: number;
  risk_split: RiskSplit;
  labs: LabStats;
  top_comorbidities: string[];
}

export interface MedSummary {
  [key: string]: 'up' | 'down' | 'steady';
}

export interface Patient {
  patient_nbr: string;
  age: number;
  gender: string;
  race: string;
  last_admission_type: string;
  time_in_hospital: number;
  readmitted_label?: string;
  num_diagnoses: number;
  med_summary: MedSummary;
  risk_prob: number;
  risk_group: 'high' | 'medium' | 'low';
}

export interface PatientsResponse {
  summary: Summary;
  patients: Patient[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
  };
}

export interface Demographics {
  age: number;
  gender: string;
  race: string;
}

export interface LastEncounter {
  admission_type: string;
  discharge_disposition: string;
  admission_source: string;
  time_in_hospital: number;
  date: string;
}

export interface Utilization {
  outpatient: number;
  inpatient: number;
  emergency: number;
}

export interface DiagnosisGroup {
  date: string;
  groups: string[];
}

export interface LabValue {
  date: string;
  value: number;
  category?: 'normal' | 'high' | 'low';
}

export interface TimelineData {
  a1c: LabValue[];
  glucose: LabValue[];
}

export interface MedChange {
  date: string;
  medication: string;
  change: 'up' | 'down' | 'steady';
}

export interface Risk {
  prob: number;
  group: 'high' | 'medium' | 'low';
  local_factors: string[];
  recommendations: string[];
}

export interface PatientDetail {
  demographics: Demographics;
  last_encounter: LastEncounter;
  utilization: Utilization;
  diagnoses_timeline: DiagnosisGroup[];
  labs_timeline: TimelineData;
  medications_timeline: MedChange[];
  risk: Risk;
}

export interface PatientDetailResponse {
  patient: PatientDetail;
}

export interface CreatePatientResponse {
  patient_nbr: string;
  saved: boolean;
  risk: Risk;
}

export interface ScoreResponse {
  prob: number;
  group: 'high' | 'medium' | 'low';
  local_factors: string[];
}

export interface ChatUsedData {
  risk_prob_before?: number;
  risk_prob_after?: number;
  drivers?: string[]; // optional in case the backend omits it
}

export interface ChatResponse {
  answer: string;
  used_data?: ChatUsedData; // made optional to match route behavior
  links?: string[]; // made optional to match route behavior (and can be empty array)
}

export interface FilterParams {
  q?: string;
  age?: number[];
  gender?: string;
  race?: string[];
  admission_type?: string;
  discharge_disposition?: string;
  admission_source?: string;
  risk_group?: string[];
  prob_min?: number;
  prob_max?: number;
  a1c?: string;
  glucose?: string;
  on_insulin?: boolean;
  med_change?: string;
  er_visits_min?: number;
  inpatient_visits_min?: number;
  outpatient_visits_min?: number;
  page?: number;
  page_size?: number;
  sort_by?: string;
  export?: 'csv' | 'pdf';
}