'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PatientsTable } from '@/components/patients/patients-table';
import { FiltersPanel } from '@/components/patients/filters-panel';
import { TableSkeleton } from '@/components/ui/loading-skeleton';
import { getPatients } from '@/lib/api';
import { FilterParams } from '@/lib/types';
import { Plus, Search, SlidersHorizontal, Download } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

export default function PatientsPage() {
  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    page_size: 25,
    sort_by: 'risk_prob',
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Debounce search query
  const debouncedQuery = useDebounce(searchQuery, 350);
  
  // Update filters when debounced query changes
  const finalFilters = useMemo(() => ({
    ...filters,
    q: debouncedQuery || undefined,
  }), [filters, debouncedQuery]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['patients', finalFilters],
    queryFn: () => getPatients(finalFilters),
    keepPreviousData: true,
  });

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setFilters(prev => ({ ...prev, page_size: pageSize, page: 1 }));
  };

  const handleSortChange = (sortBy: string) => {
    setFilters(prev => ({ ...prev, sort_by: sortBy }));
  };

  // Prefetch patient detail on hover
  const handleRowHover = useCallback((patientNbr: string | null) => {
    // TODO: Implement prefetch logic
    console.log('Hover:', patientNbr);
  }, []);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700">Error loading patients. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Cohort</h1>
          <p className="text-gray-600 mt-1">
            {data ? `${data.pagination.total} total patients` : 'Loading patients...'}
          </p>
        </div>
          <div className="flex gap-2">
    {/* Dashboard Button */}
    <Button asChild variant="outline" size="sm">
      <Link href="/">Dashboard</Link>
    </Button>

    {/* Add Patient Button */}
    <Button asChild>
      <Link href="/patients/new">
        <Plus className="h-4 w-4 mr-2" />
        Add Patient
      </Link>
    </Button>
  </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by patient ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>

          <Select value={filters.sort_by} onValueChange={handleSortChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="risk_prob">Risk Probability</SelectItem>
              <SelectItem value="age">Age</SelectItem>
              <SelectItem value="time_in_hospital">Length of Stay</SelectItem>
              <SelectItem value="num_diagnoses">Number of Diagnoses</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.page_size?.toString()} onValueChange={(v) => handlePageSizeChange(parseInt(v))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Panel */}
        {showFilters && (
          <div className="lg:col-span-1">
            <FiltersPanel
              filters={filters}
              onFiltersChange={setFilters}
              onClear={() => setFilters({ page: 1, page_size: 25 })}
            />
          </div>
        )}

        {/* Main Content */}
        <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
          {isLoading ? (
            <TableSkeleton rows={10} />
          ) : data ? (
            <>
              <PatientsTable 
                patients={data.patients} 
                onRowHover={handleRowHover}
              />
              
              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((data.pagination.page - 1) * data.pagination.page_size) + 1} to{' '}
                  {Math.min(data.pagination.page * data.pagination.page_size, data.pagination.total)} of{' '}
                  {data.pagination.total} patients
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.pagination.page <= 1}
                    onClick={() => handlePageChange(data.pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data?.pagination?.page * data?.pagination?.page_size >= data?.pagination?.total}
                    onClick={() => handlePageChange(data.pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
