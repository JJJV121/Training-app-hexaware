import asyncio
from pathlib import Path

from sqlalchemy import select

from app.database.session import AsyncSessionLocal
from app.models.content import Content
from app.models.learning_unit import LearningUnit


UNIT_MAP = {
    "introduction_to_databases": ("Introduction to Databases", 1),
    "normalization": ("Normalization", 1),
    "managing_databases": ("Managing Databases", 1),
    "managing_tables": ("Managing Tables", 1),
    "manipulating_data_dml": ("Manipulating Data Using DML Statements", 1),
    "manipulating_data_dml_day4": ("Manipulating Data Using DML Statements", 2),
    "querying_data_using_joins": ("Querying Data Using Joins", 1),
    "querying_data_using_joins_day5": ("Querying Data Using Joins", 2),
    "querying_data_by_subqueries": ("Querying Data Using Subqueries", 1),
    "querying_data_by_subqueries_contd": ("Correlated Subqueries", 1),
    "array_unit": ("Arrays", 1),
    "oop_unit": ("Object Oriented Programming", 1),
    "interface_abstract_classes_unit": ("Interfaces and Abstract Classes", 1),
    "interface_string_api_unit": ("Interface and String API", 1),
    "collections_unit": ("Collections Framework", 1),
    "collections_unit_2": ("Collections Framework", 1),
    "exception_handling_unit": ("Exception Handling", 1),
    "stream_api_unit": ("Stream API", 1),
    "threads_unit": ("Threads", 1),
    "jdbc_best_practices_unit": ("JDBC and Best Practices", 1),
    "testing_fundamentals_unit": ("Testing Fundamentals", 1),
    "junit_unit": ("JUnit", 1),
    "introduction_to_version_control_unit": ("Introduction to Version Control", 1),
    "git_terminology_unit": ("Git Terminology", 1),
    "getting_started_with_git_part1_unit": ("Getting Started with Git", 1),
    "getting_started_with_git_part2_unit": ("Working with Git", 1),
    "working_with_git_unit": ("Working with Git", 1),
}


async def main():
    script_path = Path(__file__).with_name("seed _data_rem.py")
    if not script_path.exists():
        raise FileNotFoundError(f"Missing seed payload file: {script_path}")

    source = script_path.read_text(encoding="utf-8")
    source = source.replace("db.commit()", "await db.commit()")
    source = source.replace("db.refresh(", "await db.refresh(")

    async with AsyncSessionLocal() as db:
        async def resolve_unit(title: str, occurrence: int = 1) -> LearningUnit:
            result = await db.execute(
                select(LearningUnit)
                .where(LearningUnit.title == title)
                .order_by(LearningUnit.id)
            )
            units = result.scalars().all()
            if not units:
                raise ValueError(f"Learning unit not found: {title}")
            if occurrence > len(units):
                raise ValueError(f"Learning unit occurrence not found for {title}: {occurrence}")
            return units[occurrence - 1]

        namespace = {
            "__name__": "__main__",
            "db": db,
            "Content": Content,
        }

        for var_name, (title, occurrence) in UNIT_MAP.items():
            namespace[var_name] = await resolve_unit(title, occurrence)

        wrapped_source = "async def _run_seed():\n" + "\n".join(
            "    " + line if line else "" for line in source.splitlines()
        ) + "\n"
        exec(compile(wrapped_source, str(script_path), "exec"), namespace)
        await namespace["_run_seed"]()

        print("Remaining content seeded successfully")


if __name__ == "__main__":
    asyncio.run(main())
