export default class StatsGraph
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

    constructor (name: string, fg: string, bg: string, width: number)
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
            for (let x: number = 0; x < overlay.width / 64; x++)
            {
                overlayContext.strokeRect(x * 64, y * 32, 64, 32);
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
