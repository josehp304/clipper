import firebase_admin
from firebase_admin import credentials, firestore

# Initialize firebase admin
try:
    if not firebase_admin._apps:
        # Using Application Default Credentials
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            'projectId': 'clipper-451e7'
        })
    db = firestore.client()
except Exception as e:
    print(f"Error initializing Firebase: {e}")
    exit(1)

def seed_data():
    # 1. User
    user_data = {
        "id": "u1",
        "name": "Splity",
        "projects": ["p1"]
    }
    db.collection("users").document(user_data["id"]).set(user_data)
    print(f"Stored user: {user_data['id']}")

    # 2. Project
    project_data = {
        "id": "p1",
        "name": "Podcast Episode 12",
        "clips": ["c1"]
    }
    db.collection("projects").document(project_data["id"]).set(project_data)
    print(f"Stored project: {project_data['id']}")

    # 3. Clip
    clip_data = {
        "id": "c1",
        "title": "Best Advice Moment",
        "timestamp": { "start": "00:10", "end": "00:35" }
    }
    db.collection("clips").document(clip_data["id"]).set(clip_data)
    print(f"Stored clip: {clip_data['id']}")

if __name__ == "__main__":
    seed_data()
    print("Seeding complete!")
