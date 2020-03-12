import EventEmitter from '../core/EventEmitter';
import Vec2 from '../math/Vec2';
import { Container } from './Container';
import Sprite from './Sprite';
import GlobalToLocal from '../GlobalToLocal';
import IMatrix2d from '../math/IMatrix2d';
import AppendMatrix2d from '../math/AppendMatrix2d';
import DisplayObjectContainer from './DisplayObjectContainer';

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
    public hitPoint: Vec2;
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
        window.addEventListener('mouseup', this.mouseupHandler);
        window.addEventListener('blur', this.blurHandler);
        window.addEventListener('mousemove', this.mousemoveHandler);

        this.localPoint = new Vec2();
        this.hitPoint = new Vec2();
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

    getInteractiveChildren (parent: DisplayObjectContainer, results: DisplayObjectContainer[])
    {
        const children = parent.children;

        for (let i = 0; i < children.length; i++)
        {
            let child = children[i];

            if (child.visible && child.inputEnabled)
            {
                results.push(child as DisplayObjectContainer);
            }

            if (child.inputEnabledChildren && child.size > 0)
            {
                this.getInteractiveChildren(child as DisplayObjectContainer, results);
            }
        }
    }

    checkHitArea (entity: DisplayObjectContainer, px: number, py: number): boolean
    {
        if (entity.inputHitArea)
        {
            if (entity.inputHitArea.contains(px, py))
            {
                return true;
            }
        }
        else
        {
            const left: number = -(entity.width * entity.originX);
            const right: number = left + entity.width;
            const top: number = -(entity.height * entity.originY);
            const bottom: number = top + entity.height;
    
            return (px >= left && px <= right && py >= top && py <= bottom);
        }

        return false;
    }

    hitTest (...entities: DisplayObjectContainer[]): boolean
    {
        const localX = this.localPoint.x;
        const localY = this.localPoint.y;
        const point = this.transPoint;

        for (let i: number = 0; i < entities.length; i++)
        {
            let entity = entities[i];

            let mat = AppendMatrix2d(entity.scene.camera.worldTransform, entity.worldTransform);

            GlobalToLocal(mat, localX, localY, point);

            if (this.checkHitArea(entity, point.x, point.y))
            {
                this.hitPoint.set(point.x, point.y);
                return true;
            }
        }

        return false;
    }

    hitTestChildren (container: DisplayObjectContainer, topOnly: boolean = true): DisplayObjectContainer[]
    {
        const output = [];

        if (!container.visible)
        {
            return output;
        }

        //  Build a list of potential input candidates
        const candidates: DisplayObjectContainer[] = [];

        if (container.inputEnabled)
        {
            candidates.push(container);
        }

        if (container.inputEnabledChildren && container.size > 0)
        {
            this.getInteractiveChildren(container, candidates);
        }

        // const camera = container.scene.camera;

        // const localX = this.localPoint.x;
        // const localY = this.localPoint.y;
        // const point = this.transPoint;

        for (let i: number = candidates.length - 1; i >= 0; i--)
        {
            let entity = candidates[i];

            if (this.hitTest(entity))
            {
                output.push(entity);

                if (topOnly)
                {
                    break;
                }
            }
        }

        return output;

            /*
            let mat = AppendMatrix2d(camera.worldTransform, entity.worldTransform);

            GlobalToLocal(mat, localX, localY, point);

            let px = point.x;
            let py = point.y;
        
            if (entity.inputHitArea)
            {
                if (entity.inputHitArea.contains(px, py))
                {
                    output.push(entity);

                    if (topOnly)
                    {
                        break;
                    }
                }
            }
            else
            {
                const left: number = -(entity.width * entity.originX);
                const right: number = left + entity.width;
                const top: number = -(entity.height * entity.originY);
                const bottom: number = top + entity.height;
        
                if (px >= left && px <= right && py >= top && py <= bottom)
                {
                    output.push(entity);

                    if (topOnly)
                    {
                        break;
                    }
                }
            }
            */
    }

}
