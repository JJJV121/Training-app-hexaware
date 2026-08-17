import asyncio
import urllib.request
import json

BASE_URL = "http://localhost:8000"

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    if data:
        data_bytes = json.dumps(data).encode('utf-8')
        headers["Content-Type"] = "application/json"
    else:
        data_bytes = None
    
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode('utf-8'))

def test_flow():
    print("--- 1. Testing Login for Trainee ---")
    status, res = make_request(f"{BASE_URL}/auth/login", method="POST", data={"email": "user@example.com", "password": "password123"})
    print(f"Trainee Login Status: {status}")
    token = res.get("access_token")
    user = res.get("user")
    print(f"Trainee User: {user}")

    print("\n--- 2. Testing Trainee Dashboard ---")
    status, dash = make_request(f"{BASE_URL}/dashboard/{user['id']}")
    print(f"Dashboard Status: {status}, Name: {dash.get('name')}, Courses: {dash.get('courses_enrolled')}")

    print("\n--- 3. Testing Profile with Bearer Token ---")
    headers = {"Authorization": f"Bearer {token}"}
    status, prof = make_request(f"{BASE_URL}/profile", headers=headers)
    print(f"Profile Status: {status}, Profile: {prof}")

    print("\n--- 4. Testing Admin Login ---")
    status, res_admin = make_request(f"{BASE_URL}/auth/login", method="POST", data={"email": "admin@hexaware.com", "password": "admin123"})
    print(f"Admin Login Status: {status}, User: {res_admin.get('user')}")

    print("\n--- 5. Testing Trainer Login ---")
    status, res_trainer = make_request(f"{BASE_URL}/auth/login", method="POST", data={"email": "trainer@example.com", "password": "trainer123"})
    print(f"Trainer Login Status: {status}, User: {res_trainer.get('user')}")

if __name__ == "__main__":
    test_flow()
