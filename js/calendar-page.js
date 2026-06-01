class CalendarPage {
    constructor() {
        this.today = new Date();
        this.currentMonth = this.today.getMonth();
        this.currentYear = this.today.getFullYear();
        
        // Временный список запланированных тренировок (даты в формате YYYY-MM-DD)
        // Позже заменим на загрузку из Firebase
        this.plannedDates = this.getMockPlannedDates();
        
        this.init();
    }

    init() {
        this.renderCalendar();
        this.setupSettingsButton();
    }

    // Временные данные для демонстрации
    getMockPlannedDates() {
        const today = new Date();
        const y = today.getFullYear();
        const m = today.getMonth();
        // Для примера: тренировки по понедельникам, средам и пятницам текущего месяца
        const dates = [];
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(y, m, day);
            const dayOfWeek = date.getDay(); // 0 вс, 1 пн, ...
            if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) { // пн, ср, пт
                dates.push(this.formatDate(date));
            }
        }
        return dates;
    }

    // Приводим дату к строке YYYY-MM-DD для сравнения
    formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // Проверка, запланирована ли тренировка на дату
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

            // Подсветка сегодняшнего дня
            if (
                day === this.today.getDate() &&
                this.currentMonth === this.today.getMonth() &&
                this.currentYear === this.today.getFullYear()
            ) {
                dayCell.classList.add('today');
            }

            // Подсветка запланированных тренировок
            if (this.isPlanned(date)) {
                dayCell.classList.add('planned-workout');
            }

            grid.appendChild(dayCell);
        }
    }

    setupSettingsButton() {
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                alert('Настройки пока не реализованы');
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CalendarPage();
});
