import time
import requests

from app.core.config import settings


LANGUAGE_MAP = {
    "python": 71,
    "java": 62,
    "c": 50
}


def execute_judge0(language, source_code, stdin=""):

    language = language.lower()

    language_id = LANGUAGE_MAP.get(language)

    if not language_id:
        return {
            "stdout": "",
            "stderr": "",
            "exit_code": -1,
            "time": 0,
            "memory": None,
            "service_error": True,
            "service_error_message": "Unsupported programming language."
        }

    submit_url = (
        f"{settings.JUDGE0_URL}/submissions"
        "?base64_encoded=false&wait=false"
    )

    # Try submission up to 3 times
    response = None

    for attempt in range(3):

        try:
            response = requests.post(
                submit_url,
                json={
                    "source_code": source_code,
                    "language_id": language_id,
                    "stdin": stdin
                },
                timeout=15
            )

            response.raise_for_status()
            break

        except requests.RequestException:

            if attempt == 2:
                return {
                    "stdout": "",
                    "stderr": "",
                    "exit_code": -1,
                    "time": 0,
                    "memory": None,
                    "service_error": True,
                    "service_error_message":
                        "Code execution service is temporarily unavailable."
                }

            time.sleep(1)

    try:
        token = response.json()["token"]

        result_url = (
            f"{settings.JUDGE0_URL}/submissions/{token}"
            "?base64_encoded=false"
        )

        # Poll result
        for _ in range(30):

            try:
                result_response = requests.get(
                    result_url,
                    timeout=15
                )

                result_response.raise_for_status()

            except requests.RequestException:

                time.sleep(0.5)
                continue

            result = result_response.json()

            status_id = result.get(
                "status",
                {}
            ).get("id")

            # 1 = In Queue
            # 2 = Processing
            if status_id not in [1, 2]:
                break

            time.sleep(0.3)

        else:
            return {
                "stdout": "",
                "stderr": "",
                "exit_code": -1,
                "time": 0,
                "memory": None,
                "service_error": True,
                "service_error_message":
                    "Code execution service timed out."
            }

        error = (
            result.get("compile_output")
            or result.get("stderr")
            or result.get("message")
            or ""
        )

        return {
            "stdout": result.get("stdout") or "",
            "stderr": error,
            "exit_code": 0 if status_id == 3 else status_id,
            "time": float(result.get("time") or 0),
            "memory": result.get("memory"),
            "service_error": False,
            "judge_status_id": status_id
        }

    except Exception:

        return {
            "stdout": "",
            "stderr": "",
            "exit_code": -1,
            "time": 0,
            "memory": None,
            "service_error": True,
            "service_error_message":
                "Code execution service is temporarily unavailable."
        }