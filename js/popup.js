// Модуль управления поп-ап окнами
class PopupManager {
    constructor(calendar) {
        this.calendar = calendar;
        this.popupOverlay = document.getElementById('popupOverlay');
        this.warningOverlay = document.getElementById('warningOverlay');
        this.init();
    }

    init() {
        this.setupPopupListeners();
        this.setupWarningListeners();
    }

    showPopup() {
        this.popupOverlay.classList.add('active');
    }

    hidePopup() {
        this.popupOverlay.classList.remove('active');
    }

    showWarning() {
        this.warningOverlay.classList.add('active');
    }

    hideWarning() {
        this.warningOverlay.classList.remove('active');
    }

    setupPopupListeners() {
        // Кнопка "ДА"
        document.getElementById('popupYes').addEventListener('click', () => {
            this.hidePopup();
            this.showWarning();
        });

        // Кнопка "НЕТ"
        document.getElementById('popupNo').addEventListener('click', () => {
            this.hidePopup();
            // Здесь можно добавить логику для отмены тренировки
            console.log('Тренировка отменена');
        });

        // Кнопка "Отмена"
        document.getElementById('popupCancel').addEventListener('click', () => {
            this.hidePopup();
        });

        // Закрытие по клику на оверлей
        this.popupOverlay.addEventListener('click', (e) => {
            if (e.target === this.popupOverlay) {
                this.hidePopup();
            }
        });
    }

    setupWarningListeners() {
        // Закрытие ворнинга
        document.getElementById('closeWarning').addEventListener('click', () => {
            this.hideWarning();
        });

        // Закрытие по клику на оверлей
        this.warningOverlay.addEventListener('click', (e) => {
            if (e.target === this.warningOverlay) {
                this.hideWarning();
            }
        });
    }
}
