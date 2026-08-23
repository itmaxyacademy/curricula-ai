import os
import json
import asyncio
import re
import uuid
import copy
from typing import Any
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables explicitly from backend/.env
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(env_path)
load_dotenv()

# Initialize client (OpenAI / OpenRouter)
openrouter_api_key = os.environ.get("OPENROUTER_API_KEY")
openai_api_key = os.environ.get("OPENAI_API_KEY", "MOCK_KEY_FOR_DEVELOPMENT")

client = None
if openrouter_api_key:
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=openrouter_api_key,
        timeout=30.0
    )
    OPENAI_MODEL = os.environ.get("OPENROUTER_MODEL", "openai/gpt-4o-mini")
else:
    if openai_api_key and openai_api_key != "MOCK_KEY_FOR_DEVELOPMENT":
        client = OpenAI(api_key=openai_api_key, timeout=30.0)
        OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    else:
        OPENAI_MODEL = "gpt-4o-mini"

def safe_load_json(raw_text: str):
    """Safely cleans and loads JSON strings, extracting JSON blocks and fixing trailing commas."""
    if not raw_text:
        return {}
    cleaned = raw_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except Exception:
        # Fallback: extract the outermost JSON object or array using regex
        match = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', cleaned)
        if match:
            target = match.group(1)
            try:
                return json.loads(target)
            except Exception:
                # Fix trailing commas
                fixed = re.sub(r',\s*([\]}])', r'\1', target)
                try:
                    return json.loads(fixed)
                except Exception:
                    pass
    return {}

# Mock generation data for offline demo fallback
MOCK_GROUNDING = {
    "tech_tags": ["Python", "Data Science", "Pandas", "NumPy"],
    "prerequisites": ["Basic Programming Knowledge", "Understanding of Variables and Loops"],
    "out_of_scope": ["Deep Learning", "Web Development", "Database Management"],
    "learning_outcomes": ["Load and inspect datasets using Pandas", "Filter and clean raw data", "Perform basic aggregations"],
    "target_audience": "Student"
}

MOCK_PROPOSALS = [
    {
        "id": 1,
        "title": "Practical Data Science Boot camp",
        "description": "A hands-on, project-driven approach focused on building immediate data cleaning and analysis skills.",
        "differentiators": "100% code-along, features real Kaggle datasets, zero heavy math theory.",
        "difficulty": "Beginner",
        "estimated_hours": 6,
        "target_user": "Students & Aspiring Data Analysts"
    },
    {
        "id": 2,
        "title": "Recommended Data Foundations",
        "description": "Our balanced curriculum blending core statistical theory with programming fundamentals.",
        "differentiators": "Structured homework, covers data visualization best practices, direct mentor feedback.",
        "difficulty": "Intermediate",
        "estimated_hours": 8,
        "target_user": "Junior Developers & Professionals"
    },
    {
        "id": 3,
        "title": "Advanced Analytical Pipeline",
        "description": "Deep dive into production-grade pipelines, automation, and advanced data modeling.",
        "differentiators": "Focuses on clean code principles, pipeline scalability, and cloud deployments.",
        "difficulty": "Advanced",
        "estimated_hours": 12,
        "target_user": "Software Engineers & Data Scientists"
    }
]

def get_default_candidate_tags(keyword: str, tech_tags: list = None) -> list:
    if tech_tags is None:
        tech_tags = []

    kw_lower = (keyword or "").lower()

    def kw_hits(keys):
        return any(
            re.search(rf"\b{re.escape(k)}\b", kw_lower) if len(k) <= 3 else k in kw_lower
            for k in keys
        )

    categories = [
        (["go", "golang", "concurrent", "microservice", "grpc", "pipeline"], [
            "Go (Golang)", "Concurrency", "Goroutines & Channels", "Microservices",
            "REST APIs", "gRPC", "Docker & Kubernetes", "CI/CD Pipelines",
            "System Architecture", "Performance Tuning"
        ]),
        (["python", "pandas", "numpy", "scikit", "jupyter", "data"], [
            "Python 3", "Data Science", "Pandas", "NumPy", "Data Visualization",
            "Machine Learning", "Jupyter Notebooks", "Data Analytics", "SQL & Databases", "ETL Pipelines"
        ]),
        (["ai", "machine learning", "deep learning", "llm", "neural", "gpt", "chatgpt", "tensorflow", "pytorch"], [
            "Generative AI", "Deep Learning", "Prompt Engineering", "LLM Integration",
            "Neural Networks", "PyTorch", "Transformers", "LangChain", "Vector Databases", "AI Ethics"
        ]),
        (["react", "native", "mobile", "javascript", "frontend", "web", "typescript", "html", "css", "vite"], [
            "React Native", "React 18", "JavaScript (ES6+)", "TypeScript",
            "State Management (Redux/Zustand)", "Component Architecture", "Mobile UI/UX",
            "REST API Integration", "Navigation & Routing", "Vite"
        ]),
        (["java", "spring", "backend", "hibernate"], [
            "Java", "Spring Boot", "Backend Development", "Microservices",
            "REST APIs", "SQL & Databases", "JPA/Hibernate", "System Architecture",
            "Docker & Kubernetes", "API Integration"
        ]),
        (["flutter", "dart"], [
            "Flutter", "Dart", "Mobile Development", "UI/UX",
            "State Management", "Widgets & Material Design", "REST API Integration",
            "Navigation & Routing", "Testing", "CI/CD Pipelines"
        ]),
        (["php", "laravel", "wordpress"], [
            "PHP", "Laravel", "Web Development", "MySQL",
            "Blade Templating", "Eloquent ORM", "REST APIs", "Frontend Development",
            "Docker & Kubernetes", "API Integration"
        ]),
        (["digital marketing", "seo", "content marketing", "social media", "copywriting"], [
            "Digital Marketing", "SEO", "Content Marketing", "Social Media Marketing",
            "Google Analytics", "Email Marketing", "Copywriting", "Brand Strategy",
            "Performance Marketing", "Market Research"
        ]),
        (["devops", "kubernetes", "docker", "aws", "azure", "cloud", "cicd", "terraform", "infrastructure"], [
            "DevOps", "Docker & Kubernetes", "CI/CD Pipelines", "Cloud Computing",
            "Infrastructure as Code", "Terraform", "Monitoring & Observability", "System Architecture",
            "AWS", "Security Best Practices"
        ]),
        (["blockchain", "solidity", "web3", "smart contract", "ethereum"], [
            "Blockchain", "Solidity", "Smart Contracts", "Web3",
            "Decentralized Applications", "Cryptography", "Ethereum", "Tokenomics",
            "Security Best Practices", "Smart Contract Testing"
        ]),
        (["president", "presiden", "pilih", "election", "vote", "politics", "politik", "civic", "govern", "democra"], [
            "Political Science", "Civic Education", "Public Leadership", "Electoral Systems",
            "Democratic Governance", "Policy Analysis", "Constitutional Law", "Ethics in Leadership",
            "Public Administration", "Informed Decision-Making"
        ]),
        (["business", "leadership", "management", "startup", "product", "agile", "strategy"], [
            "Strategic Leadership", "Business Strategy", "Product Management", "Agile Methodologies",
            "Decision Frameworks", "Stakeholder Management", "Operations", "Design Thinking"
        ]),
    ]

    tech_candidates = []
    for keys, tags in categories:
        if kw_hits(keys):
            for tag in tags:
                if tag not in tech_candidates:
                    tech_candidates.append(tag)

    if not tech_candidates:
        tech_candidates = [
            "Critical Thinking", "Foundational Principles", "Practical Workflows",
            "Hands-on Case Studies", "Strategic Decision-Making", "Best Practices"
        ]

    edu_tags = [
        "Capstone Projects", "Project-Based Learning", "Experiential Learning",
        "Collaborative Learning", "Industry Partnerships", "Authentic Assessment",
        "AI in Education", "Workplace Simulation", "Constructive Alignment",
        "Team-Based Skills", "Project Management", "Problem-Based Learning",
        "Portfolio Development", "Agile Methodologies", "Learning Outcomes"
    ]

    combined = []
    for tag in list(tech_tags) + tech_candidates + edu_tags:
        if tag and tag not in combined:
            combined.append(tag)
    return combined[:20]

