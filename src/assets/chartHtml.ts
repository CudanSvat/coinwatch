export const CHART_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #0D0E12; }
    #chart { width: 100vw; height: 100vh; }
    #hud { position: fixed; top: 12px; left: 12px; pointer-events: none; z-index: 10; }
    #hud-price { color: #fff; font-size: 18px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, sans-serif; letter-spacing: -0.5px; }
    #hud-meta { display: flex; gap: 8px; align-items: center; margin-top: 3px; }
    #hud-change { font-size: 12px; font-weight: 600; font-family: -apple-system, sans-serif; padding: 2px 7px; border-radius: 20px; }
    #hud-time { color: #4A4E63; font-size: 11px; font-family: -apple-system, sans-serif; }
    #loading { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: #0D0E12; z-index: 20; }
    #loading-dot { width: 8px; height: 8px; border-radius: 50%; background: #6C63FF; animation: pulse 1s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
  </style>
</head>
<body>
  <div id="loading"><div id="loading-dot"></div></div>
  <div id="chart"></div>
  <div id="hud">
    <div id="hud-price"></div>
    <div id="hud-meta">
      <span id="hud-change"></span>
      <span id="hud-time"></span>
    </div>
  </div>
  <script src="https://unpkg.com/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js"></script>
  <script>
    var chart, candleSeries, volumeSeries;
    var lastCandles = [];

    function formatPrice(p) {
      if (!p && p !== 0) return '--';
      if (p < 0.000001) return '$' + p.toExponential(4);
      if (p < 0.0001) return '$' + p.toFixed(8);
      if (p < 0.01) return '$' + p.toFixed(6);
      if (p < 1) return '$' + p.toFixed(4);
      if (p < 1000) return '$' + p.toFixed(2);
      return '$' + p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatTime(t) {
      if (!t) return '';
      var d = new Date(t * 1000);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function updateHud(price, change, timeStr) {
      var el = document.getElementById('hud-price');
      var chEl = document.getElementById('hud-change');
      var tEl = document.getElementById('hud-time');
      if (el) el.textContent = formatPrice(price);
      if (chEl) {
        var pos = change >= 0;
        chEl.textContent = (pos ? '+' : '') + change.toFixed(2) + '%';
        chEl.style.color = pos ? '#00C875' : '#FF4757';
        chEl.style.background = pos ? '#00C87522' : '#FF475722';
      }
      if (tEl) tEl.textContent = timeStr || '';
    }

    function initChart() {
      chart = LightweightCharts.createChart(document.getElementById('chart'), {
        layout: {
          background: { type: 'solid', color: '#0D0E12' },
          textColor: '#4A4E63',
          fontSize: 11,
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        },
        grid: {
          vertLines: { color: '#16181F' },
          horzLines: { color: '#16181F' },
        },
        crosshair: {
          mode: 1,
          vertLine: { color: '#6C63FF55', labelBackgroundColor: '#6C63FF' },
          horzLine: { color: '#6C63FF55', labelBackgroundColor: '#6C63FF' },
        },
        rightPriceScale: {
          borderColor: '#2A2D3A',
          scaleMargins: { top: 0.08, bottom: 0.28 },
        },
        timeScale: {
          borderColor: '#2A2D3A',
          timeVisible: true,
          secondsVisible: false,
          fixLeftEdge: false,
          fixRightEdge: false,
        },
        handleScroll: true,
        handleScale: true,
      });

      candleSeries = chart.addCandlestickSeries({
        upColor: '#00C875',
        downColor: '#FF4757',
        borderUpColor: '#00C875',
        borderDownColor: '#FF4757',
        wickUpColor: '#00C875',
        wickDownColor: '#FF4757',
      });

      volumeSeries = chart.addHistogramSeries({
        color: '#6C63FF33',
        priceFormat: { type: 'volume' },
        priceScaleId: 'vol',
      });
      chart.priceScale('vol').applyOptions({
        scaleMargins: { top: 0.78, bottom: 0 },
      });

      chart.subscribeCrosshairMove(function(param) {
        if (!param.time || !param.seriesData) return;
        var c = param.seriesData.get(candleSeries);
        if (c && lastCandles.length > 0) {
          var first = lastCandles[0];
          var chg = first ? ((c.close - first.close) / first.close * 100) : 0;
          updateHud(c.close, chg, formatTime(param.time));
        }
      });

      window.addEventListener('resize', function() {
        if (chart) chart.applyOptions({ width: window.innerWidth, height: window.innerHeight });
      });
    }

    function setData(candles, volumes) {
      if (!chart) initChart();
      candleSeries.setData(candles);
      volumeSeries.setData(volumes);
      chart.timeScale().fitContent();
      lastCandles = candles;
      if (candles.length > 0) {
        var last = candles[candles.length - 1];
        var first = candles[0];
        var chg = first ? ((last.close - first.close) / first.close * 100) : 0;
        updateHud(last.close, chg, '');
      }
      var loader = document.getElementById('loading');
      if (loader) loader.style.display = 'none';
    }

    function onMessage(event) {
      try {
        var msg = JSON.parse(event.data);
        if (msg.type === 'setCandles') {
          var candles = msg.candles.map(function(c) {
            return { time: Math.floor(c.timestamp / 1000), open: c.open, high: c.high, low: c.low, close: c.close };
          });
          var volumes = msg.candles.map(function(c) {
            return { time: Math.floor(c.timestamp / 1000), value: c.volume, color: c.close >= c.open ? '#00C87533' : '#FF475733' };
          });
          setData(candles, volumes);
        }
      } catch(e) {}
    }

    window.addEventListener('message', onMessage);
    document.addEventListener('message', onMessage);

    // Init chart shell immediately so it's ready
    document.addEventListener('DOMContentLoaded', function() {
      if (typeof LightweightCharts !== 'undefined') initChart();
    });
  </script>
</body>
</html>`;
