const priceElement = document.getElementById("price");
const select = document.getElementById("cryptoSelect");
const ctx = document.getElementById('priceChart').getContext('2d');

let currentCoin = select.value;
let intervalId = null;
let priceHistory = [];
let lastPrice = null;

// Fetch the price of the selected coin
async function fetchPrice(coin) {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const price = data[coin].usd;

    updatePrice(price);
    updateChart(price);
    checkPriceChange(price);
  } catch (error) {
    priceElement.textContent = "Error fetching price";
    console.error("Error:", error);
  }
}

// Update price on the page
function updatePrice(price) {
  priceElement.textContent = `$${price.toLocaleString()}`;
  lastPrice = price;
}

// Update chart with new price data
function updateChart(price) {
  priceHistory.push(price);
  if (priceHistory.length > 30) priceHistory.shift(); // Keep the latest 30 prices

  priceChart.data.labels = priceHistory.map((_, i) => i + 1);
  priceChart.data.datasets[0].data = priceHistory;
  priceChart.update();
}

// Initialize the chart
const priceChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Price in USD',
      data: [],
      borderColor: 'rgba(0, 255, 204, 1)',
      fill: false,
      tension: 0.1
    }]
  },
  options: {
    responsive: true,
    scales: {
      x: { 
        ticks: { display: false } 
      },
      y: {
        beginAtZero: false,
        ticks: { 
          callback: function(value) {
            return `$${value}`;
          }
        }
      }
    }
  }
});

// Check if the price has changed significantly for an alert
function checkPriceChange(price) {
  if (lastPrice === null) return;

  const change = price - lastPrice;
  if (Math.abs(change) > 50) { // Alert for large price changes (threshold: 50 USD)
    const message = change > 0 ? 'Price Increased!' : 'Price Decreased!';
    displayPriceAlert(message, change);
  }
}

// Display alert notification for price change
function displayPriceAlert(message, change) {
  if (Notification.permission === 'granted') {
    new Notification(`Crypto Price Alert: ${message}`, {
      body: `The price changed by $${Math.abs(change).toLocaleString()}.`
    });
  }
}

// Request notification permission if not already granted
if (Notification.permission !== 'granted') {
  Notification.requestPermission();
}

// Start the interval to update price every 5 seconds
function startTracking(coin) {
  // Clear previous interval if any
  if (intervalId) clearInterval(intervalId);

  // Fetch immediately
  fetchPrice(coin);

  // Set new interval
  intervalId = setInterval(() => fetchPrice(coin), 5000);
}

// When user selects a new coin
select.addEventListener("change", () => {
  currentCoin = select.value;
  startTracking(currentCoin);
});

// Initial fetch
startTracking(currentCoin);
