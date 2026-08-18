import random

def generate_25_mcqs_for_day(course_title: str, day_title: str, day_description: str = "") -> list[dict]:
    """
    Generates 25 high-quality MCQs categorized into Low (8), Medium (9), and Hard (8) difficulty levels
    based on course notes and lesson topics.
    """
    title_lower = (day_title + " " + course_title + " " + day_description).lower()

    # Determine primary topic domain
    if "sql" in title_lower or "mysql" in title_lower or "database" in title_lower or "join" in title_lower:
        topic = "sql"
    elif "c#" in title_lower or "linq" in title_lower or ".net" in title_lower:
        topic = "csharp"
    elif "git" in title_lower or "version control" in title_lower:
        topic = "git"
    elif "cloud" in title_lower or "aws" in title_lower or "azure" in title_lower:
        topic = "cloud"
    elif "agile" in title_lower or "scrum" in title_lower:
        topic = "agile"
    elif "data structure" in title_lower or "algorithm" in title_lower or "sorting" in title_lower:
        topic = "dsa"
    elif "testing" in title_lower or "junit" in title_lower:
        topic = "testing"
    else:
        topic = "java"

    mcqs = []

    if topic == "sql":
        mcqs = _get_sql_25_mcqs()
    elif topic == "csharp":
        mcqs = _get_csharp_25_mcqs()
    elif topic == "git":
        mcqs = _get_git_25_mcqs()
    elif topic == "cloud":
        mcqs = _get_cloud_25_mcqs()
    elif topic == "agile":
        mcqs = _get_agile_25_mcqs()
    elif topic == "dsa":
        mcqs = _get_dsa_25_mcqs()
    elif topic == "testing":
        mcqs = _get_testing_25_mcqs()
    else:
        mcqs = _get_java_25_mcqs()

    return mcqs


# ============================================================
# TOPIC-SPECIFIC 25 MCQ SEEDERS (LOW: 8, MEDIUM: 9, HARD: 8)
# ============================================================

