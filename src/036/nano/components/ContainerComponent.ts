import IMatrix2d from '../IMatrix2d';
import IContainerChild from '../gameobjects/IContainerChild';
import { ITransformComponent } from './TransformComponent';

type Constructor<T = {}> = new (...args: any[]) => T;
type Transformable = Constructor<ITransformComponent>;

export function ContainerComponent<TBase extends Transformable>(Base: TBase)
{
    return class ContainerComponent extends Base
    {
        children: IContainerChild[];

        constructor (...args: any[])
        {
            super(args);

            this.children = [];
        }

        addChild (...child: IContainerChild[])
        {
            child.forEach((entity) => {
    
                this.addChildAt(entity, this.children.length);
    
            });
    
            return this;
        }
    
        addChildAt (child: IContainerChild, index: number): IContainerChild
        {
            if (index >= 0 && index <= this.children.length)
            {
                child.setParent(this);
        
                this.children.splice(index, 0, child);
    
                child.updateTransform();
            }
    
            return child;
        }
    
        swapChildren (child1: IContainerChild, child2: IContainerChild)
        {
            if (child1 === child2)
            {
                return this;
            }
        
            const index1: number = this.getChildIndex(child1);
            const index2: number = this.getChildIndex(child2);
        
            if (index1 < 0 || index2 < 0)
            {
                throw new Error('swap: Both children must belong to the same parent');
            }
        
            this.children[index1] = child2;
            this.children[index2] = child1;

            return this;
        }
    
        getChildIndex (child: IContainerChild): number
        {
            const index = this.children.indexOf(child);
    
            if (index === -1)
            {
                throw new Error('Supplied DisplayObject not child of the caller');
            }
        
            return index;
        }
    
        setChildIndex (child: IContainerChild, index: number)
        {
            const children = this.children;
    
            if (index < 0 || index >= children.length)
            {
                throw new Error('Index ' + index + ' out of bounds');
            }
        
            const currentIndex = this.getChildIndex(child);
        
            children.splice(currentIndex, 1);
            children.splice(index, 0, child);

            return this;
        }
    
        getChildAt (index: number): IContainerChild
        {
            if (index < 0 || index >= this.numChildren)
            {
                throw new Error('Index ' + index + ' out of bounds');
            }
    
            return this.children[index];
        }
    
        removeChild (child: IContainerChild): IContainerChild
        {
            const index = this.children.indexOf(child);
    
            if (index === -1)
            {
                return;
            }
        
            return this.removeChildAt(index);
        }
    
        removeChildAt (index: number): IContainerChild
        {
            const child = this.getChildAt(index);
    
            if (child)
            {
                child.parent = undefined;
    
                child.updateTransform();
        
                this.children.splice(index, 1);
            }
        
            return child;
        }
    
        removeChildren (beginIndex: number = 0, endIndex?: number): IContainerChild[]
        {
            const children = this.children;
    
            if (endIndex === undefined)
            {
                endIndex = children.length;
            }
        
            const range = endIndex - beginIndex;
        
            if (range > 0 && range <= endIndex)
            {
                const removed = children.splice(beginIndex, range);
        
                removed.forEach((child) => {
    
                    child.parent = undefined;
    
                    child.updateTransform();
    
                });
        
                return removed;
            }
            else if (range === 0 && children.length === 0)
            {
                return [];
            }
            else
            {
                throw new Error('Range Error. Values out of bounds');
            }
        }
    
        update (dt?: number, now?: number)
        {
            const children = this.children;
    
            for (let i = 0; i < children.length; i++)
            {
                children[i].update(dt, now);
            }
        }
    
        get numChildren (): number
        {
            return this.children.length;
        }
    }
}

export interface IContainerComponent
{
    children: IContainerChild[];
    numChildren: number;
    worldTransform: IMatrix2d;
    addChild (...child: IContainerChild[]): this;
    addChildAt (child: IContainerChild, index: number): IContainerChild;
    swapChildren (child1: IContainerChild, child2: IContainerChild): this;
    getChildIndex (child: IContainerChild): number;
    setChildIndex (child: IContainerChild, index: number): this;
    getChildAt (index: number): IContainerChild;
    removeChild (child: IContainerChild): IContainerChild;
    removeChildAt (index: number): IContainerChild;
    removeChildren (beginIndex: number, endIndex?: number): IContainerChild[];
    update (dt?: number, now?: number): void;
}
