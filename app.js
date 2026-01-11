const DATA_MODE = "collectAnonymized";
const API_BASE = "/api";
const API_SUBMIT_ENDPOINT = `${API_BASE}/submit`;
const API_RESPONSES_ENDPOINT = `${API_BASE}/responses`;
const AUTO_SAVE_JSON = false;

const bigFiveItems = [
  { id: "b1", text: "I am the life of the party.", trait: "Extraversion", reverse: false },
  { id: "b2", text: "I do not talk a lot.", trait: "Extraversion", reverse: true },
  { id: "b3", text: "I feel comfortable around people.", trait: "Extraversion", reverse: false },
  { id: "b4", text: "I keep in the background.", trait: "Extraversion", reverse: true },
  { id: "b5", text: "I feel little concern for others.", trait: "Agreeableness", reverse: true },
  { id: "b6", text: "I am interested in people.", trait: "Agreeableness", reverse: false },
  { id: "b7", text: "I insult people.", trait: "Agreeableness", reverse: true },
  { id: "b8", text: "I sympathize with others' feelings.", trait: "Agreeableness", reverse: false },
  { id: "b9", text: "I am always prepared.", trait: "Conscientiousness", reverse: false },
  { id: "b10", text: "I leave my belongings around.", trait: "Conscientiousness", reverse: true },
  { id: "b11", text: "I pay attention to details.", trait: "Conscientiousness", reverse: false },
  { id: "b12", text: "I make a mess of things.", trait: "Conscientiousness", reverse: true },
  { id: "b13", text: "I get stressed out easily.", trait: "Neuroticism", reverse: false },
  { id: "b14", text: "I am relaxed most of the time.", trait: "Neuroticism", reverse: true },
  { id: "b15", text: "I worry about things.", trait: "Neuroticism", reverse: false },
  { id: "b16", text: "I seldom feel blue.", trait: "Neuroticism", reverse: true },
  { id: "b17", text: "I have a rich vocabulary.", trait: "Openness", reverse: false },
  { id: "b18", text: "I have difficulty understanding abstract ideas.", trait: "Openness", reverse: true },
  { id: "b19", text: "I have a vivid imagination.", trait: "Openness", reverse: false },
  { id: "b20", text: "I am not interested in abstract ideas.", trait: "Openness", reverse: true }
];

const anchoringItems = [
  {
    id: "a1",
    prompt: "Average daily smartphone screen time for adults",
    unit: "minutes",
    midpoint: 210,
    low: 60,
    high: 360,
    step: 1
  },
  {
    id: "a2",
    prompt: "Typical number of times people check their phone per day",
    unit: "checks",
    midpoint: 75,
    low: 30,
    high: 120,
    step: 1
  },
  {
    id: "a3",
    prompt: "Typical number of steps walked by a person in a day",
    unit: "steps",
    midpoint: 7500,
    low: 3000,
    high: 12000,
    step: 100
  },
  {
    id: "a4",
    prompt: "Average length of a song",
    unit: "minutes",
    midpoint: 3.5,
    low: 2,
    high: 5,
    step: 0.1
  }
];

