export default function ()
{
    const size = 4;
    const singleVertexSize = 24;
    const max = 1000;

    const quads = [];

    const singleDataStore = new Float32Array(size * (max * singleVertexSize));
    const webglBuffer = new Float32Array(size * (max * singleVertexSize));

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

        singleDataStore[offset + 0] = x0;
        singleDataStore[offset + 1] = y0;
        singleDataStore[offset + 2] = r;
        singleDataStore[offset + 3] = g;
        singleDataStore[offset + 4] = b;
        singleDataStore[offset + 5] = 1;

        singleDataStore[offset + 6] = x0;
        singleDataStore[offset + 7] = y1;
        singleDataStore[offset + 8] = r;
        singleDataStore[offset + 9] = g;
        singleDataStore[offset + 10] = b;
        singleDataStore[offset + 11] = 1;

        singleDataStore[offset + 12] = x1;
        singleDataStore[offset + 13] = y1;
        singleDataStore[offset + 14] = r;
        singleDataStore[offset + 15] = g;
        singleDataStore[offset + 16] = b;
        singleDataStore[offset + 17] = 1;

        singleDataStore[offset + 18] = x1;
        singleDataStore[offset + 19] = y0;
        singleDataStore[offset + 20] = r;
        singleDataStore[offset + 21] = g;
        singleDataStore[offset + 22] = b;
        singleDataStore[offset + 23] = 1;

        quads.push(new Float32Array([
            x0, y0, r, g, b, 1, x0, y1, r, g, b, 1, x1, y1, r, g, b, 1, x1, y0, r, g, b, 1
        ]));

        offset += singleVertexSize;
    }

    //  Our array is now populated
    //  We'll simulate changing just the x/y values, not the colors

    //  Test 1 - single element index set - directly changing the webgl buffer

    offset = 0;

    for (let i = 0; i < max; i++)
    {
        //  Assume the quad is just moving, not changing color
        let x0 = Math.random() * 800;
        let y0 = Math.random() * 600;
        let x1 = x0 + 256;
        let y1 = y0 + 256;

        webglBuffer[offset + 0] = x0;
        webglBuffer[offset + 1] = y0;
        webglBuffer[offset + 6] = x0;
        webglBuffer[offset + 7] = y1;
        webglBuffer[offset + 12] = x1;
        webglBuffer[offset + 13] = y1;
        webglBuffer[offset + 18] = x1;
        webglBuffer[offset + 19] = y0;

        offset += singleVertexSize;
    }

    //  Test 2 - array set - this time we update every single individual quad arrays, then set it into the buffer.

    offset = 0;

    for (let i = 0; i < max; i++)
    {
        //  Assume the quad is just moving, not changing color
        let x0 = Math.random() * 800;
        let y0 = Math.random() * 600;
        let x1 = x0 + 256;
        let y1 = y0 + 256;

        let quadData = quads[i];

        quadData[0] = x0;
        quadData[1] = y0;
        quadData[6] = x0;
        quadData[7] = y1;
        quadData[12] = x1;
        quadData[13] = y1;
        quadData[18] = x1;
        quadData[19] = y0;

        webglBuffer.set(quadData, offset);

        offset += singleVertexSize;
    }

    //  Test 3 - array set - what if not all of the quads update? only some of them do?

    offset = 0;

    for (let i = 0; i < max; i++)
    {
        let quadData = quads[i];

        //  Only update every other quad
        if (i % 2)
        {
            //  Assume the quad is just moving, not changing color
            let x0 = Math.random() * 800;
            let y0 = Math.random() * 600;
            let x1 = x0 + 256;
            let y1 = y0 + 256;

            quadData[0] = x0;
            quadData[1] = y0;
            quadData[6] = x0;
            quadData[7] = y1;
            quadData[12] = x1;
            quadData[13] = y1;
            quadData[18] = x1;
            quadData[19] = y0;
        }

        //  But of course copy every quad over anyway, even non-changed ones
        webglBuffer.set(quadData, offset);

        offset += singleVertexSize;
    }

    //  Test 4 - single element index set - array set - what if not all of the quads update? only some of them do?

    offset = 0;

    for (let i = 0; i < max; i++)
    {
        let quadData = quads[i];

        //  Only update every other quad
        if (i % 2)
        {
            //  Assume the quad is just moving, not changing color
            let x0 = Math.random() * 800;
            let y0 = Math.random() * 600;
            let x1 = x0 + 256;
            let y1 = y0 + 256;

            quadData[0] = x0;
            quadData[1] = y0;
            quadData[6] = x0;
            quadData[7] = y1;
            quadData[12] = x1;
            quadData[13] = y1;
            quadData[18] = x1;
            quadData[19] = y0;
        }

        webglBuffer[offset + 0] = quadData[0];
        webglBuffer[offset + 1] = quadData[1];
        webglBuffer[offset + 6] = quadData[6];
        webglBuffer[offset + 7] = quadData[7];
        webglBuffer[offset + 12] = quadData[12];
        webglBuffer[offset + 13] = quadData[13];
        webglBuffer[offset + 18] = quadData[18];
        webglBuffer[offset + 19] = quadData[19];

        offset += singleVertexSize;
    }



}