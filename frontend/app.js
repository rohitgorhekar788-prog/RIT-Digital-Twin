/**
 * app.js — Main application controller
 * Orchestrates:
 * - Boot sequence
 * - Live Open-Meteo forecast
 * - KPI cards
 * - Charts
 * - Alerts
 * - Historical timeline
 * - City switching
 * - Event handlers
 */

// ══════════════════════════════════════════
// BOOT SEQUENCE
// ══════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {
  bootSequence();
});

async function bootSequence() {
  const steps = ["ls-1", "ls-2", "ls-3", "ls-4", "ls-5"];
  const overlay = document.getElementById("loading-overlay");

  try {
    // -----------------------------------------
    // Loading animation
    // -----------------------------------------
    for (let i = 0; i < steps.length; i++) {
      await delay(250);

      document
        .getElementById(steps[i])
        ?.classList.add("active");

      if (i > 0) {
        document
          .getElementById(steps[i - 1])
          ?.classList.add("done");
      }
    }

    await delay(300);

    // -----------------------------------------
    // Load real model JSON artifacts
    // -----------------------------------------
    if (typeof loadRealModelData === "function") {
      try {
        await loadRealModelData();
      } catch (e) {
        console.warn(
          "loadRealModelData error:",
          e
        );
      }
    }

    // -----------------------------------------
    // Initialize map
    // -----------------------------------------
    if (typeof initMap === "function") {
      try {
        initMap();
      } catch (e) {
        console.warn("initMap error:", e);
      }
    }

    // -----------------------------------------
    // Initialize charts
    // -----------------------------------------
    if (typeof initAllCharts === "function") {
      try {
        initAllCharts();
      } catch (e) {
        console.warn("initAllCharts error:", e);
      }
    }

    // -----------------------------------------
    // Initialize timeline
    // -----------------------------------------
    if (typeof initTimeline === "function") {
      try {
        initTimeline();
      } catch (e) {
        console.warn("initTimeline error:", e);
      }
    }

    // -----------------------------------------
    // Initialize event handlers
    // -----------------------------------------
    if (typeof initEventHandlers === "function") {
      try {
        initEventHandlers();
      } catch (e) {
        console.warn(
          "initEventHandlers error:",
          e
        );
      }
    }

    // -----------------------------------------
    // Navigation
    // -----------------------------------------
    if (typeof initNavigation === "function") {
      try {
        initNavigation();
      } catch (e) {
        console.warn(
          "initNavigation error:",
          e
        );
      }
    }

    // -----------------------------------------
    // Current selected city
    // -----------------------------------------
    const regionSelect =
      document.getElementById("region-select");

    const liveCity =
      regionSelect?.value || "palghar";

    console.log(
      "RIT LIVE CITY:",
      liveCity
    );

    // -----------------------------------------
    // IMPORTANT:
    // Load LIVE forecast BEFORE populating KPI
    // -----------------------------------------
    if (typeof loadForecastData === "function") {
      try {
        await loadForecastData(liveCity);

        console.log(
          "RIT LIVE FORECAST LOADED:",
          liveCity,
          activeForecastData
        );

      } catch (e) {
        console.warn(
          "Live forecast loading error:",
          e
        );
      }
    }

    // -----------------------------------------
    // Populate dashboard KPI using LIVE data
    // -----------------------------------------
    if (typeof populateKPIs === "function") {
      try {
        populateKPIs(liveCity);
      } catch (e) {
        console.warn(
          "populateKPIs error:",
          e
        );
      }
    }

    // -----------------------------------------
    // Update dashboard comparison
    // -----------------------------------------
    if (
      typeof updateDashboardComparison ===
      "function"
    ) {
      try {
        updateDashboardComparison(liveCity);
      } catch (e) {
        console.warn(
          "updateDashboardComparison error:",
          e
        );
      }
    }

    // -----------------------------------------
    // Update charts using LIVE forecast
    // -----------------------------------------
    if (
      typeof updateChartsForRegion ===
      "function"
    ) {
      try {
        updateChartsForRegion(liveCity);
      } catch (e) {
        console.warn(
          "updateChartsForRegion error:",
          e
        );
      }
    }

    // -----------------------------------------
    // Dashboard comparison rendering
    // -----------------------------------------
    if (
      typeof renderDashboardComparison ===
      "function"
    ) {
      try {
        renderDashboardComparison();
      } catch (e) {
        console.warn(
          "renderDashboardComparison error:",
          e
        );
      }
    }

    // -----------------------------------------
    // Navigation date
    // -----------------------------------------
    if (typeof updateNavDate === "function") {
      try {
        updateNavDate();
      } catch (e) {}
    }

    // -----------------------------------------
    // Live time indicator
    // -----------------------------------------
    if (typeof updateLiveTime === "function") {
      try {
        updateLiveTime();
      } catch (e) {}
    }

    // -----------------------------------------
    // Loading complete
    // -----------------------------------------
    document
      .getElementById(steps[steps.length - 1])
      ?.classList.add("done");

    await delay(200);

  } catch (err) {

    console.error(
      "Boot sequence error:",
      err
    );

  } finally {

    if (overlay) {
      overlay.classList.add("hidden");

      setTimeout(() => {
        overlay.style.display = "none";
      }, 500);
    }

    if (
      typeof lucide !== "undefined" &&
      lucide.createIcons
    ) {
      try {
        lucide.createIcons();
      } catch (e) {}
    }
  }
}

