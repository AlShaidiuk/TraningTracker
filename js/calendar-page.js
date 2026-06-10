class CalendarPage {
    constructor() {
        this.today = new Date();
        this.currentMonth = this.today.getMonth();
        this.currentYear = this.today.getFullYear();

        this.plannedDates = [];
        this.selectedDate = null;
        this.selectedElement = null;

        this.init();
    }

    async init() {
        await this.loadPlannedDatesFromDB();
        this.renderCalendar();
        this.setupSettingsButton();
    }

    // Загрузка дат из Realtime Database
    async loadPlannedDatesFromDB() {
        try {
            const snapshot = await firebase.database().ref('plannedWorkouts').once('value');
            const data = snapshot.val();
            if (data) {
                // Ключи объекта – это даты в формате YYYY-MM-DD
                this.plannedDates = Object.keys(data);
            } else {
                // Если данных нет, создаём демо-тренировки
                this.plannedDates = this.getMockPlannedDates();
                await this.saveAllDatesToDB();
            }
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            this.plannedDates = this.getMockPlannedDates();
        }
    }

    // Сохранение всех дат разом (первый запуск)
    async saveAllDatesToDB() {
        try {
            const updates = {};
            // Удаляем старые (на всякий случай)
            await firebase.database().ref('plannedWorkouts').remove();
            // Записываем новые
            this.plannedDates.forEach(date => {
                updates[date] = true;
            });
            await firebase.database().ref('plannedWorkouts').update(updates);
        } catch (error) {
            console.error('Ошибка сохранения:', error);
        }
    }

    // Добавить одну дату
    async addPlannedDate(dateStr) {
        try {
            await firebase.database().ref(`plannedWorkouts/${dateStr}`).set(true);
        } catch (error) {
            console.error('Ошибка добавления:', error);
        }
    }

    // Удалить одну дату
    async removePlannedDate(dateStr) {
        try {
            await firebase.database().ref(`plannedWorkouts/${dateStr}`).remove();
        } catch (error) {
            console.error('Ошибка удаления:', error);
        }
    }

    // Демо-даты (пн, ср, пт)
    getMockPlannedDates() {
        const y = this.today.getFullYear();
        const m = this.today.getMonth();
        const dates = [];
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(y, m, day);
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
                dates.push(this.formatDate(date));
            }
        }
        return dates;
    }

    formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    isPlanned(date) {
        return this.plannedDates.includes(this.formatDate(date));
    }

    renderCalendar() {
        const monthNames = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

        document.getElementById('currentMonth').textContent =
            `${monthNames[this.currentMonth]} ${this.currentYear}`;

        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';

        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            grid.appendChild(dayHeader);
        });

        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const startDay = firstDay === 0 ? 6 : firstDay - 1;
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

        for (let i = 0; i < startDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            grid.appendChild(emptyDay);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentYear, this.currentMonth, day);
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.textContent = day;

            if (
                day === this.today.getDate() &&
                this.currentMonth === this.today.getMonth() &&
                this.currentYear === this.today.getFullYear()
            ) {
                dayCell.classList.add('today');
            }

            if (this.isPlanned(date)) {
                dayCell.classList.add('planned-workout');
            }

            if (this.selectedDate && this.formatDate(date) === this.selectedDate) {
                dayCell.classList.add('selected');
                this.selectedElement = dayCell;
            }

            dayCell.addEventListener('click', (e) => {
                this.selectDay(date, e.currentTarget);
            });

            grid.appendChild(dayCell);
        }
    }

    selectDay(date, element) {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
        }
        this.selectedDate = this.formatDate(date);
        this.selectedElement = element;
        element.classList.add('selected');
    }

    async refreshDataAndRender() {
        await this.loadPlannedDatesFromDB();
        this.renderCalendar();
    }

    setupSettingsButton() {
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsOverlay = document.getElementById('settingsOverlay');
        const selectedDateDisplay = document.getElementById('selectedDateDisplay');

        document.getElementById('addWorkoutBtn').addEventListener('click', async () => {
            if (this.selectedDate) {
                if (!this.plannedDates.includes(this.selectedDate)) {
                    await this.addPlannedDate(this.selectedDate);
                }
                this.closeSettingsPopup();
                await this.refreshDataAndRender();
            }
        });

        document.getElementById('removeWorkoutBtn').addEventListener('click', async () => {
            if (this.selectedDate) {
                await this.removePlannedDate(this.selectedDate);
                this.closeSettingsPopup();
                await this.refreshDataAndRender();
            }
        });

        document.getElementById('backSettingsBtn').addEventListener('click', () => {
            this.closeSettingsPopup();
        });

        settingsOverlay.addEventListener('click', (e) => {
            if (e.target === settingsOverlay) {
                this.closeSettingsPopup();
            }
        });

        settingsBtn.addEventListener('click', () => {
            if (!this.selectedDate) {
                alert('Сначала выберите день в календаре');
                return;
            }
            const [y, m, d] = this.selectedDate.split('-');
            const displayDate = new Date(y, m - 1, d).toLocaleDateString('ru-RU', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            });
            selectedDateDisplay.textContent = displayDate;
            settingsOverlay.classList.add('active');
        });
    }

    openSettingsPopup() {
        document.getElementById('settingsOverlay').classList.add('active');
    }

    closeSettingsPopup() {
        document.getElementById('settingsOverlay').classList.remove('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CalendarPage();
});
