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


# --------------------------------------------------
# Attendance & Follow-up Automation Emails
# --------------------------------------------------

async def send_attendance_reminder_1_email(
    email: str,
    name: str,
    batch_name: str,
    course_name: str,
) -> bool:
    """EMAIL 1: Day 1 - First Reminder"""
    display_name = name or "Trainee"
    html_body = f"""
    <html>
      <body style="margin: 0; padding: 24px; background-color: #f4f7fb; font-family: Arial, sans-serif; color: #0f172a;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px;">
          <h2 style="margin: 0 0 16px; color: #1e3a8a;">Training Attendance Reminder</h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">Dear {display_name},</p>
          <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">
            We noticed that you were absent for today's scheduled training session in <strong>{course_name}</strong> ({batch_name}).
          </p>
          <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
            Please ensure you join all upcoming scheduled sessions promptly. Continued absence will lead to further follow-up actions according to our training policy.
          </p>
          <div style="padding: 16px; background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 4px; font-size: 14px; color: #1e40af;">
            If you are experiencing technical difficulties or have a valid constraint, please reach out to your Batch SPOC.
          </div>
          <p style="margin: 24px 0 0; font-size: 14px; color: #64748b;">Best regards,<br/>Hexaware Training Team</p>
        </div>
      </body>
    </html>
    """
    message = MessageSchema(
        subject="Training Attendance Reminder – Please Join the Session",
        recipients=[email],
        body=html_body,
        subtype="html"
    )
    try:
        await fastmail.send_message(message)
        print(f"Reminder 1 email sent to {email}")
        return True
    except Exception as e:
        print(f"Failed to send Reminder 1 email to {email}: {e}")
        return False


async def send_attendance_reminder_2_email(
    email: str,
    name: str,
    batch_name: str,
    course_name: str,
) -> bool:
    """EMAIL 2: Day 2 - Second Reminder"""
    display_name = name or "Trainee"
    html_body = f"""
    <html>
      <body style="margin: 0; padding: 24px; background-color: #f4f7fb; font-family: Arial, sans-serif; color: #0f172a;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #fed7aa; border-radius: 12px; padding: 32px;">
          <h2 style="margin: 0 0 16px; color: #c2410c;">Training Attendance Follow-up</h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">Dear {display_name},</p>
          <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">
            This is an urgent follow-up regarding your attendance in <strong>{course_name}</strong> ({batch_name}). You have now missed <strong>2 consecutive scheduled training sessions</strong>.
          </p>
          <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
            Regular participation is mandatory. Continued absence without formal approval will escalate your case further.
          </p>
          <div style="padding: 16px; background-color: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px; font-size: 14px; color: #9a3412;">
            <strong>Immediate Attention Required:</strong> Please attend the next session to prevent further escalation.
          </div>
          <p style="margin: 24px 0 0; font-size: 14px; color: #64748b;">Best regards,<br/>Hexaware Training Team</p>
        </div>
      </body>
    </html>
    """
    message = MessageSchema(
        subject="Training Attendance Follow-up – Immediate Attention Required",
        recipients=[email],
        body=html_body,
        subtype="html"
    )
    try:
        await fastmail.send_message(message)
        print(f"Reminder 2 email sent to {email}")
        return True
    except Exception as e:
        print(f"Failed to send Reminder 2 email to {email}: {e}")
        return False


async def send_attendance_warning_email(
    email: str,
    name: str,
    batch_name: str,
    course_name: str,
    submission_link: str,
) -> bool:
    """EMAIL 3: Day 3 - Warning & Reason Submission Link"""
    display_name = name or "Trainee"
    html_body = f"""
    <html>
      <body style="margin: 0; padding: 24px; background-color: #f4f7fb; font-family: Arial, sans-serif; color: #0f172a;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #fca5a5; border-radius: 12px; padding: 32px;">
          <h2 style="margin: 0 0 16px; color: #dc2626;">Training Attendance Warning</h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">Dear {display_name},</p>
          <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">
            You have been marked absent for <strong>3 consecutive training sessions</strong> in <strong>{course_name}</strong> ({batch_name}).
          </p>
          <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;">
            According to the Hexaware Training Policy, continued non-response or unapproved absences may result in <strong>discontinuation from the training program</strong> and revocation of your Letter of Intent (LOI).
          </p>
          <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #1e293b;">
            You must submit a valid reason and supporting documentation through the portal immediately.
          </p>
          <div style="margin: 0 0 28px; text-align: center;">
            <a href="{submission_link}" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 16px;">Submit Absence Reason</a>
          </div>
          <p style="margin: 0; font-size: 13px; color: #64748b; word-break: break-all;">Portal Link: {submission_link}</p>
          <p style="margin: 24px 0 0; font-size: 14px; color: #64748b;">Best regards,<br/>Hexaware Training Operations</p>
        </div>
      </body>
    </html>
    """
    message = MessageSchema(
        subject="Training Attendance Warning – Action Required",
        recipients=[email],
        body=html_body,
        subtype="html"
    )
    try:
        await fastmail.send_message(message)
        print(f"Warning email sent to {email}")
        return True
    except Exception as e:
        print(f"Failed to send Warning email to {email}: {e}")
        return False


