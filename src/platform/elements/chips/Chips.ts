// NG2
import { Component, EventEmitter, Input, Output, forwardRef, ElementRef, OnInit, OnDestroy, ViewChild, ViewContainerRef, HostBinding } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
// Vendor
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { debounceTime } from 'rxjs/operators';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
// APP

import { KeyCodes } from '../../utils/key-codes/KeyCodes';
import { Helpers } from '../../utils/Helpers';
import { NovoLabelService } from '../../services/novo-label-service';
import { ComponentUtils } from '../../utils/component-utils/ComponentUtils';
import { ChipsStateService, CHIPS_STATE } from './ChipsStateService';
import { ChipsDataService } from './ChipsDataService';

// Value accessor for the component (supports ngModel)
const CHIPS_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => NovoChipsElement),
  multi: true,
};

@Component({
  selector: 'chip,novo-chip',
  template: `
        <span (click)="onSelect($event)" (mouseover)="onSelect($event)" [ngClass]="_type">
            <i *ngIf="_type" class="bhi-circle"></i>
            <span><ng-content></ng-content></span>
        </span>
        <i class="bhi-close" *ngIf="!disabled" (click)="onRemove($event)"></i>
    `,
})
export class NovoChipElement {
  @Input()
  set type(type: string) {
    this._type = type ? type.toLowerCase() : null;
  }

  @Input()
  disabled: boolean = false;

  @Output()
  select: EventEmitter<any> = new EventEmitter();
  @Output()
  remove: EventEmitter<any> = new EventEmitter();

  entity: string;
  _type: string;

  onRemove(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    this.remove.emit(e);
    return false;
  }

  onSelect(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    this.select.emit(e);
    return false;
  }
}

@Component({
  selector: 'chips,novo-chips',
  providers: [CHIPS_VALUE_ACCESSOR, ChipsStateService],
  template: `
        <chip
            *ngFor="let item of _items | async"
            [type]="type || item?.value?.searchEntity"
            [class.selected]="item == selected"
            [disabled]="disablePickerInput"
            (remove)="remove($event, item)"
            (select)="select($event, item)">
            {{ item.label }}
        </chip>
        <div class="chip-input-container">
            <novo-picker
                clearValueOnSelect="true"
                [closeOnSelect]="closeOnSelect"
                [config]="source"
                [disablePickerInput]="disablePickerInput"
                [placeholder]="actualPlaceholder"
                [(ngModel)]="itemToAdd"
                (select)="add($event)"
                (keydown)="onKeyDown($event)"
                (focus)="onFocus($event)"
                (typing)="onTyping($event)"
                (blur)="onTouched($event)"
                [selected]="items"
                [overrideElement]="element">
            </novo-picker>
        </div>
        <div class="preview-container">
            <span #preview></span>
        </div>
        <ng-container *ngIf="pickerLoadingState">
          <novo-simple-spinner [spinnerCss]="{ 'fill': '#4a89dc' }"></novo-simple-spinner>
        </ng-container>
        <i class="bhi-search" [class.has-value]="items.length" *ngIf="!disablePickerInput && !pickerLoadingState"></i>
        <label class="clear-all" *ngIf="items.length && !disablePickerInput" (click)="clearValue()">{{ labels.clearAll }} <i class="bhi-times"></i></label>
   `,
  host: {
    '[class.with-value]': 'items.length > 0',
    '[class.disabled]': 'disablePickerInput',
  },o
})
export class NovoChipsElement implements ControlValueAccessor, OnInit, OnDestroy {
  @Input()
  closeOnSelect: boolean = false;
  @Input()
  placeholder: string = '';
  @Input()
  source: any;
  @Input()
  type: any;
  @Input()
  set disablePickerInput(v: boolean) {
    this._disablePickerInput = coerceBooleanProperty(v);
  }
  get disablePickerInput() {
    return this._disablePickerInput;
  }
  private _disablePickerInput: boolean = false;

