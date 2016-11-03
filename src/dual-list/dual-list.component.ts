import {
    Component,
    EventEmitter,
    Input,
    forwardRef,
    Output,
    ViewEncapsulation
}                           from '@angular/core';
import { BasicList }        from './basic-list';

import {
    NG_VALUE_ACCESSOR,
    ControlValueAccessor
}                           from '@angular/forms';
import * as _               from 'lodash';

let nextId = 0;

export const dualListControlValueAccessor: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DualListComponent),
    multi: true
};

export class DualListChange {
    source: DualListComponent;
    items: any[];
}

@Component({
    selector: 'cf-dual-list',
    templateUrl: 'dual-list.component.html',
    styleUrls: ['dual-list.component.scss'],
    providers: [dualListControlValueAccessor],
    encapsulation: ViewEncapsulation.None
})

export class DualListComponent implements ControlValueAccessor {
    static AVAILABLE_LIST_NAME = 'available';
    static SELECTED_LIST_NAME = 'selected';

    @Input() id: string = `cf-dual-list-${nextId++}`;
    @Input() height: string = '500px';
    @Input() width: string = '300px';
    @Input() attrToShow: string[] = [];
    @Input() sort: boolean = true;
    @Input() attrToSort: string[] = [];

    @Output() change: EventEmitter<DualListChange> = new EventEmitter<DualListChange>();

    availableL: BasicList = new BasicList(DualListComponent.AVAILABLE_LIST_NAME);
    selectedL: BasicList = new BasicList(DualListComponent.SELECTED_LIST_NAME);

    private _source: any[] = [];
    private _selected: any[] = [];
    private _controlValueAccessorChangeFn: (value: any) => void = (value) => {};

    onTouched: () => any = () => {};

    constructor() {}

    private _sortMyList(list) {
        if (this.sort && this.attrToSort && this.attrToSort.length > 0) {
            list = _.orderBy(list, this.attrToSort);
        }
        return list;
    }

    get selectedListId(idx): string {
        if(idx) {
            return `${this.id}-selected-` + idx.toString();
        } else {
            return `${this.id}-selected`;
        }
    }

    get availableListId(): string {
        if(idx) {
            return `${this.id}-available-` + idx.toString();
        } else {
            return `${this.id}-available`;
        }
    }

    @Input()
    get source(): any[] {
        return this._source;
    }
    set source(source: any[]) {
        /* tslint:disable */
        if (source && source != this._source && source.length > 0) {
        /* tslint:enable */
            this._source = this._sortMyList(source);
            this.availableL.list = _.cloneDeep(this._source);
        }
    }

    @Input()
    get selected(): any[] {
        return this._selected;
    }
    set selected(selected: any[]){
        /* tslint:disable */
        if (selected && selected != this._selected && selected.length > 0) {
        /* tslint:enable */
            this._selected = this._sortMyList(selected);
            this.selectedL.list = _.cloneDeep(this._selected);
        }
    }

    dropDeselected(evt: DragEvent) {
        this.drop(evt);
        this._moveItem(this.selectedL, this.availableL);
    }

    dropSelected(evt: DragEvent) {
        this.drop(evt);
        this._moveItem(this.availableL, this.selectedL);
    }

    allowDropSelected(evt: DragEvent) {
        this.allowDrop(evt, this.availableL);
    }

    allowDropDeselected(evt: DragEvent) {
        this.allowDrop(evt, this.selectedL);
    }

    allowDrop(event: DragEvent, list: BasicList) {
        event.preventDefault();
        if (!list.dragStart) {
            list.dragOver = true;
        }
        return false;
    }

    drop(event: DragEvent) {
        event.preventDefault();
        this.dragLeave();
        this.dragEnd();
    }

    private _moveItem(from: BasicList, to: BasicList) {
        to.list.push(...from.pick);
        // Remove the item from the source list
        _.remove(from.list, function (item) {
            return _.indexOf(from.pick, item) >= 0;
        });
        from.pick.splice(0, from.pick.length);
        from.pick = [];
        from.list = this._sortMyList(from.list);
        to.list = this._sortMyList(to.list);
        this._emitChangeEvent();
    }

    private _emitChangeEvent() {
        let event = new DualListChange();
        event.source = this;
        event.items = _.cloneDeep(this.selectedL.list);

        this._controlValueAccessorChangeFn(this.selectedL.list);
        this.change.emit(event);
    }

    selectItem(event: MouseEvent, item: any) {
        this._toggleItem(event, item, this.availableL);
    }

    deselectItem(event: MouseEvent, item: any) {
        this._toggleItem(event, item, this.selectedL);
    }

    isPickedToBeSelected(item: any) {
        return this._isPicked(this.availableL, item);
    }

    isPickedToBeDeselected(item: any) {
        return this._isPicked(this.selectedL, item);
    }

    _isPicked(objList: BasicList, item: any) {
        if(_.findIndex(objList.pick, item) !== -1) {
            return true;
        }
        return false;
    }

