// trainerMockData.js
// All mock data for the Trainer Dashboard module.
// Represents Hexaware trainer, batches, trainees, submissions, and performance metrics.

export const TRAINER_PROFILE = {
  name: 'Rajesh Kumar',
  email: 'rajesh.kumar@hexaware.com',
  employeeId: 'HEX-T-0042',
  role: 'Senior Trainer',
  department: 'Technology Enablement',
};

// ─────────────────────────────────────────────
// KPI Summary Data
// ─────────────────────────────────────────────
export const KPI_DATA = {
  totalTrainees: 48,
  activeBatches: 3,
  pendingGrades: 7,
  // Next live session target datetime (used for countdown)
  nextSessionISO: (() => {
    const d = new Date();
    d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7)); // next Monday
    d.setHours(10, 0, 0, 0);
    return d.toISOString();
  })(),
};

// ─────────────────────────────────────────────
// Upcoming Sessions
// ─────────────────────────────────────────────
export const UPCOMING_SESSIONS = [
  {
    id: 's1',
    title: 'Core Java — OOP Fundamentals',
    type: 'Live Session',
    batch: 'Batch 2026 - Java Full-Stack',
    date: 'Mon, 07 Jul 2026',
    time: '10:00 AM – 11:30 AM',
    colorClass: 'session-blue',
    icon: 'video',
  },
  {
    id: 's2',
    title: 'AWS EC2 & S3 Deep Dive',
    type: 'Workshop',
    batch: 'Batch 2026 - Cloud Architecture',
    date: 'Tue, 08 Jul 2026',
    time: '02:00 PM – 04:00 PM',
    colorClass: 'session-green',
    icon: 'layers',
  },
  {
    id: 's3',
    title: 'Sorting Algorithms — Revision',
    type: 'Revision',
    batch: 'Batch 2026 - Java Full-Stack',
    date: 'Wed, 09 Jul 2026',
    time: '11:00 AM – 12:00 PM',
    colorClass: 'session-amber',
    icon: 'book-open',
  },
  {
    id: 's4',
    title: 'Docker & Kubernetes Intro',
    type: 'Live Session',
    batch: 'Batch 2026 - Cloud Architecture',
    date: 'Thu, 10 Jul 2026',
    time: '03:00 PM – 05:00 PM',
    colorClass: 'session-blue',
    icon: 'video',
  },
];

// ─────────────────────────────────────────────
// Batch & Trainee Data
// ─────────────────────────────────────────────
export const BATCHES = [
  {
    id: 'batch-java',
    label: 'Batch 2026 — Java Full-Stack',
    course: 'Core Java Full-Stack',
    trainees: [
      {
        id: 't1',
        name: 'Ananya Sharma',
        email: 'ananya.sharma@hexaware.com',
        employeeId: 'HEX-E-1021',
        initials: 'AS',
        color: '#3563e9',
        progressLabel: 'Core Java',
        progressPct: 78,
        attendancePct: 94,
        status: 'On Track',
      },
      {
        id: 't2',
        name: 'Rohan Mehta',
        email: 'rohan.mehta@hexaware.com',
        employeeId: 'HEX-E-1034',
        initials: 'RM',
        color: '#10B981',
        progressLabel: 'Core Java',
        progressPct: 46,
        attendancePct: 72,
        status: 'Behind Schedule',
      },
      {
        id: 't3',
        name: 'Priya Nair',
        email: 'priya.nair@hexaware.com',
        employeeId: 'HEX-E-1056',
        initials: 'PN',
        color: '#8B5CF6',
        progressLabel: 'Core Java',
        progressPct: 100,
        attendancePct: 98,
        status: 'Completed',
      },
      {
        id: 't4',
        name: 'Karthik Rajan',
        email: 'karthik.rajan@hexaware.com',
        employeeId: 'HEX-E-1078',
        initials: 'KR',
        color: '#F59E0B',
        progressLabel: 'Core Java',
        progressPct: 61,
        attendancePct: 85,
        status: 'On Track',
      },
      {
        id: 't5',
        name: 'Divya Krishnan',
        email: 'divya.krishnan@hexaware.com',
        employeeId: 'HEX-E-1099',
        initials: 'DK',
        color: '#EF4444',
        progressLabel: 'Core Java',
        progressPct: 33,
        attendancePct: 65,
        status: 'Behind Schedule',
      },
      {
        id: 't6',
        name: 'Aakash Verma',
        email: 'aakash.verma@hexaware.com',
        employeeId: 'HEX-E-1103',
        initials: 'AV',
        color: '#0dcd94',
        progressLabel: 'Core Java',
        progressPct: 90,
        attendancePct: 92,
        status: 'On Track',
      },
    ],
  },
  {
    id: 'batch-cloud',
    label: 'Batch 2026 — Cloud Architecture',
    course: 'AWS Cloud Architecture',
    trainees: [
      {
        id: 'c1',
        name: 'Sneha Pillai',
        email: 'sneha.pillai@hexaware.com',
        employeeId: 'HEX-E-2011',
        initials: 'SP',
        color: '#3563e9',
        progressLabel: 'AWS Fundamentals',
        progressPct: 88,
        attendancePct: 97,
        status: 'On Track',
      },
      {
        id: 'c2',
        name: 'Vivek Desai',
        email: 'vivek.desai@hexaware.com',
        employeeId: 'HEX-E-2025',
        initials: 'VD',
        color: '#EC4899',
        progressLabel: 'AWS Fundamentals',
        progressPct: 55,
        attendancePct: 78,
        status: 'Behind Schedule',
      },
      {
        id: 'c3',
        name: 'Meera Iyer',
        email: 'meera.iyer@hexaware.com',
        employeeId: 'HEX-E-2037',
        initials: 'MI',
        color: '#F59E0B',
        progressLabel: 'AWS Fundamentals',
        progressPct: 100,
        attendancePct: 100,
        status: 'Completed',
      },
      {
        id: 'c4',
        name: 'Arjun Kapoor',
        email: 'arjun.kapoor@hexaware.com',
        employeeId: 'HEX-E-2049',
        initials: 'AK',
        color: '#0dcd94',
        progressLabel: 'AWS Fundamentals',
        progressPct: 72,
        attendancePct: 88,
        status: 'On Track',
      },
    ],
  },
];

