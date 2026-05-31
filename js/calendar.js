// Модуль управления календарем тренировок
class TrainingCalendar {
    constructor() {
        this.nextTrainingDate = null;
        this.exercises = [];
        this.init();
    }

    init() {
        this.loadNextTraining();
        // Здесь будет загрузка данных из Firebase
    }

    async loadNextTraining() {
        try {
            // В будущем здесь будет загрузка из Firebase
            // const snapshot = await db.collection('trainings')
            //     .orderBy('date', 'asc')
            //     .where('date', '>=', new Date())
            //     .limit(1)
            //     .get();
            
            // Временные данные для демонстрации
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

    async saveTraining(data) {
        try {
            // Здесь будет сохранение в Firebase
            // await db.collection('completed_trainings').add({
            //     date: new Date(),
            //     exercises: data.exercises,
            //     completed: data.completed
            // });
            
            console.log('Training saved:', data);
            return true;
        } catch (error) {
            console.error('Error saving training:', error);
            return false;
        }
    }

    getNextTrainingDate() {
        return this.nextTrainingDate;
    }
}
