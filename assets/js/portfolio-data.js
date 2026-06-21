/**
 * portfolio-data.js — single source of truth for the knowledge-graph hero.
 *
 * `window.PORTFOLIO.nodes` is the graph topology + short teasers + flags.
 * Branch nodes carry a `section` hook (the existing DOM section to reveal on click);
 * leaf nodes may carry a `url` (external link / project detail page) and `year`
 * (used to render chronological order on Experience/Education nodes).
 *
 * The long-form resume content stays authored once in index.html's <section>s —
 * this file only holds the map + teasers, so there is no double-maintenance.
 */
window.PORTFOLIO = {
  nodes: [
    { id: "me", type: "root", label: "Lakshmi Priya\nRamisetty", role: "AI/ML Engineer", section: "#about",
      about: {
        photo: "assets/img/page/profile.png",
        bio: "I'm an AI/ML engineer who builds intelligent systems end to end — the data pipelines that feed them, the models at their core, and the production software that ships them. Currently at BlueArc, I architected a risk-decisioning layer and build the LLM agents and ML models behind fraud, KYB and risk products.",
        interests: ["Data Engineering", "Machine Learning", "Artificial Intelligence", "Computer Vision", "NLP", "Deep Learning", "Visualization", "Statistics"],
        contact: {
          email: "lakshmipriya.ramisetty@gmail.com",
          linkedin: "https://www.linkedin.com/in/lakshmi-priya-ramisetty/",
          github: "https://github.com/lakshmi-priya-ramisetty",
          medium: "https://medium.com/@lakshmi_priya_ramisetty"
        }
      } },

    // ---- Branches (each opens an in-graph overview panel of its leaves) ----
    { id: "b-exp",  type: "branch", label: "Experience",     section: "#experience" },
    { id: "b-rsr",  type: "branch", label: "Research",       section: "#research" },
    { id: "b-skl",  type: "branch", label: "Skills",         section: "#skills" },
    { id: "b-prj",  type: "branch", label: "Projects",       section: "#portfolio" },
    { id: "b-blog", type: "branch", label: "Blog",           section: "#blog" },
    { id: "b-cert", type: "branch", label: "Certifications", section: "#certifications" },
    { id: "b-edu",  type: "branch", label: "Education",      section: "#education" },

    // ---- Experience leaves (ordered most-recent first) ----
    { id: "e-bluearc", type: "leaf", parent: "b-exp", flagged: true, order: 0, year: "2025 – now",
      label: "BlueArc", tag: "Experience", flagTag: "Experience",
      title: "Software Engineer — ML, AI & Graph", sub: "BlueArc", dates: "Feb 2025 – Present",
      bullets: [
        "Built a multi-agent decisioning platform on LangGraph and Google ADK that synthesizes web + graph signals into structured risk assessments, automating ~3,000 investigations/week and cutting investigation time ~70%.",
        "Architected an ML risk-scoring engine (gradient-boosted trees + Probabilistic Graphical Models) scoring thousands of entities from 2M+ monthly signals, cutting false positives ~40% vs. rules-based baselines.",
        "Engineered a multimodal text + image embedding system to detect duplication, counterfeit listings, and impersonation across ad networks, publishers, marketplaces, and merchants.",
        "Built the evaluation + human-in-the-loop layer, defining decision-quality metrics and routing low-confidence cases for human review."
      ],
      chips: ["LangGraph", "Google ADK", "Knowledge Graphs", "XGBoost"], url: "https://bluearc.ai/" },
    { id: "e-intheloop", type: "leaf", parent: "b-exp", order: 1, year: "2024",
      label: "InTheLoop", tag: "Experience",
      title: "Machine Learning Engineer, GenAI", sub: "InTheLoop INC", dates: "Oct 2024 – Jan 2025",
      bullets: [
        "Built a distributed image preprocessing pipeline on Dataflow to ingest and transform 120K+ multimodal assets for VLM training.",
        "Fine-tuned Qwen2-VL and Gemini 1.5 Flash via SFT for fabric-damage detection + dynamic pricing, lifting accuracy from 64% zero-shot to 88%.",
        "Extended DeepSpeed pipeline parallelism to support multimodal Vision-Language inputs, enabling 2.5× faster multi-GPU Qwen2-VL training."
      ],
      chips: ["VLMs", "DeepSpeed", "Qwen2-VL", "Dataflow"], url: "https://www.intheloopai.com/" },
    { id: "e-finserv", type: "leaf", parent: "b-exp", order: 2, year: "2024",
      label: "FinServ", tag: "Experience",
      title: "AI/ML Engineer Intern", sub: "FinServ Experts", dates: "May 2024 – Aug 2024",
      bullets: [
        "Developed a RAG pipeline for enterprise chatbots, achieving 92% factual accuracy and sub-5% hallucination rates.",
        "Fine-tuned Llama 2 and Mistral with LoRA/QLoRA for policy-aligned financial responses, then cut p95 latency 31% (3.6s → 2.5s) by serving merged models 4-bit quantized on vLLM."
      ],
      chips: ["RAG", "LoRA / QLoRA", "vLLM", "Llama 2"], url: "https://finservexperts.com/" },
    { id: "e-egen", type: "leaf", parent: "b-exp", order: 3, year: "2021 – 23",
      label: "Egen", tag: "Experience",
      title: "Data Engineer", sub: "Egen", dates: "Mar 2021 – Jul 2023",
      bullets: [
        "Scoped and delivered a high-throughput data ingestion framework with Blue Shield of California, automating ingestion of TIC-compliant MRF files via Dataflow and BigQuery.",
        "Tuned Dataflow parallelism, worker autoscaling, and fusion, boosting batch throughput ~70% across 400M+ records (~100 TB).",
        "Delivered a FHIR-compliant pipeline for Reltio (Pub/Sub → Dataflow → Google Cloud FHIR Store via Whistle mappings).",
        "Built and presented an end-to-end healthcare analytics demo (BigQuery ML, Vertex AI, Dialogflow, Document AI) at Google HQ."
      ],
      chips: ["Dataflow", "BigQuery", "Vertex AI", "CI/CD"], url: "https://egen.ai/" },
    { id: "e-accenture", type: "leaf", parent: "b-exp", order: 4, year: "2020",
      label: "Accenture", tag: "Experience",
      title: "ML Engineer Intern", sub: "Accenture", dates: "Jan 2020 – Jul 2020",
      bullets: [
        "Automated document processing with Tesseract OCR (~2s/doc), improving extraction accuracy 30% via A/B-tested preprocessing and adaptive thresholding.",
        "Evaluated RL methods (Q-Learning, DQN, PPO) for collaborative-robot adaptability and built a bot taxonomy to guide model selection."
      ],
      chips: ["OCR", "Reinforcement Learning"], url: "https://www.accenture.com/us-en" },

    // ---- Research leaves ----
    { id: "r-4ev", type: "leaf", parent: "b-rsr", flagged: true, order: 0,
      label: "4EV", tag: "Research", flagTag: "Published",
      title: "4EV: Adaptive Video Editing", sub: "IEEE Xplore", dates: "Text-to-video generation",
      bullets: ["Adaptive video editing with spatial-temporal dynamics and motion pathways."],
      chips: ["Generative AI", "Diffusion", "Text-to-Video"], url: "https://ieeexplore.ieee.org/document/11214174" },
    { id: "r-vetmamba", type: "leaf", parent: "b-rsr", flagged: true, order: 1,
      label: "VetMamba", tag: "Research", flagTag: "Published",
      title: "Optimizing Veterinary Language Modeling", sub: "IEEE Xplore", dates: "Mamba architecture",
      bullets: ["Efficient long-sequence language modeling with the Mamba architecture."],
      chips: ["Mamba", "Long-Sequence", "LLM"], url: "https://ieeexplore.ieee.org/document/11121101" },

    // ---- Skills leaves: new About-section focus areas + existing portfolio stack ----
    { id: "s-genai", type: "leaf", parent: "b-skl", order: 0, pin: true,
      label: "GenAI & Agents", tag: "Skills",
      title: "Generative AI & Agents", sub: "What I focus on most", dates: "",
      bullets: [
        "LLM agents & multi-agent systems — LangChain, LangGraph, Google ADK.",
        "RAG, knowledge graphs, prompt engineering, fine-tuning & evaluation.",
        "Inference optimization (quantization, distillation); LLM tracing (Langfuse)."],
      chips: ["LangChain", "LangGraph", "Google ADK", "RAG", "Knowledge Graphs", "Fine-tuning", "Quantization", "Langfuse"] },
    { id: "s-ml", type: "leaf", parent: "b-skl", order: 1,
      label: "Machine Learning", tag: "Skills",
      title: "Machine Learning", sub: "Scoring & decisioning models", dates: "",
      bullets: [
        "Anomaly detection & classification; gradient boosting & graph-based models.",
        "Deep learning with TensorFlow, PyTorch & scikit-learn."],
      chips: ["TensorFlow", "PyTorch", "scikit-learn", "Gradient Boosting", "Anomaly Detection", "OpenCV", "NumPy", "Pandas"] },
    { id: "s-data", type: "leaf", parent: "b-skl", order: 2,
      label: "Data & MLOps", tag: "Skills",
      title: "Data Engineering & MLOps", sub: "Keeping systems healthy", dates: "",
      bullets: [
        "Pipelines: Dataflow, Apache Beam, Airflow, BigQuery.",
        "CI/CD, monitoring & observability — Prometheus, Grafana, Cloud Monitoring.",
        "Tooling: Git."],
      chips: ["Dataflow", "Apache Beam", "Airflow", "BigQuery", "CI/CD", "Prometheus", "Grafana", "Git"] },
    { id: "s-lang", type: "leaf", parent: "b-skl", order: 3,
      label: "Languages & DBs", tag: "Skills",
      title: "Languages & Databases", sub: "Foundations", dates: "",
      bullets: ["Strong in Python & SQL; also Java, Scala and R.", "Relational stores: MySQL, PostgreSQL."],
      chips: ["Python", "Java", "SQL", "Scala", "R", "MySQL", "PostgreSQL"] },
    { id: "s-cloud", type: "leaf", parent: "b-skl", order: 4,
      label: "Cloud & Big Data", tag: "Skills",
      title: "Cloud & Big Data Platforms", sub: "Where it runs", dates: "",
      bullets: [
        "Google Cloud (Vertex AI, BigQuery, Pub/Sub, GKE, Cloud SQL) and AWS.",
        "Big data: Spark, PySpark, Hadoop, Hive, Kafka."],
      chips: ["Google Cloud", "Vertex AI", "Pub/Sub", "GKE", "AWS", "Spark", "PySpark", "Hadoop", "Kafka"] },

    // ---- Projects leaves (the 5 featured projects, mirroring index.html's
    //      portfolio section; each links to its detail page) ----
    { id: "p-videogen", type: "leaf", parent: "b-prj", order: 0,
      label: "Video Gen", tag: "Project",
      title: "Video Generation with Diffusion Models", sub: "Data Science", dates: "",
      bullets: ["Generative video synthesis with diffusion models."], chips: ["Diffusion", "GenAI"],
      url: "projects/videogen.html" },
    { id: "p-ir", type: "leaf", parent: "b-prj", order: 1,
      label: "Info Retrieval", tag: "Project",
      title: "Information Retrieval", sub: "Data Engineering", dates: "",
      bullets: ["Search & NLP retrieval system architecture."], chips: ["Search", "NLP"],
      url: "projects/informationretrieval.html" },
    { id: "p-bsc", type: "leaf", parent: "b-prj", order: 2,
      label: "Blue Shield CA", tag: "Project",
      title: "Blue Shield of California — Data Ingestion & Visualization", sub: "Data Engineering", dates: "",
      bullets: ["GCP data ingestion + BigQuery visualization for healthcare."], chips: ["GCP", "BigQuery"],
      url: "projects/bsc.html" },
    { id: "p-pdm", type: "leaf", parent: "b-prj", order: 3,
      label: "Provider Mapping", tag: "Project",
      title: "Provider Directory Mapping", sub: "Data Engineering", dates: "",
      bullets: ["Dataflow / Apache Beam FHIR provider-directory mapping."], chips: ["Dataflow", "Apache Beam", "FHIR"],
      url: "projects/pdm.html" },
    { id: "p-cab", type: "leaf", parent: "b-prj", order: 4,
      label: "Cab Rides", tag: "Project",
      title: "Data Capture & Analysis of Cab Rides", sub: "Data Engineering", dates: "",
      bullets: ["End-to-end data pipeline + analytics on cab-ride data."], chips: ["Data Pipeline", "Analytics"],
      url: "projects/cab.html" },
    // ---- Education leaves ----
    { id: "ed-ms", type: "leaf", parent: "b-edu", order: 0, year: "2023 – 24",
      label: "MS AI", tag: "Education",
      title: "MS in Artificial Intelligence", sub: "Yeshiva University", dates: "Aug 2023 – Dec 2024",
      bullets: [], chips: [] },
    { id: "ed-mtech", type: "leaf", parent: "b-edu", order: 1, year: "2015 – 20",
      label: "iMTech", tag: "Education",
      title: "Integrated MTech (iMTech), Computer Science", sub: "IIIT Bangalore · Major in Data Science", dates: "Aug 2015 – Jun 2020",
      bullets: [], chips: [] },

    // ---- Blog leaves (Medium articles) ----
    { id: "bl-json", type: "leaf", parent: "b-blog", order: 0,
      label: "Large JSON", tag: "Blog",
      title: "Handling large JSON files without fully loading them into memory", sub: "Medium", dates: "",
      bullets: ["Streaming and chunked parsing techniques for JSON that won't fit in memory."], chips: ["Python", "Data Engineering"],
      url: "https://medium.com/@lakshmi_priya_ramisetty/handling-large-json-files-without-fully-loading-them-into-memory-ce3d020a3f82" },
    { id: "bl-tftext", type: "leaf", parent: "b-blog", order: 1,
      label: "TF-Text on M1", tag: "Blog",
      title: "Installing TensorFlow-Text on Mac M1/M2", sub: "Medium", dates: "",
      bullets: ["A working build path for tensorflow-text on Apple Silicon."], chips: ["TensorFlow", "Apple Silicon"],
      url: "https://medium.com/@lakshmi_priya_ramisetty/how-to-install-tensorflow-text-on-mac-m1-m2-0bacb6fe83d1" },
    { id: "bl-error", type: "leaf", parent: "b-blog", order: 2,
      label: "0% Error Rate", tag: "Blog",
      title: "Your 0% error rate isn't telling you what you think", sub: "Medium", dates: "",
      bullets: ["Why a perfect error metric is often a measurement bug, not a model win."], chips: ["ML Evaluation", "Metrics"],
      url: "https://medium.com/@lakshmi_priya_ramisetty/your-0-error-rate-isnt-telling-you-what-you-think-552bb22c1b02" },

    // ---- Certification leaves (3 Google Cloud + 3 Johns Hopkins / Coursera) ----
    { id: "c-pml", type: "leaf", parent: "b-cert", order: 0,
      label: "GCP Pro ML", tag: "Certification",
      title: "Professional Machine Learning Engineer", sub: "Google Cloud", dates: "",
      bullets: [], chips: [],
      url: "https://google.accredible.com/57f3cea0-3495-41e7-a146-3f559bf7f9d4" },
    { id: "c-pde", type: "leaf", parent: "b-cert", order: 1,
      label: "GCP Pro Data", tag: "Certification",
      title: "Professional Data Engineer", sub: "Google Cloud", dates: "",
      bullets: [], chips: [],
      url: "https://google.accredible.com/b73bc000-3fbe-4397-a872-7bc28523fd96" },
    { id: "c-ace", type: "leaf", parent: "b-cert", order: 2,
      label: "GCP ACE", tag: "Certification",
      title: "Associate Cloud Engineer", sub: "Google Cloud", dates: "",
      bullets: [], chips: [],
      url: "https://google.accredible.com/e5c1df36-2b4d-4ea0-aad5-81791654c506" },
    { id: "c-jhuml", type: "leaf", parent: "b-cert", order: 3,
      label: "Practical ML", tag: "Certification",
      title: "Practical Machine Learning", sub: "Johns Hopkins University", dates: "",
      bullets: [], chips: [],
      url: "https://coursera.org/verify/SN8JUKQ5TFUN" },
    { id: "c-jhusi", type: "leaf", parent: "b-cert", order: 4,
      label: "Stat Inference", tag: "Certification",
      title: "Statistical Inference", sub: "Johns Hopkins University", dates: "",
      bullets: [], chips: [],
      url: "https://coursera.org/verify/XKCGD8S7U5NB" },
    { id: "c-jhur", type: "leaf", parent: "b-cert", order: 5,
      label: "R Programming", tag: "Certification",
      title: "R Programming", sub: "Johns Hopkins University", dates: "",
      bullets: [], chips: [],
      url: "https://coursera.org/verify/QXFSF62VNQJL" },
  ],

  links: [
    ["me", "b-exp"], ["me", "b-rsr"], ["me", "b-skl"], ["me", "b-prj"], ["me", "b-blog"], ["me", "b-cert"], ["me", "b-edu"],
    ["b-exp", "e-bluearc"], ["b-exp", "e-intheloop"], ["b-exp", "e-finserv"], ["b-exp", "e-egen"], ["b-exp", "e-accenture"],
    ["b-rsr", "r-4ev"], ["b-rsr", "r-vetmamba"],
    ["b-skl", "s-genai"], ["b-skl", "s-ml"], ["b-skl", "s-data"], ["b-skl", "s-lang"], ["b-skl", "s-cloud"],
    ["b-prj", "p-videogen"], ["b-prj", "p-ir"], ["b-prj", "p-bsc"], ["b-prj", "p-pdm"], ["b-prj", "p-cab"],
    ["b-blog", "bl-json"], ["b-blog", "bl-tftext"], ["b-blog", "bl-error"],
    ["b-cert", "c-pml"], ["b-cert", "c-pde"], ["b-cert", "c-ace"], ["b-cert", "c-jhuml"], ["b-cert", "c-jhusi"], ["b-cert", "c-jhur"],
    ["b-edu", "ed-ms"], ["b-edu", "ed-mtech"],
  ].map(function (l) { return { source: l[0], target: l[1] }; }),

  // stats for the XP / level layer (computed live in gamification.js)
  stats: { years: 4, certs: 3, papers: 2, degrees: 2 },
};