const confirmationTopics = [
  {
    id: "c1",
    topic: "Short daily walks improve daytime alertness",
    snippets: [
      {
        id: "c1a",
        type: "confirm",
        text: "A small workplace study found employees reported higher alertness after adding a 15-minute lunch walk for two weeks."
      },
      {
        id: "c1b",
        type: "confirm",
        text: "Wearable data from a wellness program showed a modest uptick in afternoon activity levels on days participants walked before lunch."
      },
      {
        id: "c1c",
        type: "disconfirm",
        text: "A university study observed no measurable change in reaction time after a short walk compared to sitting quietly."
      },
      {
        id: "c1d",
        type: "disconfirm",
        text: "In a survey of commuters, perceived alertness did not differ between those who walked briefly and those who did not."
      }
    ]
  },
  {
    id: "c2",
    topic: "Spacing study sessions improves recall",
    snippets: [
      {
        id: "c2a",
        type: "confirm",
        text: "Students who reviewed material across three days recalled more items than students who reviewed in one longer session."
      },
      {
        id: "c2b",
        type: "confirm",
        text: "A lab experiment found higher quiz scores when practice problems were distributed across short sessions."
      },
      {
        id: "c2c",
        type: "disconfirm",
        text: "One classroom study found no performance difference between spaced practice and a single review session."
      },
      {
        id: "c2d",
        type: "disconfirm",
        text: "A replication attempt reported inconsistent benefits depending on the subject matter."
      }
    ]
  },
  {
    id: "c3",
    topic: "Using a blue-light filter in the evening improves sleep quality",
    snippets: [
      {
        id: "c3a",
        type: "confirm",
        text: "Participants using a blue-light filter reported falling asleep slightly faster on weeknights."
      },
      {
        id: "c3b",
        type: "confirm",
        text: "A pilot study noted fewer nighttime awakenings after two weeks of filtered screen use."
      },
      {
        id: "c3c",
        type: "disconfirm",
        text: "A controlled trial found no difference in sleep quality scores between filter and no-filter conditions."
      },
      {
        id: "c3d",
        type: "disconfirm",
        text: "A survey of evening screen users found that filter usage did not predict self-reported sleep satisfaction."
      }
    ]
  }
];

const steps = [
  { id: "step-0" },
  { id: "step-1" },
  { id: "step-2" },
  { id: "step-3" }
];

const state = {
  anchors: {},
  charts: {}
};

const byId = (id) => document.getElementById(id);

const shuffle = (array) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const showStep = (index) => {
  steps.forEach((step, i) => {
    const el = byId(step.id);
    if (!el) return;
    el.classList.toggle("hidden", i !== index);
  });
  const progress = byId("progress-bar");
  const percent = (index / (steps.length - 1)) * 100;
  progress.style.width = `${percent}%`;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const renderBigFive = () => {
  const container = byId("bigfive-list");
  container.innerHTML = "";
  bigFiveItems.forEach((item, idx) => {
    const block = document.createElement("div");
    block.className = "question";
    const prompt = document.createElement("p");
    prompt.textContent = `${idx + 1}. ${item.text}`;
    block.appendChild(prompt);

    const scale = document.createElement("div");
    scale.className = "likert";
    for (let i = 1; i <= 5; i += 1) {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = item.id;
      input.value = i;
      label.appendChild(input);
      label.appendChild(document.createTextNode(`${i}`));
      scale.appendChild(label);
    }
    block.appendChild(scale);
    container.appendChild(block);
  });
};

const renderAnchoring = () => {
  const container = byId("anchoring-list");
  container.innerHTML = "";
  anchoringItems.forEach((item, idx) => {
    const anchor = Math.random() < 0.5 ? item.low : item.high;
    state.anchors[item.id] = anchor;
    const block = document.createElement("div");
    block.className = "question";

    const prompt = document.createElement("p");
    prompt.textContent = `${idx + 1}. ${item.prompt}`;
    block.appendChild(prompt);

    const anchorLine = document.createElement("p");
    anchorLine.innerHTML = `Is the true value higher or lower than <strong>${anchor} ${item.unit}</strong>?`;
    block.appendChild(anchorLine);

    const choice = document.createElement("div");
    choice.className = "likert";
    ["Lower", "Higher"].forEach((labelText) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `${item.id}-hl`;
      input.value = labelText.toLowerCase();
      label.appendChild(input);
      label.appendChild(document.createTextNode(labelText));
      choice.appendChild(label);
    });
    block.appendChild(choice);

    const estimateLabel = document.createElement("label");
    estimateLabel.textContent = `Your estimate (${item.unit})`;
    const estimate = document.createElement("input");
    estimate.type = "number";
    estimate.step = item.step;
    estimate.id = `${item.id}-estimate`;
    estimate.placeholder = `e.g., ${item.midpoint}`;
    estimateLabel.appendChild(estimate);
    block.appendChild(estimateLabel);

    container.appendChild(block);
  });
};