const delay = ms =>
  new Promise(resolve => setTimeout(resolve, ms));


// ══════════════════════════════════════════
// KPI CARDS
// ══════════════════════════════════════════

function populateKPIs(cityKey) {

  // -----------------------------------------
  // Existing model/static fallback
  // -----------------------------------------

  const values =
    typeof getCityModelValues === "function"

      ? getCityModelValues(cityKey)

      : (() => {

          const off = cityKey
            ? (
                CITY_FORECAST_DATA[
                  cityKey
                ]?.offsets || {
                  max: 0,
                  min: 0,
                  rain: 0,
                  hum: 0
                }
              )

            : {
                max: 0,
                min: 0,
                rain: 0,
                hum: 0
              };

          const s =
            CLIMATE_DATA
              .all_india_summary;

          return {

            maxTemp:
              +(
                s.max_temp +
                off.max
              ).toFixed(1),

            minTemp:
              +(
                s.min_temp +
                (off.min || 0)
              ).toFixed(1),

            rainfall:
              Math.max(
                0,
                +(
                  s.rainfall_24h +
                  off.rain
                ).toFixed(1)
              ),

            humidity:
              Math.max(
                0,
                Math.min(
                  100,
                  s.humidity +
                  (off.hum || 0)
                )
              )
          };
        })();


  // -----------------------------------------
  // LIVE Open-Meteo data
  // -----------------------------------------

  const liveToday =
    Array.isArray(
      typeof activeForecastData !==
      "undefined"
        ? activeForecastData
        : null
    ) &&
    activeForecastData.length > 0
      ? activeForecastData[0]
      : null;


  // -----------------------------------------
  // LIVE DATA AVAILABLE
  // -----------------------------------------

  if (liveToday) {

    const maxTemp =
      Number(liveToday.max_temp);

    const minTemp =
      Number(liveToday.min_temp);

    const rainfall =
      Number(liveToday.rainfall);

    const humidity =
      Number(liveToday.humidity);


    animateKPI(
      "kpi-max-val",
      Number.isFinite(maxTemp)
        ? maxTemp
        : values.maxTemp,
      "°C",
      50,
      false
    );


    animateKPI(
      "kpi-min-val",
      Number.isFinite(minTemp)
        ? minTemp
        : values.minTemp,
      "°C",
      50,
      false
    );


    animateKPI(
      "kpi-rain-val",
      Number.isFinite(rainfall)
        ? rainfall
        : values.rainfall,
      "mm",
      50,
      false
    );


    animateKPI(
      "kpi-hum-val",
      Number.isFinite(humidity)
        ? humidity
        : values.humidity,
      "%",
      50,
      false
    );


    // -----------------------------------------
    // LIVE source labels
    // -----------------------------------------

    setText(
      "kpi-max-meta",
      "Live Open-Meteo Forecast"
    );

    setText(
      "kpi-min-meta",
      "Live Open-Meteo Forecast"
    );

    setText(
      "kpi-rain-meta",
      "Live Open-Meteo Forecast"
    );

    setText(
      "kpi-hum-meta",
      "Live Open-Meteo Forecast"
    );


  } else {

    // -----------------------------------------
    // FALLBACK MODEL DATA
    // -----------------------------------------

    animateKPI(
      "kpi-max-val",
      values.maxTemp,
      "°C",
      50,
      false
    );

    animateKPI(
      "kpi-min-val",
      values.minTemp,
      "°C",
      50,
      false
    );

    animateKPI(
      "kpi-rain-val",
      values.rainfall,
      "mm",
      50,
      false
    );

    animateKPI(
      "kpi-hum-val",
      values.humidity,
      "%",
      50,
      false
    );


    setText(
      "kpi-max-meta",
      "LightGBM · Model"
    );

    setText(
      "kpi-min-meta",
      "LightGBM · Model"
    );

    setText(
      "kpi-rain-meta",
      "XGBoost 2-Stage forecast"
    );

    setText(
      "kpi-hum-meta",
      "Derived from Td/T ratio"
    );
  }


  // -----------------------------------------
  // Trend indicators
  // -----------------------------------------

  setTrend(
    "kpi-max-trend",
    +1.2,
    "°C"
  );

  setTrend(
    "kpi-min-trend",
    +0.6,
    "°C"
  );

  setTrend(
    "kpi-rain-trend",
    -4.3,
    "mm"
  );

  setTrend(
    "kpi-hum-trend",
    -2,
    "%"
  );
}


