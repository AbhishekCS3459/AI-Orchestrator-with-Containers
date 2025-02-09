import os
import pandas as pd
import numpy as np
import re
import boto3
from botocore.exceptions import NoCredentialsError

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
INPUT_FILENAME = os.getenv("INPUT_FILENAME")

if not all([AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, INPUT_FILENAME]):
    raise ValueError("Missing required environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, INPUT_FILENAME")

UNCLEANED_BUCKET = "uncleaned-store"
CLEANED_BUCKET = "cleaned-store"

s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name="ap-south-1",
    config=boto3.session.Config(signature_version="s3v4")
)

def download_from_s3(bucket_name, object_key, local_path):
    try:
        s3.download_file(bucket_name, object_key, local_path)
        print(f"Downloaded {object_key} from {bucket_name}")
    except NoCredentialsError:
        print("AWS credentials not found")
    except Exception as e:
        print(f"Error downloading from S3: {e}")

def upload_to_s3(bucket_name, object_key, local_path):
    try:
        s3.upload_file(local_path, bucket_name, object_key, ExtraArgs={'ACL': 'public-read'})
        print(f"Uploaded {local_path} to {bucket_name} with public access")
    except NoCredentialsError:
        print("AWS credentials not found")
    except Exception as e:
        print(f"Error uploading to S3: {e}")

def generate_presigned_url(bucket_name, object_key, expiration=3600):
    try:
        url = s3.generate_presigned_url('get_object',
                                        Params={'Bucket': bucket_name, 'Key': object_key},
                                        ExpiresIn=expiration)
        print(f"Pre-signed URL: {url}")
        return url
    except Exception as e:
        print(f"Error generating URL: {e}")

def read_data(file_path):
    return pd.read_csv(file_path)

def clean_column_names(df):
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
    print("Standardized Column Names:", df.columns.tolist())
    return df

def trim_whitespace(df):
    df = df.map(lambda x: x.strip() if isinstance(x, str) else x)
    return df

def drop_duplicates(df):
    df.drop_duplicates(inplace=True)
    return df

def clean_emails(df, email_column='email'):
    if email_column not in df.columns:
        print(f"Warning: Column '{email_column}' not found in the dataset.")
        return df

    def is_valid_email(email):
        return bool(re.match(r"^[\w\.-]+@[\w\.-]+\.\w{2,}$", str(email).strip()))

    df[email_column] = df[email_column].apply(lambda x: x if is_valid_email(x) else np.nan)
    return df

def check_missing_data(df):
    for column in df.columns:
        if df[column].isnull().sum() > 0:
            if df[column].dtype in ['int64', 'float64']:
                df[column].fillna(df[column].median(), inplace=True)
            else:
                df[column].fillna(df[column].mode()[0], inplace=True)
    return df

def drop_invalid_rows(df):
    if 'id' in df.columns:
        df.dropna(subset=['id'], inplace=True)
    else:
        print("Warning: No 'id' column found. Skipping ID-based row drops.")
    return df

def find_outliers_IQR(df):
    for column in df.select_dtypes(include=['number']).columns:
        Q1 = df[column].quantile(0.25)
        Q3 = df[column].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        df[column] = np.where(df[column] < lower_bound, lower_bound, df[column])
        df[column] = np.where(df[column] > upper_bound, upper_bound, df[column])
    return df

def clean_data(file_path, output_path):
    df = read_data(file_path)
    df = clean_column_names(df)
    df = trim_whitespace(df)
    df = drop_duplicates(df)
    df = clean_emails(df)
    df = check_missing_data(df)
    df = drop_invalid_rows(df)
    df = find_outliers_IQR(df)
    df.to_csv(output_path, index=False)
    print(f"Cleaned data saved to {output_path}")

if __name__ == "__main__":
    output_filename = "cleaned_" + INPUT_FILENAME
    download_from_s3(UNCLEANED_BUCKET, INPUT_FILENAME, INPUT_FILENAME)
    clean_data(INPUT_FILENAME, output_filename)
    upload_to_s3(CLEANED_BUCKET, output_filename, output_filename)
    url = generate_presigned_url(CLEANED_BUCKET, output_filename)
    if url:
        print(f"Presigned URL for download: {url}")
