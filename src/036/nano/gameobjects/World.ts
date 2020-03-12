import Scene from '../Scene';
import Container from './Container';
import { IContainerComponent } from '../components/ContainerComponent';
import Game from '../Game';
import IContainerChild from './IContainerChild';

export default class World extends Container
{
    renderList = [];

    constructor (scene: Scene)
    {
        super(scene);
    }

    private scanChildren (root: IContainerComponent)
    {
        const children = root.getChildren();

        for (let i: number = 0; i < children.length; i++)
        {
            this.buildRenderList(children[i]);
        }
    }

    private buildRenderList (root: IContainerChild)
    {
        const game: Game = this.scene.game;

        if (root.willRender())
        {
            this.renderList.push(root);

            if (root.dirtyFrame >= game.frame)
            {
                game.dirtyFrame++;
            }
        }

        if (root.isParent)
        {
            this.scanChildren(root as unknown as IContainerComponent);
        }
    }

    preRender ()
    {
        this.renderList = [];

        this.scanChildren(this);

        return this.renderList;
    }

    update (dt: number, now: number)
    {
        const children = this.children;

        for (let i: number = 0; i < children.length; i++)
        {
            children[i].update(dt, now);
        }
    }
}
