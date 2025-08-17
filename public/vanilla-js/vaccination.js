// Global variables
let scheduleData = [];
let healthRecords = [];
let currentEditingRow = null;

// Vaccination schedules for different chicken types
const vaccinationSchedules = {
    broiler: [
        { day: 1, vaccine: "Marek's Disease", method: "Subcutaneous", notes: "At hatchery" },
        { day: 7, vaccine: "Newcastle (B1)", method: "Eye drop", notes: "First dose" },
        { day: 14, vaccine: "Gumboro (IBD)", method: "Drinking water", notes: "Intermediate strain" },
        { day: 21, vaccine: "Newcastle (LaSota)", method: "Spray", notes: "Booster dose" },
        { day: 28, vaccine: "Gumboro Booster", method: "Drinking water", notes: "Second dose" },
        { day: 35, vaccine: "Infectious Bronchitis", method: "Spray", notes: "Respiratory protection" }
    ],
    layer: [
        { day: 1, vaccine: "Marek's Disease", method: "Subcutaneous", notes: "At hatchery" },
        { day: 7, vaccine: "Newcastle (B1)", method: "Eye drop", notes: "First dose" },
        { day: 14, vaccine: "Gumboro (IBD)", method: "Drinking water", notes: "Intermediate strain" },
        { day: 21, vaccine: "Newcastle (LaSota)", method: "Spray", notes: "Booster dose" },
        { day: 28, vaccine: "Gumboro Booster", method: "Drinking water", notes: "Second dose" },
        { day: 35, vaccine: "Infectious Bronchitis", method: "Spray", notes: "Respiratory protection" },
        { day: 56, vaccine: "Fowl Pox", method: "Wing web", notes: "Skin vaccination" },
        { day: 70, vaccine: "Newcastle Booster", method: "Intramuscular", notes: "Pre-lay preparation" },
        { day: 112, vaccine: "Infectious Bronchitis Booster", method: "Spray", notes: "Before laying period" },
        { day: 120, vaccine: "Newcastle Adult", method: "Intramuscular", notes: "Long-term protection" }
    ]
};

// Disease information database
const diseaseDatabase = {
    newcastle: {
        name: "Newcastle Disease",
        severity: "high",
        mortality: "Up to 100%",
        treatment: "No specific treatment - prevention through vaccination",
        costImpact: "UGx 500,000 - 2,000,000 per 1000 birds"
    },
    fowlpox: {
        name: "Fowl Pox",
        severity: "medium", 
        mortality: "5-50%",
        treatment: "Supportive care, antibiotic for secondary infections",
        costImpact: "UGx 200,000 - 800,000 per 1000 birds"
    },
    gumboro: {
        name: "Gumboro Disease (IBD)",
        severity: "high",
        mortality: "20-60%",
        treatment: "No specific treatment - vaccination critical",
        costImpact: "UGx 400,000 - 1,500,000 per 1000 birds"
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    const hatchDateInput = document.getElementById('hatchDate');
    const recordDateInput = document.getElementById('recordDate');
    
    if (hatchDateInput) hatchDateInput.value = today;
    if (recordDateInput) recordDateInput.value = today;
    
    // Load saved data from localStorage if available
    loadSavedData();
    
    // Add event listeners
    setupEventListeners();
});

// Setup event listeners for dynamic interactions
function setupEventListeners() {
    // Add form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
        });
    });
    
    // Add hover effects to disease cards
    const diseaseCards = document.querySelectorAll('.disease-card');
    diseaseCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Tab switching functionality
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab content
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active class to clicked tab
    const clickedTab = event.target;
    if (clickedTab) {
        clickedTab.classList.add('active');
    }
    
    // Special handling for tracker tab
    if (tabName === 'tracker') {
        updateHealthRecordsDisplay();
    }
}

// Search functionality for diseases
function searchDiseases() {
    const searchTerm = document.getElementById('diseaseSearch').value.toLowerCase();
    const diseaseCards = document.querySelectorAll('.disease-card');

    diseaseCards.forEach(card => {
        const diseaseTitle = card.querySelector('.disease-title').textContent.toLowerCase();
        const description = card.querySelector('.disease-description').textContent.toLowerCase();
        const symptoms = card.querySelector('.symptoms-list').textContent.toLowerCase();
        
        if (diseaseTitle.includes(searchTerm) || 
            description.includes(searchTerm) || 
            symptoms.includes(searchTerm)) {
            card.style.display = 'block';
            // Add highlight effect
            card.style.animation = 'fadeIn 0.5s ease-in-out';
        } else {
            card.style.display = 'none';
        }
    });
}

