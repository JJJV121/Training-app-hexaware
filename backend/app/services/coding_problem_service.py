from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.coding_problem import CodingProblem


async def create_problem(
    db: AsyncSession,
    data
):
    problem = CodingProblem(
        title=data.title,
        description=data.description,
        difficulty=data.difficulty,
        language=data.language,
        starter_code=data.starter_code,
        sample_input=data.sample_input,
        sample_output=data.sample_output,
        constraints=data.constraints,
        created_by=data.created_by
    )

    db.add(problem)

    await db.commit()

    await db.refresh(problem)

    return problem

async def get_problem(
    db: AsyncSession,
    problem_id: int
):
    problem = await db.scalar(
        select(CodingProblem)
        .where(
            CodingProblem.id == problem_id
        )
    )

    if not problem:
        raise ValueError(
            "Problem not found"
        )

    return problem


async def get_all_problems(
    db: AsyncSession
):
    result = await db.scalars(
        select(CodingProblem)
    )

    return result.all()


async def update_problem(
    db: AsyncSession,
    problem_id: int,
    data
):
    problem = await db.scalar(
        select(CodingProblem)
        .where(
            CodingProblem.id == problem_id
        )
    )

    if not problem:
        raise ValueError(
            "Problem not found"
        )

    for key, value in data.model_dump(
        exclude_unset=True
    ).items():

        setattr(
            problem,
            key,
            value
        )

    await db.commit()

    await db.refresh(problem)

    return problem


async def delete_problem(
    db: AsyncSession,
    problem_id: int
):
    problem = await db.scalar(
        select(CodingProblem)
        .where(
            CodingProblem.id == problem_id
        )
    )

    if not problem:
        raise ValueError(
            "Problem not found"
        )

    await db.delete(problem)

    await db.commit()

    return {
        "message":
        "Problem deleted successfully"
    }