import { createPlugin } from 'lighty';

export default createPlugin('bind-node', function bindNode() {
  return function transform(component, node) {
    component.node = node;
  };
});
