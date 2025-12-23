// src/app/services/toast.service.ts
import { Injectable } from '@angular/core';
import { ToastController, ToastOptions } from '@ionic/angular';

type ToastType = 'success' | 'error' | 'warning' | 'info';

@Injectable({
    providedIn: 'root'
})
export class ToastService {

    constructor(private toastController: ToastController) { }

    /**
     * Muestro una notificación Toast con un estilo predefinido.
     * @param message El mensaje a mostrar.
     * @param type El tipo de mensaje ('success', 'error', 'warning', 'info').
     * @param duration Duración en milisegundos.
     */
    public async presentToast(
        message: string,
        type: ToastType = 'info',
        duration: number = 3000
    ): Promise<void> {
        // Lógica para configurar y presentar el toast (usando switch, colores, e iconos)
        let options: ToastOptions = {
            message: message,
            duration: duration,
            position: 'bottom',
            buttons: [{ text: 'X', role: 'cancel' }]
        };

        switch (type) {
            case 'success':
                options.color = 'success';
                options.icon = 'checkmark-circle-outline';
                break;
            case 'error':
                options.color = 'danger';
                options.icon = 'alert-circle-outline';
                options.duration = 5000;
                break;
            case 'warning':
                options.color = 'warning';
                options.icon = 'warning-outline';
                break;
            case 'info':
            default:
                options.color = 'medium';
                options.icon = 'information-circle-outline';
                break;
        }

        const toast = await this.toastController.create(options);
        await toast.present();
    }
}