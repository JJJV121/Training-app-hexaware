"""
Training Plan Question & Test Case Registry
Contains real, Training-Plan specific questions (3 per assignment day)
and exactly 10 test cases per question (30 test cases per assignment).
"""

TRAINING_PLAN_QUESTIONS = {
    # -------------------------------------------------------------
    # DAY 3: MySQL Basics & DML
    # -------------------------------------------------------------
    3: [
        {
            "id": 1,
            "title": "Employee Salary & Department JOIN Analysis",
            "problem_statement": "Write a SQL query using INNER JOIN to list employee names, department names, and salaries where salary > 50000.",
            "input_format": "Tables: employees(id, name, salary, dept_id), departments(id, dept_name)",
            "output_format": "Columns: name, dept_name, salary sorted by salary DESC",
            "constraints": "Standard ANSI SQL syntax.",
            "sample_input": "employees: (1, 'Alice', 60000, 101), (2, 'Bob', 45000, 102)\ndepartments: (101, 'Engineering'), (102, 'HR')",
            "sample_output": "Alice | Engineering | 60000",
            "explanation": "Alice is returned because her salary 60000 > 50000. Bob is excluded.",
            "language": "mysql",
            "starter_code": "SELECT e.name, d.dept_name, e.salary\nFROM employees e\nJOIN departments d ON e.dept_id = d.id\nWHERE e.salary > 50000\nORDER BY e.salary DESC;",
            "reference_solution": "SELECT e.name, d.dept_name, e.salary FROM employees e JOIN departments d ON e.dept_id = d.id WHERE e.salary > 50000 ORDER BY e.salary DESC;",
            "test_cases": [
                {"id": 1, "input": "employees: 2 rows", "expected_output": "Alice | Engineering | 60000", "is_hidden": False},
                {"id": 2, "input": "employees: 5 rows", "expected_output": "Charlie | Engineering | 85000\nAlice | Engineering | 60000", "is_hidden": False},
                {"id": 3, "input": "employees: 1 row below 50k", "expected_output": "NO_ROWS", "is_hidden": False},
                {"id": 4, "input": "employees: 10 rows boundary 50000", "expected_output": "David | Sales | 50001", "is_hidden": True},
                {"id": 5, "input": "employees: null dept_id", "expected_output": "NO_ROWS", "is_hidden": True},
                {"id": 6, "input": "employees: duplicate salaries", "expected_output": "Eve | Sales | 70000\nFrank | Sales | 70000", "is_hidden": True},
                {"id": 7, "input": "employees: max salary 1,000,000", "expected_output": "CEO | Executive | 1000000", "is_hidden": True},
                {"id": 8, "input": "employees: empty dataset", "expected_output": "NO_ROWS", "is_hidden": True},
                {"id": 9, "input": "employees: 100 rows stress", "expected_output": "10 rows returned sorted DESC", "is_hidden": True},
                {"id": 10, "input": "employees: boundary 50000 exact", "expected_output": "NO_ROWS", "is_hidden": True}
            ]
        },
        {
            "id": 2,
            "title": "High Earners Correlated Subquery",
            "problem_statement": "Write a SQL query using a correlated subquery to find employees whose salary is greater than the average salary of their respective department.",
            "input_format": "Table: employees(id, name, salary, dept_id)",
            "output_format": "Columns: id, name, salary, dept_id",
            "constraints": "Must use correlated subquery.",
            "sample_input": "dept 101 salaries: 60000, 40000 (avg 50000)",
            "sample_output": "1 | Alice | 60000 | 101",
            "explanation": "Alice's salary 60000 > dept average 50000.",
            "language": "mysql",
            "starter_code": "SELECT e.id, e.name, e.salary, e.dept_id\nFROM employees e\nWHERE e.salary > (\n    SELECT AVG(emp.salary)\n    FROM employees emp\n    WHERE emp.dept_id = e.dept_id\n);",
            "reference_solution": "SELECT e.id, e.name, e.salary, e.dept_id FROM employees e WHERE e.salary > (SELECT AVG(emp.salary) FROM employees emp WHERE emp.dept_id = e.dept_id);",
            "test_cases": [
                {"id": 1, "input": "dept 101: 60k, 40k", "expected_output": "Alice | 60000", "is_hidden": False},
                {"id": 2, "input": "dept 102: all equal 50k", "expected_output": "NO_ROWS", "is_hidden": False},
                {"id": 3, "input": "single employee in dept", "expected_output": "NO_ROWS", "is_hidden": False},
                {"id": 4, "input": "multi depts (101, 102, 103)", "expected_output": "3 rows returned", "is_hidden": True},
                {"id": 5, "input": "large variance 100k vs 10k", "expected_output": "High Earner | 100000", "is_hidden": True},
                {"id": 6, "input": "negative values guard", "expected_output": "NO_ROWS", "is_hidden": True},
                {"id": 7, "input": "100 employees in 5 depts", "expected_output": "42 rows returned", "is_hidden": True},
                {"id": 8, "input": "duplicate salaries above avg", "expected_output": "EmpA | 80k, EmpB | 80k", "is_hidden": True},
                {"id": 9, "input": "min salary 1", "expected_output": "EmpX | 20", "is_hidden": True},
                {"id": 10, "input": "dept with 10k items", "expected_output": "5000 rows returned", "is_hidden": True}
            ]
        },
        {
            "id": 3,
            "title": "Department DML Salary Adjustment",
            "problem_statement": "Write an UPDATE statement to increase salary by 10% for all employees working in department 'Engineering'.",
            "input_format": "Tables: employees, departments",
            "output_format": "Updated employees table",
            "constraints": "Use UPDATE with JOIN or subquery.",
            "sample_input": "Engineering employee salary 50000",
            "sample_output": "Salary updated to 55000",
            "explanation": "50000 * 1.10 = 55000.",
            "language": "mysql",
            "starter_code": "UPDATE employees\nSET salary = salary * 1.10\nWHERE dept_id IN (\n    SELECT id FROM departments WHERE dept_name = 'Engineering'\n);",
            "reference_solution": "UPDATE employees SET salary = salary * 1.10 WHERE dept_id IN (SELECT id FROM departments WHERE dept_name = 'Engineering');",
            "test_cases": [
                {"id": 1, "input": "Engineering salary 50000", "expected_output": "Updated to 55000", "is_hidden": False},
                {"id": 2, "input": "Sales salary 40000", "expected_output": "Unchanged 40000", "is_hidden": False},
                {"id": 3, "input": "Engineering salary 100000", "expected_output": "Updated to 110000", "is_hidden": False},
                {"id": 4, "input": "0 employees in Engineering", "expected_output": "0 rows affected", "is_hidden": True},
                {"id": 5, "input": "Multiple Engineering employees", "expected_output": "All updated +10%", "is_hidden": True},
                {"id": 6, "input": "Case insensitive 'engineering'", "expected_output": "Updated +10%", "is_hidden": True},
                {"id": 7, "input": "Decimal salary 5000.50", "expected_output": "Updated to 5500.55", "is_hidden": True},
                {"id": 8, "input": "Min salary 100", "expected_output": "Updated to 110", "is_hidden": True},
                {"id": 9, "input": "Max salary 500000", "expected_output": "Updated to 550000", "is_hidden": True},
                {"id": 10, "input": "Non-matching department", "expected_output": "0 rows updated", "is_hidden": True}
            ]
        }
    ],

    # -------------------------------------------------------------
    # DAY 7: Core Java OOP (Inheritance, Polymorphism, Interfaces)
    # -------------------------------------------------------------
    7: [
        {
            "id": 1,
            "title": "Vehicle Fleet Hierarchy (Abstract Class)",
            "problem_statement": "Implement class Car extending abstract class Vehicle. Override method calculateFare(double distance) returning distance * 15.0.",
            "input_format": "double distance",
            "output_format": "double fare",
            "constraints": "distance >= 0.0",
            "sample_input": "10.0",
            "sample_output": "150.0",
            "explanation": "10.0 * 15.0 = 150.0.",
            "language": "java",
            "starter_code": "public class Car extends Vehicle {\n    @Override\n    public double calculateFare(double distance) {\n        return distance * 15.0;\n    }\n}",
            "reference_solution": "public class Car extends Vehicle { @Override public double calculateFare(double distance) { return distance * 15.0; } }",
            "test_cases": [
                {"id": 1, "input": "10.0", "expected_output": "150.0", "is_hidden": False},
                {"id": 2, "input": "0.0", "expected_output": "0.0", "is_hidden": False},
                {"id": 3, "input": "2.5", "expected_output": "37.5", "is_hidden": False},
                {"id": 4, "input": "100.0", "expected_output": "1500.0", "is_hidden": True},
                {"id": 5, "input": "0.1", "expected_output": "1.5", "is_hidden": True},
                {"id": 6, "input": "999.9", "expected_output": "14998.5", "is_hidden": True},
                {"id": 7, "input": "50.0", "expected_output": "750.0", "is_hidden": True},
                {"id": 8, "input": "1.0", "expected_output": "15.0", "is_hidden": True},
                {"id": 9, "input": "10000.0", "expected_output": "150000.0", "is_hidden": True},
                {"id": 10, "input": "0.001", "expected_output": "0.015", "is_hidden": True}
            ]
        },
        {
            "id": 2,
            "title": "Employee Payroll System (Polymorphism)",
            "problem_statement": "Implement class FullTimeEmployee extending Employee. Implement calculateBonus() returning 20% of baseSalary.",
            "input_format": "double baseSalary",
            "output_format": "double bonus",
            "constraints": "baseSalary >= 0",
            "sample_input": "50000.0",
            "sample_output": "10000.0",
            "explanation": "50000 * 0.20 = 10000.",
            "language": "java",
            "starter_code": "public class FullTimeEmployee extends Employee {\n    public FullTimeEmployee(double baseSalary) {\n        super(baseSalary);\n    }\n    @Override\n    public double calculateBonus() {\n        return getBaseSalary() * 0.20;\n    }\n}",
            "reference_solution": "public class FullTimeEmployee extends Employee { public FullTimeEmployee(double s) { super(s); } @Override public double calculateBonus() { return getBaseSalary() * 0.20; } }",
            "test_cases": [
                {"id": 1, "input": "50000.0", "expected_output": "10000.0", "is_hidden": False},
                {"id": 2, "input": "0.0", "expected_output": "0.0", "is_hidden": False},
                {"id": 3, "input": "100000.0", "expected_output": "20000.0", "is_hidden": False},
                {"id": 4, "input": "75000.50", "expected_output": "15000.10", "is_hidden": True},
                {"id": 5, "input": "1200.0", "expected_output": "240.0", "is_hidden": True},
                {"id": 6, "input": "500.0", "expected_output": "100.0", "is_hidden": True},
                {"id": 7, "input": "1000000.0", "expected_output": "200000.0", "is_hidden": True},
                {"id": 8, "input": "1.0", "expected_output": "0.20", "is_hidden": True},
                {"id": 9, "input": "8888.88", "expected_output": "1777.776", "is_hidden": True},
                {"id": 10, "input": "99999.0", "expected_output": "19999.8", "is_hidden": True}
            ]
        },
        {
            "id": 3,
            "title": "Shape Area & Perimeter Calculator (Interface)",
            "problem_statement": "Implement interface Shape with methods getArea() and getPerimeter() in class Rectangle.",
            "input_format": "double length, double width",
            "output_format": "double area, double perimeter",
            "constraints": "length > 0, width > 0",
            "sample_input": "length=5.0, width=4.0",
            "sample_output": "Area: 20.0, Perimeter: 18.0",
            "explanation": "Area = 5 * 4 = 20. Perimeter = 2 * (5 + 4) = 18.",
            "language": "java",
            "starter_code": "public class Rectangle implements Shape {\n    private double length;\n    private double width;\n    public Rectangle(double length, double width) {\n        this.length = length;\n        this.width = width;\n    }\n    public double getArea() { return length * width; }\n    public double getPerimeter() { return 2 * (length + width); }\n}",
            "reference_solution": "public class Rectangle implements Shape { private double l, w; public Rectangle(double l, double w) { this.l = l; this.w = w; } public double getArea() { return l * w; } public double getPerimeter() { return 2 * (l + w); } }",
            "test_cases": [
                {"id": 1, "input": "5.0, 4.0", "expected_output": "Area: 20.0, Perimeter: 18.0", "is_hidden": False},
                {"id": 2, "input": "10.0, 10.0", "expected_output": "Area: 100.0, Perimeter: 40.0", "is_hidden": False},
                {"id": 3, "input": "1.0, 1.0", "expected_output": "Area: 1.0, Perimeter: 4.0", "is_hidden": False},
                {"id": 4, "input": "2.5, 4.0", "expected_output": "Area: 10.0, Perimeter: 13.0", "is_hidden": True},
                {"id": 5, "input": "100.0, 50.0", "expected_output": "Area: 5000.0, Perimeter: 300.0", "is_hidden": True},
                {"id": 6, "input": "0.5, 0.5", "expected_output": "Area: 0.25, Perimeter: 2.0", "is_hidden": True},
                {"id": 7, "input": "12.0, 3.0", "expected_output": "Area: 36.0, Perimeter: 30.0", "is_hidden": True},
                {"id": 8, "input": "7.0, 8.0", "expected_output": "Area: 56.0, Perimeter: 30.0", "is_hidden": True},
                {"id": 9, "input": "15.5, 2.0", "expected_output": "Area: 31.0, Perimeter: 35.0", "is_hidden": True},
                {"id": 10, "input": "1000.0, 1000.0", "expected_output": "Area: 1000000.0, Perimeter: 4000.0", "is_hidden": True}
            ]
        }
    ],

    # -------------------------------------------------------------
    # DAY 9: Collections Framework (ArrayList, HashMap, HashSet)
    # -------------------------------------------------------------
    9: [
        {
            "id": 1,
            "title": "Frequency Counter Using HashMap",
            "problem_statement": "Given an array of integers, count the frequency of each distinct element using a HashMap and return a Map<Integer, Integer>.",
            "input_format": "int[] numbers",
            "output_format": "Map<Integer, Integer> frequencyMap",
            "constraints": "1 <= numbers.length <= 1000",
            "sample_input": "[1, 2, 2, 3, 3, 3]",
            "sample_output": "{1: 1, 2: 2, 3: 3}",
            "explanation": "1 appears once, 2 appears twice, 3 appears thrice.",
            "language": "java",
            "starter_code": "import java.util.*;\npublic class FrequencyCounter {\n    public static Map<Integer, Integer> countFrequency(int[] numbers) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int num : numbers) {\n            map.put(num, map.getOrDefault(num, 0) + 1);\n        }\n        return map;\n    }\n}",
            "reference_solution": "import java.util.*; public class FrequencyCounter { public static Map<Integer, Integer> countFrequency(int[] nums) { Map<Integer, Integer> m = new HashMap<>(); for (int n : nums) m.put(n, m.getOrDefault(n, 0) + 1); return m; } }",
            "test_cases": [
                {"id": 1, "input": "[1, 2, 2, 3, 3, 3]", "expected_output": "{1: 1, 2: 2, 3: 3}", "is_hidden": False},
                {"id": 2, "input": "[5, 5, 5, 5]", "expected_output": "{5: 4}", "is_hidden": False},
                {"id": 3, "input": "[10]", "expected_output": "{10: 1}", "is_hidden": False},
                {"id": 4, "input": "[1, 2, 3, 4, 5]", "expected_output": "{1: 1, 2: 1, 3: 1, 4: 1, 5: 1}", "is_hidden": True},
                {"id": 5, "input": "[-1, -1, 0, 1]", "expected_output": "{-1: 2, 0: 1, 1: 1}", "is_hidden": True},
                {"id": 6, "input": "empty array []", "expected_output": "{}", "is_hidden": True},
                {"id": 7, "input": "[100, 200, 100, 300, 200, 100]", "expected_output": "{100: 3, 200: 2, 300: 1}", "is_hidden": True},
                {"id": 8, "input": "array of 1000 identical elements", "expected_output": "{7: 1000}", "is_hidden": True},
                {"id": 9, "input": "alternating elements [1, 2, 1, 2]", "expected_output": "{1: 2, 2: 2}", "is_hidden": True},
                {"id": 10, "input": "large numbers [999999, 999999]", "expected_output": "{999999: 2}", "is_hidden": True}
            ]
        },
        {
            "id": 2,
            "title": "Remove Duplicates Using HashSet",
            "problem_statement": "Given a List<Integer>, remove duplicate values using a HashSet and return a List<Integer> containing unique elements in sorted order.",
            "input_format": "List<Integer> list",
            "output_format": "List<Integer> uniqueSortedList",
            "constraints": "List elements -10^5 to 10^5",
            "sample_input": "[4, 2, 4, 1, 2, 3]",
            "sample_output": "[1, 2, 3, 4]",
            "explanation": "Duplicates (4, 2) removed, sorted result is [1, 2, 3, 4].",
            "language": "java",
            "starter_code": "import java.util.*;\npublic class DuplicateRemover {\n    public static List<Integer> removeDuplicates(List<Integer> list) {\n        Set<Integer> set = new HashSet<>(list);\n        List<Integer> result = new ArrayList<>(set);\n        Collections.sort(result);\n        return result;\n    }\n}",
            "reference_solution": "import java.util.*; public class DuplicateRemover { public static List<Integer> removeDuplicates(List<Integer> list) { Set<Integer> s = new HashSet<>(list); List<Integer> r = new ArrayList<>(s); Collections.sort(r); return r; } }",
            "test_cases": [
                {"id": 1, "input": "[4, 2, 4, 1, 2, 3]", "expected_output": "[1, 2, 3, 4]", "is_hidden": False},
                {"id": 2, "input": "[1, 1, 1, 1]", "expected_output": "[1]", "is_hidden": False},
                {"id": 3, "input": "[10, 20, 30]", "expected_output": "[10, 20, 30]", "is_hidden": False},
                {"id": 4, "input": "[-5, 0, -5, 10]", "expected_output": "[-5, 0, 10]", "is_hidden": True},
                {"id": 5, "input": "empty list []", "expected_output": "[]", "is_hidden": True},
                {"id": 6, "input": "[100, 99, 98, 97]", "expected_output": "[97, 98, 99, 100]", "is_hidden": True},
                {"id": 7, "input": "[5, 5, 4, 4, 3, 3, 2, 2, 1, 1]", "expected_output": "[1, 2, 3, 4, 5]", "is_hidden": True},
                {"id": 8, "input": "[0]", "expected_output": "[0]", "is_hidden": True},
                {"id": 9, "input": "list with 500 duplicates", "expected_output": "sorted unique list", "is_hidden": True},
                {"id": 10, "input": "[-100, 100, -100]", "expected_output": "[-100, 100]", "is_hidden": True}
            ]
        },
        {
            "id": 3,
            "title": "ArrayList Manipulation & Sorting",
            "problem_statement": "Given an ArrayList of strings, remove strings with length less than 4, convert remaining to uppercase, and sort alphabetically.",
            "input_format": "List<String> words",
            "output_format": "List<String> processedWords",
            "constraints": "Words non-null",
            "sample_input": "[\"cat\", \"elephant\", \"dog\", \"tiger\", \"lion\"]",
            "sample_output": "[\"ELEPHANT\", \"LION\", \"TIGER\"]",
            "explanation": "\"cat\" and \"dog\" length < 4 (removed). \"elephant\", \"lion\", \"tiger\" uppercase & sorted.",
            "language": "java",
            "starter_code": "import java.util.*;\nimport java.util.stream.Collectors;\npublic class ArrayListProcessor {\n    public static List<String> processList(List<String> words) {\n        return words.stream()\n            .filter(w -> w.length() >= 4)\n            .map(String::toUpperCase)\n            .sorted()\n            .collect(Collectors.toList());\n    }\n}",
            "reference_solution": "import java.util.*; import java.util.stream.Collectors; public class ArrayListProcessor { public static List<String> processList(List<String> w) { return w.stream().filter(s -> s.length() >= 4).map(String::toUpperCase).sorted().collect(Collectors.toList()); } }",
            "test_cases": [
                {"id": 1, "input": "[\"cat\", \"elephant\", \"dog\", \"tiger\", \"lion\"]", "expected_output": "[\"ELEPHANT\", \"LION\", \"TIGER\"]", "is_hidden": False},
                {"id": 2, "input": "[\"java\", \"c\", \"cpp\", \"python\"]", "expected_output": "[\"JAVA\", \"PYTHON\"]", "is_hidden": False},
                {"id": 3, "input": "[\"a\", \"bb\", \"ccc\"]", "expected_output": "[]", "is_hidden": False},
                {"id": 4, "input": "[\"code\", \"test\", \"exam\"]", "expected_output": "[\"CODE\", \"EXAM\", \"TEST\"]", "is_hidden": True},
                {"id": 5, "input": "empty list []", "expected_output": "[]", "is_hidden": True},
                {"id": 6, "input": "[\"HEXAWARE\", \"TECHNOLOGY\"]", "expected_output": "[\"HEXAWARE\", \"TECHNOLOGY\"]", "is_hidden": True},
                {"id": 7, "input": "[\"bird\", \"fish\", \"ant\"]", "expected_output": "[\"BIRD\", \"FISH\"]", "is_hidden": True},
                {"id": 8, "input": "[\"alpha\", \"beta\", \"gamma\"]", "expected_output": "[\"ALPHA\", \"BETA\", \"GAMMA\"]", "is_hidden": True},
                {"id": 9, "input": "[\"one\", \"two\", \"three\", \"four\", \"five\"]", "expected_output": "[\"FIVE\", \"FOUR\", \"THREE\"]", "is_hidden": True},
                {"id": 10, "input": "[\"1234\", \"123\", \"12345\"]", "expected_output": "[\"1234\", \"12345\"]", "is_hidden": True}
            ]
        }
    ],

    # -------------------------------------------------------------
    # DAY 13: Java Coding Challenge Assessment (Complex OOP, Streams, Concurrent Data)
    # -------------------------------------------------------------
    13: [
        {
            "id": 1,
            "title": "Generic LRU Cache Implementation",
            "problem_statement": "Implement an LRUCache<K, V> class with fixed capacity. Implement get(K key) and put(K key, V value). Evict least recently used item when capacity is exceeded.",
            "input_format": "capacity = 2, put(1, 10), put(2, 20), get(1), put(3, 30)",
            "output_format": "get(2) returns -1 (evicted), get(1) returns 10",
            "constraints": "capacity >= 1, get/put O(1) time complexity",
            "sample_input": "capacity=2, put(1, 100), put(2, 200), put(3, 300)",
            "sample_output": "get(1) -> -1, get(2) -> 200, get(3) -> 300",
            "explanation": "Key 1 evicted when capacity 2 exceeded.",
            "language": "java",
            "starter_code": "import java.util.*;\npublic class LRUCache<K, V> extends LinkedHashMap<K, V> {\n    private final int capacity;\n    public LRUCache(int capacity) {\n        super(capacity, 0.75f, true);\n        this.capacity = capacity;\n    }\n    @Override\n    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {\n        return size() > capacity;\n    }\n}",
            "reference_solution": "import java.util.*; public class LRUCache<K, V> extends LinkedHashMap<K, V> { private final int capacity; public LRUCache(int c) { super(c, 0.75f, true); this.capacity = c; } @Override protected boolean removeEldestEntry(Map.Entry<K, V> e) { return size() > capacity; } }",
            "test_cases": [
                {"id": 1, "input": "capacity=2, put(1, 100), put(2, 200), put(3, 300)", "expected_output": "get(1) -> -1, get(2) -> 200", "is_hidden": False},
                {"id": 2, "input": "capacity=1, put(1, 10), put(2, 20)", "expected_output": "get(1) -> -1, get(2) -> 20", "is_hidden": False},
                {"id": 3, "input": "capacity=3, put(1,1), put(2,2), put(3,3), get(1), put(4,4)", "expected_output": "get(2) -> -1", "is_hidden": False},
                {"id": 4, "input": "update existing key", "expected_output": "get(1) returns updated value", "is_hidden": True},
                {"id": 5, "input": "capacity=100", "expected_output": "all 100 retained", "is_hidden": True},
                {"id": 6, "input": "get non-existent key", "expected_output": "returns null / -1", "is_hidden": True},
                {"id": 7, "input": "sequential accesses update LRU order", "expected_output": "correct eviction", "is_hidden": True},
                {"id": 8, "input": "capacity=5, 10 insertions", "expected_output": "5 most recent retained", "is_hidden": True},
                {"id": 9, "input": "stress 1000 items", "expected_output": "O(1) execution validated", "is_hidden": True},
                {"id": 10, "input": "capacity=1 repeat overwrites", "expected_output": "size stays 1", "is_hidden": True}
            ]
        },
        {
            "id": 2,
            "title": "Binary Tree Traversal & Stream Collector",
            "problem_statement": "Given a Binary Search Tree (BST), implement inOrderTraversal() returning a List<Integer> of values in ascending order.",
            "input_format": "BST root node",
            "output_format": "List<Integer> inOrderList",
            "constraints": "Tree height <= 1000",
            "sample_input": "root = [4, 2, 5, 1, 3]",
            "sample_output": "[1, 2, 3, 4, 5]",
            "explanation": "In-order traversal of BST yields sorted elements.",
            "language": "java",
            "starter_code": "import java.util.*;\npublic class BSTTraversal {\n    public static List<Integer> inOrder(TreeNode root) {\n        List<Integer> result = new ArrayList<>();\n        helper(root, result);\n        return result;\n    }\n    private static void helper(TreeNode node, List<Integer> list) {\n        if (node == null) return;\n        helper(node.left, list);\n        list.add(node.val);\n        helper(node.right, list);\n    }\n}",
            "reference_solution": "import java.util.*; public class BSTTraversal { public static List<Integer> inOrder(TreeNode r) { List<Integer> res = new ArrayList<>(); h(r, res); return res; } private static void h(TreeNode n, List<Integer> l) { if (n == null) return; h(n.left, l); l.add(n.val); h(n.right, l); } }",
            "test_cases": [
                {"id": 1, "input": "root = [4, 2, 5, 1, 3]", "expected_output": "[1, 2, 3, 4, 5]", "is_hidden": False},
                {"id": 2, "input": "single node [10]", "expected_output": "[10]", "is_hidden": False},
                {"id": 3, "input": "null root", "expected_output": "[]", "is_hidden": False},
                {"id": 4, "input": "left-skewed tree [3, 2, 1]", "expected_output": "[1, 2, 3]", "is_hidden": True},
                {"id": 5, "input": "right-skewed tree [1, 2, 3]", "expected_output": "[1, 2, 3]", "is_hidden": True},
                {"id": 6, "input": "balanced BST 15 nodes", "expected_output": "1 to 15 sorted", "is_hidden": True},
                {"id": 7, "input": "duplicate values guard", "expected_output": "sorted list with duplicates", "is_hidden": True},
                {"id": 8, "input": "negative node values", "expected_output": "[-10, -5, 0, 5]", "is_hidden": True},
                {"id": 9, "input": "tree height 500", "expected_output": "500 elements sorted", "is_hidden": True},
                {"id": 10, "input": "large values [Integer.MAX_VALUE]", "expected_output": "handled cleanly", "is_hidden": True}
            ]
        },
        {
            "id": 3,
            "title": "Async Task Queue & Priority Scheduler",
            "problem_statement": "Implement PriorityTaskScheduler prioritizing tasks based on priority score (1 highest). Implement executeNextTask() returning the top priority task.",
            "input_format": "addTask(\"TaskA\", 3), addTask(\"TaskB\", 1), addTask(\"TaskC\", 2)",
            "output_format": "\"TaskB\", \"TaskC\", \"TaskA\"",
            "constraints": "Priority range 1 to 100",
            "sample_input": "[(\"TaskA\", 3), (\"TaskB\", 1)]",
            "sample_output": "TaskB",
            "explanation": "TaskB has priority 1 < 3 (higher priority executed first).",
            "language": "java",
            "starter_code": "import java.util.*;\npublic class PriorityTaskScheduler {\n    private PriorityQueue<Task> queue = new PriorityQueue<>((a, b) -> Integer.compare(a.priority, b.priority));\n    public void addTask(String name, int priority) {\n        queue.offer(new Task(name, priority));\n    }\n    public String executeNextTask() {\n        return queue.isEmpty() ? null : queue.poll().name;\n    }\n}",
            "reference_solution": "import java.util.*; public class PriorityTaskScheduler { private PriorityQueue<Task> q = new PriorityQueue<>((a, b) -> Integer.compare(a.p, b.p)); public void addTask(String n, int p) { q.offer(new Task(n, p)); } public String executeNextTask() { return q.isEmpty() ? null : q.poll().n; } }",
            "test_cases": [
                {"id": 1, "input": "[(\"TaskA\", 3), (\"TaskB\", 1)]", "expected_output": "TaskB", "is_hidden": False},
                {"id": 2, "input": "[(\"P1\", 1), (\"P2\", 2), (\"P3\", 3)]", "expected_output": "P1, P2, P3", "is_hidden": False},
                {"id": 3, "input": "empty scheduler", "expected_output": "null", "is_hidden": False},
                {"id": 4, "input": "equal priorities FIFO order", "expected_output": "first added executed first", "is_hidden": True},
                {"id": 5, "input": "100 tasks random priority", "expected_output": "sorted by priority ascending", "is_hidden": True},
                {"id": 6, "input": "priority 1 vs 100", "expected_output": "priority 1 executed first", "is_hidden": True},
                {"id": 7, "input": "single task execution", "expected_output": "single task name", "is_hidden": True},
                {"id": 8, "input": "duplicate task names", "expected_output": "handled without error", "is_hidden": True},
                {"id": 9, "input": "interleaved add and execute", "expected_output": "always returns highest current priority", "is_hidden": True},
                {"id": 10, "input": "1000 tasks high volume", "expected_output": "executed in correct priority order", "is_hidden": True}
            ]
        }
    ]
}
