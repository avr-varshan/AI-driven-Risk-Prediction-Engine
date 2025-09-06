'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { X, Search, Filter } from 'lucide-react';
import { FilterParams } from '@/lib/types';

interface FiltersPanelProps {
  filters: FilterParams;
  onFiltersChange: (filters: FilterParams) => void;
  onClear: () => void;
  className?: string;
}

export function FiltersPanel({ filters, onFiltersChange, onClear, className }: FiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof FilterParams, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <h3 className="font-medium text-gray-900">Filters</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Simple' : 'Advanced'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>

        {/* Basic Search */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="search">Search Patient ID</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Enter patient ID..."
                value={filters.q || ''}
                onChange={(e) => updateFilter('q', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Risk Group Filter */}
          <div>
            <Label>Risk Groups</Label>
            <div className="flex gap-2 mt-2">
              {['high', 'medium', 'low'].map((risk) => (
                <label key={risk} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={filters.risk_group?.includes(risk) || false}
                    onCheckedChange={(checked) => {
                      const current = filters.risk_group || [];
                      if (checked) {
                        updateFilter('risk_group', [...current, risk]);
                      } else {
                        updateFilter('risk_group', current.filter(r => r !== risk));
                      }
                    }}
                  />
                  <span className="capitalize">{risk}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={filters.gender || ''} onValueChange={(value) => updateFilter('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All genders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All genders</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="admission_type">Admission Type</Label>
                <Select value={filters.admission_type || ''} onValueChange={(value) => updateFilter('admission_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                    <SelectItem value="Elective">Elective</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Risk Probability Range */}
            <div>
              <Label>Risk Probability Range</Label>
              <div className="mt-2 px-2">
                <Slider
                  value={[filters.prob_min || 0, filters.prob_max || 100]}
                  onValueChange={([min, max]) => {
                    updateFilter('prob_min', min / 100);
                    updateFilter('prob_max', max / 100);
                  }}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>{filters.prob_min ? Math.round(filters.prob_min * 100) : 0}%</span>
                  <span>{filters.prob_max ? Math.round(filters.prob_max * 100) : 100}%</span>
                </div>
              </div>
            </div>

            {/* Age Range */}
            <div>
              <Label>Age Range</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="number"
                  placeholder="Min age"
                  value={filters.age?.[0] || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined;
                    updateFilter('age', [value || 0, filters.age?.[1] || 120]);
                  }}
                  className="w-24"
                />
                <Input
                  type="number"
                  placeholder="Max age"
                  value={filters.age?.[1] || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined;
                    updateFilter('age', [filters.age?.[0] || 0, value || 120]);
                  }}
                  className="w-24"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}