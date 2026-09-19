import io
import zipfile


def generate_single_trainee_pdf(card: dict) -> bytes:
    p_info = card["personal_info"]
    perf = card["performance_metrics"]
    attn = card["attendance"]
    tr_fb = card.get("trainer_feedback", {})
    te_fb = card.get("trainee_feedback", {})

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Trainee Performance Report Card - {p_info.get('superset_id')}</title>
        <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 20px; color: #1e293b; background: #fff; }}
            .header {{ text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }}
            .header h1 {{ margin: 0; color: #1e3a8a; font-size: 22px; text-transform: uppercase; }}
            .header p {{ margin: 4px 0 0 0; color: #64748b; font-size: 13px; font-weight: bold; }}
            .section-title {{ font-size: 14px; font-weight: bold; background: #eff6ff; color: #1e40af; padding: 8px 12px; border-left: 4px solid #2563eb; margin-top: 20px; margin-bottom: 10px; text-transform: uppercase; }}
            table {{ width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }}
            th, td {{ border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }}
            th {{ background: #f8fafc; font-weight: bold; color: #334155; }}
            .grid-table td {{ width: 25%; }}
            .highlight {{ background: #f0fdf4; font-weight: bold; color: #166534; }}
            .badge {{ display: inline-block; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }}
            .badge-success {{ background: #dcfce7; color: #15803d; }}
            .badge-warning {{ background: #fef3c7; color: #b45309; }}
            .rating-star {{ color: #f59e0b; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Foundation Training Performance Report Card</h1>
            <p>Hexaware Training Management System | Course: {p_info.get('foundation_language')}</p>
        </div>

        <div class="section-title">Personal & Training Information</div>
        <table class="grid-table">
            <tr>
                <th>Superset ID</th>
                <td>{p_info.get('superset_id')}</td>
                <th>Trainee Name</th>
                <td><strong>{p_info.get('name')}</strong></td>
            </tr>
            <tr>
                <th>Registered Email</th>
                <td>{p_info.get('registered_mail_id')}</td>
                <th>College Name</th>
                <td>{p_info.get('college')}</td>
            </tr>
            <tr>
                <th>Batch Name</th>
                <td>{p_info.get('batch_no')}</td>
                <th>Foundation Language</th>
                <td>{p_info.get('foundation_language')}</td>
            </tr>
            <tr>
                <th>Trainer Name</th>
                <td>{p_info.get('trainer_name')}</td>
                <th>SPOC Name</th>
                <td>{p_info.get('spoc_name')}</td>
            </tr>
            <tr>
                <th>Training Dates</th>
                <td>{p_info.get('training_start_date')} to {p_info.get('training_end_date')}</td>
                <th>Training Status</th>
                <td><span class="badge badge-success">{p_info.get('training_status')}</span></td>
            </tr>
        </table>

        <div class="section-title">Performance Metrics Breakdown</div>
        <table>
            <thead>
                <tr>
                    <th>Module Category</th>
                    <th style="text-align: center;">Attempt 1 (A-1)</th>
                    <th style="text-align: center;">Attempt 2 (A-2)</th>
                    <th>Status / Remarks</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>SQL MCQ Assessment</td>
                    <td style="text-align: center;">{perf['sql_mcq']['a1']}</td>
                    <td style="text-align: center;">{perf['sql_mcq']['a2']}</td>
                    <td>Cleared</td>
                </tr>
                <tr>
                    <td>Language MCQ Assessment</td>
                    <td style="text-align: center;">{perf['language_mcq']['a1']}</td>
                    <td style="text-align: center;">{perf['language_mcq']['a2']}</td>
                    <td>Cleared</td>
                </tr>
                <tr>
                    <td>Cloud MCQ Assessment</td>
                    <td style="text-align: center;">{perf['cloud_mcq']['a1']}</td>
                    <td style="text-align: center;">{perf['cloud_mcq']['a2']}</td>
                    <td>Cleared</td>
                </tr>
                <tr>
                    <td>SQL Coding Challenge</td>
                    <td style="text-align: center;">{perf['sql_coding']['a1']}</td>
                    <td style="text-align: center;">{perf['sql_coding']['a2']}</td>
                    <td>Evaluated</td>
                </tr>
                <tr>
                    <td>Language Coding Challenge</td>
                    <td style="text-align: center;">{perf['language_coding']['a1']}</td>
                    <td style="text-align: center;">{perf['language_coding']['a2']}</td>
                    <td>Evaluated</td>
                </tr>
                <tr>
                    <td>Capstone Project Score</td>
                    <td style="text-align: center;">{perf['project_score']['a1']}</td>
                    <td style="text-align: center;">{perf['project_score']['a2']}</td>
                    <td>Evaluated</td>
                </tr>
                <tr>
                    <td>Online Coding Score</td>
                    <td style="text-align: center;">{perf['online_coding_score']['a1']}</td>
                    <td style="text-align: center;">{perf['online_coding_score']['a2']}</td>
                    <td>Evaluated</td>
                </tr>
            </tbody>
        </table>

        <div class="section-title">Attendance & Ranking Summary</div>
        <table class="grid-table">
            <tr>
                <th>Total Training Days</th>
                <td>{attn.get('total_no_of_days')} Days</td>
                <th>Total Present Days</th>
                <td>{attn.get('total_present_days')} Days</td>
            </tr>
            <tr>
                <th>Absences</th>
                <td>{attn.get('absences')} Days</td>
                <th>Attendance Percentage</th>
                <td class="highlight">{attn.get('percentage')}</td>
            </tr>
            <tr>
                <th>Batch Ranking</th>
                <td class="highlight">{perf.get('ranking_details')}</td>
                <th>Performance Tier / Comment</th>
                <td>{perf.get('comment_reason')}</td>
            </tr>
        </table>

        <div class="section-title">Trainer Qualitative Evaluation</div>
        <table>
            <tr>
                <th style="width: 25%;">Technical Skills</th>
                <td><span class="rating-star">★ {tr_fb.get('technical_skills_rating', 5)} / 5</span></td>
                <th style="width: 25%;">Problem Solving</th>
                <td><span class="rating-star">★ {tr_fb.get('problem_solving_rating', 5)} / 5</span></td>
            </tr>
            <tr>
                <th>Communication</th>
                <td><span class="rating-star">★ {tr_fb.get('communication_rating', 5)} / 5</span></td>
                <th>Learning Attitude</th>
                <td><span class="rating-star">★ {tr_fb.get('learning_attitude_rating', 5)} / 5</span></td>
            </tr>
            <tr>
                <th>Participation</th>
                <td><span class="rating-star">★ {tr_fb.get('participation_rating', 5)} / 5</span></td>
                <th>Overall Assessment</th>
                <td><span class="rating-star">★ {tr_fb.get('overall_rating', 5)} / 5</span></td>
            </tr>
            <tr>
                <th>Strengths</th>
                <td colspan="3">{tr_fb.get('strengths', 'N/A')}</td>
            </tr>
            <tr>
                <th>Areas for Improvement</th>
                <td colspan="3">{tr_fb.get('areas_for_improvement', 'N/A')}</td>
            </tr>
        </table>

        <div class="section-title">Trainee Feedback Overview</div>
        <table>
            <tr>
                <th style="width: 25%;">Video Content</th>
                <td>★ {te_fb.get('video_rating', 5)} / 5</td>
                <th style="width: 25%;">Practice Questions</th>
                <td>★ {te_fb.get('practice_rating', 5)} / 5</td>
            </tr>
            <tr>
                <th>Coding Challenges</th>
                <td>★ {te_fb.get('coding_rating', 5)} / 5</td>
                <th>Trainer Support</th>
                <td>★ {te_fb.get('trainer_support_rating', 5)} / 5</td>
            </tr>
            <tr>
                <th>Overall Training</th>
                <td colspan="3">★ {te_fb.get('overall_rating', 5)} / 5 - <em>"{te_fb.get('liked_comment', 'Great training experience')}"</em></td>
            </tr>
        </table>

        <div style="margin-top: 30px; text-align: right; color: #94a3b8; font-size: 10px;">
            Generated by Hexaware LMS Engine | Date: 2026-09-19
        </div>
    </body>
    </html>
    """

    return html_content.encode("utf-8")


def generate_batch_pdf_zip(cards: list[dict], excel_bytes: bytes | None = None) -> bytes:
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        if excel_bytes:
            zf.writestr("Batch_Performance_Summary.xlsx", excel_bytes)

        for card in cards:
            p_info = card["personal_info"]
            superset_id = p_info.get("superset_id", "HX000")
            pdf_bytes = generate_single_trainee_pdf(card)
            zf.writestr(f"Performance_Report_{superset_id}.html", pdf_bytes)

    zip_buffer.seek(0)
    return zip_buffer.read()
