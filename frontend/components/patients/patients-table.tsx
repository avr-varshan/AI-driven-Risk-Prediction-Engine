'use client';

import { useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Patient } from '@/lib/types';
import { RiskBadge } from '@/components/ui/risk-badge';
import { MedChips } from '@/components/ui/med-chips';
import { cn } from '@/lib/utils';

interface PatientsTableProps {
  patients: Patient[];
  onRowHover?: (patientNbr: string | null) => void;
}

export function PatientsTable({ patients, onRowHover }: PatientsTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Create memoized callback functions to prevent state updates during render
  const handleMouseEnter = useCallback((patientNbr: string) => {
    if (onRowHover) onRowHover(patientNbr);
  }, [onRowHover]);
  
  const handleMouseLeave = useCallback(() => {
    if (onRowHover) onRowHover(null);
  }, [onRowHover]);

  const virtualizer = useVirtualizer({
    count: patients.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // Row height
    overscan: 10,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-3 z-10">
        <div className="grid grid-cols-9 gap-4 text-xs font-medium text-gray-600 uppercase tracking-wide">
          <div>ID</div>
          <div>Age</div>
          <div>Gender</div>
          <div>Admission</div>
          <div>LOS</div>
          <div>Risk</div>
          <div>#Dx</div>
          <div>Medications</div>
          <div>Actions</div>
        </div>
      </div>

      {/* Virtual Table Body */}
      <div
        ref={parentRef}
        className="h-96 overflow-auto"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {items.map((virtualItem) => {
            const patient = patients[virtualItem.index];
            const isEven = virtualItem.index % 2 === 0;

            return (
              <div
                key={patient.patient_nbr}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <Link 
                  href={`/patients/${patient.patient_nbr}`}
                  onMouseEnter={() => handleMouseEnter(patient.patient_nbr)}
                  onMouseLeave={handleMouseLeave}
                  className={cn(
                    'block px-4 py-3 hover:bg-blue-50 transition-colors',
                    isEven ? 'bg-white' : 'bg-gray-50'
                  )}
                >
                  <div className="grid grid-cols-9 gap-4 items-center">
                    <div className="font-mono text-sm">{patient.patient_nbr}</div>
                    <div className="text-sm">{patient.age}</div>
                    <div className="text-sm">{patient.gender}</div>
                    <div className="text-sm truncate" title={patient.last_admission_type}>
                      {patient.last_admission_type}
                    </div>
                    <div className="text-sm">{patient.time_in_hospital}d</div>
                    <div>
                      <RiskBadge 
                        risk={patient.risk_group} 
                        probability={patient.risk_prob} 
                      />
                    </div>
                    <div className="text-sm">{patient.num_diagnoses}</div>
                    <div>
                      <MedChips medSummary={patient.med_summary} />
                    </div>
                    <div>
                      <span className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View →
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}