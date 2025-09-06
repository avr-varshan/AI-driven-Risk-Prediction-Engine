'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/stat-card';
import { RiskDistributionChart } from '@/components/dashboard/risk-distribution-chart';
import { TopComorbiditiesChart } from '@/components/dashboard/top-comorbidities-chart';
import { PatientsTable } from '@/components/patients/patients-table';
import { FiltersPanel } from '@/components/patients/filters-panel';
import { CardSkeleton, TableSkeleton, ChartSkeleton } from '@/components/ui/loading-skeleton';
import { getPatients } from '@/lib/api';
import { FilterParams } from '@/lib/types';
import { Download, Users, Clock, FileText } from 'lucide-react';

export default function DashboardPage() {
  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    page_size: 10,
    sort_by: 'risk_prob',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['patients', filters],
    queryFn: () => getPatients(filters),
  });

  const handleExport = (format: 'csv' | 'pdf') => {
    getPatients({ ...filters, export: format });
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700">Error loading dashboard data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Chronic Care Dashboard</h1>
        <p className="text-gray-600 mt-1">Monitor patient cohort and readmission risk trends</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          data && (
            <>
              <StatCard
                title="Total Patients"
                value={data.summary.total_patients}
                subtitle="Active in cohort"
                trend={{ value: 5.2, isPositive: true }}
              />
              <StatCard
                title="Avg Length of Stay"
                value={`${data.summary.avg_time_in_hospital.toFixed(1)} days`}
                subtitle="Current admission"
                trend={{ value: -2.1, isPositive: true }}
              />
              <StatCard
                title="Avg Diagnoses"
                value={data.summary.avg_num_diagnoses.toFixed(1)}
                subtitle="Per patient"
              />
              <StatCard
                title="High Risk Patients"
                value={`${data.summary.risk_split.high}%`}
                subtitle="≥70% probability"
                trend={{ value: -1.8, isPositive: true }}
              />
            </>
          )
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Risk Distribution</CardTitle>
            <Users className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              data && <RiskDistributionChart riskSplit={data.summary.risk_split} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Comorbidities</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              data && <TopComorbiditiesChart comorbidities={data.summary.top_comorbidities} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lab Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>A1C Control</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <CardSkeleton />
            ) : (
              data && (
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-red-600">
                    {data.summary.labs.a1c_gt8_pct.toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600">Patients with A1C > 8%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${data.summary.labs.a1c_gt8_pct}%` }}
                    />
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Glucose Management</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <CardSkeleton />
            ) : (
              data && (
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-amber-600">
                    {data.summary.labs.glucose_abnormal_pct.toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600">Patients with abnormal glucose</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${data.summary.labs.glucose_abnormal_pct}%` }}
                    />
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters and High Risk Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <FiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            onClear={() => setFilters({ page: 1, page_size: 10 })}
          />
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">High Risk Patients</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button size="sm" asChild>
                <Link href="/patients">View All Patients</Link>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <TableSkeleton rows={10} />
          ) : data ? (
            <PatientsTable 
              patients={data.patients.filter(p => p.risk_group === 'high').slice(0, 10)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}