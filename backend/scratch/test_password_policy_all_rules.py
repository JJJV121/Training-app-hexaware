import asyncio
from datetime import datetime, timedelta
from app.database.session import AsyncSessionLocal
from app.core.password_validation import (
    validate_password_syntax,
    validate_full_password_policy,
    check_password_reuse,
    record_password_change,
)
from app.services.auth_service import login_user, create_user, activate_account, reset_password
from app.services.profile_service import change_password
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate
from sqlalchemy import select, delete
from app.models.password_history import PasswordHistory
from app.models.login_history import LoginHistory

class DummyClient:
    host = "127.0.0.1"

class DummyRequest:
    client = DummyClient()
    headers = {"user-agent": "pytest-runner"}


async def run_tests():
    print("==================================================")
    print("  RUNNING PASSWORD POLICY TEST SUITE")
    print("==================================================")

    # 1. Test Syntax Validation (Rules 1 - 4)
    print("\n--- Test 1: Syntax Validation (Rules 1-4) ---")

    # Invalid: < 12 characters
    try:
        validate_password_syntax("Short1@")
        assert False, "Should have failed length < 12"
    except ValueError as e:
        print(" [PASS] Length < 12 rejected properly:", e)

    # Invalid: Missing Uppercase
    try:
        validate_password_syntax("lowercase123@#$")
        assert False, "Should have failed missing uppercase"
    except ValueError as e:
        print(" [PASS] Missing Uppercase rejected properly:", e)

    # Invalid: Missing Lowercase
    try:
        validate_password_syntax("UPPERCASE123@#$")
        assert False, "Should have failed missing lowercase"
    except ValueError as e:
        print(" [PASS] Missing Lowercase rejected properly:", e)

    # Invalid: Missing Numeral
    try:
        validate_password_syntax("NoNumeralHere@#$")
        assert False, "Should have failed missing numeral"
    except ValueError as e:
        print(" [PASS] Missing Numeral rejected properly:", e)

    # Invalid: Missing Special Character
    try:
        validate_password_syntax("NoSpecialChar123")
        assert False, "Should have failed missing special char"
    except ValueError as e:
        print(" [PASS] Missing Special Character rejected properly:", e)

    # Valid Password
    try:
        validate_password_syntax("ValidPass123!@#")
        print(" [PASS] Valid 12+ char password with Upper, Lower, Digit, Special accepted.")
    except ValueError as e:
        assert False, f"Valid password failed syntax check: {e}"


    # 2. Test Last 6 Passwords Reuse Check (Rule 6)
    print("\n--- Test 2: Last 6 Passwords Reuse Check (Rule 6) ---")
    async with AsyncSessionLocal() as db:
        test_email = "policy_test_user@example.com"
        
        # Cleanup any existing test user
        existing_user = await db.scalar(select(User).where(User.email == test_email))
        if existing_user:
            await db.execute(delete(PasswordHistory).where(PasswordHistory.user_id == existing_user.id))
            await db.execute(delete(LoginHistory).where(LoginHistory.user_id == existing_user.id))
            await db.delete(existing_user)
            await db.commit()

        # Create test user
        user = User(
            employee_id="EMP_POLICY_TEST_1",
            name="Policy Test User",
            email=test_email,
            role="trainee",
            is_active=True,
            password_hash=hash_password("InitialPass123!"),
            password_changed_at=datetime.utcnow(),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        p1 = "InitialPass123!" # Current
        
        # Try updating to same password
        try:
            await check_password_reuse(db, user.id, user.password_hash, p1)
            assert False, "Should have blocked current password reuse"
        except ValueError as e:
            print(" [PASS] Reusing current password rejected:", e)

        # Add 5 historic passwords
        passwords = [
            "HistPass_001!@#",
            "HistPass_002!@#",
            "HistPass_003!@#",
            "HistPass_004!@#",
            "HistPass_005!@#",
        ]

        for p in passwords:
            await record_password_change(db, user, user.password_hash)
            user.password_hash = hash_password(p)
            await db.commit()

        # Total history: p1 + 5 past entries = 6 total past passwords
        # Verify attempting any of these 6 is rejected
        for old_p in [p1] + passwords:
            try:
                await check_password_reuse(db, user.id, user.password_hash, old_p)
                assert False, f"Should have blocked reuse of past password {old_p}"
            except ValueError as e:
                pass
        print(" [PASS] All 6 previous passwords successfully blocked from reuse.")

        # Try a brand new 7th password - should succeed!
        new_pass_7 = "BrandNewPass777!"
        await check_password_reuse(db, user.id, user.password_hash, new_pass_7)
        print(" [PASS] Brand new 7th password accepted.")


    # 3. Test 45-Day Password Expiration (Rule 5)
    print("\n--- Test 3: 45-Day Password Expiration Check (Rule 5) ---")
    async with AsyncSessionLocal() as db:
        # Set user's password_changed_at to 46 days ago
        user = await db.scalar(select(User).where(User.email == test_email))
        user.password_changed_at = datetime.utcnow() - timedelta(days=46)
        user.password_hash = hash_password("ValidPass123!@#")
        await db.commit()

        try:
            await login_user(db, test_email, "ValidPass123!@#", DummyRequest())
            assert False, "Should have blocked login for expired password (>45 days)"
        except ValueError as e:
            print(" [PASS] Login blocked for password changed 46 days ago:", e)

        # Reset password_changed_at to today (0 days ago)
        user.password_changed_at = datetime.utcnow()
        await db.commit()

        login_res = await login_user(db, test_email, "ValidPass123!@#", DummyRequest())
        assert login_res.get("access_token") is not None
        print(" [PASS] Login succeeded for fresh password (<45 days).")

        # Cleanup
        await db.execute(delete(PasswordHistory).where(PasswordHistory.user_id == user.id))
        await db.execute(delete(LoginHistory).where(LoginHistory.user_id == user.id))
        await db.delete(user)
        await db.commit()

    print("\n==================================================")
    print("  ALL 6 PASSWORD POLICY RULES VERIFIED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
