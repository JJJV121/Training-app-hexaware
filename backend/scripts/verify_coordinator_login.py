import asyncio
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from unittest.mock import MagicMock
from app.database.session import AsyncSessionLocal
from app.services.auth_service import login_user

async def verify():
    email = "coordinator@hexaware.com"
    password = "Coordinator@123"
    
    mock_request = MagicMock()
    mock_request.client.host = "127.0.0.1"
    mock_request.headers.get.return_value = "Python Verification Script"

    async with AsyncSessionLocal() as db:
        try:
            result = await login_user(
                db=db,
                email=email,
                password=password,
                request=mock_request
            )
            print("--- LOGIN SUCCESSFUL ---")
            print(f"Token Type: {result.get('token_type')}")
            print(f"Token generated: {result.get('access_token')[:20]}...")
            print(f"User Details: {result.get('user')}")
            print("--- VERIFICATION PASSED ---")
        except Exception as e:
            print(f"--- LOGIN FAILED ---: {e}")

if __name__ == "__main__":
    asyncio.run(verify())
