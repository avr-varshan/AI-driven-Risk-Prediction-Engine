import pandas as pd

# -------------------------------
# Step 1: Load dataset
# -------------------------------
df = pd.read_csv("diabetic_data.csv")

print("Original shape:", df.shape)
print("Columns:", df.columns[:15], "...")  # preview first 15 cols
print(df["readmitted"].value_counts())

# -------------------------------
# Step 2: Target Variable
# -------------------------------
# Convert readmission column into binary target
# "<30" = readmission within 30 days (1)
# "NO" = no readmission (0)
# ">30" = either drop or treat as 0 (depending on framing)

df = df[df["readmitted"] != ">30"].copy()   # drop >30 for simplicity
df["readmitted_within_30d"] = df["readmitted"].apply(lambda x: 1 if x == "<30" else 0)

print("Target distribution:\n", df["readmitted_within_30d"].value_counts())

# -------------------------------
# Step 3: Drop Identifiers
# -------------------------------
df = df.drop(columns=["encounter_id", "patient_nbr", "readmitted"])

# -------------------------------
# Step 4: Handle Missing / Unknown Values
# -------------------------------
# Replace "?" with NaN
df = df.replace("?", pd.NA)

# Drop columns with too many missing values (e.g., weight, payer_code, medical_specialty)
missing = df.isna().mean()
drop_cols = missing[missing > 0.5].index.tolist()
df = df.drop(columns=drop_cols)

print("Dropped cols (too many missing):", drop_cols)

# -------------------------------
# Step 5: Encode Categorical Variables
# -------------------------------
cat_cols = df.select_dtypes(include="object").columns
df_encoded = pd.get_dummies(df, columns=cat_cols, drop_first=True)

print("Encoded shape:", df_encoded.shape)

# -------------------------------
# Step 6: Save Cleaned Dataset
# -------------------------------
df_encoded.to_csv("diabetes_preprocessed.csv", index=False)
print("✅ Preprocessed dataset saved as welldoc/diabetes_preprocessed.csv")