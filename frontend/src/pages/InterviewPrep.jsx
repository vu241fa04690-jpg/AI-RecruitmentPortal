import React, { useState, useEffect } from "react";
import {
  SparklesIcon,
  BrainIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ArrowUpRightIcon,
  ClockIcon
} from "../components/Icons";
import { api } from "../services/api";

const PRELOADED_QUESTIONS = [
  {
    id: "q-1",
    category: "dsa",
    categoryLabel: "DSA & Algorithms",
    difficulty: "Medium",
    companies: ["Google", "Amazon", "Microsoft"],
    question: "How do you detect a cycle in a linked list and find the start node of the cycle?",
    key_focus: "Floyd's Tortoise and Hare algorithm, O(n) time, O(1) space complexity.",
    model_answer: `Approach: Floyd's Cycle-Finding Algorithm (Tortoise & Hare)
1. Initialize two pointers: slow and fast at head.
2. Advance slow by 1 step, fast by 2 steps.
3. If fast reaches null, there is no cycle.
4. If fast == slow, a cycle exists.
5. To find the starting node: Reset slow to head while keeping fast at the meeting point. Advance both 1 step at a time until they meet. The node where they meet is the entry point of the cycle.
Time Complexity: O(N) | Space Complexity: O(1).`,
    sample_code: `def detectCycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            slow = head
            while slow != fast:
                slow = slow.next
                fast = fast.next
            return slow
    return None`
  },
  {
    id: "q-2",
    category: "backend",
    categoryLabel: "Backend & FastAPI",
    difficulty: "Medium",
    companies: ["TechCorp", "CognitiveFlow", "Uber"],
    question: "Explain how asynchronous I/O works in FastAPI with async/await and when you should avoid async def.",
    key_focus: "Python asyncio event loop, cooperative multitasking, non-blocking network calls vs CPU-heavy blocks.",
    model_answer: `Key Points:
- FastAPI runs on Starlette and Uvicorn utilizing Python's asyncio event loop.
- When an endpoint uses 'async def', FastAPI awaits non-blocking I/O operations (database queries, external HTTP calls).
- If an endpoint executes synchronous CPU-bound operations (e.g. heavy image processing, complex cryptography), executing it inside 'async def' blocks the entire event loop!
- Best Practice: Use normal 'def' for synchronous tasks (FastAPI automatically dispatches it to an external threadpool) or use Celery / background workers for long-running compute jobs.`,
    sample_code: `@app.get("/items")
async def get_items(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Item))
    return result.scalars().all()`
  },
  {
    id: "q-3",
    category: "frontend",
    categoryLabel: "Frontend & React",
    difficulty: "Medium",
    companies: ["Meta", "Flipkart", "Netflix"],
    question: "What causes unnecessary re-renders in React 18+ and how do you optimize component trees using memo, useMemo, and useCallback?",
    key_focus: "Referential equality of props, state colocation, useMemo vs useCallback nuances.",
    model_answer: `Optimization Strategies:
1. Referential Identity: In JavaScript, objects and functions are re-created on each render ({}, () => {}). Wrap functions passed to memoized children in useCallback() and expensive calculations in useMemo().
2. React.memo: Wrap pure child components to skip rendering if props haven't changed shallowly.
3. State Colocation: Push state down to the lowest subcomponent that actually needs it rather than keeping it at the top-level parent.
4. Use React 18 Transitions: Use startTransition() to mark non-urgent state updates without freezing user interaction.`,
    sample_code: `const MemoizedCard = React.memo(({ item, onSelect }) => {
  return <div onClick={() => onSelect(item.id)}>{item.name}</div>;
});`
  },
  {
    id: "q-4",
    category: "cloud",
    categoryLabel: "AWS & System Design",
    difficulty: "Hard",
    companies: ["Amazon", "AWS", "Stripe"],
    question: "How do you architect a resilient URL shortening service (like Bitly) handling 100M daily writes and 1B daily reads on AWS?",
    key_focus: "Hash generation (Base62), Redis caching, DynamoDB/Cassandra NoSQL partitioning, CloudFront CDN.",
    model_answer: `High-Level System Architecture:
1. DNS & Load Balancing: Route 53 with AWS Application Load Balancer distributing requests to ECS/EKS containerized services.
2. Short URL Key Generation: Base62 encoding (a-z, A-Z, 0-9) of a unique 64-bit integer generator (Twitter Snowflake or pre-generated counter tokens in Redis/ZooKeeper).
3. Read Path Optimization (10:1 Read-to-Write ratio):
   - Cache hot URLs in AWS ElastiCache for Redis with LRU eviction.
   - CloudFront CDN edge caching for popular redirection links.
4. Storage: Amazon DynamoDB or Cassandra with URL hash as Partition Key for predictable sub-10ms lookups.`,
    sample_code: `Key length calculation:
62^7 = ~3.5 Trillion unique URLs (plenty for 100M writes/day for 50 years).`
  },
  {
    id: "q-5",
    category: "behavioral",
    categoryLabel: "HR & Behavioral",
    difficulty: "Easy",
    companies: ["Amazon", "Microsoft", "Top Tier Startups"],
    question: "Tell me about a time you faced a critical production bug or tight deadline. How did you handle it? (STAR Method)",
    key_focus: "Situation, Task, Action, Result framework; composure under pressure; blameless post-mortem.",
    model_answer: `Framework Structure (STAR):
- Situation: Describe the exact context (e.g., 'During a major feature launch, our API latency spiked from 80ms to 4000ms under load').
- Task: Your specific responsibility ('I was tasked with diagnosing the bottleneck and restoring normal response times without downtime').
- Action: Concrete steps you took ('I analyzed APM metrics, identified an unindexed database query causing connection pool exhaustion, pushed an emergency hotfix with the missing compound index, and set up a Redis cache layer').
- Result: Quantifiable outcome ('Latency dropped back to 45ms, zero data was lost, and I wrote a post-mortem documenting automated index verification before deployments').`,
    sample_code: null
  },
  {
    id: "q-6",
    category: "dsa",
    categoryLabel: "DSA & Algorithms",
    difficulty: "Hard",
    companies: ["Google", "Directi", "Atlassian"],
    question: "Explain the LRU (Least Recently Used) Cache implementation with O(1) get and put operations.",
    key_focus: "Combination of Hash Map for O(1) lookup and Doubly Linked List for O(1) node relocation.",
    model_answer: `Data Structure Composition:
1. Hash Map (dict): Maps key -> Node reference for O(1) lookup.
2. Doubly Linked List (DLL): Stores items in order of recent access.
- Head sentinel: Most recently used.
- Tail sentinel: Least recently used.
When get(key): If in map, move node to head of DLL, return value.
When put(key, value): If key exists, update value and move to head. If new key and capacity full, remove tail node from DLL & hash map, then insert new node at head.`,
    sample_code: `class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.map = {}
        self.head, self.tail = Node(0, 0), Node(0, 0)
        self.head.next = self.tail
        self.tail.prev = self.head`
  },
  {
    id: "q-7",
    category: "python",
    categoryLabel: "Python",
    difficulty: "Medium",
    companies: ["Meta", "Netflix", "CognitiveFlow"],
    question: "What is Python's Global Interpreter Lock (GIL) and how does it affect CPU-bound vs I/O-bound concurrency?",
    key_focus: "GIL mutex mechanism, single-threaded execution of bytecode, multiprocessing vs asyncio for parallelism.",
    model_answer: `Key Concepts:
- The GIL is a mutex that prevents multiple native OS threads from executing Python bytecodes simultaneously in CPython.
- For I/O-bound tasks: Python threads release the GIL while waiting for network or disk operations, so threading and asyncio yield massive throughput gains.
- For CPU-bound tasks: Multi-threading does not achieve true multi-core speedup due to GIL contention. Solution: Use the 'multiprocessing' module or offload to C-extensions (NumPy, Cython).`,
    sample_code: `from multiprocessing import Pool
def cpu_heavy_task(n):
    return sum(i * i for i in range(n))

if __name__ == '__main__':
    with Pool() as p:
        results = p.map(cpu_heavy_task, [10**6, 10**6])`
  },
  {
    id: "q-8",
    category: "java",
    categoryLabel: "Java",
    difficulty: "Medium",
    companies: ["Amazon", "Oracle", "Goldman Sachs"],
    question: "Explain the JVM Memory Architecture: Heap vs Stack, and how Garbage Collection manages objects.",
    key_focus: "Young Generation (Eden, Survivor), Old/Tenured Generation, G1GC / ZGC algorithms, OutOfMemoryError.",
    model_answer: `Key Components:
1. Stack Memory: Stores primitive variables and references to heap objects per thread; fast, LIFO, deallocated on method return.
2. Heap Memory: Shared across threads storing actual objects and class instances. Divided into Young Gen (Eden, S0, S1) and Old Generation.
3. Garbage Collection: Minor GC reclaims short-lived objects from Eden. Surviving objects age and are tenured to Old Gen where Major/Full GC runs. Modern JVMs use G1GC or ZGC for sub-millisecond pauses.`,
    sample_code: `// Stack reference 'user' points to Heap instance
User user = new User("Sumii", 2026);`
  },
  {
    id: "q-9",
    category: "javascript",
    categoryLabel: "JavaScript",
    difficulty: "Medium",
    companies: ["Uber", "Airbnb", "Razorpay"],
    question: "Explain the JavaScript Event Loop: Microtasks (Promises) vs Macrotasks (setTimeout).",
    key_focus: "Call stack, Web APIs, Microtask queue priority over Task queue, event loop tick.",
    model_answer: `Execution Lifecycle:
1. Call Stack: Synchronous code executes immediately until completion.
2. Microtask Queue: Includes Promise.then callbacks, queueMicrotask, MutationObserver. Always drained completely after the current task before any macrotask runs!
3. Macrotask Queue: Includes setTimeout, setInterval, setImmediate, I/O events.
Rule: Microtasks have higher priority than macrotasks.`,
    sample_code: `console.log(1);
setTimeout(() => console.log(2), 0);
Promise.resolve().then(() => console.log(3));
console.log(4);
// Output order: 1, 4, 3, 2`
  },
  {
    id: "q-10",
    category: "dbms",
    categoryLabel: "DBMS & SQL",
    difficulty: "Medium",
    companies: ["Microsoft", "Flipkart", "Walmart"],
    question: "Explain ACID Properties and how Database Indexing (B+ Trees) speeds up query lookups.",
    key_focus: "Atomicity, Consistency, Isolation, Durability; B+ Tree node layout and range scan efficiency.",
    model_answer: `ACID Principles:
- Atomicity: Transactions are all-or-nothing (WAL / rollback).
- Consistency: DB invariants, constraints, and cascade rules maintained.
- Isolation: Concurrent transactions do not interfere (Read Committed, Serializable).
- Durability: Committed transactions persist even across power crashes.
B+ Tree Indexing:
Data records are stored in sorted leaf nodes linked as a doubly linked list. Non-leaf nodes act as routing guides. Search is O(log N) disk block reads.`,
    sample_code: `CREATE INDEX idx_candidate_email ON applications(candidate_email);
-- Speeds up exact and prefix searches from O(N) full table scan to O(log N)`
  },
  {
    id: "q-11",
    category: "os",
    categoryLabel: "Operating Systems",
    difficulty: "Medium",
    companies: ["Intel", "Qualcomm", "Cisco"],
    question: "What are the four necessary Coffman conditions for a Deadlock, and how can they be prevented?",
    key_focus: "Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait; Banker's Algorithm.",
    model_answer: `Coffman Conditions:
1. Mutual Exclusion: At least one resource held in non-shareable mode.
2. Hold and Wait: A process holds resources while requesting new ones.
3. No Preemption: Resources cannot be forcibly taken; must be released voluntarily.
4. Circular Wait: A closed chain of processes each waiting for a resource held by the next.
Prevention: Eliminating Circular Wait is most practical (impose a strict linear ordering on all resource acquisitions).`,
    sample_code: null
  },
  {
    id: "q-12",
    category: "cn",
    categoryLabel: "Computer Networks",
    difficulty: "Medium",
    companies: ["Cloudflare", "Akamai", "Google"],
    question: "Describe the TCP 3-Way Handshake and the difference between TCP and UDP.",
    key_focus: "SYN, SYN-ACK, ACK sequence numbers, reliability vs low-latency datagrams.",
    model_answer: `TCP 3-Way Handshake:
1. Client sends SYN (Synchronize sequence number X).
2. Server responds with SYN-ACK (Server sequence Y, Acknowledgement X + 1).
3. Client sends ACK (Acknowledgement Y + 1). Connection is established (ESTABLISHED state).
Comparison:
- TCP: Connection-oriented, guaranteed in-order delivery, flow control, congestion control (HTTP/1.1, HTTP/2, SSH).
- UDP: Connectionless, lightweight, no retransmissions, ideal for real-time gaming, live audio/video streaming, and DNS.`,
    sample_code: null
  }
];