const renderConfirmation = () => {
  const container = byId("confirmation-list");
  container.innerHTML = "";
  confirmationTopics.forEach((topic) => {
    const wrapper = document.createElement("div");
    wrapper.className = "question";
    const heading = document.createElement("h4");
    heading.textContent = topic.topic;
    wrapper.appendChild(heading);

    const snippets = shuffle(topic.snippets);
    snippets.forEach((snippet) => {
      const block = document.createElement("div");
      block.className = "question";

      const text = document.createElement("p");
      text.textContent = snippet.text;
      block.appendChild(text);

      const scale = document.createElement("div");
      scale.className = "likert";
      for (let i = 1; i <= 7; i += 1) {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = snippet.id;
        input.value = i;
        label.appendChild(input);
        label.appendChild(document.createTextNode(`${i}`));
        scale.appendChild(label);
      }
      block.appendChild(scale);
      wrapper.appendChild(block);
    });

    container.appendChild(wrapper);
  });
};

const getRadioValue = (name) => {
  const selected = document.querySelector(`input[name="${name}"]:checked`);
  if (!selected) return null;
  const numeric = Number(selected.value);
  return Number.isNaN(numeric) ? selected.value : numeric;
};

const validateDemographics = () => {
  const age = Number(byId("age").value);
  if (!age || age < 18 || age > 35) {
    return "Please enter an age between 18 and 35.";
  }
  return "";
};

const validateBigFive = () => {
  for (const item of bigFiveItems) {
    if (!getRadioValue(item.id)) {
      return "Please answer every Big Five item.";
    }
  }
  return "";
};

const validateAnchoring = () => {
  for (const item of anchoringItems) {
    if (!getRadioValue(`${item.id}-hl`)) {
      return "Please select higher or lower for each anchoring item.";
    }
    const estimateRaw = byId(`${item.id}-estimate`).value;
    const estimate = Number(estimateRaw);
    if (estimateRaw === "" || Number.isNaN(estimate)) {
      return "Please provide all numeric estimates.";
    }
  }
  return "";
};

const validateConfirmation = () => {
  for (const topic of confirmationTopics) {
    for (const snippet of topic.snippets) {
      if (!getRadioValue(snippet.id)) {
        return "Please rate every evidence snippet.";
      }
    }
  }
  return "";
};

const computeBigFive = () => {
  const totals = {
    Extraversion: [],
    Agreeableness: [],
    Conscientiousness: [],
    Neuroticism: [],
    Openness: []
  };
  bigFiveItems.forEach((item) => {
    let value = getRadioValue(item.id);
    if (item.reverse) {
      value = 6 - value;
    }
    totals[item.trait].push(value);
  });

  const scores = {};
  Object.keys(totals).forEach((trait) => {
    const avg = totals[trait].reduce((a, b) => a + b, 0) / totals[trait].length;
    scores[trait] = Math.round(((avg - 1) / 4) * 100);
  });
  return scores;
};

const computeAnchoring = () => {
  const shifts = [];
  anchoringItems.forEach((item) => {
    const estimate = Number(byId(`${item.id}-estimate`).value);
    const anchor = state.anchors[item.id];
    const denom = anchor - item.midpoint;
    let shift = 0;
    if (denom !== 0) {
      shift = (estimate - item.midpoint) / denom;
    }
    shifts.push(clamp(shift, -1, 1));
  });
  const avgShift = shifts.reduce((a, b) => a + b, 0) / shifts.length;
  const index = Math.round(((avgShift + 1) / 2) * 100);
  return { index, avgShift };
};

const computeConfirmation = () => {
  const perTopic = [];
  confirmationTopics.forEach((topic) => {
    const confirmRatings = [];
    const disconfirmRatings = [];
    topic.snippets.forEach((snippet) => {
      const rating = getRadioValue(snippet.id);
      if (snippet.type === "confirm") {
        confirmRatings.push(rating);
      } else {
        disconfirmRatings.push(rating);
      }
    });
    const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const confirmMean = mean(confirmRatings);
    const disconfirmMean = mean(disconfirmRatings);
    perTopic.push({
      topic: topic.topic,
      index: Number((confirmMean - disconfirmMean).toFixed(2))
    });
  });
  const overall = perTopic.reduce((a, b) => a + b.index, 0) / perTopic.length;
  return { perTopic, overall: Number(overall.toFixed(2)) };
};

