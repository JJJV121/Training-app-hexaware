import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import Icon from '../components/Icon';
import '../styles/assessment.css';
import { useTheme } from '../context/ThemeContext';

// ==========================================
// 1. MOCK DATA SCHEMAS (FASTAPI FORMAT)
// ==========================================

const MCQ_ASSESSMENT_MOCK = {
  id: 101,
  title: "Hexaware Frontend & Engineering MCQ Assessment",
  assessmentType: "MCQ",
  durationSeconds: 1800, // 30 minutes
  passPercentage: 66,
  questions: [
    {
      id: 1,
      type: "mcq",
      topic: "Problem Solving & Data Structures",
      difficulty: "medium",
      questionText: "What is the worst-case time complexity of searching an element in a balanced Binary Search Tree (BST) of size N?",
      options: [
        "O(1)",
        "O(log N)",
        "O(N)",
        "O(N log N)"
      ],
      correctAnswer: 1 // index of "O(log N)"
    },
    {
      id: 2,
      type: "msq",
      topic: "Agile",
      difficulty: "easy",
      questionText: "Which of the following are core values of the Agile Manifesto? (Select all that apply)",
      options: [
        "Individuals and interactions over processes and tools",
        "Comprehensive documentation over working software",
        "Customer collaboration over contract negotiation",
        "Responding to change over following a plan"
      ],
      correctAnswers: [0, 2, 3] // indices
    },
    {
      id: 3,
      type: "mcq",
      topic: "MySQL",
      difficulty: "easy",
      questionText: "Which MySQL join returns all rows from the left table, and the matched rows from the right table, filling with NULL if there is no match?",
      options: [
        "INNER JOIN",
        "RIGHT JOIN",
        "LEFT JOIN",
        "FULL OUTER JOIN"
      ],
      correctAnswer: 2 // index of "LEFT JOIN"
    },
    {
      id: 4,
      type: "mcq",
      topic: "JUnit",
      difficulty: "medium",
      questionText: "In JUnit 5, which annotation is used to run a method BEFORE each test case execution in the test class?",
      options: [
        "@BeforeAll",
        "@BeforeEach",
        "@SetUp",
        "@BeforeTest"
      ],
      correctAnswer: 1 // index of "@BeforeEach"
    },
    {
      id: 5,
      type: "msq",
      topic: "Git",
      difficulty: "medium",
      questionText: "Which of the following Git commands can be used to integrate changes from one branch into another? (Select all that apply)",
      options: [
        "git merge",
        "git rebase",
        "git checkout",
        "git cherry-pick"
      ],
      correctAnswers: [0, 1, 3]
    },
    {
      id: 6,
      type: "mcq",
      topic: "Cloud",
      difficulty: "hard",
      questionText: "Which cloud service model provides operating systems, runtimes, database management, and development middleware environments so developers can focus purely on application logic?",
      options: [
        "Infrastructure as a Service (IaaS)",
        "Platform as a Service (PaaS)",
        "Software as a Service (SaaS)",
        "Function as a Service (FaaS)"
      ],
      correctAnswer: 1 // index of "PaaS"
    }
  ]
};