// Generate vaccination schedule
function generateSchedule() {
    const farmerName = document.getElementById('farmerName').value;
    const flockSize = document.getElementById('flockSize').value;
    const hatchDate = document.getElementById('hatchDate').value;
    const chickenType = document.getElementById('chickenType').value;

    // Validation
    if (!farmerName || !flockSize || !hatchDate || !chickenType) {
        alert('Please fill in all fields to generate a schedule.');
        return;
    }

    if (flockSize > 500) {
        alert('Maximum flock size is 500 chicks as per Young4Chicks policy.');
        return;
    }

    const schedule = vaccinationSchedules[chickenType];
    const hatchDateObj = new Date(hatchDate);
    
    // Generate HTML for the schedule
    let scheduleHTML = `
        <div class="generated-schedule">
            <div class="schedule-header">
                <h3>Vaccination Schedule for ${farmerName}</h3>
                <p><strong>Flock Size:</strong> ${flockSize} ${chickenType}s | <strong>Hatch Date:</strong> ${formatDate(hatchDate)}</p>
            </div>
            <div class="schedule-items">
    `;

    schedule.forEach(item => {
        const vaccinationDate = new Date(hatchDateObj);
        vaccinationDate.setDate(vaccinationDate.getDate() + item.day);
        
        const isOverdue = vaccinationDate < new Date();
        const statusClass = isOverdue ? 'status-overdue' : 'status-pending';
        const statusText = isOverdue ? 'Overdue' : 'Scheduled';
        
        scheduleHTML += `
            <div class="schedule-item">
                <div class="schedule-date">Day ${item.day} - ${formatDate(vaccinationDate.toISOString().split('T')[0])}</div>
                <div class="schedule-vaccine">${item.vaccine}</div>
                <div class="schedule-notes">Method: ${item.method} | ${item.notes}</div>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
        `;
    });

    scheduleHTML += `
            </div>
            <div style="margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 10px;">
                <h4>💡 Important Reminders:</h4>
                <ul style="margin-top: 10px; margin-left: 20px;">
                    <li>Store vaccines at 2-8°C at all times</li>
                    <li>Use vaccines within 2 hours of opening</li>
                    <li>Record all vaccinations with batch numbers</li>
                    <li>Monitor birds for 24-48 hours after vaccination</li>
                    <li>Contact veterinarian if unusual reactions occur</li>
                </ul>
            </div>
            <button class="btn" onclick="saveSchedule('${farmerName}', '${flockSize}', '${hatchDate}', '${chickenType}')" style="margin-top: 15px;">Save Schedule</button>
        </div>
    `;

    document.getElementById('generatedSchedule').innerHTML = scheduleHTML;
}

// Save schedule to memory
function saveSchedule(farmerName, flockSize, hatchDate, chickenType) {
    const scheduleId = Date.now().toString();
    const newSchedule = {
        id: scheduleId,
        farmerName: farmerName,
        flockSize: parseInt(flockSize),
        hatchDate: hatchDate,
        chickenType: chickenType,
        createdDate: new Date().toISOString(),
        status: 'active'
    };
    
    scheduleData.push(newSchedule);
    saveDataToStorage();
    
    alert('Schedule saved successfully! You can now track vaccinations in the Health Tracker tab.');
}