// ─────────────────────────────────────────────
// Grading Queue
// ─────────────────────────────────────────────
export const INITIAL_GRADING_QUEUE = [
  {
    id: 'g1',
    traineeName: 'Rohan Mehta',
    employeeId: 'HEX-E-1034',
    initials: 'RM',
    color: '#10B981',
    module: 'Core Java',
    taskTitle: 'Assignment 3 — Exception Handling',
    submittedDate: '04 Jul 2026',
    submittedCode: `// Exception Handling Assignment — Rohan Mehta
public class BankAccount {
    private double balance;

    public BankAccount(double initialBalance) {
        if (initialBalance < 0) {
            throw new IllegalArgumentException("Initial balance cannot be negative.");
        }
        this.balance = initialBalance;
    }

    public void withdraw(double amount) throws Exception {
        if (amount <= 0) {
            throw new IllegalArgumentException("Withdrawal amount must be positive.");
        }
        if (amount > balance) {
            throw new Exception("Insufficient funds. Balance: " + balance);
        }
        balance -= amount;
        System.out.println("Withdrawn: " + amount + " | Remaining: " + balance);
    }

    public static void main(String[] args) {
        try {
            BankAccount acc = new BankAccount(1000);
            acc.withdraw(200);
            acc.withdraw(900); // should throw
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
        }
    }
}`,
  },
  {
    id: 'g2',
    traineeName: 'Divya Krishnan',
    employeeId: 'HEX-E-1099',
    initials: 'DK',
    color: '#EF4444',
    module: 'Core Java',
    taskTitle: 'Quiz 2 — Collections Framework',
    submittedDate: '03 Jul 2026',
    submittedCode: `Q1. What is the difference between ArrayList and LinkedList?
Answer: ArrayList uses a dynamic array and provides O(1) access by index.
LinkedList uses nodes and is faster for insert/delete at middle positions.

Q2. When would you use a HashMap over a TreeMap?
Answer: HashMap when order does not matter (O(1) avg). TreeMap when sorted order is needed (O(log n)).

Q3. What is the contract between hashCode() and equals()?
Answer: If two objects are equal via equals(), they must return the same hashCode. The reverse is not required.

Q4. What does ConcurrentModificationException mean?
Answer: It occurs when a collection is modified during iteration with a non-concurrent iterator.`,
  },
  {
    id: 'g3',
    traineeName: 'Vivek Desai',
    employeeId: 'HEX-E-2025',
    initials: 'VD',
    color: '#EC4899',
    module: 'AWS Fundamentals',
    taskTitle: 'Lab Report — EC2 Instance Setup',
    submittedDate: '05 Jul 2026',
    submittedCode: `## Lab Report: EC2 Instance Setup

**Student:** Vivek Desai | HEX-E-2025
**Date Completed:** 05 Jul 2026

### Steps Performed:
1. Logged into AWS Management Console.
2. Navigated to EC2 → Launch Instance.
3. Selected AMI: Amazon Linux 2023.
4. Chose instance type: t2.micro (free tier eligible).
5. Created a new key pair (vivek-hexaware.pem) and downloaded it.
6. Configured Security Group: allowed SSH (port 22) from My IP.
7. Launched instance and waited for status checks to pass.
8. Connected via SSH: ssh -i vivek-hexaware.pem ec2-user@<public-ip>

### Challenges:
- Initial SSH connection failed. Root cause: .pem file had wrong permissions. Fixed using: chmod 400 vivek-hexaware.pem

### Conclusion:
Successfully launched and connected to an EC2 instance.`,
  },
  {
    id: 'g4',
    traineeName: 'Karthik Rajan',
    employeeId: 'HEX-E-1078',
    initials: 'KR',
    color: '#F59E0B',
    module: 'Core Java',
    taskTitle: 'Assignment 4 — Multithreading',
    submittedDate: '05 Jul 2026',
    submittedCode: `// Multithreading Assignment — Karthik Rajan
public class ProducerConsumer {
    private static final int MAX = 5;
    private static int[] buffer = new int[MAX];
    private static int count = 0;

    synchronized static void produce(int item) throws InterruptedException {
        while (count == MAX) wait();
        buffer[count++] = item;
        System.out.println("Produced: " + item);
        notifyAll();
    }

    synchronized static int consume() throws InterruptedException {
        while (count == 0) wait();
        int item = buffer[--count];
        System.out.println("Consumed: " + item);
        notifyAll();
        return item;
    }
}`,
  },
  {
    id: 'g5',
    traineeName: 'Ananya Sharma',
    employeeId: 'HEX-E-1021',
    initials: 'AS',
    color: '#3563e9',
    module: 'Core Java',
    taskTitle: 'Quiz 3 — Sorting Algorithms',
    submittedDate: '06 Jul 2026',
    submittedCode: `Q1. Explain Bubble Sort with time complexity.
Answer: Bubble Sort repeatedly swaps adjacent elements if out of order. O(n²) worst case, O(n) best case with optimization.

Q2. What is the advantage of Merge Sort over Quick Sort?
Answer: Merge Sort is stable and guarantees O(n log n) in all cases. Quick Sort can degrade to O(n²) in worst case.

Q3. Implement Binary Search pseudocode.
Answer:
  low = 0, high = n-1
  while low <= high:
    mid = (low + high) / 2
    if arr[mid] == target: return mid
    elif arr[mid] < target: low = mid + 1
    else: high = mid - 1
  return -1

Q4. What is the space complexity of Heap Sort?
Answer: O(1) auxiliary space — in-place sorting.`,
  },
  {
    id: 'g6',
    traineeName: 'Sneha Pillai',
    employeeId: 'HEX-E-2011',
    initials: 'SP',
    color: '#3563e9',
    module: 'AWS Fundamentals',
    taskTitle: 'Assignment 2 — S3 Bucket Configuration',
    submittedDate: '06 Jul 2026',
    submittedCode: `## S3 Bucket Configuration Report — Sneha Pillai

### Task: Create a static website hosted on S3

Steps:
1. Created bucket: hexaware-sneha-website
2. Disabled "Block all public access"
3. Enabled static website hosting (index.html, error.html)
4. Added bucket policy:
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::hexaware-sneha-website/*"
  }]
}
5. Uploaded index.html and error.html
6. Accessed site via S3 endpoint URL successfully.

Website URL: http://hexaware-sneha-website.s3-website-us-east-1.amazonaws.com`,
  },
];

