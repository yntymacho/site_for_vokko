let parsedData = [];
let availableDates = [];
let zoneColumns = [];
let lineChart = null;
let barChart = null;
let currentMode = 'single';
let currentView = 'zones';

const colorPalette = [
    '#4285F4', '#EA4335', '#FBBC05', '#34A853', 
    '#FF6D01', '#46BFBD', '#F7464A', '#949FB1', 
    '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', 
    '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
    '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107'
];

const areaGroups = {
    'Алматинка север': ['Зона 4', 'Зона 5', 'Зона 6', 'Зона 7'],
    'Алматинка юг': ['Зона 10', 'Зона 11', 'Зона 12', 'Зона 13'],
    'Анкара': ['Зона 8', 'Зона 9'],
    'Горький': ['Зона 1', 'Зона 2', 'Зона 3']
};

const fileUpload = document.getElementById('file-upload');
const fileInfo = document.getElementById('file-info');
const dateSelect = document.getElementById('date-select');
const dateSelect1 = document.getElementById('date-select-1');
const dateSelect2 = document.getElementById('date-select-2');
const zonesSelection = document.getElementById('zones-selection');
const areasSelection = document.getElementById('areas-selection');
const zonesSelectionContainer = document.getElementById('zones-selection-container');
const areasSelectionContainer = document.getElementById('areas-selection-container');
const selectionTitle = document.getElementById('selection-title');
const controlsContainer = document.getElementById('controls-container');
const chartsWrapper = document.getElementById('charts-wrapper');
const chartContainer = document.getElementById('chart-container');
const barChartContainer = document.getElementById('bar-chart-container');
const loadingElement = document.getElementById('loading');
const noDataElement = document.getElementById('no-data');

const singleModeBtn = document.getElementById('single-mode');
const compareModeBtn = document.getElementById('compare-mode');
const zoneModeBtn = document.getElementById('zone-mode');
const areaModeBtn = document.getElementById('area-mode');
const singleDateControls = document.getElementById('single-date-controls');
const compareDatesControls = document.getElementById('compare-dates-controls');

singleModeBtn.addEventListener('click', function() {
    currentMode = 'single';
    singleModeBtn.classList.add('active');
    compareModeBtn.classList.remove('active');
    singleDateControls.classList.remove('hidden');
    compareDatesControls.classList.add('hidden');
    barChartContainer.classList.add('hidden');
    updateChart();
});

compareModeBtn.addEventListener('click', function() {
    currentMode = 'compare';
    compareModeBtn.classList.add('active');
    singleModeBtn.classList.remove('active');
    compareDatesControls.classList.remove('hidden');
    singleDateControls.classList.add('hidden');
    barChartContainer.classList.remove('hidden');
    updateChart();
});

zoneModeBtn.addEventListener('click', function() {
    currentView = 'zones';
    zoneModeBtn.classList.add('active');
    areaModeBtn.classList.remove('active');
    zonesSelectionContainer.classList.remove('hidden');
    areasSelectionContainer.classList.add('hidden');
    selectionTitle.textContent = 'Выберите зоны для отображения:';
    updateChart();
});

areaModeBtn.addEventListener('click', function() {
    currentView = 'areas';
    areaModeBtn.classList.add('active');
    zoneModeBtn.classList.remove('active');
    zonesSelectionContainer.classList.add('hidden');
    areasSelectionContainer.classList.remove('hidden');
    selectionTitle.textContent = 'Выберите группы зон для отображения:';
    updateChart();
});

fileUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        fileInfo.textContent = `Выбран файл: ${file.name}`;
        loadingElement.classList.remove('hidden');
        noDataElement.classList.add('hidden');
        
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                processData(results.data);
                loadingElement.classList.add('hidden');
            },
            error: function(error) {
                console.error('Ошибка при парсинге CSV:', error);
                fileInfo.textContent = `Ошибка при чтении файла: ${error}`;
                loadingElement.classList.add('hidden');
                noDataElement.classList.remove('hidden');
            }
        });
    }
});

function processData(data) {
    parsedData = data;
    
    if (data.length > 0) {
        const firstRow = data[0];
        zoneColumns = Object.keys(firstRow).filter(key => key.startsWith('Зона'));
        
        const allDates = new Set();
        data.forEach(row => {
            if (row.Часы) {
                const datePart = row.Часы.split(' ')[0];
                allDates.add(datePart);
            }
        });
        availableDates = [...allDates].sort();
        
        populateSelectWithDates(dateSelect);
        populateSelectWithDates(dateSelect1);
        populateSelectWithDates(dateSelect2);
        
        if (availableDates.length >= 2) {
            dateSelect2.value = availableDates[1];
        }
        
        zonesSelection.innerHTML = '';
        zoneColumns.forEach(zone => {
            const container = document.createElement('div');
            container.className = 'selection-option';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = zone;
            checkbox.value = zone;
            checkbox.checked = true;
            checkbox.addEventListener('change', updateChart);
            
            const label = document.createElement('label');
            label.htmlFor = zone;
            label.textContent = zone;
            
            container.appendChild(checkbox);
            container.appendChild(label);
            zonesSelection.appendChild(container);
        });
        
        areasSelection.innerHTML = '';
        Object.keys(areaGroups).forEach(area => {
            const container = document.createElement('div');
            container.className = 'selection-option';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = area;
            checkbox.value = area;
            checkbox.checked = true;
            checkbox.addEventListener('change', updateChart);
            
            const label = document.createElement('label');
            label.htmlFor = area;
            label.textContent = area;
            
            container.appendChild(checkbox);
            container.appendChild(label);
            areasSelection.appendChild(container);
        });
        
        controlsContainer.classList.remove('hidden');
        updateChart();
    }
}

