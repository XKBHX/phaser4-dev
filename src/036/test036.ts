// import demo1 from './demo1'; // test single sprite
// import demo2 from './demo2'; // test multiple images with multiple sprites
// import demo3 from './demo3'; // test sprite sheet loader and display
// import demo4 from './demo4'; // sprite tint + alpha back in the shader
// import demo5 from './demo5'; // test skew
// import demo6 from './demo6'; // test container children
// import demo7 from './demo7'; // Camera class (position, scale, rotation)
// import demo8 from './demo8'; // Event Emitter
// import demo9 from './demo9'; // Ease function
// import demo10 from './demo10'; // Sprite Buffer
// import demo11 from './demo11'; // Keyboard
// import demo12 from './demo12'; // Texture Atlas Loader (array + hash + tp3 + trimmed)
// import demo13 from './demo13'; // Cache test
// import demo14 from './demo14'; // TextureManager.addColor
// import demo15 from './demo15'; // Animated Sprite via Texture Atlas
// import demo16 from './demo16'; // Animated Sprite - start delay
// import demo17 from './demo17'; // Animated Sprite - repeat delay
// import demo18 from './demo18'; // Animated Sprite - onComplete callback
// import demo19 from './demo19'; // Mouse Input
// import demo20 from './demo20'; // Mouse Input - Hit Test
// import demo21 from './demo21'; // Mouse Input - Hit Test with a translated Camera
// import demo22 from './demo22'; // Mouse Input - Hit Test container children
// import demo23 from './demo23'; // Mouse Input - Hit Test local point
// import demo24 from './demo24'; // Mouse Input - Drag Sprite
// import demo25 from './demo25'; // Mouse Input - Circle hit area
// import demo26 from './demo26'; // Mouse Input - Ellipse hit area
// import demo27 from './demo27'; // Mouse Input - Rectangle hit area
// import demo28 from './demo28'; // Mouse Input - Polygon hit area
// import demo29 from './demo29'; // Rotating items
// import demo30 from './demo30'; // PNG import via Rollup images plugin
import demo31 from './demo31'; // Loader using a base64 png

demo31();

//  Next steps:

//  * Camera moving needs to dirty the renderer
//  * Base64 Loader Test
//  * Load json / csv / xml on their own
//  * Camera tint + alpha (as shader uniform)
//  * Camera background color (instead of renderer bgc)
//  * Multi Texture re-use old texture IDs when count > max supported
//  * Single Texture shader
//  * Tile Layer
//  * Instead of a Quad class, try a class that can have any number of vertices in it (ala Rope), or any vertex moved

//  Done:

//  X Input point translation
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
