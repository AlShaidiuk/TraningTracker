class TrainingCalendar {
    constructor() {
        this.nextTrainingDate = null;
        this.init();
    }

    init() {
        this.loadNextTraining();
        this.setupClickHandler();
    }

    async loadNextTraining() {
        try {
            // Временные данные
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            this.nextTrainingDate = tomorrow;
            this.updateDisplay();
        } catch (error) {
            console.error('Error loading training:', error);
        }
    }

    updateDisplay() {
        const dateElement = document.getElementById('trainingDate');
        if (dateElement && this.nextTrainingDate) {
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            dateElement.textContent = this.nextTrainingDate.toLocaleDateString('ru-RU', options);
        }
    }

    setupClickHandler() {
        const dateDisplay = document.getElementById('nextTrainingDate');
        if (dateDisplay) {
            dateDisplay.addEventListener('click', () => {
                window.location.href = 'calendar.html';
            });
        }
    }

    getNextTrainingDate() {
        return this.nextTrainingDate;
    }
}