async def send_discontinuation_email(
    email: str,
    name: str,
    batch_name: str,
    course_name: str,
    reason: str | None = None,
) -> bool:
    """EMAIL 4: Day 5 - Discontinuation Email"""
    display_name = name or "Trainee"
    reason_str = reason or "continued unexcused absences (5 consecutive sessions) without approved justification"
    html_body = f"""
    <html>
      <body style="margin: 0; padding: 24px; background-color: #f4f7fb; font-family: Arial, sans-serif; color: #0f172a;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #991b1b; border-radius: 12px; padding: 32px;">
          <h2 style="margin: 0 0 16px; color: #991b1b;">Training Program Discontinuation Notice</h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">Dear {display_name},</p>
          <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">
            This email is to formally inform you that you have been <strong>discontinued</strong> from the training program for <strong>{course_name}</strong> ({batch_name}).
          </p>
          <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #7f1d1d;">
            <strong>Reason:</strong> {reason_str}.
          </p>
          <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
            This case has been referred to the Campus Recruitment Team for further formal administrative action.
          </p>
          <p style="margin: 24px 0 0; font-size: 14px; color: #64748b;">Best regards,<br/>Hexaware Training & HR Operations</p>
        </div>
      </body>
    </html>
    """
    message = MessageSchema(
        subject="Training Program Discontinuation",
        recipients=[email],
        body=html_body,
        subtype="html"
    )
    try:
        await fastmail.send_message(message)
        print(f"Discontinuation email sent to {email}")
        return True
    except Exception as e:
        print(f"Failed to send Discontinuation email to {email}: {e}")
        return False


async def send_cr_notification_email(
    cr_email: str,
    info: dict,
) -> bool:
    """EMAIL 5: Day 5 - Campus Recruitment Notification"""
    html_body = f"""
    <html>
      <body style="margin: 0; padding: 24px; background-color: #f4f7fb; font-family: Arial, sans-serif; color: #0f172a;">
        <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 32px;">
          <h2 style="margin: 0 0 16px; color: #991b1b;">Candidate Discontinued – Action Required</h2>
          <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">
            Dear Campus Recruitment Team,
          </p>
          <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6;">
            The following candidate has reached 5 consecutive unexcused session absences and has been discontinued from the training program:
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; width: 40%;">Candidate Name</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{info.get('candidate_name')}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Candidate ID (Employee ID)</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{info.get('employee_id')}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Email</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{info.get('candidate_email')}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Batch</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{info.get('batch_name')}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Course</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{info.get('course_name')}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Consecutive Absences</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{info.get('absence_count')}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Absence Dates</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{info.get('absence_dates')}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Discontinuation Date</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{info.get('discontinued_at')}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Response Status</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{info.get('response_status')}</td></tr>
          </table>
          <div style="padding: 16px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px; font-size: 14px; color: #991b1b;">
            <strong>Requested Action for CR Team:</strong><br/>
            1. Revoke the candidate's LOI.<br/>
            2. Contact the candidate directly for further follow-up.<br/>
            3. Complete required formal closure process in CR systems.
          </div>
          <p style="margin: 24px 0 0; font-size: 14px; color: #64748b;">Best regards,<br/>Hexaware Training Operations Automation System</p>
        </div>
      </body>
    </html>
    """
    message = MessageSchema(
        subject="Candidate Discontinued – LOI Revocation & Follow-up Required",
        recipients=[cr_email],
        body=html_body,
        subtype="html"
    )
    try:
        await fastmail.send_message(message)
        print(f"CR Notification email sent to {cr_email}")
        return True
    except Exception as e:
        print(f"Failed to send CR Notification email to {cr_email}: {e}")
        return False

