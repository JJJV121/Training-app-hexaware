# backend/app/database/seed_data/java_mcq_bank_data.py
# Contains Question Bank Data mapped to Course Topics

RAW_MCQ_BANK = [
    # ============================================================
    # TOPIC 1: Introduction to Java (Unit 38)
    # ============================================================
    {
        "category": "java",
        "topic": "Introduction to Java",
        "subtopic": "Java Fundamentals & JVM",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "EASY",
        "question_type": "Definition",
        "question_text": "What does JVM stand for, and what is its basic role?",
        "option_a": "Java Verification Module, which only checks syntax errors",
        "option_b": "Java Virtual Machine, the runtime environment that executes compiled Java bytecode, providing platform independence by abstracting away the underlying operating system and hardware",
        "option_c": "Java Visual Manager, a tool for designing user interfaces",
        "option_d": "Java Variable Mapper, a tool for converting variable names",
        "correct_answer": "B",
        "correct_answer_text": "Java Virtual Machine, the runtime environment that executes compiled Java bytecode, providing platform independence by abstracting away the underlying operating system and hardware",
        "explanation": "The JVM (Java Virtual Machine) loads compiled .class bytecode files and executes/interprets them into machine-native code."
    },
    {
        "category": "java",
        "topic": "Introduction to Java",
        "subtopic": "Java Fundamentals & JVM",
        "set_name": "Set 1",
        "question_no": 2,
        "difficulty": "MEDIUM",
        "question_type": "Application",
        "question_text": "Why does Java's bytecode-based execution model support platform independence in a way that directly compiling to native machine code (like C) typically doesn't?",
        "option_a": "There is no actual difference in platform independence between these two compilation approaches",
        "option_b": "Bytecode is a platform-independent intermediate representation that any compatible JVM (regardless of the underlying OS/hardware) can execute, whereas native machine code is specific to a particular processor architecture and operating system, requiring separate compilation for each target platform",
        "option_c": "Native machine code is always more platform-independent than Java bytecode, the reverse of the actual relationship",
        "option_d": "Bytecode can only ever run on Windows operating systems, making it less platform-independent than native code",
        "correct_answer": "B",
        "correct_answer_text": "Bytecode is a platform-independent intermediate representation that any compatible JVM can execute.",
        "explanation": "Bytecode can run on any OS provided an appropriate JVM is installed."
    },
    {
        "category": "java",
        "topic": "Introduction to Java",
        "subtopic": "Java Fundamentals & JVM",
        "set_name": "Set 1",
        "question_no": 3,
        "difficulty": "MEDIUM",
        "question_type": "Comparison",
        "question_text": "How does Java's approach (compiling to bytecode, then JVM execution) compare to a purely interpreted language in terms of performance?",
        "option_a": "Java's approach always performs identically to a purely interpreted language",
        "option_b": "Java's combination of bytecode compilation and JIT compilation at runtime generally allows it to achieve performance closer to natively compiled languages for long-running code",
        "option_c": "Purely interpreted languages always outperform Java's bytecode-plus-JIT approach in every situation",
        "option_d": "Bytecode compilation always makes a program run significantly slower than pure interpretation",
        "correct_answer": "B",
        "correct_answer_text": "Java's combination of bytecode compilation and JIT compilation at runtime generally allows it to achieve performance closer to natively compiled languages.",
        "explanation": "JIT compilation compiles frequently executed bytecode into optimized native machine code at runtime."
    },
    {
        "category": "java",
        "topic": "Introduction to Java",
        "subtopic": "Setting Up & Running Java Programs",
        "set_name": "Set 1",
        "question_no": 6,
        "difficulty": "EASY",
        "question_type": "Concept",
        "question_text": "Which command-line tool is used to compile a Java source file (.java) into bytecode (.class)?",
        "option_a": "java",
        "option_b": "javac",
        "option_c": "javap",
        "option_d": "jar",
        "correct_answer": "B",
        "correct_answer_text": "javac",
        "explanation": "javac is the Java compiler tool."
    },
    {
        "category": "java",
        "topic": "Introduction to Java",
        "subtopic": "Setting Up & Running Java Programs",
        "set_name": "Set 1",
        "question_no": 7,
        "difficulty": "MEDIUM",
        "question_type": "Application",
        "question_text": "Which command-line tool is used to execute a compiled Java class containing a main method?",
        "option_a": "javac",
        "option_b": "java",
        "option_c": "javadoc",
        "option_d": "jshell",
        "correct_answer": "B",
        "correct_answer_text": "java",
        "explanation": "The java command launches the JVM to run compiled bytecode."
    },

    # ============================================================
    # TOPIC 2: Control Statements (Unit 39)
    # ============================================================
    {
        "category": "java",
        "topic": "Control Statements",
        "subtopic": "Control Flow Mechanics",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "MEDIUM",
        "question_type": "Code Snippet / Output",
        "question_text": "What is the output of the following code snippet?\nint x = 5;\nint y = 2;\nSystem.out.println(x / y);",
        "option_a": "2.5",
        "option_b": "2",
        "option_c": "2.0",
        "option_d": "An error, since integer division is not supported in Java",
        "correct_answer": "B",
        "correct_answer_text": "2",
        "explanation": "Integer division truncates the fractional part, yielding 2."
    },
    {
        "category": "java",
        "topic": "Control Statements",
        "subtopic": "Operators & Precedence",
        "set_name": "Set 1",
        "question_no": 2,
        "difficulty": "MEDIUM",
        "question_type": "Debugging",
        "question_text": "A developer writes 'int x = 5; int y = x++ + ++x;' What is the resulting value of y?",
        "option_a": "10",
        "option_b": "12",
        "option_c": "11",
        "option_d": "Compilation error",
        "correct_answer": "B",
        "correct_answer_text": "12",
        "explanation": "x++ evaluates to 5 and increments x to 6. ++x increments x to 7 and evaluates to 7. 5 + 7 = 12."
    },
    {
        "category": "java",
        "topic": "Control Statements",
        "subtopic": "Control Flow Mechanics",
        "set_name": "Set 1",
        "question_no": 3,
        "difficulty": "HARD",
        "question_type": "Code Snippet / Output",
        "question_text": "What happens in a switch statement if a matching case block does not end with a break statement?",
        "option_a": "A runtime exception is thrown",
        "option_b": "Execution falls through into the subsequent case blocks regardless of their case values until a break or end of switch is reached",
        "option_c": "The program immediately exits the switch statement",
        "option_d": "Compilation fails with a missing break error",
        "correct_answer": "B",
        "correct_answer_text": "Execution falls through into subsequent case blocks.",
        "explanation": "Without break, control continues executing following cases (fall-through)."
    },

    # ============================================================
    # TOPIC 3: Array (Unit 41)
    # ============================================================
    {
        "category": "java",
        "topic": "Array",
        "subtopic": "1D and 2D Arrays",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "EASY",
        "question_type": "Definition",
        "question_text": "How are array elements indexed in Java?",
        "option_a": "1-based indexing",
        "option_b": "0-based indexing",
        "option_c": "Key-based indexing",
        "option_d": "Dynamic hash indexing",
        "correct_answer": "B",
        "correct_answer_text": "0-based indexing",
        "explanation": "Arrays in Java use 0-based indexing (0 to length - 1)."
    },
    {
        "category": "java",
        "topic": "Array",
        "subtopic": "Jagged Arrays & Length",
        "set_name": "Set 1",
        "question_no": 2,
        "difficulty": "MEDIUM",
        "question_type": "Concept",
        "question_text": "What is a Jagged Array in Java?",
        "option_a": "An array with negative indices",
        "option_b": "A multidimensional array where member arrays can be of different lengths",
        "option_c": "An array that cannot be modified",
        "option_d": "An array storing different data types",
        "correct_answer": "B",
        "correct_answer_text": "A multidimensional array where member arrays can be of different lengths.",
        "explanation": "In Java, a 2D array is an array of arrays, allowing rows to have different lengths (jagged)."
    },
    {
        "category": "java",
        "topic": "Array",
        "subtopic": "Array Bounds",
        "set_name": "Set 1",
        "question_no": 3,
        "difficulty": "HARD",
        "question_type": "Debugging",
        "question_text": "What exception is thrown when accessing an array index less than 0 or greater than or equal to array.length?",
        "option_a": "NullPointerException",
        "option_b": "ArrayIndexOutOfBoundsException",
        "option_c": "IllegalArgumentException",
        "option_d": "ClassCastException",
        "correct_answer": "B",
        "correct_answer_text": "ArrayIndexOutOfBoundsException",
        "explanation": "Accessing invalid indices throws ArrayIndexOutOfBoundsException."
    },

    # ============================================================
    # TOPIC 4: OOP (Unit 42)
    # ============================================================
    {
        "category": "java",
        "topic": "OOP (Object-Oriented Programming)",
        "subtopic": "Encapsulation & Inheritance",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "EASY",
        "question_type": "Concept",
        "question_text": "Which pillar of Object-Oriented Programming hides internal object state behind private fields and public accessors?",
        "option_a": "Polymorphism",
        "option_b": "Encapsulation",
        "option_c": "Inheritance",
        "option_d": "Abstraction",
        "correct_answer": "B",
        "correct_answer_text": "Encapsulation",
        "explanation": "Encapsulation wraps data (variables) and code (methods) together and restricts direct external access."
    },
    {
        "category": "java",
        "topic": "OOP (Object-Oriented Programming)",
        "subtopic": "Polymorphism & Overriding",
        "set_name": "Set 1",
        "question_no": 2,
        "difficulty": "MEDIUM",
        "question_type": "Concept",
        "question_text": "What is the key difference between method Overloading and Method Overriding?",
        "option_a": "Overloading happens at runtime; Overriding happens at compile-time",
        "option_b": "Overloading requires same method name with different parameter signatures; Overriding redefines a superclass method in a subclass with identical signature",
        "option_c": "Overloading requires the abstract keyword",
        "option_d": "Overriding cannot be used with public methods",
        "correct_answer": "B",
        "correct_answer_text": "Overloading requires same method name with different parameters; Overriding redefines a superclass method with identical signature.",
        "explanation": "Overloading is compile-time polymorphism; overriding is runtime polymorphism."
    },
    {
        "category": "java",
        "topic": "OOP (Object-Oriented Programming)",
        "subtopic": "Inheritance",
        "set_name": "Set 1",
        "question_no": 3,
        "difficulty": "HARD",
        "question_type": "Application",
        "question_text": "Why does Java not support multiple inheritance of classes, and how is it resolved?",
        "option_a": "To reduce memory consumption; resolved by using static methods",
        "option_b": "To prevent the Diamond Problem where a subclass inherits conflicting implementations from multiple parent classes; resolved by using Interfaces",
        "option_c": "Java does support multiple inheritance of classes using super keyword",
        "option_d": "Multiple inheritance is allowed only for abstract classes",
        "correct_answer": "B",
        "correct_answer_text": "To prevent the Diamond Problem; resolved by using Interfaces.",
        "explanation": "Interfaces allow multiple inheritance of behavior without state conflicts."
    },

    # ============================================================
    # TOPIC 5: Interface & Abstract Classes (Unit 178)
    # ============================================================
    {
        "category": "java",
        "topic": "Interface & Abstract Classes",
        "subtopic": "Abstract Class vs Interface",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "MEDIUM",
        "question_type": "Comparison",
        "question_text": "How does an abstract class differ from an interface in Java?",
        "option_a": "Interfaces can have constructors, while abstract classes cannot",
        "option_b": "An abstract class can hold instance state (fields) and constructors, whereas an interface cannot hold instance fields",
        "option_c": "Classes can inherit multiple abstract classes but implement only one interface",
        "option_d": "Abstract classes cannot contain concrete methods",
        "correct_answer": "B",
        "correct_answer_text": "An abstract class can hold instance state and constructors, whereas an interface cannot hold instance fields.",
        "explanation": "Abstract classes allow state and constructors; interfaces define contracts."
    },
    {
        "category": "java",
        "topic": "Interface & Abstract Classes",
        "subtopic": "Default Methods",
        "set_name": "Set 1",
        "question_no": 2,
        "difficulty": "HARD",
        "question_type": "Concept",
        "question_text": "What happens if a class implements two interfaces that both declare an identical default method signature without overriding it?",
        "option_a": "The compiler automatically picks the first interface's implementation",
        "option_b": "Compilation error occurs due to duplicate default method conflict, requiring the implementing class to explicitly override the method",
        "option_c": "The JVM chooses the method at runtime randomly",
        "option_d": "Both methods are executed in sequence",
        "correct_answer": "B",
        "correct_answer_text": "Compilation error occurs due to duplicate default method conflict.",
        "explanation": "The class must resolve the ambiguity by explicitly overriding the method."
    },

    # ============================================================
    # TOPIC 6: Interface & String API (Unit 43)
    # ============================================================
    {
        "category": "java",
        "topic": "Interface/String API",
        "subtopic": "String Immutability & Pool",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "MEDIUM",
        "question_type": "Concept",
        "question_text": "Why are String objects immutable in Java?",
        "option_a": "To allow String objects to change size dynamically in memory",
        "option_b": "For security, thread-safety, hashcode caching, and String Constant Pool optimization",
        "option_c": "Because the JVM cannot allocate heap memory for Strings",
        "option_d": "Immutability is optional and can be turned off with a compiler flag",
        "correct_answer": "B",
        "correct_answer_text": "For security, thread-safety, hashcode caching, and String Constant Pool optimization.",
        "explanation": "Immutability ensures Strings cannot be altered after creation, making them safe for keys and network parameters."
    },
    {
        "category": "java",
        "topic": "Interface/String API",
        "subtopic": "StringBuilder vs StringBuffer",
        "set_name": "Set 1",
        "question_no": 2,
        "difficulty": "MEDIUM",
        "question_type": "Comparison",
        "question_text": "What is the primary difference between StringBuilder and StringBuffer?",
        "option_a": "StringBuilder is thread-safe (synchronized); StringBuffer is not",
        "option_b": "StringBuffer is thread-safe (synchronized); StringBuilder is non-synchronized and faster for single-threaded usage",
        "option_c": "StringBuilder is immutable; StringBuffer is mutable",
        "option_d": "There is no difference between them",
        "correct_answer": "B",
        "correct_answer_text": "StringBuffer is synchronized; StringBuilder is non-synchronized and faster.",
        "explanation": "StringBuilder avoids synchronization overhead for better performance in single-threaded contexts."
    },

    # ============================================================
    # TOPIC 7: Collections (Unit 46)
    # ============================================================
    {
        "category": "java",
        "topic": "Collections",
        "subtopic": "List vs Set vs Map",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "EASY",
        "question_type": "Concept",
        "question_text": "Which collection implementation guarantees unique elements and sorts them in natural ascending order?",
        "option_a": "ArrayList",
        "option_b": "HashSet",
        "option_c": "TreeSet",
        "option_d": "LinkedList",
        "correct_answer": "C",
        "correct_answer_text": "TreeSet",
        "explanation": "TreeSet maintains elements in a red-black tree, guaranteeing unique sorted order."
    },
    {
        "category": "java",
        "topic": "Collections",
        "subtopic": "HashMap Mechanics",
        "set_name": "Set 1",
        "question_no": 2,
        "difficulty": "HARD",
        "question_type": "Concept",
        "question_text": "How does HashMap handle hash collisions in Java 8 and above when a bucket exceeds TREEIFY_THRESHOLD (8 items)?",
        "option_a": "It resizes the entire hash table array immediately",
        "option_b": "It converts the linked list bucket into a balanced Red-Black Tree to improve worst-case lookup from O(n) to O(log n)",
        "option_c": "It throws a ConcurrentModificationException",
        "option_d": "It drops the oldest entries in the bucket",
        "correct_answer": "B",
        "correct_answer_text": "It converts the linked list bucket into a balanced Red-Black Tree.",
        "explanation": "Java 8 treeifies dense buckets to maintain O(log n) performance under high collisions."
    },

    # ============================================================
    # TOPIC 8: Java 8 Features - Lambda & Functional Interfaces (Unit 47)
    # ============================================================
    {
        "category": "java",
        "topic": "Java 8 Features - Lambda & Functional Interfaces",
        "subtopic": "Lambda Syntax & Variable Capture",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "MEDIUM",
        "question_type": "Concept",
        "question_text": "What restriction applies to local variables referenced inside a Java lambda expression?",
        "option_a": "Local variables must be declared global static",
        "option_b": "Local variables must be explicitly declared final or be effectively final (never reassigned after initialization)",
        "option_c": "Local variables must be primitive types only",
        "option_d": "There are no restrictions on captured local variables",
        "correct_answer": "B",
        "correct_answer_text": "Local variables must be final or effectively final.",
        "explanation": "Lambdas capture snapshots of local variables; reassigning them violates the effectively final requirement."
    },
    {
        "category": "java",
        "topic": "Java 8 Features - Lambda & Functional Interfaces",
        "subtopic": "Functional Interfaces",
        "set_name": "Set 1",
        "question_no": 2,
        "difficulty": "MEDIUM",
        "question_type": "Definition",
        "question_text": "Which built-in functional interface accepts one argument of type T and returns a boolean result?",
        "option_a": "Function<T, R>",
        "option_b": "Consumer<T>",
        "option_c": "Supplier<T>",
        "option_d": "Predicate<T>",
        "correct_answer": "D",
        "correct_answer_text": "Predicate<T>",
        "explanation": "Predicate<T> has method boolean test(T t)."
    },

    # ============================================================
    # TOPIC 9: Java 8 Features - Method References & Optional (Unit 53)
    # ============================================================
    {
        "category": "java",
        "topic": "Java 8 Features - Method References & Optional",
        "subtopic": "Optional API",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "MEDIUM",
        "question_type": "Best Approach",
        "question_text": "What is the main danger of calling .get() directly on an Optional object without checking isPresent() first?",
        "option_a": "It causes a compile-time error",
        "option_b": "It throws NoSuchElementException if the Optional is empty",
        "option_c": "It causes memory leak in the JVM heap",
        "option_d": "It returns null silently",
        "correct_answer": "B",
        "correct_answer_text": "It throws NoSuchElementException if the Optional is empty.",
        "explanation": "Calling get() on an empty Optional raises NoSuchElementException; use orElse()/orElseGet() instead."
    },
    {
        "category": "java",
        "topic": "Java 8 Features - Method References & Optional",
        "subtopic": "Method References",
        "set_name": "Set 1",
        "question_no": 2,
        "difficulty": "MEDIUM",
        "question_type": "Concept",
        "question_text": "What type of method reference does 'String::compareToIgnoreCase' represent?",
        "option_a": "Static method reference",
        "option_b": "Instance method reference on a particular object",
        "option_c": "Instance method reference on an arbitrary object of a particular type",
        "option_d": "Constructor reference",
        "correct_answer": "C",
        "correct_answer_text": "Instance method reference on an arbitrary object of a particular type.",
        "explanation": "String::compareToIgnoreCase references compareToIgnoreCase on whatever arbitrary String is passed as first argument."
    },

    # ============================================================
    # TOPIC 10: Java 8 Features - Date/Time API (Unit 54)
    # ============================================================
    {
        "category": "java",
        "topic": "Java 8 Features - Date/Time API",
        "subtopic": "Immutability & LocalDate",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "MEDIUM",
        "question_type": "Concept",
        "question_text": "What happens when date.plusDays(7) is called on a java.time.LocalDate object?",
        "option_a": "It mutates the date object in place",
        "option_b": "It returns a brand new LocalDate object with 7 days added, leaving the original date object completely unchanged",
        "option_c": "It throws an UnsupportedOperationException",
        "option_d": "It converts the date into a Timestamp",
        "correct_answer": "B",
        "correct_answer_text": "It returns a brand new LocalDate object, leaving the original object unchanged.",
        "explanation": "java.time classes are immutable and thread-safe; modification methods return new instances."
    },

    # ============================================================
    # TOPIC 11: Exception Handling (Unit 55)
    # ============================================================
    {
        "category": "java",
        "topic": "Exception Handling",
        "subtopic": "Checked vs Unchecked",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "MEDIUM",
        "question_type": "Concept",
        "question_text": "Which exception hierarchy subclass represents Unchecked Exceptions in Java?",
        "option_a": "java.lang.Exception",
        "option_b": "java.lang.RuntimeException",
        "option_c": "java.io.IOException",
        "option_d": "java.lang.Throwable",
        "correct_answer": "B",
        "correct_answer_text": "java.lang.RuntimeException",
        "explanation": "Subclasses of RuntimeException (and Error) are unchecked exceptions."
    },
    {
        "category": "java",
        "topic": "Exception Handling",
        "subtopic": "Try-With-Resources",
        "set_name": "Set 1",
        "question_no": 2,
        "difficulty": "HARD",
        "question_type": "Concept",
        "question_text": "What happens if System.exit(0) is executed inside a try block with an accompanying finally block?",
        "option_a": "The finally block completes execution before JVM exit",
        "option_b": "The finally block is bypassed and does NOT execute because the JVM terminates immediately",
        "option_c": "The finally block throws a SecurityException",
        "option_d": "The JVM suspends thread execution until finally completes",
        "correct_answer": "B",
        "correct_answer_text": "The finally block is bypassed and does NOT execute.",
        "explanation": "System.exit() halts the JVM process immediately, skipping finally execution."
    },

    # ============================================================
    # TOPIC 12: Stream API (Unit 59)
    # ============================================================
    {
        "category": "java",
        "topic": "Stream API",
        "subtopic": "Intermediate vs Terminal",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "MEDIUM",
        "question_type": "Concept",
        "question_text": "Which operation in Stream API is a Terminal operation?",
        "option_a": "filter()",
        "option_b": "map()",
        "option_c": "sorted()",
        "option_d": "collect()",
        "correct_answer": "D",
        "correct_answer_text": "collect()",
        "explanation": "collect() triggers processing and terminates the stream pipeline."
    },
    {
        "category": "java",
        "topic": "Stream API",
        "subtopic": "Collectors & Grouping",
        "set_name": "Set 1",
        "question_no": 2,
        "difficulty": "HARD",
        "question_type": "Application",
        "question_text": "What is the difference between map() and flatMap() in Stream API?",
        "option_a": "map() is terminal; flatMap() is intermediate",
        "option_b": "map() transforms each element into a single output element; flatMap() transforms each element into a stream of elements and flattens the resulting streams into one",
        "option_c": "flatMap() can only be used on numeric primitive streams",
        "option_d": "They perform identical transformations",
        "correct_answer": "B",
        "correct_answer_text": "map() transforms 1 to 1; flatMap() transforms 1 to Stream and flattens them.",
        "explanation": "flatMap flattens nested streams (Stream<Stream<T>> into Stream<T>)."
    },

    # ============================================================
    # TOPIC 13: Threads (Unit 60)
    # ============================================================
    {
        "category": "java",
        "topic": "Threads",
        "subtopic": "Concurrency & Virtual Threads",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "HARD",
        "question_type": "Concept",
        "question_text": "What is a key benefit of Virtual Threads (Project Loom) introduced in modern Java (JDK 21/25)?",
        "option_a": "They execute faster CPU-bound math calculations than OS threads",
        "option_b": "They are lightweight user-mode threads managed by the JVM, allowing high-throughput concurrent I/O with millions of virtual threads without 1:1 OS thread overhead",
        "option_c": "They eliminate the need for thread synchronization",
        "option_d": "They can only run on multi-socket servers",
        "correct_answer": "B",
        "correct_answer_text": "Lightweight user-mode threads allowing millions of concurrent I/O tasks without 1:1 OS thread overhead.",
        "explanation": "Virtual threads reduce thread memory footprint and context switching overhead for high-concurrency I/O workloads."
    },

    # ============================================================
    # TOPIC 14: JDBC & Best Practices (Unit 179)
    # ============================================================
    {
        "category": "java",
        "topic": "JDBC & Best Practices",
        "subtopic": "PreparedStatement & SQL Injection",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "MEDIUM",
        "question_type": "Best Approach",
        "question_text": "Why should PreparedStatement be preferred over Statement for executing SQL queries in Java?",
        "option_a": "PreparedStatement executes queries asynchronously",
        "option_b": "PreparedStatement pre-compiles SQL, improves performance for repeated executions, and automatically prevents SQL injection attacks via parameterized inputs",
        "option_c": "Statement cannot return ResultSet data",
        "option_d": "PreparedStatement automatically commits transactions after every line",
        "correct_answer": "B",
        "correct_answer_text": "Pre-compiles SQL, improves performance, and prevents SQL injection via parameterized inputs.",
        "explanation": "PreparedStatement uses placeholders (?) to sanitize input and prevent SQL injection."
    },

    # ============================================================
    # TOPIC 15: Testing Fundamentals (Unit 180)
    # ============================================================
    {
        "category": "junit",
        "topic": "Testing Fundamentals",
        "subtopic": "Testing Lifecycle & Types",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "EASY",
        "question_type": "Definition",
        "question_text": "What is the primary purpose of Unit Testing in software development?",
        "option_a": "To test end-to-end user workflows across multiple systems",
        "option_b": "To verify the smallest isolated unit of code (like a single method or class) behaves correctly in isolation",
        "option_c": "To test network server performance under load",
        "option_d": "To test UI color themes on client browsers",
        "correct_answer": "B",
        "correct_answer_text": "To verify the smallest isolated unit of code behaves correctly in isolation.",
        "explanation": "Unit testing checks individual units/components in isolation."
    },

    # ============================================================
    # TOPIC 16: JUnit (Unit 181)
    # ============================================================
    {
        "category": "junit",
        "topic": "JUnit",
        "subtopic": "JUnit 5 Annotations & Assertions",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "EASY",
        "question_type": "Concept",
        "question_text": "Which JUnit 5 annotation marks a method to execute before EACH individual test method in a test class?",
        "option_a": "@BeforeAll",
        "option_b": "@BeforeEach",
        "option_c": "@Test",
        "option_d": "@Setup",
        "correct_answer": "B",
        "correct_answer_text": "@BeforeEach",
        "explanation": "@BeforeEach runs before every single @Test method to set up test state."
    },
    {
        "category": "junit",
        "topic": "JUnit",
        "subtopic": "Exception Verification",
        "set_name": "Set 1",
        "question_no": 2,
        "difficulty": "MEDIUM",
        "question_type": "Application",
        "question_text": "Which JUnit 5 assertion method verifies that an executable lambda throws an expected exception?",
        "option_a": "assertTrue()",
        "option_b": "assertThrows()",
        "option_c": "assertEquals()",
        "option_d": "assertNull()",
        "correct_answer": "B",
        "correct_answer_text": "assertThrows()",
        "explanation": "assertThrows(ExpectedException.class, () -> code) asserts that an exception is thrown."
    },
    {
        "category": "junit",
        "topic": "JUnit",
        "subtopic": "Parameterized Tests",
        "set_name": "Set 1",
        "question_no": 3,
        "difficulty": "HARD",
        "question_type": "Concept",
        "question_text": "Which annotation combination in JUnit 5 executes a single test method multiple times using comma-separated argument pairs?",
        "option_a": "@Test with @ValueSource",
        "option_b": "@ParameterizedTest with @CsvSource",
        "option_c": "@RepeatedTest with @BeforeEach",
        "option_d": "@Test with @MethodSource",
        "correct_answer": "B",
        "correct_answer_text": "@ParameterizedTest with @CsvSource",
        "explanation": "@CsvSource supplies structured CSV rows of arguments to a @ParameterizedTest method."
    },

    # ============================================================
    # TOPIC 17: Mockito & Mocking Frameworks (Unit 182)
    # ============================================================
    {
        "category": "junit",
        "topic": "Mockito",
        "subtopic": "Mocking Dependencies",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "MEDIUM",
        "question_type": "Concept",
        "question_text": "What does the @Mock annotation in Mockito accomplish?",
        "option_a": "It executes the real dependency logic against a live database",
        "option_b": "It creates a dummy mock instance of a class/interface to stub method return values and isolate the class under test",
        "option_c": "It disables unit test execution",
        "option_d": "It compiles bytecode into native binaries",
        "correct_answer": "B",
        "correct_answer_text": "Creates a dummy mock instance to stub method returns and isolate unit tests.",
        "explanation": "Mocking isolates unit tests from external dependencies like DAOs or remote APIs."
    },

    # ============================================================
    # CATEGORY: Problem Solving & Data Structures (dsa)
    # ============================================================
    {
        "category": "dsa",
        "topic": "Algorithm Basics",
        "subtopic": "Time & Space Complexity",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "MEDIUM",
        "question_type": "Concept",
        "question_text": "What is the average time complexity of searching an element in a balanced Binary Search Tree (BST)?",
        "option_a": "O(1)",
        "option_b": "O(log N)",
        "option_c": "O(N)",
        "option_d": "O(N^2)",
        "correct_answer": "B",
        "correct_answer_text": "O(log N)",
        "explanation": "A balanced BST cuts search space in half at each step, taking O(log N) time."
    },
    {
        "category": "dsa",
        "topic": "Sorting Techniques",
        "subtopic": "Quick Sort & Merge Sort",
        "set_name": "Set 1",
        "question_no": 2,
        "difficulty": "HARD",
        "question_type": "Comparison",
        "question_text": "Why is Merge Sort preferred over Quick Sort for sorting linked lists?",
        "option_a": "Merge Sort takes O(1) auxiliary space on linked lists because pointer manipulation does not require extra arrays",
        "option_b": "Quick Sort requires random access to elements which is O(N) in linked lists",
        "option_c": "Both A and B",
        "option_d": "Merge Sort has a lower worst-case time complexity than Quick Sort",
        "correct_answer": "C",
        "correct_answer_text": "Both A and B",
        "explanation": "Merge sort works efficiently with sequential pointers without random access overhead."
    },

    # ============================================================
    # CATEGORY: Agile & Scrum (agile)
    # ============================================================
    {
        "category": "agile",
        "topic": "Agile & Scrum (Practical)",
        "subtopic": "Scrum Roles & Events",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "MEDIUM",
        "question_type": "Concept",
        "question_text": "Who is responsible for prioritizing the Product Backlog items in Scrum?",
        "option_a": "Scrum Master",
        "option_b": "Product Owner",
        "option_c": "Development Team",
        "option_d": "Agile Coach",
        "correct_answer": "B",
        "correct_answer_text": "Product Owner",
        "explanation": "The Product Owner owns product vision and backlog prioritization."
    },

    # ============================================================
    # CATEGORY: MySQL 8.4 LTS (mysql)
    # ============================================================
    {
        "category": "mysql",
        "topic": "MySQL 8.4 LTS",
        "subtopic": "Querying Data by Using Joins",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "MEDIUM",
        "question_type": "Concept",
        "question_text": "What does a LEFT JOIN return in MySQL?",
        "option_a": "Only matching rows in both left and right tables",
        "option_b": "All rows from the left table and matching rows from the right table (with NULLs for non-matching right table columns)",
        "option_c": "All rows from the right table only",
        "option_d": "Cartesian product of both tables",
        "correct_answer": "B",
        "correct_answer_text": "All rows from the left table and matching rows from the right table.",
        "explanation": "LEFT JOIN keeps all left table rows regardless of right table matches."
    },

    # ============================================================
    # CATEGORY: Git (git)
    # ============================================================
    {
        "category": "git",
        "topic": "Git",
        "subtopic": "Git Commands & Workflows",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "MEDIUM",
        "question_type": "Concept",
        "question_text": "What is the difference between 'git merge' and 'git rebase'?",
        "option_a": "git merge creates a merge commit preserving branch history; git rebase applies commits sequentially on top of the target branch for a linear history",
        "option_b": "git rebase deletes uncommitted files",
        "option_c": "git merge works only on remote branches",
        "option_d": "They perform identical actions",
        "correct_answer": "A",
        "correct_answer_text": "git merge preserves branch history via a merge commit; git rebase creates a linear history.",
        "explanation": "Rebase rewrites commit history onto a new base."
    },

    # ============================================================
    # CATEGORY: Cloud (cloud)
    # ============================================================
    {
        "category": "cloud",
        "topic": "Cloud Basics - AWS, Azure",
        "subtopic": "Containers & Cloud Services",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "MEDIUM",
        "question_type": "Concept",
        "question_text": "What is a key difference between a Virtual Machine (VM) and a Docker Container?",
        "option_a": "VMs share the host OS kernel; Containers run full guest operating systems",
        "option_b": "Containers virtualize at the OS level sharing the host OS kernel (lightweight), whereas VMs virtualize at hardware level with full guest OS",
        "option_c": "Docker containers require dedicated hardware hypervisors",
        "option_d": "VMs boot in milliseconds compared to containers",
        "correct_answer": "B",
        "correct_answer_text": "Containers share host OS kernel; VMs run full guest OS on hardware hypervisors.",
        "explanation": "Containers are lightweight because they share the host operating system kernel."
    },

    # ============================================================
    # CATEGORY: GenAI (genai)
    # ============================================================
    {
        "category": "genai",
        "topic": "Generative AI (GenAI) & Prompt Engineering",
        "subtopic": "Prompt Engineering & MCP",
        "set_name": "Set 1",
        "question_no": 1,
        "difficulty": "MEDIUM",
        "question_type": "Concept",
        "question_text": "What is 'Few-shot Prompting' in Large Language Model (LLM) interaction?",
        "option_a": "Sending prompts without any instructions",
        "option_b": "Providing a few explicit input-output demonstration examples inside the prompt to guide model behavior",
        "option_c": "Retraining LLM model weights using fine-tuning",
        "option_d": "Limiting prompt tokens to 10 words",
        "correct_answer": "B",
        "correct_answer_text": "Providing a few explicit input-output demonstration examples inside the prompt.",
        "explanation": "Few-shot prompting provides contextual examples to guide LLM responses."
    }
]
