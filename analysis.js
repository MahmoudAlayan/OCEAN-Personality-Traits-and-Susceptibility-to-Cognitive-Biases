const byId = (id) => document.getElementById(id);

const API_BASE = "/api";
const API_RESPONSES_ENDPOINT = `${API_BASE}/responses`;

const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
const std = (arr) => {
  const m = mean(arr);
  const variance = arr.reduce((sum, val) => sum + (val - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
};

const pearson = (x, y) => {
  const n = x.length;
  const meanX = mean(x);
  const meanY = mean(y);
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx ** 2;
    denY += dy ** 2;
  }
  const denom = Math.sqrt(denX * denY);
  return denom === 0 ? 0 : num / denom;
};

const effectLabel = (r) => {
  const abs = Math.abs(r);
  if (abs >= 0.5) return "large";
  if (abs >= 0.3) return "moderate";
  if (abs >= 0.1) return "small";
  return "trivial";
};

const fetchResponses = async () => {
  try {
    const response = await fetch(API_RESPONSES_ENDPOINT);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("Failed to load responses.", error);
    return [];
  }
};

const buildDescTable = (variables, data) => {
  const table = byId("desc-table");
  table.innerHTML = "";
  const header = document.createElement("tr");
  ["Variable", "Mean", "SD", "Min", "Max"].forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    header.appendChild(th);
  });
  table.appendChild(header);

  variables.forEach((variable) => {
    const values = data.map((row) => variable.get(row));
    const tr = document.createElement("tr");
    const cells = [
      variable.label,
      mean(values).toFixed(2),
      std(values).toFixed(2),
      Math.min(...values).toFixed(2),
      Math.max(...values).toFixed(2)
    ];
    cells.forEach((text) => {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
};

const buildCorrelationMatrix = (variables, data) => {
  const table = byId("corr-table");
  table.innerHTML = "";

  const header = document.createElement("tr");
  const empty = document.createElement("th");
  empty.textContent = "";
  header.appendChild(empty);
  variables.forEach((variable) => {
    const th = document.createElement("th");
    th.textContent = variable.label;
    header.appendChild(th);
  });
  table.appendChild(header);

  const matrix = [];
  variables.forEach((rowVar, rowIdx) => {
    const row = [];
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = rowVar.label;
    tr.appendChild(th);

    variables.forEach((colVar, colIdx) => {
      const x = data.map((entry) => rowVar.get(entry));
      const y = data.map((entry) => colVar.get(entry));
      const r = rowIdx === colIdx ? 1 : pearson(x, y);
      row.push(r);
      const td = document.createElement("td");
      td.textContent = r.toFixed(2);
      tr.appendChild(td);
    });
    matrix.push(row);
    table.appendChild(tr);
  });

  return matrix;
};

const renderCorrelationChart = (traits, data) => {
  const ctx = byId("corr-chart").getContext("2d");
  const tickStyle = { color: "#ffffff", font: { weight: "700" } };
  const gridStyle = { color: "rgba(255, 255, 255, 0.08)" };

  const anchoringValues = traits.map((trait) => {
    const x = data.map((entry) => trait.get(entry));
    const y = data.map((entry) => entry.anchoring.index);
    return pearson(x, y);
  });
  const confirmationValues = traits.map((trait) => {
    const x = data.map((entry) => trait.get(entry));
    const y = data.map((entry) => entry.confirmation.overall);
    return pearson(x, y);
  });

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: traits.map((trait) => trait.label),
      datasets: [
        {
          label: "Anchoring",
          data: anchoringValues,
          backgroundColor: "rgba(123, 205, 255, 0.7)"
        },
        {
          label: "Confirmation",
          data: confirmationValues,
          backgroundColor: "rgba(255, 174, 214, 0.7)"
        }
      ]
    },
    options: {
      scales: {
        x: { ticks: tickStyle, grid: gridStyle },
        y: { ticks: tickStyle, grid: gridStyle, min: -1, max: 1 }
      },
      plugins: {
        legend: { labels: { color: "#ffffff", font: { weight: "700" } } }
      }
    }
  });
};

const buildSummaryText = (variables, matrix) => {
  const pairs = [];
  for (let i = 0; i < variables.length; i += 1) {
    for (let j = i + 1; j < variables.length; j += 1) {
      pairs.push({
        a: variables[i].label,
        b: variables[j].label,
        r: matrix[i][j]
      });
    }
  }
  pairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  const top = pairs.slice(0, 3);

  const lines = top.map((pair) => {
    return `${pair.a} and ${pair.b} show an r=${pair.r.toFixed(2)} (${effectLabel(pair.r)} association).`;
  });

  return `Strongest observed correlations: ${lines.join(" ")}`;
};

