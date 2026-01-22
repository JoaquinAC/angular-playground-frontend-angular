import {
  Component,
  Input,
  forwardRef,
  HostListener
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';

@Component({
  selector: 'app-custom-select',
  templateUrl: './custom-select.component.html',
  styleUrls: ['./custom-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ]
})
export class CustomSelectComponent implements ControlValueAccessor {
  @Input() options: { label: string; value: string }[] = [];
  @Input() placeholder = 'Seleccionar';

  open = false;
  value: string | null = null;

  onChange = (_: any) => {};
  onTouched = () => {};

  get selectedLabel(): string | null {
    return this.options.find(o => o.value === this.value)?.label || null;
  }

  toggle(): void {
    this.open = !this.open;
  }

  select(option: any): void {
    this.value = option.value;
    this.onChange(this.value);
    this.open = false;
  }

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-select')) {
      this.open = false;
    }
  }
}
