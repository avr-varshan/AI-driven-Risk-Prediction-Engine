import pandas as pd
from collections import Counter
from imblearn.over_sampling import SMOTE
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, average_precision_score, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

# -------------------------------
# Step 1: Load dataset
# -------------------------------
df = pd.read_csv("diabetes_preprocessed.csv")

X = df.drop(columns=["readmitted_within_30d"])
y = df["readmitted_within_30d"]

print("Original dataset shape:", Counter(y))

# -------------------------------
# Step 2: Train/Test Split (before SMOTE!)
# -------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print("Train set shape:", Counter(y_train))
print("Test set shape :", Counter(y_test))

# -------------------------------
# Step 3: Apply SMOTE only on training set
# -------------------------------
smt = SMOTE(random_state=42)
X_train_res, y_train_res = smt.fit_resample(X_train, y_train)

print("Resampled train set shape:", Counter(y_train_res))

# -------------------------------
# Step 4: Random Forest
# -------------------------------
rf = RandomForestClassifier(
    n_estimators=200,
    max_depth=25,
    min_samples_split=10,
    class_weight=None,  # already balanced with SMOTE
    random_state=42,
    n_jobs=-1
)

rf.fit(X_train_res, y_train_res)
y_pred = rf.predict(X_test)
y_pred_proba = rf.predict_proba(X_test)[:, 1]

# -------------------------------
# Step 5: Metrics
# -------------------------------
acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred)
rec = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
auroc = roc_auc_score(y_test, y_pred_proba)
auprc = average_precision_score(y_test, y_pred_proba)
cm = confusion_matrix(y_test, y_pred)

print("\n=== Random Forest with SMOTE (Train Only) ===")
print(f"Accuracy : {acc:.3f}")
print(f"Precision: {prec:.3f}")
print(f"Recall   : {rec:.3f}")
print(f"F1-score : {f1:.3f}")
print(f"AUROC    : {auroc:.3f}")
print(f"AUPRC    : {auprc:.3f}")
print("Confusion Matrix:\n", cm)

import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.metrics import (
    roc_curve, roc_auc_score, auc,
    precision_recall_curve, average_precision_score,
    confusion_matrix, brier_score_loss,
    accuracy_score, precision_score, recall_score, f1_score, classification_report
)
from sklearn.calibration import calibration_curve

# -----------------------
# Output directory
# -----------------------
out_dir = "model_eval_outputs"
os.makedirs(out_dir, exist_ok=True)

# -----------------------
# Compute metrics (ensure y_test, y_pred, y_pred_proba exist)
# -----------------------
metrics = {
    "accuracy": accuracy_score(y_test, y_pred),
    "precision": precision_score(y_test, y_pred),
    "recall": recall_score(y_test, y_pred),
    "f1": f1_score(y_test, y_pred),
    "auroc": roc_auc_score(y_test, y_pred_proba),
    "auprc": average_precision_score(y_test, y_pred_proba),
    "brier_score": brier_score_loss(y_test, y_pred_proba),
}

# Save metrics as CSV and JSON
metrics_df = pd.DataFrame([metrics])
metrics_df.to_csv(os.path.join(out_dir, "metrics_summary.csv"), index=False)
with open(os.path.join(out_dir, "metrics_summary.json"), "w") as f:
    json.dump(metrics, f, indent=2)

# Also create a classification report text file
with open(os.path.join(out_dir, "classification_report.txt"), "w") as f:
    f.write(classification_report(y_test, y_pred))

# -----------------------
# 1) AUROC plot (ROC curve)
# -----------------------
fpr, tpr, roc_thresh = roc_curve(y_test, y_pred_proba)
roc_auc = auc(fpr, tpr)

plt.figure(figsize=(7, 6))
plt.plot(fpr, tpr, lw=2, label=f'ROC curve (AUC = {roc_auc:.3f})')
plt.plot([0, 1], [0, 1], linestyle='--', lw=1)         # diagonal
plt.xlim([-0.01, 1.01])
plt.ylim([-0.01, 1.01])
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('Receiver Operating Characteristic (AUROC)')
plt.legend(loc='lower right')
plt.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(os.path.join(out_dir, "auroc_curve.png"), dpi=300, bbox_inches='tight')
plt.close()

