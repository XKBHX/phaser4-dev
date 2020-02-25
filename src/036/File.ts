import Loader from 'Loader';

export default class File
{
    key: string;
    url: string;
    data: any;

    loadHandler: Function;

    hasLoaded: boolean = false;

    constructor (key: string, url: string, loadHandler: Function)
    {
        this.key = key;
        this.url = url;
        this.loadHandler = loadHandler;
    }


}