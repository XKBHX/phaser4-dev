import EventEmitter from '../core/EventEmitter';

export default class Keyboard extends EventEmitter
{
    private keyMap: Object;
    private pressed: Object;

    private keydownHandler: { (event: KeyboardEvent): void; (this: Window, ev: KeyboardEvent): any; };
    private keyupHandler: { (event: KeyboardEvent): void; (this: Window, ev: KeyboardEvent): any; };
    private blurHandler: { (): void; (this: Window, ev: FocusEvent): any; };

    constructor ()
    {
        super();

        this.keydownHandler = (event: KeyboardEvent) => this.onKeyDown(event);
        this.keyupHandler = (event: KeyboardEvent) => this.onKeyUp(event);
        this.blurHandler = () => this.onBlur();

        window.addEventListener('keydown', this.keydownHandler);
        window.addEventListener('keyup', this.keyupHandler);
        window.addEventListener('blur', this.blurHandler);

        this.keyMap = {
            'Enter': 'enter',
            'Escape': 'esc',
            'Space': 'space',
            'ArrowLeft': 'left',
            'ArrowUp': 'up',
            'ArrowRight': 'right',
            'ArrowDown': 'down',
            // MS Edge
            13: 'enter',
            27: 'esc',
            32: 'space',
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down'
        };

        //  This nice bit of code is from kontra.js
        for (let i = 0; i < 26; i++)
        {
            this.keyMap[i + 65] = this.keyMap['Key' + String.fromCharCode(i + 65)] = String.fromCharCode(i + 97);
        }

        this.pressed = {};
    }

    private onBlur ()
    {
        this.pressed = {};
    }

    private onKeyDown (event: KeyboardEvent)
    {
        let key = this.keyMap[event.code || event.which];

        if (key)
        {
            event.preventDefault();

            this.pressed[key] = true;

            //  Key specific event
            this.emit('keydown-' + key, event);
        }

        //  Global keydown event
        this.emit('keydown', event);
    }

    private onKeyUp (event: KeyboardEvent)
    {
        let key = this.keyMap[event.code || event.which];

        if (key)
        {
            this.pressed[key] = false;

            //  Key specific event
            this.emit('keyup-' + key, event);
        }

        //  Global keyup event
        this.emit('keyup', event);
    }

    isDown (key: string): boolean
    {
        return !!this.pressed[key];
    }

}