// Add health record
function addHealthRecord() {
    const recordDate = document.getElementById('recordDate').value;
    const vaccinationType = document.getElementById('vaccinationType').value;
    const currentFlockSize = document.getElementById('currentFlockSize').value;
    const mortalityCount = document.getElementById('mortalityCount').value;
    const healthNotes = document.getElementById('healthNotes').value;

    // Validation
    if (!recordDate || !vaccinationType || !currentFlockSize) {
        alert('Please fill in required fields (Date, Vaccination, Flock Size).');
        return;
    }

    const newRecord = {
        id: Date.now().toString(),
        date: recordDate,
        vaccination: vaccinationType,
        flockSize: parseInt(currentFlockSize),
        mortality: parseInt(mortalityCount) || 0,
        notes: healthNotes || '',
        status: 'completed',
        createdAt: new Date().toISOString()
    };

    healthRecords.push(newRecord);
    saveDataToStorage();
    
    // Clear form
    document.getElementById('recordDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('vaccinationType').value = '';
    document.getElementById('currentFlockSize').value = '';
    document.getElementById('mortalityCount').value = '';
    document.getElementById('healthNotes').value = '';
    
    // Update display
    updateHealthRecordsDisplay();
    
    alert('Health record added successfully!');
}

// Update health records display
function updateHealthRecordsDisplay() {
    const tbody = document.getElementById('healthRecords');
    if (!tbody) return;
    
    // Keep existing sample records and add new ones
    const existingRows = tbody.querySelectorAll('tr');
    let existingHTML = '';
    
    // Preserve first 3 sample rows
    for (let i = 0; i < Math.min(3, existingRows.length); i++) {
        existingHTML += existingRows[i].outerHTML;
    }
    
    // Add new records
    let newRecordsHTML = '';
    healthRecords.forEach(record => {
        const mortalityRate = record.flockSize > 0 ? ((record.mortality / record.flockSize) * 100).toFixed(1) : 0;
        const statusClass = record.status === 'completed' ? 'status-completed' : 'status-pending';
        
        newRecordsHTML += `
            <tr data-record-id="${record.id}">
                <td>${formatDate(record.date)}</td>
                <td>${record.vaccination}</td>
                <td>${record.flockSize}</td>
                <td>${record.mortality} (${mortalityRate}%)</td>
                <td><span class="status-badge ${statusClass}">${record.status}</span></td>
                <td>${record.notes}</td>
                <td><button class="btn-small" onclick="editRecord(this)">Edit</button></td>
            </tr>
        `;
    });
    
    tbody.innerHTML = existingHTML + newRecordsHTML;
}

// Edit health record
function editRecord(button) {
    const row = button.closest('tr');
    const recordId = row.dataset.recordId;
    
    if (!recordId) {
        alert('This is a sample record and cannot be edited.');
        return;
    }
    
    const record = healthRecords.find(r => r.id === recordId);
    if (!record) return;
    
    // Fill form with existing data
    document.getElementById('recordDate').value = record.date;
    document.getElementById('vaccinationType').value = record.vaccination;
    document.getElementById('currentFlockSize').value = record.flockSize;
    document.getElementById('mortalityCount').value = record.mortality;
    document.getElementById('healthNotes').value = record.notes;
    
    // Change button text
    const addButton = document.querySelector('.tracker-form .btn');
    addButton.textContent = 'Update Record';
    addButton.onclick = function() { updateRecord(recordId); };
    
    currentEditingRow = recordId;
}

// Update existing record
function updateRecord(recordId) {
    const recordIndex = healthRecords.findIndex(r => r.id === recordId);
    if (recordIndex === -1) return;
    
    // Get form data
    const recordDate = document.getElementById('recordDate').value;
    const vaccinationType = document.getElementById('vaccinationType').value;
    const currentFlockSize = document.getElementById('currentFlockSize').value;
    const mortalityCount = document.getElementById('mortalityCount').value;
    const healthNotes = document.getElementById('healthNotes').value;
    
    // Update record
    healthRecords[recordIndex] = {
        ...healthRecords[recordIndex],
        date: recordDate,
        vaccination: vaccinationType,
        flockSize: parseInt(currentFlockSize),
        mortality: parseInt(mortalityCount) || 0,
        notes: healthNotes || '',
        updatedAt: new Date().toISOString()
    };
    
    saveDataToStorage();
    
    // Reset form
    document.getElementById('recordDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('vaccinationType').value = '';
    document.getElementById('currentFlockSize').value = '';
    document.getElementById('mortalityCount').value = '';
    document.getElementById('healthNotes').value = '';
    
    // Reset button
    const addButton = document.querySelector('.tracker-form .btn');
    addButton.textContent = 'Add Record';
    addButton.onclick = addHealthRecord;
    
    currentEditingRow = null;
    
    // Update display
    updateHealthRecordsDisplay();
    
    alert('Record updated successfully!');
}

// Utility function to format dates
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Calculate vaccination costs
function calculateVaccinationCost(flockSize, chickenType) {
    const costPerBird = {
        broiler: 800, // UGx per bird for complete broiler vaccination program
        layer: 1200   // UGx per bird for complete layer vaccination program
    };
    
    const baseCost = costPerBird[chickenType] * flockSize;
    const feedCost = 2 * 45000; // 2 bags of feed at UGx 45,000 each
    const totalCost = baseCost + feedCost;
    
    return {
        vaccinationCost: baseCost,
        feedCost: feedCost,
        totalCost: totalCost
    };
}

// Save data to memory (localStorage simulation for this environment)
function saveDataToStorage() {
    // In a real application, this would save to localStorage
    // For this demo, we'll just keep data in memory
    console.log('Data saved to memory:', {
        scheduleData: scheduleData,
        healthRecords: healthRecords
    });
}

// Load saved data (localStorage simulation)
function loadSavedData() {
    // In a real application, this would load from localStorage
    // For this demo, we'll start with empty arrays
    scheduleData = [];
    healthRecords = [];
}

// Export data functionality
function exportHealthData() {
    const data = {
        schedules: scheduleData,
        healthRecords: healthRecords,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `young4chicks_data_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Disease cost calculator
function calculateDiseaseCost(disease, flockSize) {
    const diseaseInfo = diseaseDatabase[disease];
    if (!diseaseInfo) return null;
    
    // Extract mortality percentage and calculate costs
    const mortalityRange = diseaseInfo.mortality;
    const costRange = diseaseInfo.costImpact;
    
    return {
        disease: diseaseInfo.name,
        potentialLoss: `${costRange} (for 1000 birds)`,
        prevention: "Vaccination and biosecurity",
        recommendation: `Immediate vaccination recommended for ${flockSize} birds`
    };
}

// Vaccination reminder system
function checkVaccinationReminders() {
    const today = new Date();
    const reminders = [];
    
    scheduleData.forEach(schedule => {
        const hatchDate = new Date(schedule.hatchDate);
        const chickenSchedule = vaccinationSchedules[schedule.chickenType];
        
        chickenSchedule.forEach(vaccination => {
            const dueDate = new Date(hatchDate);
            dueDate.setDate(dueDate.getDate() + vaccination.day);
            
            const daysDifference = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            
            // Reminder for vaccinations due within 3 days or overdue
            if (daysDifference <= 3 && daysDifference >= -1) {
                reminders.push({
                    farmer: schedule.farmerName,
                    vaccine: vaccination.vaccine,
                    dueDate: dueDate,
                    daysDifference: daysDifference,
                    isOverdue: daysDifference < 0
                });
            }
        });
    });
    
    return reminders;
}

// Display vaccination reminders (could be called periodically)
function showVaccinationReminders() {
    const reminders = checkVaccinationReminders();
    
    if (reminders.length === 0) {
        alert('No upcoming vaccinations in the next 3 days.');
        return;
    }
    
    let reminderText = 'Vaccination Reminders:\n\n';
    reminders.forEach(reminder => {
        const status = reminder.isOverdue ? 'OVERDUE' : `Due in ${reminder.daysDifference} days`;
        reminderText += `${reminder.farmer}: ${reminder.vaccine} - ${status}\n`;
    });
    
    alert(reminderText);
}

// Initialize tooltips and help text
function initializeHelpers() {
    // Add tooltips to form elements
    const tooltips = {
        'farmerName': 'Enter the registered young farmer\'s name',
        'flockSize': 'Maximum 500 chicks for returning farmers, 100 for starters',
        'hatchDate': 'Date when chicks were hatched or received',
        'chickenType': 'Select broiler for meat production or layer for egg production'
    };
    
    Object.keys(tooltips).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.title = tooltips[id];
        }
    });
}

// Call helper initialization when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeHelpers();
});

// Mobile responsiveness helper
function adjustForMobile() {
    if (window.innerWidth <= 768) {
        // Adjust table display for mobile
        const tables = document.querySelectorAll('.schedule-table');
        tables.forEach(table => {
            table.style.fontSize = '12px';
        });
        
        // Adjust card layout
        const cards = document.querySelectorAll('.disease-card');
        cards.forEach(card => {
            card.style.margin = '10px 0';
        });
    }
}

// Add resize listener
window.addEventListener('resize', adjustForMobile);

// Call once on load
document.addEventListener('DOMContentLoaded', adjustForMobile);