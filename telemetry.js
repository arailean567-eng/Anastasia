/**
 * UI Telemetry Engine & Performance Monitor
 * Autor: Railean Anastasia | Expert RC 251
 * Data: 18.05.2026 | No-Dependency GDPR Beacon
 */

(function() {
    'use strict';

    // Inițializarea obiectului de telemetrie conform normelor GDPR (fără PII)
    const telemetryData = {
        appId: typeof __app_id !== 'undefined' ? __app_id : 'RC251-UTM-PORTFOLIO',
        timestamp: new Date().toISOString(),
        environment: {
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            devicePixelRatio: window.devicePixelRatio,
            hardwareConcurrency: navigator.hardwareConcurrency || 'N/A', // Cores CPU
            deviceMemory: navigator.deviceMemory || 'N/A', // Memorie RAM în GB
            networkType: navigator.connection ? navigator.connection.effectiveType : 'unknown'
        },
        performanceMetrics: {},
        errors: [], // Sarcina: Dynamic Error Tracking
        interactionMetrics: {} // Sarcina: FID Estimation
    };

    const endpoint = "https://analytics.rc251.utm.md/api/telemetry"; // URL-ul simulat al serverului UTM

    // 1. DYNAMIC ERROR TRACKING (Capturarea erorilor globale din consola)
    window.onerror = function(message, source, lineno, colno, error) {
        telemetryData.errors.push({
            message: message,
            file: source,
            line: lineno,
            column: colno,
            timestamp: new Date().toISOString()
        });

        // Trimitem un beacon instantaneu când apare o eroare critică de execuție
        dispatchTelemetry();
        return false; // Permite erorii să apară în continuare în consolă pentru debug
    };

    // 2. CORE WEB VITALS FID ESTIMATION (Timpul de răspuns la prima interacțiune)
    function estimateFID() {
        const startTime = performance.now();
        
        // Handler executat la primul click al utilizatorului
        window.addEventListener('click', function onFirstClick(event) {
            const delay = performance.now() - startTime;
            telemetryData.interactionMetrics.firstInputDelayEstimate = delay.toFixed(2) + "ms";
            
            // Eliminăm listener-ul pentru a nu rula la click-uri ulterioare
            window.removeEventListener('click', onFirstClick);
            
            // Trimitem telemetria actualizată cu metrica FID inclusă
            dispatchTelemetry();
        }, { once: true });
    }

    // Funcția de colectare a metricilor din API-ul Performance al browserului
    function collectPerformanceMetrics() {
        if (!window.performance || !window.performance.getEntriesByType) return;

        // Metricile de Navigație (Timp de încărcare DOM, TTFB etc.)
        const navEntries = window.performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
            const timing = navEntries[0];
            telemetryData.performanceMetrics.dnsTime = timing.domainLookupEnd - timing.domainLookupStart;
            telemetryData.performanceMetrics.tcpHandshake = timing.connectEnd - timing.connectStart;
            telemetryData.performanceMetrics.ttfb = timing.responseStart - timing.requestStart; // Time to First Byte
            telemetryData.performanceMetrics.domInteractive = timing.domInteractive;
            telemetryData.performanceMetrics.loadEvent = timing.loadEventEnd - timing.loadEventStart;
        }

        // Metricile de Randare (First Paint, First Contentful Paint)
        const paintEntries = window.performance.getEntriesByType('paint');
        paintEntries.forEach((entry) => {
            if (entry.name === 'first-paint') {
                telemetryData.performanceMetrics.firstPaint = entry.startTime;
            } else if (entry.name === 'first-contentful-paint') {
                telemetryData.performanceMetrics.firstContentfulPaint = entry.startTime;
            }
        });

        dispatchTelemetry();
    }

    // Trimiterea datelor folosind navigator.sendBeacon
    function dispatchTelemetry() {
        const payload = JSON.stringify(telemetryData);

        console.log("%c[TELEMETRIE ACTIVE] Structură JSON trimisă de Railean Anastasia:", "color: #00f2ff; font-weight: bold;", telemetryData);

        // Verificăm suportul pentru sendBeacon în browser pentru execuție non-blocantă
        if (navigator.sendBeacon) {
            navigator.sendBeacon(endpoint, payload);
        } else {
            // Fallback în cazul în care sendBeacon nu este suportat (browsere legacy)
            const xhr = new XMLHttpRequest();
            xhr.open("POST", endpoint, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(payload);
        }
    }

    // 3. LIGHTHOUSE OPTIMIZATION CYCLE (Folosirea requestIdleCallback sau setTimeout)
    // Amânăm execuția monitorizării până când browserul termină procesele grele (Main Thread Free)
    window.addEventListener('load', function() {
        estimateFID();
        
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(function() {
                setTimeout(collectPerformanceMetrics, 500);
            });
        } else {
            // Fallback pentru browserele care nu suportă requestIdleCallback
            window.addEventListener('DOMContentLoaded', () => {
                setTimeout(collectPerformanceMetrics, 500);
            });
        }
    });

})();