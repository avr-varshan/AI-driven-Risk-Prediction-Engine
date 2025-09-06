'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RiskBadge } from '@/components/ui/risk-badge';
import { getWhatIfScore } from '@/lib/api';
import { ScoreResponse } from '@/lib/types';
import { Loader2, RotateCcw } from 'lucide-react';

interface WhatIfPanelProps {
  currentRisk: number;
  patientData: Record<string, any>;
}

export function WhatIfPanel({ currentRisk, patientData }: WhatIfPanelProps) {
  const [scenario, setScenario] = useState({
    a1c_result: patientData.a1c_result || '',
    glucose_result: patientData.glucose_result || '',
    on_insulin: patientData.on_insulin || false,
    num_previous_emergency: patientData.num_previous_emergency || 0,
  });

  const [result, setResult] = useState<ScoreResponse | null>(null);

  const whatIfMutation = useMutation({
    mutationFn: getWhatIfScore,
    onSuccess: (data) => setResult(data),
  });

  const handleCalculate = () => {
    whatIfMutation.mutate({
      ...patientData,
      ...scenario,
    });
  };

  const handleReset = () => {
    setScenario({
      a1c_result: patientData.a1c_result || '',
      glucose_result: patientData.glucose_result || '',
      on_insulin: patientData.on_insulin || false,
      num_previous_emergency: patientData.num_previous_emergency || 0,
    });
    setResult(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          What-If Analysis
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="a1c_scenario">A1C (%)</Label>
            <Input
              id="a1c_scenario"
              type="number"
              step="0.1"
              value={scenario.a1c_result}
              onChange={(e) => setScenario(prev => ({ 
                ...prev, 
                a1c_result: parseFloat(e.target.value) || 0 
              }))}
              placeholder="7.0"
            />
          </div>

          <div>
            <Label htmlFor="glucose_scenario">Glucose (mg/dL)</Label>
            <Input
              id="glucose_scenario"
              type="number"
              value={scenario.glucose_result}
              onChange={(e) => setScenario(prev => ({ 
                ...prev, 
                glucose_result: parseInt(e.target.value) || 0 
              }))}
              placeholder="120"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="emergency_visits">Emergency Visits (past year)</Label>
          <Input
            id="emergency_visits"
            type="number"
            min="0"
            value={scenario.num_previous_emergency}
            onChange={(e) => setScenario(prev => ({ 
              ...prev, 
              num_previous_emergency: parseInt(e.target.value) || 0 
            }))}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="insulin_scenario"
            checked={scenario.on_insulin}
            onCheckedChange={(checked) => setScenario(prev => ({ 
              ...prev, 
              on_insulin: !!checked 
            }))}
          />
          <Label htmlFor="insulin_scenario">On insulin therapy</Label>
        </div>

        <Button 
          onClick={handleCalculate} 
          disabled={whatIfMutation.isPending}
          className="w-full"
        >
          {whatIfMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Calculate New Risk
        </Button>

        {result && (
          <div className="pt-4 border-t space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Current Risk:</span>
              <span className="text-lg font-bold">{Math.round(currentRisk * 100)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Projected Risk:</span>
              <RiskBadge risk={result.group} probability={result.prob} />
            </div>
            
            {result.local_factors.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Updated Factors:</h5>
                <div className="space-y-1">
                  {result.local_factors.slice(0, 3).map((factor, index) => (
                    <div key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                      {factor}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}