import part01 from './part01';
import part02 from './part02';
import part03 from './part03';
import part04 from './part04';
import part05 from './part05';
import part06 from './part06';
import part07 from './part07';
import part08 from './part08';
import part09 from './part09';
import part10 from './part10';
import part11 from './part11';
import part12 from './part12';
import part13 from './part13';
import part14 from './part14';

// part10();
part14();

//  Next steps:

//  * Camera matrix, added to the shader (projection * camera * vertex pos), so we can move the camera around, rotate it, etc.
//  * Sub-data buffer with batch flush, like current renderer handles it
//  * Transform stack test (Quad with children, children of children, etc)
//  * Instead of a Quad class, try a class that can have any number of vertices in it (ala Rope), or any vertex moved

//  * Add a basic display list, so the buffer is cleared each frame and populated via the list
//  X Try adding all quads to a single huge buffer on creation (remove on destruction), then in the render loop
//    copy chunks from this buffer to the gl buffer - depends how fast typed array copies are vs. pushing elements by index