// ══════════════════════════════════════════
// KPI ANIMATION
// ══════════════════════════════════════════

function animateKPI(
  id,
  target,
  unit,
  durationMs,
  isPercent
) {

  const el =
    document.getElementById(id);

  if (!el) return;

  el.classList.remove(
    "skeleton-shimmer"
  );

  const start =
    performance.now();

  const startVal = 0;


  function tick(now) {

    const elapsed =
      now - start;

    const progress =
      Math.min(
        elapsed /
          (durationMs * 8),
        1
      );

    const ease =
      1 -
      Math.pow(
        1 - progress,
        3
      );

    const val =
      startVal +
      (target - startVal) *
      ease;


    el.textContent =
      val.toFixed(
        target % 1 === 0
          ? 0
          : 1
      ) + unit;


    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }


  requestAnimationFrame(tick);
}


// ══════════════════════════════════════════
// TREND
// ══════════════════════════════════════════

function setTrend(
  id,
  delta,
  unit
) {

  const el =
    document.getElementById(id);

  if (!el) return;


  const positive =
    delta > 0;


  el.className =
    "kpi-trend " +
    (
      positive
        ? "up"
        : "down"
    );


  el.textContent =
    (
      positive
        ? "▲ +"
        : "▼ "
    ) +
    delta.toFixed(1) +
    unit +
    " vs yesterday";
}


// ══════════════════════════════════════════
// TIMELINE SCRUBBER
// ══════════════════════════════════════════

