document.addEventListener('DOMContentLoaded', () => {
    // Form elements
    const eventForm = document.getElementById('eventForm');
    const eventDateInput = document.getElementById('eventDate');
    const eventTypeSelect = document.getElementById('eventTypeSelect');
    const newEventTypeInput = document.getElementById('newEventTypeInput');
    const addNewEventTypeBtn = document.getElementById('addNewEventTypeBtn');
    const eventValueInput = document.getElementById('eventValue');
    const eventNotesInput = document.getElementById('eventNotes');

    // Table
    const recentEventsTableBody = document.getElementById('recentEventsTableBody');
    
    // Charts and related elements
    const eventsChartCanvas = document.getElementById('eventsChart');
    const chartEventTypeFilter = document.getElementById('chartEventTypeFilter');
    const dailyTotalsChartCanvas = document.getElementById('dailyTotalsChart');
    const dailyChartEventTypeFilter = document.getElementById('dailyChartEventTypeFilter');
    const maxValuesList = document.getElementById('maxValuesList'); // NUOVO: Elemento per la lista max values

    // Navbar buttons
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataInput = document.getElementById('importDataInput');
    const clearAllDataBtn = document.getElementById('clearAllDataBtn');

    // Local Storage Keys
    const EVENTS_LS_KEY = 'trackerEvents_v1';
    const EVENT_TYPES_LS_KEY = 'trackerEventTypes_v1';

    // Chart instances
    let eventsChart = null;
    let dailyTotalsChart = null;

    // --- UTILITY FUNCTIONS ---
    const getFromLS = (key) => JSON.parse(localStorage.getItem(key)) || [];
    const saveToLS = (key, data) => localStorage.setItem(key, JSON.stringify(data));
    const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1', '#fd7e14', '#20c997', '#6610f2', '#e83e8c'];

    // --- DATA HANDLING & POPULATION ---
    const loadEventTypes = () => {
        let types = getFromLS(EVENT_TYPES_LS_KEY);
        if (types.length === 0) {
            const defaultTypes = ['Push-ups', 'Body Weight (kg)'];
            saveToLS(EVENT_TYPES_LS_KEY, defaultTypes);
            types.push(...defaultTypes);
        }
        populateEventTypeSelect(types);
        populateChartFilters(types);
    };

    const populateEventTypeSelect = (types) => {
        eventTypeSelect.innerHTML = types.map(type => `<option value="${type}">${type}</option>`).join('');
        if (types.length === 0) {
            eventTypeSelect.innerHTML = '<option value="">No types available</option>';
        }
    };
    
    const populateChartFilters = (types) => {
        const populate = (selectElement) => {
            if (!selectElement) return;
            const currentVal = selectElement.value;
            selectElement.innerHTML = '<option value="all">Show All</option>';
            selectElement.innerHTML += types.map(type => `<option value="${type}">${type}</option>`).join('');
            if (Array.from(selectElement.options).some(opt => opt.value === currentVal)) {
                selectElement.value = currentVal;
            } else {
                selectElement.value = 'all';
            }
        };
        populate(chartEventTypeFilter);
        populate(dailyChartEventTypeFilter);
    };
    
    const addEventTypeHandler = () => {
        const newType = newEventTypeInput.value.trim();
        if (newType) {
            let types = getFromLS(EVENT_TYPES_LS_KEY);
            if (!types.includes(newType)) {
                types.push(newType);
                types.sort((a, b) => a.localeCompare(b, 'en'));
                saveToLS(EVENT_TYPES_LS_KEY, types);
                populateEventTypeSelect(types);
                populateChartFilters(types);
                eventTypeSelect.value = newType;
                newEventTypeInput.value = '';
                alert(`Event type "${newType}" added!`);
            } else {
                alert('This event type already exists.');
            }
        } else {
            alert('Please enter a name for the new event type.');
        }
    };
    
    const setDefaultDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        eventDateInput.value = now.toISOString().slice(0, 16);
    };

    // --- EVENT HANDLERS ---
    const addEventHandler = (e) => {
        e.preventDefault();
        const eventDate = eventDateInput.value;
        const eventType = eventTypeSelect.value;
        const eventValue = parseFloat(eventValueInput.value);
        const eventNotes = eventNotesInput.value.trim();

        if (!eventDate || !eventType || eventType === "" || isNaN(eventValue)) {
            alert('Please fill in all required fields (Date, Event Type, Numeric Value).');
            return;
        }

        const newEvent = { id: Date.now(), date: eventDate, type: eventType, value: eventValue, notes: eventNotes };
        let events = getFromLS(EVENTS_LS_KEY);
        events.push(newEvent);
        saveToLS(EVENTS_LS_KEY, events);

        refreshAllViews();
        eventForm.reset();
        setDefaultDateTime();
    };

    const deleteEventHandler = (eventId) => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        
        let events = getFromLS(EVENTS_LS_KEY);
        events = events.filter(event => event.id !== eventId);
        saveToLS(EVENTS_LS_KEY, events);
        refreshAllViews();
    };

    // --- RENDERING FUNCTIONS ---
    const refreshAllViews = () => {
        renderRecentEvents();
        renderChart();
        renderDailyTotalsChart();
        renderMaxValues(); // NUOVO: Aggiunta chiamata per aggiornare il pannello
    };
    
    const renderRecentEvents = (limit = 10) => {
        recentEventsTableBody.innerHTML = '';
        const events = getFromLS(EVENTS_LS_KEY).sort((a, b) => new Date(b.date) - new Date(a.date));

        if (events.length === 0) {
            recentEventsTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No events recorded yet.</td></tr>';
            return;
        }

        events.slice(0, limit).forEach(event => {
            const row = recentEventsTableBody.insertRow();
            row.insertCell().textContent = new Date(event.date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            row.insertCell().textContent = event.type;
            row.insertCell().textContent = event.value;
            row.insertCell().textContent = event.notes;
            const actionsCell = row.insertCell();
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-outline-danger';
            deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg>';
            deleteBtn.setAttribute('aria-label', 'Delete event');
            deleteBtn.onclick = () => deleteEventHandler(event.id);
            actionsCell.appendChild(deleteBtn);
        });
    };

    /**
     * NUOVA FUNZIONE: Renderizza la lista dei valori massimi per ogni tipo di evento.
     */
    const renderMaxValues = () => {
        const events = getFromLS(EVENTS_LS_KEY);
        maxValuesList.innerHTML = '';

        if (events.length === 0) {
            maxValuesList.innerHTML = '<li class="list-group-item">No data to display.</li>';
            return;
        }

        const maxValues = {};
        events.forEach(event => {
            if (!maxValues[event.type] || event.value > maxValues[event.type]) {
                maxValues[event.type] = event.value;
            }
        });

        const sortedTypes = Object.keys(maxValues).sort((a, b) => a.localeCompare(b));
        
        if (sortedTypes.length === 0) {
            maxValuesList.innerHTML = '<li class="list-group-item">No data to display.</li>';
            return;
        }

        sortedTypes.forEach(type => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                ${type}
                <span class="badge bg-primary rounded-pill">${maxValues[type]}</span>
            `;
            maxValuesList.appendChild(li);
        });
    };

    const drawChart = (canvas, chartInstance, datasets, message) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        if (chartInstance) {
            chartInstance.destroy();
        }

        if (datasets.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.textAlign = 'center';
            ctx.font = '16px Arial';
            ctx.fillText(message, canvas.width / 2, canvas.height / 2);
            return null;
        }

        return new Chart(ctx, {
            type: 'line',
            data: { datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Modificato per permettere al CSS di controllare l'altezza
                scales: {
                    x: {
                        type: 'time',
                        time: { unit: 'day', tooltipFormat: 'PPpp', displayFormats: { hour: 'HH:mm', day: 'MMM d', month: 'MMM yyyy' }},
                        title: { display: true, text: 'Date' }
                    },
                    y: { beginAtZero: true, title: { display: true, text: 'Value' } }
                },
                plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } },
                interaction: { mode: 'nearest', axis: 'x', intersect: false }
            }
        });
    };
    
    const renderChart = () => {
        const events = getFromLS(EVENTS_LS_KEY).sort((a, b) => new Date(a.date) - new Date(b.date));
        const eventTypes = getFromLS(EVENT_TYPES_LS_KEY);
        const selectedChartType = chartEventTypeFilter.value;
        const datasets = [];

        eventTypes.forEach((type, index) => {
            if (selectedChartType !== 'all' && type !== selectedChartType) return;
            const typeEvents = events.filter(e => e.type === type).map(e => ({ x: new Date(e.date).valueOf(), y: e.value }));
            if (typeEvents.length > 0) {
                datasets.push({
                    label: type, data: typeEvents, borderColor: colors[index % colors.length],
                    backgroundColor: colors[index % colors.length] + '33', tension: 0.1, fill: false
                });
            }
        });

        const message = events.length > 0 ? 'No data for this filter.' : 'No events. Add some!';
        eventsChart = drawChart(eventsChartCanvas, eventsChart, datasets, message);
    };
    
    const renderDailyTotalsChart = () => {
        const events = getFromLS(EVENTS_LS_KEY);
        const eventTypes = getFromLS(EVENT_TYPES_LS_KEY);
        const selectedType = dailyChartEventTypeFilter.value;
        const datasets = [];

        const dailyTotals = {}; // { 'Push-ups': { '2024-05-10': 35 }, ... }
        events.forEach(event => {
            const type = event.type;
            const dateKey = new Date(event.date).toISOString().split('T')[0];
            if (!dailyTotals[type]) dailyTotals[type] = {};
            if (!dailyTotals[type][dateKey]) dailyTotals[type][dateKey] = 0;
            dailyTotals[type][dateKey] += event.value;
        });

        eventTypes.forEach((type, index) => {
            if (selectedType !== 'all' && type !== selectedType) return;
            if (dailyTotals[type]) {
                const dataPoints = Object.entries(dailyTotals[type])
                    .map(([date, total]) => ({ x: new Date(date).valueOf(), y: total }))
                    .sort((a, b) => a.x - b.x);
                if(dataPoints.length > 0) {
                    datasets.push({
                        label: `${type} (Daily Total)`, data: dataPoints, borderColor: colors[index % colors.length],
                        backgroundColor: colors[index % colors.length] + '33', tension: 0.1, fill: false, stepped: 'before'
                    });
                }
            }
        });
        
        const message = events.length > 0 ? 'No data for this filter.' : 'No events. Add some!';
        // Per il grafico dei totali, usiamo l'originale 'drawChart' che ora ha `maintainAspectRatio` a false.
        // Possiamo ripristinare il comportamento originale se necessario per questo specifico grafico.
        // Per ora, lasciamo la stessa funzione di disegno.
        dailyTotalsChart = drawChart(dailyTotalsChartCanvas, dailyTotalsChart, datasets, message);
    };

    // --- IMPORT/EXPORT/CLEAR ---
    const exportDataHandler = () => {
        const dataToExport = {
            eventTypes: getFromLS(EVENT_TYPES_LS_KEY),
            events: getFromLS(EVENTS_LS_KEY)
        };
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `progress_tracker_data_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert('Data exported successfully!');
    };

    const importDataHandler = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!confirm("Importing data will overwrite current data. Continue?")) {
            importDataInput.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data && Array.isArray(data.events) && Array.isArray(data.eventTypes)) {
                    saveToLS(EVENTS_LS_KEY, data.events);
                    saveToLS(EVENT_TYPES_LS_KEY, data.eventTypes);
                    loadEventTypes();
                    refreshAllViews();
                    alert('Data imported successfully!');
                } else {
                    alert('Invalid file format.');
                }
            } catch (error) {
                alert('Error importing file: ' + error.message);
            } finally {
                importDataInput.value = '';
            }
        };
        reader.readAsText(file);
    };

    const clearAllDataHandler = () => {
        if (confirm('WARNING! Are you sure you want to delete ALL data (events and event types)? This action is irreversible.')) {
            localStorage.removeItem(EVENTS_LS_KEY);
            localStorage.removeItem(EVENT_TYPES_LS_KEY);
            loadEventTypes();
            refreshAllViews();
            alert('All data has been cleared.');
        }
    };

    // --- INITIALIZATION ---
    eventForm.addEventListener('submit', addEventHandler);
    addNewEventTypeBtn.addEventListener('click', addEventTypeHandler);
    chartEventTypeFilter.addEventListener('change', renderChart);
    dailyChartEventTypeFilter.addEventListener('change', renderDailyTotalsChart);
    exportDataBtn.addEventListener('click', exportDataHandler);
    importDataInput.addEventListener('change', importDataHandler);
    clearAllDataBtn.addEventListener('click', clearAllDataHandler);

    setDefaultDateTime();
    loadEventTypes();
    refreshAllViews();
});