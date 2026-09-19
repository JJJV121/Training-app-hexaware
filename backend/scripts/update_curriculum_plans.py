import asyncio
import sys
from sqlalchemy import text
from app.database.session import AsyncSessionLocal

# Define complete 23-Day Curriculum Plans for Java (ID 1), Python (ID 16), and C# (ID 2)

PLANS = {
    1: {  # JAVA TRACK
        "course_title": "Java Training",
        "duration_days": 23,
        "days": [
            {
                "day_number": 1,
                "title": "Problem Solving Techniques and Data Structures",
                "units": [
                    {"order": 1, "title": "Algorithm Basics", "duration": 120},
                    {"order": 2, "title": "Data Structures Basics", "duration": 90},
                    {"order": 3, "title": "Sorting Techniques", "duration": 90},
                    {"order": 4, "title": "Searching Techniques", "duration": 60},
                    {"order": 5, "title": "Hands-on Problem Solving Lab I", "duration": 90},
                ],
            },
            {
                "day_number": 2,
                "title": "Problem Solving Techniques and Data Structures",
                "units": [
                    {"order": 1, "title": "Tree", "duration": 90},
                    {"order": 2, "title": "Hashing & HashMaps", "duration": 90},
                    {"order": 3, "title": "Graphs", "duration": 120},
                    {"order": 4, "title": "Two-Pointer & Sliding Window Patterns", "duration": 90},
                    {"order": 5, "title": "Hands-on Problem Solving Lab II & Capstone Problem Framing", "duration": 90},
                ],
            },
            {
                "day_number": 3,
                "title": "Agile & Scrum (Practical)",
                "units": [
                    {"order": 1, "title": "Agile Overview", "duration": 120},
                    {"order": 2, "title": "Scrum - Roles, Events & Artifacts", "duration": 180},
                    {"order": 3, "title": "User Stories, Backlog & Estimation (Workshop)", "duration": 180},
                ],
            },
            {
                "day_number": 4,
                "title": "Agile & Scrum (Practical)",
                "units": [
                    {"order": 1, "title": "Doing Scrum - Sprint Simulation", "duration": 180},
                    {"order": 2, "title": "Agile & DevOps/CI-CD Culture", "duration": 120},
                    {"order": 3, "title": "Agile in Distributed & Remote Teams", "duration": 90},
                    {"order": 4, "title": "Agile Practical Assessment & Interview Readiness", "duration": 90},
                ],
            },
            {
                "day_number": 5,
                "title": "MS SQL Server & MongoDB",
                "units": [
                    {"order": 1, "title": "Introduction to Databases", "duration": 60},
                    {"order": 2, "title": "Normalization", "duration": 60},
                    {"order": 3, "title": "Managing Databases", "duration": 60},
                    {"order": 4, "title": "Managing Tables & Collections", "duration": 60},
                    {"order": 5, "title": "Manipulating Data by Using DML Statements", "duration": 240},
                ],
            },
            {
                "day_number": 6,
                "title": "MS SQL Server & MongoDB",
                "units": [
                    {"order": 1, "title": "Manipulating Data by Using DML Statements and Functions", "duration": 240},
                    {"order": 2, "title": "Querying Data by Using Joins", "duration": 180},
                ],
            },
            {
                "day_number": 7,
                "title": "MS SQL Server & MongoDB",
                "units": [
                    {"order": 1, "title": "Querying Data by Using Joins", "duration": 120},
                    {"order": 2, "title": "Querying Data by Using Subqueries", "duration": 300},
                ],
            },
            {
                "day_number": 8,
                "title": "MS SQL Server & MongoDB",
                "units": [
                    {"order": 1, "title": "Querying Data by Subqueries contd..", "duration": 180},
                    {"order": 2, "title": "Window Functions", "duration": 120},
                    {"order": 3, "title": "Transactions & ACID Properties", "duration": 120},
                ],
            },
            {
                "day_number": 9,
                "title": "MS SQL Server & MongoDB",
                "units": [
                    {"order": 1, "title": "Views", "duration": 120},
                    {"order": 2, "title": "Stored Procedures & Stored Functions", "duration": 180},
                    {"order": 3, "title": "Cursors", "duration": 120},
                ],
            },
            {
                "day_number": 10,
                "title": "MS SQL Server & MongoDB",
                "units": [
                    {"order": 1, "title": "Triggers", "duration": 120},
                    {"order": 2, "title": "Case Study Development", "duration": 60},
                    {"order": 3, "title": "Coding Challenge Assessment", "duration": 120},
                ],
            },
            {
                "day_number": 11,
                "title": "Core Java (Java SE / JDK 25 LTS)",
                "units": [
                    {"order": 1, "title": "Java Introduction", "duration": 180},
                    {"order": 2, "title": "Control Statements", "duration": 240},
                ],
            },
            {
                "day_number": 12,
                "title": "Core Java (Java SE / JDK 25 LTS)",
                "units": [
                    {"order": 1, "title": "Array", "duration": 60},
                    {"order": 2, "title": "OOP", "duration": 120},
                    {"order": 3, "title": "Interface & Abstract classes", "duration": 240},
                ],
            },
            {
                "day_number": 13,
                "title": "Core Java (Java SE / JDK 25 LTS)",
                "units": [
                    {"order": 1, "title": "Interface, String API", "duration": 420},
                ],
            },
            {
                "day_number": 14,
                "title": "Core Java (Java SE / JDK 25 LTS)",
                "units": [
                    {"order": 1, "title": "Collections", "duration": 240},
                    {"order": 2, "title": "Java 8 Features - Lambda & Functional Interfaces", "duration": 180},
                ],
            },
            {
                "day_number": 15,
                "title": "Java 8 Features & Exception Handling",
                "units": [
                    {"order": 1, "title": "Java 8 Features - Method References & Optional", "duration": 120},
                    {"order": 2, "title": "Java 8 Features - Date and Time API", "duration": 120},
                    {"order": 3, "title": "Exception Handling", "duration": 180},
                ],
            },
            {
                "day_number": 16,
                "title": "Stream API & Concurrency & Testing",
                "units": [
                    {"order": 1, "title": "Stream API", "duration": 240},
                    {"order": 2, "title": "Threads", "duration": 180},
                    {"order": 3, "title": "JDBC & Best Practices", "duration": 240},
                    {"order": 4, "title": "Testing Fundamentals", "duration": 180},
                    {"order": 5, "title": "JUnit", "duration": 180},
                    {"order": 6, "title": "Mockito & Mocking Frameworks", "duration": 120},
                ],
            },
            {
                "day_number": 17,
                "title": "Project Case Study Implementation and Evaluation",
                "units": [
                    {"order": 1, "title": "Project development (Java + SQL + JUnit)", "duration": 360},
                ],
            },
            {
                "day_number": 18,
                "title": "Project Case Study Implementation and Evaluation",
                "units": [
                    {"order": 1, "title": "Java Coding Challenge Assessment", "duration": 120},
                    {"order": 2, "title": "Project review & Coding Challenge Review", "duration": 360},
                ],
            },
            {
                "day_number": 19,
                "title": "Git",
                "units": [
                    {"order": 1, "title": "Introduction to Version Control", "duration": 180},
                    {"order": 2, "title": "Understanding Git & Workflows", "duration": 180},
                    {"order": 3, "title": "Branching Strategies & Code Review", "duration": 60},
                ],
            },
            {
                "day_number": 20,
                "title": "Cloud Basics - AWS, Azure",
                "units": [
                    {"order": 1, "title": "Introduction to Cloud Services", "duration": 120},
                    {"order": 2, "title": "Containers & Docker Basics", "duration": 120},
                ],
            },
            {
                "day_number": 21,
                "title": "Generative AI (GenAI) & Prompt Engineering",
                "units": [
                    {"order": 1, "title": "Introduction to Generative AI", "duration": 120},
                    {"order": 2, "title": "Prompt Engineering Foundations", "duration": 120},
                ],
            },
            {
                "day_number": 22,
                "title": "Generative AI (GenAI) & Prompt Engineering",
                "units": [
                    {"order": 1, "title": "Agentic SDLC Foundations (Gen 2)", "duration": 120},
                    {"order": 2, "title": "Context Engineering & MCP Introduction", "duration": 90},
                ],
            },
            {
                "day_number": 23,
                "title": "Generative AI & Python Orientation",
                "units": [
                    {"order": 1, "title": "AI Output Validation & Responsible AI", "duration": 90},
                    {"order": 2, "title": "GenAI Foundation Review", "duration": 60},
                    {"order": 3, "title": "Python Orientation for Java Track (Shared 2 Hours)", "duration": 120},
                ],
            },
        ],
    },
    16: {  # PYTHON TRACK
        "course_title": "Python Training",
        "duration_days": 23,
        "days": [
            {
                "day_number": 1,
                "title": "Problem Solving Techniques and Data Structures",
                "units": [
                    {"order": 1, "title": "Algorithm Basics", "duration": 120},
                    {"order": 2, "title": "Data Structures Basics", "duration": 90},
                    {"order": 3, "title": "Sorting Techniques", "duration": 90},
                    {"order": 4, "title": "Searching Techniques", "duration": 60},
                    {"order": 5, "title": "Hands-on Problem Solving Lab I", "duration": 90},
                ],
            },
            {
                "day_number": 2,
                "title": "Problem Solving Techniques and Data Structures",
                "units": [
                    {"order": 1, "title": "Tree", "duration": 90},
                    {"order": 2, "title": "Hashing & HashMaps", "duration": 90},
                    {"order": 3, "title": "Graphs", "duration": 120},
                    {"order": 4, "title": "Two-Pointer & Sliding Window Patterns", "duration": 90},
                    {"order": 5, "title": "Hands-on Problem Solving Lab II & Capstone Problem Framing", "duration": 90},
                ],
            },
            {
                "day_number": 3,
                "title": "Agile & Scrum (Practical)",
                "units": [
                    {"order": 1, "title": "Agile Overview", "duration": 120},
                    {"order": 2, "title": "Scrum - Roles, Events & Artifacts", "duration": 180},
                    {"order": 3, "title": "User Stories, Backlog & Estimation (Workshop)", "duration": 180},
                ],
            },
            {
                "day_number": 4,
                "title": "Agile & Scrum (Practical)",
                "units": [
                    {"order": 1, "title": "Doing Scrum - Sprint Simulation", "duration": 180},
                    {"order": 2, "title": "Agile & DevOps/CI-CD Culture", "duration": 120},
                    {"order": 3, "title": "Agile in Distributed & Remote Teams", "duration": 90},
                    {"order": 4, "title": "Agile Practical Assessment & Interview Readiness", "duration": 90},
                ],
            },
            {
                "day_number": 5,
                "title": "MS SQL Server & MongoDB",
                "units": [
                    {"order": 1, "title": "Introduction to Databases", "duration": 60},
                    {"order": 2, "title": "Normalization", "duration": 60},
                    {"order": 3, "title": "Managing Databases", "duration": 60},
                    {"order": 4, "title": "Managing Tables & Collections", "duration": 60},
                    {"order": 5, "title": "Manipulating Data by Using DML Statements", "duration": 240},
                ],
            },
            {
                "day_number": 6,
                "title": "MS SQL Server & MongoDB",
                "units": [
                    {"order": 1, "title": "Manipulating Data by Using DML Statements and Functions", "duration": 240},
                    {"order": 2, "title": "Querying Data by Using Joins", "duration": 180},
                ],
            },
            {
                "day_number": 7,
                "title": "MS SQL Server & MongoDB",
                "units": [
                    {"order": 1, "title": "Querying Data by Using Joins", "duration": 120},
                    {"order": 2, "title": "Querying Data by Using Subqueries", "duration": 300},
                ],
            },
            {
                "day_number": 8,
                "title": "MS SQL Server & MongoDB",
                "units": [
                    {"order": 1, "title": "Querying Data by Subqueries contd..", "duration": 180},
                    {"order": 2, "title": "Window Functions", "duration": 120},
                    {"order": 3, "title": "Transactions & ACID Properties", "duration": 120},
                ],
            },
            {
                "day_number": 9,
                "title": "MS SQL Server & MongoDB",
                "units": [
                    {"order": 1, "title": "Views", "duration": 120},
                    {"order": 2, "title": "Stored Procedures & Stored Functions", "duration": 180},
                    {"order": 3, "title": "Cursors", "duration": 120},
                ],
            },
            {
                "day_number": 10,
                "title": "MS SQL Server & MongoDB",
                "units": [
                    {"order": 1, "title": "Triggers", "duration": 120},
                    {"order": 2, "title": "Case Study Development", "duration": 60},
                    {"order": 3, "title": "Coding Challenge Assessment", "duration": 120},
                ],
            },
            {
                "day_number": 11,
                "title": "Programming Language - Python (Python 3.13)",
                "units": [
                    {"order": 1, "title": "Python Introduction", "duration": 180},
                    {"order": 2, "title": "Data types & Control Statements", "duration": 240},
                ],
            },
            {
                "day_number": 12,
                "title": "Programming Language - Python (Python 3.13)",
                "units": [
                    {"order": 1, "title": "Lists & Enums", "duration": 60},
                    {"order": 2, "title": "OOP & SOLID Principles", "duration": 120},
                    {"order": 3, "title": "Inheritance & MRO", "duration": 240},
                ],
            },
            {
                "day_number": 13,
                "title": "Programming Language - Python (Python 3.13)",
                "units": [
                    {"order": 1, "title": "Protocols, Special Methods & String Handling", "duration": 420},
                ],
            },
            {
                "day_number": 14,
                "title": "Programming Language - Python (Python 3.13)",
                "units": [
                    {"order": 1, "title": "Collections", "duration": 240},
                    {"order": 2, "title": "Functional Programming - Lambda & Higher-Order Functions", "duration": 180},
                ],
            },
            {
                "day_number": 15,
                "title": "Programming Language - Python (Python 3.13)",
                "units": [
                    {"order": 1, "title": "Bound Methods & None-Handling Patterns", "duration": 120},
                    {"order": 2, "title": "Date and Time", "duration": 120},
                    {"order": 3, "title": "Exception Handling", "duration": 180},
                ],
            },
            {
                "day_number": 16,
                "title": "Functional Data Processing & Testing",
                "units": [
                    {"order": 1, "title": "Functional Data Processing - the Stream API equivalent", "duration": 240},
                    {"order": 2, "title": "Threads & Multithreading", "duration": 180},
                    {"order": 3, "title": "Database Connectivity & Best Practices (pyodbc & pymongo)", "duration": 240},
                    {"order": 4, "title": "Testing Fundamentals", "duration": 180},
                    {"order": 5, "title": "PyUnit / pytest", "duration": 180},
                    {"order": 6, "title": "Mocking with unittest.mock", "duration": 120},
                ],
            },
            {
                "day_number": 17,
                "title": "Project Case Study Implementation and Evaluation",
                "units": [
                    {"order": 1, "title": "Project development (Python + SQL Server + MongoDB + PyUnit)", "duration": 360},
                ],
            },
            {
                "day_number": 18,
                "title": "Project Case Study Implementation and Evaluation",
                "units": [
                    {"order": 1, "title": "Python Coding Challenge Assessment", "duration": 120},
                    {"order": 2, "title": "Project review & Coding Challenge Review", "duration": 360},
                ],
            },
            {
                "day_number": 19,
                "title": "Git",
                "units": [
                    {"order": 1, "title": "Introduction to Version Control", "duration": 180},
                    {"order": 2, "title": "Understanding Git & Workflows", "duration": 180},
                    {"order": 3, "title": "Branching Strategies & Code Review", "duration": 60},
                ],
            },
            {
                "day_number": 20,
                "title": "Cloud Basics - AWS, Azure",
                "units": [
                    {"order": 1, "title": "Introduction to Cloud Services", "duration": 120},
                    {"order": 2, "title": "Containers & Docker Basics", "duration": 120},
                ],
            },
            {
                "day_number": 21,
                "title": "Generative AI (GenAI) & Prompt Engineering",
                "units": [
                    {"order": 1, "title": "Introduction to Generative AI", "duration": 120},
                    {"order": 2, "title": "Prompt Engineering Foundations", "duration": 120},
                ],
            },
            {
                "day_number": 22,
                "title": "Generative AI (GenAI) & Prompt Engineering",
                "units": [
                    {"order": 1, "title": "Agentic SDLC Foundations (Gen 2)", "duration": 120},
                    {"order": 2, "title": "Context Engineering & MCP Introduction", "duration": 90},
                ],
            },
            {
                "day_number": 23,
                "title": "Generative AI Foundation Review & Output Validation",
                "units": [
                    {"order": 1, "title": "AI Output Validation & Responsible AI", "duration": 90},
                    {"order": 2, "title": "GenAI Foundation Review", "duration": 60},
                    {"order": 3, "title": "Python Foundation Review", "duration": 120},
                ],
            },
        ],
    },
    2: {  # C# TRACK
        "course_title": "C# Training",
        "duration_days": 23,
        "days": [
            {
                "day_number": 1,
                "title": "Problem Solving Techniques and Data Structures",
                "units": [
                    {"order": 1, "title": "Algorithm Basics", "duration": 120},
                    {"order": 2, "title": "Data Structures Basics", "duration": 90},
                    {"order": 3, "title": "Sorting Techniques", "duration": 90},
                    {"order": 4, "title": "Searching Techniques", "duration": 60},
                    {"order": 5, "title": "Hands-on Problem Solving Lab I", "duration": 90},
                ],
            },
            {
                "day_number": 2,
                "title": "Agile & Scrum (Practical)",
                "units": [
                    {"order": 1, "title": "Agile Overview", "duration": 120},
                    {"order": 2, "title": "Scrum - Roles, Events & Artifacts", "duration": 180},
                    {"order": 3, "title": "User Stories, Backlog & Estimation (Workshop)", "duration": 180},
                ],
            },
            {
                "day_number": 3,
                "title": "MS SQL Server",
                "units": [
                    {"order": 1, "title": "Introduction to Databases", "duration": 60},
                    {"order": 2, "title": "Normalization and Data Modelling", "duration": 60},
                    {"order": 3, "title": "Managing Databases", "duration": 60},
                    {"order": 4, "title": "Managing Tables", "duration": 60},
                    {"order": 5, "title": "Manipulating Data by Using DML Statements", "duration": 240},
                ],
            },
            {
                "day_number": 4,
                "title": "MS SQL Server",
                "units": [
                    {"order": 1, "title": "Manipulating Data by Using DML Statements and Functions", "duration": 240},
                    {"order": 2, "title": "Querying Data by Using Joins", "duration": 180},
                ],
            },
            {
                "day_number": 5,
                "title": "MS SQL Server",
                "units": [
                    {"order": 1, "title": "Querying Data by Using Joins and Subqueries", "duration": 120},
                    {"order": 2, "title": "Querying Data by Using Subqueries", "duration": 300},
                ],
            },
            {
                "day_number": 6,
                "title": "MS SQL Server",
                "units": [
                    {"order": 1, "title": "Case Study Development", "duration": 60},
                    {"order": 2, "title": "Case Study Q&A", "duration": 240},
                    {"order": 3, "title": "Coding Challenge Assessment", "duration": 240},
                ],
            },
            {
                "day_number": 7,
                "title": "Programming Language - C# 14 / .NET 10",
                "units": [
                    {"order": 1, "title": "Introduction to .NET 10 platform", "duration": 180},
                    {"order": 2, "title": "Basic Structure of a C# Program & Top-Level Statements", "duration": 300},
                ],
            },
            {
                "day_number": 8,
                "title": "Programming Language - C# 14 / .NET 10",
                "units": [
                    {"order": 1, "title": "Object-Oriented Programming Principles in C#", "duration": 420},
                ],
            },
            {
                "day_number": 9,
                "title": "Programming Language - C# 14 / .NET 10",
                "units": [
                    {"order": 1, "title": "Sealed Class and Sealed Methods & Extension Members", "duration": 180},
                    {"order": 2, "title": "Exception Handling in C#", "duration": 240},
                ],
            },
            {
                "day_number": 10,
                "title": "Programming Language - C# 14 / .NET 10",
                "units": [
                    {"order": 1, "title": "Introduction to File Handling & System.Text.Json", "duration": 180},
                    {"order": 2, "title": "Collections and Generics", "duration": 240},
                ],
            },
            {
                "day_number": 11,
                "title": "Programming Language - C# 14 / .NET 10",
                "units": [
                    {"order": 1, "title": "Delegates, Events and Lambda Expressions", "duration": 180},
                    {"order": 2, "title": "LINQ Architecture & Providers", "duration": 240},
                ],
            },
            {
                "day_number": 12,
                "title": "Asynchronous, ADO.NET, EF Core 10 & Testing",
                "units": [
                    {"order": 1, "title": "Threads vs Tasks & Asynchronous Programming", "duration": 180},
                    {"order": 2, "title": "Introduction to ADO.NET in .NET 10", "duration": 150},
                    {"order": 3, "title": "Entity Framework Core 10", "duration": 150},
                    {"order": 4, "title": "C# 14 and .NET 10 New Features", "duration": 120},
                ],
            },
            {
                "day_number": 13,
                "title": "Unit Testing - NUnit 4.x",
                "units": [
                    {"order": 1, "title": "Unit Testing - NUnit 4.x", "duration": 240},
                    {"order": 2, "title": "Mocking, Coverage and Test Design", "duration": 120},
                    {"order": 3, "title": "TDD and AI-Assisted Testing", "duration": 60},
                ],
            },
            {
                "day_number": 14,
                "title": "Project Case Study Implementation and Evaluation",
                "units": [
                    {"order": 1, "title": "Project development (C# + SQL + NUnit)", "duration": 360},
                ],
            },
            {
                "day_number": 15,
                "title": "Project Case Study Implementation and Evaluation",
                "units": [
                    {"order": 1, "title": "C# Coding Challenge Assessment", "duration": 120},
                    {"order": 2, "title": "Project review & Coding Challenge Review", "duration": 360},
                ],
            },
            {
                "day_number": 16,
                "title": "Git",
                "units": [
                    {"order": 1, "title": "Introduction to Version Control", "duration": 180},
                    {"order": 2, "title": "Understanding Git & Workflows", "duration": 180},
                    {"order": 3, "title": "Branching Strategies & Code Review", "duration": 60},
                ],
            },
            {
                "day_number": 17,
                "title": "Cloud Basics - AWS, Azure",
                "units": [
                    {"order": 1, "title": "Introduction to Cloud Services", "duration": 120},
                    {"order": 2, "title": "Containers & Docker Basics", "duration": 120},
                ],
            },
            {
                "day_number": 18,
                "title": "Generative AI (GenAI) & Prompt Engineering",
                "units": [
                    {"order": 1, "title": "Introduction to Generative AI", "duration": 120},
                    {"order": 2, "title": "Prompt Engineering Foundations", "duration": 120},
                ],
            },
            {
                "day_number": 19,
                "title": "Generative AI (GenAI) & Prompt Engineering",
                "units": [
                    {"order": 1, "title": "Agentic SDLC Foundations (Gen 2)", "duration": 120},
                    {"order": 2, "title": "Context Engineering & MCP Introduction", "duration": 90},
                ],
            },
            {
                "day_number": 20,
                "title": "Generative AI & Responsible AI",
                "units": [
                    {"order": 1, "title": "AI Output Validation & Responsible AI", "duration": 90},
                    {"order": 2, "title": "GenAI Foundation Review", "duration": 60},
                ],
            },
            {
                "day_number": 21,
                "title": "Python Orientation for C# Track",
                "units": [
                    {"order": 1, "title": "Python Orientation for C# Track (Shared 2 Hours)", "duration": 120},
                ],
            },
            {
                "day_number": 22,
                "title": "Capstone Integration & Review",
                "units": [
                    {"order": 1, "title": "Capstone Incremental Project Sprint Reviews", "duration": 240},
                ],
            },
            {
                "day_number": 23,
                "title": "Final Assessment & Review",
                "units": [
                    {"order": 1, "title": "Final Assessment & Technical Evaluation", "duration": 240},
                ],
            },
        ],
    },
}


