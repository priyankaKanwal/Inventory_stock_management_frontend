import { Injectable } from '@angular/core';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {

  private container: HTMLElement | null = null;
  private toasts: Toast[] = [];
  private nextId = 1;

  success(message: string, duration = 3500): void {
    this.push('success', message, duration);
  }

  error(message: string, duration = 3500): void {
    this.push('error', message, duration);
  }

  info(message: string, duration = 3500): void {
    this.push('info', message, duration);
  }

  private push(type: ToastType, message: string, duration: number): void {
    const toast: Toast = {
      id: this.nextId++,
      type,
      message
    };

    this.toasts.push(toast);
    this.render(toast);

    setTimeout(() => {
      this.dismiss(toast.id);
    }, duration);
  }

  private getContainer(): HTMLElement {
    if (this.container) {
      return this.container;
    }

    this.container = document.createElement('div');
    this.container.className =
      'fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2';
    document.body.appendChild(this.container);

    return this.container;
  }

  private render(toast: Toast): void {
    const host = this.getContainer();

    const element = document.createElement('div');
    element.id = `toast-${toast.id}`;
    element.setAttribute('role', toast.type === 'error' ? 'alert' : 'status');
    element.className = [
      'pointer-events-auto',
      'rounded-xl',
      'border',
      'px-4',
      'py-3',
      'text-sm',
      'font-medium',
      'shadow-lg',
      'backdrop-blur',
      'animate-[slideIn_0.2s_ease-out]',
      toast.type === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
        : toast.type === 'error'
          ? 'border-rose-200 bg-rose-50 text-rose-800'
          : 'border-blue-200 bg-blue-50 text-blue-800'
    ].join(' ');

    element.textContent = toast.message;

    host.appendChild(element);
  }

  private dismiss(id: number): void {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);

    if (!this.container) {
      return;
    }

    const element = this.container.querySelector(`#toast-${id}`);

    if (element) {
      element.remove();
    }

    if (this.container.children.length === 0) {
      this.container.remove();
      this.container = null;
    }
  }
}