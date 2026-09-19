import io
import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter


def generate_single_trainee_excel(card_data: dict) -> bytes:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Report Card"

    _build_report_card_sheet(ws, [card_data])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output.read()


def generate_batch_excel(cards_data: list[dict], batch_name: str = "Batch Reports") -> bytes:
    wb = openpyxl.Workbook()
    ws_summary = wb.active
    ws_summary.title = "Summary"

    _build_report_card_sheet(ws_summary, cards_data)

    # Add individual tabs for each trainee
    for card in cards_data:
        p_info = card["personal_info"]
        name_clean = (p_info.get("name") or "Trainee")[:25].replace(":", "").replace("/", "")
        sheet_title = f"{p_info.get('superset_id')}_{name_clean}"[:30]
        ws_ind = wb.create_sheet(title=sheet_title)
        _build_report_card_sheet(ws_ind, [card])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output.read()


def _build_report_card_sheet(ws, cards: list[dict]):
    ws.views.sheetView[0].showGridLines = True

    # Styling fills and fonts
    title_font = Font(name="Arial", size=16, bold=True, color="000000")
    section_font = Font(name="Arial", size=11, bold=True, color="000000")
    header_font = Font(name="Arial", size=10, bold=True, color="000000")
    sub_font = Font(name="Arial", size=9, bold=True, color="000000")
    data_font = Font(name="Arial", size=9, color="000000")

    pink_fill = PatternFill(start_color="F8C471", end_color="F8C471", fill_type="solid") # Personal Info
    green_fill = PatternFill(start_color="ABEBC6", end_color="ABEBC6", fill_type="solid") # Performance Metrics
    orange_fill = PatternFill(start_color="F5B7B1", end_color="F5B7B1", fill_type="solid") # Attendance

    thin_border = Border(
        left=Side(style="thin", color="D3D3D3"),
        right=Side(style="thin", color="D3D3D3"),
        top=Side(style="thin", color="D3D3D3"),
        bottom=Side(style="thin", color="D3D3D3"),
    )

    # 1. Main Title Header (Row 1)
    ws.merge_cells("A1:AD1")
    title_cell = ws["A1"]
    title_cell.value = "Foundation Training - C Sharp / Java / Python"
    title_cell.font = title_font
    title_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 30

    # 2. Section Category Header (Row 2)
    ws.merge_cells("A2:L2")
    ws["A2"] = "Personal & Training Info"
    ws["A2"].fill = pink_fill
    ws["A2"].font = section_font
    ws["A2"].alignment = Alignment(horizontal="center", vertical="center")

    ws.merge_cells("M2:Z2")
    ws["M2"] = "Performance Metrics"
    ws["M2"].fill = green_fill
    ws["M2"].font = section_font
    ws["M2"].alignment = Alignment(horizontal="center", vertical="center")

    ws.merge_cells("AA2:AD2")
    ws["AA2"] = "Attendance"
    ws["AA2"].fill = orange_fill
    ws["AA2"].font = section_font
    ws["AA2"].alignment = Alignment(horizontal="center", vertical="center")

    ws.row_dimensions[2].height = 24

    # 3. Main Column Headers (Row 3) & Sub-headers (Row 4)
    headers_row3 = [
        # Personal Info (A-L)
        "S.No", "Superset ID", "Name", "Registered Mail ID", "College",
        "Foundation Language", "Training Start date", "Training End date",
        "Trainer Name", "Batch No", "SPOC Name", "Training Status",
        # Performance Metrics (M-Z)
        "SQL MCQ", "", "Language MCQ", "", "Cloud MCQ", "",
        "SQL Coding", "", "Language Coding", "", "Project Score", "",
        "Online Coding Score", "", "Final Status", "Ranking Details", "Comment / Reason",
        # Attendance (AA-AD)
        "Total No of days", "Total Present days", "Absences", "Percentage"
    ]

    for col_idx, header in enumerate(headers_row3, start=1):
        cell = ws.cell(row=3, column=col_idx, value=header)
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    # 4. Sub-Headers (Row 4) for MCQ & Coding (A-1 / A-2)
    sub_headers = {
        13: "A-1", 14: "A-2", 15: "A-1", 16: "A-2", 17: "A-1", 18: "A-2",
        19: "A-1", 20: "A-2", 21: "A-1", 22: "A-2", 23: "A-1", 24: "A-2",
        25: "A-1", 26: "A-2"
    }
    for col_idx, sub_label in sub_headers.items():
        cell = ws.cell(row=4, column=col_idx, value=sub_label)
        cell.font = sub_font
        cell.alignment = Alignment(horizontal="center", vertical="center")

    # Perform Row 3 merged pairs for MCQ/Coding subheaders AFTER writing values
    merge_pairs_row3 = [
        ("M3", "N3"), ("O3", "P3"), ("Q3", "R3"),
        ("S3", "T3"), ("U3", "V3"), ("W3", "X3"), ("Y3", "Z3")
    ]
    for start_col, end_col in merge_pairs_row3:
        ws.merge_cells(f"{start_col}:{end_col}")

    # Vertical merge for non-subdivided headers in Row 3 to Row 4
    single_header_cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 27, 28, 29, 30, 31, 32, 33, 34] # A-L, Final Status, Ranking, Comment, Attendance
    for col_idx in range(1, 35):
        if col_idx not in sub_headers:
            col_let = get_column_letter(col_idx)
            ws.merge_cells(f"{col_let}3:{col_let}4")

    ws.row_dimensions[3].height = 22
    ws.row_dimensions[4].height = 18

    # 5. Populate Data Rows starting at Row 5
    current_row = 5
    for c_idx, card in enumerate(cards, start=1):
        p_info = card["personal_info"]
        perf = card["performance_metrics"]
        attn = card["attendance"]

        row_vals = [
            # A - L
            c_idx,
            p_info.get("superset_id", ""),
            p_info.get("name", ""),
            p_info.get("registered_mail_id", ""),
            p_info.get("college", ""),
            p_info.get("foundation_language", ""),
            p_info.get("training_start_date", ""),
            p_info.get("training_end_date", ""),
            p_info.get("trainer_name", ""),
            p_info.get("batch_no", ""),
            p_info.get("spoc_name", ""),
            p_info.get("training_status", ""),
            # M - Z
            perf["sql_mcq"]["a1"], perf["sql_mcq"]["a2"],
            perf["language_mcq"]["a1"], perf["language_mcq"]["a2"],
            perf["cloud_mcq"]["a1"], perf["cloud_mcq"]["a2"],
            perf["sql_coding"]["a1"], perf["sql_coding"]["a2"],
            perf["language_coding"]["a1"], perf["language_coding"]["a2"],
            perf["project_score"]["a1"], perf["project_score"]["a2"],
            perf["online_coding_score"]["a1"], perf["online_coding_score"]["a2"],
            perf.get("final_status", "COMPLETED"),
            perf.get("ranking_details", "Rank: -"),
            perf.get("comment_reason", "Satisfactory performance"),
            # AA - AD
            attn.get("total_no_of_days", 0),
            attn.get("total_present_days", 0),
            attn.get("absences", 0),
            attn.get("percentage", "0%"),
        ]

        for col_i, val in enumerate(row_vals, start=1):
            cell = ws.cell(row=current_row, column=col_i, value=val)
            cell.font = data_font
            cell.border = thin_border
            cell.alignment = Alignment(
                horizontal="center" if col_i in [1, 2, 7, 8, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 31, 32, 33] else "left",
                vertical="center"
            )

        ws.row_dimensions[current_row].height = 20
        current_row += 1

    # Adjust Column Widths
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val_str = str(cell.value or "")
            if len(val_str) > max_len:
                max_len = len(val_str)
        ws.column_dimensions[col_letter].width = max(max_len + 3, 11)
