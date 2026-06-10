class CalendarPage {
    constructor() {
        this.today = new Date();
        this.currentMonth = this.today.getMonth();
        this.currentYear = this.today.getFullYear();

        // Массив запланированных дат (будет загружен асинхронно)
        this.plannedDates = [];
        this.selectedDate = null;
        this.selectedElement = null;

        // Инициализация после загрузки данных
        this.init();
    }

    async init() {
        // Показываем индикатор загрузки (опционально)
        await this.loadPlannedDatesFromFirestore();
        this.renderCalendar();
        this.setupSettingsButton();
    }

    // Загрузка дат из Firestore
    async loadPlannedDatesFromFirestore() {
        try {
            const snapshot = await db.collection('plannedWorkouts').get();
            if (snapshot.empty) {
                // Если коллекция пуста, создаём демо-даты и сохраняем
                this.plannedDates = this.getMockPlannedDates();
                await this.savePlannedDatesToFirestore();
            } else {
                this.plannedDates = snapshot.docs.map(doc => doc.id);
            }
        } catch (error) {
            console.error('Ошибка загрузки дат из Firestore:', error);
            // Резервный вариант: загружаем демо, но не сохраняем в базу
            this.plannedDates = this.getMockPlannedDates();
        }
    }

    // Сохранение ВСЕХ текущих дат в Firestore (используется при первой инициализации)
    async savePlannedDatesToFirestore() {
        try {
            const batch = db.batch();
            // Очищаем существующие (удаляем все, потом добавим новые)
            const snapshot = await db.collection('plannedWorkouts').get();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            // Добавляем все даты из массива
            this.plannedDates.forEach(date => {
                const docRef = db.collection('plannedWorkouts').doc(date);
                batch.set(docRef, { createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            });
            await batch.commit();
        } catch (error) {
            console.error('Ошибка сохранения дат в Firestore:', error);
        }
    }

    // Добавить одну дату в Firestore
    async addPlannedDate(dateStr) {
        try {
            await db.collection('plannedWorkouts').doc(dateStr).set({
                date: dateStr,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Ошибка добавления даты:', error);
        }
    }

    // Удалить одну дату из Firestore
    async removePlannedDate(dateStr) {
        try {
            await db.collection('plannedWorkouts').doc(dateStr).delete();
        } catch (error) {
            console.error('Ошибка удаления даты:', error);
        }
    }

    // Демо-даты (пн, ср, пт текущего месяца)
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
        // Перезагружаем список дат из Firestore, чтобы синхронизировать
        await this.loadPlannedDatesFromFirestore();
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
