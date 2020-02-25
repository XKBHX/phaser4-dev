// import demo1 from './demo1'; // test single sprite
// import demo2 from './demo2'; // test multiple images with multiple sprites
import demo3 from './demo3'; // test sprite sheet loader and display

demo3();

//  Next steps:

//  * Texture Atlas Loader
//  * Encode color as a single float, rather than a vec4 and add back to the shader
//  * Multi Texture re-use old texture IDs when count > max supported
//  * Container class - Transform stack test (Quad with children, children of children, etc)
//  * Instead of a Quad class, try a class that can have any number of vertices in it (ala Rope), or any vertex moved

//  Done:

//  X Moved all code to WebGL Renderer and supporting classes
//  X Game class, single Scene, Loader, DOM Content Load handler, Texture Cache
//  X Encapsulate a Simple asset loader (images + json) and remove responsibility from the Texture class
//  X DOM Loaded handler + small boot = Game class
//  X Basic Scene class
//  X Tidy-up all of the classes, boil down into tiny WebGL1 + Sprite + Container + StaticContainer renderer package
//  X Update Merged Transform to cache rotation and scale
//  X Multi Textures round-robin, don't use glIndex
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
