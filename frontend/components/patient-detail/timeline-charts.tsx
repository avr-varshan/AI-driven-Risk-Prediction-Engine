'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { PatientDetail } from '@/lib/types';
import { formatDateDDMMYYYY } from '@/lib/utils';

interface TimelineChartsProps {
  patient: PatientDetail;
}

export function TimelineCharts({ patient }: TimelineChartsProps) {
  // defensive: ensure arrays exist
  const a1cTimeline = Array.isArray(patient.labs_timeline?.a1c) ? patient.labs_timeline.a1c : [];
  const glucoseTimeline = Array.isArray(patient.labs_timeline?.glucose) ? patient.labs_timeline.glucose : [];
  const medsTimeline = Array.isArray(patient.medications_timeline) ? patient.medications_timeline : [];

  // Transform lab data for charts (dates formatted deterministically)
  const a1cData = a1cTimeline.map((lab) => ({
    date: formatDateDDMMYYYY(lab.date),
    value: lab.value,
    category: lab.category,
  }));

  const glucoseData = glucoseTimeline.map((lab) => ({
    date: formatDateDDMMYYYY(lab.date),
    value: lab.value,
    category: lab.category,
  }));

  // Transform medications for timeline view
  const medData = medsTimeline.map((med) => ({
    date: formatDateDDMMYYYY(med.date),
    medication: med.medication,
    change: med.change,
  }));

  return (
    <div className="space-y-6">
      {/* Encounter Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Encounter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Admission:</span>
                <div className="font-medium">{patient.last_encounter?.admission_type}</div>
              </div>
              <div>
                <span className="text-gray-600">Length of Stay:</span>
                <div className="font-medium">{patient.last_encounter?.time_in_hospital} days</div>
              </div>
              <div>
                <span className="text-gray-600">Discharge:</span>
                <div className="font-medium">{patient.last_encounter?.discharge_disposition}</div>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <div className="font-medium">{formatDateDDMMYYYY(patient.last_encounter?.date)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lab Trends: A1C */}
      <Card>
        <CardHeader>
          <CardTitle>A1C Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={a1cData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} />
              <Tooltip formatter={(value: number) => [`${value}%`, 'A1C']} />
              <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} dot={{ r: 4 }} />
              {/* Reference line at 8% */}
              <ReferenceLine y={8} stroke="#DC2626" strokeDasharray="5 5" strokeWidth={1} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Glucose Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Glucose Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={glucoseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`${value} mg/dL`, 'Glucose']} />
              <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Medication Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Medication Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {medData.slice(0, 5).map((med, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{med.medication}</div>
                  <div className="text-xs text-gray-600">{med.date}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{med.change === 'up' ? '↑' : med.change === 'down' ? '↓' : '→'}</span>
                  <span className="text-xs capitalize font-medium">{med.change}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}