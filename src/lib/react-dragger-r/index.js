// var Draggable = require('./release/Dragger').default;
import Draggable from './release/Dragger';

// Previous versions of this lib exported <Draggable> as the root export. As to not break
// them, or TypeScript, we export *both* as the root and as 'default'.
// See https://github.com/mzabriskie/react-draggable/pull/254
// and https://github.com/mzabriskie/react-draggable/issues/266
// module.exports = Draggable;
export default Draggable;