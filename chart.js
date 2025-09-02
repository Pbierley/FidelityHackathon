const chartInstances = {}; // Global storage

function showChart(ticker, tradingData) {
  if (!tradingData) {
    return;
  }
  const canvas = document.getElementById(`${ticker}-chart`);
  if (!canvas) {
    console.warn(`Canvas element not found for ticker: ${ticker}`);
    return;
  }

  const ctx = canvas.getContext("2d");

  // If chart already exists, destroy it first
  if (chartInstances[ticker]) {
    chartInstances[ticker].destroy();
  }

  // Prepare data
  const entries = Object.entries(tradingData).sort(
    ([dateA], [dateB]) => new Date(dateA) - new Date(dateB)
  );

  const labels = entries.map(([date]) => date);
  const closePrices = entries.map(([_, data]) => parseFloat(data["4. close"]));

  // Create a new chart instance
  chartInstances[ticker] = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: `${ticker} Closing Price`,
          data: closePrices,
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderWidth: 2,
          tension: 0.2,
          fill: true,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Date",
          },
        },
        y: {
          title: {
            display: true,
            text: "Price (USD)",
          },
          beginAtZero: false,
        },
      },
    },
  });
}
