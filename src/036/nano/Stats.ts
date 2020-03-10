import Game from './Game';
import AddToDOM from './AddToDOM';
import WebGLRenderer from './WebGLRenderer';
import StatsGraph from './StatsGraph';
import StatsTree from './StatsTree';

export default class Stats
{
    game: Game;
    renderer: WebGLRenderer;
    parent: HTMLDivElement;

    width: number = 0;

    beginTime: number = 0;
    prevTime: number = 0;
    prevTime500: number = 0;
    frames: number = 0;

    buttons: HTMLDivElement;

    fpsPanel: StatsGraph;
    renderPanel: StatsGraph;
    cachePanel: StatsGraph;
    displayTreePanel: StatsTree;

    totalDirtyRenders: number = 0;
    totalCachedRenders: number = 0;

    constructor (game: Game, align: string = 'top')
    {
        this.game = game;
        this.renderer = game.renderer;

        const bounds = game.renderer.canvas.getBoundingClientRect();

        const div = document.createElement('div');

        div.style.width = `${bounds.width}px`;
        div.style.height = '64px';
        div.style.display = 'flex';
        div.style.position = 'absolute';
        div.style.zIndex = '10000';

        div.style.left = `${bounds.left}px`;

        if (align === 'top')
        {
            div.style.top = `${bounds.top}px`;
        }
        else if (align === 'bottom')
        {
            div.style.top = (bounds.bottom - 64) + 'px';
        }
        else if (align === 'base')
        {
            div.style.top = `${bounds.bottom}px`;
        }

        this.width = bounds.width;

        this.fpsPanel = new StatsGraph('FPS', '#0ff', '#002', this.width);
        this.renderPanel = new StatsGraph('Cached Frames', '#0f0', '#020', this.width);
        this.cachePanel = new StatsGraph('Cached Sprites', '#f08', '#201', this.width);
        this.displayTreePanel = new StatsTree(this);

        this.renderPanel.percentage = true;
        this.cachePanel.percentage = true;

        this.buttons = this.createButtons();

        div.appendChild(this.buttons);
        div.appendChild(this.fpsPanel.div);
        div.appendChild(this.renderPanel.div);
        div.appendChild(this.cachePanel.div);

        AddToDOM(div);
        AddToDOM(this.displayTreePanel.div);

        this.parent = div;

        game.on('step', () => {
            this.begin();
        });

        game.on('render', () => {
            this.end();
        });
    }

    createButtons (): HTMLDivElement
    {
        const div = document.createElement('div');

        div.style.width = '64px';
        div.style.height = '64px';
        div.style.position = 'relative';
        div.style.cursor = 'pointer';
        div.style.flexShrink = '0';

        const playButton = document.createElement('button');

        playButton.style.width = '64px';
        playButton.style.height = '32px';
        playButton.style.cursor = 'pointer';
        playButton.innerText = '⏸️';

        div.appendChild(playButton);

        playButton.addEventListener('click', () => {

            if (this.game.isPaused)
            {
                this.game.resume();
                playButton.innerText = '⏸️';
            }
            else
            {
                this.game.pause();
                playButton.innerText = '▶️';
            }

        });

        const debugButton = document.createElement('button');

        debugButton.style.width = '64px';
        debugButton.style.height = '32px';
        debugButton.style.cursor = 'pointer';
        debugButton.innerText = 'debug';

        div.appendChild(debugButton);

        debugButton.addEventListener('click', () => {

            this.toggleDebugPanel();

        });

        return div;
    }

    toggleDebugPanel ()
    {
        if (this.displayTreePanel.visible)
        {
            this.displayTreePanel.hide();
        }
        else
        {
            this.displayTreePanel.show();
        }
    }

    begin ()
    {
        this.beginTime = performance.now();
    }

    end (): number
    {
        this.frames++;

        const time = performance.now();

        if (this.game.dirtyFrame === 0)
        {
            this.totalCachedRenders++;
        }
        else
        {
            this.totalDirtyRenders++;
        }

        //  Compute the new exponential moving average with an alpha of 0.25.
        // this.actualFps = 0.25 * this.framesThisSecond + 0.75 * this.actualFps;

        if (time >= this.prevTime500 + 500)
        {
            const total = this.game.totalFrame;
            const dirty = this.game.dirtyFrame;
            const cached = total - dirty;

            if (cached + dirty === 0)
            {
                this.cachePanel.update(100, 100);
            }
            else
            {
                this.cachePanel.update((cached / (cached + dirty)) * 100, 100);
            }

            const cacheUse: number = this.totalCachedRenders / (this.totalCachedRenders + this.totalDirtyRenders);

            this.renderPanel.update(cacheUse * 100, 100);

            this.prevTime500 = time;

            this.totalDirtyRenders = 0;
            this.totalCachedRenders = 0;
        }

        if (time >= this.prevTime + 1000)
        {
            this.fpsPanel.update((this.frames * 1000) / (time - this.prevTime), 100);

            this.prevTime = time;
            this.frames = 0;
        }

        return time;
    }

}