const buildInterpretation = (matrix, variables, sampleSize, meanAge) => {
  const lines = [];
  lines.push(`<p>This analysis summarizes ${sampleSize} responses from participants aged 18–35 (mean age ${meanAge.toFixed(1)}). Associations are reported as Pearson correlations, which describe how two measures move together on average.</p>`);
  lines.push(`<p>Correlations near 0 indicate little linear relationship, while positive values indicate that higher scores on one measure tend to coincide with higher scores on the other. Negative values indicate the opposite. These are descriptive patterns and do not imply causality.</p>`);

  const anchoringIdx = variables.findIndex((v) => v.label === "Anchoring index");
  const confirmationIdx = variables.findIndex((v) => v.label === "Confirmation index");

  if (anchoringIdx !== -1) {
    const anchors = variables.slice(1, 6).map((trait, idx) => {
      return { trait: trait.label, r: matrix[idx + 1][anchoringIdx] };
    });
    anchors.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
    const top = anchors[0];
    lines.push(`<p>The strongest personality association with anchoring is ${top.trait} (r=${top.r.toFixed(2)}, ${effectLabel(top.r)}). This may reflect differences in estimation style, but it should be interpreted cautiously because anchoring is task-specific and can vary with context and familiarity.</p>`);
  }

  if (confirmationIdx !== -1) {
    const confirms = variables.slice(1, 6).map((trait, idx) => {
      return { trait: trait.label, r: matrix[idx + 1][confirmationIdx] };
    });
    confirms.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
    const top = confirms[0];
    lines.push(`<p>The strongest personality association with confirmation bias is ${top.trait} (r=${top.r.toFixed(2)}, ${effectLabel(top.r)}). This pattern is exploratory and may reflect how individuals evaluate evidence in brief tasks, not a stable judgment habit.</p>`);
  }

  lines.push(`<p>Given the brief measures and convenience sampling, these results are best used to generate hypotheses rather than definitive conclusions. Larger samples and repeated measures would provide more stable estimates.</p>`);

  return lines.join("");
};

const buildFutureTopics = (matrix, variables) => {
  const topics = [
    "Metacognitive monitoring and confidence calibration",
    "Structured decision-making frameworks",
    "Debiasing techniques in estimation tasks",
    "Evidence evaluation and belief updating",
    "Cognitive reflection and analytic thinking",
    "Measurement reliability in brief personality scales"
  ];

  const strongest = [];
  for (let i = 0; i < variables.length; i += 1) {
    for (let j = i + 1; j < variables.length; j += 1) {
      strongest.push({
        pair: `${variables[i].label} × ${variables[j].label}`,
        r: matrix[i][j]
      });
    }
  }
  strongest.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  strongest.slice(0, 2).forEach((item) => {
    topics.unshift(`Deep-dive on ${item.pair} (r=${item.r.toFixed(2)})`);
  });

  const list = byId("future-topics");
  list.innerHTML = "";
  topics.slice(0, 8).forEach((topic) => {
    const li = document.createElement("li");
    li.textContent = topic;
    list.appendChild(li);
  });
};

const init = async () => {
  const responses = await fetchResponses();
  const data = responses.filter((entry) => entry.demographics && entry.demographics.age >= 18 && entry.demographics.age <= 35);

  if (data.length < 30) {
    byId("analysis-empty").classList.remove("hidden");
    byId("analysis-content").classList.add("hidden");
    byId("back-report").addEventListener("click", () => {
      window.location.href = "report.html";
    });
    byId("back-survey").addEventListener("click", () => {
      window.location.href = "index.html";
    });
    return;
  }

  const variables = [
    { label: "Age", get: (r) => r.demographics.age },
    { label: "Extraversion", get: (r) => r.bigFive.Extraversion },
    { label: "Agreeableness", get: (r) => r.bigFive.Agreeableness },
    { label: "Conscientiousness", get: (r) => r.bigFive.Conscientiousness },
    { label: "Neuroticism", get: (r) => r.bigFive.Neuroticism },
    { label: "Openness", get: (r) => r.bigFive.Openness },
    { label: "Anchoring index", get: (r) => r.anchoring.index },
    { label: "Confirmation index", get: (r) => r.confirmation.overall }
  ];

  const traitVars = variables.slice(1, 6);

  const ages = data.map((entry) => entry.demographics.age);
  const meanAge = mean(ages);
  byId("sample-info").textContent = `Sample size: N=${data.length}. Mean age: ${meanAge.toFixed(1)}. Correlations computed on complete cases only.`;

  buildDescTable(variables, data);
  const matrix = buildCorrelationMatrix(variables, data);
  renderCorrelationChart(traitVars, data);

  byId("summary-text").textContent = buildSummaryText(variables, matrix);
  byId("interpretation-text").innerHTML = buildInterpretation(matrix, variables, data.length, meanAge);
  buildFutureTopics(matrix, variables);

  byId("back-report").addEventListener("click", () => {
    window.location.href = "report.html";
  });
  byId("back-survey").addEventListener("click", () => {
    window.location.href = "index.html";
  });
};

init();