// Interactive Live Mock Test Question Bank
const MOCK_TEST_TRACKS = [
  {
    id: "fullstack",
    title: "Full-Stack SDE & DSA Diagnostic Test",
    durationMinutes: 10,
    questionsCount: 6,
    tags: ["Python", "React", "DSA", "SQL"],
    targetRoles: "SDE-1, Software Interns (CognitiveFlow, Amazon)",
    questions: [
      {
        q: "What is the average time complexity of searching in a balanced Binary Search Tree (BST) and searching in a Hash Map?",
        options: [
          "O(N) for BST, O(log N) for Hash Map",
          "O(log N) for BST, O(1) for Hash Map",
          "O(1) for BST, O(log N) for Hash Map",
          "O(log N) for both"
        ],
        correct: 1,
        explanation: "A balanced BST has O(log N) search height, while a Hash Map provides average O(1) constant time lookup via hash indexing."
      },
      {
        q: "In React 18, what is the primary purpose of the 'useMemo' hook?",
        options: [
          "To cause a child component to re-render whenever parent state changes",
          "To memorize and cache the result of an expensive calculation between renders",
          "To perform asynchronous network fetch calls after component mount",
          "To directly mutate the DOM tree bypassing the virtual DOM"
        ],
        correct: 1,
        explanation: "useMemo caches the returned value of an expensive function call, recomputing only when specified dependencies change."
      },
      {
        q: "When building asynchronous REST API endpoints in FastAPI, which keyword is required to await database coroutines?",
        options: [
          "defer",
          "async def with await",
          "spawn thread",
          "yield from"
        ],
        correct: 1,
        explanation: "FastAPI is built on Starlette and Python asyncio. Endpoints declared with 'async def' use 'await' to pause execution without blocking the event loop."
      },
      {
        q: "Which HTTP status code should be returned when an authentication JWT token is missing or signature verification fails?",
        options: [
          "200 OK",
          "401 Unauthorized",
          "404 Not Found",
          "500 Internal Server Error"
        ],
        correct: 1,
        explanation: "401 Unauthorized is the standard HTTP status code indicating that the request lacks valid authentication credentials."
      },
      {
        q: "Which SQL clause is used to filter aggregated grouped records (e.g. COUNT(*) > 5)?",
        options: [
          "WHERE",
          "HAVING",
          "ORDER BY",
          "LIMIT"
        ],
        correct: 1,
        explanation: "WHERE filters rows before aggregation, while HAVING filters aggregated summary results produced by GROUP BY."
      },
      {
        q: "In Docker, what is the advantage of using a 'Multi-Stage Build' in the Dockerfile?",
        options: [
          "It forces containers to always run with root privileges",
          "It reduces the final production image size by separating build tools from the runtime",
          "It automatically encrypts network packets between containers",
          "It prevents containers from crashing on memory overflow"
        ],
        correct: 1,
        explanation: "Multi-stage builds allow compiling code with heavy SDKs in stage 1, then copying only the final binary into a minimal runtime image in stage 2."
      }
    ]
  },
  {
    id: "fastapi",
    title: "FastAPI & Distributed Backend Architecture",
    durationMinutes: 8,
    questionsCount: 5,
    tags: ["FastAPI", "Python", "Microservices", "Redis"],
    targetRoles: "Backend Engineers, Python Developers",
    questions: [
      {
        q: "Why should synchronous CPU-heavy algorithms NOT be executed directly inside an 'async def' FastAPI endpoint?",
        options: [
          "Because Python does not allow math operations inside async functions",
          "Because it blocks the single-threaded asyncio event loop, freezing all concurrent requests",
          "Because it crashes the Uvicorn ASGI server immediately",
          "Because FastAPI will automatically convert it to a GET request"
        ],
        correct: 1,
        explanation: "async def runs on the main asyncio event loop thread. A CPU-bound task blocks the loop from processing other incoming I/O events."
      },
      {
        q: "In FastAPI, what library is used for request body validation and automatic OpenAPI schema generation?",
        options: [
          "Pydantic",
          "Marshmallow",
          "Django ORM",
          "Flask-RESTful"
        ],
        correct: 0,
        explanation: "FastAPI leverages Pydantic for data parsing, type validation, and automatic OpenAPI documentation."
      },
      {
        q: "Which in-memory data store is most commonly used for distributed token bucket rate limiting and session caching?",
        options: [
          "Redis",
          "SQLite",
          "PostgreSQL",
          "HDFS"
        ],
        correct: 0,
        explanation: "Redis is an in-memory key-value data store with atomic operations (INCR, EXPIRE) ideal for sub-millisecond rate limiting."
      },
      {
        q: "What does the 'Depends' utility in FastAPI achieve?",
        options: [
          "It installs missing pip dependencies at runtime",
          "It implements Dependency Injection for database sessions, security tokens, and shared logic",
          "It schedules background cron tasks",
          "It compiles Python code to C extensions"
        ],
        correct: 1,
        explanation: "Depends is FastAPI's dependency injection system, enabling reusable authentication checks, database sessions, and parameters."
      },
      {
        q: "Which database index structure is typically the default for B-Tree indexing in PostgreSQL and MySQL?",
        options: [
          "B+ Tree",
          "Linked List",
          "Bloom Filter",
          "Red-Black Tree"
        ],
        correct: 0,
        explanation: "Relational databases use B+ Tree indexes for efficient range scans and logarithmic lookup times."
      }
    ]
  }
];