const updateSampleData = (scores) => {
  const raw = localStorage.getItem("sampleData");
  const data = raw ? JSON.parse(raw) : [];
  data.push({ scores, timestamp: Date.now() });
  const trimmed = data.slice(-200);
  localStorage.setItem("sampleData", JSON.stringify(trimmed));
  return trimmed;
};

const computePercentiles = (sampleData, scores) => {
  if (sampleData.length < 30) return null;
  const percentiles = {};
  Object.keys(scores).forEach((trait) => {
    const values = sampleData.map((entry) => entry.scores[trait]);
    const count = values.filter((value) => value <= scores[trait]).length;
    percentiles[trait] = Math.round((count / values.length) * 100);
  });
  return percentiles;
};

const renderSummaryCards = (scores, anchoringIndex, confirmIndex, percentiles) => {
  const container = byId("summary-cards");
  container.innerHTML = "";

  const traitCard = document.createElement("div");
  traitCard.className = "summary-card";
  traitCard.innerHTML = `<h4>Big Five scores</h4>`;
  const list = document.createElement("div");
  Object.keys(scores).forEach((trait) => {
    const row = document.createElement("div");
    const percentileText = percentiles ? ` (P${percentiles[trait]})` : "";
    row.textContent = `${trait}: ${scores[trait]}${percentileText}`;
    list.appendChild(row);
  });
  traitCard.appendChild(list);

  const anchorCard = document.createElement("div");
  anchorCard.className = "summary-card";
  anchorCard.innerHTML = `<h4>Anchoring index</h4><div class="summary-value">${anchoringIndex}</div><div class="muted">0–100 experimental index</div>`;

  const confirmCard = document.createElement("div");
  confirmCard.className = "summary-card";
  confirmCard.innerHTML = `<h4>Confirmation index</h4><div class="summary-value">${confirmIndex}</div><div class="muted">Mean confirming - disconfirming</div>`;

  container.appendChild(traitCard);
  container.appendChild(anchorCard);
  container.appendChild(confirmCard);
};

const renderCharts = (scores, anchoringIndex, confirmIndex, perTopic) => {
  const bigFiveChart = byId("bigfive-chart").getContext("2d");
  const biasChart = byId("bias-chart").getContext("2d");
  const confirmChart = byId("confirm-chart").getContext("2d");

  Object.values(state.charts).forEach((chart) => chart.destroy());

  const tickStyle = { color: "#ffffff", font: { weight: "700" } };
  const gridStyle = { color: "rgba(255, 255, 255, 0.08)" };

  state.charts.bigfive = new Chart(bigFiveChart, {
    type: "bar",
    data: {
      labels: Object.keys(scores),
      datasets: [
        {
          label: "Score",
          data: Object.values(scores),
          backgroundColor: "rgba(155, 123, 255, 0.7)"
        }
      ]
    },
    options: {
      scales: {
        x: { ticks: tickStyle, grid: gridStyle },
        y: { beginAtZero: true, max: 100, ticks: tickStyle, grid: gridStyle }
      },
      plugins: {
        legend: {
          display: false,
          labels: { color: "#ffffff", font: { weight: "700" } }
        }
      }
    }
  });

  state.charts.bias = new Chart(biasChart, {
    type: "bar",
    data: {
      labels: ["Anchoring", "Confirmation"],
      datasets: [
        {
          label: "Index",
          data: [anchoringIndex, confirmIndex],
          backgroundColor: ["rgba(123, 205, 255, 0.7)", "rgba(255, 174, 214, 0.7)"]
        }
      ]
    },
    options: {
      scales: {
        x: { ticks: tickStyle, grid: gridStyle },
        y: { beginAtZero: true, max: 100, ticks: tickStyle, grid: gridStyle }
      },
      plugins: {
        legend: {
          display: false,
          labels: { color: "#ffffff", font: { weight: "700" } }
        }
      }
    }
  });

  state.charts.confirm = new Chart(confirmChart, {
    type: "bar",
    data: {
      labels: perTopic.map((item) => item.topic),
      datasets: [
        {
          label: "Confirmation bias index",
          data: perTopic.map((item) => item.index),
          backgroundColor: "rgba(155, 123, 255, 0.7)"
        }
      ]
    },
    options: {
      scales: {
        x: { ticks: tickStyle, grid: gridStyle },
        y: { beginAtZero: true, ticks: tickStyle, grid: gridStyle }
      },
      plugins: {
        legend: {
          display: false,
          labels: { color: "#ffffff", font: { weight: "700" } }
        }
      }
    }
  });
};