async def main():
    async with AsyncSessionLocal() as session:
        print("=== PRE-MIGRATION SNAPSHOT ===")
        tables = [
            "users",
            "enrollments",
            "progress",
            "batches",
            "attendance_records",
            "assignment_submissions",
            "assessment_attempts",
            "coding_submissions",
            "courses",
            "course_days",
            "learning_units",
            "contents",
            "videos",
        ]
        pre_counts = {}
        for t in tables:
            try:
                cnt = (await session.execute(text(f"SELECT COUNT(*) FROM {t}"))).scalar()
                pre_counts[t] = cnt
                print(f"  {t:<25} = {cnt}")
            except Exception as e:
                print(f"  {t:<25} = error ({e})")

        print("\n=== STARTING CURRICULUM MIGRATION TRANSACTION ===")
        try:
            for course_id, plan in PLANS.items():
                course_title = plan["course_title"]
                dur_days = plan["duration_days"]

                # 1. Update Course Duration & Title
                await session.execute(
                    text("""
                    UPDATE courses
                    SET duration_days = :dur
                    WHERE id = :cid
                    """),
                    {"dur": dur_days, "cid": course_id},
                )
                print(f"[UPDATE] Course ID {course_id} ('{course_title}') duration set to {dur_days} days.")

                # Fetch existing days for this course
                existing_days_res = await session.execute(
                    text("SELECT id, day_number, title FROM course_days WHERE course_id = :cid ORDER BY day_number"),
                    {"cid": course_id},
                )
                existing_days = {d.day_number: d for d in existing_days_res.all()}

                # Process planned days
                for day_data in plan["days"]:
                    day_num = day_data["day_number"]
                    day_title = day_data["title"]
                    units_data = day_data["units"]

                    if day_num in existing_days:
                        cday_id = existing_days[day_num].id
                        await session.execute(
                            text("""
                            UPDATE course_days
                            SET title = :title
                            WHERE id = :did
                            """),
                            {"title": day_title, "did": cday_id},
                        )
                        print(f"  [REUSE] {course_title} Day {day_num} -> CourseDay ID {cday_id} updated: '{day_title}'")
                    else:
                        cday_id = (
                            await session.execute(
                                text("""
                            INSERT INTO course_days (course_id, day_number, title, description)
                            VALUES (:cid, :dnum, :title, '')
                            RETURNING id
                            """),
                                {"cid": course_id, "dnum": day_num, "title": day_title},
                            )
                        ).scalar()
                        print(f"  [CREATE] {course_title} Day {day_num} -> New CourseDay ID {cday_id}: '{day_title}'")

                    # Fetch existing learning units for this day
                    existing_lus_res = await session.execute(
                        text("SELECT id, display_order, title, duration_minutes FROM learning_units WHERE day_id = :did ORDER BY display_order"),
                        {"did": cday_id},
                    )
                    existing_lus = {u.display_order: u for u in existing_lus_res.all()}

                    for udata in units_data:
                        u_order = udata["order"]
                        u_title = udata["title"]
                        u_dur = udata["duration"]

                        if u_order in existing_lus:
                            lu_id = existing_lus[u_order].id
                            await session.execute(
                                text("""
                                UPDATE learning_units
                                SET title = :title, duration_minutes = :dur, display_order = :order
                                WHERE id = :luid
                                """),
                                {"title": u_title, "dur": u_dur, "order": u_order, "luid": lu_id},
                            )
                            print(f"    [REUSE] LU Order {u_order} -> LearningUnit ID {lu_id} updated: '{u_title}' ({u_dur}m)")
                        else:
                            lu_id = (
                                await session.execute(
                                    text("""
                                INSERT INTO learning_units (day_id, title, description, display_order, duration_minutes)
                                VALUES (:did, :title, '', :order, :dur)
                                RETURNING id
                                """),
                                    {"did": cday_id, "title": u_title, "order": u_order, "dur": u_dur},
                                )
                            ).scalar()
                            print(f"    [CREATE] LU Order {u_order} -> New LearningUnit ID {lu_id}: '{u_title}' ({u_dur}m)")

                            # Check if content exists for this new LU
                            cnt_res = await session.execute(
                                text("SELECT id FROM contents WHERE learning_unit_id = :luid"),
                                {"luid": lu_id},
                            )
                            if not cnt_res.scalar():
                                await session.execute(
                                    text("""
                                    INSERT INTO contents (learning_unit_id, content_text)
                                    VALUES (:luid, :txt)
                                    """),
                                    {"luid": lu_id, "txt": f"# {u_title}\n\nComprehensive training material for {u_title}."},
                                )

            await session.commit()
            print("\n[SUCCESS] Transaction committed successfully!")
        except Exception as e:
            await session.rollback()
            print(f"\n[ERROR] Transaction failed, rolled back: {e}")
            raise e

        print("\n=== POST-MIGRATION SNAPSHOT ===")
        post_counts = {}
        for t in tables:
            try:
                cnt = (await session.execute(text(f"SELECT COUNT(*) FROM {t}"))).scalar()
                post_counts[t] = cnt
                diff = cnt - pre_counts[t]
                diff_str = f"(+{diff})" if diff > 0 else ("(0)" if diff == 0 else f"({diff})")
                print(f"  {t:<25} = {cnt:<5} {diff_str}")
            except Exception as e:
                print(f"  {t:<25} = error ({e})")

        # Verify Transactional Data Safety
        transactional = [
            "users",
            "enrollments",
            "progress",
            "batches",
            "attendance_records",
            "assignment_submissions",
            "assessment_attempts",
            "coding_submissions",
        ]
        any_loss = False
        for t in transactional:
            if post_counts[t] < pre_counts[t]:
                print(f"[ERROR] Data loss detected in table '{t}'! Pre: {pre_counts[t]}, Post: {post_counts[t]}")
                any_loss = True
        if not any_loss:
            print("\n[PASS] Transactional Data Integrity Verified: Zero data loss across all user/transaction tables!")


if __name__ == "__main__":
    asyncio.run(main())
