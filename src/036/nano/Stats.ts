import Game from './Game';
import AddToDOM from './AddToDOM';
import WebGLRenderer from './WebGLRenderer';
import StatsGraph from './StatsGraph';
import StatsTree from './StatsTree';
import StatsGraphChartJS from './StatsGraphChartJS';

const uPlotCSS = `
.uplot,
.uplot *,
.uplot *::before,
.uplot *::after {
	box-sizing: border-box;
}

.uplot {
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
	line-height: 1.5;
	width: max-content;
}

.uplot .title {
	text-align: center;
	font-size: 18px;
	font-weight: bold;
}

.uplot .wrap {
	position: relative;
	user-select: none;
}

.uplot .over,
.uplot .under {
	position: absolute;
	overflow: hidden;
}

.uplot canvas {
	display: block;
	position: relative;
	width: 100%;
	height: 100%;
}

.uplot .legend {
	font-size: 14px;
	margin: auto;
	text-align: center;
}

.uplot .legend.inline {
	display: block;
}

.uplot .legend.inline * {
	display: inline-block;
}

.uplot .legend.inline tr {
	margin-right: 16px;
}

.uplot .legend th {
	font-weight: 600;
}

.uplot .legend th > * {
	vertical-align: middle;
	display: inline-block;
}

.uplot .legend .ident {
	width: 1em;
	height: 1em;
	margin-right: 4px;
	border: 2px solid transparent;
}

.uplot .legend.inline th::after {
	content: ":";
	vertical-align: middle;
}

.uplot .legend .series > * {
	padding: 4px;
}

.uplot .legend .series th {
	cursor: pointer;
}

.uplot .legend .off > * {
	opacity: 0.3;
}

.uplot .select {
	background: rgba(0,0,0,0.07);
	position: absolute;
	pointer-events: none;
}

.uplot .select.off {
	display: none;
}

.uplot .cursor-x,
.uplot .cursor-y {
	position: absolute;
	left: 0;
	top: 0;
	pointer-events: none;
	will-change: transform;
	z-index: 100;
}

.uplot .cursor-x {
	height: 100%;
	border-right: 1px dashed #607D8B;
}

.uplot .cursor-y {
	width: 100%;
	border-bottom: 1px dashed #607D8B;
}

.uplot .cursor-pt {
	position: absolute;
	top: 0;
	left: 0;
	border-radius: 50%;
	filter: brightness(85%);
	pointer-events: none;
	will-change: transform;
	z-index: 100;
}
`;

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

    fpsPanel: StatsGraphChartJS;
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

        const style = document.createElement('style');

        style.type = 'text/css';
        style.innerHTML = uPlotCSS;

        document.body.appendChild(style);

        this.fpsPanel = new StatsGraphChartJS('FPS', '#0ff', '#002', this.width);
        this.renderPanel = new StatsGraph('Cached Frames', '#0f0', '#020', this.width);
        this.cachePanel = new StatsGraph('Cached Sprites', '#f08', '#201', this.width);
        this.displayTreePanel = new StatsTree(this);

        this.renderPanel.percentage = true;
        this.cachePanel.percentage = true;

        this.buttons = this.createButtons();

        div.appendChild(this.buttons);
        div.appendChild(this.fpsPanel.div);
        // div.appendChild(this.renderPanel.div);
        // div.appendChild(this.cachePanel.div);

        AddToDOM(div);
        AddToDOM(this.displayTreePanel.div);

        this.parent = div;

        game.on('step', () => {
            this.begin();
        });

        game.on('render', (delta, now) => {
            this.end(delta, now);
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

    end (delta: number, time: number): number
    {
        this.frames++;

        // const time = performance.now();

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

        this.fpsPanel.update(delta * 1000, 100, time);

        this.prevTime = time;

        /*
        if (time >= this.prevTime + 1000)
        {
            this.fpsPanel.update((this.frames * 1000) / (time - this.prevTime), 100, now);

            this.prevTime = time;
            this.frames = 0;
        }
        */

        return time;
    }

}