def generate_concept_and_grounding(keyword: str, tags: list = None, difficulty: str = "Beginner", audience: str = "Student", document_context: str = ""):
    candidate_tags = get_default_candidate_tags(keyword, tags)
    selected_tags = tags if tags and len(tags) > 0 else (candidate_tags[:3] if candidate_tags else ["Project-Based Learning", "Experiential Learning"])
    if not client:
        fallback_tags = candidate_tags
        return {
            "subject_context": f"This course provides a comprehensive guide to {keyword}, covering setup, core APIs, and real-world projects.",
            "grounding": {
                "tech_tags": fallback_tags[:3],
                "all_suggested_tags": fallback_tags,
                "prerequisites": [f"Basic understanding of {tags[0] if tags else keyword}", "Familiarity with terminal and basic programming"],
                "out_of_scope": ["Advanced multi-region cluster scaling", "Alternative legacy tooling"],
                "learning_outcomes": [f"Understand fundamental {tags[0] if tags else keyword} syntax and concepts", "Build a production-ready application", "Debug common runtime errors"],
                "target_audience": audience or "Professional"
            }
        }
    
    doc_snippet = f"\n\n[ATTACHED REFERENCE DOCUMENT CONTENT]:\n{document_context[:3500]}\n" if document_context else ""

    try:
        prompt = f"""
        [ROLE]
        You are an Intent Classification & Curriculum Extraction Engine.

        [DOMAIN CONTEXT & ACRONYM KNOWLEDGE]
        - Deeply understand global and Indonesian socio-political terms, national policies, government programs, and economic debates.
        - Specifically: 'MBG' refers to 'Makan Bergizi Gratis' (Free Nutritious Meal Program) — inquiries like 'kenapa mbg buruk' or 'analisis mbg' represent Public Policy, Nutritional Economics, Budget Logistics, Governance, and Food Safety. NEVER confuse 'MBG' with 'Bad Habits' or personal behavioral psychology!
        - Other key acronyms: IKN (Ibu Kota Nusantara), BPJS (National Healthcare/Insurance), Pilpres/Pilkada (Elections), Bansos (Social Assistance), KIP (Smart Indonesia Card), KUR (People's Business Credit).

        [TASK]
        Analyze the following user input for a course: '{keyword}'
        Target audience '{audience}', difficulty level '{difficulty}'.{doc_snippet}
        
        1. Analyze the user input and reference document if attached. If input contains typos, informal slang, or messy casing (e.g., 'belajar ai dAn python untk pemula'), automatically proofread, normalize, and formalize it into a clean, professional course topic.
           If the input is complete gibberish or random noise (e.g., 'asdfghjkl', '123456'), replace it with a high-quality, meaningful educational topic.
        2. Determine if this input is a simple topic (1-5 words) or an instructional prompt containing constraints.
        3. Extract a clean, professional 'display_title' (catchy, max 4-6 words) representing the core topic in proper Title Case (English). (e.g., for 'kenapa mbg buruk', title should be 'Evaluating the Free Nutritious Meal Policy: Challenges and Governance').
        4. Determine the 'course_domain' (e.g., "Public Policy & Governance", "Coding", "Business & Management", "Pedagogy & Design", "Humanities", etc.).
        5. Determine the best 'interactivity_type' (e.g., "Case Study Simulator", "Policy Analysis Worksheet", "Coding Sandbox", "Roleplay Simulator").
        6. Extract any explicit user instructions if present (e.g., '2 lesson', '1 hour', specific tools):
           - 'lesson_count' (integer, e.g., 2 if user wrote '2 lesson')
           - 'duration' (string, e.g., "1 hour")
           - 'tools' (array of strings)
           - 'final_project' (string)
           - 'explicit_outline' (array of strings)
        7. Generate standard grounding data:
           - A rich text content overview/context for this topic (2-3 paragraphs) strictly aligned with the true topic.
           - 20 relevant tags/topics in formal English.
           - 3 Prerequisites.
           - 3 Learning boundaries (out of scope topics).
           - 3 Expected learning outcomes.

        [FORMAT]
        Return a JSON object exactly like this:
        {{
          "is_complex": boolean,
          "display_title": "...",
          "course_domain": "...",
          "interactivity_type": "...",
          "explicit_parameters": {{
            "lesson_count": integer or null,
            "duration": "string or null",
            "tools": ["...", "..."],
            "final_project": "string or null",
            "explicit_outline": ["...", "..."]
          }},
          "subject_context": "string", 
          "all_suggested_tags": ["..."],
          "prerequisites": ["..."], 
          "out_of_scope": ["..."], 
          "learning_outcomes": ["..."], 
          "target_audience": "string"
        }}
        """
        # Using gpt-4o as explicitly requested for this router step
        router_model = "gpt-4o" if "gpt" in OPENAI_MODEL else OPENAI_MODEL
        
        response = client.chat.completions.create(
            model=router_model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=2500,
            temperature=0.7
        )
        data = safe_load_json(response.choices[0].message.content)
        
        # Store clean subject_context text without raw system brackets
        clean_context = data.get("subject_context", "").strip()
        import re
        clean_context = re.sub(r'\[(DOMAIN|INTERACTIVITY|TOOLS REQUIRED|FINAL PROJECT|EXPLICIT OUTLINE):[^\]]*\]\n?', '', clean_context).strip()
        injected_context = clean_context
        
        explicit_params = data.get("explicit_parameters", {})
        if not isinstance(explicit_params, dict):
            explicit_params = {}

        # Deterministic regex safety net for explicit lesson count and duration
        lesson_match = re.search(r'(\d+)\s*(?:lesson|lessons|modul|module|modules|chapter|chapters|pertemuan|materi|sesi)\b', keyword, re.IGNORECASE)
        if lesson_match:
            explicit_params["lesson_count"] = int(lesson_match.group(1))

        duration_match = re.search(r'(\d+)\s*(?:hour|hours|jam|hr|hrs|menit|minutes|mins|hari|days|weeks|minggu)\b', keyword, re.IGNORECASE)
        if duration_match:
            explicit_params["duration"] = duration_match.group(0)

        # Prioritize tools and key skills extracted by AI
        extracted_tools = explicit_params.get("tools", [])
        suggested_tags = data.get("all_suggested_tags", [])
        
        # Build prioritized selected tech tags
        selected_tech = []
        for t in extracted_tools + suggested_tags:
            if t and t not in selected_tech:
                selected_tech.append(t)
        if not selected_tech:
            selected_tech = get_default_candidate_tags(keyword)[:4]

        # Combine all suggested tags with extracted tools
        combined_suggested = []
        for t in selected_tech + suggested_tags:
            if t and t not in combined_suggested:
                combined_suggested.append(t)

        return {
            "display_title": data.get("display_title", keyword),
            "is_complex": data.get("is_complex", bool(explicit_params.get("lesson_count") or explicit_params.get("duration"))),
            "explicit_parameters": explicit_params,
            "subject_context": injected_context,
            "grounding": {
                "tech_tags": selected_tech[:4],
                "all_suggested_tags": combined_suggested[:20] if combined_suggested else get_default_candidate_tags(keyword),
                "prerequisites": data.get("prerequisites", []),
                "out_of_scope": data.get("out_of_scope", []),
                "learning_outcomes": data.get("learning_outcomes", []),
                "target_audience": data.get("target_audience", audience or "Student")
            }
        }
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        fallback_tags = get_default_candidate_tags(keyword)
        return {
            "subject_context": f"Failed to call API. Fallback context for {keyword}.",
            "grounding": {
                "tech_tags": fallback_tags[:3],
                "all_suggested_tags": fallback_tags,
                "prerequisites": MOCK_GROUNDING["prerequisites"],
                "out_of_scope": MOCK_GROUNDING["out_of_scope"],
                "learning_outcomes": MOCK_GROUNDING["learning_outcomes"],
                "target_audience": MOCK_GROUNDING["target_audience"]
            }
        }

