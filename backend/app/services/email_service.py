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
    