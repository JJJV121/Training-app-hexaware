import os
import shutil
import tempfile

from .docker_utils import run_docker


def execute_java(source_code, stdin=""):

    folder = tempfile.mkdtemp()

    try:
        file_path = os.path.join(folder, "Main.java")

        with open(file_path, "w", encoding="utf8") as f:
            f.write(source_code)

        # Compile
        compile_result = run_docker(
            image="student-java-runner",
            folder=folder,
            command=["javac", "/code/Main.java"]
        )

        if compile_result["exit_code"] != 0:
            return compile_result

        # Execute
        return run_docker(
            image="student-java-runner",
            folder=folder,
            command=["java", "-cp", "/code", "Main"],
            stdin=stdin
        )

    finally:
        shutil.rmtree(folder)