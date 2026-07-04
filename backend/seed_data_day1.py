import asyncio
from sqlalchemy import select

from app.database.session import AsyncSessionLocal
from app.models.learning_unit import LearningUnit
from app.models.content import Content


async def main():

    async with AsyncSessionLocal() as db:

        # ==========================================
        # FETCH EXISTING LEARNING UNITS
        # ==========================================

        algorithm_basics = (
            await db.execute(
                select(LearningUnit).where(
                    LearningUnit.title == "Algorithm Basics"
                )
            )
        ).scalar_one()

        data_structures = (
            await db.execute(
                select(LearningUnit).where(
                    LearningUnit.title == "Data Structures Basics"
                )
            )
        ).scalar_one()

        sorting_techniques = (
            await db.execute(
                select(LearningUnit).where(
                    LearningUnit.title == "Sorting Techniques"
                )
            )
        ).scalar_one()

        searching_techniques = (
            await db.execute(
                select(LearningUnit).where(
                    LearningUnit.title == "Searching Techniques"
                )
            )
        ).scalar_one()

        tree_unit = (
            await db.execute(
                select(LearningUnit).where(
                    LearningUnit.title == "Tree"
                )
            )
        ).scalar_one()

        # ==================================================
        # DAY 1 CONTENT
        # ==================================================

        # Paste your existing Content(...) objects here

        # Example:
        #
        # algorithm_content = Content(
        #     learning_unit_id=algorithm_basics.id,
        #     content_text="""..."""
        # )
        #
        # data_structures_content = Content(...)
        # sorting_content = Content(...)
        # searching_content = Content(...)
        # tree_content = Content(...)

        # ==================================================
        # SAVE TO DATABASE
        # ==================================================

        algorithm_content = Content(
            learning_unit_id=algorithm_basics.id,
            content_text="""
# ALGORITHM BASICS

## 1. What is an Algorithm?

An algorithm is a structured sequence of instructions designed to solve a problem and generate the desired output efficiently.

### Characteristics
- Well-defined inputs and outputs
- Finite execution steps
- Accurate results
- Efficient resource utilization

## 2. Why Algorithms Matter

Algorithms form the foundation of modern software systems and enable applications to deliver optimal performance and scalability.

### Benefits
- Faster execution
- Better scalability
- Reduced resource consumption
- Easier maintenance
- Enhanced user experience

## 3. Heuristic Approach

The Heuristic approach leverages practical experience and educated assumptions to identify effective solutions quickly.

### Advantages
- Fast execution
- Suitable for large-scale problems

### Examples
- GPS Navigation
- AI Game Strategies

## 4. Brute Force Technique

Brute Force evaluates every possible solution until the correct answer is identified.

### Advantages
- Simple implementation
- Guaranteed solution

### Limitations
- High computational cost
- Time-consuming execution

## 5. Heuristic vs Brute Force

### Heuristic
- Fast execution
- Approximate solutions
- Lower resource usage

### Brute Force
- Slower execution
- Exact solutions
- Higher resource usage

## 6. Greedy Approach

A Greedy algorithm selects the most beneficial option at each step with the objective of achieving an optimal overall solution.

### Applications
- Activity Selection
- Huffman Coding
- Minimum Spanning Tree

## 7. Divide and Conquer

The Divide and Conquer strategy decomposes a complex problem into smaller subproblems, solves them independently, and combines the results.

### Applications
- Merge Sort
- Quick Sort
- Binary Search

## 8. Dynamic Programming

Dynamic Programming optimizes problem-solving by storing and reusing previously computed solutions.

### Key Concepts
- Overlapping Subproblems
- Optimal Substructure

### Applications
- Fibonacci Series
- Knapsack Problem

## 9. Industry Applications

Algorithms play a critical role in modern technology solutions.

### Applications
- Search Engines
- Navigation Systems
- Cloud Computing
- Artificial Intelligence
- Financial Analytics
"""
        )

        data_structures_content = Content(
            learning_unit_id=data_structures.id,
            content_text="""
# DATA STRUCTURE BASICS

## 1. What is a Data Structure?

A Data Structure is a specialized method of organizing and storing data to enable efficient access, processing, and modification. Selecting the appropriate data structure is essential for building scalable and high-performance applications.

### Key Benefits
- Efficient data management
- Faster data access
- Improved performance
- Better scalability

## 2. Why Data Structures Matter

Data structures serve as the foundation of modern software systems by optimizing data storage and retrieval operations.

### Benefits
- Reduced execution time
- Optimized memory utilization
- Simplified problem solving
- Improved application performance

## 3. Introduction to Arrays

An Array stores elements of the same data type in contiguous memory locations and provides direct access through indexing.

### Features
- Fast element access
- Fixed-size structure
- Simple implementation
- Efficient data storage

## 4. Array Operations

Arrays support a variety of operations for managing and manipulating data.

### Common Operations
- Traversal
- Insertion
- Deletion
- Searching
- Updating

## 5. Array Applications

Arrays are widely used for storing and managing fixed-size collections of data.

### Applications
- Image Processing
- Matrix Operations
- Gaming Systems
- Scientific Computing

## 6. Introduction to Linked Lists

A Linked List is a dynamic data structure composed of nodes connected through references.

### Features
- Dynamic memory allocation
- Efficient insertion and deletion
- Flexible size management
- Non-contiguous storage

## 7. Types of Linked Lists

Linked Lists are available in different forms to support specific use cases.

### Types
- Singly Linked List
- Doubly Linked List
- Circular Linked List

## 8. Introduction to Stack

A Stack is a linear data structure that follows the Last In First Out (LIFO) principle.

### Core Operations
- Push
- Pop
- Peek

## 9. Stack Applications

Stacks are commonly used where reverse-order processing is required.

### Applications
- Function Calls
- Recursion
- Undo and Redo Operations
- Expression Evaluation
- Browser History

## 10. Introduction to Queue

A Queue is a linear data structure that follows the First In First Out (FIFO) principle.

### Core Operations
- Enqueue
- Dequeue

## 11. Queue Applications

Queues are widely used in systems that require sequential processing of requests.

### Applications
- CPU Scheduling
- Printer Management
- Network Routing
- Task Scheduling
- Customer Service Systems

## 12. Comparison of Data Structures

### Array
- Fast indexing
- Fixed size

### Linked List
- Dynamic size
- Efficient insertion and deletion

### Stack
- LIFO processing

### Queue
- FIFO processing

## 13. Industry Applications

Data Structures are fundamental to modern computing and enterprise software development.

### Applications
- Database Systems
- Operating Systems
- Artificial Intelligence
- Cloud Platforms
- Financial Applications
"""
        )

        sorting_content = Content(
            learning_unit_id=sorting_techniques.id,
            content_text="""
# SORTING TECHNIQUES

## 1. What is Sorting?

Sorting is the process of arranging data in a specific order, typically ascending or descending. It improves data organization and enhances the efficiency of various computational operations.

### Benefits
- Faster searching
- Better data organization
- Improved data analysis
- Efficient data processing

## 2. Why Sorting Matters

Sorting plays a critical role in modern software systems by enabling efficient retrieval, processing, and management of data.

### Benefits
- Improved search performance
- Enhanced user experience
- Better analytical capabilities
- Efficient handling of large datasets

## 3. Introduction to Bubble Sort

Bubble Sort repeatedly compares adjacent elements and swaps them whenever they are in the wrong order.

### Characteristics
- Simple implementation
- Easy to understand
- Suitable for small datasets

## 4. Bubble Sort Complexity

Bubble Sort gradually moves larger elements toward the end of the array through multiple passes.

### Complexity
- Best Case → O(n)
- Average Case → O(n²)
- Worst Case → O(n²)
- Space Complexity → O(1)

## 5. Introduction to Selection Sort

Selection Sort repeatedly selects the smallest element from the unsorted portion and places it in its correct position.

### Characteristics
- Fewer swap operations
- Memory efficient
- Simple implementation

## 6. Selection Sort Complexity

Selection Sort maintains consistent performance regardless of the initial arrangement of data.

### Complexity
- Best Case → O(n²)
- Average Case → O(n²)
- Worst Case → O(n²)
- Space Complexity → O(1)

## 7. Introduction to Insertion Sort

Insertion Sort builds a sorted sequence by inserting each element into its appropriate position.

### Characteristics
- Stable sorting algorithm
- Efficient for nearly sorted data
- Commonly used in hybrid sorting techniques

## 8. Insertion Sort Complexity

Insertion Sort performs efficiently when the input data is already partially sorted.

### Complexity
- Best Case → O(n)
- Average Case → O(n²)
- Worst Case → O(n²)
- Space Complexity → O(1)

## 9. Introduction to Merge Sort

Merge Sort applies the Divide and Conquer strategy by splitting data into smaller subarrays and merging them after sorting.

### Characteristics
- Stable sorting algorithm
- Highly scalable
- Suitable for large datasets

## 10. Merge Sort Complexity

Merge Sort provides consistent performance across different input scenarios.

### Complexity
- Best Case → O(n log n)
- Average Case → O(n log n)
- Worst Case → O(n log n)
- Space Complexity → O(n)

## 11. Introduction to Quick Sort

Quick Sort uses a pivot element to partition data into smaller groups and recursively sorts each partition.

### Characteristics
- Highly efficient in practice
- Widely used in production systems
- Based on Divide and Conquer

## 12. Quick Sort Complexity

Quick Sort is one of the most widely used sorting algorithms due to its practical performance advantages.

### Complexity
- Best Case → O(n log n)
- Average Case → O(n log n)
- Worst Case → O(n²)
- Space Complexity → O(log n)

## 13. Comparison of Sorting Techniques

| Algorithm | Time Complexity |
|------------|----------------|
| Bubble Sort | O(n²) |
| Selection Sort | O(n²) |
| Insertion Sort | O(n²) |
| Merge Sort | O(n log n) |
| Quick Sort | O(n log n) Average |

## 14. Industry Applications

Sorting algorithms are widely used in enterprise applications for efficient data processing and analysis.

### Applications
- E-Commerce Product Ranking
- Search Engines
- Database Systems
- Financial Analytics
- AI and Machine Learning Pipelines
"""
        )

        searching_content = Content(
            learning_unit_id=searching_techniques.id,
            content_text="""
# SEARCHING TECHNIQUES

## 1. What is Searching?

Searching is the process of locating a specific element within a collection of data. It enables efficient information retrieval and plays a vital role in modern software applications.

### Benefits
- Faster data retrieval
- Improved application performance
- Efficient data processing
- Enhanced user experience

## 2. Why Searching Matters

Searching algorithms help systems locate information quickly and efficiently, especially when working with large volumes of data.

### Benefits
- Faster access to information
- Better system performance
- Support for large-scale applications
- Foundation for advanced data operations

## 3. Introduction to Linear Search

Linear Search examines elements sequentially until the required element is found or the collection is fully traversed.

### Characteristics
- Simple implementation
- Works on sorted and unsorted data
- Suitable for small datasets
- No preprocessing required

## 4. Linear Search Complexity

The performance of Linear Search depends on the position of the target element within the dataset.

### Complexity
- Best Case → O(1)
- Average Case → O(n)
- Worst Case → O(n)
- Space Complexity → O(1)

## 5. Linear Search Implementation

Linear Search iterates through each element and compares it with the target value until a match is found.

### Operations
- Sequential traversal
- Element comparison
- Return matching index

## 6. Introduction to Binary Search

Binary Search is an efficient searching algorithm that repeatedly divides the search space into two halves.

### Characteristics
- Requires sorted data
- Uses Divide and Conquer
- Highly efficient for large datasets
- Reduces search space rapidly

## 7. Binary Search Working

Binary Search compares the target value with the middle element and continues the search in the relevant half of the dataset.

### Process
- Identify middle element
- Compare with target
- Eliminate half of the search space
- Repeat until found

## 8. Binary Search Complexity

Binary Search provides significantly better performance than Linear Search for large datasets.

### Complexity
- Best Case → O(1)
- Average Case → O(log n)
- Worst Case → O(log n)
- Space Complexity → O(1)

## 9. Binary Search Implementation

Binary Search uses low, high, and middle indices to efficiently locate the target element.

### Operations
- Calculate middle index
- Compare target value
- Adjust search boundaries
- Repeat until found

## 10. Linear Search vs Binary Search

### Linear Search
- Sequential searching technique
- Works on unsorted data
- Simpler implementation
- Suitable for smaller datasets

### Binary Search
- Divide and Conquer approach
- Requires sorted data
- Faster execution
- Suitable for larger datasets

## 11. Industry Applications

Searching algorithms are widely used across modern software systems to enable efficient data retrieval.

### Applications
- Search Engines
- Database Indexing
- Contact Management Systems
- E-Commerce Platforms
- Artificial Intelligence Systems
"""
        )

        tree_content = Content(
            learning_unit_id=tree_unit.id,
            content_text="""
# TREES

## 1. What is a Tree?

A Tree is a non-linear hierarchical data structure consisting of nodes connected through edges. It is used to represent hierarchical relationships and organize data efficiently.

### Characteristics
- Root node and child nodes
- Hierarchical structure
- Parent-child relationships
- Widely used in databases and operating systems

## 2. Why Trees Matter

Trees enable efficient data organization and retrieval, making them essential for building scalable software systems.

### Benefits
- Faster searching operations
- Efficient insertion and deletion
- Structured data organization
- Supports hierarchical relationships

## 3. Tree Structure

A tree consists of several fundamental components that define its hierarchy and relationships.

### Key Terminology
- Root Node
- Parent Node
- Child Node
- Leaf Node
- Sibling Nodes
- Height and Depth
- Degree of a Node

## 4. Types of Tree Data Structures

Different tree structures are designed to address various data organization requirements.

### Types
- Binary Tree
- Ternary Tree
- N-ary Tree

## 5. Introduction to Binary Tree

A Binary Tree is a tree structure in which each node can have at most two children, referred to as the left child and right child.

### Features
- Recursive structure
- Simple implementation
- Foundation for BST and AVL Trees

## 6. Tree Traversal

Traversal is the process of visiting every node in a tree exactly once to access or process data.

### Traversal Techniques
- Depth First Search (DFS)
- Breadth First Search (BFS)
- Preorder Traversal
- Inorder Traversal
- Postorder Traversal

## 7. Traversal Examples

Traversal methods define the order in which nodes are visited within a tree.

### Types
- Preorder → Root → Left → Right
- Inorder → Left → Root → Right
- Postorder → Left → Right → Root

### Note
Inorder traversal of a BST produces sorted output.

## 8. Level Order Traversal

Level Order Traversal visits nodes level by level using the Breadth First Search technique.

### Characteristics
- Uses Queue Data Structure
- Processes nodes level-wise
- Time Complexity: O(n)

## 9. Binary Search Tree (BST)

A Binary Search Tree organizes data such that values smaller than the root are placed in the left subtree, while larger values are placed in the right subtree.

### Benefits
- Efficient searching
- Faster insertion
- Simplified deletion operations
- Maintains sorted order

## 10. BST Complexity

The Binary Search Tree provides efficient performance for common operations under balanced conditions.

### Complexities
- Search → O(log n)
- Insert → O(log n)
- Delete → O(log n)
- Worst Case → O(n)

## 11. Introduction to AVL Tree

An AVL Tree is a self-balancing Binary Search Tree that automatically maintains height balance after insertion and deletion operations.

### Features
- Self-balancing structure
- Uses Balance Factor
- Prevents skewed trees
- Ensures O(log n) performance

## 12. AVL Rotations

AVL Trees use rotations to restore balance whenever an imbalance occurs.

### Rotation Types
- LL Rotation
- RR Rotation
- LR Rotation
- RL Rotation

### Complexity
- Search → O(log n)
- Insert → O(log n)
- Delete → O(log n)

## 13. Industry Applications

Tree data structures are widely used across software systems for efficient data storage, retrieval, and organization.

### Applications
- Database Indexing
- File Systems
- Routing Tables
- Decision Trees in Machine Learning
- HTML/XML DOM Structures
"""
        )

        db.add_all([
            algorithm_content,
            data_structures_content,
            sorting_content,
            searching_content,
            tree_content
        ])

        await db.commit()

        await db.refresh(algorithm_content)
        await db.refresh(data_structures_content)
        await db.refresh(sorting_content)
        await db.refresh(searching_content)
        await db.refresh(tree_content)

        print("✅ Day 1 Content Seeded Successfully")


if __name__ == "__main__":
    asyncio.run(main())