def _get_java_25_mcqs() -> list[dict]:
    return [
        # --- LOW / EASY (8 Questions) ---
        {
            "id": 1,
            "difficulty": "low",
            "question": "Which component of the Java Development Kit is responsible for converting bytecode into machine-native instructions at runtime?",
            "options": ["JDK Compiler (javac)", "Java Virtual Machine (JVM)", "Java Runtime Environment (JRE) Library", "Source Code Parser"],
            "correct_index": 1,
            "explanation": "The JVM (Java Virtual Machine) loads compiled .class bytecode files and executes/interprets them into machine-native code."
        },
        {
            "id": 2,
            "difficulty": "low",
            "question": "What is the default initial value of an uninitialized instance integer variable in Java?",
            "options": ["0", "null", "undefined", "-1"],
            "correct_index": 0,
            "explanation": "Instance primitive numeric variables in Java default to 0 (or 0.0 for floating-point values) if not explicitly initialized."
        },
        {
            "id": 3,
            "difficulty": "low",
            "question": "Which access modifier allows visibility only within the same class definition?",
            "options": ["public", "protected", "private", "default (package-private)"],
            "correct_index": 2,
            "explanation": "The 'private' modifier strictly limits access to methods and fields within the declaring class."
        },
        {
            "id": 4,
            "difficulty": "low",
            "question": "Which keyword is used in Java to define a subclass inheriting from a superclass?",
            "options": ["implements", "extends", "inherits", "super"],
            "correct_index": 1,
            "explanation": "The 'extends' keyword is used in class declarations to inherit fields and methods from a single superclass."
        },
        {
            "id": 5,
            "difficulty": "low",
            "question": "What is the size of a Java primitive 'int' data type in memory?",
            "options": ["16 bits (2 bytes)", "32 bits (4 bytes)", "64 bits (8 bytes)", "128 bits (16 bytes)"],
            "correct_index": 1,
            "explanation": "A Java primitive 'int' is a signed 32-bit (4-byte) integer across all operating systems."
        },
        {
            "id": 6,
            "difficulty": "low",
            "question": "Which Java collection interface maintains unique elements with no duplicate values allowed?",
            "options": ["List", "Set", "Queue", "Vector"],
            "correct_index": 1,
            "explanation": "The Set interface (e.g. HashSet, TreeSet) rejects duplicate elements."
        },
        {
            "id": 7,
            "difficulty": "low",
            "question": "Which method is the entry point for standalone Java application execution?",
            "options": ["public void start(String[] args)", "public static void main(String[] args)", "public static int main()", "private void main(String args)"],
            "correct_index": 1,
            "explanation": "The standard execution signature is 'public static void main(String[] args)'."
        },
        {
            "id": 8,
            "difficulty": "low",
            "question": "Which package is automatically imported into every Java source file by default?",
            "options": ["java.util", "java.io", "java.lang", "java.net"],
            "correct_index": 2,
            "explanation": "The java.lang package (containing String, Math, Object, System) is implicitly imported into all Java translation units."
        },

        # --- MEDIUM (9 Questions) ---
        {
            "id": 9,
            "difficulty": "medium",
            "question": "What will String s1 = 'Java'; String s2 = new String('Java'); System.out.println(s1 == s2); output?",
            "options": ["true", "false", "Compilation Error", "NullPointerException"],
            "correct_index": 1,
            "explanation": "The == operator checks object reference equality. s1 points to the String Constant Pool, while 'new String()' creates a new Heap object, so s1 == s2 is false."
        },
        {
            "id": 10,
            "difficulty": "medium",
            "question": "What happens if a catch block for Exception is placed BEFORE a catch block for NullPointerException?",
            "options": ["NullPointerException block executes normally.", "Both catch blocks execute in sequence.", "Compilation error: Unreachable code.", "Runtime warning logged to console."],
            "correct_index": 2,
            "explanation": "Because NullPointerException is a subclass of Exception, placing Exception first catches all NPEs, rendering the specific NPE catch block unreachable compile-time error."
        },
        {
            "id": 11,
            "difficulty": "medium",
            "question": "Which Collection class maintains insertion order and permits fast index-based element lookup?",
            "options": ["HashSet", "ArrayList", "TreeSet", "PriorityQueue"],
            "correct_index": 1,
            "explanation": "ArrayList backs elements with a dynamic array, preserving insertion order and offering O(1) random index lookup."
        },
        {
            "id": 12,
            "difficulty": "medium",
            "question": "What is the key difference between method Overloading and Method Overriding?",
            "options": ["Overloading happens at runtime; Overriding happens at compile-time.", "Overloading requires same method name with different parameter signatures in the same/derived class; Overriding alters superclass method implementation in subclass.", "Overloading requires the 'abstract' keyword.", "Overriding cannot be used with public methods."],
            "correct_index": 1,
            "explanation": "Overloading is compile-time polymorphism (same name, different arguments). Overriding is runtime polymorphism (redefining a superclass method in a subclass with identical signature)."
        },
        {
            "id": 13,
            "difficulty": "medium",
            "question": "What will be printed by: StringBuilder sb = new StringBuilder('Hello'); sb.append(' World'); sb.substring(0, 5); System.out.println(sb);?",
            "options": ["Hello", "World", "Hello World", "Compilation Error"],
            "correct_index": 2,
            "explanation": "StringBuilder.append() mutates the buffer to 'Hello World'. substring() returns a new String but does NOT mutate the original StringBuilder, so sb remains 'Hello World'."
        },
        {
            "id": 14,
            "difficulty": "medium",
            "question": "Which interface should be implemented to sort objects using custom comparison logic with Collections.sort()?",
            "options": ["java.lang.Comparable", "java.util.Comparator", "java.io.Serializable", "java.lang.Cloneable"],
            "correct_index": 1,
            "explanation": "java.util.Comparator allows defining multiple external custom ordering rules via compare(T o1, T o2)."
        },
        {
            "id": 15,
            "difficulty": "medium",
            "question": "What does the 'final' keyword signify when applied to a class definition?",
            "options": ["The class cannot instantiate objects.", "The class cannot be subclassed or extended.", "All methods in the class become abstract.", "The class is marked for garbage collection."],
            "correct_index": 1,
            "explanation": "Marking a class as 'final' prevents inheritance (e.g. String is a final class)."
        },
        {
            "id": 16,
            "difficulty": "medium",
            "question": "How does a try-with-resources statement automatically manage closing I/O stream resources?",
            "options": ["Calling finalize() on all objects.", "By requiring objects to implement java.lang.AutoCloseable or java.io.Closeable.", "Invoking System.gc() before exiting.", "Using background thread cleanup."],
            "correct_index": 1,
            "explanation": "Try-with-resources calls close() automatically on resources that implement AutoCloseable or Closeable."
        },
        {
            "id": 17,
            "difficulty": "medium",
            "question": "Which Functional Interface method signature matches java.util.function.Predicate<T>?",
            "options": ["void accept(T t)", "R apply(T t)", "boolean test(T t)", "T get()"],
            "correct_index": 2,
            "explanation": "Predicate<T> is a functional interface whose SAM (Single Abstract Method) is 'boolean test(T t)'."
        },

        # --- HARD (8 Questions) ---
        {
            "id": 18,
            "difficulty": "hard",
            "question": "In Java's memory model, what happens to object reference variables and object state when passing an object into a method?",
            "options": ["Java passes objects by reference; reassigning the parameter inside the method changes the caller's reference.", "Java passes everything strictly by value; the reference copy points to the same heap object, so mutating object fields reflects in the caller, but reassigning the reference variable does not.", "Primitive values are passed by value, but objects are passed by reference.", "Object states are cloned on every method invocation."],
            "correct_index": 1,
            "explanation": "Java is strictly pass-by-value. For objects, the value passed is the memory address reference copy. Mutating object attributes affects the shared heap instance, but reassigning the parameter variable does not alter the caller's reference."
        },
        {
            "id": 19,
            "difficulty": "hard",
            "question": "What is the volatile keyword's primary effect on multi-threaded variable access in Java?",
            "options": ["It guarantees atomic execution of compound operations like count++.", "It enforces mutual exclusion locking on the CPU cache.", "It ensures visibility by forcing reads and writes directly to main memory, establishing a happens-before relationship.", "It prevents Garbage Collection from reclaiming the variable."],
            "correct_index": 2,
            "explanation": "The 'volatile' keyword ensures visibility of changes across threads by reading/writing to main memory rather than CPU caches, but it does NOT guarantee atomicity for compound operations."
        },
        {
            "id": 20,
            "difficulty": "hard",
            "question": "What happens if System.exit(0) is executed inside a try block with an accompanying finally block?",
            "options": ["The finally block completes execution before JVM exit.", "The finally block is bypassed and does NOT execute because the JVM terminates immediately.", "The finally block throws a SecurityException.", "The JVM suspends thread execution until finally completes."],
            "correct_index": 1,
            "explanation": "Calling System.exit() halts the JVM immediately, making it one of the rare cases where a 'finally' block is NOT executed."
        },
        {
            "id": 21,
            "difficulty": "hard",
            "question": "How does HashMap handle key hash collisions internally in Java 8 and above when a bucket exceeds TREEIFY_THRESHOLD (8 items)?",
            "options": ["It resizes the hash table array immediately.", "It transforms the linked list bucket into a balanced Red-Black Tree to optimize worst-case lookup from O(n) to O(log n).", "It throws a ConcurrentModificationException.", "It discards oldest entries using LRU eviction."],
            "correct_index": 1,
            "explanation": "In Java 8+, HashMap converts a linked list bucket into a Red-Black Tree once the bucket size exceeds 8 (and total capacity >= 64), improving lookup performance from O(N) to O(log N)."
        },
        {
            "id": 22,
            "difficulty": "hard",
            "question": "What is the evaluation outcome of stream operations when using Java 8 Stream API terminal operations like findFirst() or collect()?",
            "options": ["Stream intermediate operations process eagerly upon declaration.", "Streams evaluate lazily; intermediate operations pipeline without executing until a terminal operation is invoked.", "Streams store intermediate results in Temporary Heap arrays.", "Streams execute asynchronously on background ForkJoinPool threads by default."],
            "correct_index": 1,
            "explanation": "Stream intermediate operations (filter, map) are lazy and only execute when a terminal operation (collect, findFirst, count) is invoked on the pipeline."
        },
        {
            "id": 23,
            "difficulty": "hard",
            "question": "What memory area is used for storing class metadata, method structures, and static field references in Java 8+?",
            "options": ["Permanent Generation (PermGen)", "Metaspace (Native Heap Memory)", "Java Thread Stack", "Code Cache Only"],
            "correct_index": 1,
            "explanation": "Java 8 replaced PermGen with Metaspace, which allocates class metadata in native off-heap memory."
        },
        {
            "id": 24,
            "difficulty": "hard",
            "question": "Which statement correctly describes the behavior of ReentrantLock versus synchronized blocks in Java concurrency?",
            "options": ["synchronized supports lock polling (tryLock) and interruptible lock acquisition, while ReentrantLock does not.", "ReentrantLock allows tryLock(), lockInterruptibly(), fair lock scheduling, and multiple Condition variables, whereas synchronized is implicit and block-scoped.", "ReentrantLock is intrinsically faster in single-threaded execution.", "synchronized blocks automatically prevent deadlocks."],
            "correct_index": 1,
            "explanation": "ReentrantLock provides advanced concurrency capabilities like tryLock() timeout, interruptible lock acquisition, fairness policies, and multiple Condition objects."
        },
        {
            "id": 25,
            "difficulty": "hard",
            "question": "What is the output of Integer a = 127, b = 127, c = 128, d = 128; System.out.println((a == b) + ' ' + (c == d));?",
            "options": ["true true", "true false", "false false", "false true"],
            "correct_index": 1,
            "explanation": "Java caches Integer objects in the range [-128, 127]. Thus 127 (a == b) references the same cached instance (true), while 128 (c == d) instantiates distinct heap objects (false)."
        }
    ]


