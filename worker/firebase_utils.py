import firebase_admin
from firebase_admin import credentials, storage
import os

# Initialize firebase admin
# For local development, we use Application Default Credentials (ADC) 
# or a service account key file.
# Since we don't have a key file, we'll try to initialize with default credentials.
try:
    if not firebase_admin._apps:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            'storageBucket': 'clipper-451e7.firebasestorage.app'
        })
except Exception as e:
    print(f"Firebase initialization warning: {e}")
    # Fallback to manual setup if needed or just skip if no credentials
    pass

def upload_to_firebase(local_path: str, destination_blob_name: str):
    """
    Uploads a file to Firebase Storage.
    """
    try:
        bucket = storage.bucket()
        blob = bucket.blob(destination_blob_name)
        blob.upload_from_filename(local_path)

        # Make public and return URL
        blob.make_public()
        return blob.public_url
    except Exception as e:
        print(f"Error uploading to Firebase Storage: {e}")
        return None
