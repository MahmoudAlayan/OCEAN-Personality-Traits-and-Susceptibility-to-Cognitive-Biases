const byId = (id) => document.getElementById(id);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const API_BASE = "/api";
const API_RESPONSES_ENDPOINT = `${API_BASE}/responses`;

let currentReport = null;

const getChartTheme = () => {
  const isPdf = document.body.classList.contains("pdf-mode");
  return {
    tickColor: isPdf ? "#111111" : "#ffffff",
    gridColor: isPdf ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)"
  };
};

const computePercentiles = (sampleData, scores) => {
  if (sampleData.length < 30) return null;
  const percentiles = {};
  Object.keys(scores).forEach((trait) => {
    const values = sampleData.map((entry) => entry.bigFive[trait]);
    const count = values.filter((value) => value <= scores[trait]).length;
    percentiles[trait] = Math.round((count / values.length) * 100);
  });
  return percentiles;
};

const fetchResponses = async () => {
  try {
    const response = await fetch(API_RESPONSES_ENDPOINT);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('Failed to load responses.', error);
    return [];
  }
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
  anchorCard.innerHTML = `<h4>Anchoring index</h4><div class="summary-value">${anchoringIndex}</div><div class="muted">0-100 experimental index</div>`;

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

  const isMobile = window.innerWidth <= 640;
  const theme = getChartTheme();
  const tickStyle = { color: theme.tickColor, font: { weight: "700", size: isMobile ? 10 : 12 } };
  const gridStyle = { color: theme.gridColor };
  const legendStyle = { color: theme.tickColor, font: { weight: "700" } };
  const confirmLabels = perTopic.map((item) => item.topic.split(" "));

  const confirmCanvas = byId("confirm-chart");
  confirmCanvas.height = isMobile ? 260 : 160;
  byId("bigfive-chart").height = isMobile ? 240 : 220;
  byId("bias-chart").height = isMobile ? 240 : 220;

  if (window._charts) {
    window._charts.forEach((chart) => chart.destroy());
  }
  window._charts = [];

  window._charts.push(new Chart(bigFiveChart, {
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
      maintainAspectRatio: false,
      scales: {
        x: { ticks: tickStyle, grid: gridStyle },
        y: { beginAtZero: true, max: 100, ticks: tickStyle, grid: gridStyle }
      },
      plugins: {
        legend: {
          display: false,
          labels: legendStyle
        }
      }
    }
  }));

  window._charts.push(new Chart(biasChart, {
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
      maintainAspectRatio: false,
      scales: {
        x: { ticks: tickStyle, grid: gridStyle },
        y: { beginAtZero: true, max: 100, ticks: tickStyle, grid: gridStyle }
      },
      plugins: {
        legend: {
          display: false,
          labels: legendStyle
        }
      }
    }
  }));

  window._charts.push(new Chart(confirmChart, {
    type: "bar",
    data: {
      labels: confirmLabels,
      datasets: [
        {
          label: "Confirmation bias index",
          data: perTopic.map((item) => item.index),
          backgroundColor: "rgba(155, 123, 255, 0.7)"
        }
      ]
    },
    options: {
      indexAxis: isMobile ? "y" : "x",
      maintainAspectRatio: false,
      scales: {
        x: { ticks: tickStyle, grid: gridStyle },
        y: { beginAtZero: true, ticks: tickStyle, grid: gridStyle }
      },
      plugins: {
        legend: {
          display: false,
          labels: legendStyle
        }
      }
    }
  }));
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

const downloadPdf = async () => {
  if (!currentReport) return;

  document.body.classList.add("pdf-mode");
  renderCharts(
    currentReport.bigFive,
    currentReport.anchoring.index,
    currentReport.confirmation.overall,
    currentReport.confirmation.perTopic
  );

  await new Promise((resolve) => setTimeout(resolve, 50));

  const report = byId("report");
  const canvas = await html2canvas(report, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
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

  document.body.classList.remove("pdf-mode");
  renderCharts(
    currentReport.bigFive,
    currentReport.anchoring.index,
    currentReport.confirmation.overall,
    currentReport.confirmation.perTopic
  );
};

const init = async () => {
  const raw = localStorage.getItem("latestReport");
  if (!raw) {
    byId("report").classList.add("hidden");
    byId("no-report").classList.remove("hidden");
    byId("start-survey").addEventListener("click", () => {
      window.location.href = "index.html";
    });
    return;
  }

  const report = JSON.parse(raw);
  currentReport = report;
  const responses = await fetchResponses();
  const sampleData = responses.filter((entry) => entry.demographics && entry.demographics.age >= 18 && entry.demographics.age <= 35);

  const percentiles = computePercentiles(sampleData, report.bigFive);

  renderSummaryCards(report.bigFive, report.anchoring.index, report.confirmation.overall, percentiles);
  renderCharts(report.bigFive, report.anchoring.index, report.confirmation.overall, report.confirmation.perTopic);
  renderInterpretation(report.bigFive, report.anchoring.index, report.confirmation.overall);
  renderResearchTopics(report.bigFive, report.anchoring, report.confirmation);

  const sampleNote = byId("sample-note");
  if (sampleData.length < 30) {
    sampleNote.textContent = `Relative to current sample (N=${sampleData.length}). Percentiles unavailable until N >= 30.`;
  } else {
    sampleNote.textContent = `Relative to current sample (N=${sampleData.length}). Percentiles shown as P values.`;
  }

  const analysisReady = sampleData.length >= 1;
  if (analysisReady) {
    const analysisBtn = byId("open-analysis");
    analysisBtn.classList.remove("hidden");
    analysisBtn.addEventListener("click", () => {
      window.location.href = encodeURI("Overall Correlation Analysis in Pariticipants.html");
    });
  }

  byId("download-pdf").addEventListener("click", downloadPdf);
  byId("export-json").addEventListener("click", () => {
    const stamp = report.timestamp.replace(/[:.]/g, "-");
    const filename = `report-${stamp}.json`;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  byId("back-to-survey").addEventListener("click", () => {
    window.location.href = "index.html";
  });
};

init();









