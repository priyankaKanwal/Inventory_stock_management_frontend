import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html'
})
export class ModalComponent {

  @Input() isOpen = false;
  @Input() title = '';
  @Input() maxWidth = '560px';
  @Input() showFooter = true;

  @Output() closeEvent = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeEvent.emit();
    }
  }

  close(): void {
    this.closeEvent.emit();
  }
}