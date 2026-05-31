// Основной модуль приложения
class WorkoutApp {
    constructor() {
        this.trainingCalendar = null;
        this.popupManager = null;
        this.init();
    }

    init() {
        console.log('Workout App initialized');
        this.trainingCalendar = new TrainingCalendar();
        this.popupManager = new PopupManager(this.trainingCalendar);
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Обработчик для кнопки "Завершить тренировку"
        const completeBtn = document.getElementById('completeWorkoutBtn');
        if (completeBtn) {
            completeBtn.addEventListener('click', () => {
                this.popupManager.showPopup();
            });
        }
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.workoutApp = new WorkoutApp();
});