const describeTrait = (trait, score) => {
  if (score >= 70) {
    if (trait === "Extraversion") return "Higher score suggests you may feel energized by social interaction and prefer active environments.";
    if (trait === "Agreeableness") return "Higher score suggests a cooperative and considerate interpersonal style.";
    if (trait === "Conscientiousness") return "Higher score suggests structured, organized, and goal-directed habits.";
    if (trait === "Neuroticism") return "Higher score suggests greater sensitivity to stress or negative emotion in some situations.";
    if (trait === "Openness") return "Higher score suggests curiosity and interest in ideas, novelty, and imagination.";
  }
  if (score <= 40) {
    if (trait === "Extraversion") return "Lower score suggests a preference for quieter settings or smaller groups.";
    if (trait === "Agreeableness") return "Lower score suggests a more direct or skeptical style; this is not inherently negative.";
    if (trait === "Conscientiousness") return "Lower score suggests a more spontaneous approach with less emphasis on planning.";
    if (trait === "Neuroticism") return "Lower score suggests a steadier emotional tone or resilience to stress.";
    if (trait === "Openness") return "Lower score suggests a preference for familiarity and practical approaches.";
  }
  if (trait === "Extraversion") return "Mid-range suggests flexibility between social and quiet settings depending on context.";
  if (trait === "Agreeableness") return "Mid-range suggests balance between cooperation and assertiveness.";
  if (trait === "Conscientiousness") return "Mid-range suggests a mix of planning and spontaneity.";
  if (trait === "Neuroticism") return "Mid-range suggests typical variability in stress response.";
  if (trait === "Openness") return "Mid-range suggests a blend of novelty-seeking and practicality.";
  return "";
};

const renderInterpretation = (scores, anchoringIndex, confirmIndex) => {
  const traitLines = Object.keys(scores).map((trait) => {
    return `<strong>${trait}</strong>: ${describeTrait(trait, scores[trait])}`;
  });

  let anchoringLine = "Your anchoring index suggests moderate influence from anchors when making estimates.";
  if (anchoringIndex >= 60) {
    anchoringLine = "Your anchoring index suggests your estimates tended to move toward provided anchors more than the midpoint.";
  } else if (anchoringIndex <= 40) {
    anchoringLine = "Your anchoring index suggests your estimates were less pulled toward anchors than the midpoint.";
  }

  let confirmationLine = "Your confirmation index is near zero, suggesting similar strength ratings for confirming and disconfirming evidence.";
  if (confirmIndex >= 1) {
    confirmationLine = "Your confirmation index is positive, suggesting confirming snippets were rated stronger on average.";
  } else if (confirmIndex <= -1) {
    confirmationLine = "Your confirmation index is negative, suggesting disconfirming snippets were rated stronger on average.";
  }

  byId("interpretation").innerHTML = `
    <p>This report summarizes your responses using a 0-100 scale derived from the questionnaire. Scores are descriptive and not diagnostic.</p>
    <p>${traitLines.join(" ")}</p>
    <p>${anchoringLine} ${confirmationLine} These task indices are context-specific and can change across settings.</p>
    <p>Use this report as a reflection tool rather than a statement about fixed traits or abilities.</p>
  `;
};