def generate_proposals(keyword: str, grounding_data: dict):
    if not client:
        return MOCK_PROPOSALS
    
    try:
        prompt = f"""
        [ROLE]
        You are a Curriculum Strategist proposing 3 distinct course angles for the topic '{keyword}'.

        [TASK]
        Create exactly 3 curriculum proposals with genuinely different positioning:
        1. "Practical" — hands-on, project-first, minimal theory.
        2. "Recommended" — balanced theory + practice, the default safe choice.
        3. "Advanced" — deep, production-grade, assumes stronger prior knowledge.
        Grounding context: {json.dumps(grounding_data)}

        [RULES]
        - Each proposal's 'description' and 'differentiators' must be concrete and specific to '{keyword}' (no generic filler like "hands-on learning" without naming what is actually built or covered).
        - 'estimated_hours' must increase from Practical -> Recommended -> Advanced.
        - 'difficulty' must be one of: Beginner, Intermediate, Advanced (matching the proposal's positioning).

        [FORMAT]
        Return a pure JSON object, no preamble, exactly:
        {{
          "proposals": [
            {{"id": 1, "title": "...", "description": "...", "differentiators": "...", "difficulty": "Beginner", "estimated_hours": 6, "target_user": "..."}},
            {{"id": 2, "title": "...", "description": "...", "differentiators": "...", "difficulty": "Intermediate", "estimated_hours": 8, "target_user": "..."}},
            {{"id": 3, "title": "...", "description": "...", "differentiators": "...", "difficulty": "Advanced", "estimated_hours": 12, "target_user": "..."}}
          ]
        }}
        """
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=1500,
            temperature=0.7
        )
        data = safe_load_json(response.choices[0].message.content)
        # Ensure it returns list
        if "proposals" in data:
            return data["proposals"]
        return list(data.values())[0] if isinstance(data, dict) else data
    except Exception as e:
        print(f"Error generating proposals: {e}")
        return MOCK_PROPOSALS

def generate_structure(proposal_title: str, config: dict, grounding_data: dict):
    lessons_count = config.get('lessons_count', 4)
    fallback_topics = [
        f"Foundations & Setup",
        f"Core Workflows & Architecture",
        f"Practical Implementation & Hands-On Labs",
        f"Advanced Patterns & Optimization",
        f"Capstone Integration & Real-World Deployment",
        f"Scaling & Performance Tuning",
        f"Security & Enterprise Best Practices",
        f"Maintenance & Future Roadmap"
    ]
    
    fallback_sections = {
        "creator": [
            {"type": "custom_creator_1", "id": "custom-creator-1", "title": "Technical Deep Dive", "instruction": "Explain the underlying architecture and theoretical details of this lesson's concepts.", "locked": False},
            {"type": "custom_creator_2", "id": "custom-creator-2", "title": "Industry Implementation Patterns", "instruction": "Discuss real-world production setups and architectural patterns used in the industry.", "locked": False},
            {"type": "custom_creator_3", "id": "custom-creator-3", "title": "Performance Optimization Tips", "instruction": "Provide advice on profiling, optimizing, and scaling this topic's implementations.", "locked": False}
        ],
        "student": [
            {"type": "custom_student_1", "id": "custom-student-1", "title": "Hands-on Guided Lab", "instruction": "Provide a step-by-step programming exercise or setup guide for students.", "locked": False},
            {"type": "custom_student_2", "id": "custom-student-2", "title": "Self-Assessment Challenge", "instruction": "Formulate a challenge scenario to test the student's understanding.", "locked": False},
            {"type": "custom_student_3", "id": "custom-student-3", "title": "Real-World Case Study", "instruction": "Explain how this specific concept was applied in a real-world tech industry situation.", "locked": False}
        ],
        "educator": [
            {"type": "custom_educator_1", "id": "custom-educator-1", "title": "Active Learning Strategy", "instruction": "Describe an interactive class activity or roleplay scenario.", "locked": False},
            {"type": "custom_educator_2", "id": "custom-educator-2", "title": "Common Misconceptions", "instruction": "Detail top 3 misconceptions students have about this topic and how to correct them.", "locked": False},
            {"type": "custom_educator_3", "id": "custom-educator-3", "title": "Peer Review Activity", "instruction": "Outline a 10-minute peer-review discussion template for the class.", "locked": False}
        ]
    }
    
    fallback_lessons = [
        {
            "id": i, 
            "title": f"Lesson {i}: {fallback_topics[(i-1) % len(fallback_topics)]} ({proposal_title})", 
            "order": i,
            "sections": fallback_sections
        }
        for i in range(1, lessons_count + 1)
    ]
    
    if not client:
        return fallback_lessons
    
    try:
        prompt = f"""
        [ROLE]
        You are a Curriculum Architect designing the lesson-by-lesson roadmap for a course.

        [TASK]
        1. Design exactly {lessons_count} DISTINCT lessons for the course '{proposal_title}'.
        Grounding parameters (prerequisites, learning outcomes, tech tags, out-of-scope topics): {json.dumps(grounding_data)}.
        CRITICAL: You MUST return EXACTLY {lessons_count} items in the 'lessons' array. If an explicit outline contains more or fewer items, consolidate or adapt them so the final count of lessons returned is EXACTLY {lessons_count}.
        2. Design exactly 3 custom-tailored, highly relevant additional sections for EACH of the 3 roles (creator, student, educator). These 3 sections per role apply to the WHOLE course and will be used in EVERY lesson, so they must be topic-appropriate for the course as a whole, not for a single lesson.

        [RULES]
        - Each lesson title MUST be completely unique and specific (CRITICAL: NEVER repeat generic prefixes like 'Introduction to...' or repeat the exact same title across lessons).
        - Do NOT repeat the full course title verbatim inside every lesson name.
        - The custom sections must focus on specific, concrete technical topics related directly to the course concept.
        - Write a detailed instruction (1-2 sentences) for each custom section detailing what the AI should write in that section.
        - Exactly 3 custom sections per role. Do not add more.

        [FORMAT]
        Return a pure JSON object, no preamble, exactly:
        {{
          "lessons": [
            {{
              "id": 1,
              "title": "Lesson 1: Specific distinct foundational topic",
              "order": 1
            }},
            {{
              "id": 2,
              "title": "Lesson 2: Another distinct topic",
              "order": 2
            }}
          ],
          "sections": {{
            "creator": [
              {{"title": "Custom Topic Title 1", "instruction": "Detailed instruction for AI content generation about this topic."}},
              {{"title": "Custom Topic Title 2", "instruction": "Detailed instruction."}},
              {{"title": "Custom Topic Title 3", "instruction": "Detailed instruction."}}
            ],
            "student": [
              {{"title": "Student Challenge Title 1", "instruction": "Instruction."}},
              {{"title": "Student Tool Guide Title 2", "instruction": "Instruction."}},
              {{"title": "Student Case Study Title 3", "instruction": "Instruction."}}
            ],
            "educator": [
              {{"title": "Classroom Activity Title 1", "instruction": "Instruction."}},
              {{"title": "Misconceptions Guide Title 2", "instruction": "Instruction."}},
              {{"title": "Peer Review Guide Title 3", "instruction": "Instruction."}}
            ]
          }}
        }}
        The "lessons" array must contain exactly {lessons_count} items, ordered 1..{lessons_count}.
        """
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=1500,
            temperature=0.7
        )
        data = safe_load_json(response.choices[0].message.content)
        lessons = data.get("lessons")
        if isinstance(lessons, list) and len(lessons) > 0:
            # Build ONE shared set of custom sections per role, applied to ALL lessons
            shared = data.get("sections")
            if not isinstance(shared, dict):
                shared = lessons[0].get("sections") or {}
            processed_shared = {}
            for role_key in ["creator", "student", "educator"]:
                role_list = shared.get(role_key, []) if isinstance(shared, dict) else []
                if not isinstance(role_list, list):
                    role_list = []
                processed = []
                for idx, sec in enumerate(role_list):
                    if not isinstance(sec, dict):
                        sec = {}
                    title = sec.get("title", f"Custom Topic {idx+1}")
                    slug = re.sub(r'[^a-z0-9]+', '_', title.lower()).strip('_')[:30]
                    sec_type = (sec.get("type") or f"custom_{role_key}_{slug}")[:50]
                    processed.append({
                        "id": sec.get("id") or f"custom-{role_key}-{idx+1}-{uuid.uuid4().hex[:6]}",
                        "type": sec_type,
                        "title": title,
                        "instruction": sec.get("instruction", "Write curriculum content."),
                        "locked": False
                    })
                processed_shared[role_key] = processed

            if not any(processed_shared.get(r) for r in ["creator", "student", "educator"]):
                return fallback_lessons

            out_lessons = []
            for i, l in enumerate(lessons[:lessons_count]):
                raw_title = l.get("title") or fallback_topics[i % len(fallback_topics)]
                clean_title = re.sub(r'^Lesson\s*\d+[\s\:\.\-]*', '', raw_title, flags=re.IGNORECASE).strip()
                if not clean_title:
                    clean_title = raw_title
                out_lessons.append({
                    "id": l.get("id") or i + 1,
                    "title": clean_title,
                    "order": i + 1,
                    "sections": copy.deepcopy(processed_shared)
                })
            return out_lessons
        return fallback_lessons
    except Exception as e:
        print(f"Error generating structure: {e}")
        return fallback_lessons

