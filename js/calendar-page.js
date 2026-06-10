class CalendarPage {
    constructor() {
        this.today = new Date();
        this.currentMonth = this.today.getMonth();
        this.currentYear = this.today.getFullYear();
        
        // Запланированные даты (временный массив, формат YYYY-MM-DD)
        this.plannedDates = this.getMockPlannedDates();
        
        // Выбранный день
        this.selectedDate = null;
        this.selectedElement = null;
        
        this.init();
    }

    init() {
        this.renderCalendar();
        this.setupSettingsButton();
    }

    // Временные данные (тренировки по понедельникам, средам и пятницам)
    getMockPlannedDates() {
        const today = new Date();
        const y = today.getFullYear();
        const m = today.getMonth();
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

        // Дни недели
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            grid.appendChild(dayHeader);
        });

        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const startDay = firstDay === 0 ? 6 : firstDay - 1;
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

        // Пустые ячейки
        for (let i = 0; i < startDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            grid.appendChild(emptyDay);
        }

        // Дни месяца
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentYear, this.currentMonth, day);
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.textContent = day;

            // Сегодня?
            if (
                day === this.today.getDate() &&
                this.currentMonth === this.today.getMonth() &&
                this.currentYear === this.today.getFullYear()
            ) {
                dayCell.classList.add('today');
            }

            // Запланирован?
            if (this.isPlanned(date)) {
                dayCell.classList.add('planned-workout');
            }

            // Выделение, если этот день был выбран ранее
            if (this.selectedDate && this.formatDate(date) === this.selectedDate) {
                dayCell.classList.add('selected');
                this.selectedElement = dayCell;
            }

            // Обработчик клика для выбора дня
            dayCell.addEventListener('click', (e) => {
                this.selectDay(date, e.currentTarget);
            });

            grid.appendChild(dayCell);
        }
    }

    selectDay(date, element) {
        // Снять выделение с предыдущего дня
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
        }
        // Установить новое выделение
        this.selectedDate = this.formatDate(date);
        this.selectedElement = element;
        element.classList.add('selected');
    }

    setupSettingsButton() {
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsOverlay = document.getElementById('settingsOverlay');
        const selectedDateDisplay = document.getElementById('selectedDateDisplay');

        // Обработчики для кнопок попапа
        document.getElementById('addWorkoutBtn').addEventListener('click', () => {
            if (this.selectedDate) {
                // Добавить дату, если её ещё нет
                if (!this.plannedDates.includes(this.selectedDate)) {
                    this.plannedDates.push(this.selectedDate);
                }
                this.closeSettingsPopup();
                this.renderCalendar(); // перерисовка с новым статусом
            }
        });

        document.getElementById('removeWorkoutBtn').addEventListener('click', () => {
            if (this.selectedDate) {
                // Удалить дату из запланированных
                this.plannedDates = this.plannedDates.filter(d => d !== this.selectedDate);
                this.closeSettingsPopup();
                this.renderCalendar();
            }
        });

        document.getElementById('backSettingsBtn').addEventListener('click', () => {
            this.closeSettingsPopup();
        });

        // Закрытие по клику на оверлей
        settingsOverlay.addEventListener('click', (e) => {
            if (e.target === settingsOverlay) {
                this.closeSettingsPopup();
            }
        });

        // Кнопка "Настройки" открывает попап, только если выбран день
        settingsBtn.addEventListener('click', () => {
            if (!this.selectedDate) {
                alert('Сначала выберите день в календаре');
                return;
            }
            // Форматируем дату для отображения
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
