class TrainingCalendar {
    constructor() {
        this.nextTrainingDate = null;       // объект Date ближайшей тренировки
        this.templateName = null;           // название шаблона (если есть)
        this.displayElement = document.getElementById('trainingDate');
        this.init();
    }

    async init() {
        await this.loadNearestTraining();
        this.setupClickHandler();
    }

    // Загружаем запланированные даты из Realtime Database и ищем ближайшую
    async loadNearestTraining() {
        try {
            const snapshot = await firebase.database().ref('plannedWorkouts').once('value');
            const data = snapshot.val();

            if (!data) {
                this.nextTrainingDate = null;
                this.templateName = null;
                this.updateDisplay();
                return;
            }

            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            // Получаем все ключи (даты) и фильтруем сегодня + будущие
            const plannedDates = Object.keys(data).filter(dateStr => {
                const [y, m, d] = dateStr.split('-').map(Number);
                const date = new Date(y, m - 1, d);
                return date >= todayStart;
            }).sort(); // строковая сортировка "YYYY-MM-DD" совпадает с хронологической

            if (plannedDates.length === 0) {
                this.nextTrainingDate = null;
                this.templateName = null;
            } else {
                const nearestDateStr = plannedDates[0];
                const [y, m, d] = nearestDateStr.split('-').map(Number);
                this.nextTrainingDate = new Date(y, m - 1, d);

                const workoutData = data[nearestDateStr];
                const templateId = workoutData && workoutData.templateId;
                if (templateId && templateId !== 'default') {
                    // Загружаем название шаблона
                    const templateSnap = await firebase.database().ref(`templates/${templateId}/name`).once('value');
                    this.templateName = templateSnap.val() || null;
                } else {
                    this.templateName = null;
                }
            }

            this.updateDisplay();
        } catch (error) {
            console.error('Ошибка загрузки тренировок для дашборда:', error);
            this.nextTrainingDate = null;
            this.templateName = null;
            this.updateDisplay();
        }
    }

    // Обновляем текст в поле
    updateDisplay() {
        if (!this.displayElement) return;

        if (!this.nextTrainingDate) {
            this.displayElement.textContent = 'Нет тренировок';
            return;
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const trainDateStart = new Date(this.nextTrainingDate);
        trainDateStart.setHours(0, 0, 0, 0);

        let text = '';
        if (trainDateStart.getTime() === todayStart.getTime()) {
            text = 'Сегодня!';
        } else {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            text = this.nextTrainingDate.toLocaleDateString('ru-RU', options);
        }

        // Добавляем название шаблона, если он есть
        if (this.templateName) {
            text += ` — ${this.templateName}`;
        }

        this.displayElement.textContent = text;
    }

    setupClickHandler() {
        const dateDisplay = document.getElementById('nextTrainingDate');
        if (!dateDisplay) return;

        dateDisplay.addEventListener('click', () => {
            if (!this.nextTrainingDate) {
                window.location.href = 'calendar.html';
                return;
            }

            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const trainDateStart = new Date(this.nextTrainingDate);
            trainDateStart.setHours(0, 0, 0, 0);

            if (trainDateStart.getTime() === todayStart.getTime()) {
                const dateStr = this.formatDate(this.nextTrainingDate);
                window.location.href = `workout.html?date=${dateStr}`;
            } else {
                window.location.href = 'calendar.html';
            }
        });
    }

    formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    getNextTrainingDate() {
        return this.nextTrainingDate;
    }
}
