class TrainingCalendar {
    constructor() {
        this.nextTrainingDate = null;   // объект Date ближайшей тренировки
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

            // Если данных нет
            if (!data) {
                this.nextTrainingDate = null;
                this.updateDisplay();
                return;
            }

            // Получаем все даты (ключи) и преобразуем в объекты Date
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0); // начало сегодняшнего дня

            const plannedDates = Object.keys(data)
                .map(dateStr => {
                    const [y, m, d] = dateStr.split('-').map(Number);
                    return new Date(y, m - 1, d);
                })
                .filter(date => date >= todayStart) // только сегодня и будущие
                .sort((a, b) => a - b); // по возрастанию

            if (plannedDates.length === 0) {
                this.nextTrainingDate = null; // нет будущих тренировок
            } else {
                this.nextTrainingDate = plannedDates[0]; // ближайшая
            }

            this.updateDisplay();
        } catch (error) {
            console.error('Ошибка загрузки тренировок для дашборда:', error);
            this.nextTrainingDate = null;
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
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);

        // Сравниваем даты (без времени)
        const trainDateStart = new Date(this.nextTrainingDate);
        trainDateStart.setHours(0, 0, 0, 0);

        if (trainDateStart.getTime() === todayStart.getTime()) {
            this.displayElement.textContent = 'Сегодня!';
        } else {
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            this.displayElement.textContent = this.nextTrainingDate.toLocaleDateString('ru-RU', options);
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

    // Метод для совместимости с PopupManager (возвращает ближайшую дату или null)
    getNextTrainingDate() {
        return this.nextTrainingDate;
    }
}
