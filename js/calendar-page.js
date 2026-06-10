class CalendarPage {
    constructor() {
        this.today = new Date();
        this.currentMonth = this.today.getMonth();
        this.currentYear = this.today.getFullYear();

        this.plannedDates = [];   // массив дат (строк YYYY-MM-DD), на которые есть тренировки
        this.selectedDate = null; // выбранная дата (строка)
        this.selectedElement = null;

        // Кнопки и оверлеи
        this.viewWorkoutBtn = document.getElementById('viewWorkoutBtn');
        this.settingsOverlay = document.getElementById('settingsOverlay');
        this.templateSelectionOverlay = document.getElementById('templateSelectionOverlay');
        this.createTemplateOverlay = document.getElementById('createTemplateOverlay');
        this.templateList = document.getElementById('templateList');
        this.noTemplatesMessage = document.getElementById('noTemplatesMessage');

        // Шаблоны
        this.templates = [];

        this.init();
    }

    async init() {
        await this.loadPlannedDatesFromDB();
        await this.loadTemplatesFromDB();
        this.renderCalendar();
        this.setupSettingsButton();
        this.setupViewWorkoutButton();
        this.setupTemplateSelection();
        this.setupCreateTemplate();
    }

    /* ========== Работа с Realtime Database (тренировки) ========== */
    async loadPlannedDatesFromDB() {
        try {
            const snapshot = await firebase.database().ref('plannedWorkouts').once('value');
            const data = snapshot.val();
            if (data) {
                this.plannedDates = Object.keys(data);
            } else {
                this.plannedDates = this.getMockPlannedDates();
                await this.saveAllDatesToDB();
            }
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            this.plannedDates = this.getMockPlannedDates();
        }
    }

    async saveAllDatesToDB() {
        try {
            await firebase.database().ref('plannedWorkouts').remove();
            const updates = {};
            this.plannedDates.forEach(date => {
                updates[date] = { templateId: 'default', createdAt: firebase.database.ServerValue.TIMESTAMP };
            });
            await firebase.database().ref('plannedWorkouts').update(updates);
        } catch (error) {
            console.error('Ошибка сохранения:', error);
        }
    }

    async addWorkoutWithTemplate(dateStr, templateId) {
        try {
            await firebase.database().ref(`plannedWorkouts/${dateStr}`).set({
                templateId: templateId,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('Ошибка добавления тренировки:', error);
        }
    }

    async removePlannedDate(dateStr) {
        try {
            await firebase.database().ref(`plannedWorkouts/${dateStr}`).remove();
        } catch (error) {
            console.error('Ошибка удаления:', error);
        }
    }

    /* ========== Шаблоны ========== */
    async loadTemplatesFromDB() {
        try {
            const snapshot = await firebase.database().ref('templates').once('value');
            const data = snapshot.val();
            if (data) {
                this.templates = Object.entries(data).map(([id, value]) => ({
                    id: id,
                    name: value.name
                }));
            } else {
                this.templates = [];
            }
        } catch (error) {
            console.error('Ошибка загрузки шаблонов:', error);
            this.templates = [];
        }
    }

    async createTemplate(name) {
        try {
            const newRef = firebase.database().ref('templates').push();
            await newRef.set({
                name: name,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            // Добавляем локально
            this.templates.push({ id: newRef.key, name: name });
            return newRef.key;
        } catch (error) {
            console.error('Ошибка создания шаблона:', error);
            return null;
        }
    }

    /* ========== Календарь ========== */
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

        this.updateViewWorkoutButton();
    }

    selectDay(date, element) {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
        }
        this.selectedDate = this.formatDate(date);
        this.selectedElement = element;
        element.classList.add('selected');
        this.updateViewWorkoutButton();
    }

    updateViewWorkoutButton() {
        if (!this.viewWorkoutBtn) return;
        if (this.selectedDate && this.plannedDates.includes(this.selectedDate)) {
            this.viewWorkoutBtn.disabled = false;
        } else {
            this.viewWorkoutBtn.disabled = true;
        }
    }

    /* ========== Попап выбора шаблона ========== */
    setupTemplateSelection() {
        document.getElementById('backFromTemplatesBtn').addEventListener('click', () => {
            this.closeTemplateSelectionPopup();
            // Возвращаемся к настройкам дня
            this.settingsOverlay.classList.add('active');
        });

        document.getElementById('createTemplateBtn').addEventListener('click', () => {
            this.closeTemplateSelectionPopup();
            this.openCreateTemplatePopup();
        });
    }

    openTemplateSelectionPopup() {
        this.settingsOverlay.classList.remove('active');
        this.renderTemplateList();
        this.templateSelectionOverlay.classList.add('active');
    }

    closeTemplateSelectionPopup() {
        this.templateSelectionOverlay.classList.remove('active');
    }

    renderTemplateList() {
        this.templateList.innerHTML = '';
        if (this.templates.length === 0) {
            this.templateList.style.display = 'none';
            this.noTemplatesMessage.style.display = 'block';
        } else {
            this.templateList.style.display = 'block';
            this.noTemplatesMessage.style.display = 'none';

            this.templates.forEach(template => {
                const li = document.createElement('li');
                li.textContent = template.name;
                li.addEventListener('click', async () => {
                    // Выбор шаблона
                    if (this.selectedDate) {
                        await this.addWorkoutWithTemplate(this.selectedDate, template.id);
                        this.closeTemplateSelectionPopup();
                        await this.refreshDataAndRender();
                    }
                });
                this.templateList.appendChild(li);
            });
        }
    }

    /* ========== Попап создания шаблона ========== */
    setupCreateTemplate() {
        document.getElementById('saveTemplateBtn').addEventListener('click', async () => {
            const nameInput = document.getElementById('templateNameInput');
            const name = nameInput.value.trim();
            if (name === '') {
                alert('Введите название шаблона');
                return;
            }
            const newId = await this.createTemplate(name);
            if (newId) {
                nameInput.value = '';
                this.closeCreateTemplatePopup();
                // Снова открываем выбор шаблона, где уже будет новый
                this.openTemplateSelectionPopup();
            }
        });

        document.getElementById('cancelCreateTemplateBtn').addEventListener('click', () => {
            this.closeCreateTemplatePopup();
            // Возвращаемся к выбору шаблона
            this.openTemplateSelectionPopup();
        });
    }

    openCreateTemplatePopup() {
        this.createTemplateOverlay.classList.add('active');
    }

    closeCreateTemplatePopup() {
        this.createTemplateOverlay.classList.remove('active');
    }

    /* ========== Обновление данных после изменений ========== */
    async refreshDataAndRender() {
        await this.loadPlannedDatesFromDB();
        if (this.selectedDate && !this.plannedDates.includes(this.selectedDate)) {
            if (this.selectedElement) {
                this.selectedElement.classList.remove('selected');
            }
            this.selectedDate = null;
            this.selectedElement = null;
        }
        this.renderCalendar();
    }

    /* ========== Настройки дня ========== */
    setupSettingsButton() {
        const settingsBtn = document.getElementById('settingsBtn');

        document.getElementById('addWorkoutBtn').addEventListener('click', () => {
            // Вместо немедленного добавления открываем выбор шаблона
            this.openTemplateSelectionPopup();
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

        this.settingsOverlay.addEventListener('click', (e) => {
            if (e.target === this.settingsOverlay) {
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
            document.getElementById('selectedDateDisplay').textContent = displayDate;
            this.settingsOverlay.classList.add('active');
        });
    }

    closeSettingsPopup() {
        this.settingsOverlay.classList.remove('active');
    }

    /* ========== Кнопка "Смотреть тренировку" ========== */
    setupViewWorkoutButton() {
        if (!this.viewWorkoutBtn) return;
        this.viewWorkoutBtn.addEventListener('click', () => {
            if (this.selectedDate) {
                window.location.href = `workout.html?date=${this.selectedDate}`;
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CalendarPage();
});