const renderResearchTopics = (scores, anchoring, confirmation) => {
  const list = byId("research-topics");
  if (!list) return;

  const topics = [];
  const addTopic = (text) => {
    if (!topics.includes(text)) topics.push(text);
  };

  addTopic("Decision-making under uncertainty");
  addTopic("Critical thinking and evidence evaluation");

  if (anchoring.index >= 60) {
    addTopic("Anchoring effects and estimation calibration");
  } else if (anchoring.index <= 40) {
    addTopic("Calibration and interval estimation");
  } else {
    addTopic("Reducing anchor dependence in judgment");
  }

  if (confirmation.overall >= 1) {
    addTopic("Confirmation bias and belief updating");
  } else if (confirmation.overall <= -1) {
    addTopic("Integrating counter-evidence effectively");
  } else {
    addTopic("Balanced evidence appraisal");
  }

  if (scores.Conscientiousness <= 40) addTopic("Goal-setting and time management");
  if (scores.Conscientiousness >= 70) addTopic("Sustaining habits without burnout");
  if (scores.Neuroticism >= 70) addTopic("Stress regulation and cognitive load");
  if (scores.Extraversion <= 40) addTopic("Focus and deep work strategies");
  if (scores.Extraversion >= 70) addTopic("Group dynamics and communication");
  if (scores.Openness >= 70) addTopic("Creativity and divergent thinking");
  if (scores.Openness <= 40) addTopic("Structured learning and problem solving");

  list.innerHTML = "";
  topics.slice(0, 7).forEach((topic) => {
    const item = document.createElement("li");
    item.textContent = topic;
    list.appendChild(item);
  });
};

