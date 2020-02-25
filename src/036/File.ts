export default class File
{
    type: string;
    key: string;
    url: string;
    data: any;
    config: any;
    linkFile: File;

    loadHandler: Function;

    hasLoaded: boolean = false;

    constructor (type: string, key: string, url: string, loadHandler: Function, config?: any)
    {
        this.type = type;
        this.key = key;
        this.url = url;
        this.loadHandler = loadHandler;
        this.config = config;
    }
}