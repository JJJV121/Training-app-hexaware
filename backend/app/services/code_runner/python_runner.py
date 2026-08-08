import os
import shutil
import tempfile

from .docker_utils import run_docker


def execute_python(
    source_code,
    stdin=""
):

    folder = tempfile.mkdtemp()

    try:

        file_path = os.path.join(
            folder,
            "Main.py"
        )

        with open(
            file_path,
            "w",
            encoding="utf8"
        ) as f:
            f.write(source_code)

        result = run_docker(
            image="student-python-runner",
            folder=folder,
            command=[
                "python3",
                "/code/Main.py"
            ],
            stdin=stdin
        )

        return result

    finally:

        shutil.rmtree(folder)