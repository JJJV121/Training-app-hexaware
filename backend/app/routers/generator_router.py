from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.course_day import CourseDay
from app.models.course import Course

router = APIRouter(
    prefix="/courses",
    tags=["Content Generator"]
)

# Rule-based dynamic template content generator
def get_templated_suggestions(course_title: str, day_title: str, day_desc: str):
    text = (day_title + " " + (day_desc or "")).lower()

    # 1. SQL / Database
    if any(k in text for k in ["sql", "database", "dml", "join", "query", "mysql"]):
        return {
            "assignment": {
                "title": "MySQL Joins and Database Queries",
                "description": "Write advanced SELECT statements using INNER JOIN, LEFT JOIN, aggregate functions, and subqueries on a corporate database schema.",
                "instructions": "1. Build Employees, Departments, and Salary tables.\n2. Write SQL scripts to list all employees who earn more than their department's average.\n3. Find departments that have zero active employees.\n4. Put your queries in queries.sql and compress it in a .zip archive for submission.",
                "total_marks": 100,
                "passing_marks": 75
            },
            "qa": {
                "question": "What is the difference between INNER JOIN, LEFT JOIN, and RIGHT JOIN in SQL?",
                "answer": "INNER JOIN returns matching records in both tables. LEFT JOIN returns all records from the left table and matching from the right table (with nulls for non-matching columns). RIGHT JOIN is the reverse, returning all records from the right table and matching from the left."
            },
            "case_study": {
                "title": "Designing a Scalable E-Commerce Database Schema",
                "scenario": "An online retail application experiences database locks and bottleneck delays during checkout peak periods. Orders are split across multiple unstructured tables causing high transaction load.",
                "requirements": "1. Propose an Entity-Relationship (ER) diagram with 3NF normalization.\n2. Write optimized database schemas including indexes on foreign keys.\n3. Define a database replication and read-write split strategy.",
                "total_marks": 100
            }
        }

    # 2. OOP
    if any(k in text for k in ["oop", "object", "class", "inheritance", "polymorphism", "encapsulation"]):
        return {
            "assignment": {
                "title": "OOP Concepts: Inheritance and Interface Implementations",
                "description": "Develop a domain model for a vehicle management system using inheritance, abstract classes, and polymorphism.",
                "instructions": "1. Write abstract class 'Vehicle' with speed and capacity variables and abstract method 'calculateFare()'.\n2. Create Car, Bus, and Truck sub-classes extending Vehicle.\n3. Implement polymorphic behavior inside a main class.\nSubmit your source code files compiled in a single .zip file.",
                "total_marks": 100,
                "passing_marks": 75
            },
            "qa": {
                "question": "Why does Java not support multiple inheritance of classes, and how do Interfaces solve this?",
                "answer": "To prevent the Diamond Problem where a sub-class inherits conflicting implementations from multiple parent classes. Interfaces solve this by only declaring signatures without member state, which does not introduce state conflicts."
            },
            "case_study": {
                "title": "Refactoring Legacy Nested Code to Clean OOP Patterns",
                "scenario": "A payment processing engine relies on large nested switch statements to route transactions. Adding new payment methods requires editing core code, violating the Open-Closed principle.",
                "requirements": "1. Redesign the engine using the Strategy Design Pattern.\n2. Write OOP class schemas for transaction models.\n3. Propose a decoupled framework structure.",
                "total_marks": 100
            }
        }

    # 3. Collections / Arrays
    if any(k in text for k in ["collection", "list", "map", "set", "array"]):
        return {
            "assignment": {
                "title": "Collections Registry and Comparators",
                "description": "Create a student database manager using ArrayList, HashSet, and HashMap data structures.",
                "instructions": "1. Write a Student class with properties: ID, Name, and GPA.\n2. Store records in a Map using Student ID as the key.\n3. Sort the students using a custom GPA comparator.\n4. Zip and upload your complete project directory.",
                "total_marks": 100,
                "passing_marks": 75
            },
            "qa": {
                "question": "Explain the performance differences between ArrayList and LinkedList.",
                "answer": "ArrayList provides fast O(1) search and random access by index, but slow O(N) insertions/deletions in the middle due to resizing. LinkedList provides fast O(1) insertions/deletions but slower O(N) search because it requires traversal."
            },
            "case_study": {
                "title": "Memory Optimization in Cache Allocations",
                "scenario": "A high-performance system aggregates log records in an ArrayList in memory. Under heavy loads, the array resizes repeatedly, causing heap memory exhaustion and slow application responsiveness.",
                "requirements": "1. Select a collection structure suited for buffering logs.\n2. Implement a sliding window LRU (Least Recently Used) cache strategy.\n3. Compare memory footprints.",
                "total_marks": 100
            }
        }

    # 4. Exception Handling
    if any(k in text for k in ["exception", "try", "catch", "throw", "error"]):
        return {
            "assignment": {
                "title": "Robust Custom Exception Implementations",
                "description": "Develop a file validator utility that processes CSV inputs and raises custom file parsing exceptions.",
                "instructions": "1. Define custom exceptions: InvalidDataException and MissingHeaderException.\n2. Implement try-catch-finally blocks to process lines.\n3. Write errors to a local log file using Logger.\nSubmit source code in a zipped directory.",
                "total_marks": 100,
                "passing_marks": 75
            },
            "qa": {
                "question": "What is the difference between Checked and Unchecked exceptions?",
                "answer": "Checked exceptions are verified at compile time (e.g. IOException) and must be caught or declared. Unchecked exceptions are verified at runtime (e.g. NullPointerException) and reflect programming logic errors."
            },
            "case_study": {
                "title": "API Resilience and Network Fault Handling",
                "scenario": "A banking synchronization service frequently errors out due to unexpected API timeout drops from third-party networks, leaving user states out of sync.",
                "requirements": "1. Design a resilient retry mechanism with exponential backoff.\n2. Detail exception classification hierarchies.\n3. Outline transaction fallback procedures.",
                "total_marks": 100
            }
        }

    # 5. Multithreading / Concurrency
    if any(k in text for k in ["thread", "concurrency", "parallel", "synchronized"]):
        return {
            "assignment": {
                "title": "Thread Synchronization and Producer-Consumer Queue",
                "description": "Write a multi-threaded application implementing a shared bounded buffer using wait/notify or locks.",
                "instructions": "1. Implement a Producer class posting integers to a buffer.\n2. Implement a Consumer class reading values.\n3. Use synchronizations to prevent buffer overflows or underflows.\nUpload your synchronized source code in a zip file.",
                "total_marks": 100,
                "passing_marks": 75
            },
            "qa": {
                "question": "What is a deadlock and how can it be avoided?",
                "answer": "A deadlock occurs when two or more threads are waiting indefinitely for resource locks held by each other. It can be avoided by acquiring resource locks in a strict global order or utilizing tryLock timeouts."
            },
            "case_study": {
                "title": "Resolving Concurrency Violations in Booking Systems",
                "scenario": "A ticket reservation app sells duplicate seats when many users submit purchase requests at the exact same millisecond. Concurrent transactions are overwriting seats status.",
                "requirements": "1. Propose optimistic vs pessimistic database locks.\n2. Detail a locking strategy in the backend service layer.\n3. Write lock validation code.",
                "total_marks": 100
            }
        }

    # 6. Git / Version Control
    if any(k in text for k in ["git", "version control", "branch", "merge"]):
        return {
            "assignment": {
                "title": "Git Conflict Resolution Simulation",
                "description": "Resolve a merge conflict locally between two conflicting branches in a mock repository.",
                "instructions": "1. Create a local repo and initialize main branch.\n2. Create feature-a and feature-b editing the same line of code.\n3. Attempt to merge both and resolve the conflict.\nSubmit a screenshot showing the resolved git log tree.",
                "total_marks": 100,
                "passing_marks": 75
            },
            "qa": {
                "question": "What is the difference between git merge and git rebase?",
                "answer": "git merge combines branches by creating a merge commit, leaving a historical trail of the branch origin. git rebase applies local commits sequentially on top of the target branch base, creating a clean linear timeline."
            },
            "case_study": {
                "title": "Establishing Branch Protection for Multi-Dev Pipelines",
                "scenario": "A development team is frequently breaking the main deployment build by pushing untested code directly, bypassing review procedures.",
                "requirements": "1. Draft a Git branching strategy (e.g. Gitflow).\n2. Configure pull request code quality check gates.\n3. Design a deployment fallback pipeline.",
                "total_marks": 100
            }
        }

    # Fallback Template
    return {
        "assignment": {
            "title": f"Practical Exercise: {day_title}",
            "description": f"Implement practical applications of {day_title} and construct solutions based on its topics.",
            "instructions": f"1. Analyze the core details of {day_title}: '{day_desc or ''}'.\n2. Design a system modeling these principles.\n3. Implement unit tests verifying correctness.\nSubmit source files zipped in a package.",
            "total_marks": 100,
            "passing_marks": 75
        },
        "qa": {
            "question": f"What are the main architectural constraints or implementation challenges of {day_title}?",
            "answer": f"Implementation of {day_title} requires addressing concerns regarding efficiency, clean abstraction, and scalability, as specified under the syllabus description: '{day_desc or ''}'."
        },
        "case_study": {
            "title": f"Case Study: Enterprise Deployment of {day_title}",
            "scenario": f"An enterprise organization is deploying a business critical app utilizing {day_title}. Under peak scaling, the architecture must support 10,000 concurrent updates.",
            "requirements": "1. Document the system architecture bottlenecks.\n2. Design decoupling solutions.\n3. Propose monitoring guidelines.",
            "total_marks": 100
        }
    }

@router.post("/{course_id}/days/{day_id}/generate-content")
async def generate_suggested_content_api(
    course_id: int,
    day_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role.upper() != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can generate template content."
        )

    # Load Course
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found."
        )

    # Load Course Day
    day = await db.get(CourseDay, day_id)
    if not day or day.course_id != course_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course day not found under this course."
        )

    suggestions = get_templated_suggestions(course.title, day.title, day.description)
    return suggestions
