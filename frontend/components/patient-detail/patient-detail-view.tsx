'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RiskPanel } from './risk-panel';
import { WhatIfPanel } from './what-if-panel';
import { TimelineCharts } from './timeline-charts';
import { PatientDetail } from '@/lib/types';
import { ArrowLeft, User, Calendar, MapPin, Activity } from 'lucide-react';
import { formatDateDDMMYYYY } from '@/lib/utils';

interface PatientDetailViewProps {
  patient: PatientDetail;
  patientNbr: string;
}

export function PatientDetailView({ patient, patientNbr }: PatientDetailViewProps) {
  const [notes, setNotes] = useState('');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="outline" size="sm" className="mb-4" asChild>
          <Link href="/patients">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Link>
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient {patientNbr}</h1>
            <p className="text-gray-600 mt-1">Detailed risk assessment and clinical timeline</p>
          </div>
        </div>
      </div>

      {/* Patient Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Demographics</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Age:</span>
                  <span className="text-sm font-medium">{patient.demographics.age}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gender:</span>
                  <span className="text-sm font-medium">{patient.demographics.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Race:</span>
                  <span className="text-sm font-medium">{patient.demographics.race}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Last Encounter
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Type:</span>
                  <span className="text-sm font-medium">{patient.last_encounter.admission_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">LOS:</span>
                  <span className="text-sm font-medium">{patient.last_encounter.time_in_hospital}d</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Date:</span>
                  <span className="text-sm font-medium">
                    {formatDateDDMMYYYY(patient.last_encounter?.date)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <Activity className="h-4 w-4" />
                Utilization
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Outpatient:</span>
                  <span className="text-sm font-medium">{patient.utilization.outpatient}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Inpatient:</span>
                  <span className="text-sm font-medium">{patient.utilization.inpatient}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Emergency:</span>
                  <span className="text-sm font-medium">{patient.utilization.emergency}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-600">Recent Diagnoses</div>
              <div className="flex flex-wrap gap-1">
                {patient.diagnoses_timeline
                  .slice(-1)[0]?.groups
                  .slice(0, 3)
                  .map((diagnosis, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {diagnosis}
                    </Badge>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Risk and What-If */}
        <div className="space-y-6">
          <RiskPanel risk={patient.risk} />
          <WhatIfPanel 
            currentRisk={patient.risk.prob} 
            patientData={{
              age: patient.demographics.age,
              gender: patient.demographics.gender,
              // Add other relevant baseline data
            }} 
          />
          
          {/* Clinical Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Clinical Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add clinical observations, care plan updates, or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
              <Button size="sm" className="mt-2">
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timelines */}
        <div className="lg:col-span-2">
          <TimelineCharts patient={patient} />
        </div>
      </div>
    </div>
  );
}