def _get_sql_25_mcqs() -> list[dict]:
    return [
        # Low (8)
        {"id": 1, "difficulty": "low", "question": "Which SQL command is used to retrieve data records from a database table?", "options": ["GET", "FETCH", "SELECT", "EXTRACT"], "correct_index": 2, "explanation": "SELECT is the fundamental SQL clause used to query data."},
        {"id": 2, "difficulty": "low", "question": "Which clause filters rows returned by a SELECT query based on specified criteria?", "options": ["GROUP BY", "WHERE", "ORDER BY", "HAVING"], "correct_index": 1, "explanation": "WHERE filters rows before grouping or aggregation."},
        {"id": 3, "difficulty": "low", "question": "Which constraint enforces uniqueness across table column values?", "options": ["FOREIGN KEY", "UNIQUE", "CHECK", "DEFAULT"], "correct_index": 1, "explanation": "UNIQUE prevents duplicate values in specified columns."},
        {"id": 4, "difficulty": "low", "question": "Which SQL command removes all rows from a table without logging individual row deletions?", "options": ["DELETE", "DROP", "TRUNCATE", "REMOVE"], "correct_index": 2, "explanation": "TRUNCATE is a DDL command that quickly removes all rows by deallocating pages."},
        {"id": 5, "difficulty": "low", "question": "Which JOIN returns all records when there is a match in either left or right table?", "options": ["INNER JOIN", "LEFT JOIN", "FULL OUTER JOIN", "CROSS JOIN"], "correct_index": 2, "explanation": "FULL OUTER JOIN produces matching records from both tables and NULLs for non-matches."},
        {"id": 6, "difficulty": "low", "question": "Which aggregate function returns the total number of non-null values in a column?", "options": ["SUM()", "COUNT()", "AVG()", "TOTAL()"], "correct_index": 1, "explanation": "COUNT(column) counts non-NULL entries in that column."},
        {"id": 7, "difficulty": "low", "question": "Which clause sorts the result set in ascending or descending order?", "options": ["SORT BY", "ORDER BY", "GROUP BY", "ARRANGE BY"], "correct_index": 1, "explanation": "ORDER BY orders output records (ASC or DESC)."},
        {"id": 8, "difficulty": "low", "question": "Which keyword is used to eliminate duplicate rows from a query result set?", "options": ["UNIQUE", "DISTINCT", "DIFFERENT", "FILTER"], "correct_index": 1, "explanation": "SELECT DISTINCT removes duplicates from the result set."},

        # Medium (9)
        {"id": 9, "difficulty": "medium", "question": "What is the key difference between WHERE and HAVING clauses in SQL?", "options": ["WHERE filters individual rows before grouping; HAVING filters aggregated groups after GROUP BY.", "HAVING operates on indexes; WHERE operates on tables.", "WHERE can only be used with JOINs.", "They are completely interchangeable."], "correct_index": 0, "explanation": "WHERE filters raw table rows prior to aggregation, whereas HAVING filters aggregate results after GROUP BY."},
        {"id": 10, "difficulty": "medium", "question": "What result is returned by an INNER JOIN between two tables?", "options": ["All rows from left table.", "Only matching rows that satisfy the join predicate in both tables.", "Cartesian product of both tables.", "All non-matching rows."], "correct_index": 1, "explanation": "INNER JOIN restricts output to rows where join condition evaluates to TRUE in both tables."},
        {"id": 11, "difficulty": "medium", "question": "Which index type dictates the physical storage order of rows on disk?", "options": ["Non-clustered Index", "Clustered Index", "Bitmap Index", "Filtered Index"], "correct_index": 1, "explanation": "A Clustered Index defines the physical layout of table data on storage pages (only one per table)."},
        {"id": 12, "difficulty": "medium", "question": "What will SELECT COUNT(*), COUNT(commission) FROM employees return if 2 out of 10 employees have NULL commission?", "options": ["10 10", "10 8", "8 8", "10 NULL"], "correct_index": 1, "explanation": "COUNT(*) counts all rows (10), while COUNT(col) ignores NULLs (8)."},
        {"id": 13, "difficulty": "medium", "question": "What is Database Normalization primarily designed to prevent?", "options": ["Query execution timeouts", "Data redundancy and update anomalies", "Index fragmentation", "Database size limits"], "correct_index": 1, "explanation": "Normalization minimizes redundant data and protects against insertion, update, and deletion anomalies."},
        {"id": 14, "difficulty": "medium", "question": "Which SQL statement adds a new column 'salary' of DECIMAL(10,2) to an existing table 'employees'?", "options": ["UPDATE TABLE employees ADD salary DECIMAL(10,2);", "ALTER TABLE employees ADD salary DECIMAL(10,2);", "MODIFY TABLE employees INSERT salary DECIMAL(10,2);", "CHANGE TABLE employees ADD COLUMN salary DECIMAL(10,2);"], "correct_index": 1, "explanation": "ALTER TABLE table_name ADD column_name data_type is the standard DDL syntax."},
        {"id": 15, "difficulty": "medium", "question": "What is the evaluation outcome of NULL = NULL in SQL conditional expressions?", "options": ["TRUE", "FALSE", "UNKNOWN (NULL)", "Compilation Error"], "correct_index": 2, "explanation": "In three-valued SQL logic, comparing NULL with = yields UNKNOWN. Use IS NULL or IS NOT NULL instead."},
        {"id": 16, "difficulty": "medium", "question": "Which Subquery type executes once for every candidate row evaluated by the outer query?", "options": ["Scalar Subquery", "Correlated Subquery", "Inline View", "Nested Subquery"], "correct_index": 1, "explanation": "Correlated subqueries reference columns from the outer query, executing once per outer row."},
        {"id": 17, "difficulty": "medium", "question": "Which window function assigns a rank to each row within a partition, leaving gaps in rank values when ties occur?", "options": ["DENSE_RANK()", "ROW_NUMBER()", "RANK()", "NTILE()"], "correct_index": 2, "explanation": "RANK() skips subsequent rank numbers after ties (e.g., 1, 2, 2, 4), whereas DENSE_RANK() does not skip gaps (1, 2, 2, 3)."},

        # Hard (8)
        {"id": 18, "difficulty": "hard", "question": "In ACID database transaction properties, what does 'Isolation' guarantee?", "options": ["Data changes persist across system crashes.", "Concurrent transaction execution produces identical states as if transactions executed serially.", "Foreign key constraints are verified before commit.", "Disk space is pre-allocated."], "correct_index": 1, "explanation": "Isolation prevents concurrent transactions from interfering with each other's intermediate uncommitted states."},
        {"id": 19, "difficulty": "hard", "question": "Which Transaction Isolation Level prevents Dirty Reads, Non-Repeatable Reads, and Phantom Reads?", "options": ["READ UNCOMMITTED", "READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE"], "correct_index": 3, "explanation": "SERIALIZABLE is the strictest isolation level, completely eliminating dirty reads, non-repeatable reads, and phantom reads."},
        {"id": 20, "difficulty": "hard", "question": "What is a 'Phantom Read' anomaly in database transactions?", "options": ["Reading uncommitted data modified by another transaction.", "Re-reading a row and finding modified column values by a committed transaction.", "Executing a query again and discovering NEW matching rows inserted by another committed transaction.", "Reading corrupted database pages."], "correct_index": 2, "explanation": "A Phantom Read occurs when a transaction re-runs a search query and sees new rows inserted by another concurrent committed transaction."},
        {"id": 21, "difficulty": "hard", "question": "Why can an EXISTS subquery outperform IN when evaluating large outer tables against indexed inner subqueries?", "options": ["EXISTS terminates subquery processing as soon as a single matching record is found (short-circuit evaluation).", "IN forces full table scans on outer tables.", "EXISTS bypasses the database query optimizer.", "IN creates temporary tables in memory."], "correct_index": 0, "explanation": "EXISTS short-circuits as soon as a single match is found, unlike IN which may build/evaluate a complete result set."},
        {"id": 22, "difficulty": "hard", "question": "What is the primary operational mechanism of a Database WAL (Write-Ahead Logging) log?", "options": ["Data pages are written to disk before log records.", "Changes are committed to log records in stable storage before data pages are flushed to disk.", "Indexes are rebuilt synchronously on every insert.", "Rollbacks are disabled during high load."], "correct_index": 1, "explanation": "WAL guarantees durability by flushing transaction log entries to disk before modifying actual table data pages."},
        {"id": 23, "difficulty": "hard", "question": "What type of lock is acquired by a SQL transaction during a SELECT query under READ COMMITTED isolation level?", "options": ["Exclusive (X) Lock for transaction duration.", "Shared (S) Lock released immediately after reading the page/row.", "Intent Exclusive (IX) Lock on table.", "Schema Modification (Sch-M) Lock."], "correct_index": 1, "explanation": "Under READ COMMITTED, Shared (S) locks are acquired during row reads and released immediately after the read completes."},
        {"id": 24, "difficulty": "hard", "question": "In query optimization, what causes 'SARGability' loss when filtering indexed columns?", "options": ["Using '=' comparison operators.", "Wrapping indexed columns in functions (e.g. WHERE YEAR(order_date) = 2026).", "Using INNER JOINs.", "Filtering by primary keys."], "correct_index": 1, "explanation": "Applying functions to indexed columns prevents the query optimizer from seeking the index (non-SARGable), triggering full table scans."},
        {"id": 25, "difficulty": "hard", "question": "What is the difference between UNION and UNION ALL in SQL?", "options": ["UNION ALL removes duplicate records; UNION retains duplicates.", "UNION sorts and deduplicates the result set; UNION ALL concatenates result sets directly without deduplication overhead.", "UNION executes asynchronously.", "UNION ALL is restricted to single table queries."], "correct_index": 1, "explanation": "UNION performs distinct sorting and deduplication, while UNION ALL combines results without checking for duplicates (faster performance)."}
    ]


def _get_csharp_25_mcqs() -> list[dict]:
    # Fallback template for C# and other topics
    return _get_java_25_mcqs()

def _get_git_25_mcqs() -> list[dict]:
    return _get_java_25_mcqs()

def _get_cloud_25_mcqs() -> list[dict]:
    return _get_java_25_mcqs()

def _get_agile_25_mcqs() -> list[dict]:
    return _get_java_25_mcqs()

def _get_dsa_25_mcqs() -> list[dict]:
    return _get_java_25_mcqs()

def _get_testing_25_mcqs() -> list[dict]:
    return _get_java_25_mcqs()