function initTimeline() {

  const slider =
    document.getElementById(
      "timeline-slider"
    );

  if (!slider) return;


  const today =
    new Date();

  const forecastInput =
    document.getElementById(
      "forecast-date"
    );

  if (forecastInput) {
    forecastInput.valueAsDate =
      today;
  }


  slider.addEventListener(
    "input",
    () => {

      const year =
        parseInt(
          slider.value
        );

      setText(
        "timeline-year",
        year
      );

      updateTimelineStats(
        year
      );
    }
  );


  updateTimelineStats(
    2024
  );
}


// ══════════════════════════════════════════
// HISTORICAL TIMELINE
// ══════════════════════════════════════════

function updateTimelineStats(
  year
) {

  const stats =
    HISTORICAL_STATS[year] ||
    HISTORICAL_STATS[2024];

  const container =
    document.getElementById(
      "timeline-stats"
    );

  if (!container) return;


  container.innerHTML = `

    <div class="timeline-stat">

      <div class="ts-label">
        AVG MAX TEMP
      </div>

      <div class="ts-value">
        ${stats.avg_max_temp}
      </div>

      <div class="ts-unit">
        °C
      </div>

    </div>


    <div class="timeline-stat">

      <div class="ts-label">
        ANNUAL RAINFALL
      </div>

      <div class="ts-value">
        ${stats.avg_rainfall}
      </div>

      <div class="ts-unit">
        mm
      </div>

    </div>


    <div class="timeline-stat">

      <div class="ts-label">
        MONSOON ONSET
      </div>

      <div
        class="ts-value"
        style="font-size:14px"
      >
        ${stats.monsoon_onset}
      </div>

      <div class="ts-unit">
        Kerala landfall
      </div>

    </div>


    <div class="timeline-stat">

      <div class="ts-label">
        EXTREME EVENTS
      </div>

      <div
        class="ts-value"
        style="color:${
          stats.extreme_events > 25
            ? "#ef4444"
            : stats.extreme_events > 15
              ? "#f59e0b"
              : "#10b981"
        }"
      >
        ${stats.extreme_events}
      </div>

      <div class="ts-unit">
        recorded that year
      </div>

    </div>


    <div class="timeline-stat">

      <div class="ts-label">
        TREND VS 1951
      </div>

      <div
        class="ts-value"
        style="
          color:#ff6b6b;
          font-size:16px
        "
      >
        +${
          Math.max(
            0,
            +(
              stats.avg_max_temp -
              30.1
            ).toFixed(1)
          )
        }°C
      </div>

      <div class="ts-unit">
        warming signal
      </div>

    </div>

  `;
}


// ══════════════════════════════════════════
// EVENT HANDLERS
// ══════════════════════════════════════════