# -----------------------
# 2) AUPRC plot (Precision-Recall curve)
# -----------------------
precision_vals, recall_vals, pr_thresh = precision_recall_curve(y_test, y_pred_proba)
avg_prec = average_precision_score(y_test, y_pred_proba)

plt.figure(figsize=(7, 6))
plt.plot(recall_vals, precision_vals, lw=2, label=f'PR curve (AUPRC = {avg_prec:.3f})')
# baseline: positive class prevalence
pos_rate = np.mean(y_test)
plt.hlines(pos_rate, 0, 1, linestyle='--', linewidth=1, label=f'Baseline = {pos_rate:.3f}')
plt.xlim([-0.01, 1.01])
plt.ylim([-0.01, 1.01])
plt.xlabel('Recall')
plt.ylabel('Precision')
plt.title('Precision-Recall Curve (AUPRC)')
plt.legend(loc='lower left')
plt.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(os.path.join(out_dir, "auprc_pr_curve.png"), dpi=300, bbox_inches='tight')
plt.close()

# -----------------------
# 3) Calibration plot (reliability diagram + probability histogram)
# -----------------------
# Use 10 bins by default
prob_true, prob_pred = calibration_curve(y_test, y_pred_proba, n_bins=10, strategy='uniform')

plt.figure(figsize=(8, 6))
# reliability diagram
plt.plot([0, 1], [0, 1], linestyle='--', lw=1)
plt.plot(prob_pred, prob_true, marker='o', lw=2, label='Reliability')
plt.xlabel('Mean Predicted Probability')
plt.ylabel('Fraction of Positives')
plt.title('Calibration Plot (Reliability Diagram)')
plt.grid(alpha=0.3)
plt.legend()
plt.tight_layout()
plt.savefig(os.path.join(out_dir, "calibration_reliability.png"), dpi=300, bbox_inches='tight')
plt.close()

# Save a combined calibration figure: reliability + histogram of probabilities
plt.figure(figsize=(8, 6))
ax1 = plt.subplot2grid((3, 1), (0, 0), rowspan=2)
ax2 = plt.subplot2grid((3, 1), (2, 0), rowspan=1, sharex=ax1)

ax1.plot([0, 1], [0, 1], linestyle='--', lw=1)
ax1.plot(prob_pred, prob_true, marker='o', lw=2)
ax1.set_ylabel('Fraction of Positives')
ax1.set_title('Calibration (Reliability) + Probability histogram')
ax1.grid(alpha=0.3)

# histogram of predicted probabilities
ax2.hist(y_pred_proba, bins=20)
ax2.set_xlabel('Predicted probability')
ax2.set_ylabel('Count')
ax2.grid(alpha=0.3)

plt.tight_layout()
plt.savefig(os.path.join(out_dir, "calibration_combo.png"), dpi=300, bbox_inches='tight')
plt.close()

# -----------------------
# 4) Confusion matrix (annotated)
# -----------------------
cm = confusion_matrix(y_test, y_pred)
tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (None, None, None, None)  # safe for binary

plt.figure(figsize=(6, 5))
plt.imshow(cm, interpolation='nearest', aspect='auto')
plt.title('Confusion Matrix')
plt.colorbar()
classes = ['No Readmission', 'Readmission']
tick_marks = np.arange(len(classes))
plt.xticks(tick_marks, classes, rotation=45)
plt.yticks(tick_marks, classes)

thresh = cm.max() / 2.0
for i in range(cm.shape[0]):
    for j in range(cm.shape[1]):
        plt.text(j, i, format(cm[i, j], 'd'),
                 horizontalalignment="center",
                 verticalalignment="center",
                 color="white" if cm[i, j] > thresh else "black",
                 fontsize=12)

plt.ylabel('Actual')
plt.xlabel('Predicted')
plt.tight_layout()
plt.savefig(os.path.join(out_dir, "confusion_matrix.png"), dpi=300, bbox_inches='tight')
plt.close()

# -----------------------
# Completion message
# -----------------------
print(f"Saved plots and metrics to: {os.path.abspath(out_dir)}")
print(metrics)

