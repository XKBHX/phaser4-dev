import Game from './Game';
import AddToDOM from './AddToDOM';
import WebGLRenderer from './WebGLRenderer';

class StatsPanel
{
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;

    name: string;
    percentage: boolean = false;

    min: number = Number.POSITIVE_INFINITY;
    max: number = 0;
    pr: number = 1;

    bg: string;
    fg: string;

    width: number;
    height: number;

    textX: number;
    textY: number;

    graphX: number;
    graphY: number;

    graphWidth: number;
    graphHeight: number;

    constructor (name: string, fg: string, bg: string, width: number)
    {
        const pr = Math.round(window.devicePixelRatio || 1);

        const canvas = document.createElement('canvas');

        canvas.id = name;
        canvas.width = width;
        canvas.height = 48 * pr;
        canvas.style.cssText = `width: ${width}px; height: 48px; display: inline`;

        this.width = pr * width;
        this.height = pr * 48;
        this.textX = pr * 3;
        this.textY = pr * 2;
        this.graphX = pr * 3;
        this.graphY = pr * 15;
        this.graphWidth = pr * (width - 6);
        this.graphHeight = pr * 30;

        const context = canvas.getContext('2d');

        context.font = 'bold ' + (12 * this.pr) + 'px Consolas, Courier, typewriter';
        context.textBaseline = 'top';

        context.fillStyle = bg;
        context.fillRect(0, 0, this.width, this.height);
    
        context.fillStyle = fg;
        context.fillText(name, this.textX, this.textY);
        context.fillRect(this.graphX, this.graphY, this.graphWidth, this.graphHeight);
    
        context.fillStyle = bg;
        context.globalAlpha = 0.9;
        context.fillRect(this.graphX, this.graphY, this.graphWidth, this.graphHeight);

        this.bg = bg;
        this.fg = fg;

        this.name = name;
        this.canvas = canvas;
        this.context = context;
    }

    update (value: number, maxValue: number)
    {
        this.min = Math.min(this.min, value);
        this.max = Math.max(this.max, value);

        const context = this.context;
        const pr = this.pr;
        const bg = this.bg;

        context.fillStyle = bg;
        context.globalAlpha = 1;
        context.fillRect(0, 0, this.width, this.graphY);

        context.fillStyle = this.fg;

        let displayValue: string = Math.round(value).toString();

        if (this.percentage)
        {
            displayValue = displayValue.padStart(3, ' ');

            context.fillText(this.name + ' ' + displayValue + '%', this.textX, this.textY);
        }
        else
        {
            context.fillText(displayValue + ' ' + this.name + ' (' + Math.round(this.min) + '-' + Math.round(this.max) + ')', this.textX, this.textY);
        }

        const graphX = this.graphX;
        const graphY = this.graphY;
        const graphWidth = this.graphWidth;
        const graphHeight = this.graphHeight;

        context.drawImage(this.canvas, graphX + pr, graphY, graphWidth - pr, graphHeight, graphX, graphY, graphWidth - pr, graphHeight);

        context.fillRect(graphX + graphWidth - pr, graphY, pr, graphHeight);

        context.fillStyle = bg;
        context.globalAlpha = 0.9;
        context.fillRect(graphX + graphWidth - pr, graphY, pr, Math.round((1 - (value / maxValue)) * graphHeight));
    }
}

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

    fpsPanel: StatsPanel;
    renderPanel: StatsPanel;
    cachePanel: StatsPanel;

    totalDirtyRenders: number = 0;
    totalCachedRenders: number = 0;

    constructor (game: Game)
    {
        this.game = game;
        this.renderer = game.renderer;

        this.parent = document.createElement('div');

        const bounds = game.renderer.canvas.getBoundingClientRect();

        this.width = bounds.width;

        this.parent.style.cssText = `position: fixed; top: ${bounds.bottom}px; left: 0; cursor: pointer; opacity: 1.0; z-index: 10000`;

        this.fpsPanel = new StatsPanel('FPS', '#0ff', '#002', this.width / 3);
        this.renderPanel = new StatsPanel('Cached Frames', '#0f0', '#020', this.width / 3);
        this.cachePanel = new StatsPanel('Cached Sprites', '#f08', '#201', this.width / 3);

        this.renderPanel.percentage = true;
        this.cachePanel.percentage = true;

        this.parent.appendChild(this.fpsPanel.canvas);
        this.parent.appendChild(this.renderPanel.canvas);
        this.parent.appendChild(this.cachePanel.canvas);

        AddToDOM(this.parent);

        game.on('step', () => {
            this.begin();
        });

        game.on('render', () => {
            this.end();
        });
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

            this.cachePanel.update(100, 100);
        }
        else
        {
            this.totalDirtyRenders++;

            const cached = this.renderer.cachedSprites;
            const dirty = this.renderer.dirtySprites;

            this.cachePanel.update((cached / (cached + dirty)) * 100, 100);
        }

        if (time >= this.prevTime500 + 500)
        {
            const cacheUse: number = this.totalCachedRenders / (this.totalCachedRenders + this.totalDirtyRenders);

            this.renderPanel.update(cacheUse * 100, 100);

            this.prevTime500 = time;

            this.totalDirtyRenders = 0;
            this.totalCachedRenders = 0;
        }

        if (time >= this.prevTime + 1000)
        {
            this.fpsPanel.update((this.frames * 1000) / (time - this.prevTime), 100);

            // const cacheUse: number = this.totalCachedRenders / (this.totalCachedRenders + this.totalDirtyRenders);

            // this.renderPanel.update(cacheUse * 100, 100);

            this.prevTime = time;
            this.frames = 0;

            // this.totalDirtyRenders = 0;
            // this.totalCachedRenders = 0;
        }

        return time;
    }

}