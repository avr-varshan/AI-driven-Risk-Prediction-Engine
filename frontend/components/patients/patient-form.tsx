'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskBadge } from '@/components/ui/risk-badge';
import { createPatient } from '@/lib/api';
import { CreatePatientResponse } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const patientSchema = z.object({
  age: z.number().min(0).max(120),
  gender: z.string().min(1, 'Gender is required'),
  race: z.string().min(1, 'Race is required'),
  admission_type: z.string().min(1, 'Admission type is required'),
  num_previous_inpatient: z.number().min(0),
  num_previous_emergency: z.number().min(0),
  num_previous_outpatient: z.number().min(0),
  a1c_result: z.number().optional(),
  glucose_result: z.number().optional(),
  on_insulin: z.boolean(),
  primary_diagnosis: z.string().min(1, 'Primary diagnosis is required'),
  comorbidities: z.array(z.string()),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  onSuccess?: (result: CreatePatientResponse) => void;
}

export function PatientForm({ onSuccess }: PatientFormProps) {
  const [riskResult, setRiskResult] = useState<CreatePatientResponse | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      on_insulin: false,
      comorbidities: [],
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: createPatient,
    onSuccess: (data) => {
      setRiskResult(data);
      onSuccess?.(data);
    },
  });

  const onSubmit = (data: PatientFormData) => {
    createPatientMutation.mutate(data);
  };

  if (riskResult) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Risk Assessment Complete</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <RiskBadge 
              risk={riskResult.risk.group} 
              probability={riskResult.risk.prob}
              className="text-lg p-3"
            />
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Key Risk Factors:</h4>
            <div className="flex flex-wrap gap-2">
              {riskResult.risk.local_factors.map((factor, index) => (
                <span
                  key={index}
                  className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                >
                  {factor}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Recommendations:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              {riskResult.risk.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2 pt-4">
            <Button asChild>
              <Link href={`/patients/${riskResult.patient_nbr}`}>
                View Patient Detail
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setRiskResult(null)}>
              Add Another Patient
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto space-y-6">
      {/* Demographics */}
      <Card>
        <CardHeader>
          <CardTitle>Demographics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              {...register('age', { valueAsNumber: true })}
            />
            {errors.age && (
              <p className="text-red-600 text-sm mt-1">{errors.age.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select onValueChange={(value) => setValue('gender', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-red-600 text-sm mt-1">{errors.gender.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="race">Race/Ethnicity</Label>
            <Select onValueChange={(value) => setValue('race', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select race/ethnicity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="White">White</SelectItem>
                <SelectItem value="Black">Black</SelectItem>
                <SelectItem value="Hispanic">Hispanic</SelectItem>
                <SelectItem value="Asian">Asian</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.race && (
              <p className="text-red-600 text-sm mt-1">{errors.race.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clinical Information */}
      <Card>
        <CardHeader>
          <CardTitle>Clinical Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="admission_type">Admission Type</Label>
              <Select onValueChange={(value) => setValue('admission_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select admission type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="Elective">Elective</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              {errors.admission_type && (
                <p className="text-red-600 text-sm mt-1">{errors.admission_type.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="primary_diagnosis">Primary Diagnosis</Label>
              <Input
                id="primary_diagnosis"
                placeholder="Enter ICD code or description"
                {...register('primary_diagnosis')}
              />
              {errors.primary_diagnosis && (
                <p className="text-red-600 text-sm mt-1">{errors.primary_diagnosis.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="inpatient">Previous Inpatient Visits</Label>
              <Input
                id="inpatient"
                type="number"
                min="0"
                {...register('num_previous_inpatient', { valueAsNumber: true })}
              />
            </div>

            <div>
              <Label htmlFor="emergency">Previous Emergency Visits</Label>
              <Input
                id="emergency"
                type="number"
                min="0"
                {...register('num_previous_emergency', { valueAsNumber: true })}
              />
            </div>

            <div>
              <Label htmlFor="outpatient">Previous Outpatient Visits</Label>
              <Input
                id="outpatient"
                type="number"
                min="0"
                {...register('num_previous_outpatient', { valueAsNumber: true })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lab Results */}
      <Card>
        <CardHeader>
          <CardTitle>Lab Results & Medications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="a1c">A1C Result (%)</Label>
              <Input
                id="a1c"
                type="number"
                step="0.1"
                placeholder="e.g., 7.2"
                {...register('a1c_result', { valueAsNumber: true })}
              />
            </div>

            <div>
              <Label htmlFor="glucose">Glucose Result (mg/dL)</Label>
              <Input
                id="glucose"
                type="number"
                placeholder="e.g., 140"
                {...register('glucose_result', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="insulin"
              checked={watch('on_insulin')}
              onCheckedChange={(checked) => setValue('on_insulin', !!checked)}
            />
            <Label htmlFor="insulin">Currently on insulin therapy</Label>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          Save as Draft
        </Button>
        <Button 
          type="submit" 
          disabled={createPatientMutation.isPending}
        >
          {createPatientMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Calculate Risk Score
        </Button>
      </div>
    </form>
  );
}