function populateSelectWithDates(selectElement) {
    selectElement.innerHTML = '';
    availableDates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = date;
        selectElement.appendChild(option);
    });
    
    if (availableDates.length > 0) {
        selectElement.value = availableDates[0];
    }
}

function updateChart() {
    if (currentView === 'zones') {
        const selectedZones = Array.from(document.querySelectorAll('#zones-selection input:checked')).map(cb => cb.value);
        
        if (selectedZones.length === 0) {
            chartsWrapper.classList.add('hidden');
            noDataElement.classList.remove('hidden');
            noDataElement.textContent = 'Выберите хотя бы одну зону для отображения';
            return;
        }
        
        if (currentMode === 'single') {
            renderSingleDateChart(selectedZones, false);
        } else {
            renderComparisonChart(selectedZones, false);
        }
    } else {
        const selectedAreas = Array.from(document.querySelectorAll('#areas-selection input:checked')).map(cb => cb.value);
        
        if (selectedAreas.length === 0) {
            chartsWrapper.classList.add('hidden');
            noDataElement.classList.remove('hidden');
            noDataElement.textContent = 'Выберите хотя бы одну группу зон для отображения';
            return;
        }
        
        if (currentMode === 'single') {
            renderSingleDateChart(selectedAreas, true);
        } else {
            renderComparisonChart(selectedAreas, true);
        }
    }
}

function renderSingleDateChart(selectedItems, isAreaView) {
    const selectedDate = dateSelect.value;
    
    if (!selectedDate) {
        chartsWrapper.classList.add('hidden');
        noDataElement.classList.remove('hidden');
        noDataElement.textContent = 'Выберите дату для отображения';
        return;
    }
    
    const filteredData = parsedData.filter(row => row.Часы && row.Часы.startsWith(selectedDate));
    
    if (filteredData.length === 0) {
        chartsWrapper.classList.add('hidden');
        noDataElement.classList.remove('hidden');
        noDataElement.textContent = `Нет данных для выбранной даты: ${selectedDate}`;
        return;
    }
    
    filteredData.sort((a, b) => new Date(a.Часы) - new Date(b.Часы));
    const labels = filteredData.map(row => row.Часы.split(' ')[1]);
    const datasets = [];
    
    if (isAreaView) {
        selectedItems.forEach((area, index) => {
            const zonesInArea = areaGroups[area];
            const color = colorPalette[index % colorPalette.length];
            
            const areaData = filteredData.map(row => {
                const values = zonesInArea.map(zone => parseFloat(row[zone]) || 0);
                return values.reduce((sum, val) => sum + val, 0) / values.length;
            });
            
            datasets.push({
                label: area,
                data: areaData,
                borderColor: color,
                backgroundColor: color + '33',
                tension: 0.1,
                borderWidth: 2
            });
        });
    } else {
        selectedItems.forEach((zone, index) => {
            const color = colorPalette[index % colorPalette.length];
            datasets.push({
                label: zone,
                data: filteredData.map(row => parseFloat(row[zone]) || 0),
                borderColor: color,
                backgroundColor: color + '33',
                tension: 0.1,
                borderWidth: 2
            });
        });
    }
    
    renderLineChart(labels, datasets, `Данные ${isAreaView ? 'по группам зон' : 'по зонам'} за ${selectedDate}`);
}

