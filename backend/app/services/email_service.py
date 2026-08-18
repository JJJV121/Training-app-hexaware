from fastapi_mail import MessageSchema
from app.core.mail import fastmail


async def send_activation_email(email: str, link: str, name: str | None = None):
    display_name = name or "there"
    html_body = f"""
    <html>
      <body style="margin: 0; padding: 24px; background-color: #f4f7fb; font-family: Arial, sans-serif; color: #0f172a;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 32px;">
          <h2 style="margin: 0 0 16px; color: #0f172a;">Activate your account</h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">Hi {display_name},</p>
          <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6;">Your trainee account has been created and is ready to activate.</p>
          <div style="margin: 0 0 24px; text-align: center;">
            <a href="{link}" style="display: inline-block; background-color: #0061fe; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 16px;">Click here to activate your account</a>
          </div>
          <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6; color: #475569;">If the button does not work, use this link:</p>
          <p style="margin: 0; word-break: break-all; font-size: 13px; color: #1e293b;">{link}</p>
        </div>
      </body>
    </html>
    """

    message = MessageSchema(
        subject="Activate Your Account",
        recipients=[email],
        body=html_body,
        subtype="html"
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
