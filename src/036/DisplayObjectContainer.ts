import DisplayObject from 'DisplayObject';

export default class DisplayObjectContainer extends DisplayObject
{
    children: DisplayObject[] = [];

    constructor ()
    {
        super();
    }

    addChild (child: DisplayObject)
    {
        return this.addChildAt(child, this.children.length);
    }

    addChildAt (child: DisplayObject, index: number): DisplayObject
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

    swapChildren (child1: DisplayObject, child2: DisplayObject)
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

    getChildIndex (child: DisplayObject): number
    {
        const index = this.children.indexOf(child);

        if (index === -1)
        {
            throw new Error('Supplied DisplayObject not child of the caller');
        }
    
        return index;
    }

    setChildIndex (child: DisplayObject, index: number)
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

    getChildAt (index: number): DisplayObject
    {
        if (index < 0 || index >= this.children.length)
        {
            throw new Error('Index ' + index + ' out of bounds');
        }
    
        return this.children[index];
    }

    removeChild (child: DisplayObject): DisplayObject
    {
        const index = this.children.indexOf(child);

        if (index === -1)
        {
            return;
        }
    
        return this.removeChildAt(index);
    }

    removeChildAt (index: number): DisplayObject
    {
        const child = this.getChildAt(index);

        if (child)
        {
            child.parent = undefined;
    
            this.children.splice(index, 1);
        }
    
        return child;
    }

    removeChildren (beginIndex: number = 0, endIndex?: number): DisplayObject[]
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

    updateTransform (parent?: DisplayObjectContainer)
    {
        if (!this.visible)
        {
            return;
        }

        super.updateTransform(parent);
   
        const children = this.children;

        for (let i = 0; i < children.length; i++)
        {
            children[i].updateTransform();
        }
    }

}