async def generate_creator_content(lesson_title: str, grounding_data: str, lesson_structure: str, lesson_duration: str = "60 mins"):
    if not client:
        await asyncio.sleep(0.5)
        return {
            "overview": f"A comprehensive guide detailing {lesson_title}.",
            "learning_outcomes": ["Understand the core mechanics", "Implement standard exercises"],
            "core_content": f"### Introduction to {lesson_title}\nThis is the core content for {lesson_title}. Code block example:\n```python\nprint('Hello World')\n```",
            "exercises": [{"title": "Practice 1", "instruction": "Write a basic script", "difficulty": "Easy"}],
            "quiz": [{"question": "What is Python?", "options": ["Snake", "Language", "Coffee", "Car"], "answer": "Language", "explanation": "Python is a programming language."}],
            "prompt_templates": ["Create a mock generator script"]
        }
    
    prompt = f"""
    [ROLE]
    Anda adalah Curriculum Architect & Technical Content Creator Senior yang bertugas merancang dokumen induk teknis dan instruksional untuk modul kursus.
 
    [TASK]
    Berdasarkan struktur kurikulum dan parameter grounding berikut, hasilkan konten utama untuk POV CREATOR pada Lesson: "{lesson_title}".
    Target Durasi Belajar: {lesson_duration} per lesson.
    Parameter Grounding: {grounding_data}
    Struktur Lesson (daftar seluruh lesson dalam course ini, untuk konteks urutan & agar tidak tumpang tidak): {lesson_structure}
 
    [RULES]
    - NO FORCED CODING: Check the [DOMAIN: ...] in Grounding parameters. If the domain is NOT "Coding", you MUST NOT generate Python/Programming code snippets unless explicitly requested. Use frameworks, templates, or key scripts for non-coding topics.
    - Sesuaikan kedalaman materi core_content agar setara dengan materi bacaan/studi mandiri selama 40% dari total {lesson_duration} durasi pelajaran.
    - Tulis materi secara teknis, presisi, mendalam, dan komprehensif. Dilarang menulis ringkasan singkat atau hanya garis besar saja.
    - Berikan minimal dua sub-topik mendalam dalam core_content lengkap dengan penjelasan arsitektur dan contoh kasus nyata di industri.
    - Sertakan minimal satu blok implementasi teknis (atau framework/template jika non-coding). DILARANG KERAS menggunakan placeholder seperti '// TODO' atau 'pass' di dalam blok tersebut. Blok harus fungsional dan siap pakai.
 
    [FORMAT]
    Kembalikan output murni dalam JSON terstruktur:
    {{
      "overview": "2-3 kalimat deskripsi teknis yang spesifik untuk lesson '{lesson_title}' ini saja (bukan deskripsi umum tentang course secara keseluruhan)",
      "learning_outcomes": ["Outcome spesifik 1", "Outcome spesifik 2", "Outcome spesifik 3"],
      "core_content": "Materi lengkap dalam format MARKDOWN memakai heading '### ' untuk tiap sub-topik (minimal 2 sub-topik). Harus sangat mendalam dan lengkap sesuai target durasi {lesson_duration}.",
      "exercises": [
        {{
          "title": "Nama latihan yang spesifik untuk topik lesson ini",
          "instruction": "Instruksi latihan yang detail, langkah-demi-langkah, dan actionable, merujuk langsung ke konsep di core_content",
          "difficulty": "Easy/Medium/Hard"
        }}
      ],
      "quiz": [
        {{
          "question": "Pertanyaan yang menguji pemahaman konsep spesifik lesson ini (bukan pertanyaan generik)",
          "options": ["A", "B", "C", "D"],
          "answer": "Salah satu string di options, persis sama",
          "explanation": "Penjelasan kunci jawaban"
        }}
      ],
      "prompt_templates": ["Contoh prompt AI yang bisa dipakai siswa untuk eksplorasi lebih lanjut terkait topik lesson ini"]
    }}
 
    [CONSTRAINT]
    - IMPORTANT: Write all output content in English.
    - WAJIB spesifik ke topik lesson "{lesson_title}" — DILARANG memakai kalimat generik/template tanpa menyebutkan konsep konkretnya.
    - Sediakan minimal 2 exercises dan minimal 3 quiz.
    - Tanpa salam pengantar, berikan respons JSON valid murni.
    """
    loop = asyncio.get_running_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=3000,
            temperature=0.7
        )
    )
def enhance_and_translate_custom_section(raw_title: str, raw_instruction: str = "", course_context: str = "") -> dict:
    """Instantly transforms a user-entered custom section title and instruction into a professional English Title and rich description."""
    if not raw_title or not raw_title.strip():
        return {
            "title": "Custom Module",
            "instruction": "Provide comprehensive, actionable curriculum content with practical examples."
        }
    
    if not client:
        t = to_title_case_en(raw_title.strip())
        inst = raw_instruction.strip() if raw_instruction.strip() else f"Explore foundational principles, real-world case studies, and practical workflows for {t}."
        return {"title": t, "instruction": inst}

    prompt = f"""You are a Principal Curriculum Architect and Instructional Designer.
A user has added a custom section to a curriculum.
User Input:
- Section Topic/Title: "{raw_title}"
- User Notes/Instruction: "{raw_instruction}"
- Course Context: "{course_context}"

[TASK]
1. Translate and transform the section title into a 100% professional, concise, authoritative English curriculum title in Title Case (e.g. 'hidup jokowi' -> 'Leadership & Modern Governance Frameworks', 'praktek docker' -> 'Practical Containerization & Deployment').
2. Generate a clear, high-value, professional 1-2 sentence instructional description in English explaining what this section will cover and teach. NEVER output "Write curriculum content."

[FORMAT]
Return a pure JSON object:
{{
  "title": "...",
  "instruction": "..."
}}"""
    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=300,
            temperature=0.3,
            timeout=6.0
        )
        parsed = safe_load_json(response.choices[0].message.content)
        t = parsed.get("title", "").strip() or to_title_case_en(raw_title)
        inst = parsed.get("instruction", "").strip() or f"Explore foundational principles, real-world case studies, and practical workflows for {t}."
        return {"title": t, "instruction": inst}
    except Exception as e:
        print(f"[enhance_and_translate_custom_section] Notice: {e}")
        t = to_title_case_en(raw_title.strip())
        inst = raw_instruction.strip() if raw_instruction.strip() else f"Explore foundational principles, real-world case studies, and practical workflows for {t}."
        return {"title": t, "instruction": inst}


def to_title_case_en(text: str) -> str:
    """Format string to clean Title Case."""
    if not text:
        return ""
    words = text.strip().split()
    minor_words = {'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'per', 'the', 'to', 'vs', 'via', 'with'}
    result = []
    for i, w in enumerate(words):
        lw = w.lower()
        if i == 0 or i == len(words) - 1 or lw not in minor_words:
            result.append(w.capitalize())
        else:
            result.append(lw)
    return " ".join(result)


def translate_and_standardize_text(text: str, is_title: bool = False) -> str:
    """Translates user-entered text into 100% professional English and formats it cleanly."""
    if not text or not isinstance(text, str) or not text.strip():
        return ""
    clean = text.strip()
    if not client:
        return to_title_case_en(clean) if is_title else clean.capitalize()

    target_style = "Title Case professional curriculum title (e.g. 'practical docker deployment' -> 'Practical Docker Deployment & Containerization', 'cloud microservices' -> 'Cloud Microservices Architecture')" if is_title else "Clear, professional, grammatical Sentence Case"
    prompt = f"""You are a professional educational curriculum director and translator.
Translate and transform the following user-supplied curriculum text into 100% professional, standard English.
Format Requirement: {target_style}.

[CRITICAL RULES]
- Do NOT perform simple word-by-word capitalization.
- Translate Indonesian / colloquial expressions into professional, authoritative English educational terminology.
- Output ONLY the translated string with NO quotation marks, NO introductory text, NO notes.

Text to translate:
\"\"\"{clean}\"\"\""""
    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.2
        )
        res = response.choices[0].message.content.strip().strip('"\'')
        return res if res else (to_title_case_en(clean) if is_title else clean)
    except Exception:
        return to_title_case_en(clean) if is_title else clean


