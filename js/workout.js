class WorkoutPage {
    constructor() {
        this.dateStr = this.getDateFromUrl();
        this.workoutData = null;   // данные из plannedWorkouts/{date}
        this.template = null;      // объект шаблона (name, exercises[])
        this.savedSets = {};       // ключ: exerciseIndex_setIndex, значение: { reps, weight }
        this.completedSets = {};   // ключ: exerciseIndex, значение: number (сколько подходов завершено)

        this.init();
    }

    getDateFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('date');
    }

    async init() {
        if (!this.dateStr) {
            document.getElementById('workoutHeader').innerHTML = '<h2>Дата не указана</h2>';
            return;
        }

        await this.loadWorkoutData();
        if (!this.workoutData || !this.workoutData.templateId) {
            document.getElementById('workoutHeader').innerHTML = '<h2>Тренировка не найдена</h2>';
            return;
        }

        await this.loadTemplate();
        await this.loadSavedProgress();
        this.render();
        this.setupFinishWorkoutButton();
    }

    async loadWorkoutData() {
        try {
            const snap = await firebase.database().ref(`plannedWorkouts/${this.dateStr}`).once('value');
            this.workoutData = snap.val();
        } catch (e) {
            console.error(e);
        }
    }

    async loadTemplate() {
        const templateId = this.workoutData.templateId;
        if (!templateId || templateId === 'default') {
            this.template = { name: 'Без шаблона', exercises: [] };
            return;
        }
        try {
            const snap = await firebase.database().ref(`templates/${templateId}`).once('value');
            this.template = snap.val() || { name: 'Шаблон удалён', exercises: [] };
        } catch (e) {
            console.error(e);
            this.template = { name: 'Ошибка загрузки', exercises: [] };
        }
    }

    // Загружаем сохранённые данные по подходам
    async loadSavedProgress() {
        try {
            const snap = await firebase.database().ref(`workoutData/${this.dateStr}`).once('value');
            const data = snap.val();
            if (data) {
                this.savedSets = data.savedSets || {};
                this.completedSets = data.completedSets || {};
            }
        } catch (e) {
            console.error(e);
        }
    }

    // Сохранение завершённого подхода в облако
    async saveSetProgress(exerciseIndex, setIndex, reps, weight) {
        const key = `${exerciseIndex}_${setIndex}`;
        this.savedSets[key] = { reps, weight };

        if (!this.completedSets[exerciseIndex]) {
            this.completedSets[exerciseIndex] = 0;
        }
        // Увеличиваем счётчик завершённых подходов, если этот подход ещё не был учтён
        const alreadyCompleted = this.completedSets[exerciseIndex] > setIndex;
        if (!alreadyCompleted) {
            this.completedSets[exerciseIndex] = setIndex + 1;
        }

        try {
            await firebase.database().ref(`workoutData/${this.dateStr}`).set({
                savedSets: this.savedSets,
                completedSets: this.completedSets
            });
        } catch (e) {
            console.error('Ошибка сохранения:', e);
        }
    }

    render() {
        const headerDiv = document.getElementById('workoutHeader');
        const dateObj = new Date(this.dateStr + 'T00:00:00');
        const dateFormatted = dateObj.toLocaleDateString('ru-RU', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
        headerDiv.innerHTML = `<h2>${this.template.name || 'Тренировка'}</h2><p>${dateFormatted}</p>`;

        const container = document.getElementById('workoutTableContainer');
        if (!this.template.exercises || this.template.exercises.length === 0) {
            container.innerHTML = '<p>В шаблоне нет упражнений.</p>';
            return;
        }

        // Строим таблицу
        let html = '<table class="workout-table"><thead><tr><th>Упражнение</th>';

        // Определяем максимальное число подходов среди всех упражнений (для колонок)
        const maxSets = Math.max(...this.template.exercises.map(ex => ex.sets || 1));

        for (let s = 1; s <= maxSets; s++) {
            html += `<th class="set-col" colspan="2">Подход ${s}</th>`;
        }
        html += '<th class="finish-set-cell">Завершить подход</th></tr></thead><tbody>';

        this.template.exercises.forEach((exercise, exerciseIndex) => {
            html += '<tr>';
            html += `<td class="exercise-name">${this.escapeHtml(exercise.name)}</td>`;

            for (let s = 1; s <= maxSets; s++) {
                const setIndex = s - 1;
                const setKey = `${exerciseIndex}_${setIndex}`;
                const saved = this.savedSets[setKey] || null;
                const maxReps = exercise.maxReps || 10;
                const bodyweight = exercise.bodyweight || false;
                const repsValue = saved ? saved.reps : '';
                const weightValue = saved ? saved.weight : '';

                // Повторы
                html += `<td><input type="number" 
                    class="reps-input" 
                    data-exercise="${exerciseIndex}" 
                    data-set="${setIndex}" 
                    data-max-reps="${maxReps}"
                    placeholder="${maxReps}" 
                    value="${repsValue}" 
                    min="0"></td>`;

                // Вес (только если не собственный вес)
                if (!bodyweight) {
                    html += `<td><input type="number" 
                        class="weight-input" 
                        data-exercise="${exerciseIndex}" 
                        data-set="${setIndex}" 
                        placeholder="Вес" 
                        value="${weightValue}" 
                        min="0" step="0.5"></td>`;
                } else {
                    html += '<td></td>'; // пустая ячейка
                }
            }

            // Кнопка "Завершить подход"
            const completed = this.completedSets[exerciseIndex] || 0;
            const disabled = completed >= maxSets ? 'disabled' : '';
            html += `<td class="finish-set-cell"><button class="btn btn-primary btn-finish-set" 
                data-exercise="${exerciseIndex}" ${disabled}>Завершить подход</button></td>`;

            html += '</tr>';
        });

        html += '</tbody></table>';
        container.innerHTML = html;

        // Навешиваем обработчики
        this.setupInputListeners();
        this.setupFinishSetButtons();
    }

    escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    setupInputListeners() {
        // Подсветка повторов при вводе
        document.querySelectorAll('.reps-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const maxReps = parseInt(e.target.dataset.maxReps) || 0;
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val < maxReps) {
                    e.target.classList.add('red-warning');
                } else {
                    e.target.classList.remove('red-warning');
                }
                this.updateFinishButtonState(parseInt(e.target.dataset.exercise));
            });
        });

        document.querySelectorAll('.weight-input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.updateFinishButtonState(parseInt(e.target.dataset.exercise));
            });
        });
    }

    setupFinishSetButtons() {
        document.querySelectorAll('.btn-finish-set').forEach(button => {
            button.addEventListener('click', async (e) => {
                const exerciseIndex = parseInt(e.target.dataset.exercise);
                const maxSets = this.template.exercises[exerciseIndex].sets || 1;
                const completed = this.completedSets[exerciseIndex] || 0;
                if (completed >= maxSets) return;

                // Ищем данные текущего незавершённого подхода (setIndex = completed)
                const setIndex = completed;
                const exercise = this.template.exercises[exerciseIndex];
                const bodyweight = exercise.bodyweight || false;

                const repsInput = document.querySelector(`.reps-input[data-exercise="${exerciseIndex}"][data-set="${setIndex}"]`);
                const weightInput = bodyweight ? null : document.querySelector(`.weight-input[data-exercise="${exerciseIndex}"][data-set="${setIndex}"]`);

                const reps = repsInput ? parseInt(repsInput.value) : NaN;
                const weight = weightInput ? parseFloat(weightInput.value) : 0;

                if (isNaN(reps) || reps < 0) {
                    alert('Укажите количество повторов');
                    return;
                }
                if (!bodyweight && (isNaN(weight) || weight < 0)) {
                    alert('Укажите вес');
                    return;
                }

                // Сохраняем подход
                await this.saveSetProgress(exerciseIndex, setIndex, reps, weight || 0);

                // Блокируем кнопку, если все подходы завершены
                if (this.completedSets[exerciseIndex] >= maxSets) {
                    e.target.disabled = true;
                }
                // Обновляем состояние кнопки для этого упражнения (вдруг стали активны следующие)
                this.updateFinishButtonState(exerciseIndex);
            });
        });
    }

    // Проверяет, можно ли активировать кнопку "Завершить подход" для упражнения
    updateFinishButtonState(exerciseIndex) {
        const button = document.querySelector(`.btn-finish-set[data-exercise="${exerciseIndex}"]`);
        if (!button) return;

        const exercise = this.template.exercises[exerciseIndex];
        if (!exercise) return;

        const maxSets = exercise.sets || 1;
        const completed = this.completedSets[exerciseIndex] || 0;
        if (completed >= maxSets) {
            button.disabled = true;
            return;
        }

        const setIndex = completed; // текущий незавершённый подход
        const repsInput = document.querySelector(`.reps-input[data-exercise="${exerciseIndex}"][data-set="${setIndex}"]`);
        const weightInput = exercise.bodyweight ? null : document.querySelector(`.weight-input[data-exercise="${exerciseIndex}"][data-set="${setIndex}"]`);

        const reps = repsInput ? parseInt(repsInput.value) : NaN;
        const weightOk = exercise.bodyweight || (weightInput && !isNaN(parseFloat(weightInput.value)));

        button.disabled = !(!isNaN(reps) && reps >= 0 && weightOk);
    }

    setupFinishWorkoutButton() {
        const finishBtn = document.getElementById('finishWorkoutBtn');
        const overlay = document.getElementById('incompleteWorkoutOverlay');

        finishBtn.addEventListener('click', () => {
            // Проверяем, все ли подходы завершены
            const allCompleted = this.checkAllSetsCompleted();
            if (allCompleted) {
                this.finishWorkout();
            } else {
                overlay.classList.add('active');
            }
        });

        document.getElementById('forceFinishBtn').addEventListener('click', () => {
            overlay.classList.remove('active');
            this.finishWorkout();
        });

        document.getElementById('continueWorkoutBtn').addEventListener('click', () => {
            overlay.classList.remove('active');
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    }

    checkAllSetsCompleted() {
        if (!this.template.exercises) return true;
        for (let i = 0; i < this.template.exercises.length; i++) {
            const maxSets = this.template.exercises[i].sets || 1;
            const completed = this.completedSets[i] || 0;
            if (completed < maxSets) return false;
        }
        return true;
    }

    async finishWorkout() {
        try {
            await firebase.database().ref(`plannedWorkouts/${this.dateStr}/completed`).set(true);
            alert('Тренировка завершена!');
            window.location.href = 'index.html';
        } catch (e) {
            console.error(e);
            alert('Ошибка при завершении тренировки.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WorkoutPage();
});
