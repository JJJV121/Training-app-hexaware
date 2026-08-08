import subprocess
import time


def run_docker(image, folder, command, stdin=""):

    start = time.perf_counter()

    try:
        process = subprocess.run(
            [
                "docker",
                "run",
                "--rm",
                "-i",

                "--network", "none",
                "--memory", "256m",
                "--cpus", "1",
                "--pids-limit", "50",

                "-v", f"{folder}:/code",

                image,
                *command
            ],
            input=stdin,
            text=True,
            capture_output=True,
            timeout=5
        )

        end = time.perf_counter()

        stderr = process.stderr or ""

        # Docker itself is unavailable
        docker_errors = [
            "failed to connect to the docker API",
            "dockerDesktopLinuxEngine",
            "Cannot connect to the Docker daemon",
            "The system cannot find the file specified"
        ]

        if any(error in stderr for error in docker_errors):
            return {
                "stdout": "",
                "stderr": "",
                "exit_code": -1,
                "time": round(end - start, 3),
                "memory": None,
                "service_error": True,
                "service_error_message":
                    "Docker execution service is unavailable."
            }

        return {
            "stdout": process.stdout,
            "stderr": stderr,
            "exit_code": process.returncode,
            "time": round(end - start, 3),
            "memory": None,
            "service_error": False
        }

    except subprocess.TimeoutExpired:

        return {
            "stdout": "",
            "stderr": "Time Limit Exceeded",
            "exit_code": -1,
            "time": 5,
            "memory": None,
            "service_error": False,
            "timed_out": True
        }

    except FileNotFoundError:

        # Docker isn't even installed
        return {
            "stdout": "",
            "stderr": "",
            "exit_code": -1,
            "time": 0,
            "memory": None,
            "service_error": True,
            "service_error_message":
                "Docker execution service is unavailable."
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
                "Code execution service is unavailable."
        }