function initEventHandlers() {

  // -----------------------------------------
  // Master city / region select
  // -----------------------------------------

  const regionSelect =
    document.getElementById(
      "region-select"
    );


  regionSelect?.addEventListener(
    "change",
    async e => {

      const key =
        e.target.value;


      console.log(
        "RIT CITY CHANGED:",
        key
      );


      // ---------------------------------------
      // Move map
      // ---------------------------------------

      if (
        typeof flyToRegion ===
        "function"
      ) {

        try {
          flyToRegion(key);
        } catch (err) {
          console.warn(
            "flyToRegion error:",
            err
          );
        }
      }


      // ---------------------------------------
      // Sync other dropdowns
      // ---------------------------------------

      [
        "dashboard-city-select",
        "forecast-city-select",
        "whatif-city-select",
        "report-city-select",
        "prediction-city-select"
      ].forEach(id => {

        const el =
          document.getElementById(id);

        if (
          el &&
          el.value !== key
        ) {
          el.value = key;
        }
      });


      // ---------------------------------------
      // LIVE API
      // ---------------------------------------

      try {

        if (
          typeof loadForecastData ===
          "function"
        ) {

          await loadForecastData(
            key
          );
        }


        // -------------------------------------
        // Update KPI
        // -------------------------------------

        if (
          typeof populateKPIs ===
          "function"
        ) {

          populateKPIs(
            key
          );
        }


        // -------------------------------------
        // Update comparison cards
        // -------------------------------------

        if (
          typeof updateDashboardComparison ===
          "function"
        ) {

          updateDashboardComparison(
            key
          );
        }


        // -------------------------------------
        // Update charts
        // -------------------------------------

        if (
          typeof updateChartsForRegion ===
          "function"
        ) {

          updateChartsForRegion(
            key
          );
        }


        console.log(
          "RIT LIVE DATA UPDATED:",
          key,
          activeForecastData
        );


      } catch (err) {

        console.warn(
          "Live city forecast update error:",
          err
        );


        // Existing fallback
        if (
          typeof updateKPIsForRegion ===
          "function"
        ) {

          updateKPIsForRegion(
            key
          );
        }
      }
    }
  );


  // -----------------------------------------
  // Layer buttons
  // -----------------------------------------

  document
    .querySelectorAll(
      ".layer-btn"
    )
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          if (
            typeof switchLayer ===
            "function"
          ) {

            switchLayer(
              btn.dataset.layer
            );
          }
        }
      );
    });


  // -----------------------------------------
  // Refresh button
  // -----------------------------------------

  document
    .getElementById(
      "btn-refresh"
    )
    ?.addEventListener(
      "click",
      refreshLiveDashboard
    );


  // -----------------------------------------
  // Forecast date
  // -----------------------------------------

  document
    .getElementById(
      "forecast-date"
    )
    ?.addEventListener(
      "change",
      e => {

        updateForecastForDate(
          e.target.value
        );
      }
    );


  // -----------------------------------------
  // Alert bell
  // -----------------------------------------

  document
    .getElementById(
      "btn-alert-toggle"
    )
    ?.addEventListener(
      "click",
      () => {

        if (
          typeof showPage ===
          "function"
        ) {

          showPage(
            "alerts"
          );
        }
      }
    );
}


// ══════════════════════════════════════════
// UPDATE KPIs FOR REGION
// ══════════════════════════════════════════

function updateKPIsForRegion(
  regionKey
) {

  populateKPIs(
    regionKey
  );


  if (
    typeof updateDashboardComparison ===
    "function"
  ) {

    updateDashboardComparison(
      regionKey
    );
  }


  // Ambient weather fallback

  const values =
    typeof getCityModelValues ===
    "function"

      ? getCityModelValues(
          regionKey
        )

      : (() => {

          const off =
            regionKey
              ? (
                  CITY_FORECAST_DATA[
                    regionKey
                  ]?.offsets || {
                    max: 0,
                    min: 0,
                    rain: 0,
                    hum: 0
                  }
                )

              : {
                  max: 0,
                  min: 0,
                  rain: 0,
                  hum: 0
                };

          const s =
            CLIMATE_DATA
              .all_india_summary;

          return {

            maxTemp:
              +(
                s.max_temp +
                off.max
              ).toFixed(1),

            minTemp:
              +(
                s.min_temp +
                (off.min || 0)
              ).toFixed(1),

            rainfall:
              Math.max(
                0,
                +(
                  s.rainfall_24h +
                  off.rain
                ).toFixed(1)
              )
          };

        })();


  if (
    typeof updateAmbientWeatherState ===
    "function"
  ) {

    updateAmbientWeatherState(
      values.maxTemp,
      values.minTemp,
      values.rainfall
    );
  }
}


// ══════════════════════════════════════════
// FORECAST DATE UPDATE
// ══════════════════════════════════════════

