import Stats from './Stats';
import Game from '../Game';
import Container from '../gameobjects/Container';
import Sprite from '../gameobjects/Sprite';

const TreeCSS = `
.treeContainer {
    background: white;
    font: normal normal 13px/1.4 Segoe,"Segoe UI",Calibri,Helmet,FreeSans,Sans-Serif;
    padding: 50px;
    position: absolute;
    display: none;
    left: 0;
    top: 0;
  }
  
.tree,
.tree ul {
  margin:0 0 0 1em; /* indentation */
  padding:0;
  list-style:none;
  color:#369;
  position:relative;
}

.tree ul {margin-left:.5em} /* (indentation/2) */

.tree:before,
.tree ul:before {
  content:"";
  display:block;
  width:0;
  position:absolute;
  top:0;
  bottom:0;
  left:0;
  border-left:1px solid;
}

.tree li {
  margin:0;
  padding:0 1.5em; /* indentation + .5em */
  line-height:2em; /* default list item's line-height */
  font-weight:bold;
  position:relative;
}

.tree li:before {
  content:"";
  display:block;
  width:10px; /* same with indentation */
  height:0;
  border-top:1px solid;
  margin-top:-1px; /* border top width */
  position:absolute;
  top:1em; /* (line-height/2) */
  left:0;
}

.tree li:last-child:before {
  background:white; /* same with body background */
  height:auto;
  top:1em; /* (line-height/2) */
  bottom:0;
}
`;

export default class StatsTree
{
    stats: Stats;
    game: Game;

    div: HTMLDivElement;
    root: HTMLUListElement;

    visible: boolean = false;

    constructor (stats: Stats)
    {
        this.stats = stats;
        this.game = stats.game;

        const style = document.createElement('style');

        style.type = 'text/css';
        style.innerHTML = TreeCSS;

        document.body.appendChild(style);

        const div = document.createElement('div');

        div.style.display = 'none;'
        div.className = 'treeContainer';

        const title = document.createElement('p');

        title.innerText = 'World';

        div.appendChild(title);

        const root = document.createElement('ul');

        root.className = 'tree';

        div.appendChild(root);

        this.div = div;
        this.root = root;
    }

    buildList (parent: HTMLUListElement, root: Container)
    {
        for (let i: number = 0; i < root.size; i++)
        {
            let entity = root.children[i];

            // let id: string = `#${i} - ${entity.type}`;

            let texture = '';

            if (entity.hasTexture)
            {
                let textureKey = (entity as Sprite).texture.key;
                let frameKey = (entity as Sprite).frame.key;

                if (frameKey === '__BASE')
                {
                    texture = textureKey;
                }
                else
                {
                    texture = textureKey + ' - ' + frameKey;
                }
            }

            let id: string = `${entity.type} (${texture})`;

            let li = document.createElement('li');

            li.innerText = id;

            parent.appendChild(li);

            if (entity.size > 0)
            {
                let ul = document.createElement('ul');

                li.appendChild(ul);

                this.buildList(ul, entity as Container);
            }
        }
    }

    show ()
    {
        this.game.pause();

        const root = this.root;

        const world = this.game.scene.world;

        this.buildList(root, world);

        this.visible = true;

        this.div.style.display = 'block';
    }

    hide ()
    {
        //  Nuke all current children
        const root = this.root;

        while(root.firstChild)
        {
            root.removeChild(root.firstChild);
        }

        this.game.resume();

        this.visible = false;

        this.div.style.display = 'none';
    }
}