export default function InterviewPrep() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [expandedAnswers, setExpandedAnswers] = useState({});
  const [masteredIds, setMasteredIds] = useState({});

  // Dynamic Generator State
  const [customJobTitle, setCustomJobTitle] = useState("Full-Stack SDE Intern");
  const [customSkills, setCustomSkills] = useState("Python, FastAPI, React, Docker, DSA");
  const [customRound, setCustomRound] = useState("Technical & Live Problem Solving");
  const [customQuestions, setCustomQuestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Live Interactive Mock Test State
  const [activeMockTrack, setActiveMockTrack] = useState(null);
  const [mockCurrentQIdx, setMockCurrentQIdx] = useState(0);
  const [mockUserAnswers, setMockUserAnswers] = useState({});
  const [mockTimeRemaining, setMockTimeRemaining] = useState(600); // 10 mins
  const [mockIsFinished, setMockIsFinished] = useState(false);
  const [mockScoreData, setMockScoreData] = useState(null);

  // V2 AI Interactive Mock Interview State
  const [mainHubTab, setMainHubTab] = useState("interactive_ai"); // 'interactive_ai', 'timed_tests', 'history', 'curated'
  const [aiJobRole, setAiJobRole] = useState("Full-Stack Software Engineer");
  const [aiRoundType, setAiRoundType] = useState("Technical");
  const [aiCurrentQuestion, setAiCurrentQuestion] = useState(
    "How have you designed and maintained high-throughput services using Python and FastAPI in production?"
  );
  const [aiCandidateAnswer, setAiCandidateAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (mainHubTab === "history") {
      loadHistory();
    }
  }, [mainHubTab]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await api.getMockInterviewHistory();
      if (res?.history) {
        setAttemptHistory(res.history);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleGenerateAiQuestion = async () => {
    setIsEvaluating(true);
    try {
      const res = await api.getInterviewPrepAI({
        job_title: aiJobRole,
        skills: ["Python", "FastAPI", "React", "Docker", "System Architecture"],
        round_type: aiRoundType
      });
      if (res?.questions?.length) {
        const randQ = res.questions[Math.floor(Math.random() * res.questions.length)];
        setAiCurrentQuestion(randQ.question);
        setAiCandidateAnswer("");
        setEvalResult(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSubmitAnswerForEvaluation = async () => {
    if (!aiCandidateAnswer.trim()) {
      alert("Please enter your answer before submitting for AI evaluation.");
      return;
    }
    setIsEvaluating(true);
    try {
      const res = await api.evaluateInterviewAnswer({
        question: aiCurrentQuestion,
        candidate_answer: aiCandidateAnswer,
        job_role: aiJobRole,
        round_type: aiRoundType
      });
      setEvalResult(res);

      // Save to MongoDB Atlas
      await api.saveMockInterviewAttempt({
        job_title: aiJobRole,
        round_type: aiRoundType,
        question: aiCurrentQuestion,
        candidate_answer: aiCandidateAnswer,
        score: res.score,
        technical_accuracy: res.technical_accuracy,
        clarity: res.clarity,
        completeness: res.completeness,
        verdict: res.verdict,
        strengths: res.strengths,
        improvements: res.improvements,
        model_answer: res.model_answer
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Timer Effect
  useEffect(() => {
    let timer = null;
    if (activeMockTrack && !mockIsFinished) {
      timer = setInterval(() => {
        setMockTimeRemaining((prev) => {
          if (prev <= 1) {
            handleFinishMockTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeMockTrack, mockIsFinished]);

  const handleStartMockTest = (track) => {
    setActiveMockTrack(track);
    setMockCurrentQIdx(0);
    setMockUserAnswers({});
    setMockTimeRemaining(track.durationMinutes * 60);
    setMockIsFinished(false);
    setMockScoreData(null);
    window.scrollTo({ top: 200, behavior: "smooth" });
  };

  const handleSelectAnswer = (qIdx, optIdx) => {
    setMockUserAnswers((prev) => ({
      ...prev,
      [qIdx]: optIdx
    }));
  };

  const handleFinishMockTest = () => {
    if (!activeMockTrack) return;
    let correctCount = 0;
    activeMockTrack.questions.forEach((q, idx) => {
      if (mockUserAnswers[idx] === q.correct) {
        correctCount += 1;
      }
    });
    const total = activeMockTrack.questions.length;
    const scorePct = Math.round((correctCount / total) * 100);

    setMockScoreData({
      score: scorePct,
      correctCount,
      total,
      timeTakenSecs: activeMockTrack.durationMinutes * 60 - mockTimeRemaining
    });
    setMockIsFinished(true);
  };

  const toggleAnswer = (id) => {
    setExpandedAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleMastered = (id) => {
    setMasteredIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  };

  const allQuestionsList = [...customQuestions, ...PRELOADED_QUESTIONS];

  const filteredQuestions = allQuestionsList.filter((q) => {
    if (selectedCategory !== "all" && q.category !== selectedCategory) return false;
    if (selectedDifficulty !== "all" && q.difficulty.toLowerCase() !== selectedDifficulty.toLowerCase()) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px 60px" }}>
      {/* Top Banner */}
      <div style={{
        background: "linear-gradient(135deg, #0f2b48 0%, #1c4980 60%, #0066cc 100%)",
        borderRadius: 22,
        padding: "32px 36px",
        color: "#ffffff",
        marginBottom: 26,
        boxShadow: "0 10px 30px rgba(15, 43, 72, 0.3)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255, 255, 255, 0.16)",
            padding: "5px 14px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 800,
            marginBottom: 10,
            textTransform: "uppercase"
          }}>
            🎯 UNSTOP MOCK TEST & INTERVIEW SIMULATION HUB
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: -0.8, marginBottom: 8 }}>
            Interactive Mock Tests & Curated Technical Question Bank
          </h1>
          <p style={{ color: "#dbeafe", fontSize: 15, maxWidth: 760, lineHeight: 1.55 }}>
            Take timed multi-round mock exams, test your code and algorithmic problem solving with immediate scoring, and review model architectural solutions.
          </p>
        </div>
      </div>

      {/* Main Hub Tabs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 26, flexWrap: "wrap" }}>
        <button
          onClick={() => setMainHubTab("interactive_ai")}
          style={{
            padding: "12px 22px",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 14,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: mainHubTab === "interactive_ai" ? "#0066cc" : "#ffffff",
            color: mainHubTab === "interactive_ai" ? "#ffffff" : "#334155",
            boxShadow: mainHubTab === "interactive_ai" ? "0 6px 18px rgba(0, 102, 204, 0.3)" : "0 2px 6px rgba(0,0,0,0.04)"
          }}
        >
          🎙️ Live AI Mock Interview Evaluator
        </button>
        <button
          onClick={() => setMainHubTab("timed_tests")}
          style={{
            padding: "12px 22px",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 14,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: mainHubTab === "timed_tests" ? "#0066cc" : "#ffffff",
            color: mainHubTab === "timed_tests" ? "#ffffff" : "#334155",
            boxShadow: mainHubTab === "timed_tests" ? "0 6px 18px rgba(0, 102, 204, 0.3)" : "0 2px 6px rgba(0,0,0,0.04)"
          }}
        >
          ⏱️ Timed Exam Challenges
        </button>
        <button
          onClick={() => setMainHubTab("history")}
          style={{
            padding: "12px 22px",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 14,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: mainHubTab === "history" ? "#0066cc" : "#ffffff",
            color: mainHubTab === "history" ? "#ffffff" : "#334155",
            boxShadow: mainHubTab === "history" ? "0 6px 18px rgba(0, 102, 204, 0.3)" : "0 2px 6px rgba(0,0,0,0.04)"
          }}
        >
          📈 Performance & History
        </button>
        <button
          onClick={() => setMainHubTab("curated")}
          style={{
            padding: "12px 22px",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 14,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: mainHubTab === "curated" ? "#0066cc" : "#ffffff",
            color: mainHubTab === "curated" ? "#ffffff" : "#334155",
            boxShadow: mainHubTab === "curated" ? "0 6px 18px rgba(0, 102, 204, 0.3)" : "0 2px 6px rgba(0,0,0,0.04)"
          }}
        >
          📖 Curated Question Bank
        </button>
      </div>

      {/* TAB: INTERACTIVE AI MOCK EVALUATOR */}
      {mainHubTab === "interactive_ai" && (
        <div style={{ background: "#ffffff", borderRadius: 20, padding: "30px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", marginBottom: 30 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: 6 }}>
                ⚡ REAL-TIME AI EVALUATOR & SCORECARD
              </span>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f2b48", margin: 0 }}>
                Interactive Role-Specific Mock Interview Simulation
              </h2>
              <p style={{ color: "#64748b", fontSize: 13.5, margin: "4px 0 0" }}>
                Practice real interview questions. Receive instant scoring on technical depth, STAR structure, clarity, and model solutions.
              </p>
            </div>

            {/* Role & Round Selectors */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={aiJobRole}
                onChange={(e) => setAiJobRole(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #cbd5e1", fontSize: 13, fontWeight: 700 }}
              >
                <option value="Full-Stack Software Engineer">Full-Stack SDE</option>
                <option value="Backend FastAPI / Python Engineer">Backend Engineer</option>
                <option value="Frontend React Architect">Frontend Architect</option>
                <option value="AI / ML Research Engineer">AI / ML Engineer</option>
                <option value="Cloud DevOps / SRE Engineer">DevOps & Cloud SRE</option>
              </select>

              <select
                value={aiRoundType}
                onChange={(e) => setAiRoundType(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #cbd5e1", fontSize: 13, fontWeight: 700 }}
              >
                <option value="Technical">Technical & System Architecture</option>
                <option value="Behavioral">Behavioral & Leadership</option>
              </select>

              <button
                onClick={handleGenerateAiQuestion}
                disabled={isEvaluating}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: "#0f2b48",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: 13,
                  border: "none",
                  cursor: "pointer"
                }}
              >
                🎲 New Question
              </button>
            </div>
          </div>

          {/* Current Question Box */}
          <div style={{ background: "#f8fafc", border: "1.5px solid #bfdbfe", borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#0066cc", textTransform: "uppercase", marginBottom: 6 }}>
              Interviewer Prompt ({aiRoundType} Round)
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", lineHeight: 1.45 }}>
              "{aiCurrentQuestion}"
            </div>
          </div>

          {/* Answer Input Area */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "#1e293b", marginBottom: 6 }}>
              Your Response (Speak or Type structured answer using STAR method):
            </label>
            <textarea
              rows={6}
              value={aiCandidateAnswer}
              onChange={(e) => setAiCandidateAnswer(e.target.value)}
              placeholder="Structure your answer: 1. Context & Architecture chosen. 2. Implementation details and tradeoffs. 3. Measurable result or benchmarks achieved..."
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                border: "1.5px solid #cbd5e1",
                fontSize: 14,
                lineHeight: 1.6,
                fontFamily: "inherit"
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginTop: 4 }}>
              <span>Word count: {aiCandidateAnswer.trim().split(/\s+/).filter(Boolean).length} words</span>
              <span>Pro Tip: Aim for 60-120 words with concrete technical metrics.</span>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
            <button
              onClick={handleSubmitAnswerForEvaluation}
              disabled={isEvaluating}
              style={{
                padding: "12px 28px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #0066cc 0%, #00b4d8 100%)",
                color: "#ffffff",
                fontWeight: 900,
                fontSize: 15,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(0, 102, 204, 0.35)",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              {isEvaluating ? "Analyzing Technical Depth & Clarity..." : "⚡ Submit Answer to AI Evaluator"}
            </button>
          </div>

          {/* Evaluation Scorecard */}
          {evalResult && (
            <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 16, padding: "24px 28px", marginTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 38, fontWeight: 900, color: evalResult.score >= 75 ? "#15803d" : "#b45309" }}>
                    {evalResult.score}/100
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#065f46" }}>{evalResult.verdict}</div>
                    <div style={{ fontSize: 12.5, color: "#166534" }}>Saved to your Interview History in MongoDB Atlas</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 14 }}>
                  <div style={{ background: "#ffffff", padding: "6px 14px", borderRadius: 8, border: "1px solid #bbf7d0", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Technical Depth</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#0066cc" }}>{evalResult.technical_accuracy}%</div>
                  </div>
                  <div style={{ background: "#ffffff", padding: "6px 14px", borderRadius: 8, border: "1px solid #bbf7d0", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Structure & Clarity</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#0066cc" }}>{evalResult.clarity}%</div>
                  </div>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
                <div style={{ background: "#ffffff", padding: "16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: "#15803d" }}>✓ Key Strengths:</h4>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#334155", lineHeight: 1.5 }}>
                    {evalResult.strengths?.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ background: "#ffffff", padding: "16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: "#b45309" }}>⚡ Recommended Improvements:</h4>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#334155", lineHeight: 1.5 }}>
                    {evalResult.improvements?.map((imp, idx) => (
                      <li key={idx}>{imp}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Model Answer */}
              {evalResult.model_answer && (
                <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: 10, border: "1px solid #cbd5e1" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#0066cc", textTransform: "uppercase", marginBottom: 6 }}>
                    Architectural Model Response (FAANG Standard)
                  </div>
                  <p style={{ margin: 0, fontSize: 13.5, color: "#1e293b", lineHeight: 1.6 }}>
                    {evalResult.model_answer}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: ATTEMPT HISTORY */}
      {mainHubTab === "history" && (
        <div style={{ background: "#ffffff", borderRadius: 20, padding: "30px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", marginBottom: 30 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f2b48", margin: 0 }}>
                📈 Mock Interview History & Progression
              </h2>
              <p style={{ color: "#64748b", fontSize: 13.5, margin: "4px 0 0" }}>
                Track your scores, technical depth metrics, and improvement across all practice sessions in MongoDB Atlas.
              </p>
            </div>
            <button
              onClick={loadHistory}
              style={{ padding: "8px 16px", borderRadius: 8, background: "#f1f5f9", border: "1px solid #cbd5e1", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              🔄 Refresh Log
            </button>
          </div>

          {isLoadingHistory ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading history...</div>
          ) : attemptHistory.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>No mock interview attempts recorded yet.</p>
              <p style={{ fontSize: 13, margin: "6px 0 16px" }}>Take an interactive mock interview above to see your progress!</p>
              <button
                onClick={() => setMainHubTab("interactive_ai")}
                style={{ padding: "10px 20px", borderRadius: 8, background: "#0066cc", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                Start Practice Session
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {attemptHistory.map((att) => (
                <div key={att._id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 22px", background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: att.score >= 75 ? "#16a34a" : "#ca8a04" }}>
                        {att.score}/100
                      </span>
                      <span className="badge badge-primary">{att.job_title}</span>
                      <span className="badge badge-neutral">{att.round_type}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                      {att.created_at ? new Date(att.created_at).toLocaleDateString() : "Recent"}
                    </span>
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                    "{att.question}"
                  </div>
                  <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, background: "#ffffff", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <strong>Your Response:</strong> {att.candidate_answer?.slice(0, 220)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 1: LIVE INTERACTIVE MOCK TEST SIMULATOR */}
      {(mainHubTab === "timed_tests" || activeMockTrack) && (
        activeMockTrack ? (
        <div style={{
          background: "#ffffff",
          borderRadius: 22,
          padding: "28px 32px",
          border: "2px solid #0066cc",
          boxShadow: "0 12px 36px rgba(0, 102, 204, 0.2)",
          marginBottom: 32,
          animation: "modalFadeIn 0.25s ease-out"
        }}>
          {!mockIsFinished ? (
            <div>
              {/* Mock Test Header Bar */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 14,
                paddingBottom: 18,
                borderBottom: "1px solid #e2e8f0",
                marginBottom: 20
              }}>
                <div>
                  <span className="badge badge-primary" style={{ marginBottom: 4 }}>
                    🔴 LIVE TIMED MOCK TEST
                  </span>
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                    {activeMockTrack.title}
                  </h2>
                </div>

                {/* Countdown Timer & Submit */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: mockTimeRemaining < 120 ? "#fef2f2" : "#f0fdf4",
                    color: mockTimeRemaining < 120 ? "#dc2626" : "#15803d",
                    padding: "8px 16px",
                    borderRadius: 12,
                    fontWeight: 900,
                    fontSize: 16,
                    border: `1.5px solid ${mockTimeRemaining < 120 ? "#fca5a5" : "#86efac"}`
                  }}>
                    <ClockIcon size={18} />
                    <span>{formatTimer(mockTimeRemaining)} Remaining</span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleFinishMockTest}
                    style={{ padding: "9px 20px", fontWeight: 800, background: "#166534" }}
                  >
                    Submit Test ✓
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMockTrack(null)}
                    style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "9px 12px", color: "#64748b", fontWeight: 700 }}
                  >
                    Quit
                  </button>
                </div>
              </div>

              {/* Question Progress Stepper */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#0066cc" }}>
                  Question {mockCurrentQIdx + 1} of {activeMockTrack.questions.length}
                </span>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  {Object.keys(mockUserAnswers).length} answered
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ height: 6, background: "#e2e8f0", borderRadius: 4, marginBottom: 24, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${((mockCurrentQIdx + 1) / activeMockTrack.questions.length) * 100}%`,
                  background: "linear-gradient(90deg, #0066cc, #00b4d8)",
                  transition: "width 0.3s ease"
                }} />
              </div>

              {/* Current Question Body */}
              <div style={{
                background: "#f8fafc",
                padding: "24px 26px",
                borderRadius: 16,
                border: "1px solid #e2e8f0",
                marginBottom: 24
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 18, lineHeight: 1.45 }}>
                  {activeMockTrack.questions[mockCurrentQIdx].q}
                </h3>

                {/* Multiple Choice Options */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {activeMockTrack.questions[mockCurrentQIdx].options.map((opt, optIdx) => {
                    const isSelected = mockUserAnswers[mockCurrentQIdx] === optIdx;
                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectAnswer(mockCurrentQIdx, optIdx)}
                        style={{
                          background: isSelected ? "#e0f2fe" : "#ffffff",
                          border: isSelected ? "2px solid #0073e6" : "1.5px solid #cbd5e1",
                          borderRadius: 12,
                          padding: "14px 18px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          transition: "all 0.18s ease"
                        }}
                      >
                        <div style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          border: isSelected ? "2px solid #0073e6" : "2px solid #94a3b8",
                          background: isSelected ? "#0073e6" : "transparent",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                          fontSize: 12,
                          flexShrink: 0
                        }}>
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: isSelected ? 700 : 500, color: isSelected ? "#0f2b48" : "#334155" }}>
                          {opt}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stepper Navigation */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={mockCurrentQIdx === 0}
                  onClick={() => setMockCurrentQIdx((prev) => Math.max(0, prev - 1))}
                  style={{ padding: "9px 20px", fontWeight: 700 }}
                >
                  ← Previous
                </button>

                {mockCurrentQIdx < activeMockTrack.questions.length - 1 ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setMockCurrentQIdx((prev) => Math.min(activeMockTrack.questions.length - 1, prev + 1))}
                    style={{ padding: "9px 24px", fontWeight: 800 }}
                  >
                    Next Question →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleFinishMockTest}
                    style={{ padding: "10px 28px", fontWeight: 900, background: "linear-gradient(135deg, #059669, #10b981)" }}
                  >
                    Submit & View Results 🏆
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Mock Test Finished Report Card */
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{
                width: 76,
                height: 76,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                boxShadow: "0 8px 24px rgba(16, 185, 129, 0.3)"
              }}>
                <CheckCircleIcon size={42} />
              </div>

              <span className="badge badge-ppo" style={{ fontSize: 13, marginBottom: 8 }}>
                ★ EXAM COMPLETED & EVALUATED
              </span>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginBottom: 6 }}>
                Performance Diagnostic Report
              </h2>
              <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
                Assessment completed in {Math.floor(mockScoreData.timeTakenSecs / 60)}m {mockScoreData.timeTakenSecs % 60}s.
              </p>

              {/* Score Display Card */}
              <div style={{
                maxWidth: 420,
                margin: "0 auto 28px",
                background: "#f0fdf4",
                border: "2px solid #86efac",
                borderRadius: 18,
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#166534", textTransform: "uppercase" }}>Final Score</div>
                  <div style={{ fontSize: 14, color: "#15803d", fontWeight: 700 }}>
                    {mockScoreData.correctCount} of {mockScoreData.total} Correct
                  </div>
                </div>
                <div style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: "#15803d"
                }}>
                  {mockScoreData.score}%
                </div>
              </div>

              {/* Review Question Breakdown */}
              <div style={{ textAlign: "left", marginBottom: 28 }}>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>
                  Question-by-Question Review:
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {activeMockTrack.questions.map((q, idx) => {
                    const isCorrect = mockUserAnswers[idx] === q.correct;
                    return (
                      <div
                        key={idx}
                        style={{
                          background: isCorrect ? "#f0fdf4" : "#fef2f2",
                          border: isCorrect ? "1px solid #bbf7d0" : "1px solid #fecaca",
                          borderRadius: 12,
                          padding: "14px 18px"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: isCorrect ? "#15803d" : "#b91c1c" }}>
                            Q{idx + 1}: {isCorrect ? "✓ Correct (+1)" : "✕ Incorrect"}
                          </span>
                          <span style={{ fontSize: 12, color: "#64748b" }}>
                            Correct Answer: Option {String.fromCharCode(65 + q.correct)}
                          </span>
                        </div>
                        <p style={{ fontSize: 13.5, color: "#0f172a", fontWeight: 600, margin: "0 0 6px" }}>{q.q}</p>
                        <p style={{ fontSize: 12.5, color: "#475569", margin: 0 }}>
                          <strong>Explanation:</strong> {q.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleStartMockTest(activeMockTrack)}
                  style={{ padding: "10px 22px", fontWeight: 700 }}
                >
                  Retake Test ↺
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveMockTrack(null)}
                  style={{ padding: "10px 24px", fontWeight: 800 }}
                >
                  Done & Back to Practice Hub
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Mock Test Tracks Showcase */
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#1c4980", margin: 0 }}>
                ⚡ Timed Mock Exam Challenges (Live Simulation)
              </h2>
              <p style={{ fontSize: 13.5, color: "#64748b", margin: "2px 0 0" }}>
                Select a timed mock test to simulate real Unstop coding challenges and company assessment rounds.
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 18 }}>
            {MOCK_TEST_TRACKS.map((track) => (
              <div
                key={track.id}
                className="card card-hover"
                style={{
                  padding: "24px",
                  border: "1.5px solid #bfdbfe",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span className="badge badge-primary" style={{ fontSize: 11 }}>
                      ⏱️ {track.durationMinutes} Minutes
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0066cc" }}>
                      {track.questionsCount} Questions
                    </span>
                  </div>

                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
                    {track.title}
                  </h3>
                  <p style={{ fontSize: 12.5, color: "#64748b", marginBottom: 14 }}>
                    Target: {track.targetRoles}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 18 }}>
                    {track.tags.map((t, idx) => (
                      <span key={idx} className="badge badge-neutral" style={{ fontSize: 11 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleStartMockTest(track)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    fontWeight: 800,
                    fontSize: 13,
                    background: "linear-gradient(135deg, #0066cc 0%, #00b4d8 100%)",
                    boxShadow: "0 4px 12px rgba(0, 102, 204, 0.3)"
                  }}
                >
                  ▶ Start Live Mock Test ({track.durationMinutes}m)
                </button>
              </div>
            ))}
          </div>
        </div>
      )
      )}

      {/* SECTION 2: CURATED QUESTION LIBRARY */}
      {mainHubTab === "curated" && (
      <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "#1c4980", margin: 0 }}>
          📖 Curated Technical Question Library ({filteredQuestions.length})
        </h2>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <button
          className={`filter-pill ${selectedCategory === "all" ? "filter-pill-active" : ""}`}
          onClick={() => setSelectedCategory("all")}
        >
          All Topics
        </button>
        <button
          className={`filter-pill ${selectedCategory === "dsa" ? "filter-pill-active" : ""}`}
          onClick={() => setSelectedCategory("dsa")}
        >
          💻 DSA & Algorithms
        </button>
        <button
          className={`filter-pill ${selectedCategory === "python" ? "filter-pill-active" : ""}`}
          onClick={() => setSelectedCategory("python")}
        >
          🐍 Python
        </button>
        <button
          className={`filter-pill ${selectedCategory === "java" ? "filter-pill-active" : ""}`}
          onClick={() => setSelectedCategory("java")}
        >
          ☕ Java
        </button>
        <button
          className={`filter-pill ${selectedCategory === "javascript" ? "filter-pill-active" : ""}`}
          onClick={() => setSelectedCategory("javascript")}
        >
          ⚡ JavaScript
        </button>
        <button
          className={`filter-pill ${selectedCategory === "frontend" ? "filter-pill-active" : ""}`}
          onClick={() => setSelectedCategory("frontend")}
        >
          ⚛️ React
        </button>
        <button
          className={`filter-pill ${selectedCategory === "dbms" ? "filter-pill-active" : ""}`}
          onClick={() => setSelectedCategory("dbms")}
        >
          🗄️ DBMS & SQL
        </button>
        <button
          className={`filter-pill ${selectedCategory === "os" ? "filter-pill-active" : ""}`}
          onClick={() => setSelectedCategory("os")}
        >
          🖥️ Operating Systems
        </button>
        <button
          className={`filter-pill ${selectedCategory === "cn" ? "filter-pill-active" : ""}`}
          onClick={() => setSelectedCategory("cn")}
        >
          🌐 Computer Networks
        </button>
        <button
          className={`filter-pill ${selectedCategory === "backend" ? "filter-pill-active" : ""}`}
          onClick={() => setSelectedCategory("backend")}
        >
          ⚙️ Backend & FastAPI
        </button>
        <button
          className={`filter-pill ${selectedCategory === "behavioral" ? "filter-pill-active" : ""}`}
          onClick={() => setSelectedCategory("behavioral")}
        >
          🤝 HR & Behavioral
        </button>
      </div>

      {/* Questions Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filteredQuestions.map((q) => {
          const isExpanded = expandedAnswers[q.id];
          return (
            <div key={q.id} className="card card-hover" style={{ padding: "22px 26px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className="badge badge-primary">{q.categoryLabel}</span>
                  <span className="badge badge-info">{q.difficulty}</span>
                  {q.companies?.map((c, cIdx) => (
                    <span key={cIdx} style={{ fontSize: 11, background: "#f1f5f9", color: "#475569", padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>
                      🏢 {c}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => toggleMastered(q.id)}
                  style={{
                    background: masteredIds[q.id] ? "#ecfdf5" : "#f1f5f9",
                    color: masteredIds[q.id] ? "#047857" : "#64748b",
                    border: "none",
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: 11.5,
                    fontWeight: 700
                  }}
                >
                  {masteredIds[q.id] ? "✓ Mastered" : "Mark Mastered"}
                </button>
              </div>

              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 12, lineHeight: 1.4 }}>
                {q.question}
              </h3>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
                <span style={{ fontSize: 12.5, color: "#64748b" }}>
                  Focus: <strong>{q.key_focus}</strong>
                </span>

                <button
                  type="button"
                  className="btn"
                  onClick={() => toggleAnswer(q.id)}
                  style={{
                    fontSize: 12,
                    padding: "6px 14px",
                    background: isExpanded ? "#e0f2fe" : "#f1f5f9",
                    color: isExpanded ? "#0369a1" : "#0f2b48",
                    fontWeight: 700,
                    borderRadius: 8
                  }}
                >
                  {isExpanded ? "Hide Model Solution ▴" : "View Model Solution ▾"}
                </button>
              </div>

              {isExpanded && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1.5px dashed #cbd5e1" }}>
                  <pre style={{
                    background: "#0f172a",
                    color: "#e2e8f0",
                    padding: "16px 18px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    overflowX: "auto"
                  }}>
                    {q.model_answer}
                    {q.sample_code && `\n\n--- Sample Code ---\n${q.sample_code}`}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
      )}
    </div>
  );
}
