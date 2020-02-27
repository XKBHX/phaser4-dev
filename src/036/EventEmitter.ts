class EE
{
    callback: Function;
    context: any;
    once: boolean;

    constructor (callback: Function, context: any, once: boolean = false)
    {
        this.callback = callback;
        this.context = context;
        this.once = once;
    }
}

export default class EventEmitter
{
    private _events: Map<string, Set<EE>>;

    constructor ()
    {
        this._events = new Map();
    }

    on (event: string, callback: Function, context: any = this, once: boolean = false)
    {
        if (typeof callback !== 'function')
        {
            throw new TypeError('The listener must be a function');
        }

        const listener = new EE(callback, context, once);
        const listeners = this._events.get(event);

        if (!listeners)
        {
            this._events.set(event, new Set([ listener ]));
        }
        else
        {
            listeners.add(listener);
        }

        return this;
    }

    once (event: string, callback: Function, context: any = this)
    {
        return this.on(event, callback, context, true);
    }

    /**
     * Clear an event by name.
     */
    clearEvent (event: string)
    {
        this._events.delete(event);

        return this;
    }

    /**
     * Return an array listing the events for which the emitter has registered listeners.
     */
    eventNames (): string[]
    {
        return [ ...this._events.keys() ];
    }

    /**
     * Return the listeners registered for a given event.
     */
    listeners (event: string): Function[]
    {
        const out = [];

        const listeners = this._events.get(event);

        listeners.forEach((ee) => {

            out.push(ee.callback);

        });

        return out;
    }

    /**
     * Return the number of listeners listening to a given event.
     */
    listenerCount (event: string): number
    {
        const listeners = this._events.get(event);

        return (listeners) ? listeners.size : 0;
    }

    /**
     * Calls each of the listeners registered for a given event.
     */
    emit (event: string, ...args: any[]): boolean
    {
        if (!this._events.has(event))
        {
            return false;
        }

        const listeners = this._events.get(event);

        for (const ee of listeners)
        {
            ee.callback.apply(ee.context, args);

            if (ee.once)
            {
                listeners.delete(ee);
            }
        }

        if (listeners.size === 0)
        {
            this._events.delete(event);
        }

        return true;
    }

    /**
     * Remove the listeners of a given event.
     * 
     * @param event 
     * @param callback 
     * @param context 
     * @param once 
     */
    off (event: string, callback?: Function, context?: any, once?: boolean)
    {
        if (!callback)
        {
            //  Remove all events matching the given key
            this._events.delete(event);
        }
        else
        {
            const listeners = this._events.get(event);
            const hasContext: boolean = !context;
            const hasOnce: boolean = (once !== undefined);

            for (const ee of listeners)
            {
                if (ee.callback === callback && (hasContext && ee.context === console) && (hasOnce && ee.once === once))
                {
                    listeners.delete(ee);
                }
            }

            if (listeners.size === 0)
            {
                this._events.delete(event);
            }
        }

        return this;
    }

    /**
     * Remove all listeners, or those of the specified event.
     * 
     * @param event 
     */
    removeAllListeners (event?: string)
    {
        if (!event)
        {
            this._events.clear();
        }
        else
        {
            this._events.delete(event);
        }
    }
}