def translate_and_standardize_list(items: list, is_title: bool = False) -> list:
    """Translates and standardizes a list of strings into 100% professional English."""
    if not items or not isinstance(items, list):
        return []
    valid_items = [str(x).strip() for x in items if x and str(x).strip()]
    if not valid_items:
        return []
    if not client:
        return [to_title_case_en(x) if is_title else x for x in valid_items]

    prompt = f"""You are a professional educational curriculum editor.
Translate every item in the following JSON array into 100% standard, professional English.
Format Requirement: {"Title Case" if is_title else "Sentence Case (concise, clear learning/curriculum statements)"}.

Input JSON array:
{json.dumps(valid_items, ensure_ascii=False)}

Return ONLY a valid JSON array of translated strings, e.g. ["Item 1", "Item 2"]. Do not include extra commentary."""
    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"} if "gpt" in OPENAI_MODEL else None,
            max_tokens=1500,
            temperature=0.2
        )
        parsed = safe_load_json(response.choices[0].message.content)
        if isinstance(parsed, list):
            return parsed
        if isinstance(parsed, dict):
            for v in parsed.values():
                if isinstance(v, list):
                    return v
        return [to_title_case_en(x) if is_title else x for x in valid_items]
    except Exception:
        return [to_title_case_en(x) if is_title else x for x in valid_items]


def sanitize_custom_structure(structure_list: list) -> list:
    """Instantly standardizes and formats lesson titles and section structures into Title Case English (0ms latency)."""
    if not structure_list or not isinstance(structure_list, list):
        return []
    
    sanitized = copy.deepcopy(structure_list)
    
    for l in sanitized:
        if "title" in l and l["title"]:
            l["title"] = to_title_case_en(str(l["title"]))
        sections = l.get("sections", {})
        if isinstance(sections, dict):
            for role in ["creator", "student", "educator"]:
                r_secs = sections.get(role, [])
                if isinstance(r_secs, list):
                    for s in r_secs:
                        if isinstance(s, dict):
                            if s.get("title"):
                                s["title"] = to_title_case_en(str(s["title"]))
                            if not s.get("instruction"):
                                s["instruction"] = f"Explore foundational concepts, best practices, and practical workflows for {s.get('title', 'this module')}."
                            if not s.get("type"):
                                s["type"] = re.sub(r'[^a-z0-9_]', '_', str(s.get("title", "custom")).lower()).strip('_')

    return sanitized


async def generate_custom_sections_content(lesson_title: str, custom_sections: list, grounding_data: str = ""):
    if not custom_sections:
        return {}
    
    cleaned_sections = []
    for sec in custom_sections:
        s_type = sec.get("type") or re.sub(r'[^a-z0-9_]', '_', sec.get("title", "custom").lower()).strip('_')
        s_title = translate_and_standardize_text(sec.get("title", "Custom Module"), is_title=True)
        s_inst = sec.get("instruction") or "Provide comprehensive, actionable, in-depth curriculum content with real-world examples."
        cleaned_sections.append({
            "type": s_type,
            "title": s_title,
            "instruction": s_inst
        })

    if not client:
        res = {}
        for sec in cleaned_sections:
            res[sec["type"]] = f"### {sec['title']}\n\n#### Overview\nThis section delivers comprehensive technical and pedagogical coverage for **{sec['title']}** within {lesson_title}.\n\n#### Key Principles & Implementation Steps\n- Core architectural foundations and setup.\n- Step-by-step technical implementation.\n- Industry best practices and optimization techniques.\n\n#### Practical Checklist & Verification\n- [x] Complete prerequisite setup\n- [x] Run hands-on exercises\n- [x] Validate production readiness"
        return res

    prompt = f"""
    [ROLE]
    You are an Elite Principal Technical Curriculum Architect and Instructional Designer.

    [TASK]
    Generate complete, in-depth, production-ready curriculum material in 100% PROFESSIONAL ENGLISH for the custom sections of Lesson: '{lesson_title}'.
    
    Grounding Context:
    {grounding_data}

    Custom Sections to Generate:
    {json.dumps(cleaned_sections, indent=2)}

    [STRICT REQUIREMENTS]
    1. Language: 100% English. Professional, authoritative, and pedagogically sound.
    2. Zero Boilerplate / No Placeholders: Write real, comprehensive educational content (headings `###`, `####`, detailed technical walkthroughs, code snippets where applicable, checklists). Minimum 250-450 words per section. NEVER return empty, short, or placeholder text.
    3. Respect User Instructions: Follow each section's specific 'instruction' precisely.
    4. Format: Return a pure JSON object where each key EXACTLY matches the 'type' field of each section.

    Example:
    {{
      "{cleaned_sections[0]['type']}": "### {cleaned_sections[0]['title']}\\n\\nDetailed content..."
    }}
    """
    try:
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                max_tokens=4000,
                temperature=0.7
            )
        )
        raw = response.choices[0].message.content
        parsed = safe_load_json(raw)
        if isinstance(parsed, dict) and parsed:
            return parsed
    except Exception as e:
        print(f"Error generating batch custom sections: {e}")

    # Fallback to single-section generation to guarantee 100% non-empty output
    res = {}
    for sec in cleaned_sections:
        res[sec["type"]] = await generate_single_custom_section(lesson_title, sec, grounding_data)
    return res


async def generate_single_custom_section(lesson_title: str, section: dict, grounding_data: str = ""):
    """Robust generator for a single custom section with 100% English guarantee."""
    sec_type = section.get("type", "custom")
    sec_title = translate_and_standardize_text(section.get("title", "Custom Module"), is_title=True)
    sec_instruction = section.get("instruction") or "Provide comprehensive, actionable, in-depth curriculum content with real-world examples."

    if not client:
        return f"### {sec_title}\n\n#### Overview\nThis section delivers comprehensive technical and pedagogical coverage for **{sec_title}** within {lesson_title}.\n\n#### Key Principles & Implementation Steps\n- Core architectural foundations and setup.\n- Step-by-step technical implementation.\n- Industry best practices and optimization techniques.\n\n#### Practical Checklist\n- [x] Complete prerequisite setup\n- [x] Run hands-on exercises\n- [x] Validate production readiness"

    prompt = f"""You are an Elite Principal Curriculum Architect. Generate professional, in-depth educational Markdown content for ONE specific section in 100% ENGLISH.

Lesson: "{lesson_title}"
Section Title: "{sec_title}"
Specific Instruction: {sec_instruction}
Course Context: {grounding_data}

[REQUIREMENTS]
- Write 300-500 words of rich, detailed, actionable educational content.
- Use Markdown headers (###, ####), bullet points, and code blocks where applicable.
- Language: 100% Professional English.
- Return ONLY the Markdown content string with NO JSON wrapping, NO introductory conversation."""
    try:
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1800,
                temperature=0.7
            )
        )
        content = response.choices[0].message.content.strip()
        if content and len(content) > 50:
            return content
    except Exception as e:
        print(f"Error generating single custom section {sec_title}: {e}")

    return f"### {sec_title}\n\n#### Overview\nThis section delivers comprehensive technical and pedagogical coverage for **{sec_title}** within {lesson_title}.\n\n#### Key Principles & Implementation Steps\n- Core architectural foundations and setup.\n- Step-by-step technical implementation.\n- Industry best practices and optimization techniques.\n\n#### Practical Checklist\n- [x] Complete prerequisite setup\n- [x] Run hands-on exercises\n- [x] Validate production readiness"