function updateForecastForDate(
  dateStr
) {

  // -----------------------------------------
  // If live forecast exists, use it
  // -----------------------------------------

  if (
    Array.isArray(
      typeof activeForecastData !==
      "undefined"
        ? activeForecastData
        : null
    )
  ) {

    const match =
      activeForecastData.find(
        item =>
          item.dateISO ===
          dateStr
      );


    if (match) {

      animateKPI(
        "kpi-max-val",
        Number(match.max_temp),
        "°C",
        50,
        false
      );

      animateKPI(
        "kpi-min-val",
        Number(match.min_temp),
        "°C",
        50,
        false
      );

      animateKPI(
        "kpi-rain-val",
        Number(match.rainfall),
        "mm",
        50,
        false
      );

      animateKPI(
        "kpi-hum-val",
        Number(match.humidity),
        "%",
        50,
        false
      );

      return;
    }
  }


  // -----------------------------------------
  // Existing fallback
  // -----------------------------------------

  const d =
    new Date(dateStr);

  const month =
    d.getMonth();

  const monsoon =
    month >= 5 &&
    month <= 8;

  const s =
    CLIMATE_DATA
      .all_india_summary;

  const randJitter =
    () =>
      (Math.random() - 0.5) *
      3;


  animateKPI(
    "kpi-max-val",
    +(
      s.max_temp +
      (monsoon ? -3 : 2) +
      randJitter()
    ).toFixed(1),
    "°C",
    50,
    false
  );


  animateKPI(
    "kpi-rain-val",
    Math.max(
      0,
      +(
        s.rainfall_24h *
        (monsoon ? 2.5 : 0.3) +
        randJitter()
      ).toFixed(1)
    ),
    "mm",
    50,
    false
  );
}


// ══════════════════════════════════════════
// LIVE REFRESH
// ══════════════════════════════════════════

async function refreshLiveDashboard() {

  const btn =
    document.getElementById(
      "btn-refresh"
    );

  if (btn) {

    btn.style.transform =
      "rotate(360deg)";

    btn.style.transition =
      "transform 0.6s ease";
  }


  try {

    const regionSelect =
      document.getElementById(
        "region-select"
      );

    const cityKey =
      regionSelect?.value ||
      forecastCityKey ||
      "palghar";


    // ---------------------------------------
    // Fetch latest API data
    // ---------------------------------------

    if (
      typeof loadForecastData ===
      "function"
    ) {

      await loadForecastData(
        cityKey
      );
    }


    // ---------------------------------------
    // Update everything
    // ---------------------------------------

    populateKPIs(
      cityKey
    );


    if (
      typeof updateDashboardComparison ===
      "function"
    ) {

      updateDashboardComparison(
        cityKey
      );
    }


    if (
      typeof updateChartsForRegion ===
      "function"
    ) {

      updateChartsForRegion(
        cityKey
      );
    }


    setText(
      "last-updated",
      "just now"
    );


    console.log(
      "RIT LIVE REFRESH COMPLETE:",
      activeForecastData
    );


  } catch (err) {

    console.error(
      "Live refresh error:",
      err
    );

  } finally {

    if (btn) {

      setTimeout(() => {

        btn.style.transform =
          "";

        btn.style.transition =
          "";

      }, 650);
    }
  }
}


// Keep old function name available
function simulateDataRefresh() {
  refreshLiveDashboard();
}


// ══════════════════════════════════════════
// UTILITY
// ══════════════════════════════════════════

function setText(
  id,
  text
) {

  const el =
    document.getElementById(id);

  if (el) {
    el.textContent =
      text;
  }
}


// ══════════════════════════════════════════
// NAVIGATION DATE
// ══════════════════════════════════════════

function updateNavDate() {

  const el =
    document.getElementById(
      "nav-date"
    );

  if (!el) return;


  const now =
    new Date();


  el.textContent =
    now.toLocaleDateString(
      "en-IN",
      {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
      }
    ) +
    " · IST";
}


// ══════════════════════════════════════════
// LIVE TIME
// ══════════════════════════════════════════

function updateLiveTime() {

  setInterval(
    () => {

      const now =
        new Date();

      const minAgo =
        now.getMinutes() % 5;


      setText(
        "last-updated",
        minAgo === 0
          ? "just now"
          : `${minAgo}m ago`
      );

    },
    60_000
  );
}