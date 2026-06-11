class TemplatesPage {
    constructor() {
        this.templates = [];
        this.templatesListEl = document.getElementById('templatesList');
        this.noTemplatesMessage = document.getElementById('noTemplatesMessage');
        this.editOverlay = document.getElementById('editTemplateOverlay');
        this.editNameInput = document.getElementById('editTemplateNameInput');
        this.editExercisesContainer = document.getElementById('editExercisesContainer');
        this.currentEditTemplateId = null;
        this.currentExercises = []; // массив объектов упражнений для редактора

        this.init();
    }

    async init() {
        await this.loadTemplates();
        this.render();
        this.setupEditModal();
    }

    async loadTemplates() {
        try {
            const snapshot = await firebase.database().ref('templates').once('value');
            const data = snapshot.val();
            this.templates = data ? Object.entries(data).map(([id, value]) => ({
                id,
                name: value.name,
                exercises: value.exercises || []
            })) : [];
        } catch (error) {
            console.error('Ошибка загрузки шаблонов:', error);
            this.templates = [];
        }
    }

    render() {
        if (!this.templatesListEl) return;

        if (this.templates.length === 0) {
            this.templatesListEl.innerHTML = '';
            this.noTemplatesMessage.style.display = 'block';
            return;
        }

        this.noTemplatesMessage.style.display = 'none';

        let html = '<ul class="template-manage-list">';
        this.templates.forEach(template => {
            const exerciseCount = template.exercises ? template.exercises.length : 0;
            html += `
                <li class="template-manage-item">
                    <div>
                        <span class="template-name">${this.escapeHtml(template.name)}</span>
                        <span class="template-exercise-count">(${exerciseCount} упр.)</span>
                    </div>
                    <div class="template-actions">
                        <button class="btn btn-small btn-primary edit-template-btn" data-id="${template.id}">✏️</button>
                        <button class="btn btn-small btn-danger delete-template-btn" data-id="${template.id}">🗑️</button>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        this.templatesListEl.innerHTML = html;

        document.querySelectorAll('.delete-template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.deleteTemplate(id);
            });
        });

        document.querySelectorAll('.edit-template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.openEditModal(id);
            });
        });
    }

    escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    async deleteTemplate(id) {
        if (!confirm('Удалить этот шаблон? Тренировки, привязанные к нему, останутся.')) return;
        try {
            await firebase.database().ref(`templates/${id}`).remove();
            this.templates = this.templates.filter(t => t.id !== id);
            this.render();
        } catch (error) {
            console.error('Ошибка удаления шаблона:', error);
            alert('Не удалось удалить шаблон.');
        }
    }

    // ========== Редактирование шаблона ==========
    openEditModal(id) {
        const template = this.templates.find(t => t.id === id);
        if (!template) return;

        this.currentEditTemplateId = id;
        this.editNameInput.value = template.name;
        // Копируем упражнения (глубокая копия, чтобы не менять оригинал до сохранения)
        this.currentExercises = template.exercises.map(ex => ({ ...ex }));
        this.renderEditExercises();
        this.editOverlay.classList.add('active');
    }

    closeEditModal() {
        this.editOverlay.classList.remove('active');
        this.currentEditTemplateId = null;
        this.currentExercises = [];
    }

    addExerciseToEdit() {
        this.currentExercises.push({ name: '', sets: 3, maxReps: 10, bodyweight: false });
        this.renderEditExercises();
    }

    removeExerciseFromEdit(index) {
        this.currentExercises.splice(index, 1);
        this.renderEditExercises();
    }

    renderEditExercises() {
        if (!this.editExercisesContainer) return;
        this.editExercisesContainer.innerHTML = '';

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
                this.removeExerciseFromEdit(index);
            });

            this.editExercisesContainer.appendChild(row);
        });
    }

    setupEditModal() {
        document.getElementById('saveEditTemplateBtn').addEventListener('click', async () => {
            const newName = this.editNameInput.value.trim();
            if (!newName) {
                alert('Название не может быть пустым');
                return;
            }
            const exercises = this.currentExercises.filter(ex => ex.name.trim() !== '');
            if (exercises.length === 0) {
                alert('Добавьте хотя бы одно упражнение');
                return;
            }

            if (this.currentEditTemplateId) {
                try {
                    await firebase.database().ref(`templates/${this.currentEditTemplateId}`).update({
                        name: newName,
                        exercises: exercises
                    });
                    // Обновляем локально
                    const t = this.templates.find(t => t.id === this.currentEditTemplateId);
                    if (t) {
                        t.name = newName;
                        t.exercises = exercises;
                    }
                    this.render();
                    this.closeEditModal();
                } catch (error) {
                    console.error('Ошибка обновления:', error);
                    alert('Не удалось сохранить изменения.');
                }
            }
        });

        document.getElementById('cancelEditTemplateBtn').addEventListener('click', () => {
            this.closeEditModal();
        });

        this.editOverlay.addEventListener('click', (e) => {
            if (e.target === this.editOverlay) {
                this.closeEditModal();
            }
        });

        document.getElementById('addExerciseInEditBtn').addEventListener('click', () => {
            this.addExerciseToEdit();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TemplatesPage();
});
