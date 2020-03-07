import EventEmitter from './EventEmitter';
import Vec2 from './Vec2';
import { Container } from './Container';
import Sprite from './Sprite';
import GlobalToLocal from './GlobalToLocal';
import IMatrix2d from './IMatrix2d';
import AppendMatrix2d from './AppendMatrix2d';

export default class Mouse extends EventEmitter
{
    public primaryDown: boolean = false;
    public auxDown: boolean = false;
    public secondaryDown: boolean = false;

    private target: HTMLElement;
    private resolution: number = 1;

    private mousedownHandler: { (event: MouseEvent): void; (this: Window, ev: MouseEvent): any; };
    private mouseupHandler: { (event: MouseEvent): void; (this: Window, ev: MouseEvent): any; };
    private mousemoveHandler: { (event: MouseEvent): void; (this: Window, ev: MouseEvent): any; };
    private blurHandler: { (): void; (this: Window, ev: FocusEvent): any; };

    public localPoint: Vec2;
    private transPoint: Vec2;

    constructor (target: HTMLElement)
    {
        super();

        this.mousedownHandler = (event: MouseEvent) => this.onMouseDown(event);
        this.mouseupHandler = (event: MouseEvent) => this.onMouseUp(event);
        this.mousemoveHandler = (event: MouseEvent) => this.onMouseMove(event);
        this.blurHandler = () => this.onBlur();

        target.addEventListener('mousedown', this.mousedownHandler);
        target.addEventListener('mouseup', this.mouseupHandler);
        window.addEventListener('blur', this.blurHandler);
        window.addEventListener('mousemove', this.mousemoveHandler);

        this.localPoint = new Vec2();
        this.transPoint = new Vec2();

        this.target = target;
    }

    private onBlur ()
    {
    }

    private onMouseDown (event: MouseEvent)
    {
        this.positionToPoint(event);

        this.primaryDown = (event.button === 0);
        this.auxDown = (event.button === 1);
        this.secondaryDown = (event.button === 2);

        this.emit('pointerdown', this.localPoint.x, this.localPoint.y, event.button, event);
    }

    private onMouseUp (event: MouseEvent)
    {
        this.positionToPoint(event);

        this.primaryDown = !(event.button === 0);
        this.auxDown = !(event.button === 1);
        this.secondaryDown = !(event.button === 2);

        this.emit('pointerup', this.localPoint.x, this.localPoint.y, event.button, event);
    }

    private onMouseMove (event: MouseEvent)
    {
        this.positionToPoint(event);

        this.emit('pointermove', this.localPoint.x, this.localPoint.y, event);
    }

    positionToPoint (event: MouseEvent): Vec2
    {
        const local = this.localPoint;

        //  if the event has offsetX/Y we can use that directly, as it gives us a lot better
        //  result, taking into account things like css transforms

        if (typeof event.offsetX === 'number')
        {
            local.set(event.offsetX, event.offsetY);
        }
        else
        {
            const rect = this.target.getBoundingClientRect();
            const width = this.target.hasAttribute('width') ? this.target['width'] : 0;
            const height = this.target.hasAttribute('height') ? this.target['height'] : 0;
            const multiplier = 1 / this.resolution;
    
            local.x = ((event.clientX - rect.left) * (width / rect.width)) * multiplier;
            local.y = ((event.clientY - rect.top) * (height / rect.height)) * multiplier;
        }

        return local;
    }

    hitTest (sprite: Sprite)
    {
        if (!sprite.visible || !sprite.inputEnabled)
        {
            return false;
        }

        const mat = AppendMatrix2d(sprite.scene.camera.worldTransform, sprite.worldTransform);

        GlobalToLocal(mat, this.localPoint.x, this.localPoint.y, this.transPoint);

        const px = this.transPoint.x;
        const py = this.transPoint.y;

        if (sprite.inputHitArea)
        {
            return sprite.inputHitArea.contains(px, py);
        }
        else
        {
            const left: number = -(sprite.width * sprite.originX);
            const right: number = left + sprite.width;
            const top: number = -(sprite.height * sprite.originY);
            const bottom: number = top + sprite.height;
    
            return (px >= left && px <= right && py >= top && py <= bottom);
        }
    }

}
