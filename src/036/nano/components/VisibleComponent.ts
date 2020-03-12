type Constructor<T = {}> = new (...args: any[]) => T;

export function VisibleComponent<TBase extends Constructor>(Base: TBase)
{
    return class VisibleComponent extends Base
    {
        visible: boolean = true;

        setVisible (value: boolean)
        {
            this.visible = value;
    
            return this;
        }
    };
}

export interface IVisibleComponent
{
    visible: boolean;
    setVisible (value: boolean): this;
}
