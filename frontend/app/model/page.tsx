import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Activity, BarChart4, Brain, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";     

export default function ModelPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
        {/* Back Button */}
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/">← Back to Dashboard</Link>
        </Button>
      </div>
      {/* Hero */}
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
          Model Performance & Validation
        </h1>
        <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
          Evaluating the AI-driven engine predicting 90-day deterioration risk in chronic care patients. 
          This section highlights dataset, modeling approach, evaluation metrics, and visualizations.
        </p>
      </section>

      {/* Dataset Summary */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Dataset Summary</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <CardTitle>Source</CardTitle>
            </CardHeader>
            <CardContent>
              UCI ML Repository – 10 years (1999–2008) of clinical care across 130 US hospitals.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              <CardTitle>Scope</CardTitle>
            </CardHeader>
            <CardContent>
              71,000+ inpatient encounters. Focused on diabetic patients. 50+ clinical and demographic features.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex items-center gap-2">
              <BarChart4 className="w-5 h-5 text-purple-600" />
              <CardTitle>Target</CardTitle>
            </CardHeader>
            <CardContent>
              Binary classification – risk of readmission within 30 days.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Modeling Approach */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Modeling Approach</h2>
        <Card>
          <CardContent className="space-y-2 text-gray-700 pt-4">
            <ul className="list-disc list-inside">
              <li>Train/test split: 80/20 (stratified by readmission status).</li>
              <li>Imbalance handled with <b>SMOTE oversampling</b>.</li>
              <li>Model: <b>Random Forest</b> (200 estimators, max depth = 25).</li>
              <li>Metrics used: Accuracy, AUROC, AUPRC, Precision, Recall, F1-score, Brier Score.</li>
              <li>Design goal: <b>Clinician explainability & actionable predictions</b>.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

{/* Evaluation Metrics */}
<section className="mb-12">
  <h2 className="text-2xl font-semibold mb-4">Evaluation Metrics</h2>
  <Card>
    <CardContent>
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Metric</th>
            <th className="p-2 border">Score</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-2">Accuracy</td>
            <td className="border p-2">0.807</td>
          </tr>
          <tr>
            <td className="border p-2">Precision</td>
            <td className="border p-2">0.356</td>
          </tr>
          <tr>
            <td className="border p-2">Recall</td>
            <td className="border p-2">0.154</td>
          </tr>
          <tr>
            <td className="border p-2">F1-score</td>
            <td className="border p-2">0.215</td>
          </tr>
          <tr>
            <td className="border p-2">AUROC</td>
            <td className="border p-2">0.658</td>
          </tr>
          <tr>
            <td className="border p-2">AUPRC</td>
            <td className="border p-2">0.291</td>
          </tr>
          <tr>
            <td className="border p-2">Brier Score</td>
            <td className="border p-2">0.170</td>
          </tr>
        </tbody>
      </table>
    </CardContent>
  </Card>
</section>


      {/* Classification Report */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Classification Report</h2>
        <Card>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Precision shows correctness of predicted readmissions. Recall shows 
              how many actual readmissions we captured. F1 balances both.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Class</th>
                    <th className="p-2 border">Precision</th>
                    <th className="p-2 border">Recall</th>
                    <th className="p-2 border">F1-score</th>
                    <th className="p-2 border">Support</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">No Readmission</td>
                    <td className="border p-2">0.84</td>
                    <td className="border p-2">0.94</td>
                    <td className="border p-2">0.89</td>
                    <td className="border p-2">10,973</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Readmitted</td>
                    <td className="border p-2">0.36</td>
                    <td className="border p-2">0.15</td>
                    <td className="border p-2">0.22</td>
                    <td className="border p-2">2,272</td>
                  </tr>
                </tbody>
                <tfoot className="bg-gray-50 font-medium">
                  <tr>
                    <td className="border p-2">Accuracy</td>
                    <td colSpan={4} className="border p-2 text-center">0.81</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Visualizations */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Model Visualizations</h2>
        <p className="text-sm text-gray-600 mb-4">
          Charts provide visual insight into how the model performs across metrics 
          and whether predicted probabilities are trustworthy.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { img: "auroc_curve.png", title: "AUROC Curve" },
            { img: "auprc_pr_curve.png", title: "Precision-Recall Curve" },
            { img: "calibration_reliability.png", title: "Calibration Reliability" },
            { img: "confusion_matrix.png", title: "Confusion Matrix" },
          ].map(({ img, title }) => (
            <Card key={img}>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Image
                  src={`/model_eval_outputs/${img}`}
                  alt={title}
                  width={500}
                  height={400}
                  className="rounded border"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

    </div>
  );
}
