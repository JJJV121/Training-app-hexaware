from app.core.config import settings

from .judge0_runner import execute_judge0
from .python_runner import execute_python
from .java_runner import execute_java
#from .c_runner import execute_c


def execute(
    language,
    source_code,
    stdin=""
):

    runner = settings.CODE_RUNNER.lower()

    # -------------------------
    # JUDGE0
    # -------------------------
    print("===== CODE RUNNER =====")
    print("Runner:", runner)
    print("=======================")
    
    if runner == "judge0":

        return execute_judge0(
            language,
            source_code,
            stdin
        )

    # -------------------------
    # LOCAL DOCKER
    # -------------------------

    elif runner == "docker":

        language = language.lower()

        if language == "python":
            return execute_python(
                source_code,
                stdin
            )

        elif language == "java":
            return execute_java(
                source_code,
                stdin
            )

        elif language == "c":
            #return execute_c(source_code,stdin)
            pass

        else:
            return {
                "stdout": "",
                "stderr":
                    f"Unsupported language: {language}",
                "exit_code": -1,
                "time": 0,
                "memory": None
            }

    # -------------------------
    # INVALID CONFIG
    # -------------------------

    else:

        return {
            "stdout": "",
            "stderr":
                f"Invalid CODE_RUNNER: {runner}",
            "exit_code": -1,
            "time": 0,
            "memory": None
        }