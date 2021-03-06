export default function AddToDOM (element: HTMLElement, parent?: string | HTMLElement): HTMLElement
{
    let target: HTMLElement;

    if (parent)
    {
        if (typeof parent === 'string')
        {
            //  Hopefully an element ID
            target = document.getElementById(parent);
        }
        else if (typeof parent === 'object' && parent.nodeType === 1)
        {
            //  Quick test for a HTMLElement
            target = parent;
        }
    }
    else if (element.parentElement)
    {
        return element;
    }

    //  Fallback, covers an invalid ID and a non HTMLElement object
    if (!target)
    {
        target = document.body;
    }

    target.appendChild(element);

    return element;
}