const maybeCollectAnonymized = async (payload) => {
  if (DATA_MODE !== "collectAnonymized") return;

  try {
    await fetch(API_SUBMIT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.warn("Anonymized data collection failed.", error);
  }
};

const collectBigFiveResponses = () => {
  const responses = {};
  bigFiveItems.forEach((item) => {
    responses[item.id] = getRadioValue(item.id);
  });
  return responses;
};

const collectAnchoringResponses = () => {
  return anchoringItems.map((item) => {
    return {
      id: item.id,
      prompt: item.prompt,
      anchor: state.anchors[item.id],
      higherLower: getRadioValue(`${item.id}-hl`),
      estimate: Number(byId(`${item.id}-estimate`).value),
      unit: item.unit,
      midpoint: item.midpoint
    };
  });
};

const collectConfirmationResponses = () => {
  return confirmationTopics.map((topic) => {
    return {
      id: topic.id,
      topic: topic.topic,
      snippets: topic.snippets.map((snippet) => ({
        id: snippet.id,
        type: snippet.type,
        rating: getRadioValue(snippet.id)
      }))
    };
  });
};

const buildExportData = (scores, anchoring, confirmation) => {
  return {
    consented: byId("consent-check").checked,
    demographics: {
      age: Number(byId("age").value),
      gender: byId("gender").value,
      education: byId("education").value,
      country: byId("country").value
    },
    bigFive: scores,
    bigFiveResponses: collectBigFiveResponses(),
    anchoring: {
      index: anchoring.index,
      anchors: state.anchors
    },
    anchoringResponses: collectAnchoringResponses(),
    confirmation: confirmation,
    confirmationResponses: collectConfirmationResponses(),
    timestamp: new Date().toISOString()
  };
};

const exportJson = (data, filename = "results.json") => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const saveLatestReport = (response) => {
  localStorage.setItem("latestReport", JSON.stringify(response));
};

const autoSaveJson = () => {
  return;
};

const downloadPdf = async () => {
  const report = byId("report");
  const canvas = await html2canvas(report, { scale: 2, useCORS: true });
  const imgData = canvas.toDataURL("image/png");
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");
  const margin = 10;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;
  pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
  heightLeft -= pageHeight - margin * 2;

  while (heightLeft > 0) {
    pdf.addPage();
    position = -(imgHeight - heightLeft) + margin;
    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;
  }

  pdf.save("report.pdf");
};

const fillDemoData = () => {
  byId("consent-check").checked = true;
  byId("age").value = 24 + Math.floor(Math.random() * 6);
  byId("gender").value = "";
  byId("education").value = "Master";
  byId("country").value = "Germany";

  bigFiveItems.forEach((item) => {
    const value = 2 + Math.floor(Math.random() * 4);
    const input = document.querySelector(`input[name="${item.id}"][value="${value}"]`);
    if (input) input.checked = true;
  });

  anchoringItems.forEach((item) => {
    const choice = Math.random() < 0.5 ? "lower" : "higher";
    const choiceInput = document.querySelector(`input[name="${item.id}-hl"][value="${choice}"]`);
    if (choiceInput) choiceInput.checked = true;
    const anchor = state.anchors[item.id];
    const estimate = item.midpoint + (anchor - item.midpoint) * (0.2 + Math.random() * 0.6);
    byId(`${item.id}-estimate`).value = estimate.toFixed(1);
  });

  confirmationTopics.forEach((topic) => {
    topic.snippets.forEach((snippet) => {
      const bias = snippet.type === "confirm" ? 5 : 3;
      const value = clamp(bias + Math.round(Math.random() * 2) - 1, 1, 7);
      const input = document.querySelector(`input[name="${snippet.id}"][value="${value}"]`);
      if (input) input.checked = true;
    });
  });
};

const wireEvents = () => {
  byId("consent-next").addEventListener("click", () => {
    if (!byId("consent-check").checked) {
      byId("consent-error").textContent = "Please confirm consent to continue.";
      return;
    }
    byId("consent-error").textContent = "";
    showStep(1);
  });

  byId("demo-next").addEventListener("click", () => {
    const error = validateDemographics();
    if (error) {
      byId("demo-error").textContent = error;
      return;
    }
    byId("demo-error").textContent = "";
    showStep(2);
  });

  byId("bigfive-next").addEventListener("click", () => {
    const error = validateBigFive();
    if (error) {
      byId("bigfive-error").textContent = error;
      return;
    }
    byId("bigfive-error").textContent = "";
    showStep(3);
  });

  byId("analyze").addEventListener("click", async () => {
    const anchoringError = validateAnchoring();
    if (anchoringError) {
      byId("tasks-error").textContent = anchoringError;
      return;
    }
    const confirmError = validateConfirmation();
    if (confirmError) {
      byId("tasks-error").textContent = confirmError;
      return;
    }
    byId("tasks-error").textContent = "";

    const scores = computeBigFive();
    const anchoring = computeAnchoring();
    const confirmation = computeConfirmation();

    const payload = buildExportData(scores, anchoring, confirmation);
    saveLatestReport(payload);

    await maybeCollectAnonymized({
      ...payload,
      demographics: { age: payload.demographics.age }
    });

    const progress = byId("progress-bar");
    if (progress) progress.style.width = "100%";

    window.location.href = "report.html";
  });

  const downloadBtn = byId("download-pdf");
  if (downloadBtn) downloadBtn.addEventListener("click", downloadPdf);

  const exportBtn = byId("export-json");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const scores = computeBigFive();
      const anchoring = computeAnchoring();
      const confirmation = computeConfirmation();
      const payload = buildExportData(scores, anchoring, confirmation);
      exportJson(payload);
    });
  }

  document.querySelectorAll("[data-back]").forEach((button) => {
    button.addEventListener("click", () => {
      showStep(Number(button.dataset.back));
    });
  });

  byId("demo-toggle").addEventListener("click", () => {
    byId("demo-tools").classList.toggle("hidden");
  });

  byId("demo-fill").addEventListener("click", () => {
    fillDemoData();
  });
};

const init = () => {
  renderBigFive();
  renderAnchoring();
  renderConfirmation();
  wireEvents();
  showStep(0);
};

init();















