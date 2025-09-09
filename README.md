# AI-Driven Risk Prediction Engine for Chronic Care Patients

A clinician-facing full-stack application that predicts hospital readmission risk (proxy for 90-day deterioration) for chronic-care patients, built with Next.js 14, React 18, Tailwind CSS, shadcn/ui, and an explainable ML backend.


---

## 📋 Overview

This application combines machine learning with a modern web interface to help clinicians identify high-risk chronic care patients before deterioration occurs. By analyzing patient demographics, lab results, medications, and medical history, it provides actionable insights to improve patient outcomes and reduce hospital readmissions.

## 🎯 Key Features

### 🔬 **ML-Powered Risk Prediction**
- Random Forest classifier with explainable AI (SHAP)
- Handles class imbalance with SMOTE oversampling
- Comprehensive evaluation metrics (AUROC, AUPRC, Brier score)
- Real-time risk scoring and what-if scenario analysis

### 🏥 **Clinician-Focused Interface**
- **Dashboard**: Cohort-level risk metrics and population insights
- **Patient List**: Virtualized table with advanced filtering and search
- **Patient Detail**: Individual risk analysis with explainable factors
- **Add Patient**: Immediate risk assessment for new patients
- **Chat Assistant**: AI-powered clinical decision support

### ⚡ **Performance Optimized**
- Server-side rendering with Next.js App Router
- Virtualized tables for handling large datasets
- Real-time data fetching with TanStack Query
- Responsive design optimized for clinical workflows

---

## 📊 Dataset

**Source**: [Diabetes 130-US Hospitals Dataset](https://www.kaggle.com/datasets/brandao/diabetes?resource=download)

**Description**: Real-world inpatient encounters from 130 hospitals (1999–2008) including:
- **Demographics**: Age, gender, race
- **Clinical Context**: Admission type, discharge disposition, length of stay
- **Lab Results**: A1C levels, glucose serum tests
- **Medications**: Insulin, metformin, and other diabetes medications
- **Diagnoses**: ICD-9 codes mapped to chronic conditions
- **Outcome**: Hospital readmission status


---


## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/avr-varshan/AI-driven-Risk-Prediction-Engine.git
cd AI-driven-Risk-Prediction-Engine
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🚀 Usage

### 1. **Dashboard Overview**
View cohort-level metrics including:
- Total patient count and risk distribution
- Average length of stay and diagnosis count
- Lab result summaries and top comorbidities

### 2. **Patient Management**
- **Search & Filter**: Find patients by demographics, risk level, or clinical factors
- **Bulk Operations**: Export filtered results to CSV/PDF
- **Virtual Scrolling**: Handle large patient datasets efficiently

### 3. **Individual Risk Analysis**
- **Risk Score**: High (≥0.70), Medium (0.40-0.69), Low (<0.40)
- **Explainable Factors**: SHAP-driven insights into risk contributors
- **Clinical Timeline**: Track encounters, labs, and medication changes
- **What-if Analysis**: Explore hypothetical scenarios

### 4. **New Patient Assessment**
- Add patient information through validated forms
- Receive immediate risk predictions
- Get recommended interventions

---


## 📈 Model Performance

The ML model generates comprehensive evaluation outputs:

- **Metrics**: Accuracy, Precision, Recall, F1-score, AUROC, AUPRC
- **Visualizations**: ROC curves, precision-recall curves, calibration plots
- **Reports**: Classification reports and confusion matrices

---


## 📁 Project Structure

```
├── frontend/                 # Next.js application
│   ├── app/                 # App router pages
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Utilities and configurations
│   └── public/              # Static assets
├── model/                 # Python ML backend
│   ├── train_models.py    # Model training script
│   ├── preprocess_diabetes.py     # Data preprocessing
└── README.md
```

---

## 🔬 Clinical Impact

This application enables healthcare providers to:

- **Identify High-Risk Patients** before clinical deterioration
- **Provide Explainable Insights** through SHAP analysis
- **Optimize Resource Allocation** based on risk stratification
- **Reduce Hospital Readmissions** through proactive intervention
- **Improve Patient Outcomes** with data-driven decision making

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14, React 18
- **Styling**: Tailwind CSS, shadcn/ui, Lucide React
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form, Zod
- **Visualization**: Recharts
- **Performance**: React Virtual

### Backend
- **ML Framework**: scikit-learn, SHAP
- **Data Processing**: pandas, numpy
- **Imbalanced Learning**: imbalanced-learn (SMOTE)

---

## 📚 References

- [Diabetes 130-US Hospitals Dataset](https://www.kaggle.com/datasets/brandao/diabetes)
- [SMOTE - imbalanced-learn](https://imbalanced-learn.org/stable/references/generated/imblearn.over_sampling.SMOTE.html)
- [Random Forest - scikit-learn](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html)
- [SHAP - Explainable AI](https://shap.readthedocs.io/en/latest/)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍⚕️ Disclaimer

This application is designed for educational and research purposes. It should not be used as the sole basis for clinical decision-making without appropriate validation and oversight by qualified healthcare professionals.