  @Output()
  changed: EventEmitter<any> = new EventEmitter();
  @Output()
  focus: EventEmitter<any> = new EventEmitter();
  @Output()
  blur: EventEmitter<any> = new EventEmitter();
  @Output()
  typing: EventEmitter<any> = new EventEmitter();
  @Output()
  loadingStateChange: EventEmitter<any> = new EventEmitter();

  @ViewChild('preview', { read: ViewContainerRef })
  preview: ViewContainerRef;

  items: Array<any> = [];
  selected: any = null;
  config: any = {};
  model: any;
  itemToAdd: any;
  popup: any;
  // private data model
  _value: any = '';
  _items = new ReplaySubject(1);
  pickerLoadingState: boolean = false;
  actualPlaceholder: string;
  // Placeholders for the callbacks
  onModelChange: Function = () => {};
  onModelTouched: Function = () => {};

  constructor(
    public element: ElementRef,
    private componentUtils: ComponentUtils,
    public labels: NovoLabelService,
    private chipsStateService: ChipsStateService,
    private chipsDataService: ChipsDataService,
  ) {}

  ngOnInit(): void {
    this.actualPlaceholder = this.placeholder;
    this.chipsStateService.chipsStateChange.debounceTime(500).subscribe((state: CHIPS_STATE) => {
      if (state === 'LOADING') {
        this.pickerLoadingState = true;
        this.actualPlaceholder = this.labels.loading;
      } else {
        this.pickerLoadingState = false;
        this.actualPlaceholder = this.placeholder;
      }
      this.loadingStateChange.emit(state);
    });
  }

  ngOnDestroy(): void {
    this.chipsStateService.chipsStateChange.unsubscribe();
  }

  //get accessor
  get value() {
    return this._value;
  }

  //set accessor including call the onchange callback
  @Input()
  set value(selected) {
    this.itemToAdd = '';
    if (selected !== this._value) {
      this._value = selected;
      this.changed.emit({ value: selected, rawValue: this.items });
      this.onModelChange(selected);
    }
  }

  clearValue() {
    this.items = [];
    this._items.next(this.items);
    this.value = null;
    this.changed.emit({ value: this.value, rawValue: this.items });
    this.onModelChange(this.value);
  }

  setItems() {
    let loadingSet: boolean = false;
    this.items = [];
    if (this.source.getData && typeof this.source.getData === 'function') {
      this.chipsStateService.updateState('LOADING');
      loadingSet = true;
      this.source.getData().then((result: any) => {
        this.items = result;
        this._items.next(this.items);
        this.value = this.items.map((i) => i.value || i.id);
        this.onModelChange(this.value);
        this.chipsStateService.updateState('STABLE');
      });
    }
    if (this.model && Array.isArray(this.model)) {
      let noLabels = [];
      for (let value of this.model) {
        let label;
        if (this.source && this.source.format && Helpers.validateInterpolationProps(this.source.format, value)) {
          label = Helpers.interpolate(this.source.format, value);
        }
        if (this.source && label && label !== this.source.format) {
          this.items.push({
            value,
            label,
          });
        } else if (this.source.getLabels && typeof this.source.getLabels === 'function') {
          noLabels.push(value);
        } else if (this.source.options && Array.isArray(this.source.options)) {
          this.items.push(this.getLabelFromOptions(value));
        } else {
          this.items.push({
            value,
            label: value,
          });
        }
      }
      if (noLabels.length > 0 && this.source && this.source.getLabels && typeof this.source.getLabels === 'function') {
        loadingSet = true;
        this.chipsStateService.updateState('LOADING');
        this.source.getLabels(noLabels).then((result) => {
          this.chipsStateService.updateState('STABLE');
          for (let value of result) {
            if (value.hasOwnProperty('label')) {
              this.items.push({
                value,
                label: value.label,
              });
            } else if (this.source.options && Array.isArray(this.source.options)) {
              this.items.push(this.getLabelFromOptions(value));
            } else {
              this.items.push(value);
            }
          }
          this._items.next(this.items);
        });
      }
    }
    this.changed.emit({ value: this.model, rawValue: this.items });
    this._items.next(this.items);
<<<<<<< HEAD
  }

