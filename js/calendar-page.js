class CalendarPage {
    constructor() {
        this.today = new Date();
        this.currentMonth = this.today.getMonth();
        this.currentYear = this.today.getFullYear();
        this.init();
    }

    init() {
        this.renderCalendar();
        this.setupSettingsButton();
    }

    renderCalendar() {
        const monthNames = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

        // Заголовок месяца
        document.getElementById('currentMonth').textContent = 
            `${monthNames[this.currentMonth]} ${this.currentYear}`;

        // Сетка календаря
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';

        // Дни недели
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            grid.appendChild(dayHeader);
        });

        // Первый день месяца и количество дней
        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        // Преобразуем воскресенье (0) в 7 для удобства
        const startDay = firstDay === 0 ? 6 : firstDay - 1; // Пн=0, Вт=1, ..., Вс=6
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

        // Пустые ячейки до первого дня
        for (let i = 0; i < startDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            grid.appendChild(emptyDay);
        }

        // Дни месяца
        for (let day = 1; day <= daysInMonth; day++) {
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

            // Здесь позже можно добавить отметки о тренировках (посещениях)
            grid.appendChild(dayCell);
        }
    }

    setupSettingsButton() {
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                // Пока заглушка
                alert('Настройки пока не реализованы');
                // В будущем: открыть модальное окно с настройками календаря
            });
        }
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    new CalendarPage();
});
