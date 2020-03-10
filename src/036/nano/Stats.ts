import Game from './Game';
import AddToDOM from './AddToDOM';
import WebGLRenderer from './WebGLRenderer';

class StatsPanel
{
    div: HTMLDivElement;
    title: HTMLParagraphElement;

    graph: HTMLCanvasElement;
    graphContext: CanvasRenderingContext2D;

    overlay: HTMLCanvasElement;
    overlayContext: CanvasRenderingContext2D;

    name: string;
    percentage: boolean = false;
    expanded: boolean = false;

    min: number = Number.POSITIVE_INFINITY;
    max: number = 0;

    pr: number = 1;

    bg: string;
    fg: string;

    constructor (name: string, fg: string, bg: string, width: number, shift: number = 0)
    {
        const pr = Math.round(window.devicePixelRatio || 1);

        this.pr = pr;
        
        const div = document.createElement('div');

        div.style.width = '40%';
        div.style.height = '64px';
        div.style.backgroundColor = '#222035';
        div.style.overflow = 'hidden';
        div.style.position = 'relative';
        div.style.cursor = 'pointer';

        const title = document.createElement('p');

        title.style.padding = '0';
        title.style.margin = '0';
        title.style.color = fg;
        title.style.fontWeight = 'bold';
        title.style.fontFamily = "Consolas, 'Courier New', Courier, monospace";
        title.style.fontSize = '12px';
        title.innerText = name;

        const graph = document.createElement('canvas');

        graph.width = width * pr;
        graph.height = 48 * pr;

        graph.style.width = `${width}px`;
        graph.style.height = '48px';
        graph.style.position = 'absolute';
        graph.style.top = '16px';
        graph.style.right = '0';

        const overlay = document.createElement('canvas');

        overlay.width = width * pr;
        overlay.height = 48 * pr;

        overlay.style.width = `${width}px`;
        overlay.style.height = '48px';
        overlay.style.position = 'absolute';
        overlay.style.top = '16px';

        div.appendChild(title);
        div.appendChild(graph);
        div.appendChild(overlay);

        this.bg = bg;
        this.fg = fg;

        this.div = div;
        this.title = title;

        this.name = name;

        this.graph = graph;
        this.graphContext = graph.getContext('2d');

        this.overlay = overlay;
        this.overlayContext = overlay.getContext('2d');

        this.drawGrid();

        div.addEventListener('click', () => {

            if (this.expanded)
            {
                this.collapse();
            }
            else
            {
                this.expand();
            }

        });
    }

    collapse ()
    {
        this.div.style.width = '40%';

        this.expanded = false;
    }

    expand ()
    {
        this.div.style.width = '100%';

        this.expanded = true;
    }

    drawGrid ()
    {
        const overlay = this.overlay;
        const overlayContext = this.overlayContext;

        overlayContext.clearRect(0, 0, overlay.width, overlay.height);

        overlayContext.strokeStyle = '#6a6a6a';
        overlayContext.globalAlpha = 0.3;
        overlayContext.lineWidth = this.pr;

        for (let y: number = 0; y < overlay.height / 32; y++)
        {
            for (let x: number = 0; x < overlay.width / 32; x++)
            {
                overlayContext.strokeRect(x * 32, y * 32, 32, 32);
            }
        }
    }

    update (value: number, maxValue: number)
    {
        this.min = Math.min(this.min, value);
        this.max = Math.max(this.max, value);

        const pr = this.pr;

        const graph = this.graph;
        const graphContext = this.graphContext;

        const pointX = graph.width - pr;
        const pointY = (value / maxValue) * graph.height;

        graphContext.drawImage(graph, pr, 0, pointX, graph.height, 0, 0, pointX, graph.height);

        //  Clear what was at the right of the graph by filling with bg color
        graphContext.fillStyle = '#222035';
        graphContext.globalAlpha = 1;
        graphContext.fillRect(pointX, 0, pr, graph.height);

        //  Refresh
        graphContext.fillStyle = this.fg;
        graphContext.globalAlpha = 0.4;
        graphContext.fillRect(pointX, graph.height - pointY, pr, pointY);

        graphContext.globalAlpha = 1;
        graphContext.fillRect(pointX, graph.height - pointY, pr, pr);

        //  Title
        const title = this.title;

        let displayValue: string = Math.round(value).toString();

        if (this.percentage)
        {
            displayValue = displayValue.padStart(3, ' ');

            title.innerText = this.name + ' ' + displayValue + '%';
        }
        else
        {
            title.innerText = displayValue + ' ' + this.name + ' (' + Math.round(this.min) + '-' + Math.round(this.max) + ')';
        }
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
    playToggle: HTMLButtonElement;

    constructor (game: Game, align: string = 'top')
    {
        this.game = game;
        this.renderer = game.renderer;

        const bounds = game.renderer.canvas.getBoundingClientRect();

        console.log(bounds);

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

        this.fpsPanel = new StatsPanel('FPS', '#0ff', '#002', this.width);
        this.renderPanel = new StatsPanel('Cached Frames', '#0f0', '#020', this.width);
        this.cachePanel = new StatsPanel('Cached Sprites', '#f08', '#201', this.width);

        this.renderPanel.percentage = true;
        this.cachePanel.percentage = true;

        this.playToggle = this.createButtons();

        div.appendChild(this.playToggle);
        div.appendChild(this.fpsPanel.div);
        div.appendChild(this.renderPanel.div);
        div.appendChild(this.cachePanel.div);

        AddToDOM(div);

        this.parent = div;

        game.on('step', () => {
            this.begin();
        });

        game.on('render', () => {
            this.end();
        });
    }

    createButtons ()
    {
        const div = document.createElement('button');

        div.style.width = '64px';
        div.style.height = '64px';
        div.style.position = 'relative';
        div.style.cursor = 'pointer';
        div.innerText = 'pause';
        div.style.flexShrink = '0';

        div.addEventListener('click', () => {

            if (this.game.isPaused)
            {
                this.game.resume();
                div.innerText = 'pause';
            }
            else
            {
                this.game.pause();
                div.innerText = 'play';
            }

        });

        return div;
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

        if (time >= this.prevTime500 + 120)
        {
            if (this.game.dirtyFrame === 0)
            {
                this.cachePanel.update(100, 100);
            }
            else
            {
                const cached = this.renderer.cachedSprites;
                const dirty = this.renderer.dirtySprites;
    
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