async def generate_student_content(lesson_title: str, creator_content: dict, lesson_duration: str = "60 mins", subject_context: str = ""):
    core_content_creator = creator_content.get("core_content", "")
    creator_exercises = creator_content.get("exercises", [])
    
    if not client:
        await asyncio.sleep(0.5)
        return {
            "why_this_matters": f"Understanding {lesson_title} is crucial because it acts as the building block for all subsequent workflows.",
            "learning_journey": f"Follow these interactive steps to master {lesson_title}.",
            "practice": {
                "interactive_exercise": "Try changing the parameters in the starter template.",
                "code_block": "def run():\n    # Implement practice logic\n    print('Demo')",
                "content_type": "code",
                "checklist": ["Identify key features", "Run the sample script"]
            },
            "debugging": "Common bug: IndentationError. Fix: Ensure 4 spaces are used for indentation.",
            "ethics": "Always ensure data privacy policies are respected when processing student records."
        }
    
    prompt = f"""
    [ROLE]
    Anda adalah Lead Learning Experience Designer (LX Designer) & Tutor AI Interaktif yang ahli menyajikan materi pembelajaran yang menyenangkan, intuitif, dan *hands-on*.
 
    [SUBJECT CONTEXT & DOMAIN METADATA]
    {subject_context}

    [TASK]
    Berdasarkan materi induk dan daftar latihan Creator berikut, transformasikan materi Lesson: "{lesson_title}" menjadi modul belajar interaktif khusus untuk POV STUDENT.
    Target Durasi Belajar: {lesson_duration} per lesson.
    Materi Induk: {core_content_creator}
    Daftar Latihan Creator: {json.dumps(creator_exercises)}
 
    [RULES]
    - Rancang latihan interaktif yang secara logis membutuhkan waktu pengerjaan 40% dari total {lesson_duration} durasi pelajaran (hands-on practice).
    - **CRITICAL DOMAIN ROUTING RULE**:
      * Periksa [DOMAIN: ...] pada SUBJECT CONTEXT & DOMAIN METADATA di atas.
      * Jika DOMAIN adalah Business, Management, Strategy, Executive, Design, Medical, Healthcare, Pedagogy, atau bidang NON-KODING lainnya:
        1. HARUS set `"content_type": "markdown"`.
        2. DILARANG KERAS menghasilkan kode pemrograman Python, Pandas, NumPy, atau compiler script dalam `code_block`.
        3. Isi `code_block` dengan teks deskripsi skenario studi kasus / panduan roleplay simulasi bisnis nyata.
      * HANYA set `"content_type": "code"` jika DOMAIN secara eksplisit adalah Coding, Software Engineering, atau Computer Programming.
    - DILARANG menggunakan placeholder kosong seperti '// TODO' atau 'pass'.
    - Bagian 'debugging' harus menyajikan minimal 2 kesalahan umum (common mistakes/pitfalls/anti-patterns bisnis/konseptual) yang spesifik untuk bab ini, beserta solusinya (TANPA istilah compiler/koding jika domain non-koding).
 
    [FORMAT]
    Kembalikan output murni dalam JSON terstruktur:
    {{
      "why_this_matters": "Penjelasan intuitif dan analogi konkret (bukan generik) mengapa materi lesson INI spesifik penting di dunia nyata",
      "learning_journey": "Langkah-langkah belajar berformat MARKDOWN dengan list bernomor (1. 2. 3.), merujuk konsep konkret dari Materi Induk, bukan langkah generik",
      "practice": {{
        "interactive_exercise": "Panduan praktik langkah demi langkah yang membimbing siswa menyelesaikan Latihan Creator di atas",
        "code_block": "Teks studi kasus skenario bisnis utuh jika non-koding (ATAU kode starter teknis jika domain koding)",
        "content_type": "markdown (jika non-koding) atau code (jika koding)",
        "checklist": ["Checklist pemahaman spesifik 1", "Checklist pemahaman spesifik 2", "Checklist pemahaman spesifik 3"]
      }},
      "debugging": "Kesalahan umum / Anti-Patterns / Common Mistakes spesifik bab ini dengan penjelasan dan solusinya, format markdown",
      "ethics": "Pertimbangan etika atau best practice yang relevan dengan topik lesson ini secara spesifik"
    }}
 
    [CONSTRAINT]
    - IMPORTANT: Write all output content in English.
    - JANGAN sertakan jawaban kuis, rubrik penilaian pengajar, atau panduan fasilitator.
    - JANGAN gunakan kalimat generik yang bisa berlaku untuk topik apapun.
    - Tanpa salam pengantar, berikan respons JSON valid murni.
    """
    loop = asyncio.get_running_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=2500,
            temperature=0.7
        )
    )
    return safe_load_json(response.choices[0].message.content)

async def generate_educator_content(lesson_title: str, creator_content: dict, lesson_duration: str = "60 mins"):
    core_content_creator = creator_content.get("core_content", "")
    creator_exercises = creator_content.get("exercises", [])
    
    if not client:
        await asyncio.sleep(0.5)
        return {
            "facilitator_guide": f"Begin with a 5-minute recap of prerequisite terms, then demo {lesson_title}.",
            "lesson_plan": {
                "timing": f"Session Duration: {lesson_duration}",
                "ice_breaker": "Ask students: 'What is the most frustrating error you hit this week?'"
            },
            "rubric": [{"criteria": "Code Accuracy", "excellent": "Code runs without warnings", "good": "Code runs with minor style warnings", "needs_improvement": "Code fails to execute"}],
            "teaching_tips": ["For struggling students, pair them up in peer programming sessions."],
            "discussion_questions": ["How would you explain this pattern to a non-technical manager?"],
            "assessment": "Ask students to extend the practice code block to handle empty datasets."
        }
    
    prompt = f"""
    [ROLE]
    Anda adalah Master Pedagogi & Instructional Coach Senior yang membimbing dosen, mentor, dan fasilitator kelas dalam membawakan materi pembelajaran.
 
    [TASK]
    Berdasarkan materi induk dan daftar latihan Creator berikut, buatlah Panduan Mengajar (Facilitator Guide) khusus untuk POV EDUCATOR/MENTOR pada Lesson: "{lesson_title}".
    Durasi Target Pelajaran: {lesson_duration} per lesson.
    Materi Induk: {core_content_creator}
    Daftar Latihan Creator: {json.dumps(creator_exercises)}
 
    [RULES]
    - Rancang rencana pembelajaran mengajar (lesson plan timing) secara mendetail agar total alokasi waktunya **persis sama dengan durasi target ({lesson_duration})**.
    - Kriteria penilaian di bagian 'rubric' HARUS spesifik dan **berhubungan langsung untuk menilai pengerjaan siswa terhadap Latihan Creator ini**: {json.dumps(creator_exercises)}.
    - Panduan evaluasi di bagian 'assessment' harus memberikan instruksi penilaian/homework nyata yang secara langsung mengevaluasi hasil pengerjaan Latihan Creator tersebut.
 
    [FORMAT]
    Kembalikan output murni dalam JSON terstruktur:
    {{
      "facilitator_guide": "Panduan spesifik cara membawakan sesi lesson INI dengan durasi total {lesson_duration}, pembukaan kelas, dan poin krusial (konsep dari Latihan & Materi Induk) yang harus ditekankan",
      "lesson_plan": {{
        "timing": "Rincian alokasi waktu yang totalnya HARUS PERSIS SAMA DENGAN DURASI TARGET ({lesson_duration}) per lesson (contoh jika durasi 60m: 10m Pembukaan, 35m Penjelasan & Praktik Latihan, 15m Q&A)",
        "ice_breaker": "Pertanyaan pemantik atau aktivitas singkat yang relevan dengan topik lesson ini, bukan generik"
      }},
      "rubric": [
        {{
          "criteria": "Kriteria Penilaian yang spesifik untuk menilai Latihan Creator di atas",
          "excellent": "Indikator nilai A",
          "good": "Indikator nilai B",
          "needs_improvement": "Indikator perbaikan"
        }}
      ],
      "teaching_tips": ["Tips menangani miskonsepsi umum yang SPESIFIK untuk topik ini", "Tips menjawab pertanyaan sulit terkait topik ini"],
      "discussion_questions": ["Pertanyaan diskusi kelas 1 yang spesifik ke topik", "Pertanyaan diskusi kelas 2 yang spesifik ke topik"],
      "assessment": "Panduan evaluasi tugas akhir/homework yang merujuk langsung ke Latihan Creator"
    }}
 
    [CONSTRAINT]
    - IMPORTANT: Write all output content in English.
    - Minimal 2 kriteria di rubric.
    - Fokus sepenuhnya pada strategi pedagogi, alokasi waktu kelas (*timing*), rubrik penilaian, dan tips mengajar di kelas.
    - Hindari mengulang teks materi pelajaran panjang milik siswa; hindari kalimat generik yang bisa berlaku untuk topik apapun.
    - Tanpa salam pengantar, berikan respons JSON valid murni.
    """
    loop = asyncio.get_running_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=2000,
            temperature=0.7
        )
    )
    return safe_load_json(response.choices[0].message.content)