  getLabelFromOptions(value) {
    let optLabel = this.source.options.find((val) => val.value === value);
    return {
      value,
      label: optLabel ? optLabel.label : value,
    };
  }

  deselectAll(event?) {
    this.selected = null;
    this.hidePreview();
  }

  select(event?, item?) {
    this.blur.emit(event);
    this.deselectAll();
    this.selected = item;
    this.showPreview();
  }

  onTyping(event?) {
    this.typing.emit(event);
  }

  onFocus(event?) {
    this.deselectAll();
    this.element.nativeElement.classList.add('selected');
    this.focus.emit(event);
  }

=======
    if (!loadingSet) {
      this.chipsStateService.updateState('STABLE');
    }
    this._items.next(this.items);
  }

  getLabelFromOptions(value) {
    let optLabel = this.source.options.find((val) => val.value === value);
    return {
      value,
      label: optLabel ? optLabel.label : value,
    };
  }

  deselectAll(event?) {
    this.selected = null;
    this.hidePreview();
  }

  select(event?, item?) {
    this.blur.emit(event);
    this.deselectAll();
    this.selected = item;
    this.showPreview();
  }

  onTyping(event?) {
    this.typing.emit(event);
  }

  onFocus(event?) {
    this.deselectAll();
    this.element.nativeElement.classList.add('selected');
    this.focus.emit(event);
  }

>>>>>>> fix(chips) - updates to load getdata and delay onInit FI execution until getData is complete
  add(event) {
    if (event && !(event instanceof Event)) {
      this.items.push(event);
      this.value = this.items.map((i) => i.value);
      // Set focus on the picker
      let input = this.element.nativeElement.querySelector('novo-picker > input');
      if (input) {
        input.focus();
      }
    }
    this._items.next(this.items);
  }

  remove(event, item) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.items.splice(this.items.indexOf(item), 1);
    this.deselectAll();
    this.value = this.items.map((i) => i.value);
    this.changed.emit({ value: this.value.length ? this.value : '', rawValue: this.items });
    this.onModelChange(this.value.length ? this.value : '');
    this._items.next(this.items);
  }

  onKeyDown(event) {
    if (event.keyCode === KeyCodes.BACKSPACE) {
      if (event.target && event.target.value.length === 0 && this.items.length) {
        if (event) {
          event.stopPropagation();
          event.preventDefault();
        }
        if (this.selected) {
          this.remove(event, this.selected);
        } else {
          this.select(event, this.items[this.items.length - 1]);
        }
      }
    }
  }

  // Set touched on blur
  onTouched(e) {
    this.element.nativeElement.classList.remove('selected');
    this.onModelTouched();
    this.blur.emit(e);
  }

  writeValue(model: any): void {
    this.model = model;
    this.setItems();
  }

  registerOnChange(fn: Function): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: Function): void {
    this.onModelTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this._disablePickerInput = disabled;
  }

  /**
   * @name showPreview
   *
   * @description This method creates an instance of the preview (called popup) and adds all the bindings to that
   * instance. Will reuse the popup or create a new one if it does not already exist. Will only work if there is
   * a previewTemplate given in the config.
   */
  showPreview() {
    if (this.source.previewTemplate) {
      if (!this.popup) {
        this.popup = this.componentUtils.appendNextToLocation(this.source.previewTemplate, this.preview);
      }
      this.popup.instance.match = this.selected;
    }
  }

  /**
   * @name hidePreview
   *
   * @description - This method deletes the preview popup from the DOM.
   */
  hidePreview() {
    if (this.popup) {
      this.popup.destroy();
      this.popup = null;
    }
  }
}
