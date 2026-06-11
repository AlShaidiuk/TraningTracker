class CalendarPage {
    constructor() {
        this.today = new Date();
        this.currentMonth = this.today.getMonth();
        this.currentYear = this.today.getFullYear();

        this.plannedDates = [];
        this.selectedDate = null;
        this.selectedElement = null;

        this.viewWorkoutBtn = document.getElementById('viewWorkoutBtn');
        this.settingsOverlay = document.getElementById('settingsOverlay');
        this.templateSelectionOverlay = document.getElementById('templateSelectionOverlay');
        this.createTemplateOverlay = document.getElementById('createTemplateOverlay');
        this.templateList = document.getElementById('templateList');
        this.noTemplatesMessage = document.getElementById('noTemplatesMessage');
        this.exercisesContainer = document.getElementById('exercisesContainer');

        this.templates = [];
        this.currentExercises = [];   // массив объектов { name, sets, maxReps, bodyweight }

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

    async createTemplate(templateData) {
        try {
            const newRef = firebase.database().ref('templates').push();
            await newRef.set({
                ...templateData,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            this.templates.push({ id: newRef.key, name: templateData.name });
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

        isPastDay(dateStr) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return date < todayStart;
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

    /* ========== Попап создания шаблона с упражнениями ========== */
    setupCreateTemplate() {
        document.getElementById('cancelCreateTemplateBtn').addEventListener('click', () => {
            this.closeCreateTemplatePopup();
            this.openTemplateSelectionPopup();
        });

        document.getElementById('saveTemplateBtn').addEventListener('click', async () => {
            const nameInput = document.getElementById('templateNameInput');
            const name = nameInput.value.trim();
            if (name === '') {
                alert('Введите название шаблона');
                return;
            }

            const exercises = this.collectExercisesData();
            if (exercises.length === 0) {
                alert('Добавьте хотя бы одно упражнение');
                return;
            }

            const newId = await this.createTemplate({ name, exercises });
            if (newId) {
                nameInput.value = '';
                this.currentExercises = [];
                this.closeCreateTemplatePopup();
                this.openTemplateSelectionPopup();
            }
        });

        document.getElementById('addExerciseBtn').addEventListener('click', () => {
            this.addExerciseRow();
        });
    }

    openCreateTemplatePopup() {
        // Сбрасываем и добавляем одно пустое упражнение
        this.currentExercises = [{ name: '', sets: 3, maxReps: 10, bodyweight: false }];
        this.renderExercises();
        document.getElementById('templateNameInput').value = '';
        this.createTemplateOverlay.classList.add('active');
    }

    closeCreateTemplatePopup() {
        this.createTemplateOverlay.classList.remove('active');
    }

    addExerciseRow() {
        this.currentExercises.push({ name: '', sets: 3, maxReps: 10, bodyweight: false });
        this.renderExercises();
    }

    removeExerciseRow(index) {
        this.currentExercises.splice(index, 1);
        this.renderExercises();
    }

    renderExercises() {
        if (!this.exercisesContainer) return;
        this.exercisesContainer.innerHTML = '';

        this.currentExercises.forEach((exercise, index) => {
            const row = document.createElement('div');
            row.className = 'exercise-row';
            row.innerHTML = `
                <input type="text" class="exercise-name" value="${this.escapeHtml(exercise.name)}" placeholder="Упражнение">
                <input type="number" class="exercise-sets" value="${exercise.sets}" min="1" max="20" placeholder="Подходы">
                <input type="number" class="exercise-max-reps" value="${exercise.maxReps}" min="1" max="100" placeholder="Повторы">
                <label>
                    <input type="checkbox" class="exercise-bodyweight" ${exercise.bodyweight ? 'checked' : ''}>
                    Свой вес
                </label>
                <button class="remove-exercise" title="Удалить">×</button>
            `;

            // Обработчики для синхронизации данных
            const nameInput = row.querySelector('.exercise-name');
            const setsInput = row.querySelector('.exercise-sets');
            const maxRepsInput = row.querySelector('.exercise-max-reps');
            const bodyweightCheck = row.querySelector('.exercise-bodyweight');
            const removeBtn = row.querySelector('.remove-exercise');

            nameInput.addEventListener('input', (e) => {
                this.currentExercises[index].name = e.target.value;
            });
            setsInput.addEventListener('input', (e) => {
                this.currentExercises[index].sets = parseInt(e.target.value) || 1;
            });
            maxRepsInput.addEventListener('input', (e) => {
                this.currentExercises[index].maxReps = parseInt(e.target.value) || 1;
            });
            bodyweightCheck.addEventListener('change', (e) => {
                this.currentExercises[index].bodyweight = e.target.checked;
            });
            removeBtn.addEventListener('click', () => {
                this.removeExerciseRow(index);
            });

            this.exercisesContainer.appendChild(row);
        });
    }

    collectExercisesData() {
        // Данные уже актуальны в this.currentExercises благодаря обработчикам
        // Фильтруем упражнения с пустым названием (можно пропустить, но лучше не сохранять)
        return this.currentExercises.filter(ex => ex.name.trim() !== '');
    }

    escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, m => map[m]);
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
    const addBtn = document.getElementById('addWorkoutBtn');

    document.getElementById('addWorkoutBtn').addEventListener('click', () => {
        // Дополнительная страховка
        if (this.selectedDate && this.isPastDay(this.selectedDate)) {
            alert('Нельзя добавлять тренировки в прошлом.');
            return;
        }
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

        // Блокируем добавление для прошлых дней
        const past = this.isPastDay(this.selectedDate);
        if (addBtn) {
            addBtn.disabled = past;
            if (past) {
                addBtn.title = 'Нельзя добавить тренировку на прошедшую дату';
            } else {
                addBtn.title = '';
            }
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