async def run_section_action(section_type: str, content: str, action: str, params: dict = None):
    # Action modifiers: rewrite, expand, shorten, simplify, improve, fact_check
    if not client:
        await asyncio.sleep(0.5)
        return f"[Action: {action.upper()}] {content}"
    
    action_instructions = {
        "expand": "Elaborate deeply with rich technical detail, practical examples, and new sub-sections (using '### ' sub-headings) to expand coverage.",
        "shorten": "Condense the OVERALL section structurally. Consolidate paragraphs, and remove or merge non-essential sub-sections or sub-headings (including sub-topics added during expansion) into a clean, tight, high-level overview without fluff.",
        "simplify": "Rewrite using plain language, intuitive real-world analogies, and beginner-friendly explanations while keeping key concepts intact.",
        "improve": "Enhance clarity, professional tone, technical accuracy, and flow.",
        "rewrite": "Rephrase and restructure the content completely while preserving core technical meaning.",
        "fact_check": "Review and verify technical claims, updating any outdated statements or code logic."
    }
    
    specific_instruction = action_instructions.get(action.lower(), f"Perform '{action}' on the section content.")

    prompt = f"""
    [TASK]
    {specific_instruction}
    
    Section Type: '{section_type}'
    
    [CONTENT]
    {content}
    
    [ADDITIONAL_PARAMETERS]
    {json.dumps(params or {})}
    
    [CONSTRAINTS]
    - If action is 'shorten': Perform an OVERALL structural condensation. Remove redundant sub-sections/sub-headings and merge content into a concise, high-impact summary.
    - If action is 'expand': Add deeper technical explanations and new relevant sub-headings.
    - If action is 'simplify': Use clear analogies and plain language.
    - Keep Markdown formatting clean and valid.
    - Respond ONLY with the updated content text. Do not include intro or outro conversational text.
    """
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1800,
            temperature=0.7
        )
    )
    return response.choices[0].message.content.strip()

async def generate_more_quiz(lesson_title: str, core_content: str, count: int = 3):
    if not client:
        await asyncio.sleep(0.5)
        return [
            {
                "question": f"Which of the following is a key aspect of {lesson_title}?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "answer": "Option A",
                "explanation": "Option A is correct because of fundamental principles discussed."
            }
        ] * count
    
    prompt = f"""
    Based on the following content for lesson '{lesson_title}', generate exactly {count} multiple choice quiz questions.
    
    [CONTENT]
    {core_content}
    
    [FORMAT]
    Return JSON only with format:
    {{
      "quizzes": [
        {{
          "question": "Question text?",
          "options": ["A", "B", "C", "D"],
          "answer": "Exact matching string of correct option",
          "explanation": "Why correct"
        }}
      ]
    }}
    """
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=1500,
            temperature=0.7
        )
    )
    return safe_load_json(response.choices[0].message.content).get("quizzes", [])

async def generate_more_exercises(lesson_title: str, core_content: str, count: int = 1):
    if not client:
        await asyncio.sleep(0.5)
        return [
            {
                "title": f"Hands-on Exercise for {lesson_title}",
                "instruction": "Extend the code template to support parsing multiple records sequentially."
            }
        ] * count
    
    prompt = f"""
    Based on the following content for lesson '{lesson_title}', generate exactly {count} student exercises/tasks.
    
    [CONTENT]
    {core_content}
    
    [FORMAT]
    Return JSON only with format:
    {{
      "exercises": [
        {{
          "title": "Exercise Name",
          "instruction": "Detailed task instructions..."
        }}
      ]
    }}
    """
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=1500,
            temperature=0.7
        )
    )
    return safe_load_json(response.choices[0].message.content).get("exercises", [])

async def generate_single_grounding_item(
    keyword: str, 
    field_type: str, 
    existing_items: list, 
    difficulty: str = "Beginner", 
    audience: str = "Student", 
    tech_tags: list = None
):
    """Generates a single relevant grounding item (prerequisite, boundary, or outcome) tailored to user customization."""
    if not client:
        await asyncio.sleep(0.5)
        fallback = {
            "prerequisites": "Familiarity with clean code concepts",
            "boundaries": "Advanced cloud infrastructure scaling",
            "learning_outcomes": "Demonstrate practical deployment skills"
        }
        return fallback.get(field_type, "New grounding point")

    tags_str = ", ".join(tech_tags) if tech_tags else "General concepts"
    prompt = f"""
    Course Topic: '{keyword}'
    Target Audience: {audience}
    Difficulty Level: {difficulty}
    Tech Stack / Focus: {tags_str}

    Task: Suggest one new, distinct, and highly relevant item for the grounding field '{field_type}'.
    Existing items in this field are: {json.dumps(existing_items)}
    
    Guidelines:
    - Match the requested difficulty level ({difficulty}) and target audience ({audience}).
    - Leverage the tech stack ({tags_str}) where appropriate.
    - Make the suggestion short (1 concise sentence), highly actionable, and do NOT repeat or overlap with existing items.
    
    Return output as JSON only with format:
    {{
      "suggestion": "One sentence suggestion text"
    }}
    """
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=300,
            temperature=0.7
        )
    )
    data = safe_load_json(response.choices[0].message.content)
    return data.get("suggestion", f"Understanding of {keyword} concepts")

async def generate_custom_section_content(lesson_title: str, section_title: str, instruction: str, grounding_data: str) -> str:
    if not client:
        await asyncio.sleep(0.3)
        return f"This is auto-generated mockup content for custom section '{section_title}' based on instruction: {instruction}."
    try:
        prompt = f"""
        [ROLE]
        You are a Technical Content Creator. Write content for a custom course section.

        [CONTEXT]
        Lesson: "{lesson_title}"
        Section Title: "{section_title}"
        Instruction for this section: "{instruction}"
        Course Prerequisites/Grounding: {grounding_data}

        [TASK]
        Write the section content in MARKDOWN format. Keep it technical, engaging, and highly informative.
        Length: 2-3 paragraphs.
        Do not include headers, just start writing the content.
        """
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=600,
                temperature=0.7
            )
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating custom section content: {e}")
        return f"Content for '{section_title}' could not be generated. Instruction: {instruction}."


