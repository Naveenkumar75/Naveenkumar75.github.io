(function () {
  "use strict";
  var cfg = window.SITE_CONFIG || { links: {}, repos: {} };
  document.documentElement.classList.add("js");

  /* Links from config; empty values stay hidden */
  document.querySelectorAll("[data-link]").forEach(function (el) {
    var key = el.dataset.link, v = cfg.links[key];
    if (!v) return;
    if (key === "email") { el.href = "mailto:" + v; el.textContent = v; }
    else { el.href = v; el.hidden = false; }
  });
  document.querySelectorAll("[data-repo]").forEach(function (el) {
    var v = cfg.repos[el.dataset.repo];
    if (!v) return;
    el.href = v; el.target = "_blank"; el.rel = "noopener"; el.hidden = false;
  });
  document.getElementById("yr").textContent = new Date().getFullYear();

  /* Header border and active nav */
  var top = document.querySelector(".top");
  window.addEventListener("scroll", function () {
    top.classList.toggle("scrolled", window.scrollY > 8);
  }, { passive: true });

  var navLinks = document.querySelectorAll(".top nav a");
  var secs = Array.prototype.map.call(navLinks, function (a) { return document.querySelector(a.getAttribute("href")); });
  if ("IntersectionObserver" in window) {
    var navIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    secs.forEach(function (s) { if (s) navIO.observe(s); });

    var revIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); revIO.unobserve(e.target); } });
    }, { threshold: 0.15 });
    document.querySelectorAll(".project").forEach(function (p) { revIO.observe(p); });
  } else {
    document.querySelectorAll(".project").forEach(function (p) { p.classList.add("in"); });
  }

  /* Mobile menu */
  var menu = document.querySelector(".menu");
  menu.addEventListener("click", function () {
    var open = top.classList.toggle("open");
    menu.setAttribute("aria-expanded", open);
  });
  document.querySelectorAll(".top nav a").forEach(function (a) {
    a.addEventListener("click", function () { top.classList.remove("open"); menu.setAttribute("aria-expanded", "false"); });
  });

  /* Project filter */
  var fbtns = document.querySelectorAll(".filters button");
  fbtns.forEach(function (b) {
    b.addEventListener("click", function () {
      fbtns.forEach(function (x) { var on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on); });
      document.querySelectorAll("[data-cat]").forEach(function (el) {
        el.hidden = b.dataset.f !== "all" && el.dataset.cat.split(" ").indexOf(b.dataset.f) < 0;
        if (!el.hidden) el.classList.add("in");
      });
    });
  });

  /* Skill evidence: only skills with a real project behind them are interactive */
  var ev = {
    "LLMs": "OmniDesk drafts support replies from retrieved passages, with citations and a fallback when the model call fails.",
    "RAG": "OmniDesk: documents are chunked, embedded and searched per tenant, then passed to the model. Retrieval is evaluated on a 25-question set.",
    "Vector databases": "OmniDesk stores embeddings in PostgreSQL with pgvector and searches by cosine similarity, filtered by tenant.",
    "MCP": "OmniDesk ships an MCP server with read-only tools for tickets, knowledge-base search and reply suggestions.",
    "GenAI": "OmniDesk: retrieval-grounded reply suggestions with citations.",
    "TensorFlow": "Bank customer churn prediction (ANN) and Lung Guard (CNN on chest X-rays).",
    "ANN": "Bank customer churn prediction, with 85% accuracy on the project's test data.",
    "CNN": "Lung Guard, a chest X-ray classifier, with 90% accuracy on the project's test data.",
    "Scikit-learn": "Used in Lung Guard for the model pipeline.",
    "Pandas": "Churn prediction and Lung Guard data preparation.",
    "NumPy": "Churn prediction and Lung Guard.",
    "Go": "OmniDesk's API: auth, tickets, state machine and tenant isolation.",
    "Python": "OmniDesk's AI service and MCP server, plus the churn and Lung Guard models.",
    "FastAPI": "OmniDesk's AI service: ingestion, search and reply suggestion endpoints.",
    "PostgreSQL": "OmniDesk: transactions, row locks for ticket changes, and pgvector for search.",
    "Java": "Day-to-day delivery work at Cognizant, plus the Java internship and my data structures and algorithms practice.",
    "Spring Boot": "Built and tested REST APIs in my Java internship, and worked with it as a trainee at Cognizant.",
    "MySQL": "Integrated with Spring Boot through Spring Data JPA during my internship, and used in Consultant Stewardship.",
    "Docker": "OmniDesk runs PostgreSQL with pgvector through Docker Compose."
  };
  var out = document.getElementById("evidence"), sb = document.querySelectorAll(".skills button");
  sb.forEach(function (b) {
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", function () {
      sb.forEach(function (x) { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); });
      out.textContent = ev[b.dataset.ev];
    });
  });

  /* Copy email */
  var copy = document.querySelector("[data-copy]");
  if (copy) copy.addEventListener("click", function () {
    var done = function () { copy.textContent = "Copied"; setTimeout(function () { copy.textContent = "Copy"; }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(cfg.links.email).then(done, function () {});
  });

  /* RAG pipeline explorer */
  var stages = [
    { t: "Question", x: "A user asks something your model was never trained on: a policy, a ticket, an internal report. The request arrives through an API, usually FastAPI or Spring Boot in my projects.",
      c: "POST /ask\n{ \"question\": \"What changed in the refund policy?\" }" },
    { t: "Embed", x: "The question is turned into a vector by an embedding model. Documents were chunked and embedded earlier with the same model, so meaning can be compared with distance.",
      c: "vector = embed(question)   # [0.12, -0.48, 0.07, ...]" },
    { t: "Retrieve", x: "A vector database returns the closest chunks. Good retrieval is most of the quality: chunk size, metadata filters and re-ranking matter more than the model choice.",
      c: "chunks = index.search(vector, top_k=5, filter={\"source\": \"policy\"})" },
    { t: "Generate", x: "The model answers using only the retrieved context, and the response cites its sources. Tools exposed over MCP let the same model act, not just answer.",
      c: "answer = llm(prompt=build(question, chunks))\nreturn { answer, sources: [c.id for c in chunks] }" }
  ];
  var root = document.querySelector("[data-pipe]");
  if (root) {
    var tabs = root.querySelectorAll("[role=tab]"), panel = root.querySelector(".panel"),
        fill = root.querySelector(".fill"), cur = 0;
    function show(i, focus) {
      cur = i;
      tabs.forEach(function (b, n) {
        b.setAttribute("aria-selected", n === i);
        b.tabIndex = n === i ? 0 : -1;
      });
      panel.setAttribute("aria-labelledby", "t" + i);
      panel.querySelector("[data-title]").textContent = stages[i].t;
      panel.querySelector("[data-text]").textContent = stages[i].x;
      panel.querySelector("[data-code]").textContent = stages[i].c;
      fill.style.width = ((i + 1) * 25) + "%";
      panel.classList.remove("swap"); void panel.offsetWidth; panel.classList.add("swap");
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (b, n) {
      b.addEventListener("click", function () { show(n); });
      b.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { e.preventDefault(); show((cur + 1) % tabs.length, true); }
        if (e.key === "ArrowLeft") { e.preventDefault(); show((cur + tabs.length - 1) % tabs.length, true); }
      });
    });
    show(0);
  }
})();