const CODING_ASSESSMENT_MOCK = {
  id: 102,
  title: "Hexaware Graduate Coding Challenge",
  assessmentType: "Coding",
  durationSeconds: 2700, // 45 minutes
  passPercentage: 50,
  questions: [
    {
      id: 11,
      type: "coding",
      topic: "Problem Solving",
      difficulty: "medium",
      title: "Two Sum Closest",
      problemStatement: `Given an array of integers \`nums\` and a target integer \`target\`, find two integers in \`nums\` such that their sum is closest to \`target\`.

Return the sum of the two integers. You may assume that each input would have exactly one solution.

**Example 1:**
* **Input:** \`nums = [1, 2, 4, 8], target = 7\`
* **Output:** \`6\` (The closest sum is 2 + 4 = 6, which differs by 1. 8-2=6 is also close.)

**Example 2:**
* **Input:** \`nums = [-1, 2, 1, -4], target = 1\`
* **Output:** \`2\` (The sum is 1 + 1 = 2, which is closest to 1.)`,
      constraints: `* 2 <= nums.length <= 10^4
* -10^4 <= nums[i] <= 10^4
* -10^4 <= target <= 10^4`,
      languages: [
        {
          id: 'python',
          name: 'Python 3',
          defaultCode: `def twoSumClosest(nums, target):
    # Write your Python 3 code here
    nums.sort()
    closest_sum = float('inf')
    # Implement closest sum search
    left = 0
    right = len(nums) - 1
    while left < right:
        current_sum = nums[left] + nums[right]
        if abs(target - current_sum) < abs(target - closest_sum):
            closest_sum = current_sum
        if current_sum < target:
            left += 1
        else:
            right -= 1
    return closest_sum
`
        },
        {
          id: 'java',
          name: 'Java 17',
          defaultCode: `import java.util.Arrays;

public class Solution {
    public int twoSumClosest(int[] nums, int target) {
        // Write your Java code here
        Arrays.sort(nums);
        int closestSum = Integer.MAX_VALUE / 2;
        int left = 0, right = nums.length - 1;
        while (left < right) {
            int currentSum = nums[left] + nums[right];
            if (Math.abs(target - currentSum) < Math.abs(target - closestSum)) {
                closestSum = currentSum;
            }
            if (currentSum < target) left++;
            else right--;
        }
        return closestSum;
    }
}`
        },
        {
          id: 'cpp',
          name: 'C++ 20',
          defaultCode: `#include <vector>
#include <algorithm>
#include <climits>
#include <cmath>

class Solution {
public:
    int twoSumClosest(std::vector<int>& nums, int target) {
        // Write your C++ code here
        std::sort(nums.begin(), nums.end());
        int closestSum = INT_MAX / 2;
        int left = 0, right = nums.size() - 1;
        while (left < right) {
            int currentSum = nums[left] + nums[right];
            if (std::abs(target - currentSum) < std::abs(target - closestSum)) {
                closestSum = currentSum;
            }
            if (currentSum < target) left++;
            else right--;
        }
        return closestSum;
    }
};`
        }
      ],
      testCases: [
        { id: 1, input: "nums = [1, 2, 4, 8], target = 7", expectedOutput: "6", isHidden: false },
        { id: 2, input: "nums = [-1, 2, 1, -4], target = 1", expectedOutput: "2", isHidden: false },
        { id: 3, input: "nums = [0, 0, 0], target = 1", expectedOutput: "0", isHidden: true }
      ]
    },
    {
      id: 12,
      type: "coding",
      topic: "Data Structures",
      difficulty: "easy",
      title: "Valid Parentheses",
      problemStatement: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.

**Example 1:**
* **Input:** \`s = "()[]{}"\`
* **Output:** \`true\`

**Example 2:**
* **Input:** \`s = "(]"\`
* **Output:** \`false\``,
      constraints: `* 1 <= s.length <= 10^4
* s consists of parentheses only.`,
      languages: [
        {
          id: 'python',
          name: 'Python 3',
          defaultCode: `def isValid(s):
    # Write your Python 3 code here
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                return False
        else:
            stack.append(char)
    return not stack
`
        },
        {
          id: 'java',
          name: 'Java 17',
          defaultCode: `import java.util.Stack;
import java.util.HashMap;

public class Solution {
    public boolean isValid(String s) {
        // Write your Java code here
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '{') stack.push('}');
            else if (c == '[') stack.push(']');
            else if (stack.isEmpty() || stack.pop() != c) return false;
        }
        return stack.isEmpty();
    }
}`
        },
        {
          id: 'cpp',
          name: 'C++ 20',
          defaultCode: `#include <string>
#include <stack>

class Solution {
public:
    bool isValid(std::string s) {
        // Write your C++ code here
        std::stack<char> st;
        for (char c : s) {
            if (c == '(' || c == '{' || c == '[') st.push(c);
            else {
                if (st.empty()) return false;
                if (c == ')' && st.top() != '(') return false;
                if (c == '}' && st.top() != '{') return false;
                if (c == ']' && st.top() != '[') return false;
                st.pop();
            }
        }
        return st.empty();
    }
};`
        }
      ],
      testCases: [
        { id: 1, input: "s = \"()[]{}\"", expectedOutput: "true", isHidden: false },
        { id: 2, input: "s = \"(]\"", expectedOutput: "false", isHidden: false },
        { id: 3, input: "s = \"{[]}\"", expectedOutput: "true", isHidden: true }
      ]
    }
  ]
};

