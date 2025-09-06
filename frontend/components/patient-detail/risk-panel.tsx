import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskBadge } from '@/components/ui/risk-badge';
import { Risk } from '@/lib/types';

interface RiskPanelProps {
  risk: Risk;
}

export function RiskPanel({ risk }: RiskPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Assessment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {Math.round(risk.prob * 100)}%
          </div>
          <RiskBadge risk={risk.group} className="text-lg px-4 py-2" />
          <p className="text-sm text-gray-600 mt-2">
            Predicted 90-day readmission probability
          </p>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Primary Risk Drivers</h4>
          <div className="space-y-2">
            {risk.local_factors.slice(0, 5).map((factor: any, index) => {
  let label: string;

  if (typeof factor === "string") {
    // case 1: backend sent just a string
    label = factor;
  } else if (factor.feature && factor.impact != null) {
    // case 2: backend sent { feature, impact }
    const impactVal = Number(factor.impact); // convert string → number if needed
    label = `${factor.feature}: ${isNaN(impactVal) ? factor.impact : impactVal.toFixed(2)}`;
  } else {
    // fallback: just dump JSON
    label = JSON.stringify(factor);
  }

  return (
    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      <div className="w-1 h-4 bg-blue-500 rounded-full" />
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
})}


          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Clinical Recommendations</h4>
          <ul className="space-y-1 text-sm text-gray-600">
            {risk.recommendations.slice(0, 3).map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                {recommendation}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}