async def generate_pptx_structure(course_data: dict, brand_colors: dict = None) -> dict:
    """Generate PPT slide structure with 3 layouts using AI."""
    if not client:
        return {
            "layouts": {
                "classic": _mock_pptx_layout(course_data, "classic"),
                "modern": _mock_pptx_layout(course_data, "modern"),
                "minimal": _mock_pptx_layout(course_data, "minimal")
            }
        }

    lessons_summary = []
    for lesson in course_data.get("lessons", []):
        sections = lesson.get("sections", {})
        creator = sections.get("creator", {})
        student = sections.get("student", {})
        educator = sections.get("educator", {})
        
        # Capture all custom and standard sections
        all_sections_dict = {}
        for role_key in ["creator", "student", "educator"]:
            role_secs = sections.get(role_key, {})
            if isinstance(role_secs, dict):
                for k, v in role_secs.items():
                    if k not in all_sections_dict:
                        all_sections_dict[k] = v

        lessons_summary.append({
            "title": lesson.get("title", "Untitled Lesson"),
            "overview": creator.get("overview", ""),
            "learning_outcomes": creator.get("learning_outcomes", []),
            "core_content": str(creator.get("core_content", ""))[:4000],
            "why_this_matters": student.get("why_this_matters", ""),
            "learning_journey": student.get("learning_journey", "") or student.get("journey", ""),
            "practice": student.get("practice", {}),
            "debugging": student.get("debugging", ""),
            "ethics": student.get("ethics", ""),
            "exercises": creator.get("exercises", []),
            "quiz": creator.get("quiz", []) or creator.get("quizzes", []),
            "facilitator_guide": str(educator.get("facilitator_guide", ""))[:2000],
            "lesson_plan": educator.get("lesson_plan", {}),
            "all_sections": {k: (str(v)[:1500] if isinstance(v, str) else v) for k, v in all_sections_dict.items()}
        })

    colors_hint = ""
    if brand_colors:
        colors_hint = f"\nBrand colors: primary={brand_colors.get('primary', '#1a202c')}, accent={brand_colors.get('accent', '#d69e2e')}"

    prompt = f"""
    [ROLE]
    You are a Master Educator, Keynote Speaker, and Instructional Designer creating a world-class, highly engaging presentation slide deck with comprehensive educator narration scripts.

    [TASK]
    Create a complete, high-impact, professional slide deck for the course "{course_data.get('title', 'Untitled Course')}".
    Difficulty: {course_data.get('config', {}).get('difficulty', 'Beginner')}
    Audience: {course_data.get('config', {}).get('target_audience', 'Student')}
    Number of Lessons: {len(lessons_summary)}
    {colors_hint}

    Generate 3 different layout versions simultaneously: "layout_1", "layout_2", and "layout_3".
    Each layout must have the SAME rich slide content and speaker notes, but visually distinct styling.

    [SLIDE STRUCTURE]
    Generate a thorough, complete slide deck covering all lesson topics and custom sections:

    1. TITLE SLIDE (first slide):
       - title: Course title
       - subtitle: ""
       - notes: Comprehensive welcome script introducing the course objectives, scope, and enthusiastic greeting.

    2. TABLE OF CONTENTS SLIDE:
       - Numbered list of all lessons
       - notes: Narrative overview walking through the learning roadmap and how each module builds upon the previous.

    3. FOR EACH LESSON, generate comprehensive slides covering all aspects:
       a. LESSON TITLE slide — lesson number and clean title with introductory notes
       b. OVERVIEW & WHY IT MATTERS slide — key motivations and real-world significance
       c. LEARNING OUTCOMES slide — specific, actionable capabilities students will acquire
       d. CORE CONCEPTS & CUSTOM TOPICS slides — thorough breakdown of core material and custom sub-topics:
          - Extract all important concepts, theories, and steps
          - Split across multiple slides for clarity (3-5 informative bullet points per slide)
          - Each bullet must be an informative explanation with clear context
       e. CODE EXAMPLE / PRACTICAL APPLICATION slide(s) — real code or step-by-step application walkthrough
       f. COMMON PITFALLS & TROUBLESHOOTING slide — practical advice on what to avoid and best practices
       g. ETHICS & STANDARDS / KEY TAKEAWAYS slide — professional standards and summary

    4. END SLIDE:
       - title: "Thank You / Terima Kasih"
       - subtitle: course title
       - notes: Inspiring concluding speech, Q&A invite, and call to action.

    [SPEAKER NOTES & NARRATION REQUIREMENTS - CRITICAL]
    - Every single slide MUST contain a complete, thorough, educator speaking script in the "notes" field (4 to 8 sentences).
    - The narration script must sound like an expert instructor speaking directly to students: explaining the core 'why' and 'how', giving practical analogies, emphasizing key nuances, and asking reflective questions.
    - Do NOT write placeholder notes like "This slide covers X". Write the actual spoken words of the lecture.

    [LANGUAGE REQUIREMENT]
    - Automatically match the language of the provided course content and lesson titles. If the course is in Indonesian, write all slide titles, bullets, and speaker notes in Indonesian. If in English, write in English.

    [LESSON DATA]
    {json.dumps(lessons_summary, ensure_ascii=False)[:14000]}

    [FORMAT]
    Return a pure JSON object with exactly this structure:
    {{
      "layouts": {{
        "layout_1": {{
          "theme": {{"primary": "#1a202c", "secondary": "#ffffff", "accent": "#d69e2e", "text": "#ffffff"}},
          "slides": [
            {{"type": "title", "title": "Course Title", "subtitle": "", "notes": "Full educator speech script..."}},
            {{"type": "toc", "title": "Table of Contents", "items": ["1. Lesson Title", "2. Lesson Title"], "notes": "..."}},
            {{"type": "lesson_title", "title": "Lesson 1: ...", "subtitle": "", "notes": "..."}},
            {{"type": "content", "title": "...", "bullets": ["Comprehensive explanation...", "..."], "notes": "Full speaking narration..."}},
            {{"type": "code", "title": "...", "code": "// code here", "language": "python", "notes": "..."}},
            {{"type": "end", "title": "Thank You", "subtitle": "...", "notes": "..."}}
          ]
        }},
        "layout_2": {{
          "theme": {{"primary": "#0f172a", "secondary": "#ffffff", "accent": "#0284c7", "text": "#ffffff"}},
          "slides": [...same slides, same content and notes...]
        }},
        "layout_3": {{
          "theme": {{"primary": "#ffffff", "secondary": "#1e293b", "accent": "#0d9488", "text": "#1e293b"}},
          "slides": [...same slides, same content and notes...]
        }}
      }}
    }}
    - Every slide MUST have a "notes" field with detailed speaker notes (2-4 sentences).
    - All 3 layouts must have the SAME number of slides and SAME content.
    - Slide types: "title", "toc", "lesson_title", "content", "code", "end"
    - Max 6 bullets per content slide. Split into multiple slides if needed.
    - Title slide subtitle MUST be empty string "".
    - Return pure JSON only, no preamble.
    - Do NOT truncate or abbreviate — provide complete, comprehensive content.
    """

    try:
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                max_tokens=16000,
                temperature=0.7
            )
        )
        data = safe_load_json(response.choices[0].message.content)
        if "layouts" not in data:
            data = {"layouts": data}
        for layout_name in ["layout_1", "layout_2", "layout_3"]:
            if layout_name not in data["layouts"]:
                data["layouts"][layout_name] = _mock_pptx_layout(course_data, layout_name)
        return data
    except Exception as e:
        print(f"Error generating PPTX structure: {e}")
        return {
            "layouts": {
                "layout_1": _mock_pptx_layout(course_data, "layout_1"),
                "layout_2": _mock_pptx_layout(course_data, "layout_2"),
                "layout_3": _mock_pptx_layout(course_data, "layout_3")
            }
        }


def _mock_pptx_layout(course_data: dict, layout_name: str) -> dict:
    themes = {
        "layout_1": {"primary": "#1a202c", "secondary": "#ffffff", "accent": "#d69e2e", "text": "#ffffff"},
        "layout_2": {"primary": "#1a202c", "secondary": "#ffffff", "accent": "#3182ce", "text": "#ffffff"},
        "layout_3": {"primary": "#ffffff", "secondary": "#1a202c", "accent": "#319795", "text": "#1a202c"}
    }
    theme = themes.get(layout_name, themes["layout_1"])
    title = course_data.get("title", "Untitled Course")
    difficulty = course_data.get("config", {}).get("difficulty", "Beginner")
    audience = course_data.get("config", {}).get("target_audience", "Student")
    lessons = course_data.get("lessons", [])

    slides = [
        {"type": "title", "title": title, "subtitle": "", "notes": f"Welcome to {title}. This course is designed for {audience} at {difficulty} level. Let's begin our learning journey."},
        {"type": "toc", "title": "Table of Contents", "items": [f"{i+1}. {l.get('title', 'Untitled')}" for i, l in enumerate(lessons)], "notes": f"Here is what we will cover today. We have {len(lessons)} lessons to explore."}
    ]
    for i, lesson in enumerate(lessons):
        sections = lesson.get("sections", {})
        creator = sections.get("creator", {})
        student = sections.get("student", {})
        educator = sections.get("educator", {})

        slides.append({"type": "lesson_title", "title": f"Lesson {i+1}: {lesson.get('title', 'Untitled')}", "subtitle": "", "notes": f"Let's begin Lesson {i+1}. This lesson covers key concepts and practical applications."})

        overview = creator.get("overview", "No overview available.")
        if overview:
            overview_bullets = [s.strip() for s in overview.replace("**", "").split(".") if s.strip()][:4]
            if not overview_bullets:
                overview_bullets = [overview[:200]]
            slides.append({"type": "content", "title": "Overview", "bullets": overview_bullets, "notes": f"This lesson overview covers: {overview[:300]}"})

        outcomes = creator.get("learning_outcomes", [])
        if isinstance(outcomes, list) and outcomes:
            slides.append({"type": "content", "title": "Learning Outcomes", "bullets": outcomes[:4], "notes": "By the end of this lesson, you will be able to demonstrate understanding of these key concepts and apply them in practice."})

        core_content = creator.get("core_content", "")
        if core_content:
            lines = [l.strip() for l in core_content.replace("**", "").replace("###", "").split("\n") if l.strip() and not l.strip().startswith("#")]
            bullets = [l for l in lines if not l.startswith("```")][:4]
            if bullets:
                slides.append({"type": "content", "title": "Core Concepts", "bullets": bullets, "notes": f"Let's dive into the core concepts. {bullets[0] if bullets else ''}"})

        practice = student.get("practice", {})
        if isinstance(practice, dict):
            code_block = practice.get("code_block", "")
            if code_block:
                slides.append({"type": "code", "title": "Practice Exercise", "code": code_block[:1000], "language": "python", "notes": "Let's try this hands-on exercise. Follow along and run the code to see how it works."})
            checklist = practice.get("checklist", [])
            if checklist and isinstance(checklist, list):
                slides.append({"type": "content", "title": "Exercise Checklist", "bullets": [f"✓ {item}" for item in checklist[:4]], "notes": "Complete these steps to practice what you've learned."})

        facilitator = educator.get("facilitator_guide", "")
        if facilitator:
            tips = [t.strip() for t in facilitator.replace("**", "").split(".") if t.strip() and len(t.strip()) > 10][:5]
            if tips:
                slides.append({"type": "content", "title": "Key Takeaways", "bullets": tips, "notes": "Here are the key points to remember from this lesson."})

    slides.append({"type": "end", "title": "Thank You", "subtitle": title, "notes": f"Thank you for completing {title}. Continue practicing and exploring the concepts covered."})

    return {"theme": theme, "slides": slides}