// ==========================================
// 2. COMPONENT LOGIC
// ==========================================

export default function Assessment({
  assessmentType = "MCQ", // Can be "MCQ" or "Coding"
  initialRemainingTime = null, // Prop injection to recover timer state
  onFinished = null, // Callback on exit or completed submission
  onLockChange = null // Callback to signal locking status
}) {
  const { isDarkMode } = useTheme();
  // Select active assessment configuration payload
  const activeAssessment = assessmentType === "Coding" ? CODING_ASSESSMENT_MOCK : MCQ_ASSESSMENT_MOCK;
  const assessmentId = activeAssessment.id;

  // Local storage state-resume keys
  const LS_STATE_KEY = `hex_assessment_attempt_${assessmentId}`;

  // Core state management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState("saved"); // 'saving' | 'saved' | 'error'

  // Central answer state representation
  // MCQ: { questionId: selectedIndex } OR { questionId: [selectedIndices] }
  // Coding: { questionId: { language: 'python', code: '...' } }
  const [selectedAnswers, setSelectedAnswers] = useState(() => {
    // Attempt state recovery
    try {
      const savedState = localStorage.getItem(LS_STATE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.selectedAnswers) {
          return parsed.selectedAnswers;
        }
      }
    } catch (e) {
      console.warn("Failed to load initial answers state from localStorage", e);
    }

    // Default initialization
    const defaults = {};
    activeAssessment.questions.forEach((q) => {
      if (q.type === "mcq") {
        defaults[q.id] = null;
      } else if (q.type === "msq") {
        defaults[q.id] = [];
      } else if (q.type === "coding") {
        defaults[q.id] = {
          language: q.languages[0].id,
          code: q.languages[0].defaultCode
        };
      }
    });
    return defaults;
  });

  // Countdown timer state
  const [remainingTime, setRemainingTime] = useState(() => {
    // Priority 1: passed remaining time via prop
    if (initialRemainingTime !== null) {
      return initialRemainingTime;
    }
    // Priority 2: recovered remaining time from storage
    try {
      const savedState = localStorage.getItem(LS_STATE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (typeof parsed.remainingTime === 'number') {
          return parsed.remainingTime;
        }
      }
    } catch (e) {
      console.warn("Failed to load initial remaining time from localStorage", e);
    }
    // Default
    return activeAssessment.durationSeconds;
  });

  // Results details state
  const [assessmentResults, setAssessmentResults] = useState(null);

  // Coding mode workspace state
  const [codingActiveTab, setCodingActiveTab] = useState("statement"); // 'statement' | 'testcases'
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [isRunningCode, setIsRunningCode] = useState(false);

  const currentQuestion = activeAssessment.questions[currentQuestionIndex];

  // Ref tracking answers state for non-stale updates in intervals / debouncing
  const selectedAnswersRef = useRef(selectedAnswers);
  useEffect(() => {
    selectedAnswersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  // ==========================================
  // 2.5. NAVIGATION LOCK EFFECT
  // ==========================================
  useEffect(() => {
    if (onLockChange) {
      onLockChange(!isSubmitted);
    }
    return () => {
      if (onLockChange) {
        onLockChange(false);
      }
    };
  }, [isSubmitted, onLockChange]);

  // ==========================================
  // 3. TIMER countdown implementation
  // ==========================================
  useEffect(() => {
    if (isSubmitted) return;

    const timer = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          // Auto submit when countdown hits 0
          triggerAutoSubmission();
          return 0;
        }
        const updatedTime = prevTime - 1;
        // Keep storage sync updated with remainingTime
        saveToLocalStorage(selectedAnswersRef.current, updatedTime);
        return updatedTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, assessmentId]);

  // Utility to format time
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check alert level of remaining time
  const getTimerClass = () => {
    if (remainingTime < 60) return "timer-wrapper timer-danger";
    if (remainingTime < 300) return "timer-wrapper timer-warning";
    return "timer-wrapper";
  };

  // ==========================================
  // 4. STORAGE & AUTOSAVE (DEBOUNCED)
  // ==========================================
  const saveToLocalStorage = (answers, time) => {
    try {
      localStorage.setItem(LS_STATE_KEY, JSON.stringify({
        selectedAnswers: answers,
        remainingTime: time
      }));
    } catch (e) {
      console.error("Local storage update failed", e);
    }
  };

  // Simulation of background autosave API
  const simulateAutosaveAPI = useCallback((answers) => {
    setAutosaveStatus("saving");
    // Simulate API delay
    setTimeout(() => {
      console.log(`[Autosave] Synced state for assessment ${assessmentId}:`, answers);
      setAutosaveStatus("saved");
    }, 800);
  }, [assessmentId]);

  // Autosave triggers when selected answers change
  useEffect(() => {
    if (isSubmitted) return;
    
    // Save locally immediately
    saveToLocalStorage(selectedAnswers, remainingTime);

    // Setup debounce timer
    const debounceTimer = setTimeout(() => {
      simulateAutosaveAPI(selectedAnswers);
    }, 1000);

    return () => clearTimeout(debounceTimer);
  }, [selectedAnswers, simulateAutosaveAPI, isSubmitted]);

  // ==========================================
  // 5. NAVIGATION CONTROLS
  // ==========================================
  const handlePrevQuestion = () => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) => Math.min(activeAssessment.questions.length - 1, prev + 1));
  };

  const isQuestionAnswered = (qId) => {
    const answer = selectedAnswers[qId];
    if (answer === null || answer === undefined) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    if (typeof answer === "object") {
      // For coding challenges, check if has meaningful edit from starting boilerplate
      const q = activeAssessment.questions.find((x) => x.id === qId);
      if (!q) return false;
      const activeLang = answer.language;
      const defaultLangCode = q.languages.find((l) => l.id === activeLang)?.defaultCode || "";
      return answer.code !== defaultLangCode && answer.code.trim() !== "";
    }
    return true;
  };

  // ==========================================
  // 6. MCQ/MSQ ANSWER INPUT INTERACTOR
  // ==========================================
  const handleSelectOption = (qId, optionIdx, isMulti) => {
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      if (isMulti) {
        const currentArr = Array.isArray(copy[qId]) ? copy[qId] : [];
        if (currentArr.includes(optionIdx)) {
          copy[qId] = currentArr.filter((i) => i !== optionIdx);
        } else {
          copy[qId] = [...currentArr, optionIdx].sort();
        }
      } else {
        copy[qId] = optionIdx;
      }
      return copy;
    });
  };

  // ==========================================
  // 7. CODING EDITOR INPUT INTERACTOR
  // ==========================================
  const handleLanguageChange = (qId, newLangId) => {
    const q = activeAssessment.questions.find((x) => x.id === qId);
    if (!q) return;

    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      const currentCodeObj = copy[qId] || {};
      
      // If code was untouched, default it to the new language's boilerplate
      const defaultOfPrevLang = q.languages.find((l) => l.id === currentCodeObj.language)?.defaultCode || "";
      const isUntouched = currentCodeObj.code === defaultOfPrevLang;

      const newDefaultCode = q.languages.find((l) => l.id === newLangId)?.defaultCode || "";

      copy[qId] = {
        language: newLangId,
        code: isUntouched ? newDefaultCode : currentCodeObj.code
      };
      return copy;
    });

    setConsoleLogs((prev) => [
      ...prev,
      { type: 'info', text: `Switched language to ${newLangId.toUpperCase()}.` }
    ]);
  };

  const handleCodeChange = (qId, newCode) => {
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      copy[qId] = {
        ...copy[qId],
        code: newCode
      };
      return copy;
    });
  };

  const handleRunCode = () => {
    if (isRunningCode) return;
    setIsRunningCode(true);

    const activeLanguage = selectedAnswers[currentQuestion.id]?.language || 'python';
    const activeCode = selectedAnswers[currentQuestion.id]?.code || '';

    setConsoleLogs((prev) => [
      ...prev,
      { type: 'info', text: `[${new Date().toLocaleTimeString()}] Running compilation suite using judge0 sandbox...` },
      { type: 'info', text: `Target Language: ${activeLanguage.toUpperCase()}` }
    ]);

    // Simulate compilation latency
    setTimeout(() => {
      const results = [];
      let allPassed = true;

      // Basic heuristic verification for mock compiler output
      currentQuestion.testCases.forEach((tc, idx) => {
        const isHiddenStr = tc.isHidden ? " (Hidden)" : "";
        results.push({
          type: 'info',
          text: `Executing Test Case ${idx + 1}${isHiddenStr}...`
        });

        // Simple validation rule: check if student completed functions or didn't just return 0
        const isSkeleton = activeCode.includes("return 0") || activeCode.includes("return closest_sum") || activeCode.includes("return stack.isEmpty()") || activeCode.trim().length < 80;
        
        if (isSkeleton) {
          allPassed = false;
          results.push({
            type: 'error',
            text: `✖ Test Case ${idx + 1}${isHiddenStr} Failed.\nInput: ${tc.input}\nExpected: ${tc.expectedOutput}\nActual: Output was empty/boilerplate standard response.`
          });
        } else {
          results.push({
            type: 'success',
            text: `✔ Test Case ${idx + 1}${isHiddenStr} Passed.`
          });
        }
      });

      setConsoleLogs((prev) => [
        ...prev,
        ...results,
        {
          type: allPassed ? 'success' : 'error',
          text: allPassed 
            ? `🎉 SUCCESS: All test cases passed for ${currentQuestion.title}!` 
            : `⚠️ WARNING: Some test cases failed. Adjust code complexity.`
        }
      ]);
      setIsRunningCode(false);
      setCodingActiveTab("testcases"); // Switch tab to show results
    }, 1200);
  };

  const clearConsole = () => {
    setConsoleLogs([]);
  };

  // ==========================================
  // 8. ASSESSMENT EVALUATOR & SUBMISSION
  // ==========================================
  const triggerAutoSubmission = () => {
    handleSubmit(true);
  };

  const handleSubmit = (isAuto = false) => {
    setIsConfirmModalOpen(false);

    // Calculate score
    let score = 0;
    const details = [];

    if (activeAssessment.assessmentType === "MCQ") {
      activeAssessment.questions.forEach((q) => {
        const answer = selectedAnswers[q.id];
        let correct = false;

        if (q.type === "mcq") {
          correct = answer === q.correctAnswer;
        } else if (q.type === "msq") {
          const userArr = Array.isArray(answer) ? answer : [];
          const correctArr = q.correctAnswers;
          correct = 
            userArr.length === correctArr.length && 
            userArr.every((v, i) => v === correctArr[i]);
        }

        if (correct) score++;
        details.push({
          questionId: q.id,
          topic: q.topic,
          correct
        });
      });

      const maxScore = activeAssessment.questions.length;
      const percentage = Math.round((score / maxScore) * 100);
      const passed = percentage >= activeAssessment.passPercentage;

      const resultsPayload = {
        score,
        maxScore,
        percentage,
        passed,
        details,
        isAuto
      };

      setAssessmentResults(resultsPayload);
      setIsSubmitted(true);

      // Clean storage
      localStorage.removeItem(LS_STATE_KEY);
    } else {
      // Coding evaluation simulation
      // Give each question 50 points
      let codingScore = 0;
      const maxCodingScore = activeAssessment.questions.length * 100;
      
      activeAssessment.questions.forEach((q) => {
        const answer = selectedAnswers[q.id] || {};
        const codeText = answer.code || "";
        
        // Simulating Judge0 test case evaluation
        let passedCases = 0;
        const totalCases = q.testCases.length;

        // Check code quality heuristics
        const hasWork = codeText.trim().length > 100 && !codeText.includes("return 0");
        if (hasWork) {
          // If they typed something and didn't leave boilerplate, simulate passing all cases
          passedCases = totalCases;
          codingScore += 100;
        } else {
          // Boilered/empty
          passedCases = 1; // passes one default input case
          codingScore += 33;
        }

        details.push({
          questionId: q.id,
          title: q.title,
          passedCases,
          totalCases
        });
      });

      const percentage = Math.round((codingScore / maxCodingScore) * 100);
      const passed = percentage >= activeAssessment.passPercentage;

      // Formulate custom AI Review Feedback
      const aiFeedback = percentage >= 80 
        ? "Excellent clean implementation. Code respects constraints, leverages optimal lookup spaces (two-pointer slide), and limits memory expansions. Maintain this structure in production pipelines."
        : "Standard logic matches expected outcomes, but time complexity is suboptimal. Consider pre-sorting references to use double pointers instead of nested iteration grids (O(N^2) reduces to O(N log N)).";

      const resultsPayload = {
        score: codingScore,
        maxScore: maxCodingScore,
        percentage,
        passed,
        details,
        aiFeedback,
        isAuto
      };

      setAssessmentResults(resultsPayload);
      setIsSubmitted(true);
      
      // Clean storage
      localStorage.removeItem(LS_STATE_KEY);
    }
  };

  // Helper to draw code line gutter
  const getLineNumbers = () => {
    const code = selectedAnswers[currentQuestion.id]?.code || '';
    const lines = code.split('\n').length;
    return Array.from({ length: Math.max(lines, 15) }, (_, i) => i + 1);
  };

  // ==========================================
  // 9. RENDERING SUB-VIEWS
  // ==========================================

  // Results View
  if (isSubmitted && assessmentResults) {
    const res = assessmentResults;
    return (
      <div className="results-container">
        <div className="results-card">
          <div className="results-header">
            <div className="modal-icon-wrapper">
              <Icon name="check-circle" style={{ width: '32px', height: '32px' }} />
            </div>
            <h2 className="results-title">Assessment Completed!</h2>
            {res.isAuto && (
              <span className="result-badge failed" style={{ margin: '8px 0' }}>
                Auto-Submitted (Timer Expired)
              </span>
            )}
            <span className={`result-badge ${res.passed ? 'passed' : 'failed'}`}>
              {res.passed ? 'Passed' : 'Failed'}
            </span>
          </div>

          <div className="score-display">
            <span className="score-number">{res.percentage}%</span>
            <span className="score-max">
              Score: {res.score} / {res.maxScore} (Pass Target: {activeAssessment.passPercentage}%)
            </span>
          </div>

          <div className="results-grid">
            <div className="result-stat-item">
              <span className="stat-label">Assessment Title</span>
              <span className="stat-value">{activeAssessment.title}</span>
            </div>
            <div className="result-stat-item">
              <span className="stat-label">Assessment Type</span>
              <span className="stat-value">{activeAssessment.assessmentType}</span>
            </div>
          </div>

          {activeAssessment.assessmentType === "Coding" && res.aiFeedback && (
            <div className="ai-feedback-section">
              <div className="ai-feedback-header">
                <Icon name="zap" style={{ width: '16px', height: '16px' }} />
                <span>AI Feedback & Code Review</span>
              </div>
              <div className="ai-feedback-content">
                {res.aiFeedback}
              </div>
            </div>
          )}

          <button 
            type="button" 
            className="assessment-btn btn-primary"
            onClick={() => onFinished && onFinished(res)}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="assessment-container">
      {/* 1. TOP BAR PANEL */}
      <header className="assessment-topbar">
        <div className="topbar-left">
          <h1 className="assessment-title">{activeAssessment.title}</h1>
          <span className="assessment-subtitle">
            Question {currentQuestionIndex + 1} of {activeAssessment.questions.length}
          </span>
        </div>
        <div className="topbar-right">
          <div className={`autosave-badge ${autosaveStatus}`}>
            <Icon 
              name={autosaveStatus === "saving" ? "clock" : "check"} 
              style={{ width: '14px', height: '14px' }} 
            />
            <span>{autosaveStatus === "saving" ? "Saving progress..." : "Progress Autosaved"}</span>
          </div>
          <div className={getTimerClass()}>
            <Icon name="clock" style={{ width: '18px', height: '18px' }} />
            <span>{formatTime(remainingTime)}</span>
          </div>
        </div>
      </header>

      {/* 2. WORKSPACE PANEL */}
      <main className="assessment-workspace">
        {activeAssessment.assessmentType === "MCQ" ? (
          // ================= MCQ MODE LAYOUT =================
          <div className="mcq-layout-workspace">
            <div className="mcq-content-panel">
              <div className="question-card">
                <div className="question-meta">
                  <span className="topic-badge">{currentQuestion.topic}</span>
                  <span className={`difficulty-badge ${currentQuestion.difficulty}`}>
                    {currentQuestion.difficulty}
                  </span>
                </div>
                <div className="question-text">
                  {currentQuestion.questionText}
                </div>
                <div className="options-list">
                  {currentQuestion.options.map((option, idx) => {
                    const isMulti = currentQuestion.type === "msq";
                    const isSelected = isMulti 
                      ? (selectedAnswers[currentQuestion.id] || []).includes(idx)
                      : selectedAnswers[currentQuestion.id] === idx;

                    return (
                      <div 
                        key={idx}
                        className={`option-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectOption(currentQuestion.id, idx, isMulti)}
                      >
                        <div className={isMulti ? "option-checkbox-indicator" : "option-radio-indicator"}>
                          {isSelected && isMulti && <Icon name="check" style={{ width: '14px', height: '14px', color: '#fff' }} />}
                        </div>
                        <div className="option-text-content">
                          {option}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar Navigation Grid */}
            <aside className="assessment-nav-panel">
              <h3 className="nav-panel-title">Assessment Navigator</h3>
              <div className="question-nav-grid">
                {activeAssessment.questions.map((q, idx) => {
                  let btnClass = "grid-nav-btn";
                  if (currentQuestionIndex === idx) btnClass += " active";
                  if (isQuestionAnswered(q.id)) btnClass += " answered";

                  return (
                    <button
                      key={q.id}
                      type="button"
                      className={btnClass}
                      onClick={() => setCurrentQuestionIndex(idx)}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="nav-legend">
                <div className="legend-item">
                  <div className="legend-color active"></div>
                  <span>Current Question</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color answered"></div>
                  <span>Answered / Saved</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color unanswered"></div>
                  <span>Unanswered</span>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          // ================= CODING MODE LAYOUT =================
          <div className="coding-layout-workspace">
            <div className="coding-split-container">
              {/* Left problem statement description */}
              <div className="problem-panel">
                <div className="problem-header">
                  <h2 className="problem-title">{currentQuestion.title}</h2>
                  <span className={`difficulty-badge ${currentQuestion.difficulty}`}>
                    {currentQuestion.difficulty}
                  </span>
                </div>
                <div className="problem-tabs">
                  <button 
                    type="button" 
                    className={`problem-tab-btn ${codingActiveTab === 'statement' ? 'active' : ''}`}
                    onClick={() => setCodingActiveTab('statement')}
                  >
                    Problem Description
                  </button>
                  <button 
                    type="button" 
                    className={`problem-tab-btn ${codingActiveTab === 'testcases' ? 'active' : ''}`}
                    onClick={() => setCodingActiveTab('testcases')}
                  >
                    Test Cases ({currentQuestion.testCases.length})
                  </button>
                </div>
                <div className="problem-scroll-container">
                  {codingActiveTab === "statement" ? (
                    <>
                      <div className="markdown-desc">
                        <p style={{ whiteSpace: 'pre-wrap' }}>{currentQuestion.problemStatement}</p>
                      </div>
                      <div>
                        <h4 className="problem-section-title">Constraints</h4>
                        <div className="markdown-desc">
                          <p style={{ whiteSpace: 'pre-wrap' }}>{currentQuestion.constraints}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="test-cases-section">
                      {currentQuestion.testCases.map((tc, idx) => (
                        <div key={tc.id} className="test-case-item">
                          <div className="test-case-header">
                            <span>Test Case {idx + 1}</span>
                            {tc.isHidden && <span className="tc-badge-hidden">Hidden Case</span>}
                          </div>
                          <div className="test-case-body">
                            <div className="tc-row">
                              <span className="tc-label">Input</span>
                              <div className="tc-value">{tc.input}</div>
                            </div>
                            {!tc.isHidden && (
                              <div className="tc-row">
                                <span className="tc-label">Expected Output</span>
                                <div className="tc-value">{tc.expectedOutput}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right text editor simulator */}
              <div className="editor-panel">
                <div className="editor-header">
                  <div className="editor-title">
                    <Icon name="file-text" style={{ width: '14px', height: '14px', color: '#0dcd94' }} />
                    <span>Solution.code</span>
                  </div>
                  <select
                    className="language-selector"
                    value={selectedAnswers[currentQuestion.id]?.language || 'python'}
                    onChange={(e) => handleLanguageChange(currentQuestion.id, e.target.value)}
                  >
                    {currentQuestion.languages.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="editor-workspace" style={{ padding: 0 }}>
                  <Editor
                    height="100%"
                    language={selectedAnswers[currentQuestion.id]?.language || 'python'}
                    theme={isDarkMode ? 'vs-dark' : 'light'}
                    value={selectedAnswers[currentQuestion.id]?.code || ''}
                    onChange={(value) => handleCodeChange(currentQuestion.id, value || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 4,
                      cursorBlinking: 'smooth',
                      padding: { top: 12, bottom: 12 }
                    }}
                  />
                </div>

                {/* Console results block */}
                <div className="editor-console-panel">
                  <div className="console-header">
                    <span className="console-title">Console Output</span>
                    {consoleLogs.length > 0 && (
                      <button type="button" className="console-clear-btn" onClick={clearConsole}>
                        Clear Output
                      </button>
                    )}
                  </div>
                  <div className="console-body">
                    {consoleLogs.length === 0 ? (
                      <span className="console-placeholder">Click 'Run Code' to execute compile actions...</span>
                    ) : (
                      consoleLogs.map((log, idx) => (
                        <div key={idx} className={`console-log-line ${log.type}`}>
                          {log.text}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. FOOTER CONTROL PANEL */}
      <footer className="assessment-footer">
        <div className="footer-left">
          <button
            type="button"
            className="assessment-btn btn-secondary"
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </button>
          {activeAssessment.assessmentType === "Coding" && (
            <button
              type="button"
              className="assessment-btn btn-secondary"
              onClick={handleRunCode}
              disabled={isRunningCode}
            >
              {isRunningCode ? "Executing..." : "Run Code"}
            </button>
          )}
        </div>

        {/* Small inline page links for coding challenge questions */}
        {activeAssessment.assessmentType === "Coding" && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeAssessment.questions.map((q, idx) => (
              <button
                key={q.id}
                type="button"
                className={`assessment-btn btn-secondary ${currentQuestionIndex === idx ? 'btn-primary' : ''}`}
                style={{ padding: '6px 12px', minWidth: '40px' }}
                onClick={() => setCurrentQuestionIndex(idx)}
              >
                Q{idx + 1}
              </button>
            ))}
          </div>
        )}

        <div className="footer-right">
          {currentQuestionIndex < activeAssessment.questions.length - 1 ? (
            <button
              type="button"
              className="assessment-btn btn-primary"
              onClick={handleNextQuestion}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="assessment-btn btn-success"
              onClick={() => setIsConfirmModalOpen(true)}
            >
              Submit Assessment
            </button>
          )}
        </div>
      </footer>

      {/* 4. CONFIRM SUBMIT DIALOG MODAL */}
      {isConfirmModalOpen && (
        <div className="submit-overlay">
          <div className="submit-modal">
            <div className="modal-icon-wrapper">
              <Icon name="alert-circle" style={{ width: '32px', height: '32px' }} />
            </div>
            <h3 className="modal-title">Submit Assessment?</h3>
            <p className="modal-message">
              Are you sure you want to submit your assessment? 
              Once submitted, you cannot change your answers or reopen the attempt.
            </p>
            <div className="modal-buttons">
              <button
                type="button"
                className="assessment-btn btn-secondary"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Go Back
              </button>
              <button
                type="button"
                className="assessment-btn btn-success"
                onClick={() => handleSubmit(false)}
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
