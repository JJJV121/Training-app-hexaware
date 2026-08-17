from fastapi_mail import MessageSchema
from app.core.mail import fastmail


async def send_activation_email(email: str, link: str):

    message = MessageSchema(
        subject="Activate Your Account",
        recipients=[email],
        body=f"Click here to activate: {link}",
        subtype="plain"
    )

    await fastmail.send_message(message)


async def send_reset_email(email: str, link: str):

    message = MessageSchema(
        subject="Reset Your Password",
        recipients=[email],
        body=f"Click here to reset: {link}",
        subtype="plain"
    )

    await fastmail.send_message(message)


async def send_student_welcome_email(email: str, name: str, course_names: list[str] = None):
    courses_str = ", ".join(course_names) if course_names else "your assigned courses"
    message = MessageSchema(
        subject="Welcome to Training Portal - Account Created",
        recipients=[email],
        body=f"Hello {name},\n\nYour student account has been successfully created. You are enrolled in: {courses_str}.\n\nPlease log in using your registered email and password.\n\nBest regards,\nTraining Team",
        subtype="plain"
    )
    try:
        await fastmail.send_message(message)
        print(f"Welcome email successfully sent to {email}")
    except Exception as e:
        print(f"Email sending notice (non-blocking error): {e}")