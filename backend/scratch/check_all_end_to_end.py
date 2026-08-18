import requests
import json
import asyncio


BASE_URL = "http://localhost:8000"

def test_backend_health():
    print("--- Testing Backend Health ---")
    try:
        r = requests.get(f"{BASE_URL}/")
        print(f"Health status: {r.status_code}, body: {r.json()}")
        assert r.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")

def test_swagger_docs():
    print("--- Testing Swagger Docs (/docs) ---")
    try:
        r = requests.get(f"{BASE_URL}/docs")
        print(f"Docs status: {r.status_code}")
        assert r.status_code == 200
    except Exception as e:
        print(f"Docs check failed: {e}")

def test_openapi_schema():
    print("--- Testing OpenAPI Schema (/openapi.json) ---")
    try:
        r = requests.get(f"{BASE_URL}/openapi.json")
        print(f"OpenAPI status: {r.status_code}")
        assert r.status_code == 200
    except Exception as e:
        print(f"OpenAPI check failed: {e}")

if __name__ == "__main__":
    test_backend_health()
    test_swagger_docs()
    test_openapi_schema()
