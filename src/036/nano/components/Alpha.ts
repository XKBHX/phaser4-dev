export default class Alpha {

    protected _alpha: number = 1;

    setAlpha (alpha: number = 1)
    {
        if (alpha !== this._alpha)
        {
            this._alpha = alpha;

            // this.dirtyFrame = this.scene.game.frame;
        }

        return this;
    }

    get alpha (): number
    {
        return this._alpha;
    }

    set alpha (value: number)
    {
        if (value !== this._alpha)
        {
            this._alpha = value;

            // this.dirtyFrame = this.scene.game.frame;
        }
    }

}
