import urllib.request
import urllib.error
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def make_request(path, method="GET", body=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    req_data = None
    if body is not None:
        req_data = json.dumps(body).encode("utf-8")
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            response_body = response.read().decode("utf-8")
            data = json.loads(response_body) if response_body else None
            print(f"[OK] {method} {path} - Status: {status}")
            return status, data
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"[FAIL] {method} {path} - Status: {e.code}, Error: {err_body}")
        return e.code, err_body
    except Exception as e:
        print(f"[ERROR] {method} {path} - Exception: {e}")
        return None, str(e)

def run_tests():
    # Wait for server to be fully ready
    print("Waiting for server to be ready...")
    time.sleep(2)

    # 1. GET /api/trainer/overview
    print("\n--- Testing GET /api/trainer/overview ---")
    status, overview = make_request("/api/trainer/overview")
    print(json.dumps(overview, indent=2))

    # 2. GET /api/trainer/batches
    print("\n--- Testing GET /api/trainer/batches ---")
    status, batches = make_request("/api/trainer/batches")
    print(f"Found {len(batches) if batches else 0} batches")
    if not batches:
        print("No batches found! Cannot proceed with dependent tests.")
        return
    
    batch_id = batches[0]["id"]
    print(f"Using batch_id = {batch_id} for details/trainees tests")

    # 3. GET /api/trainer/batches/{batch_id}
    print(f"\n--- Testing GET /api/trainer/batches/{batch_id} ---")
    status, batch_detail = make_request(f"/api/trainer/batches/{batch_id}")
    print(json.dumps(batch_detail, indent=2))

    # 4. GET /api/trainer/batches/{batch_id}/trainees
    print(f"\n--- Testing GET /api/trainer/batches/{batch_id}/trainees ---")
    status, trainees = make_request(f"/api/trainer/batches/{batch_id}/trainees")
    print(f"Found {len(trainees) if trainees else 0} trainees")
    if trainees:
        trainee_id = trainees[0]["trainee_id"]
        print(f"First Trainee ID: {trainee_id}")
    else:
        trainee_id = 3 # fallback

    # 5. GET /api/trainer/sessions
    print("\n--- Testing GET /api/trainer/sessions ---")
    status, sessions = make_request("/api/trainer/sessions")
    print(f"Found {len(sessions) if sessions else 0} sessions")

    # 6. GET /api/trainer/sessions/upcoming
    print("\n--- Testing GET /api/trainer/sessions/upcoming ---")
    status, upcoming = make_request("/api/trainer/sessions/upcoming")
    print(f"Found {len(upcoming) if upcoming else 0} upcoming sessions")

    # 7. POST /api/trainer/sessions
    print("\n--- Testing POST /api/trainer/sessions ---")
    new_session_body = {
        "title": "API Test Session",
        "description": "Created during API Verification",
        "session_type": "ONLINE",
        "batch_id": batch_id,
        "trainer_id": 24, # Trainer One
        "start_time": (datetime.utcnow() + timedelta(days=1)).isoformat() + "Z" if False else "2026-08-20T10:00:00Z",
        "end_time": "2026-08-20T12:00:00Z",
        "meeting_link": "https://meet.google.com/test-meet"
    }
    status, created_session = make_request("/api/trainer/sessions", method="POST", body=new_session_body)
    print(json.dumps(created_session, indent=2))
    
    if status == 201:
        created_session_id = created_session["id"]
    else:
        print("Failed to create session. Skipping dependent session tests.")
        return

    # 8. GET /api/trainer/sessions/{session_id}
    print(f"\n--- Testing GET /api/trainer/sessions/{created_session_id} ---")
    status, session_detail = make_request(f"/api/trainer/sessions/{created_session_id}")
    print(json.dumps(session_detail, indent=2))

    # 9. PUT /api/trainer/sessions/{session_id}
    print(f"\n--- Testing PUT /api/trainer/sessions/{created_session_id} ---")
    update_session_body = {
        "title": "API Test Session (Updated)",
        "description": "Updated during API Verification",
        "session_type": "OFFLINE",
        "meeting_link": None
    }
    status, updated_session = make_request(f"/api/trainer/sessions/{created_session_id}", method="PUT", body=update_session_body)
    print(json.dumps(updated_session, indent=2))

    # 10. POST /api/trainer/attendance (mark attendance)
    print("\n--- Testing POST /api/trainer/attendance ---")
    new_attendance_body = {
        "session_id": created_session_id,
        "trainee_id": trainee_id,
        "status": "PRESENT"
    }
    status, created_attendance = make_request("/api/trainer/attendance", method="POST", body=new_attendance_body)
    print(json.dumps(created_attendance, indent=2))
    
    if status == 200:
        created_attendance_id = created_attendance["id"]
    else:
        print("Failed to mark attendance. Skipping dependent attendance tests.")
        return

    # 11. PUT /api/trainer/attendance/{attendance_id}
    print(f"\n--- Testing PUT /api/trainer/attendance/{created_attendance_id} ---")
    update_attendance_body = {
        "status": "LATE"
    }
    status, updated_attendance = make_request(f"/api/trainer/attendance/{created_attendance_id}", method="PUT", body=update_attendance_body)
    print(json.dumps(updated_attendance, indent=2))

    # 12. GET /api/trainer/attendance/session/{session_id}
    print(f"\n--- Testing GET /api/trainer/attendance/session/{created_session_id} ---")
    status, session_attendance = make_request(f"/api/trainer/attendance/session/{created_session_id}")
    print(json.dumps(session_attendance, indent=2))

    # 13. GET /api/trainer/attendance/trainee/{trainee_id}
    print(f"\n--- Testing GET /api/trainer/attendance/trainee/{trainee_id} ---")
    status, trainee_attendance = make_request(f"/api/trainer/attendance/trainee/{trainee_id}")
    print(f"Found {len(trainee_attendance) if trainee_attendance else 0} attendance records for trainee {trainee_id}")

    # 14. DELETE /api/trainer/sessions/{session_id}
    print(f"\n--- Testing DELETE /api/trainer/sessions/{created_session_id} ---")
    status, delete_msg = make_request(f"/api/trainer/sessions/{created_session_id}", method="DELETE")
    print(json.dumps(delete_msg, indent=2))

if __name__ == "__main__":
    run_tests()