// ─────────────────────────────────────────────
// Performance Analytics Data
// ─────────────────────────────────────────────
export const PERFORMANCE_DATA = {
  batchLabel: 'Batch 2026 — Java Full-Stack',
  modules: [
    { id: 'pm1', name: 'Java Basics & Syntax',          avgScore: 82 },
    { id: 'pm2', name: 'OOP Fundamentals',              avgScore: 74 },
    { id: 'pm3', name: 'Exception Handling',            avgScore: 68 },
    { id: 'pm4', name: 'Collections Framework',         avgScore: 61 },
    { id: 'pm5', name: 'Sorting & Searching Algorithms', avgScore: 56 },
    { id: 'pm6', name: 'Multithreading',                avgScore: 49 },
    { id: 'pm7', name: 'JDBC & Database Connectivity',  avgScore: 71 },
    { id: 'pm8', name: 'Spring Boot Basics',            avgScore: 63 },
  ],
  // Cloud batch performance
  cloudModules: [
    { id: 'cp1', name: 'AWS IAM & Security',     avgScore: 79 },
    { id: 'cp2', name: 'EC2 & VPC Networking',   avgScore: 75 },
    { id: 'cp3', name: 'S3 & Storage Services',  avgScore: 83 },
    { id: 'cp4', name: 'RDS & DynamoDB',         avgScore: 58 },
    { id: 'cp5', name: 'Lambda & Serverless',    avgScore: 52 },
    { id: 'cp6', name: 'CloudWatch & Monitoring', avgScore: 66 },
  ],
};
