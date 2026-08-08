import asyncio
import pandas as pd

from sqlalchemy.exc import SQLAlchemyError

from app.database.session import AsyncSessionLocal
from app.models.mcq_models import MCQQuestion


async def import_excel():

    # Read Excel
    df = pd.read_excel("app/scripts/mcq_questions.xlsx")

    print(f"Total Questions in Excel: {len(df)}")

    async with AsyncSessionLocal() as db:

        questions = []

        for index, row in df.iterrows():

            try:

                question = MCQQuestion(

                    question_text=str(row["question_text"]).strip(),

                    option_a=str(row["option_a"]).strip(),

                    option_b=str(row["option_b"]).strip(),

                    option_c=str(row["option_c"]).strip(),

                    option_d=str(row["option_d"]).strip(),

                    correct_option=str(
                        row["correct_option"]
                    ).strip().upper(),

                    topic=str(row["topic"]).strip(),

                    difficulty=str(
                        row["difficulty"]
                    ).strip(),

                    marks=int(row["marks"]),

                    created_by=2,

                    is_active=True

                )

                questions.append(question)

            except Exception as e:

                print("\n------------------------------------")
                print(f"Error in Excel Row : {index + 2}")
                print(row)
                print(e)
                print("------------------------------------\n")

                return

        try:

            db.add_all(questions)

            await db.commit()

            print(
                f"\n✅ Successfully Imported {len(questions)} Questions"
            )

        except SQLAlchemyError as e:

            await db.rollback()

            print("\n❌ Database Error")
            print(e)


if __name__ == "__main__":
    asyncio.run(import_excel())