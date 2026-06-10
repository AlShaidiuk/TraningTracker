class TemplatesPage {
    constructor() {
        this.templates = [];
        this.templatesListEl = document.getElementById('templatesList');
        this.noTemplatesMessage = document.getElementById('noTemplatesMessage');
        this.editOverlay = document.getElementById('editTemplateOverlay');
        this.editNameInput = document.getElementById('editTemplateNameInput');
        this.currentEditTemplateId = null;

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
                name: value.name
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
            html += `
                <li class="template-manage-item">
                    <span class="template-name">${this.escapeHtml(template.name)}</span>
                    <div class="template-actions">
                        <button class="btn btn-small btn-primary edit-template-btn" data-id="${template.id}">✏️</button>
                        <button class="btn btn-small btn-danger delete-template-btn" data-id="${template.id}">🗑️</button>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        this.templatesListEl.innerHTML = html;

        // Назначаем обработчики
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
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    async deleteTemplate(id) {
        if (!confirm('Удалить этот шаблон? Тренировки, привязанные к нему, останутся.')) return;

        try {
            await firebase.database().ref(`templates/${id}`).remove();
            // Обновляем локальный массив
            this.templates = this.templates.filter(t => t.id !== id);
            this.render();
        } catch (error) {
            console.error('Ошибка удаления шаблона:', error);
            alert('Не удалось удалить шаблон.');
        }
    }

    openEditModal(id) {
        const template = this.templates.find(t => t.id === id);
        if (!template) return;
        this.currentEditTemplateId = id;
        this.editNameInput.value = template.name;
        this.editOverlay.classList.add('active');
    }

    closeEditModal() {
        this.editOverlay.classList.remove('active');
        this.currentEditTemplateId = null;
    }

    setupEditModal() {
        document.getElementById('saveEditTemplateBtn').addEventListener('click', async () => {
            const newName = this.editNameInput.value.trim();
            if (!newName) {
                alert('Название не может быть пустым');
                return;
            }
            if (this.currentEditTemplateId) {
                try {
                    await firebase.database().ref(`templates/${this.currentEditTemplateId}/name`).set(newName);
                    // Обновляем локально
                    const t = this.templates.find(t => t.id === this.currentEditTemplateId);
                    if (t) t.name = newName;
                    this.render();
                    this.closeEditModal();
                } catch (error) {
                    console.error('Ошибка обновления:', error);
                    alert('Не удалось обновить.');
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
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TemplatesPage();
});
