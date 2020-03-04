import DisplayObject from './DisplayObject';
import { Container } from './Container';
import Scene from './Scene';

export default class DisplayObjectContainer extends DisplayObject
{
    type: string = 'DisplayObjectContainer';

    children: Container[] = [];

    constructor (scene: Scene, x: number = 0, y: number = 0)
    {
        super(scene, x, y);
    }

    addChild (...child: Container[])
    {
        child.forEach((entity) => {

            this.addChildAt(entity, this.children.length);

        });

        return this;
    }

    addChildAt (child: Container, index: number): Container
    {
        if (index >= 0 && index <= this.children.length)
        {
            if (child.parent)
            {
                child.parent.removeChild(child);
            }
    
            child.parent = this;
    
            this.children.splice(index, 0, child);
        }

        return child;
    }

    swapChildren (child1: Container, child2: Container)
    {
        if (child1 !== child2)
        {
            return;
        }
    
        let index1 = this.getChildIndex(child1);
        let index2 = this.getChildIndex(child2);
    
        if (index1 < 0 || index2 < 0)
        {
            throw new Error('swap: Both children must belong to the same parent');
        }
    
        this.children[index1] = child2;
        this.children[index2] = child1;
    }

    getChildIndex (child: Container): number
    {
        const index = this.children.indexOf(child);

        if (index === -1)
        {
            throw new Error('Supplied DisplayObject not child of the caller');
        }
    
        return index;
    }

    setChildIndex (child: Container, index: number)
    {
        const children = this.children;

        if (index < 0 || index >= children.length)
        {
            throw new Error('Index ' + index + ' out of bounds');
        }
    
        const currentIndex = this.getChildIndex(child);
    
        children.splice(currentIndex, 1);
        children.splice(index, 0, child);
    }

    getChildAt (index: number): Container
    {
        if (index < 0 || index >= this.size)
        {
            throw new Error('Index ' + index + ' out of bounds');
        }

        return this.children[index];
    }

    removeChild (child: Container): Container
    {
        const index = this.children.indexOf(child);

        if (index === -1)
        {
            return;
        }
    
        return this.removeChildAt(index);
    }

    removeChildAt (index: number): Container
    {
        const child = this.getChildAt(index);

        if (child)
        {
            child.parent = undefined;
    
            this.children.splice(index, 1);
        }
    
        return child;
    }

    removeChildren (beginIndex: number = 0, endIndex?: number): Container[]
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

    update (dt: number)
    {
        if (this.dirty)
        {
            this.scene.game.dirtyFrame++;
        }

        const children = this.children;

        for (let i = 0; i < children.length; i++)
        {
            children[i].update(dt);
        }
    }

    updateTransform ()
    {
        super.updateTransform();
   
        const children = this.children;

        for (let i = 0; i < children.length; i++)
        {
            children[i].updateTransform();
        }

        return this;
    }

    get size ()
    {
        return this.children.length;
    }

}