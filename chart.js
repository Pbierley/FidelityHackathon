const chartInstances = {}; // Global storage

//  From Chart JS core repo ---->
//  This uses the Chart.js financial plugin to draw candlestick charts.

//  Data format required by the candlestick controller:
//    Each data point must be an object with:
//      {
//        x: <timestamp in ms OR Date object>,  // horizontal axis (time)
//        o: <number>,                          // open price
//        h: <number>,                          // high price
//        l: <number>,                          // low price
//        c: <number>                           // close price
//      }
//  Example:
//    { x: 1713139200000, o: 161.57, h: 162.05, l: 157.64, c: 158.68 }

function showChart(ticker, tradingData) {
  if (!tradingData) return;

  const canvas = document.getElementById(`${ticker}-chart`);
  if (!canvas) {
    console.warn(`Canvas element not found for ticker: ${ticker}`);
    return;
  }

  const ctx = canvas.getContext("2d");

  // Destroy any existing chart for this ticker
  if (chartInstances[ticker]) {
    chartInstances[ticker].destroy();
  }

  // Expect:
  // { 'YYYY-MM-DD': { '1. open': '...', '2. high':'...', '3. low':'...', '4. close':'...' }, ... }
  const entries = Object.entries(tradingData)
    .filter(([k]) => /^\d{4}-\d{2}-\d{2}$/.test(k))
    .sort(([a],[b]) => new Date(a) - new Date(b));

  const candles = entries.map(([date, d]) => ({
    x: new Date(date).getTime(),                    // <-- numeric timestamp (ms)
    o: parseFloat(d['1. open']),
    h: parseFloat(d['2. high']),
    l: parseFloat(d['3. low']),
    c: parseFloat(d['4. close']),
  }));

  //  just some quick guardrails/logging ya heard
  if (!candles.length) {
    console.warn(`[candles] No rows for ${ticker}`, tradingData);
    return;
  }
  if (candles.some(b => [b.x,b.o,b.h,b.l,b.c].some(v => Number.isNaN(v)))) {
    console.error('[candles] NaN in OHLC data:', candles.slice(0,3));
    return;
  }
  console.log(`[candles] ${ticker}: ${candles.length} bars`, candles[0], candles[candles.length-1]);

  chartInstances[ticker] = new Chart(ctx, {
    type: "candlestick",
    data: {
      datasets: [{
        label: `${ticker} Candles`,
        data: candles,
        color:       { up: "#26a69a", down: "#ef5350", unchanged: "#999999" },
        borderColor: { up: "#26a69a", down: "#ef5350", unchanged: "#999999" },
        wickColor:   { up: "#26a69a", down: "#ef5350", unchanged: "#999999" },
        borderWidth: 1,
      }],
    },
    options: {
      parsing: false,        // might not need this idk
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { mode: "index", intersect: false },
      },
      scales: {
        x: {
          type: "time",
          time: { unit: "day" },
          title: { display: true, text: "Date" },
        },
        y: {
          beginAtZero: false,
          position: "right",
          title: { display: true, text: "Price (USD)" },
        },
      },
    },
  });
}
