const form = document.getElementById('channel-form');
const statusText = document.getElementById('status');
const avgEngagement = document.getElementById('avg-engagement');
const totalVideos = document.getElementById('total-videos');
const bestHoursList = document.getElementById('best-hours');
const videoTableBody = document.getElementById('video-table-body');
const titleTableBody = document.getElementById('title-table-body');

let hourChart;

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function renderBestHours(bestHours) {
  bestHoursList.innerHTML = '';

  if (!bestHours.length) {
    bestHoursList.innerHTML = '<li>No data yet</li>';
    return;
  }

  bestHours.forEach((entry, index) => {
    const li = document.createElement('li');
    li.textContent = `#${index + 1}: ${entry.hour}:00 (${formatNumber(entry.averageViews)} avg views)`;
    bestHoursList.appendChild(li);
  });
}

function renderVideoTable(videos) {
  videoTableBody.innerHTML = '';

  videos.forEach((video) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${video.title}</td>
      <td>${formatNumber(video.views)}</td>
      <td>${formatNumber(video.likes)}</td>
      <td>${formatNumber(video.comments)}</td>
      <td>${new Date(video.publishDate).toLocaleDateString()}</td>
      <td>${video.hourPosted}:00</td>
    `;
    videoTableBody.appendChild(tr);
  });
}

function renderTitleTable(videos) {
  titleTableBody.innerHTML = '';

  videos.forEach((video) => {
    const analysis = video.titleAnalysis;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${analysis.title}</td>
      <td>${analysis.length}</td>
      <td>${analysis.hasNumber ? 'Yes' : 'No'}</td>
      <td>${analysis.hasQuestionMark ? 'Yes' : 'No'}</td>
      <td>${analysis.hasEmotionalWord ? 'Yes' : 'No'}</td>
      <td>${analysis.score}/100</td>
    `;
    titleTableBody.appendChild(tr);
  });
}

function renderHourChart(hourlyData) {
  const labels = hourlyData.map((item) => `${item.hour}:00`);
  const values = hourlyData.map((item) => item.averageViews);

  const ctx = document.getElementById('hour-chart').getContext('2d');

  if (hourChart) {
    hourChart.destroy();
  }

  hourChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Average Views',
          data: values,
          backgroundColor: '#5b9dff'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: '#e6edf3'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#9aa4b2'
          },
          grid: {
            color: '#2a3244'
          }
        },
        y: {
          ticks: {
            color: '#9aa4b2'
          },
          grid: {
            color: '#2a3244'
          }
        }
      }
    }
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const channelId = document.getElementById('channel-id').value.trim();

  if (!channelId) {
    return;
  }

  statusText.textContent = 'Analyzing channel...';

  try {
    const response = await fetch('/api/analyze-channel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Failed to analyze channel.');
    }

    avgEngagement.textContent = `${payload.averageEngagement}%`;
    totalVideos.textContent = payload.videos.length;

    renderBestHours(payload.bestHours);
    renderVideoTable(payload.videos);
    renderTitleTable(payload.videos);
    renderHourChart(payload.hourlyPerformance);

    statusText.textContent = 'Analysis complete.';
  } catch (error) {
    statusText.textContent = error.message;
  }
});
