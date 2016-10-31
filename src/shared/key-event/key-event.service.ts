import { Injectable }   from '@angular/core';

@Injectable()
export class KeyEventService {

    constructor() {}

    isKey($event: KeyboardEvent, key: string, altKey: boolean = false, ctrlKey: boolean = false): boolean {
        return $event.key === key &&
            $event.altKey === altKey &&
            $event.ctrlKey === ctrlKey &&
            $event.shiftKey === false &&
            $event.metaKey === false;
    }
}
