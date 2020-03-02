// import demo1 from './demo1'; // test single sprite
// import demo2 from './demo2'; // test multiple images with multiple sprites
// import demo3 from './demo3'; // test sprite sheet loader and display
// import demo4 from './demo4'; // sprite tint + alpha back in the shader
// import demo5 from './demo5'; // test skew
import demo6 from './demo6'; // test container children
import demo7 from './demo7'; // Camera class (position, scale, rotation)
import demo8 from './demo8'; // Event Emitter
import demo9 from './demo9'; // Ease function
import demo10 from './demo10'; // Sprite Buffer
import demo11 from './demo11'; // Keyboard
import demo12 from './demo12'; // Texture Atlas Loader (array + hash + tp3 + trimmed)

// demo6();
// demo7();
// demo8();
// demo9();
demo10();
// demo11();
// demo12();

//  Next steps:

//  * Camera alpha
//  * Camera background color
//  * Camera stencil?
//  * Camera bounds / cull
//  * Camera ignore | ignore except
//  * Camera scroll factor (?)
//  * Cache world values?
//  * Multi Texture re-use old texture IDs when count > max supported
//  * Single Texture shader
//  * Tile Layer
//  * Input point translation
//  * Instead of a Quad class, try a class that can have any number of vertices in it (ala Rope), or any vertex moved

//  Done:

//  X Static Batch shader (Sprite Buffer)
//  X Texture Atlas Loader
//  X Don't defer updateTransform - do immediately
//  X Context lost handler
//  X Renderer resize handler
//  X Renderer resolution
//  X Camera class (position, scale, rotation, alpha)
//  X Container class - Transform stack test (Sprite with children, children of children, etc)
//  X Encode color as a single float, rather than a vec4 and add back to the shader
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
