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
    if (el) {
      var stat = el.querySelectorAll(".stats b");
      if (stat[0]) stat[0].textContent = s.years + "+";
      if (stat[1]) stat[1].textContent = s.certs;
      if (stat[2]) stat[2].textContent = s.papers;
      if (stat[3]) stat[3].textContent = s.degrees;
    }
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
      if (a.photo) html += '<img class="gh-photo" src="' + a.photo + '" alt="' + String(node.label).replace(/\n/g, " ") + '">';
      html += "<h2>" + String(node.label).replace(/\n/g, " ") + "</h2>";
      if (node.role) html += '<div class="sub">' + node.role + "</div>";
      if (a.bio) html += '<p class="gh-bio">' + a.bio + "</p>";
      if (a.interests && a.interests.length) html += '<div class="chips">' + a.interests.map(function (c) { return "<span>" + c + "</span>"; }).join("") + "</div>";
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
      html = '<span class="tag">' + node.label + "</span>";
      html += "<h2>" + node.label + "</h2>";
      html += '<ul class="gh-branch-list">' + leaves.map(function (l) {
        return '<li><a data-node="' + l.id + '"' + (l.flagged ? ' class="flag"' : "") + ">" +
          "<b>" + (l.title || l.label) + "</b>" +
          (l.year ? '<span class="yr">' + l.year + "</span>" : "") +
          (l.sub ? '<span class="sb">' + l.sub + "</span>" : "") + "</a></li>";
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
    if (parent) html += '<a class="gh-back" data-node="' + parent.id + '" aria-label="Back to ' + String(parent.label).replace(/\n/g, " ") + '" title="Back to ' + String(parent.label).replace(/\n/g, " ") + '">&#8249;</a>';
    html += '<span class="tag' + (flagged ? " flag" : "") + '">' + (flagged ? (node.flagTag || "Flagged") : node.tag) + "</span>";
    html += "<h2>" + (node.title || node.label) + "</h2>";
    if (node.sub) html += '<div class="sub">' + node.sub + "</div>";
    if (node.dates) html += '<div class="dates">' + node.dates + "</div>";
    if (node.bullets && node.bullets.length) html += "<ul>" + node.bullets.map(function (b) { return "<li>" + b + "</li>"; }).join("") + "</ul>";
    if (node.chips && node.chips.length) html += '<div class="chips">' + node.chips.map(function (c) { return "<span>" + c + "</span>"; }).join("") + "</div>";
    if (node.url) html += '<a class="full" href="' + safeUrl(node.url) + '" target="_blank" rel="noopener">Open ↗</a>';
    panelBody.innerHTML = html;
    finishPanel();
  }
  function finishPanel() {
    panel.classList.add("open");
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
  function closePanel() { if (panel) panel.classList.remove("open"); selectedId = null; highlightNodes = new Set(); highlightLinks = new Set(); setActiveNav("#header"); }

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

  function fitView(ms) {
    if (!layoutBBox) return;
    var pad = 150;
    var bw = (layoutBBox.maxX - layoutBBox.minX) || 1, bh = (layoutBBox.maxY - layoutBBox.minY) || 1;
    var z = Math.min((window.innerWidth - pad * 2) / bw, (window.innerHeight - pad * 2) / bh);
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
    trackProgress(node);
  }

  function initGraph(elem) {
    Graph = ForceGraph()(elem)
      .backgroundColor(C.bg)
      .graphData({ nodes: NODES.map(function (n) { return Object.assign({}, n); }), links: LINKS.map(function (l) { return Object.assign({}, l); }) })
      .nodeId("id")
      .nodeLabel(function () { return ""; })
      .nodeRelSize(1)
      .linkColor(function (l) { return highlightLinks.has(l) ? "rgba(18,214,64,0.85)" : "rgba(120,150,175,0.18)"; })
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
        var showLabel = node.type !== "leaf" || node.flagged || hovered || node.id === selectedId || highlightNodes.has(node.id) || globalScale > 1.7;
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
      .onNodeHover(function (node) { hoveredId = node ? node.id : null; elem.style.cursor = node ? "pointer" : "grab"; })
      .onBackgroundClick(closePanel);

    Graph.d3Force("charge", null);
    Graph.d3Force("link", null);
    Graph.d3Force("center", null);
    layout();
    Graph.cooldownTicks(0);
    Graph.width(window.innerWidth).height(window.innerHeight);
    fitView(0);
    setTimeout(function () { fitView(0); }, 80);

    window.addEventListener("resize", function () { Graph.width(window.innerWidth).height(window.innerHeight); fitView(0); });
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
    var isSmall = window.matchMedia("(max-width: 768px)").matches;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // only spin up the canvas when it will actually be shown
    var graphActive = elem && typeof ForceGraph !== "undefined" && !isSmall && !reduced;
    if (graphActive) {
      initGraph(elem);
      // desktop: a direct #section URL opens the matching graph node, not a legacy
      // section (main.js suppresses its on-load showSection in this case). If the
      // hash maps to nothing, the graph simply stays at home — still sealed.
      var nid = NAV_TO_NODE[location.hash];
      if (nid) setTimeout(function () { var n = liveNode(nid); if (n) handleNodeClick(n); }, 120);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
