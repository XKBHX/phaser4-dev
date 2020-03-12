import uPlot from 'uplot';

export default class StatsGraphChartJS
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
    chart: uPlot;

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

        div.appendChild(title);

        this.bg = bg;
        this.fg = fg;

        this.div = div;
        this.title = title;

        this.name = name;

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

        let data = [
            [],
            []
        ];
    
        const opts = {
            width: width,
            height: 48,
            id: name,
            scales: {
                x: {
                    time: false
                }
            },
            cursor: {
                show: false
            },
            legend: {
                show: false,
            },
            axes: [
                {
                    show: false,
                },
                {
                    show: false,
                }
            ],
            series: [
                {},
                {
                    stroke: fg,
                    fill: '#b3e5fc'
                }
            ]
        };

        this.chart = new uPlot(opts, data, div);

        console.log(this.chart);
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

    update (value: number, maxValue: number, now: number)
    {
        this.min = Math.min(this.min, value);
        this.max = Math.max(this.max, value);

        const data = this.chart.data;

        const time = data[0];
        const values = data[1];

        time.push(now);
        values.push(value);

        if (time.length === 60 * 60)
        {
            time.shift();
            values.shift();
        }

        this.chart.setData(data);

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
