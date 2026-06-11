/* ============================================================
   graph-hero.js — renders the interactive knowledge-graph hero
   into #graph-hero, builds the #gh-list mobile/a11y fallback,
   and bridges node clicks to the site's section navigation.
   Depends on: window.PORTFOLIO (portfolio-data.js) and ForceGraph.
   ============================================================ */
(function () {
  "use strict";
  var P = window.PORTFOLIO;
  if (!P) return;

  var NODES = P.nodes, LINKS = P.links;
  var NODE_BY_ID = {};
  NODES.forEach(function (n) { NODE_BY_ID[n.id] = n; });

  // adjacency for neighbour-highlight
  var NEIGHBORS = {};
  NODES.forEach(function (n) { NEIGHBORS[n.id] = new Set(); });
  LINKS.forEach(function (l) { NEIGHBORS[l.source].add(l.target); NEIGHBORS[l.target].add(l.source); });

  var C = { bg: "#010e1b", green: "#12d640", amber: "#ffc107", teal: "#2ee6c0" };
  var SIZE = { root: 13, branch: 8, leaf: 5 };

  // ---- small helpers (used by count-up, confetti, tooltip) ----
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function nowMs() { return (window.performance && performance.now) ? performance.now() : 0; }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // Defensive: data-supplied strings become href attributes below. Relative URLs
  // (projects/x.html, #about, /path) are fine; an explicit scheme must be one of
  // http(s)/mailto — anything else (javascript:, data:, vbscript:) is neutralised.
  function safeUrl(u) {
    u = String(u == null ? "" : u).trim();
    var m = u.match(/^([a-z][a-z0-9+.\-]*):/i);
    if (m && !/^(https?|mailto)$/i.test(m[1])) return "#";
    return u;
  }

  // maps a section #hash to the graph node it corresponds to; used both by the
  // top-nav bridge (open the node instead of routing to a legacy section) and by
  // boot() to translate a direct #hash URL into opening that node on desktop.
  var NAV_TO_NODE = {
    "#about": "me", "#contact": "me",
    "#experience": "b-exp", "#skills": "b-skl", "#portfolio": "b-prj",
    "#blog": "b-blog", "#research": "b-rsr", "#certifications": "b-cert", "#education": "b-edu"
  };

  function nodeColor(n) {
    if (n.type === "root") return C.green;
    if (n.flagged) return C.amber;
    if (n.type === "branch") return C.teal;
    return "#7fa6c4";
  }

  /* ---------- navigation bridge ---------- */
  function goToSection(hash) {
    if (window.showSection) window.showSection(hash);
    else { location.hash = hash; }      // graceful fallback
  }

  // Which top-nav item a node corresponds to (root → About, branch → its own
  // section, leaf → its parent branch's section). Used to keep the nav's
  // .active highlight in sync while the graph — not main.js — drives navigation.
  function navHashForNode(node) {
    if (!node) return null;
    if (node.type === "root") return "#about";
    if (node.type === "branch") return node.section || null;
    var p = node.parent && NODE_BY_ID[node.parent];
    return (p && p.section) || null;
  }
  function setActiveNav(hash) {
    document.querySelectorAll(".nav-menu .active, .mobile-nav .active")
      .forEach(function (li) { li.classList.remove("active"); });
    if (!hash) return;
    document.querySelectorAll('.nav-menu a[href="' + hash + '"], .mobile-nav a[href="' + hash + '"]')
      .forEach(function (a) { var li = a.closest("li"); if (li) li.classList.add("active"); });
  }

  // ---- deep links: a node ↔ a URL hash, so any panel is shareable ----
  // branch/root use the friendly section hash (#experience); leaves use their
  // own id (#e-bluearc) so the specific role/project/paper is addressable.
  function hashForNode(node) {
    if (!node) return "";
    if (node.type === "leaf") return "#" + node.id;
    return navHashForNode(node) || "#" + node.id;
  }
  function nodeIdFromHash(h) {
    if (!h) return null;
    if (NAV_TO_NODE[h]) return NAV_TO_NODE[h];
    var id = h.charAt(0) === "#" ? h.slice(1) : h;
    return NODE_BY_ID[id] ? id : null;
  }
  function setHash(h) {
    try { history.replaceState(null, "", h || (location.pathname + location.search)); }
    catch (e) { if (h) location.hash = h; }
  }

  // resolve an id to the *live* graph node (carries x/y after layout);
  // falls back to the static data object before the graph is built.
  function liveNode(id) {
    if (Graph) {
      var ns = Graph.graphData().nodes;
      for (var i = 0; i < ns.length; i++) if (ns[i].id === id) return ns[i];
    }
    return NODE_BY_ID[id];
  }

  /* ============================================================
     XP / level + achievements (computed from real stats)
     ============================================================ */
  function setupGamification() {
    var s = P.stats || {};
    var el = document.getElementById("gh-xp");
    if (!el) return;
    var stat = el.querySelectorAll(".stats b");
    var targets = [s.years || 0, s.certs || 0, s.papers || 0, s.degrees || 0];
    var suffix = ["+", "", "", ""];
    if (REDUCED) {
      targets.forEach(function (v, i) { if (stat[i]) stat[i].textContent = v + suffix[i]; });
    } else {
      // count up from 0 — a small "live dashboard" touch
      var start = nowMs(), dur = 900;
      (function step() {
        var p = clamp01((nowMs() - start) / dur), e = 1 - Math.pow(1 - p, 3);
        for (var i = 0; i < targets.length; i++) if (stat[i]) stat[i].textContent = Math.round(targets[i] * e) + (p >= 1 ? suffix[i] : "");
        if (p < 1) requestAnimationFrame(step);
      })();
    }
    updateXP();
  }
  // "Explored N%" — fills as the visitor opens leaf nodes (real progress, not decoration)
  function updateXP() {
    var el = document.getElementById("gh-xp"); if (!el) return;
    var leaves = NODES.filter(function (n) { return n.type === "leaf"; });
    var total = leaves.length || 1;
    var seen = leaves.filter(function (n) { return visited.has(n.id); }).length;
    var pct = Math.round(seen / total * 100);
    var bar = el.querySelector(".gh-xp-bar i"); if (bar) bar.style.width = pct + "%";
    var prog = el.querySelector(".gh-xp-prog b"); if (prog) prog.textContent = pct + "%";
    if (pct >= 100) celebrate();
  }

  // ---- 100%-explored celebration: trophy toast + gold bar + confetti ----
  var celebrated = false;
  function celebrate() {
    if (celebrated) return; celebrated = true;
    fireToast("Completionist 🏆", "You explored the whole graph!");
    var bar = document.querySelector("#gh-xp .gh-xp-bar"); if (bar) bar.classList.add("done");
    var prog = document.querySelector("#gh-xp .gh-xp-prog"); if (prog) prog.innerHTML = "Explored <b>100%</b> — nicely done!";
    if (!REDUCED) confettiBurst();
  }
  function confettiBurst() {
    var cv = document.createElement("canvas");
    cv.id = "gh-confetti";
    cv.style.cssText = "position:fixed;inset:0;z-index:1001;pointer-events:none;";
    document.body.appendChild(cv);
    var ctx = cv.getContext("2d");
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    var colors = [C.green, C.teal, C.amber, "#ffffff"], parts = [];
    for (var i = 0; i < 150; i++) parts.push({
      x: cv.width / 2 + (Math.random() - 0.5) * cv.width * 0.5,
      y: -20 - Math.random() * cv.height * 0.25,
      vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 5,
      s: 4 + Math.random() * 6, rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.35,
      c: colors[(Math.random() * colors.length) | 0]
    });
    var start = nowMs(), DUR = 2800;
    (function frame() {
      var t = nowMs() - start, fade = t > DUR - 700 ? clamp01((DUR - t) / 700) : 1;
      ctx.clearRect(0, 0, cv.width, cv.height);
      parts.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.rot += p.vr;
        ctx.save(); ctx.globalAlpha = fade; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); ctx.restore();
      });
      if (t < DUR) requestAnimationFrame(frame);
      else if (cv.parentNode) cv.parentNode.removeChild(cv);
    })();
  }
  var visited = new Set(), earned = new Set();
  function fireToast(title, desc) {
    var t = document.getElementById("gh-toast");
    if (!t || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    t.querySelector(".t-title").textContent = title;
    t.querySelector(".t-desc").textContent = desc;
    t.classList.add("show");
    setTimeout(function () { t.classList.remove("show"); }, 3200);
  }
  function trackProgress(node) {
    visited.add(node.id);
    updateXP();
    if (window.dataLayer) window.dataLayer.push({ event: "graph_node_click", nodeId: node.id });
    if (node.flagged && !earned.has("deepdive")) { earned.add("deepdive"); fireToast("Deep Diver", "You found a flagship achievement."); }
    var branches = NODES.filter(function (n) { return n.type === "leaf" && visited.has(n.id); }).map(function (n) { return n.parent; });
    if (new Set(branches).size >= 3 && !earned.has("explorer")) { earned.add("explorer"); fireToast("Explorer", "Visited 3 different branches."); }
  }

  /* ============================================================
     Content panel
     ============================================================ */
  var panel, panelBody;
  function openPanel(node) {
    var html;
    // ---- center node: About + contact (everything inline, no routing) ----
    if (node.type === "root" && node.about) {
      var a = node.about;
      html = '<div class="gh-about">';
      if (a.photo) html += '<img class="gh-photo" src="' + safeUrl(a.photo) + '" alt="' + esc(String(node.label).replace(/\n/g, " ")) + '">';
      html += "<h2>" + esc(String(node.label).replace(/\n/g, " ")) + "</h2>";
      if (node.role) html += '<div class="sub">' + esc(node.role) + "</div>";
      if (a.bio) html += '<p class="gh-bio">' + esc(a.bio) + "</p>";
      if (a.interests && a.interests.length) html += '<div class="chips">' + a.interests.map(function (c) { return "<span>" + esc(c) + "</span>"; }).join("") + "</div>";
      if (a.contact) {
        var ct = a.contact;
        html += '<div class="gh-contact">';
        if (ct.email) html += '<a class="gh-email" href="' + safeUrl("mailto:" + ct.email) + '"><i class="bx bx-envelope"></i> ' + ct.email + "</a>";
        html += '<div class="gh-social">';
        if (ct.linkedin) html += '<a href="' + safeUrl(ct.linkedin) + '" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="bx bxl-linkedin"></i></a>';
        if (ct.github) html += '<a href="' + safeUrl(ct.github) + '" target="_blank" rel="noopener" aria-label="GitHub"><i class="bx bxl-github"></i></a>';
        if (ct.medium) html += '<a href="' + safeUrl(ct.medium) + '" target="_blank" rel="noopener" aria-label="Medium"><i class="bx bxl-medium"></i></a>';
        html += "</div></div>";
      }
      html += "</div>";
      panelBody.innerHTML = html;
      finishPanel();
      return;
    }
    // ---- branch node: in-graph overview of its leaves (no routing out) ----
    if (node.type === "branch") {
      var leaves = NODES.filter(function (n) { return n.parent === node.id; }).sort(function (x, y) { return (x.order || 0) - (y.order || 0); });
      html = '<span class="tag">' + esc(node.label) + "</span>";
      html += "<h2>" + esc(node.label) + "</h2>";
      html += '<ul class="gh-branch-list">' + leaves.map(function (l) {
        return '<li><a data-node="' + esc(l.id) + '"' + (l.flagged ? ' class="flag"' : "") + ">" +
          "<b>" + esc(l.title || l.label) + "</b>" +
          (l.year ? '<span class="yr">' + esc(l.year) + "</span>" : "") +
          (l.sub ? '<span class="sb">' + esc(l.sub) + "</span>" : "") + "</a></li>";
      }).join("") + "</ul>";
      panelBody.innerHTML = html;
      finishPanel();
      return;
    }
    // ---- leaf node: detail (self-contained; external link if any) ----
    var flagged = node.flagged;
    html = "";
    // back link up to the parent branch (data-node is wired in finishPanel to
    // re-open that node), so a leaf detail can return to its branch overview.
    var parent = node.parent && NODE_BY_ID[node.parent];
    if (parent) { var pLabel = esc(String(parent.label).replace(/\n/g, " ")); html += '<a class="gh-back" data-node="' + esc(parent.id) + '" aria-label="Back to ' + pLabel + '" title="Back to ' + pLabel + '">&#8249;</a>'; }
    var tagText = flagged ? (node.flagTag || "Flagged") : node.tag;
    if (tagText) html += '<span class="tag' + (flagged ? " flag" : "") + '">' + esc(tagText) + "</span>";
    html += "<h2>" + esc(node.title || node.label) + "</h2>";
    if (node.sub) html += '<div class="sub">' + esc(node.sub) + "</div>";
    if (node.dates) html += '<div class="dates">' + esc(node.dates) + "</div>";
    if (node.bullets && node.bullets.length) html += "<ul>" + node.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul>";
    if (node.chips && node.chips.length) html += '<div class="chips">' + node.chips.map(function (c) { return "<span>" + esc(c) + "</span>"; }).join("") + "</div>";
    if (node.url) html += '<a class="full" href="' + safeUrl(node.url) + '" target="_blank" rel="noopener">Open ↗</a>';
    panelBody.innerHTML = html;
    finishPanel();
  }
  function finishPanel() {
    panel.classList.add("open");
    document.body.classList.add("gh-panel-open");   // lets CSS hide the mobile hamburger so it doesn't clash with the panel's ×
    var hint = document.getElementById("gh-hint"); if (hint) hint.style.opacity = "0";
    // branch-overview entries open the matching leaf panel — never leave the graph
    panelBody.querySelectorAll("a[data-node]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var n = liveNode(this.getAttribute("data-node"));
        if (n) handleNodeClick(n);
      });
    });
  }
  function closePanel() {
    if (panel) panel.classList.remove("open");
    document.body.classList.remove("gh-panel-open");
    selectedId = null; highlightNodes = new Set(); highlightLinks = new Set();
    setActiveNav("#header");
    setHash("");                          // drop the deep-link hash on close
  }

  /* ============================================================
     The force-graph canvas + deterministic ordered layout
     ============================================================ */
  var Graph, highlightNodes = new Set(), highlightLinks = new Set(), selectedId = null, hoveredId = null, layoutBBox = null;
  var BRANCH_ORDER = ["b-exp", "b-skl", "b-prj", "b-blog", "b-rsr", "b-cert", "b-edu"];
  var RB = 175, RL = 135, LEAF_STEP = 15 * Math.PI / 180;

  function layout() {
    var nodes = Graph.graphData().nodes, byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; });
    function place(n, x, y) { if (!n) return; n.x = n.fx = x; n.y = n.fy = y; }
    place(byId["me"], 0, 0);
    var Nb = BRANCH_ORDER.length, start = -Math.PI / 2 + Math.PI / Nb;
    BRANCH_ORDER.forEach(function (bid, i) {
      var b = byId[bid]; if (!b) return;
      var ang = start + i * (2 * Math.PI / Nb);
      place(b, RB * Math.cos(ang), RB * Math.sin(ang));
      var leaves = nodes.filter(function (n) { return n.parent === bid; }).sort(function (a, c) { return (a.order || 0) - (c.order || 0); });
      var n = leaves.length;
      if (n <= 5) {
        var span = (n - 1) * LEAF_STEP;
        leaves.forEach(function (leaf, j) {
          var a = ang - span / 2 + j * LEAF_STEP;
          place(leaf, b.x + RL * Math.cos(a), b.y + RL * Math.sin(a));
        });
      } else {
        var perRow = 5, rowGap = 58;
        leaves.forEach(function (leaf, j) {
          var row = Math.floor(j / perRow), idx = j % perRow;
          var rowCount = Math.min(perRow, n - row * perRow);
          var sp = (rowCount - 1) * LEAF_STEP;
          var a = ang - sp / 2 + idx * LEAF_STEP;
          var rad = RL + row * rowGap;
          place(leaf, b.x + rad * Math.cos(a), b.y + rad * Math.sin(a));
        });
      }
    });
    var xs = nodes.map(function (n) { return n.x; }), ys = nodes.map(function (n) { return n.y; });
    layoutBBox = { minX: Math.min.apply(null, xs), maxX: Math.max.apply(null, xs), minY: Math.min.apply(null, ys), maxY: Math.max.apply(null, ys) };
  }

  // visible viewport size — prefer visualViewport (the actual on-screen width),
  // which matches the #graph-hero container. innerWidth / clientWidth can report
  // a wider *layout* viewport, which would size the canvas too wide and push the
  // graph off-centre to the right.
  function vpW() { return Math.round((window.visualViewport && window.visualViewport.width) || document.documentElement.clientWidth || window.innerWidth); }
  function vpH() { return Math.round((window.visualViewport && window.visualViewport.height) || document.documentElement.clientHeight || window.innerHeight); }

  function fitView(ms) {
    if (!layoutBBox) return;
    var vw = vpW(), vh = vpH();
    // Phones: a portrait viewport can't hold the whole radial web without tiny,
    // colliding labels. Centre on the root at a comfortable zoom so the hub +
    // branch ring read clearly; the visitor drags / pinches out to the leaves.
    if (vw < 768) {
      var R = Math.max(layoutBBox.maxX, -layoutBBox.minX, layoutBBox.maxY, -layoutBBox.minY) + 40;
      var zFit = (Math.min(vw, vh) / 2) / R;
      Graph.centerAt(0, 0, ms || 0);
      Graph.zoom(Math.max(0.62, Math.min(zFit * 1.35, 1.1)), ms || 0);
      return;
    }
    var pad = 150;
    var bw = (layoutBBox.maxX - layoutBBox.minX) || 1, bh = (layoutBBox.maxY - layoutBBox.minY) || 1;
    var z = Math.min((vw - pad * 2) / bw, (vh - pad * 2) / bh);
    Graph.centerAt((layoutBBox.minX + layoutBBox.maxX) / 2, (layoutBBox.minY + layoutBBox.maxY) / 2, ms || 0);
    Graph.zoom(Math.max(0.4, Math.min(z, 2)), ms || 0);
  }

  function setHighlight(node) {
    highlightNodes = new Set([node.id].concat(Array.from(NEIGHBORS[node.id])));
    highlightLinks = new Set();
    Graph.graphData().links.forEach(function (l) {
      var s = l.source.id || l.source, t = l.target.id || l.target;
      if (s === node.id || t === node.id) highlightLinks.add(l);
    });
    selectedId = node.id;
  }

  function handleNodeClick(node) {
    // everything opens in the slide-in panel — the graph is the only UI
    setHighlight(node);
    Graph.centerAt(node.x, node.y, 600);
    Graph.zoom(node.type === "root" ? 2.2 : node.type === "branch" ? 1.7 : 3.0, 600);
    openPanel(node);
    setActiveNav(navHashForNode(node));   // keep top-nav highlight in sync
    setHash(hashForNode(node));           // make the open panel shareable
    trackProgress(node);
  }

  /* ---------- hover preview tooltip ---------- */
  function showTip(node) {
    var tip = document.getElementById("gh-tip"); if (!tip) return;
    if (!node || REDUCED || !Graph) { tip.classList.remove("show"); return; }
    var title = node.title || String(node.label).replace(/\n/g, " ");
    var sub = node.sub || (node.type === "branch"
      ? NODES.filter(function (n) { return n.parent === node.id; }).length + " items"
      : (node.type === "root" ? node.role : node.tag)) || "";
    tip.innerHTML = '<div class="tip-t">' + esc(title) + "</div>" +
      (sub ? '<div class="tip-s">' + esc(sub) + "</div>" : "") +
      (node.year ? '<div class="tip-y">' + esc(node.year) + "</div>" : "");
    var sc = Graph.graph2ScreenCoords(node.x, node.y);
    var r = SIZE[node.type] || SIZE.leaf;
    tip.style.left = sc.x + "px";
    tip.style.top = (sc.y - r - 10) + "px";
    tip.classList.add("show");
  }

  function initGraph(elem) {
    Graph = ForceGraph()(elem)
      .backgroundColor(C.bg)
      .graphData({ nodes: NODES.map(function (n) { return Object.assign({}, n); }), links: LINKS.map(function (l) { return Object.assign({}, l); }) })
      .nodeId("id")
      .nodeLabel(function () { return ""; })
      .nodeRelSize(1)
      .linkColor(function (l) {
        return highlightLinks.has(l) ? "rgba(18,214,64,0.85)" : "rgba(120,150,175,0.18)";
      })
      .linkCurvature(0.06)        // a faint arc — reads more like a neural web than a wheel
      .linkWidth(function (l) { return highlightLinks.has(l) ? 2 : 1; })
      .linkDirectionalParticles(function (l) { return highlightLinks.has(l) ? 3 : 0; })
      .linkDirectionalParticleWidth(2)
      .linkDirectionalParticleColor(function () { return C.green; })
      .nodeCanvasObject(function (node, ctx, globalScale) {
        if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;
        var r = SIZE[node.type] || SIZE.leaf;
        var dim = (selectedId && !highlightNodes.has(node.id));
        var base = nodeColor(node);
        ctx.save();
        ctx.globalAlpha = dim ? 0.25 : 1;
        ctx.shadowBlur = (node.type === "root" ? 28 : node.flagged ? 22 : 14);
        ctx.shadowColor = base;
        var grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r);
        grad.addColorStop(0, "#ffffff"); grad.addColorStop(0.35, base); grad.addColorStop(1, base);
        ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, 2 * Math.PI); ctx.fillStyle = grad; ctx.fill();
        if (node.id === selectedId) { ctx.beginPath(); ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI); ctx.strokeStyle = base; ctx.lineWidth = 1.5; ctx.stroke(); }
        ctx.restore();

        var hovered = node.id === hoveredId;
        // labels: always for non-leaves, flagged + pinned high-signal leaves, the
        // hovered/selected/highlighted node, or once zoomed in.
        var showLabel = node.type !== "leaf" || node.flagged || node.pin || hovered ||
          node.id === selectedId || highlightNodes.has(node.id) || globalScale > 1.7;
        if (showLabel) {
          var pxMain = (node.type === "root" ? 15 : node.type === "branch" ? 13 : 11) / globalScale;
          var gap = 4 / globalScale, lineH = pxMain * 1.05;
          ctx.textAlign = "center"; ctx.textBaseline = "top";
          ctx.globalAlpha = dim ? 0.3 : 1;
          ctx.font = (node.type === "leaf" ? "500 " : "600 ") + pxMain + "px Poppins, sans-serif";
          ctx.fillStyle = node.type === "leaf" ? "#cfe0ef" : "#ffffff";
          var lines = String(node.label).split("\n");
          lines.forEach(function (ln, i) { ctx.fillText(ln, node.x, node.y + r + gap + i * lineH); });
          if (node.year) {
            ctx.font = (10 / globalScale) + "px Poppins, sans-serif";
            ctx.fillStyle = node.flagged ? C.amber : C.teal;
            ctx.fillText(node.year, node.x, node.y + r + gap + lines.length * lineH);
          }
          ctx.globalAlpha = 1;
        }
      })
      .nodePointerAreaPaint(function (node, color, ctx) {
        ctx.fillStyle = color;
        if (node.type === "root") {
          // make the whole name + role label clickable, not just the dot
          ctx.fillRect(node.x - 85, node.y - 16, 170, 70);
          return;
        }
        var r = (SIZE[node.type] || SIZE.leaf) + 4;
        ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, 2 * Math.PI); ctx.fill();
      })
      .onNodeClick(handleNodeClick)
      .onNodeHover(function (node) {
        hoveredId = node ? node.id : null;
        elem.style.cursor = node ? "pointer" : "grab";
        showTip(node);
      })
      .onBackgroundClick(closePanel);

    Graph.d3Force("charge", null);
    Graph.d3Force("link", null);
    Graph.d3Force("center", null);
    layout();
    Graph.cooldownTicks(0);
    Graph.width(vpW()).height(vpH());
    fitView(0);
    setTimeout(function () { Graph.width(vpW()).height(vpH()); fitView(0); }, 80);

    window.addEventListener("resize", function () { Graph.width(vpW()).height(vpH()); fitView(0); });
    // re-fit when the visitor returns to the home/graph view
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href="#header"], #header h1 a');
      if (a) setTimeout(function () { fitView(0); }, 380);
    });

    // While the graph is the active view, the top-nav drives the graph itself
    // (open the matching node) instead of routing to the legacy sections.
    document.addEventListener("click", function (e) {
      if (document.body.classList.contains("section-active")) return;  // classic view → let main.js handle
      var a = e.target.closest && e.target.closest(".nav-menu a, .mobile-nav a");
      if (!a) return;
      var nid = NAV_TO_NODE[a.getAttribute("href")];
      if (!nid) return;  // e.g. #header → fall through to goHome
      e.preventDefault(); e.stopImmediatePropagation();
      var n = liveNode(nid);
      if (n) handleNodeClick(n);
    }, true);
  }

  /* ============================================================
     Mobile / a11y fallback list (always in DOM for crawlers + SR)
     ============================================================ */
  function buildList() {
    var list = document.getElementById("gh-list");
    if (!list) return;
    var me = NODE_BY_ID["me"];
    var html = '<a class="gh-leaf" href="' + ((me && me.section) || "#about") + '" data-section="' + ((me && me.section) || "#about") + '" style="border:1px solid rgba(255,255,255,0.1);border-radius:12px;margin-bottom:12px;"><b>About ' + (me ? me.label.replace(/\n/g, " ") : "") + '</b><br>Photo, bio &amp; interests</a>';
    BRANCH_ORDER.forEach(function (bid) {
      var b = NODE_BY_ID[bid]; if (!b) return;
      var leaves = NODES.filter(function (n) { return n.parent === bid; }).sort(function (a, c) { return (a.order || 0) - (c.order || 0); });
      html += '<details class="gh-branch"><summary>' + b.label + "</summary>";
      leaves.forEach(function (leaf) {
        var href = safeUrl(leaf.url || b.section || "#");
        var ext = leaf.url ? ' target="_blank" rel="noopener"' : ' data-section="' + (b.section || "") + '"';
        html += '<a class="gh-leaf' + (leaf.flagged ? " flag" : "") + '" href="' + href + '"' + ext + '>' +
          "<b>" + (leaf.title || leaf.label) + "</b>" + (leaf.year ? '<span class="yr">' + leaf.year + "</span>" : "") +
          (leaf.sub ? "<br>" + leaf.sub : "") + "</a>";
      });
      html += "</details>";
    });
    list.innerHTML = html;
    // internal section links route through the section machine
    list.querySelectorAll("a.gh-leaf[data-section]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        var sec = this.getAttribute("data-section");
        if (sec) { e.preventDefault(); goToSection(sec); }
      });
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    panel = document.getElementById("gh-panel");
    panelBody = document.getElementById("gh-panel-body");
    var closeBtn = document.querySelector("#gh-panel .gh-close");
    if (closeBtn) closeBtn.addEventListener("click", closePanel);
    // Esc closes the detail panel (expected gesture for a slide-over)
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel && panel.classList.contains("open")) closePanel();
    });

    setupGamification();
    buildList();

    var elem = document.getElementById("graph-hero");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // spin up the canvas on every viewport (incl. phones) unless the visitor
    // prefers reduced motion or ForceGraph failed to load — then the list shows.
    var graphActive = elem && typeof ForceGraph !== "undefined" && !reduced;
    if (graphActive) {
      // flips the mobile CSS from the no-JS list fallback to the live graph
      document.body.classList.add("gh-graph-live");
      initGraph(elem);
      // desktop: a direct #section URL opens the matching graph node, not a legacy
      // section (main.js suppresses its on-load showSection in this case). If the
      // hash maps to nothing, the graph simply stays at home — still sealed.
      var nid = nodeIdFromHash(location.hash);
      if (nid) setTimeout(function () { var n = liveNode(nid); if (n) handleNodeClick(n); }, 120);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
