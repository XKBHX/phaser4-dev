import ApplyMixins from './ApplyMixins';
import BaseDisplayObject from './BaseDisplayObject';

import Wibble from './components/Wibble';
import Wobble from './components/Wobble';

export default ApplyMixins(BaseDisplayObject, [
    Wibble,
    Wobble
]);
