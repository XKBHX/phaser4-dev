import IInteractiveArea from './IInteractiveArea';

type Constructor<T = {}> = new (...args: any[]) => T;

export function InputComponent<TBase extends Constructor>(Base: TBase)
{
    return class InputComponent extends Base
    {
        inputEnabled: boolean = false;
        inputEnabledChildren: boolean = true;
        inputHitArea: IInteractiveArea;
        
        setInteractive (hitArea?: IInteractiveArea)
        {
            this.inputEnabled = true;
            this.inputHitArea = hitArea;
            this.inputEnabledChildren = true;
    
            return this;
        }
    };
}

export interface IInputComponent
{
    inputEnabled: boolean;
    inputEnabledChildren: boolean;
    inputHitArea?: IInteractiveArea;
    setInteractive (hitArea?: IInteractiveArea): this;
}
