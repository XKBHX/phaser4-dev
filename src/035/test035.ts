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
import part15 from './part15';
import part16 from './part16';
import part17 from './part17';
import part18 from './part18';
import part19 from './part19';
import part20 from './part20'; // Multi-Texture Assigned at run-time, not hard coded into render
import bunnymark from './bunnymark';
import bunnymarkNoColor from './bunnymark-nocolor';
import bunnymarkNoColorMerged from './bunnymark-nocolor-merged';
import bunnymarkSingleTexture from './bunnymark-single-texture';
import part21 from './part21'; // static sprite test
import part22 from './part22'; // subData test into a static buffer
import part23 from './part23'; // Camera matrix
import part24 from './part24'; // Texture Frame
import part25 from './part25'; // Single quad + single custom shader
import part26 from './part26'; // Update Merged Transform to cache rotation and scale

window.onload = () => {

    // part25();
    // bunnymark();
    // bunnymarkNoColor();
    bunnymarkSingleTexture();
    // bunnymarkNoColorMerged();

};

//  Next steps:

//  * Encode color as a single float, rather than a vec4
//  * Update Merged Transform to cache rotation and scale
//  * Multi Textures round-robin, don't use glIndex
//  * Container class - Transform stack test (Quad with children, children of children, etc)
//  * Instead of a Quad class, try a class that can have any number of vertices in it (ala Rope), or any vertex moved
//  * Tidy-up all of the classes, boil down into tiny WebGL1 + Sprite + Container + StaticContainer renderer package

//  Done:

//  X Texture Frames (UV) support
//  X Camera matrix, added to the shader (projection * camera * vertex pos), so we can move the camera around, rotate it, etc.
//  X Static buffer but use bufferSubData to update just a small part of it (i.e. a single moving quad in a static buffer)
//  X Static test using sprites
//  X Bunny mark (because, why not?)
//  X Multi Textures assigned at run-time up to max
//  X Multi-texture support
//  X Sub-data buffer with batch flush, like current renderer handles it
//  X Add a basic display list, so the buffer is cleared each frame and populated via the list
//  X Try adding all quads to a single huge buffer on creation (remove on destruction), then in the render loop
//    copy chunks from this buffer to the gl buffer - depends how fast typed array copies are vs. pushing elements by index
