export default function ()
{
    //  After testing all of the following approaches, it's clear that, by far, the fastest
    //  is simply to index write the data to the buffer webgl is using. Using `set` is just
    //  too slow.

    //  Even faster, of course, is not writing any data at all. So it may be worth a sprite
    //  retaining knowledge of two things: 1) It's previous offset in the webgl buffer and
    //  2) if it has changed anything (i.e. dirty transform, texture, etc) - if neither of
    //  these two things have changed, it can be skipped during the buffer population as the
    //  previous values are still good. This allows only those sprites that _are_ dirty to
    //  write themselves to the buffer again. Of course, if the display list changes (i.e.
    //  a sprite is removed from it, or inserted into it), then it invalidates everything
    //  else from that point on in the buffer.

    //  It's also worth adding that currently the gl buffer size is based on a batch limit
    //  of say 2000 quads, so if you hit that limit it's cleared and re-populated.
    //  This is to avoid pushing up too much data to the GPU in a single call.
    //  However, those two things don't have to be tied together. It's perfectly possible
    //  to have a truly massive buffer and STILL only batch data up to the GPU in blocks
    //  of 2k using bufferSubData
    //
    //  Our test quad is (24 * 4) = 96 bytes total. That's over 10,000 quads in just 1MB RAM.

    const size = 4;
    const singleVertexSize = 24;
    const batchSize = 2000;
    const max = batchSize * 10; // 20k quads in a single big array, 2k drawn per batch

    //  dataStore = room for 20k quads total + 2k buffer space (at the start) for the batch
    const dataStore = new ArrayBuffer((size * (max * singleVertexSize)) + (size * batchSize));

    const webglBuffer = new Float32Array(dataStore, 0, size * batchSize); // From 0 to 2k
    const quadBuffer = new Float32Array(dataStore, size * batchSize); // From 2k onwards

    //  Populate with some test data, we can use a normal array for this
    let offset = 0;

    for (let i = 0; i < max; i++)
    {
        //  Simulate some real-world 256 x 256 quad data

        let x0 = Math.random() * 800;
        let y0 = Math.random() * 600;
        let x1 = x0 + 256;
        let y1 = y0 + 256;

        let r = Math.random();
        let g = 1;
        let b = Math.random();

        quadBuffer[offset + 0] = x0;
        quadBuffer[offset + 1] = y0;
        quadBuffer[offset + 2] = r;
        quadBuffer[offset + 3] = g;
        quadBuffer[offset + 4] = b;
        quadBuffer[offset + 5] = 1;

        quadBuffer[offset + 6] = x0;
        quadBuffer[offset + 7] = y1;
        quadBuffer[offset + 8] = r;
        quadBuffer[offset + 9] = g;
        quadBuffer[offset + 10] = b;
        quadBuffer[offset + 11] = 1;

        quadBuffer[offset + 12] = x1;
        quadBuffer[offset + 13] = y1;
        quadBuffer[offset + 14] = r;
        quadBuffer[offset + 15] = g;
        quadBuffer[offset + 16] = b;
        quadBuffer[offset + 17] = 1;

        quadBuffer[offset + 18] = x1;
        quadBuffer[offset + 19] = y0;
        quadBuffer[offset + 20] = r;
        quadBuffer[offset + 21] = g;
        quadBuffer[offset + 22] = b;
        quadBuffer[offset + 23] = 1;

        offset += singleVertexSize;
    }

    //  Our array is now populated
    //  We'll simulate changing just the x/y values, not the colors

    //  Test 1 - array set - this time we update every single individual quad arrays, then set it into the buffer.

    offset = 0;
    let current = 0;

    for (let i = 0; i < max; i++)
    {
        //  Assume the quad is just moving, not changing color
        let x0 = Math.random() * 800;
        let y0 = Math.random() * 600;
        let x1 = x0 + 256;
        let y1 = y0 + 256;

        quadBuffer[offset + 0] = x0;
        quadBuffer[offset + 1] = y0;
        quadBuffer[offset + 6] = x0;
        quadBuffer[offset + 7] = y1;
        quadBuffer[offset + 12] = x1;
        quadBuffer[offset + 13] = y1;
        quadBuffer[offset + 18] = x1;
        quadBuffer[offset + 19] = y0;
        
        if (current === batchSize)
        {
            webglBuffer.set(quadBuffer);
            current = 0;
        }
        else
        {
            current++;
        }

        offset += singleVertexSize;
    }

}