function renderComparisonChart(selectedItems, isAreaView) {
    const date1 = dateSelect1.value;
    const date2 = dateSelect2.value;
    
    if (!date1 || !date2) {
        chartsWrapper.classList.add('hidden');
        noDataElement.classList.remove('hidden');
        noDataElement.textContent = 'Выберите две даты для сравнения';
        return;
    }
    
    const filteredData1 = parsedData.filter(row => row.Часы && row.Часы.startsWith(date1));
    const filteredData2 = parsedData.filter(row => row.Часы && row.Часы.startsWith(date2));
    
    if (filteredData1.length === 0 || filteredData2.length === 0) {
        chartsWrapper.classList.add('hidden');
        noDataElement.classList.remove('hidden');
        noDataElement.textContent = 'Нет данных для одной или обеих выбранных дат';
        return;
    }
    
    filteredData1.sort((a, b) => new Date(a.Часы) - new Date(b.Часы));
    filteredData2.sort((a, b) => new Date(a.Часы) - new Date(b.Часы));
    
    const labels = filteredData1.map(row => row.Часы.split(' ')[1]);
    const datasets = [];
    
    const barDatasets = {
        date1: { label: date1, data: [], backgroundColor: [] },
        date2: { label: date2, data: [], backgroundColor: [] }
    };
    
    const barLabels = [];
    
    if (isAreaView) {
        selectedItems.forEach((area, index) => {
            const zonesInArea = areaGroups[area];
            const color = colorPalette[index % colorPalette.length];
            const darkerColor = getDarkerColor(color);
            
            const areaData1 = filteredData1.map(row => {
                const values = zonesInArea.map(zone => parseFloat(row[zone]) || 0);
                return values.reduce((sum, val) => sum + val, 0) / values.length;
            });
            
            const areaData2 = filteredData2.map(row => {
                const values = zonesInArea.map(zone => parseFloat(row[zone]) || 0);
                return values.reduce((sum, val) => sum + val, 0) / values.length;
            });
            
            datasets.push({
                label: `${area} (${date1})`,
                data: areaData1,
                borderColor: color,
                backgroundColor: color + '33',
                tension: 0.1,
                borderWidth: 2
            });
            
            datasets.push({
                label: `${area} (${date2})`,
                data: areaData2,
                borderColor: darkerColor,
                backgroundColor: darkerColor + '33',
                tension: 0.1,
                borderWidth: 2,
                borderDash: [5, 5]
            });
            
            // Для столбчатого графика используем среднее значение
            const avgValue1 = areaData1.reduce((sum, val) => sum + val, 0) / areaData1.length;
            const avgValue2 = areaData2.reduce((sum, val) => sum + val, 0) / areaData2.length;
            
            barLabels.push(area);
            barDatasets.date1.data.push(avgValue1);
            barDatasets.date1.backgroundColor.push(color);
            barDatasets.date2.data.push(avgValue2);
            barDatasets.date2.backgroundColor.push(darkerColor);
        });
    } else {
        selectedItems.forEach((zone, index) => {
            const color = colorPalette[index % colorPalette.length];
            const darkerColor = getDarkerColor(color);
            
            const zoneData1 = filteredData1.map(row => parseFloat(row[zone]) || 0);
            const zoneData2 = filteredData2.map(row => parseFloat(row[zone]) || 0);
            
            datasets.push({
                label: `${zone} (${date1})`,
                data: zoneData1,
                borderColor: color,
                backgroundColor: color + '33',
                tension: 0.1,
                borderWidth: 2
            });
            
            datasets.push({
                label: `${zone} (${date2})`,
                data: zoneData2,
                borderColor: darkerColor,
                backgroundColor: darkerColor + '33',
                tension: 0.1,
                borderWidth: 2,
                borderDash: [5, 5]
            });
            
            // Для столбчатого графика используем среднее значение
            const avgValue1 = zoneData1.reduce((sum, val) => sum + val, 0) / zoneData1.length;
            const avgValue2 = zoneData2.reduce((sum, val) => sum + val, 0) / zoneData2.length;
            
            barLabels.push(zone);
            barDatasets.date1.data.push(avgValue1);
            barDatasets.date1.backgroundColor.push(color);
            barDatasets.date2.data.push(avgValue2);
            barDatasets.date2.backgroundColor.push(darkerColor);
        });
    }
    
    renderLineChart(labels, datasets, `Сравнение ${isAreaView ? 'групп зон' : 'зон'}: ${date1} и ${date2}`);
    renderBarChart(barLabels, [barDatasets.date1, barDatasets.date2], `Средние значения: ${date1} vs ${date2}`);
}

function renderLineChart(labels, datasets, title) {
    if (lineChart) {
        lineChart.destroy();
    }
    
    const ctx = document.getElementById('dataChart').getContext('2d');
    lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Значение'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Время'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
    
    chartsWrapper.classList.remove('hidden');
    chartContainer.classList.remove('hidden');
    noDataElement.classList.add('hidden');
}

function renderBarChart(labels, datasets, title) {
    if (barChart) {
        barChart.destroy();
    }
    
    const ctx = document.getElementById('barChart').getContext('2d');
    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Среднее значение'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'top',
                }
            }
        }
    });
    
    barChartContainer.classList.remove('hidden');
}

function getDarkerColor(hex) {
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    r = Math.floor(r * 0.8);
    g = Math.floor(g * 0.8);
    b = Math.floor(b * 0.8);
    return '#' + 
        (r < 16 ? '0' : '') + r.toString(16) +
        (g < 16 ? '0' : '') + g.toString(16) +
        (b < 16 ? '0' : '') + b.toString(16);
}

dateSelect.addEventListener('change', updateChart);
dateSelect1.addEventListener('change', updateChart);
dateSelect2.addEventListener('change', updateChart);