    _toggleItem(event: MouseEvent, item: any, objList: BasicList) {
        if (event) {
            event.stopPropagation();
        }
        let indexList = _.findIndex(objList.list, item);
        let indexPick = _.findIndex(objList.pick, item);
        let lastItem = objList.pick[objList.pick.length - 1];
        if(event && event.shiftKey && !_.isEqual(item, lastItem)) {
            let idx = _.findIndex(objList.list, lastItem);
            if (indexList > idx) {
                for (let i = (idx + 1); i < indexList; i += 1) {
                    this._toggleItem(null, objList.list[i], objList);
                }
            } else if (idx !== -1) {
                for (let i = (indexList + 1); i < idx; i += 1)  {
                    this._toggleItem(null, objList.list[i], objList);
                }
            }
        }
        if(indexList !== -1 && indexPick === -1) {
            objList.pick.push(item);
        } else if(indexPick !== -1) {
                objList.pick.splice(indexPick, 1);
        }
    }

    dragLeave() {
        this.availableL.dragOver = false;
        this.selectedL.dragOver = false;
    }

    dragSelected(event: DragEvent, item: any) {
        this._dragToggle(event, item, this.availableL);
    }

    dragDeselected(event: DragEvent, item: any) {
        this._dragToggle(event, item, this.selectedL);
    }

    private _dragToggle(event: DragEvent, item: any, objList: BasicList) {
        if(_.findIndex(objList.pick, item) === -1) {
            this._toggleItem(null, item, objList);
        }
        objList.dragStart = true;
        let sourceID = _.findIndex(this.source, item);
        let uniqueId: string =  this.id + '_' + sourceID.toString();
        event.dataTransfer.setData('text', uniqueId);
    }

    dragEnd() {
        this.availableL.dragStart = false;
        this.selectedL.dragStart = false;
        return false;
    }

    moveSelectAll() {
        this._moveAll(this.availableL, this.selectedL);
    }

    moveSelectedItem() {
        this._moveItem(this.availableL, this.selectedL);
    }

    moveDeselectItem() {
        this._moveItem(this.selectedL, this.availableL);
    }

    moveDeselectAll() {
        this._moveAll(this.selectedL, this.availableL);
    }

    private _moveAll(fromList: BasicList, toList: BasicList) {
        fromList.pick.splice(0, fromList.pick.length);
        fromList.list = _.cloneDeep(this.source);
        fromList.pick = fromList.list;
        this._moveItem(fromList, toList);
    }

    writeValue(selectedValues: any) {
        this.selected = selectedValues;
    }

    registerOnChange(fn: (value: any) => void) {
        this._controlValueAccessorChangeFn = fn;
    }

    registerOnTouched(fn: any) {
        this.onTouched = fn;
    }

    onDualListAvailableKeydown(event: Event) {
        this.onDualListkeydown(event, 'available');
    }

    onDualListSelectedKeydown(event: Event) {
        this.onDualListkeydown(event, 'selected');
    }

    private _onDualListKeydown(event: Event, type: string) {
        if (type === 'selected') {

        } else if (type === 'available') {

        }

        if(this.isKey($event, 'ArrowUp')) {
            $event.stopPropagation();
            $event.preventDefault();
        } else if(this.isKey($event, 'ArrowUp', false, true)) {
            let previousNode = this.previousVisibleNode();
            if(previousNode != null) {
                this.service.highlightNode(previousNode);
            }

            $event.stopPropagation();
            $event.preventDefault();
        } else if(this.isKey($event, 'ArrowDown')) {
            let nextNode = this.nextVisibleNode();
            if(nextNode != null) {
                this.service.highlightNode(nextNode);
                this.service.selectNode(nextNode);
            }

            $event.stopPropagation();
            $event.preventDefault();
        } else if(this.isKey($event, 'ArrowDown', false, true)) {
            let nextNode = this.nextVisibleNode();
            if(nextNode != null) {
                this.service.highlightNode(nextNode);
            }

            $event.stopPropagation();
            $event.preventDefault();
        } else if(this.isKey($event, 'Home')) {
            this.service.highlightNode(this.visibleNodes[0]);
            this.service.selectNode(this.visibleNodes[0]);

            $event.stopPropagation();
            $event.preventDefault();
        } else if(this.isKey($event, 'Home', false, true)) {
            this.service.highlightNode(this.visibleNodes[0]);

            $event.stopPropagation();
            $event.preventDefault();
        } else if(this.isKey($event, 'End')) {
            this.service.highlightNode(this.visibleNodes[this.visibleNodes.length - 1]);
            this.service.selectNode(this.visibleNodes[this.visibleNodes.length - 1]);

            $event.stopPropagation();
            $event.preventDefault();
        } else if(this.isKey($event, 'End', false, true)) {

            $event.stopPropagation();
            $event.preventDefault();
        }
    }
}
